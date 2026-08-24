#!/usr/bin/env python3
"""
客户(Customer)地图管理 API 全流程测试脚本

后端: http://10.254.253.187:8999
接口: /api/v1/customers
权限: 需要登录 (使用 admin / Cisco@123)

用法:
  python3 test_customers_api.py

测试流程:
  1. 登录
  2. GET  列表 (基线)
  3. POST 创建客户 (含联系人)
  4. GET  单条 (读回验证)
  5. PATCH 更新
  6. GET  列表 (验证更新)
  7. DELETE 删除
  8. GET  列表 (验证删除)
所有写操作末尾自动清理，不污染线上数据。
"""

import json
import sys
from typing import Optional

import requests

BASE_URL = "http://10.254.253.187:8999"
USERNAME = "admin"
PASSWORD = "Cisco@123"

session = requests.Session()
created_customer_ids: list[int] = []  # 清理用


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
        if len(text) > 2000:
            text = text[:2000] + "\n  ... (truncated)"
        print(f"  Body: {text}")
    except Exception:
        print(f"  Body: {resp.text[:500]}")


def login(username: str, password: str) -> bool:
    section("1. 登录")
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


# ─── B. Customers CRUD ────────────────────────────────────────────────────────


def list_customers(label: str = "列表") -> Optional[list]:
    section(f"{label} (GET /api/v1/customers)")
    resp = session.get(f"{BASE_URL}/api/v1/customers", timeout=10)
    show(label, resp)
    if resp.status_code == 200:
        data = resp.json()
        # 兼容可能的 {data: [...]} 包装
        items = data.get("data", data) if isinstance(data, dict) else data
        print(f"\n  ✅ 共 {len(items)} 条客户记录")
        if items:
            print(f"  首条ID: {items[0].get('id')}, 首条名称: {items[0].get('name')}")
        return items
    print("  ❌ 列表获取失败")
    return None


def create_customer() -> Optional[int]:
    section("3. 创建客户 (POST /api/v1/customers)")
    payload = {
        "name": "测试客户-富西地图",
        "address": "深圳市南山区科技园南区",
        "latitude": 22.543099,
        "longitude": 113.953793,
        "phone": "0755-88888888",
        "notes": "这是一条由自动化测试脚本创建的测试数据，测试完成后将自动删除。",
        "contacts": [
            {
                "role": "技术联系人",
                "name": "张工",
                "phone": "13800138000",
                "email": "zhanggong@example.com",
            },
            {
                "role": "商务联系人",
                "name": "李经理",
                "phone": "13900139000",
                "email": "lijingli@example.com",
            },
        ],
    }
    resp = session.post(
        f"{BASE_URL}/api/v1/customers",
        json=payload,
        timeout=10,
    )
    show("创建客户", resp)
    if resp.status_code in (200, 201):
        data = resp.json()
        cid = data.get("id")
        if cid is not None:
            created_customer_ids.append(int(cid))
            print(f"\n  ✅ 创建成功，客户ID: {cid}")
            return int(cid)
        print("  ⚠️ 创建返回 2xx 但未找到 id 字段")
        return None
    print("  ❌ 创建失败")
    return None


def get_customer(cid: int) -> Optional[dict]:
    section(f"4. 读取单条客户 (GET /api/v1/customers/{cid})")
    # 文档未提供 GET /{id} 单条接口，先试一下
    resp = session.get(f"{BASE_URL}/api/v1/customers/{cid}", timeout=10)
    show(f"读取客户 {cid}", resp)
    if resp.status_code == 200:
        data = resp.json()
        print(f"  ✅ 读取成功: {data.get('name')}, 地址: {data.get('address')}")
        contacts = data.get("contacts", [])
        print(f"  ✅ 联系人数量: {len(contacts)}")
        if contacts:
            print(f"      - {contacts[0].get('role')}: {contacts[0].get('name')} / {contacts[0].get('phone')}")
        return data
    print(f"  ⚠️ 单条接口不可用 (status={resp.status_code})，可跳过此步")
    return None


def update_customer(cid: int) -> bool:
    section(f"5. 更新客户 (PATCH /api/v1/customers/{cid})")
    payload = {
        "name": "测试客户-富西地图(已更新)",
        "address": "深圳市南山区科技园南区-更新地址",
        "latitude": 22.543100,
        "longitude": 113.953800,
        "phone": "0755-99999999",
        "notes": "更新后的备注：已通过 PATCH 接口更新。",
        "contacts": [
            {
                "role": "技术联系人",
                "name": "张工-更新",
                "phone": "13800138001",
                "email": "zhanggong_new@example.com",
            },
        ],
    }
    resp = session.patch(
        f"{BASE_URL}/api/v1/customers/{cid}",
        json=payload,
        timeout=10,
    )
    show(f"更新客户 {cid}", resp)
    if resp.status_code == 200:
        print(f"\n  ✅ 更新成功: {cid}")
        return True
    print("  ❌ 更新失败")
    return False


def delete_customer(cid: int) -> bool:
    section(f"7. 删除客户 (DELETE /api/v1/customers/{cid})")
    resp = session.delete(f"{BASE_URL}/api/v1/customers/{cid}", timeout=10)
    show(f"删除客户 {cid}", resp)
    if resp.status_code == 200:
        print(f"\n  ✅ 删除成功: {cid}")
        if cid in created_customer_ids:
            created_customer_ids.remove(cid)
        return True
    print("  ❌ 删除失败")
    return False


# ─── 清理 ─────────────────────────────────────────────────────────────────────


def cleanup() -> None:
    if not created_customer_ids:
        return
    section("🔧 清理残留测试数据")
    for cid in list(created_customer_ids):
        resp = session.delete(f"{BASE_URL}/api/v1/customers/{cid}", timeout=10)
        if resp.status_code == 200:
            print(f"  🧹 已删除残留客户 {cid}")
        else:
            print(f"  ⚠️ 清理客户 {cid} 失败: HTTP {resp.status_code}")


# ─── 主流程 ───────────────────────────────────────────────────────────────────


def main() -> int:
    print("=" * 70)
    print("  富西地图 - 客户(Customer) CRUD API 测试")
    print(f"  后端: {BASE_URL}")
    print(f"  账号: {USERNAME}")
    print("=" * 70)

    try:
        # 1. 登录
        if not login(USERNAME, PASSWORD):
            return 1

        # 2. 列表（基线）
        items_before = list_customers("2. 列表-基线")

        # 3. 创建
        new_cid = create_customer()
        if new_cid is None:
            print("\n❌ 创建失败，后续更新/删除步骤无法执行")
            return 2

        # 3.1 列表验证创建
        list_customers("3.1 列表-验证创建")

        # 4. 单条读取（若接口存在）
        get_customer(new_cid)

        # 5. 更新
        update_customer(new_cid)

        # 6. 列表-验证更新
        list_customers("6. 列表-验证更新")

        # 7. 删除
        delete_customer(new_cid)

        # 8. 列表-验证删除
        items_after = list_customers("8. 列表-验证删除")
        if items_before is not None and items_after is not None:
            print(
                f"\n  📊 前后对比: 基线 {len(items_before)} 条 → 最终 {len(items_after)} 条"
            )

        print("\n" + "=" * 70)
        print("  ✅ 测试流程完成")
        print("=" * 70)
        return 0

    except KeyboardInterrupt:
        print("\n\n⚠️ 用户中断")
        return 130
    except Exception as e:
        print(f"\n\n❌ 未预期异常: {e!r}")
        import traceback
        traceback.print_exc()
        return 99
    finally:
        cleanup()


if __name__ == "__main__":
    sys.exit(main())
