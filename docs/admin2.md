# OA System API - `admin2` 账号接口文档

> **服务地址**: `http://10.254.253.187:8999`
> **账号**: `admin2` / **密码**: `Yu&A4fMl9B4^YX`
> **认证方式**: Session Cookie（登录后自动获取 `SessionID`）

---

## 目录

- [一、认证模块 (Auth)](#一认证模块-auth)
- [二、员工管理模块](#二员工管理模块)
- [三、请假管理模块](#三请假管理模块)
- [四、请假流程模块](#四请假流程模块)
- [五、报销管理模块](#五报销管理模块)
- [六、系统参数模块](#六系统参数模块)
- [七、数据迁移模块](#七数据迁移模块)
- [附录：系统页面路由](#附录系统页面路由)
- [admin2 账号权限汇总](#admin2-账号权限汇总)
- [权限对比说明](#权限对比说明)

---

## 一、认证模块 (Auth)

### 1. 登录

**POST** `/api/v1/auth/login`

**请求体 (application/json):**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| username | string | ✅ | 用户名 |
| password | string | ✅ | 密码 |

**curl 示例:**
```bash
curl -c /tmp/cookies_admin2.txt 'http://10.254.253.187:8999/api/v1/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin2","password":"Yu&A4fMl9B4^YX"}'
```

**响应 (200):**
```json
{"message":"登录成功","expires_at":"2026-07-31T23:59:59Z"}
```

> 登录成功后，服务端通过 `Set-Cookie` 返回 `SessionID`，后续请求使用 `-b /tmp/cookies_admin2.txt` 携带 Cookie 即可。

---

### 2. 获取当前用户信息

**GET** `/api/v1/auth/me`

**curl 示例:**
```bash
curl -b /tmp/cookies_admin2.txt 'http://10.254.253.187:8999/api/v1/auth/me'
```

**响应 (200):**
```json
{
  "username": "admin2",
  "email": "violet8281@gmail.com",
  "full_name": "violet violet",
  "id": "6a6af63f64f5ce007e67ab70",
  "user_id": 10,
  "phone": "19088887777",
  "department": null,
  "region": null,
  "position": null,
  "avatar_url": null,
  "avatar_name": null,
  "hire_date": null,
  "work_start_date": null,
  "is_active": true,
  "is_initial_password": 0,
  "temporary_password": null,
  "module_permissions": [
    {"module_code":"employee_home","module_name":"员工工作台","can_view":true,"can_create":false,"can_edit":false,"can_delete":false,"can_approve":false},
    {"module_code":"employee_password","module_name":"修改密码","can_view":true,"can_create":false,"can_edit":false,"can_delete":false,"can_approve":false},
    {"module_code":"employee_leave","module_name":"员工请假","can_view":true,"can_create":false,"can_edit":false,"can_delete":false,"can_approve":false},
    {"module_code":"user_management","module_name":"用户管理","can_view":true,"can_create":false,"can_edit":false,"can_delete":false,"can_approve":false},
    {"module_code":"system_settings","module_name":"系统参数维护","can_view":true,"can_create":false,"can_edit":false,"can_delete":false,"can_approve":false},
    {"module_code":"data_migration","module_name":"数据处理维护","can_view":true,"can_create":false,"can_edit":false,"can_delete":false,"can_approve":false},
    {"module_code":"claim_management","module_name":"报销 Claim","can_view":true,"can_create":false,"can_edit":false,"can_delete":false,"can_approve":false}
  ],
  "created_at": "2026-07-30T06:59:11.079000Z",
  "updated_at": "2026-07-31T02:16:10.730000Z"
}
```

---

### 3. 修改密码

**POST** `/api/v1/auth/change-password`

**curl 示例:**
```bash
curl -b /tmp/cookies_admin2.txt -X POST 'http://10.254.253.187:8999/api/v1/auth/change-password' \
  -H 'Content-Type: application/json' \
  -d '{"current_password":"Yu&A4fMl9B4^YX","new_password":"NewPass@456"}'
```

**响应 (200):** 返回完整用户对象

---

### 4. 登出

**POST** `/api/v1/auth/logout`

**curl 示例:**
```bash
curl -b /tmp/cookies_admin2.txt -X POST 'http://10.254.253.187:8999/api/v1/auth/logout'
```

**响应 (200):**
```json
{"message":"登出成功"}
```

---

### 5. 注册用户

**POST** `/api/v1/auth/register`

**curl 示例:**
```bash
curl -b /tmp/cookies_admin2.txt -X POST 'http://10.254.253.187:8999/api/v1/auth/register' \
  -H 'Content-Type: application/json' \
  -d '{"username":"newuser","email":"new@test.com","full_name":"New User","password":"Pass@123"}'
```

**响应 (201):** 返回完整用户对象

---

## 二、员工管理模块

### 6. 获取员工列表 ✅

**GET** `/api/v1/employees`

**curl 示例:**
```bash
curl -b /tmp/cookies_admin2.txt 'http://10.254.253.187:8999/api/v1/employees'
```

**响应 (200):** 返回员工数组（admin2 可查看所有员工）

---

### 7. 创建员工 ✅

**POST** `/api/v1/employees`

**请求体 (application/json):**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| username | string | ✅ | 用户名 |
| email | string | ✅ | 邮箱 |
| full_name | string | ✅ | 全名 |
| phone | string | ❌ | 电话 |
| department | string | ✅ | 部门 |
| region | string | ❌ | 地区 |
| position | string | ❌ | 职位 |
| is_active | boolean | ❌ | 默认 true |
| module_permissions | array | ❌ | 模块权限列表 |

**curl 示例:**
```bash
curl -b /tmp/cookies_admin2.txt -X POST 'http://10.254.253.187:8999/api/v1/employees' \
  -H 'Content-Type: application/json' \
  -d '{
    "username": "testemp_admin2",
    "email": "testemp@test.com",
    "full_name": "Test Employee",
    "phone": "19012345678",
    "department": "香港销售",
    "region": "香港",
    "position": "Sales",
    "is_active": true,
    "module_permissions": [
      {"module_code":"employee_home","module_name":"员工工作台","can_view":true,"can_create":false,"can_edit":false,"can_delete":false,"can_approve":false}
    ]
  }'
```

**响应 (201):**
```json
{
  "id": "6a6c0adb8165c73aa46106fc",
  "user_id": 12,
  "employee_code": "EMP000012",
  "username": "testemp_admin2",
  "email": "testemp@test.com",
  "full_name": "Test Employee",
  "department": "香港销售",
  "region": "香港",
  "position": "Sales",
  "is_active": true,
  "is_initial_password": 1,
  "temporary_password": "#0fbkZLz85e&AR",
  "module_permissions": [
    {"module_code":"employee_home","module_name":"员工工作台","can_view":true,...}
  ],
  "created_at": "2026-07-31T02:39:23.713000Z"
}
```

> admin2 可以成功创建员工，并获得临时密码。

---

### 8. 获取"我"的员工档案 ✅

**GET** `/api/v1/employees/me/profile`

**curl 示例:**
```bash
curl -b /tmp/cookies_admin2.txt 'http://10.254.253.187:8999/api/v1/employees/me/profile'
```

**响应 (200):**
```json
{
  "employee_id": "6a6af63f64f5ce007e67ab70",
  "english_name": null,
  "hire_date": null,
  "work_start_date": null,
  "birth_date": null,
  "hkid_number": "12222222",
  "gender": "女",
  "passport_number": null,
  "marital_status": "已婚",
  "english_address": null,
  "personal_email": "violet88481@gmail.com",
  "emergency_contact_name": "工作所在地紧急联系人",
  "emergency_contact_phone": "18766661111",
  "emergency_contact_relationship": "姐妹",
  "bank_name": "自动转账资料（发工资用）",
  "bank_account_name": "银行账户签名",
  "bank_account_number": "1234567890",
  "created_at": "2026-07-30T07:02:21.649000Z",
  "updated_at": "2026-07-31T02:16:10.799000Z"
}
```

---

### 9. 更新"我"的员工档案 ✅

**PATCH** `/api/v1/employees/me/profile`

**curl 示例:**
```bash
curl -b /tmp/cookies_admin2.txt -X PATCH 'http://10.254.253.187:8999/api/v1/employees/me/profile' \
  -H 'Content-Type: application/json' \
  -d '{"gender":"女"}'
```

**响应 (200):** 返回更新后的完整 profile 对象

---

### 10. 更新"我"的基本信息 ✅

**PATCH** `/api/v1/employees/me/basic-info`

**curl 示例:**
```bash
curl -b /tmp/cookies_admin2.txt -X PATCH 'http://10.254.253.187:8999/api/v1/employees/me/basic-info' \
  -H 'Content-Type: application/json' \
  -d '{"full_name":"violet violet"}'
```

**响应 (200):** 返回更新后的完整员工对象

---

### 11. 更新"我"的头像 ✅

**PATCH** `/api/v1/employees/me/avatar`

**curl 示例:**
```bash
curl -b /tmp/cookies_admin2.txt -X PATCH 'http://10.254.253.187:8999/api/v1/employees/me/avatar' \
  -F 'avatar=@/path/to/avatar.jpg'
```

**响应 (200):** 返回更新后的员工对象，包含新的 `avatar_url` 和 `avatar_name`

---

### 12. 获取指定员工档案 ✅

**GET** `/api/v1/employees/{employee_id}/profile`

**curl 示例:**
```bash
curl -b /tmp/cookies_admin2.txt 'http://10.254.253.187:8999/api/v1/employees/{employee_id}/profile'
```

---

### 13. 更新指定员工档案 ❌

**PATCH** `/api/v1/employees/{employee_id}/profile`

**curl 示例:**
```bash
curl -b /tmp/cookies_admin2.txt -X PATCH 'http://10.254.253.187:8999/api/v1/employees/{employee_id}/profile' \
  -H 'Content-Type: application/json' \
  -d '{"english_name":"Updated Name"}'
```

**响应 (403):**
```json
{"detail":"当前用户无权访问用户管理"}
```

---

### 14. 更新指定员工基本信息 ❌

**PATCH** `/api/v1/employees/{employee_id}/basic-info`

**curl 示例:**
```bash
curl -b /tmp/cookies_admin2.txt -X PATCH 'http://10.254.253.187:8999/api/v1/employees/{employee_id}/basic-info' \
  -H 'Content-Type: application/json' \
  -d '{"full_name":"Updated Name"}'
```

**响应 (403):**
```json
{"detail":"当前用户无权访问用户管理"}
```

---

### 15. 更新员工权限 ❌

**PATCH** `/api/v1/employees/{employee_id}/permissions`

**curl 示例:**
```bash
curl -b /tmp/cookies_admin2.txt -X PATCH 'http://10.254.253.187:8999/api/v1/employees/{employee_id}/permissions' \
  -H 'Content-Type: application/json' \
  -d '{"module_permissions":[...]}'
```

**响应 (403):**
```json
{"detail":"当前用户无权访问用户管理"}
```

---

### 16. 重置员工密码 ❌

**POST** `/api/v1/employees/{employee_id}/reset-password`

**curl 示例:**
```bash
curl -b /tmp/cookies_admin2.txt -X POST 'http://10.254.253.187:8999/api/v1/employees/{employee_id}/reset-password'
```

**响应 (403):**
```json
{"detail":"当前用户无权访问用户管理"}
```

---

### 17. 更新员工状态 ❌

**PATCH** `/api/v1/employees/{employee_id}/status`

**curl 示例:**
```bash
curl -b /tmp/cookies_admin2.txt -X PATCH 'http://10.254.253.187:8999/api/v1/employees/{employee_id}/status' \
  -H 'Content-Type: application/json' \
  -d '{"is_active":false}'
```

**响应 (403):**
```json
{"detail":"当前用户无权访问用户管理"}
```

---

### 18. 删除员工 ❌

**DELETE** `/api/v1/employees/{employee_id}`

**curl 示例:**
```bash
curl -b /tmp/cookies_admin2.txt -X DELETE 'http://10.254.253.187:8999/api/v1/employees/{employee_id}'
```

**响应 (403):**
```json
{"detail":"当前用户无权访问用户管理"}
```

---

### 19. 更新员工门禁ID ❌

**PATCH** `/api/v1/employees/{employee_id}/access-control-id`

**curl 示例:**
```bash
curl -b /tmp/cookies_admin2.txt -X PATCH 'http://10.254.253.187:8999/api/v1/employees/{employee_id}/access-control-id' \
  -H 'Content-Type: application/json' \
  -d '{"access_control_id":"AC20260001"}'
```

**响应 (403):**
```json
{"detail":"当前用户无权访问用户管理"}
```

---

## 三、请假管理模块

### 20. 创建请假申请 ❌（接口可用但权限受限）

**POST** `/api/v1/leave-requests`

**curl 示例:**
```bash
curl -b /tmp/cookies_admin2.txt -X POST 'http://10.254.253.187:8999/api/v1/leave-requests' \
  -H 'Content-Type: application/json' \
  -d '{"leave_type":"annual","start_date":"2026-08-10","end_date":"2026-08-12","session":"full_day","reason":"测试"}'
```

**首次尝试响应 (201):**
```json
{
  "id": "6a6c0ab68165c73aa46106f9",
  "employee_id": "6a6af63f64f5ce007e67ab70",
  "employee_username": "admin2",
  "employee_name": "violet violet",
  "leave_type": "annual",
  "approval_status": "pending",
  "approval_chain": [
    {"user_id":"6a2f6acd...","username":"lin","full_name":"lin"},
    {"user_id":"6a2deedd...","username":"321321","full_name":"12321"}
  ],
  "current_approver_id": "6a2f6acd8d8c88ae7d154c29",
  "start_date": "2026-08-10",
  "end_date": "2026-08-12",
  "date_keys": ["2026-08-10","2026-08-11","2026-08-12"],
  "created_at": "2026-07-31T02:38:46.337000Z"
}
```

**再次尝试响应 (403):**
```json
{"detail":"当前用户无权访问该模块"}
```

> 注意：admin2 有 `employee_leave` 模块的 `can_view` 权限，但请假创建接口可能需要额外的 `can_create` 权限。首次偶然成功可能与缓存或特殊业务逻辑有关。

---

### 21. 获取请假列表 ❌

**GET** `/api/v1/leave-requests`

**curl 示例:**
```bash
curl -b /tmp/cookies_admin2.txt 'http://10.254.253.187:8999/api/v1/leave-requests?year=2026'
```

**响应 (403):**
```json
{"detail":"当前用户无权访问该模块"}
```

---

### 22. 获取"我的"请假列表 ❌

**GET** `/api/v1/leave-requests/my`

**curl 示例:**
```bash
curl -b /tmp/cookies_admin2.txt 'http://10.254.253.187:8999/api/v1/leave-requests/my'
```

**响应 (403):**
```json
{"detail":"当前用户无权访问该模块"}
```

---

### 23. 获取待我审批的请假 ❌

**GET** `/api/v1/leave-requests/approvals/my`

**curl 示例:**
```bash
curl -b /tmp/cookies_admin2.txt 'http://10.254.253.187:8999/api/v1/leave-requests/approvals/my'
```

**响应 (403):**
```json
{"detail":"当前用户无权访问该模块"}
```

---

### 24. 获取年假汇总 ✅

**GET** `/api/v1/leave-requests/annual-leave/summary?year=2026`

**curl 示例:**
```bash
curl -b /tmp/cookies_admin2.txt 'http://10.254.253.187:8999/api/v1/leave-requests/annual-leave/summary?year=2026'
```

**响应 (200):**
```json
{
  "year": 2026,
  "region": null,
  "entitlement_days": 0.0,
  "used_days": 0.0,
  "available_days": 0.0
}
```

> 年假汇总接口可正常访问，但 `admin2` 的 `region` 为 null（员工信息中未设置地区）。

---

### 25. 获取请假日历 ❌

**GET** `/api/v1/leave-requests/calendar?year=2026`

**curl 示例:**
```bash
curl -b /tmp/cookies_admin2.txt 'http://10.254.253.187:8999/api/v1/leave-requests/calendar?year=2026'
```

**响应 (403):**
```json
{"detail":"当前用户无权访问该模块"}
```

---

### 26. 获取单个请假详情 ❌

**GET** `/api/v1/leave-requests/{leave_request_id}`

**curl 示例:**
```bash
curl -b /tmp/cookies_admin2.txt 'http://10.254.253.187:8999/api/v1/leave-requests/{leave_request_id}'
```

**响应 (403):**
```json
{"detail":"当前用户无权访问该模块"}
```

---

### 27. 审批请假 ❌

**PATCH** `/api/v1/leave-requests/{leave_request_id}/approval`

**curl 示例:**
```bash
curl -b /tmp/cookies_admin2.txt -X PATCH 'http://10.254.253.187:8999/api/v1/leave-requests/{leave_request_id}/approval' \
  -H 'Content-Type: application/json' \
  -d '{"approval_status":"approved","review_comment":"同意"}'
```

**响应 (403):**
```json
{"detail":"当前用户无权访问该模块"}
```

---

### 28. 撤回请假 ❌

**PATCH** `/api/v1/leave-requests/{leave_request_id}/withdraw`

**curl 示例:**
```bash
curl -b /tmp/cookies_admin2.txt -X PATCH 'http://10.254.253.187:8999/api/v1/leave-requests/{leave_request_id}/withdraw' \
  -H 'Content-Type: application/json' \
  -d '{"withdraw_comment":"计划变更"}'
```

**响应 (403):**
```json
{"detail":"当前用户无权访问该模块"}
```

---

## 四、请假流程模块

### 29. 获取请假流程列表 ❌

**GET** `/api/v1/leave-workflows`

**curl 示例:**
```bash
curl -b /tmp/cookies_admin2.txt 'http://10.254.253.187:8999/api/v1/leave-workflows'
```

**响应 (403):**
```json
{"detail":"当前用户无权访问该模块"}
```

> admin2 没有 `leave_workflows` 模块权限，无法访问请假流程相关接口。

---

### 30. 创建请假流程 ❌

**POST** `/api/v1/leave-workflows`

**响应 (403):**
```json
{"detail":"当前用户无权访问该模块"}
```

---

### 31. 更新请假流程 ❌

**PATCH** `/api/v1/leave-workflows/{workflow_id}`

**响应 (403):**
```json
{"detail":"当前用户无权访问该模块"}
```

---

### 32. 删除请假流程 ❌

**DELETE** `/api/v1/leave-workflows/{workflow_id}`

**响应 (403):**
```json
{"detail":"当前用户无权访问该模块"}
```

---

## 五、报销管理模块

### 33. 获取报销选项 ✅

**GET** `/api/v1/claims/options`

**curl 示例:**
```bash
curl -b /tmp/cookies_admin2.txt 'http://10.254.253.187:8999/api/v1/claims/options'
```

**响应 (200):**
```json
{
  "claim_reasons": [
    {"name":"餐饮报销"},{"name":"交通报销"},{"name":"住宿报销"},
    {"name":"办公采购"},{"name":"客户接待"},{"name":"差旅报销"},{"name":"其他报销"}
  ],
  "claim_currencies": [
    {"currency_code":"CNY","to_hkd_rate":1.09},
    {"currency_code":"HKD","to_hkd_rate":1.0},
    {"currency_code":"USD","to_hkd_rate":7.8},
    {"currency_code":"MOP","to_hkd_rate":0.97}
  ]
}
```

---

### 34. 创建报销申请 ❌

**POST** `/api/v1/claims`

**curl 示例:**
```bash
curl -b /tmp/cookies_admin2.txt -X POST 'http://10.254.253.187:8999/api/v1/claims' \
  -F 'reason_code=办公采购' \
  -F 'description=测试' \
  -F 'amount=100' \
  -F 'currency=HKD' \
  -F 'attachment=@/tmp/test.txt'
```

**响应 (403):**
```json
{"detail":"当前用户无权访问该模块"}
```

---

### 35. 获取我的报销列表 ❌

**GET** `/api/v1/claims/my`

**curl 示例:**
```bash
curl -b /tmp/cookies_admin2.txt 'http://10.254.253.187:8999/api/v1/claims/my'
```

**响应 (403):**
```json
{"detail":"当前用户无权访问该模块"}
```

---

### 36. 获取我的报销历史 ❌

**GET** `/api/v1/claims/history/my`

**响应 (403):**
```json
{"detail":"当前用户无权访问该模块"}
```

---

### 37. 获取待我审批的报销 ❌

**GET** `/api/v1/claims/approvals/my`

**响应 (403):**
```json
{"detail":"当前用户无权访问该模块"}
```

---

### 38. 审批报销 ❌

**PATCH** `/api/v1/claims/{claim_request_id}/approval`

**响应 (403):**
```json
{"detail":"当前用户无权访问该模块"}
```

---

## 六、系统参数模块

### 39. 获取系统设置 ✅

**GET** `/api/v1/system-settings`

**curl 示例:**
```bash
curl -b /tmp/cookies_admin2.txt 'http://10.254.253.187:8999/api/v1/system-settings'
```

**响应 (200):**
```json
{
  "id": "6a2e8385dab3919bc45f1538",
  "departments": ["深圳研发中心","香港运营团队","香港销售","香港管理团队"],
  "positions": ["Backend Developer","Project Manager","Sales","Solutions Architect"],
  "regions": ["中国大陆","香港"],
  "modules": [/* 系统模块列表 */],
  "employee_self_editable_fields": [/* 可编辑字段 */],
  "claim_reasons": [/* 报销事由 */],
  "claim_currencies": [/* 货币列表 */],
  "regional_holidays": [/* 法定节假日 */],
  "regional_holiday_catalogs": [/* 节假日配置 */],
  "created_at": "2026-06-15T03:00:29.591000Z",
  "updated_at": "2026-07-30T23:30:02.849000Z"
}
```

---

### 40. 更新系统设置 ✅

**PUT** `/api/v1/system-settings`

**curl 示例:**
```bash
curl -b /tmp/cookies_admin2.txt -X PUT 'http://10.254.253.187:8999/api/v1/system-settings' \
  -H 'Content-Type: application/json' \
  -d '{
    "departments":["深圳研发中心","香港运营团队","香港销售","香港管理团队"],
    "positions":["Backend Developer","Project Manager","Sales"],
    "regions":["中国大陆","香港"]
  }'
```

**响应 (200):** 返回更新后的完整系统设置对象

> 注意：更新后 `modules` 和 `employee_self_editable_fields` 变为空数组，需谨慎操作。

---

### 41. 新增/更新法定节假日 ❌

**PUT** `/api/v1/system-settings/regional-holidays`

**curl 示例:**
```bash
curl -b /tmp/cookies_admin2.txt -X PUT 'http://10.254.253.187:8999/api/v1/system-settings/regional-holidays' \
  -H 'Content-Type: application/json' \
  -d '{"region":"香港","date":"2026-10-01","holiday_name":"国庆节"}'
```

**响应 (403):**
```json
{"detail":"当前用户无权访问该模块"}
```

---

### 42. 删除法定节假日 ❌

**DELETE** `/api/v1/system-settings/regional-holidays`

**响应 (403):**
```json
{"detail":"当前用户无权访问该模块"}
```

---

## 七、数据迁移模块

### 43. 导出数据 ❌

**GET** `/api/v1/data-migration/export?source=default`

**curl 示例:**
```bash
curl -b /tmp/cookies_admin2.txt 'http://10.254.253.187:8999/api/v1/data-migration/export?source=default'
```

**响应 (403):**
```json
{"detail":"当前用户无权访问该模块"}
```

---

### 44. 导入数据 ❌

**POST** `/api/v1/data-migration/import`

**响应 (403):**
```json
{"detail":"当前用户无权访问该模块"}
```

---

### 45. 备份数据 ❌

**POST** `/api/v1/data-migration/backup?source=default`

**curl 示例:**
```bash
curl -b /tmp/cookies_admin2.txt -X POST 'http://10.254.253.187:8999/api/v1/data-migration/backup?source=default'
```

**响应 (403):**
```json
{"detail":"当前用户无权访问该模块"}
```

---

### 46. 获取备份列表 ❌

**GET** `/api/v1/data-migration/backups`

**curl 示例:**
```bash
curl -b /tmp/cookies_admin2.txt 'http://10.254.253.187:8999/api/v1/data-migration/backups'
```

**响应 (403):**
```json
{"detail":"当前用户无权访问该模块"}
```

---

## 附录：系统页面路由

以下 GET 接口返回 HTML 页面：

| 路由 | 说明 | admin2 可访问 |
|---|---|---|
| `GET /login` | 登录页 | ✅ |
| `GET /employee` | 员工工作台首页 | ✅ |
| `GET /employee/change-password` | 修改密码页 | ✅ |
| `GET /employee/leave` | 员工请假页 | ⚠️ 有菜单但接口拒绝 |
| `GET /employee/profile` | 员工个人资料页 | ✅ |
| `GET /employee/approvals` | 员工审批页 | ❌ |
| `GET /employee/access-control` | 门禁ID页 | ❌ |
| `GET /employee/claims` | 报销页 | ⚠️ 有菜单但接口拒绝 |
| `GET /employee/manage/users` | 管理员 - 用户管理页 | ⚠️ 有菜单但接口拒绝 |
| `GET /employee/manage/users/{id}/profile` | 管理员 - 员工档案页 | ❌ |
| `GET /employee/manage/leave` | 管理员 - 请假管理页 | ❌ |
| `GET /employee/manage/leave-workflows` | 管理员 - 请假流程页 | ❌ |
| `GET /employee/manage/settings` | 管理员 - 系统设置页 | ⚠️ 有菜单但接口拒绝 |
| `GET /employee/manage/approvals` | 管理员 - 审批管理页 | ❌ |
| `GET /employee/manage/data-migration` | 管理员 - 数据迁移页 | ❌ |
| `GET /employee/manage/access-control` | 管理员 - 门禁ID维护页 | ❌ |

---

## admin2 账号权限汇总

### 模块级权限（can_view）

| 模块代码 | 模块名称 | 查看 | 创建 | 编辑 | 删除 | 审批 |
|---|---|---|---|---|---|---|
| employee_home | 员工工作台 | ✅ | ❌ | ❌ | ❌ | ❌ |
| employee_password | 修改密码 | ✅ | ❌ | ❌ | ❌ | ❌ |
| employee_leave | 员工请假 | ✅ | ❌ | ❌ | ❌ | ❌ |
| user_management | 用户管理 | ✅ | ❌ | ❌ | ❌ | ❌ |
| system_settings | 系统参数维护 | ✅ | ❌ | ❌ | ❌ | ❌ |
| data_migration | 数据处理维护 | ✅ | ❌ | ❌ | ❌ | ❌ |
| claim_management | 报销 Claim | ✅ | ❌ | ❌ | ❌ | ❌ |
| admin_dashboard | 统一工作台管理模块 | ❌ | ❌ | ❌ | ❌ | ❌ |
| leave_calendar | 请假管理 | ❌ | ❌ | ❌ | ❌ | ❌ |
| leave_workflows | 请假流程维护 | ❌ | ❌ | ❌ | ❌ | ❌ |
| approval_management | 审批管理 | ❌ | ❌ | ❌ | ❌ | ❌ |
| access_control | 门禁ID维护 | ❌ | ❌ | ❌ | ❌ | ❌ |

### 接口级实际测试结果

#### ✅ 可以访问的接口（共 15 个）

| 接口 | 方法 | 说明 |
|---|---|---|
| `/api/v1/auth/login` | POST | 登录 |
| `/api/v1/auth/me` | GET | 获取当前用户信息 |
| `/api/v1/auth/logout` | POST | 登出 |
| `/api/v1/auth/change-password` | POST | 修改密码 |
| `/api/v1/auth/register` | POST | 注册用户 |
| `/api/v1/employees` | GET | 获取员工列表 |
| `/api/v1/employees` | POST | 创建员工 |
| `/api/v1/employees/me/profile` | GET | 获取"我"的档案 |
| `/api/v1/employees/me/profile` | PATCH | 更新"我"的档案 |
| `/api/v1/employees/me/basic-info` | PATCH | 更新"我"的基本信息 |
| `/api/v1/employees/me/avatar` | PATCH | 更新"我"的头像 |
| `/api/v1/employees/{id}/profile` | GET | 获取指定员工档案 |
| `/api/v1/system-settings` | GET | 获取系统设置 |
| `/api/v1/system-settings` | PUT | 更新系统设置 |
| `/api/v1/leave-requests/annual-leave/summary` | GET | 获取年假汇总 |
| `/api/v1/claims/options` | GET | 获取报销选项 |

#### ❌ 无权访问的接口（共 27+ 个）

| 接口 | 方法 | 说明 | 错误信息 |
|---|---|---|---|
| `/api/v1/employees/{id}/profile` | PATCH | 更新指定员工档案 | 无权访问用户管理 |
| `/api/v1/employees/{id}/basic-info` | PATCH | 更新指定员工基本信息 | 无权访问用户管理 |
| `/api/v1/employees/{id}/permissions` | PATCH | 更新员工权限 | 无权访问用户管理 |
| `/api/v1/employees/{id}/reset-password` | POST | 重置员工密码 | 无权访问用户管理 |
| `/api/v1/employees/{id}/status` | PATCH | 更新员工状态 | 无权访问用户管理 |
| `/api/v1/employees/{id}` | DELETE | 删除员工 | 无权访问用户管理 |
| `/api/v1/employees/{id}/access-control-id` | PATCH | 更新门禁ID | 无权访问用户管理 |
| `/api/v1/employees/{id}/avatar` | PATCH | 更新指定员工头像 | 无权访问用户管理 |
| `/api/v1/employees/avatars/{username}/{file}` | GET | 获取员工头像 | 无权访问用户管理 |
| `/api/v1/leave-requests` | GET | 获取请假列表 | 无权访问该模块 |
| `/api/v1/leave-requests` | POST | 创建请假申请 | 无权访问该模块 |
| `/api/v1/leave-requests/my` | GET | 获取我的请假 | 无权访问该模块 |
| `/api/v1/leave-requests/approvals/my` | GET | 待我审批的请假 | 无权访问该模块 |
| `/api/v1/leave-requests/approvals/records/my` | GET | 我的审批历史 | 无权访问该模块 |
| `/api/v1/leave-requests/calendar` | GET | 请假日历 | 无权访问该模块 |
| `/api/v1/leave-requests/{id}` | GET | 请假详情 | 无权访问该模块 |
| `/api/v1/leave-requests/{id}/approval` | PATCH | 审批请假 | 无权访问该模块 |
| `/api/v1/leave-requests/{id}/withdraw` | PATCH | 撤回请假 | 无权访问该模块 |
| `/api/v1/leave-workflows` | GET/POST | 请假流程列表/创建 | 无权访问该模块 |
| `/api/v1/leave-workflows/{id}` | PATCH/DELETE | 更新/删除流程 | 无权访问该模块 |
| `/api/v1/claims` | POST | 创建报销 | 无权访问该模块 |
| `/api/v1/claims/my` | GET | 我的报销 | 无权访问该模块 |
| `/api/v1/claims/history/my` | GET | 报销历史 | 无权访问该模块 |
| `/api/v1/claims/approvals/my` | GET | 待审批报销 | 无权访问该模块 |
| `/api/v1/claims/{id}/approval` | PATCH | 审批报销 | 无权访问该模块 |
| `/api/v1/system-settings/regional-holidays` | PUT/DELETE | 节假日增删 | 无权访问该模块 |
| `/api/v1/system-settings/regional-holidays/range` | PUT/DELETE | 节假日区间 | 无权访问该模块 |
| `/api/v1/data-migration/*` | 全部 | 数据导出/导入/备份 | 无权访问该模块 |

---

## 权限对比说明

### `admin2` vs `lin` 权限差异

| 对比项 | admin2 | lin |
|---|---|---|
| **模块数量** | 7 个模块 | 12 个模块 |
| **有全部权限的模块** | 0 | 0 |
| **员工管理访问** | ✅ 可查看列表、创建员工 | ✅ 可查看列表 |
| **员工写操作** | ✅ 可创建 | ❌ 只读 |
| **员工删除/重置** | ❌ 无权访问 | ❌ 无权访问 |
| **请假模块访问** | ⚠️ 仅年假汇总 | ✅ 完整访问 |
| **报销模块访问** | ⚠️ 仅选项 | ✅ 完整访问 |
| **系统设置** | ✅ 可读写 | ✅ 只读 |
| **数据迁移** | ❌ 无权访问 | ❌ 无权访问 |
| **请假流程** | ❌ 无权访问 | ✅ 只读 |
| **审批管理** | ❌ 无权访问 | ✅ 只读 |
| **门禁ID** | ❌ 无权访问 | ❌ 无权访问 |
| **无访问权限模块** | 5 个 (admin_dashboard, leave_calendar, leave_workflows, approval_management, access_control) | 0 个 |

### 关键发现

1. **`admin2` 的 `user_id` 为 10**，`lin` 的 `user_id` 为 5，admin2 是较新创建的账号
2. **`admin2` 缺少 5 个模块权限**，特别是没有请假审批、流程维护、审批管理等管理功能模块
3. **`admin2` 可以创建员工**（POST /employees），但无法删除/重置/修改员工权限
4. **`admin2` 可以更新系统设置**（PUT /system-settings），但无法操作节假日
5. **`admin2` 的 `department`、`region`、`position` 均为 null**，说明员工信息未完善
6. 请假创建接口在 admin2 上存在不一致行为（首次成功，后续失败），可能与后端业务逻辑的特殊处理有关
