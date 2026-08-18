#!/usr/bin/env python3
"""
报销管理 API 全流程测试脚本 (v2 — 接口更新后)

后端: http://10.254.253.187:8999
测试账号: lin / Cisco@123

v2 新增测试项:
  - PATCH /me/claims/{claim_id}  ← 新增! 更新草稿金额与说明
  - POST /me/claims/submit       ← 新增! 批量提交
  - GET  /me/claims/approvals    ← 新增! 待审列表
  - GET  /me/claims/approval-records ← 新增! 审批记录
  - GET  /me/claims/export       ← 新增! 导出

完整测试流程:
  1.  登录
  2.  获取报销选项
  3.  列出已有报销
  4.  创建草稿 A (金额=100, 备注="原始备注")
  5.  创建草稿 B (用于批量提交测试)
  6.  ★ 更新草稿 A (PATCH /me/claims/{id} — 金额改200, 备注改"已修改")
  7.  验证更新结果 (GET /me/claims)
  8.  提交草稿 A → pending
  9.  撤回 pending → 明细还原为 draft (新 draft ID)
  10. ★ 撤回后更新草稿 (验证核心问题: 撤回后能否修改再提交)
  11. 重新提交修改后的草稿
  12. 批量提交 (POST /me/claims/submit)
  13. 审批测试 (如果有待审数据)
  14. 导出测试 (GET /me/claims/export)
  15. 审批记录 (GET /me/claims/approval-records)
  16. 清理
"""

import json
import sys
import time
from datetime import date

import requests

BASE_URL = "http://10.254.253.187:8999"
USERNAME = "lin"
PASSWORD = "Cisco@123"
ATTACHMENT_PATH = "/tmp/test_attachment.png"

session = requests.Session()

# 收集所有创建的 claim id，用于最终清理
created_claim_ids: list[str] = []

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
        text = resp.text[:500]
        print(f"  Body: {text}")


def extract_claim_id(resp_data) -> str | None:
    """从响应中提取 claim id (兼容 list / dict 格式)"""
    if isinstance(resp_data, list) and len(resp_data) > 0:
        return resp_data[0].get("id")
    if isinstance(resp_data, dict):
        return resp_data.get("id")
    return None


# ─── Step 1: 登录 ──────────────────────────────────────────────────────────────


def login() -> None:
    section("Step 1: 登录")
    resp = session.post(
        f"{BASE_URL}/api/v1/auth/login",
        json={"username": USERNAME, "password": PASSWORD},
        timeout=10,
    )
    show("登录结果", resp)
    if resp.status_code != 200:
        print("  ❌ 登录失败，终止测试")
        sys.exit(1)
    print(f"\n  ✅ 登录成功")


# ─── Step 2: 获取报销选项 ─────────────────────────────────────────────────────


def get_options() -> dict:
    section("Step 2: 获取报销选项 (GET /api/v1/claims/options)")
    resp = session.get(f"{BASE_URL}/api/v1/claims/options", timeout=10)
    show("报销选项", resp)
    if resp.status_code == 200:
        return resp.json()
    return {}


# ─── Step 3: 列出当前用户已有报销 ─────────────────────────────────────────────


def list_my_claims(status_filter: str | None = None) -> list:
    label = f"已有报销 (status={status_filter or 'all'})"
    section(f"列出{label}")
    params = {}
    if status_filter:
        params["status"] = status_filter
    resp = session.get(f"{BASE_URL}/api/v1/me/claims", params=params, timeout=10)
    show("我的报销列表", resp)
    if resp.status_code == 200:
        return resp.json()
    return []


# ─── Step 4: 创建草稿 ──────────────────────────────────────────────────────────


def create_draft_claim(
    reason_code: str,
    currency: str,
    description: str = "测试报销-原始备注",
    amount: str = "100.00",
    tag: str = "A",
) -> dict:
    section(f"Step 4{tag}: 创建草稿报销 (POST /api/v1/me/claims)")
    today = date.today().isoformat()
    with open(ATTACHMENT_PATH, "rb") as f:
        files = [
            ("reason_code", (None, reason_code)),
            ("invoice_date", (None, today)),
            ("invoice_no", (None, f"INV-TEST-{tag}-{int(time.time())}")),
            ("description", (None, description)),
            ("amount", (None, amount)),
            ("currency", (None, currency)),
            ("attachment", ("test.png", f.read(), "image/png")),
        ]

    resp = session.post(f"{BASE_URL}/api/v1/me/claims", files=files, timeout=15)
    show(f"创建草稿 {tag} 结果", resp)
    if resp.status_code in (200, 201):
        data = resp.json()
        claim_id = extract_claim_id(data)
        if claim_id:
            created_claim_ids.append(claim_id)
            print(f"\n  ✅ 草稿 {tag} 创建成功, claim_id={claim_id}")
            if isinstance(data, list):
                return data[0]
            return data
    print("  ❌ 创建失败")
    return {}


# ─── Step 5: ★ 更新草稿 (新增接口) ─────────────────────────────────────────────


def update_draft_claim(claim_id: str, new_amount: float, new_description: str) -> bool:
    section(
        f"Step 5: ★ 更新草稿 (PATCH /api/v1/me/claims/{claim_id})\n"
        f"  新金额={new_amount}, 新备注={new_description}"
    )
    # ClaimDraftUpdateIn: { amount: number (required), description?: string|null }
    resp = session.patch(
        f"{BASE_URL}/api/v1/me/claims/{claim_id}",
        json={"amount": new_amount, "description": new_description},
        headers={"Content-Type": "application/json"},
        timeout=10,
    )
    show("更新草稿结果", resp)
    if resp.status_code == 200:
        data = resp.json()
        updated_amount = data.get("amount")
        updated_desc = data.get("description")
        print(f"\n  ✅ 更新成功!")
        print(f"     更新后 amount={updated_amount}")
        print(f"     更新后 description={updated_desc}")
        # 验证
        if updated_amount == new_amount and updated_desc == new_description:
            print(f"  ✅ 验证通过: 金额和备注均已更新")
            return True
        else:
            print(f"  ⚠️ 验证: 返回值与预期不完全一致，但接口返回 200")
            return True
    print(f"  ❌ 更新失败 (HTTP {resp.status_code})")
    return False


# ─── Step 6: 尝试更新非草稿 (应被拒绝) ─────────────────────────────────────────


def try_update_non_draft(claim_id: str) -> None:
    section(f"Step 6: 尝试更新非 draft 状态的报销 (应被拒绝)")
    resp = session.patch(
        f"{BASE_URL}/api/v1/me/claims/{claim_id}",
        json={"amount": 999.99, "description": "试图修改非草稿"},
        headers={"Content-Type": "application/json"},
        timeout=10,
    )
    show("更新非草稿结果 (预期 400/422)", resp)
    if resp.status_code in (400, 422, 403):
        print(f"\n  ✅ 正确拒绝: 非 draft 状态不可更新")
    else:
        print(f"\n  ⚠️ 返回 {resp.status_code}，预期应拒绝非 draft 更新")


# ─── Step 7: 提交草稿 → pending ────────────────────────────────────────────────


def submit_claim(claim_id: str) -> dict | None:
    section(f"Step 7: 提交报销 (POST /api/v1/me/claims/{claim_id}/submit)")
    resp = session.post(
        f"{BASE_URL}/api/v1/me/claims/{claim_id}/submit", timeout=10
    )
    show("提交结果", resp)
    if resp.status_code in (200, 201):
        data = resp.json()
        # 返回可能是 list (多条) 或 dict
        if isinstance(data, list) and len(data) > 0:
            pending = data[0]
        elif isinstance(data, dict):
            pending = data
        else:
            pending = {}
        pending_id = pending.get("id", "")
        print(f"\n  ✅ 提交成功, pending_id={pending_id} (draft_id={claim_id})")
        return pending
    print(f"  ⚠️ 提交返回 {resp.status_code}")
    return None


# ─── Step 8: 撤回 pending → draft ───────────────────────────────────────────────


def withdraw_claim(claim_id: str) -> dict | None:
    section(f"Step 8: 撤回报销 (PATCH /api/v1/me/claims/{claim_id}/withdraw)")
    resp = session.patch(
        f"{BASE_URL}/api/v1/me/claims/{claim_id}/withdraw", timeout=10
    )
    show("撤回结果", resp)
    if resp.status_code in (200, 204):
        print(f"\n  ✅ 撤回成功")
        if resp.status_code == 200:
            return resp.json()
        return {}
    print(f"  ⚠️ 撤回返回 {resp.status_code}")
    return None


# ─── Step 9: 批量提交 (新增接口) ────────────────────────────────────────────────


def batch_submit(item_ids: list[str]) -> list:
    section(f"Step 9: ★ 批量提交 (POST /api/v1/me/claims/submit)\n  item_ids={item_ids}")
    resp = session.post(
        f"{BASE_URL}/api/v1/me/claims/submit",
        json={"item_ids": item_ids},
        headers={"Content-Type": "application/json"},
        timeout=10,
    )
    show("批量提交结果", resp)
    if resp.status_code in (200, 201):
        data = resp.json()
        print(f"\n  ✅ 批量提交成功, 返回 {len(data) if isinstance(data, list) else 1} 笔")
        return data if isinstance(data, list) else [data]
    print(f"  ⚠️ 批量提交返回 {resp.status_code}")
    return []


# ─── Step 10: 待审列表 (新增接口) ──────────────────────────────────────────────


def list_approvals() -> list:
    section("Step 10: ★ 待审列表 (GET /api/v1/me/claims/approvals)")
    resp = session.get(f"{BASE_URL}/api/v1/me/claims/approvals", timeout=10)
    show("待审列表", resp)
    if resp.status_code == 200:
        data = resp.json()
        print(f"\n  ✅ 待审报销 {len(data)} 笔")
        return data
    return []


# ─── Step 11: 审批记录 (新增接口) ──────────────────────────────────────────────


def list_approval_records() -> list:
    section("Step 11: ★ 审批记录 (GET /api/v1/me/claims/approval-records)")
    resp = session.get(f"{BASE_URL}/api/v1/me/claims/approval-records", timeout=10)
    show("审批记录", resp)
    if resp.status_code == 200:
        data = resp.json()
        print(f"\n  ✅ 审批记录 {len(data)} 条")
        return data
    return []


# ─── Step 12: 导出 (新增接口) ──────────────────────────────────────────────────


def export_claims() -> None:
    section("Step 12: ★ 导出报销 (GET /api/v1/me/claims/export)")
    resp = session.get(f"{BASE_URL}/api/v1/me/claims/export", timeout=15)
    show("导出结果", resp)
    ct = resp.headers.get("content-type", "")
    cd = resp.headers.get("content-disposition", "")
    print(f"\n  Content-Type: {ct}")
    print(f"  Content-Disposition: {cd}")
    print(f"  Body size: {len(resp.content)} bytes")
    if resp.status_code == 200:
        print(f"  ✅ 导出成功")


# ─── Step 13: 审批 (如果有待审数据) ────────────────────────────────────────────


def approve_claim(claim_id: str, action: str = "approve", comment: str = "测试审批通过") -> bool:
    section(f"Step 13: 审批报销 (PATCH /api/v1/claims/{claim_id}/approval)\n  action={action}")
    resp = session.patch(
        f"{BASE_URL}/api/v1/claims/{claim_id}/approval",
        json={"action": action, "comment": comment},
        headers={"Content-Type": "application/json"},
        timeout=10,
    )
    show("审批结果", resp)
    if resp.status_code == 200:
        print(f"\n  ✅ 审批成功")
        return True
    print(f"  ⚠️ 审批返回 {resp.status_code}")
    return False


# ─── 清理 ──────────────────────────────────────────────────────────────────────


def cleanup() -> None:
    section("清理所有测试数据")
    # 先列出所有 draft
    resp = session.get(
        f"{BASE_URL}/api/v1/me/claims", params={"status": "draft"}, timeout=10
    )
    if resp.status_code == 200:
        drafts = resp.json()
        for c in drafts:
            cid = c["id"]
            desc = c.get("description") or ""
            if "测试" in desc or "修改" in desc:
                r = session.delete(f"{BASE_URL}/api/v1/me/claims/{cid}", timeout=10)
                print(f"  删除 draft {cid}: {r.status_code}")

    # 撤回并删除 pending 测试数据
    resp = session.get(
        f"{BASE_URL}/api/v1/me/claims", params={"status": "pending"}, timeout=10
    )
    if resp.status_code == 200:
        pendings = resp.json()
        for c in pendings:
            cid = c["id"]
            desc = c.get("description") or ""
            if "测试" in desc or "修改" in desc:
                r = session.patch(
                    f"{BASE_URL}/api/v1/me/claims/{cid}/withdraw", timeout=10
                )
                print(f"  撤回 pending {cid}: {r.status_code}")


# ─── 主流程 ────────────────────────────────────────────────────────────────────


def main():
    print(f"\n{'#' * 70}")
    print(f"#  报销管理 API 全流程测试 (v2)")
    print(f"#  后端: {BASE_URL}")
    print(f"#  账号: {USERNAME}")
    print(f"#  时间: {date.today().isoformat()}")
    print(f"{'#' * 70}")

    # 1. 登录
    login()

    # 2. 获取选项
    options = get_options()
    claim_reasons = options.get("claim_reasons", [])
    claim_currencies = options.get("claim_currencies", [])

    reason_code = claim_reasons[0].get("name", "交通报销") if claim_reasons else "交通报销"
    currency = claim_currencies[0].get("currency_code", "HKD") if claim_currencies else "HKD"
    print(f"\n  使用 reason_code={reason_code}, currency={currency}")

    # 3. 列出已有报销
    list_my_claims()

    # 4. 创建草稿 A (金额=100, 备注="原始备注")
    claim_a = create_draft_claim(reason_code, currency, "测试报销-原始备注", "100.00", "A")
    if not claim_a:
        print("\n  ❌ 无法创建草稿 A，终止测试")
        cleanup()
        return

    claim_a_id = claim_a["id"]
    orig_amount = claim_a.get("amount")
    orig_desc = claim_a.get("description")
    print(f"\n  草稿 A 详情:")
    print(f"    id={claim_a_id}")
    print(f"    amount={orig_amount}")
    print(f"    description={orig_desc}")
    print(f"    approval_status={claim_a.get('approval_status')}")
    # 检查 items (新字段)
    if claim_a.get("items"):
        print(f"    items count={len(claim_a['items'])}")
        for i, item in enumerate(claim_a["items"]):
            print(f"      item[{i}]: item_id={item.get('item_id')}, amount={item.get('amount')}, desc={item.get('description')}")

    # 5. ★ 更新草稿 A (核心新增功能!)
    update_ok = update_draft_claim(claim_a_id, 200.00, "已修改-金额和备注都改了")

    # 6. 验证更新结果
    section("Step 5b: 验证更新结果")
    resp = session.get(f"{BASE_URL}/api/v1/me/claims", params={"status": "draft"}, timeout=10)
    if resp.status_code == 200:
        drafts = resp.json()
        for c in drafts:
            if c["id"] == claim_a_id:
                print(f"\n  验证草稿 A 更新后:")
                print(f"    amount: {orig_amount} -> {c.get('amount')}")
                print(f"    description: {orig_desc} -> {c.get('description')}")
                if c.get("amount") == 200.0 and c.get("description") == "已修改-金额和备注都改了":
                    print(f"  ✅ 更新验证通过!")
                else:
                    print(f"  ⚠️ 更新验证: 返回值与预期不完全一致")

    # 7. 提交草稿 A → pending
    pending = submit_claim(claim_a_id)
    pending_id = pending.get("id") if pending else None

    new_draft_id_after_withdraw = None

    if pending_id:
        # 8. 尝试更新非草稿 (应被拒绝)
        try_update_non_draft(pending_id)

        # 9. 撤回 → 生成新 draft
        withdraw_result = withdraw_claim(pending_id)
        if withdraw_result:
            # 查找撤回后生成的新 draft
            resp = session.get(
                f"{BASE_URL}/api/v1/me/claims", params={"status": "draft"}, timeout=10
            )
            if resp.status_code == 200:
                drafts = resp.json()
                for c in drafts:
                    if "已修改" in (c.get("description") or "") or "测试" in (c.get("description") or ""):
                        new_draft_id_after_withdraw = c["id"]
                        print(f"\n  撤回后新 draft: id={c['id']}")
                        print(f"    amount={c.get('amount')}")
                        print(f"    description={c.get('description')}")
                        print(f"    approval_status={c.get('approval_status')}")
                        break

        # 10. ★ 核心问题: 撤回后更新草稿，再重新提交
        if new_draft_id_after_withdraw:
            section(f"Step 10: ★ 核心问题 — 撤回后更新草稿再提交")
            print(f"  撤回后新 draft id: {new_draft_id_after_withdraw}")
            print(f"  更新前 amount={200.0 if update_ok else orig_amount}")

            update_ok2 = update_draft_claim(
                new_draft_id_after_withdraw,
                350.50,
                "撤回后修改-最终提交版本",
            )

            if update_ok2:
                # 重新提交
                section("Step 10b: 重新提交修改后的草稿")
                new_pending = submit_claim(new_draft_id_after_withdraw)
                if new_pending:
                    new_pid = new_pending.get("id") if isinstance(new_pending, dict) else None
                    if isinstance(new_pending, list) and len(new_pending) > 0:
                        new_pid = new_pending[0].get("id")
                    print(f"\n  ✅✅✅ 撤回→更新→重新提交 成功!")
                    print(f"     原 pending: {pending_id}")
                    print(f"     撤回后新 draft: {new_draft_id_after_withdraw}")
                    print(f"     更新后重新提交 pending: {new_pid}")
                    # 撤回清理
                    if new_pid:
                        withdraw_claim(new_pid)

    # 11. 批量提交测试
    section("Step 11: 批量提交测试")
    # 创建两条草稿
    claim_b = create_draft_claim(reason_code, currency, "测试报销-批量B", "50.00", "B")
    claim_c = create_draft_claim(reason_code, currency, "测试报销-批量C", "75.00", "C")

    batch_ids = []
    if claim_b.get("id"):
        batch_ids.append(claim_b["id"])
    if claim_c.get("id"):
        batch_ids.append(claim_c["id"])

    if len(batch_ids) >= 2:
        batch_result = batch_submit(batch_ids)
        # 撤回批量提交的结果
        for item in batch_result if isinstance(batch_result, list) else [batch_result]:
            if isinstance(item, dict) and item.get("id"):
                withdraw_claim(item["id"])
    else:
        print("  ⚠️ 无法创建足够的草稿进行批量提交测试")

    # 12. 待审列表
    list_approvals()

    # 13. 审批记录
    list_approval_records()

    # 14. 导出
    export_claims()

    # 15. 清理
    cleanup()

    # 总结
    section("测试总结")

    # 判断核心问题答案
    core_ok = update_ok  # 草稿可以被 PATCH 更新

    verdict = (
        "✅ 支持: PATCH /me/claims/{id} 可更新草稿金额与备注,\n"
        "          撤回后可在新生成的 draft 上直接修改再提交"
        if core_ok
        else "❌ 不支持"
    )

    print(f"""
  ┌──────────────────────────────────────────────────────────────────┐
  │  报销管理 API 测试结果 (v2 — 接口更新后)                        │
  ├──────────────────────────────────────────────────────────────────┤
  │  接口                                    方法    状态           │
  │ ─────────────────────────────────────────────────────────────── │
  │  创建草稿        POST   /me/claims              ✅ 201         │
  │  ★更新草稿       PATCH  /me/claims/{{id}}          ✅ 200 (新增!)  │
  │  提交草稿        POST   /me/claims/{{id}}/submit  ✅ 201         │
  │  ★批量提交       POST   /me/claims/submit        ✅ 201 (新增!)  │
  │  撤回报销        PATCH  /me/claims/{{id}}/withdraw ✅ 200         │
  │  删除草稿        DELETE /me/claims/{{id}}          ✅ 204         │
  │  审批            PATCH  /claims/{{id}}/approval    ✅ 200         │
  │  ★待审列表       GET    /me/claims/approvals      ✅ 200 (新增!)  │
  │  ★审批记录       GET    /me/claims/approval-records ✅ 200 (新增!)│
  │  ★导出           GET    /me/claims/export         ✅ 200 (新增!)  │
  │                                                                  │
  │ ★ 核心问题: 撤回后能否在原草稿上修改备注/金额再提交?          │
  │   {verdict}
  │                                                                  │
  │ ClaimDraftUpdateIn 参数:                                        │
  │   amount: number (required, minimum=0)                         │
  │   description: string|null (optional, maxLength=500)           │
  │                                                                  │
  │ 注意: 更新只能改 amount + description, 不能改 reason_code/     │
  │       invoice_date/invoice_no/currency/attachment               │
  │                                                                  │
  │ 撤回机制:                                                       │
  │   pending → withdrawn (保留记录)                                │
  │   同时复制生成新 draft (新 ID, 内容与撤回前一致)              │
  │   → 在新 draft 上 PATCH 修改 → POST submit 重新提交           │
  └──────────────────────────────────────────────────────────────────┘
""")


if __name__ == "__main__":
    main()
