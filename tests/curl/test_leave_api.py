#!/usr/bin/env python3
"""
请假相关 API 全流程测试脚本

后端: http://10.254.253.187:8999
参照同目录 test_claim_api.py 风格 (requests + section/show 辅助函数 + 末尾清理)

权限与路由分组 (详见 leave_api_overview.txt):
  employee_leave  /api/v1/me/leave-requests    个人接口 (只能看/操作自己)
  leave_calendar /api/v1/leave-requests       管理端 (看全员 + 日历 + 地区假期)
  leave_workflows /api/v1/leave-workflows      审批流配置

用法:
  python3 test_leave_api.py            # 默认: 个人接口 (账号 lin)
  python3 test_leave_api.py --admin    # 管理端 + 审批流 (账号 admin)
  python3 test_leave_api.py --user lin --pw Cisco@123   # 指定账号

测试流程:
  个人段: 年假汇总 -> 列出我的 -> 列部门 -> 提交请假 -> 读单条 -> 撤回 (清理)
  管理段: 列全员 -> 日历 -> 元数据 -> 写/删地区假期 -> 审批(若恰为审批人)
  审批流: 元数据 -> 列出 -> 创建 -> 更新 -> 删除 (清理)
所有写操作末尾自动清理，不污染线上数据。
"""

import argparse
import json
import sys
from datetime import date, timedelta

import requests

BASE_URL = "http://10.254.253.187:8999"

# 账号预设
ACCOUNTS = {
    "lin": ("lin", "Cisco@123"),        # employee_leave (个人)
    "admin": ("admin", "Cisco@123"),    # leave_calendar + leave_workflows (全量)
}

session = requests.Session()
created_leave_ids: list[str] = []     # 个人测试创建的请假 (用于撤回清理)
created_holiday_keys: list[tuple[str, str]] = []  # (region, date) 地区假期清理
created_workflow_ids: list[str] = []    # 审批流清理


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
        if len(text) > 1500:
            text = text[:1500] + "\n  ... (truncated)"
        print(f"  Body: {text}")
    except Exception:
        print(f"  Body: {resp.text[:500]}")


def login(username: str, password: str) -> bool:
    section("登录")
    resp = session.post(
        f"{BASE_URL}/api/v1/auth/login",
        json={"username": username, "password": password},
        timeout=10,
    )
    show(f"登录 {username}", resp)
    if resp.status_code != 200:
        print("  ❌ 登录失败，终止测试")
        return False
    print(f"\n  ✅ 登录成功: {username}")
    return True


# ─── A. 个人接口 (employee_leave) ─────────────────────────────────────────────


def me_annual_leave_summary(year: int) -> None:
    section(f"年假汇总 (GET /me/leave-requests/annual-leave/summary?year={year})")
    resp = session.get(
        f"{BASE_URL}/api/v1/me/leave-requests/annual-leave/summary",
        params={"year": year},
        timeout=10,
    )
    show("年假汇总", resp)
    if resp.status_code == 200:
        d = resp.json()
        print(f"\n  ✅ {d.get('region')} {year}: 额度 {d.get('entitlement_days')} "
              f"已用 {d.get('used_days')} 剩余 {d.get('available_days')}")


def me_list_my() -> list:
    section("列出当前用户请假 (GET /me/leave-requests)")
    resp = session.get(f"{BASE_URL}/api/v1/me/leave-requests", timeout=10)
    show("我的请假", resp)
    if resp.status_code == 200:
        data = resp.json()
        print(f"\n  ✅ 共 {len(data)} 条")
        return data
    return []


def me_list_department() -> None:
    section("列出当前用户部门请假 (GET /me/leave-requests/department)")
    resp = session.get(f"{BASE_URL}/api/v1/me/leave-requests/department", timeout=10)
    show("部门请假", resp)
    if resp.status_code == 200:
        print(f"\n  ✅ 共 {len(resp.json())} 条")


def me_list_approvals() -> list:
    section("我的待审请假 (GET /me/leave-requests/approvals)")
    resp = session.get(f"{BASE_URL}/api/v1/me/leave-requests/approvals", timeout=10)
    show("待审列表", resp)
    if resp.status_code == 200:
        return resp.json()
    return []


def me_list_approval_records() -> None:
    section("我相关的请假审批记录 (GET /me/leave-requests/approval-records)")
    resp = session.get(f"{BASE_URL}/api/v1/me/leave-requests/approval-records", timeout=10)
    show("审批记录", resp)
    if resp.status_code == 200:
        print(f"\n  ✅ 共 {len(resp.json())} 条")


def me_create_leave(leave_type: str = "personal",
                    start: str | None = None, end: str | None = None,
                    session_: str = "full_day", reason: str = "test_leave_api-稍后撤回") -> dict:
    section(f"提交请假 (POST /me/leave-requests) type={leave_type}")
    # 用未来日期避免与真实请假冲突，且不占工作日额度太多
    if start is None:
        start = (date.today() + timedelta(days=400)).isoformat()
    if end is None:
        end = start
    payload = {
        "leave_type": leave_type,
        "start_date": start,
        "end_date": end,
        "session": session_,
        "reason": reason,
        "handover_to": None,
        "regional_holiday_mode": "exclude",
    }
    resp = session.post(f"{BASE_URL}/api/v1/me/leave-requests", json=payload, timeout=10)
    show("提交结果", resp)
    if resp.status_code in (200, 201):
        d = resp.json()
        lr_id = d.get("id")
        if lr_id:
            created_leave_ids.append(lr_id)
            print(f"\n  ✅ 请假创建成功 id={lr_id} status={d.get('approval_status')}")
        return d
    print("  ❌ 创建失败")
    return {}


def me_read_one(leave_id: str) -> None:
    section(f"读取一条请假 (GET /leave-requests/{leave_id})")
    # 单条读取走的是管理端路径，但鉴权是 employee_leave (申请人/同部门同事只读)
    resp = session.get(f"{BASE_URL}/api/v1/leave-requests/{leave_id}", timeout=10)
    show("单条详情", resp)


def me_withdraw(leave_id: str) -> bool:
    section(f"撤回请假 (PATCH /me/leave-requests/{leave_id}/withdraw)")
    resp = session.patch(
        f"{BASE_URL}/api/v1/me/leave-requests/{leave_id}/withdraw",
        json={"withdraw_comment": "test_leave_api-撤回"},
        headers={"Content-Type": "application/json"},
        timeout=10,
    )
    show("撤回结果", resp)
    if resp.status_code == 200:
        print(f"\n  ✅ 撤回成功")
        return True
    print(f"  ⚠️ 撤回返回 {resp.status_code}")
    return False


# ─── B. 管理端接口 (leave_calendar) ───────────────────────────────────────────


def admin_list_all(year: int) -> list:
    section(f"列出全员请假 (GET /leave-requests?year={year}&approval_status=pending)")
    resp = session.get(
        f"{BASE_URL}/api/v1/leave-requests",
        params={"year": year, "approval_status": "pending"},
        timeout=10,
    )
    show("全员请假(pending)", resp)
    if resp.status_code == 200:
        return resp.json()
    return []


def admin_approvals_meta() -> None:
    section("请假审批筛选项 (GET /leave-requests/approvals/meta)")
    resp = session.get(f"{BASE_URL}/api/v1/leave-requests/approvals/meta", timeout=10)
    show("审批筛选项", resp)


def admin_calendar(year: int) -> None:
    section(f"请假日历 (GET /leave-requests/calendar?year={year})")
    resp = session.get(
        f"{BASE_URL}/api/v1/leave-requests/calendar",
        params={"year": year},
        timeout=10,
    )
    show("日历", resp)
    if resp.status_code == 200:
        d = resp.json()
        print(f"\n  ✅ {d.get('year')} 共 {d.get('total')} 条")


def admin_calendar_meta() -> None:
    section("请假日历筛选项 (GET /leave-requests/calendar/meta)")
    resp = session.get(f"{BASE_URL}/api/v1/leave-requests/calendar/meta", timeout=10)
    show("日历筛选项", resp)


def admin_upsert_holiday(region: str, d: str, name: str) -> None:
    section(f"写入地区假期 (PUT /leave-requests/calendar/regional-holidays)\n  {region} {d} {name}")
    resp = session.put(
        f"{BASE_URL}/api/v1/leave-requests/calendar/regional-holidays",
        json={"region": region, "date": d, "holiday_name": name},
        headers={"Content-Type": "application/json"},
        timeout=10,
    )
    show("写入假期", resp)
    if resp.status_code == 200:
        created_holiday_keys.append((region, d))
        print(f"\n  ✅ 写入成功")


def admin_delete_holiday(region: str, d: str) -> None:
    section(f"删除地区假期 (DELETE /leave-requests/calendar/regional-holidays)\n  {region} {d}")
    resp = session.delete(
        f"{BASE_URL}/api/v1/leave-requests/calendar/regional-holidays",
        json={"region": region, "date": d},
        headers={"Content-Type": "application/json"},
        timeout=10,
    )
    show("删除假期", resp)


def admin_approve(pending_id: str) -> None:
    """审批接口要求当前用户恰好是这条请假的审批人，否则返回 403。"""
    section(f"审批请假 (PATCH /leave-requests/{pending_id}/approval)")
    resp = session.patch(
        f"{BASE_URL}/api/v1/leave-requests/{pending_id}/approval",
        json={"approval_status": "approved", "review_comment": "test_leave_api-审批通过"},
        headers={"Content-Type": "application/json"},
        timeout=10,
    )
    show("审批结果", resp)
    if resp.status_code == 200:
        print(f"\n  ✅ 审批成功")
    elif resp.status_code == 403:
        print(f"\n  ⚠️ 403: 当前用户不是这条请假的审批人 (预期行为之一)，跳过")


# ─── C. 审批流配置 (leave_workflows) ──────────────────────────────────────────


def wf_meta() -> dict:
    section("审批流元数据 (GET /leave-workflows/meta)")
    resp = session.get(f"{BASE_URL}/api/v1/leave-workflows/meta", timeout=10)
    show("审批流 meta", resp)
    return resp.json() if resp.status_code == 200 else {}


def wf_list() -> list:
    section("列出现有审批流 (GET /leave-workflows)")
    resp = session.get(f"{BASE_URL}/api/v1/leave-workflows", timeout=10)
    show("审批流列表", resp)
    if resp.status_code == 200:
        print(f"\n  ✅ 共 {len(resp.json())} 条")
        return resp.json()
    return []


def wf_create() -> dict:
    section("创建审批流 (POST /leave-workflows)")
    payload = {
        "name": "test_leave_api-测试审批流",
        "priority": 9999,
        "is_active": True,
        "match": {"department": "深圳研发中心"},
        "approvers": [],
    }
    resp = session.post(f"{BASE_URL}/api/v1/leave-workflows", json=payload, timeout=10)
    show("创建结果", resp)
    if resp.status_code == 200:
        d = resp.json()
        wf_id = d.get("id")
        if wf_id:
            created_workflow_ids.append(wf_id)
            print(f"\n  ✅ 创建成功 id={wf_id}")
        return d
    print("  ❌ 创建失败")
    return {}


def wf_update(wf_id: str) -> None:
    section(f"更新审批流 (PATCH /leave-workflows/{wf_id})")
    resp = session.patch(
        f"{BASE_URL}/api/v1/leave-workflows/{wf_id}",
        json={"priority": 8888, "is_active": False},
        headers={"Content-Type": "application/json"},
        timeout=10,
    )
    show("更新结果", resp)
    if resp.status_code == 200:
        print(f"\n  ✅ 更新成功 priority={resp.json().get('priority')} "
              f"is_active={resp.json().get('is_active')}")


def wf_delete(wf_id: str) -> None:
    section(f"删除审批流 (DELETE /leave-workflows/{wf_id})")
    resp = session.delete(f"{BASE_URL}/api/v1/leave-workflows/{wf_id}", timeout=10)
    show("删除结果", resp)


# ─── 清理 ──────────────────────────────────────────────────────────────────────


def cleanup() -> None:
    section("清理测试数据")
    # 撤回个人请假
    for lr_id in created_leave_ids:
        r = session.patch(
            f"{BASE_URL}/api/v1/me/leave-requests/{lr_id}/withdraw",
            json={"withdraw_comment": "test_leave_api-清理撤回"},
            headers={"Content-Type": "application/json"},
            timeout=10,
        )
        print(f"  撤回请假 {lr_id}: {r.status_code}")
    # 删除地区假期
    for region, d in created_holiday_keys:
        r = session.delete(
            f"{BASE_URL}/api/v1/leave-requests/calendar/regional-holidays",
            json={"region": region, "date": d},
            headers={"Content-Type": "application/json"},
            timeout=10,
        )
        print(f"  删除假期 {region} {d}: {r.status_code}")
    # 删除审批流
    for wf_id in created_workflow_ids:
        r = session.delete(f"{BASE_URL}/api/v1/leave-workflows/{wf_id}", timeout=10)
        print(f"  删除审批流 {wf_id}: {r.status_code}")


# ─── 主流程 ────────────────────────────────────────────────────────────────────


def run_personal(user: str, pw: str) -> None:
    print(f"\n{'#' * 70}\n#  请假 — 个人接口测试 (employee_leave)\n#  账号: {user}\n{'#' * 70}")
    if not login(user, pw):
        return
    year = date.today().year
    me_annual_leave_summary(year)
    me_list_my()
    me_list_department()
    me_list_approval_records()
    approvals = me_list_approvals()
    leave = me_create_leave()
    if leave.get("id"):
        me_read_one(leave["id"])
        me_withdraw(leave["id"])
    # 若当前用户恰好是某条 pending 的审批人，尝试审批
    if approvals:
        admin_approve(approvals[0]["id"])
    cleanup()


def run_admin(user: str, pw: str) -> None:
    print(f"\n{'#' * 70}\n#  请假 — 管理端 + 审批流测试 (leave_calendar + leave_workflows)\n"
          f"#  账号: {user}\n{'#' * 70}")
    if not login(user, pw):
        return
    year = date.today().year
    # B. 管理端
    admin_list_all(year)
    admin_approvals_meta()
    admin_calendar(year)
    admin_calendar_meta()
    holiday_date = "2099-12-31"
    admin_upsert_holiday("香港", holiday_date, "test_leave_api-测试假期")
    admin_delete_holiday("香港", holiday_date)
    # 审批: admin 通常不是审批人，多半会 403，验证接口可达即可
    pendings = me_list_approvals()
    if pendings:
        admin_approve(pendings[0]["id"])
    # C. 审批流
    wf_meta()
    wf_list()
    wf = wf_create()
    if wf.get("id"):
        wf_update(wf["id"])
    cleanup()


def main():
    parser = argparse.ArgumentParser(description="请假 API 全流程测试")
    parser.add_argument("--admin", action="store_true",
                        help="跑管理端 + 审批流 (账号 admin)")
    parser.add_argument("--user", default=None, help="指定用户名")
    parser.add_argument("--pw", default=None, help="指定密码")
    args = parser.parse_args()

    if args.user:
        user, pw = args.user, args.pw or ""
    elif args.admin:
        user, pw = ACCOUNTS["admin"]
    else:
        user, pw = ACCOUNTS["lin"]

    try:
        if args.admin:
            run_admin(user, pw)
        else:
            run_personal(user, pw)
    finally:
        cleanup()

    section("测试完成")
    print(f"  个人请假创建数: {len(created_leave_ids)} (已撤回清理)")
    print(f"  地区假期创建数: {len(created_holiday_keys)} (已删除清理)")
    print(f"  审批流创建数:   {len(created_workflow_ids)} (已删除清理)")


if __name__ == "__main__":
    main()
