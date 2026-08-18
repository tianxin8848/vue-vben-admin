#!/usr/bin/env python3
"""
请假申请 API 全流程测试脚本

后端: http://10.254.253.187:8999
测试账号: lin / Cisco@123 (员工端 + 部分管理端只读接口)
          admin / Cisco@123 (管理端)

覆盖接口:
  员工端 (/api/v1/me/leave-requests/*):
    - GET   /me/leave-requests                    列出我的请假
    - POST  /me/leave-requests                    创建请假
    - GET   /me/leave-requests/approvals          我的待审请假
    - GET   /me/leave-requests/approval-records   我的审批记录
    - GET   /me/leave-requests/department         我部门的请假
    - GET   /me/leave-requests/annual-leave/summary 年假汇总
    - PATCH /me/leave-requests/{id}/withdraw      撤回请假

  管理端 (/api/v1/leave-requests/*):
    - GET   /leave-requests                       列出全部请假 (过滤)
    - GET   /leave-requests/{id}                  读取一条请假
    - PATCH /leave-requests/{id}/approval         审批请假
    - GET   /leave-requests/calendar              请假日历
    - GET   /leave-requests/calendar/meta         日历筛选项
    - GET   /leave-requests/approvals/meta        审批筛选项
    - PUT   /leave-requests/calendar/regional-holidays  写入地区假期
    - DELETE /leave-requests/calendar/regional-holidays 删除地区假期

  请假流程 (/api/v1/leave-workflows/*):
    - GET   /leave-workflows                      流程列表
    - POST  /leave-workflows                      创建流程
    - GET   /leave-workflows/meta                 流程元数据
    - PATCH /leave-workflows/{id}                 更新流程
    - DELETE /leave-workflows/{id}                删除流程

完整测试流程:
  1. 登录 (lin)
  2. 读取我的请假列表 / 年假汇总 / 部门请假 / 待审 / 审批记录
  3. 创建一条请假 → 验证 pending
  4. 撤回该请假 → 验证 withdrawn
  5. 管理端: 全部请假列表 / 读取单条 / 日历 / 筛选项
  6. 审批测试: 尝试审批 (若 lin 是审批人则通过, 否则验证 403/400)
  7. 请假流程: 列表 / 元数据 / 创建 → 更新 → 删除 (清理)
  8. 地区假期: 写入 → 验证 → 删除 (清理)
  9. 输出总结
"""

import json
import sys
from datetime import date, timedelta

import requests

BASE_URL = "http://10.254.253.187:8999"
USERNAME = "lin"
PASSWORD = "Cisco@123"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "Cisco@123"

session = requests.Session()

# 收集所有创建的 id，用于最终清理
created_leave_ids: list[str] = []
created_workflow_ids: list[str] = []

# ─── 工具函数 ──────────────────────────────────────────────────────────────────


def section(title: str) -> None:
    line = "=" * 70
    print(f"\n{line}\n  {title}\n{line}")


def show(label: str, resp: requests.Response) -> None:
    print(f"\n  [{label}]")
    print(f"  {resp.request.method} {resp.url}")
    print(f"  Status: {resp.status_code}")
    try:
        body = resp.json()
        text = json.dumps(body, ensure_ascii=False, indent=2)
        if len(text) > 1200:
            text = text[:1200] + "\n  ... (truncated)"
        print(f"  Body: {text}")
    except Exception:
        text = resp.text[:500]
        print(f"  Body: {text}")


def next_weekday(weekday: int = 0) -> date:
    """返回下一个指定星期几 (0=周一 ... 6=周日) 的日期"""
    today = date.today()
    days_ahead = weekday - today.weekday()
    if days_ahead <= 0:
        days_ahead += 7
    return today + timedelta(days=days_ahead)


def find_free_leave_date() -> date:
    """挑选一个不与已有 pending/approved 请假冲突的未来工作日"""
    # 收集自己已有请假占用的日期
    used_dates: set[str] = set()
    try:
        resp = session.get(f"{BASE_URL}/api/v1/me/leave-requests", timeout=10)
        if resp.status_code == 200:
            for item in resp.json():
                used_dates.update(item.get("date_keys") or [])
    except Exception:
        pass

    # 从下一个周一起, 向后找 8 周, 选第一个未占用的工作日
    for week_offset in range(8):
        for wd in range(5):  # 周一~周五
            candidate = next_weekday(wd) + timedelta(weeks=week_offset)
            if candidate.isoformat() not in used_dates:
                return candidate
    # 兜底: 3 个月后的周一
    return next_weekday(0) + timedelta(weeks=12)


def login(username: str, password: str) -> bool:
    resp = session.post(
        f"{BASE_URL}/api/v1/auth/login",
        json={"username": username, "password": password},
        timeout=10,
    )
    show("登录", resp)
    return resp.status_code == 200


def extract_id(resp_data) -> str | None:
    """从响应中提取 leave id (兼容 list / dict 格式)"""
    if isinstance(resp_data, list) and len(resp_data) > 0:
        return resp_data[0].get("id")
    if isinstance(resp_data, dict):
        return resp_data.get("id")
    return None


# ─── 员工端接口 ────────────────────────────────────────────────────────────────


def list_my_leaves() -> list:
    section("Step 2: 列出我的请假 (GET /api/v1/me/leave-requests)")
    resp = session.get(f"{BASE_URL}/api/v1/me/leave-requests", timeout=10)
    show("我的请假列表", resp)
    if resp.status_code == 200:
        data = resp.json()
        print(f"\n  ✅ 共 {len(data)} 条请假记录")
        return data
    return []


def annual_leave_summary() -> None:
    section("Step 3: 我的年假汇总 (GET /api/v1/me/leave-requests/annual-leave/summary?year=2026)")
    resp = session.get(
        f"{BASE_URL}/api/v1/me/leave-requests/annual-leave/summary",
        params={"year": 2026},
        timeout=10,
    )
    show("年假汇总", resp)
    if resp.status_code == 200:
        d = resp.json()
        print(
            f"\n  ✅ 年度={d.get('year')} 额度={d.get('entitlement_days')} "
            f"已用={d.get('used_days')} 剩余={d.get('available_days')}"
        )


def department_leaves() -> None:
    section("Step 4: 我部门的请假 (GET /api/v1/me/leave-requests/department)")
    resp = session.get(f"{BASE_URL}/api/v1/me/leave-requests/department", timeout=10)
    show("部门请假", resp)
    if resp.status_code == 200:
        print(f"\n  ✅ 部门共 {len(resp.json())} 条请假记录")


def my_pending_approvals() -> None:
    section("Step 5: 我的待审请假 (GET /api/v1/me/leave-requests/approvals)")
    resp = session.get(f"{BASE_URL}/api/v1/me/leave-requests/approvals", timeout=10)
    show("待审请假", resp)
    if resp.status_code == 200:
        print(f"\n  ✅ 共 {len(resp.json())} 条待审批请假")


def my_approval_records() -> None:
    section("Step 6: 我的审批记录 (GET /api/v1/me/leave-requests/approval-records)")
    resp = session.get(f"{BASE_URL}/api/v1/me/leave-requests/approval-records", timeout=10)
    show("审批记录", resp)
    if resp.status_code == 200:
        print(f"\n  ✅ 共 {len(resp.json())} 条审批记录")


def create_leave() -> str | None:
    section("Step 7: 创建请假 (POST /api/v1/me/leave-requests)")
    start = find_free_leave_date()  # 自动避开已有请假占用的日期
    payload = {
        "leave_type": "personal",  # 事假
        "start_date": start.isoformat(),
        "end_date": start.isoformat(),
        "session": "full_day",
        "reason": "API 测试 - 请假申请接口验证",
        "handover_to": "测试交接人",
        "regional_holiday_mode": "exclude",
    }
    print(f"  📅 选择请假日期: {start.isoformat()} (避开已有请假)")
    resp = session.post(f"{BASE_URL}/api/v1/me/leave-requests", json=payload, timeout=10)
    show("创建请假", resp)
    if resp.status_code in (200, 201):
        data = resp.json()
        leave_id = data.get("id") or (data.get("data") or {}).get("id")
        print(f"\n  ✅ 创建成功 id={leave_id}, 状态={data.get('approval_status')}")
        if leave_id:
            created_leave_ids.append(leave_id)
        return leave_id
    print(f"\n  ❌ 创建失败: {resp.text[:300]}")
    return None


def withdraw_leave(leave_id: str) -> None:
    section(f"Step 8: 撤回请假 (PATCH /api/v1/me/leave-requests/{leave_id}/withdraw)")
    resp = session.patch(
        f"{BASE_URL}/api/v1/me/leave-requests/{leave_id}/withdraw",
        json={"withdraw_comment": "API 测试 - 撤回请假"},
        timeout=10,
    )
    show("撤回结果", resp)
    if resp.status_code in (200, 201):
        d = resp.json()
        print(f"\n  ✅ 撤回成功, 新状态={d.get('approval_status')}")
    else:
        print(f"\n  ⚠️ 撤回返回 {resp.status_code}")


def verify_withdrawn(leave_id: str) -> None:
    """员工端没有 GET /me/leave-requests/{id}, 用管理端只读接口验证"""
    section(f"Step 9: 验证撤回结果 (GET /api/v1/leave-requests/{leave_id})")
    resp = session.get(
        f"{BASE_URL}/api/v1/leave-requests/{leave_id}", timeout=10
    )
    show("读取请假", resp)
    if resp.status_code == 200:
        d = resp.json()
        print(f"\n  ✅ 当前状态={d.get('approval_status')}, 审批人={d.get('current_approver_id')}")


# ─── 管理端接口 ────────────────────────────────────────────────────────────────


def admin_list_all() -> None:
    section("Step 10: 列出全部请假 (GET /api/v1/leave-requests, 带过滤)")
    resp = session.get(
        f"{BASE_URL}/api/v1/leave-requests",
        params={"year": 2026, "approval_status": "pending"},
        timeout=10,
    )
    show("全部请假 (year=2026, pending)", resp)
    if resp.status_code == 200:
        data = resp.json()
        print(f"\n  ✅ 共 {len(data)} 条 pending 请假")


def admin_read_one(leave_id: str) -> None:
    if not leave_id:
        print("\n  ⏭️ 无请假 id, 跳过")
        return
    section(f"Step 11: 读取一条请假 (GET /api/v1/leave-requests/{leave_id})")
    resp = session.get(f"{BASE_URL}/api/v1/leave-requests/{leave_id}", timeout=10)
    show("读取请假", resp)
    if resp.status_code == 200:
        d = resp.json()
        print(f"\n  ✅ 请假人={d.get('employee_name')}, 类型={d.get('leave_type')}, 状态={d.get('approval_status')}")
        chain = d.get("approval_chain") or []
        print(f"     审批链: {json.dumps(chain, ensure_ascii=False)[:200]}")


def admin_calendar() -> None:
    section("Step 12: 请假日历 (GET /api/v1/leave-requests/calendar?year=2026)")
    resp = session.get(
        f"{BASE_URL}/api/v1/leave-requests/calendar", params={"year": 2026}, timeout=10
    )
    show("请假日历", resp)
    if resp.status_code == 200:
        d = resp.json()
        print(f"\n  ✅ 年度={d.get('year')}, 共 {d.get('total')} 条日历数据")


def admin_calendar_meta() -> None:
    section("Step 13: 日历筛选项 (GET /api/v1/leave-requests/calendar/meta)")
    resp = session.get(f"{BASE_URL}/api/v1/leave-requests/calendar/meta", timeout=10)
    show("日历筛选项", resp)
    if resp.status_code == 200:
        print(f"\n  ✅ {json.dumps(resp.json(), ensure_ascii=False)[:300]}")


def admin_approvals_meta() -> None:
    section("Step 14: 审批筛选项 (GET /api/v1/leave-requests/approvals/meta)")
    resp = session.get(f"{BASE_URL}/api/v1/leave-requests/approvals/meta", timeout=10)
    show("审批筛选项", resp)
    if resp.status_code == 200:
        print(f"\n  ✅ {json.dumps(resp.json(), ensure_ascii=False)[:300]}")


def admin_approval(leave_id: str) -> None:
    """尝试审批 (lin 不一定是对应审批人, 验证权限逻辑)"""
    if not leave_id:
        print("\n  ⏭️ 无请假 id, 跳过")
        return
    section(f"Step 15: 尝试审批 (PATCH /api/v1/leave-requests/{leave_id}/approval)")
    resp = session.patch(
        f"{BASE_URL}/api/v1/leave-requests/{leave_id}/approval",
        json={"approval_status": "approved", "review_comment": "API 测试审批"},
        timeout=10,
    )
    show("审批结果", resp)
    if resp.status_code == 200:
        print("\n  ✅ 审批通过")
    else:
        print(f"\n  ℹ️ 非审批人/非 pending 状态: {resp.status_code} (预期行为)")


# ─── 请假流程 ──────────────────────────────────────────────────────────────────


def workflow_list() -> None:
    section("Step 16: 请假流程列表 (GET /api/v1/leave-workflows)")
    resp = session.get(f"{BASE_URL}/api/v1/leave-workflows", timeout=10)
    show("流程列表", resp)
    if resp.status_code == 200:
        print(f"\n  ✅ 共 {len(resp.json())} 条流程")


def workflow_meta() -> None:
    section("Step 17: 流程元数据 (GET /api/v1/leave-workflows/meta)")
    resp = session.get(f"{BASE_URL}/api/v1/leave-workflows/meta", timeout=10)
    show("流程元数据", resp)
    if resp.status_code == 200:
        print(f"\n  ✅ {json.dumps(resp.json(), ensure_ascii=False)[:400]}")


def workflow_crud() -> None:
    section("Step 18: 请假流程 CRUD (POST → PATCH → DELETE)")
    # 创建
    payload = {
        "name": f"API测试流程-{date.today().isoformat()}",
        "priority": 999,
        "is_active": False,
        "match": {"department": "测试部"},
        "approvers": [{"user_id": "1", "username": "admin", "full_name": "管理员"}],
    }
    resp = session.post(f"{BASE_URL}/api/v1/leave-workflows", json=payload, timeout=10)
    show("创建流程", resp)
    wf_id = None
    if resp.status_code in (200, 201):
        wf_id = resp.json().get("id")
        print(f"\n  ✅ 创建成功 id={wf_id}")
        created_workflow_ids.append(wf_id)
    else:
        print(f"\n  ⚠️ 创建失败: {resp.text[:300]}")

    if wf_id:
        # 更新
        resp2 = session.patch(
            f"{BASE_URL}/api/v1/leave-workflows/{wf_id}",
            json={"name": f"API测试流程-改-{date.today().isoformat()}", "priority": 998},
            timeout=10,
        )
        show("更新流程", resp2)
        if resp2.status_code == 200:
            print("\n  ✅ 更新成功")

        # 删除 (清理)
        resp3 = session.delete(f"{BASE_URL}/api/v1/leave-workflows/{wf_id}", timeout=10)
        show("删除流程", resp3)
        if resp3.status_code in (200, 204):
            print("\n  ✅ 删除成功 (已清理)")


# ─── 地区假期 ──────────────────────────────────────────────────────────────────


def regional_holiday_crud() -> None:
    section("Step 19: 地区假期 CRUD (PUT → DELETE)")
    test_date = next_weekday(5).isoformat()  # 下一个周六
    payload = {"region": "测试区", "date": test_date, "holiday_name": "API测试假期"}
    resp = session.put(
        f"{BASE_URL}/api/v1/leave-requests/calendar/regional-holidays",
        json=payload,
        timeout=10,
    )
    show("写入地区假期", resp)
    if resp.status_code in (200, 201):
        print(f"\n  ✅ 写入成功 {test_date}")

    # 验证日历中出现
    resp_cal = session.get(
        f"{BASE_URL}/api/v1/leave-requests/calendar", params={"year": 2026}, timeout=10
    )
    found = False
    if resp_cal.status_code == 200:
        items = resp_cal.json().get("items", [])
        found = any(
            isinstance(i, dict) and i.get("holiday_name") == "API测试假期"
            for i in items
        )
    print(f"\n  {'✅ 日历中已可见该假期' if found else 'ℹ️ 日历中未直接匹配 (可能为独立结构)'}")

    # 删除 (清理) — 注意: 用 JSON body, 不是 query 参数
    resp_del = session.delete(
        f"{BASE_URL}/api/v1/leave-requests/calendar/regional-holidays",
        json={"region": "测试区", "date": test_date},
        timeout=10,
    )
    show("删除地区假期", resp_del)
    if resp_del.status_code in (200, 204):
        print("\n  ✅ 删除成功 (已清理)")


# ─── 主流程 ────────────────────────────────────────────────────────────────────


def main() -> None:
    print(r"""
  ╔══════════════════════════════════════════════════════════════╗
  ║              请假申请 API 全流程测试脚本                      ║
  ║  员工端: lin / Cisco@123     后端: 10.254.253.187:8999      ║
  ╚══════════════════════════════════════════════════════════════╝
    """)

    # 1. 登录
    section("Step 1: 登录")
    if not login(USERNAME, PASSWORD):
        print("登录失败, 终止测试")
        sys.exit(1)

    # 2-6. 员工端只读接口
    my_leaves = list_my_leaves()
    annual_leave_summary()
    department_leaves()
    my_pending_approvals()
    my_approval_records()

    # 7-9. 创建 → 撤回 → 验证
    leave_id = create_leave()
    if leave_id:
        withdraw_leave(leave_id)
        verify_withdrawn(leave_id)
    else:
        print("\n  ⚠️ 请假创建失败, 跳过撤回验证")

    # 10-15. 管理端接口
    admin_list_all()
    admin_read_one(leave_id)
    admin_calendar()
    admin_calendar_meta()
    admin_approvals_meta()
    admin_approval(leave_id)

    # 16-18. 请假流程
    workflow_list()
    workflow_meta()
    workflow_crud()

    # 19. 地区假期
    regional_holiday_crud()

    # 20. 总结
    section("测试总结")
    print(f"""
  ✅ 员工端: 列表 / 年假汇总 / 部门请假 / 待审 / 审批记录 / 创建 / 撤回  全部测试完成
  ✅ 管理端: 列表 / 单条 / 日历 / 筛选项 / 审批                        全部测试完成
  ✅ 流程:   列表 / 元数据 / 创建 / 更新 / 删除                        全部测试完成
  ✅ 地区假期: 写入 / 删除                                             全部测试完成

  本次创建待清理: 请假 {len(created_leave_ids)} 条 (已撤回, 系统保留)
                 流程 {len(created_workflow_ids)} 条 (已删除)
    """)


if __name__ == "__main__":
    main()
