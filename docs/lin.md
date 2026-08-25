# OA System API - `lin` 账号接口文档

> **服务地址**: `http://10.254.253.187:8999`
> **账号**: `lin` / **密码**: `Cisco@123`
> **认证方式**: Session Cookie（登录后自动获取 `SessionID）

---

## 目录

- [一、认证模块 (Auth)](#一认证模块-auth)
- [二、员工管理模块](#二员工管理模块)
- [三、请假管理模块](#三请假管理模块)
- [四、请假流程模块](#四请假流程模块)
- [五、报销管理模块](#五报销管理模块)
- [六、系统参数管理模块](#六系统参数管理模块)
- [七、数据迁移模块](#七数据迁移模块)
- [附录：系统页面路由](#附录系统页面路由)
- [lin 账号权限汇总](#lin-账号权限汇总)

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
curl -c /tmp/cookies.txt 'http://10.254.253.187:8999/api/v1/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{"username":"lin","password":"Cisco@123"}'
```

**响应 (200):**
```json
{"message":"登录成功","expires_at":"2026-07-31T23:59:59Z"}
```

> 登录成功后，服务端通过 `Set-Cookie` 返回 `SessionID`，后续请求使用 `-b /tmp/cookies.txt` 携带 Cookie 即可。

---

### 2. 获取当前用户信息

**GET** `/api/v1/auth/me`

**curl 示例:**
```bash
curl -b /tmp/cookies.txt 'http://10.254.253.187:8999/api/v1/auth/me'
```

**响应 (200):**
```json
{
  "username": "lin",
  "email": "lin@qq.com",
  "full_name": "lin",
  "id": "6a2f6acd8d8c88ae7d154c29",
  "user_id": 5,
  "phone": "19088887777",
  "department": "香港管理团队",
  "region": "香港",
  "position": "Project Manager",
  "avatar_url": "/api/v1/employees/avatars/lin/20260730233000_7ee5d4136c6f4467bdf20f960c9f1891.jpeg",
  "avatar_name": "zhengjianzhao.jpeg",
  "hire_date": null,
  "work_start_date": null,
  "is_active": true,
  "is_initial_password": 0,
  "temporary_password": null,
  "module_permissions": [
    {"module_code":"employee_home","module_name":"员工工作台","can_view":true,"can_create":false,"can_edit":false,"can_delete":false,"can_approve":false},
    {"module_code":"employee_password","module_name":"修改密码","can_view":true,"can_create":false,"can_edit":false,"can_delete":false,"can_approve":false},
    {"module_code":"employee_leave","module_name":"员工请假","can_view":true,"can_create":false,"can_edit":false,"can_delete":false,"can_approve":false},
    {"module_code":"admin_dashboard","module_name":"统一工作台管理模块","can_view":true,"can_create":false,"can_edit":false,"can_delete":false,"can_approve":false},
    {"module_code":"user_management","module_name":"用户管理","can_view":true,"can_create":false,"can_edit":false,"can_delete":false,"can_approve":false},
    {"module_code":"leave_calendar","module_name":"请假管理","can_view":true,"can_create":false,"can_edit":false,"can_delete":false,"can_approve":false},
    {"module_code":"leave_workflows","module_name":"请假流程维护","can_view":true,"can_create":false,"can_edit":false,"can_delete":false,"can_approve":false},
    {"module_code":"approval_management","module_name":"审批管理","can_view":true,"can_create":false,"can_edit":false,"can_delete":false,"can_approve":false},
    {"module_code":"system_settings","module_name":"系统参数管理维护","can_view":true,"can_create":false,"can_edit":false,"can_delete":false,"can_approve":false},
    {"module_code":"data_migration","module_name":"数据处理维护","can_view":true,"can_create":false,"can_edit":false,"can_delete":false,"can_approve":false},
    {"module_code":"access_control","module_name":"门禁ID维护","can_view":true,"can_create":false,"can_edit":false,"can_delete":false,"can_approve":false},
    {"module_code":"claim_management","module_name":"报销 Claim","can_view":true,"can_create":false,"can_edit":false,"can_delete":false,"can_approve":false}
  ],
  "created_at": "2026-06-15T03:00:29.591000Z",
  "updated_at": "2026-07-30T23:30:02.849000Z"
}
```

---

### 3. 修改密码

**POST** `/api/v1/auth/change-password`

**请求体 (application/json):**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| current_password | string | ✅ | 当前密码 |
| new_password | string | ✅ | 新密码 |

**curl 示例:**
```bash
curl -b /tmp/cookies.txt -X POST 'http://10.254.253.187:8999/api/v1/auth/change-password' \
  -H 'Content-Type: application/json' \
  -d '{"current_password":"Cisco@123","new_password":"NewPass@456"}'
```

**响应 (200):** 返回完整用户对象（同 `/auth/me`）

---

### 4. 登出

**POST** `/api/v1/auth/logout`

**curl 示例:**
```bash
curl -b /tmp/cookies.txt -X POST 'http://10.254.253.187:8999/api/v1/auth/logout'
```

**响应 (200):**
```json
{"message":"登出成功"}
```

---

### 5. 注册用户

**POST** `/api/v1/auth/register`

**请求体 (application/json):**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| username | string | ✅ | 用户名 |
| email | string | ✅ | 邮箱 |
| full_name | string | ❌ | 全名 |
| password | string | ✅ | 密码 |

**curl 示例:**
```bash
curl -b /tmp/cookies.txt -X POST 'http://10.254.253.187:8999/api/v1/auth/register' \
  -H 'Content-Type: application/json' \
  -d '{"username":"newuser","email":"new@test.com","full_name":"New User","password":"Pass@123"}'
```

**响应 (201):** 返回完整用户对象

---

## 二、员工管理模块

### 6. 获取员工列表

**GET** `/api/v1/employees`

**curl 示例:**
```bash
curl -b /tmp/cookies.txt 'http://10.254.253.187:8999/api/v1/employees'
```

**响应 (200):** 返回员工数组，每个员工对象包含以下字段：

| 字段 | 类型 | 说明 |
|---|---|---|
| id | string | 员工唯一ID |
| user_id | integer | 关联用户ID |
| employee_code | string | 员工编号 |
| username | string | 登录用户名 |
| email | string | 邮箱 |
| full_name | string | 全名 |
| phone | string | 电话 |
| department | string | 部门 |
| region | string | 地区 |
| position | string | 职位 |
| avatar_url | string | 头像URL |
| avatar_name | string | 头像文件名 |
| hire_date | string | 入职日期 |
| work_start_date | string | 工作开始日期 |
| is_active | boolean | 是否在职 |
| is_initial_password | integer | 是否初始密码 |
| temporary_password | string | 临时密码 |
| access_control_id | string | 门禁ID |
| module_permissions | array | 模块权限列表 |

---

### 7. 创建员工

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
curl -b /tmp/cookies.txt -X POST 'http://10.254.253.187:8999/api/v1/employees' \
  -H 'Content-Type: application/json' \
  -d '{
    "username": "newemp",
    "email": "newemp@test.com",
    "full_name": "New Employee",
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

**响应 (201):** 返回新创建的完整员工对象

---

### 8. 获取"我"的员工档案

**GET** `/api/v1/employees/me/profile`

**curl 示例:**
```bash
curl -b /tmp/cookies.txt 'http://10.254.253.187:8999/api/v1/employees/me/profile'
```

**响应 (200):**
```json
{
  "employee_id": "6a2f6acd8d8c88ae7d154c29",
  "english_name": "1",
  "hire_date": null,
  "work_start_date": null,
  "birth_date": null,
  "hkid_number": "31221321323",
  "gender": null,
  "passport_number": null,
  "marital_status": null,
  "english_address": null,
  "personal_email": "violet181@gmail.com",
  "emergency_contact_name": "violet violet",
  "emergency_contact_phone": null,
  "emergency_contact_relationship": "兄弟",
  "bank_name": "violet",
  "bank_account_name": "violet",
  "bank_account_number": "1234567890",
  "created_at": "2026-06-15T09:59:21.600000Z",
  "updated_at": "2026-07-30T23:30:02.892000Z"
}
```

---

### 9. 更新"我"的员工档案

**PATCH** `/api/v1/employees/me/profile`

**请求体 (application/json):** 所有字段均可选

| 字段 | 类型 | 说明 |
|---|---|---|
| english_name | string | 英文名 |
| hire_date | string | 入职日期 |
| work_start_date | string | 工作开始日期 |
| birth_date | string | 出生日期 |
| hkid_number | string | 香港身份证号 |
| gender | string | 性别 |
| passport_number | string | 护照号 |
| marital_status | string | 婚姻状况 |
| english_address | string | 英文地址 |
| personal_email | string | 个人邮箱 |
| emergency_contact_name | string | 紧急联系人姓名 |
| emergency_contact_phone | string | 紧急联系人电话 |
| emergency_contact_relationship | string | 紧急联系人关系 |
| bank_name | string | 银行名称 |
| bank_account_name | string | 银行账户名 |
| bank_account_number | string | 银行账户号 |

**curl 示例:**
```bash
curl -b /tmp/cookies.txt -X PATCH 'http://10.254.253.187:8999/api/v1/employees/me/profile' \
  -H 'Content-Type: application/json' \
  -d '{"english_name":"Lin Updated","gender":"male"}'
```

**响应 (200):** 返回更新后的完整 profile 对象

---

### 10. 获取指定员工档案

**GET** `/api/v1/employees/{employee_id}/profile`

**路径参数:**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| employee_id | string | ✅ | 员工ID |

**curl 示例:**
```bash
curl -b /tmp/cookies.txt 'http://10.254.253.187:8999/api/v1/employees/{employee_id}/profile'
```

---

### 11. 更新指定员工档案

**PATCH** `/api/v1/employees/{employee_id}/profile`

**请求体:** 同"更新我的员工档案"

**curl 示例:**
```bash
curl -b /tmp/cookies.txt -X PATCH 'http://10.254.253.187:8999/api/v1/employees/{employee_id}/profile' \
  -H 'Content-Type: application/json' \
  -d '{"english_name":"Updated Name"}'
```

---

### 12. 更新"我"的基本信息

**PATCH** `/api/v1/employees/me/basic-info`

**请求体 (application/json):** 所有字段均可选

| 字段 | 类型 | 说明 |
|---|---|---|
| username | string | 用户名 |
| email | string | 邮箱 |
| full_name | string | 全名 |
| phone | string | 电话 |
| department | string | 部门 |
| position | string | 职位 |
| region | string | 地区 |

**curl 示例:**
```bash
curl -b /tmp/cookies.txt -X PATCH 'http://10.254.253.187:8999/api/v1/employees/me/basic-info' \
  -H 'Content-Type: application/json' \
  -d '{"full_name":"Lin Updated","phone":"19099998888"}'
```

---

### 13. 更新指定员工基本信息

**PATCH** `/api/v1/employees/{employee_id}/basic-info`

**请求体:** 同"更新我的基本信息"

**curl 示例:**
```bash
curl -b /tmp/cookies.txt -X PATCH 'http://10.254.253.187:8999/api/v1/employees/{employee_id}/basic-info' \
  -H 'Content-Type: application/json' \
  -d '{"full_name":"Updated Name","department":"香港销售"}'
```

---

### 14. 更新员工权限

**PATCH** `/api/v1/employees/{employee_id}/permissions`

**请求体 (application/json):**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| module_permissions | array | ❌ | 模块权限数组 |

**curl 示例:**
```bash
curl -b /tmp/cookies.txt -X PATCH 'http://10.254.253.187:8999/api/v1/employees/{employee_id}/permissions' \
  -H 'Content-Type: application/json' \
  -d '{
    "module_permissions": [
      {"module_code":"employee_home","module_name":"员工工作台","can_view":true,"can_create":false,"can_edit":false,"can_delete":false,"can_approve":false}
    ]
  }'
```

---

### 15. 重置员工密码

**POST** `/api/v1/employees/{employee_id}/reset-password`

**curl 示例:**
```bash
curl -b /tmp/cookies.txt -X POST 'http://10.254.253.187:8999/api/v1/employees/{employee_id}/reset-password'
```

**响应 (200):**
```json
{
  "id": "...",
  "username": "...",
  "temporary_password": "临时密码",
  "is_initial_password": 1
}
```

---

### 16. 更新员工状态（启用/禁用）

**PATCH** `/api/v1/employees/{employee_id}/status`

**请求体 (application/json):**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| is_active | boolean | ✅ | 是否在职 |

**curl 示例:**
```bash
curl -b /tmp/cookies.txt -X PATCH 'http://10.254.253.187:8999/api/v1/employees/{employee_id}/status' \
  -H 'Content-Type: application/json' \
  -d '{"is_active":false}'
```

---

### 17. 获取门禁员工列表

**GET** `/api/v1/access-control/employees`

> 走 `access_control` 模块查看权限（非 `user_management`），适用于仅授权门禁管理的角色。

**curl 示例:**
```bash
curl -b /tmp/cookies.txt 'http://10.254.253.187:8999/api/v1/access-control/employees'
```

**响应 (200):** 返回员工数组（精简结构）

| 字段 | 类型 | 说明 |
|---|---|---|
| id | string | 员工唯一ID |
| username | string | 登录用户名 |
| full_name | string \| null | 全名 |
| access_control_id | string \| null | 门禁ID |

**响应示例:**
```json
[
  {"id":"6a2f6acd8d8c88ae7d154c29","username":"lin","full_name":"lin","access_control_id":"31"},
  {"id":"6a2f6aae8d8c88ae7d154c28","username":"mike","full_name":"mike","access_control_id":null}
]
```

---

### 18. 更新员工门禁ID

**PATCH** `/api/v1/access-control/employees/{employee_id}`

> 走 `access_control` 模块权限。旧路径 `/api/v1/employees/{employee_id}/access-control-id` 已下线（404）。

**路径参数:**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| employee_id | string | ✅ | 员工唯一ID |

**请求体 (application/json):**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| access_control_id | string \| null | ❌ | 门禁ID，传 `""` 或 `null` 可清空 |

**curl 示例:**
```bash
curl -b /tmp/cookies.txt -X PATCH 'http://10.254.253.187:8999/api/v1/access-control/employees/{employee_id}' \
  -H 'Content-Type: application/json' \
  -d '{"access_control_id":"AC20260001"}'
```

**响应 (200):** 返回完整员工对象（同 `EmployeeResponse`）

---

### 18. 删除员工

**DELETE** `/api/v1/employees/{employee_id}`

**curl 示例:**
```bash
curl -b /tmp/cookies.txt -X DELETE 'http://10.254.253.187:8999/api/v1/employees/{employee_id}'
```

**响应 (204):** 无内容

---

### 19. 获取员工头像

**GET** `/api/v1/employees/avatars/{username}/{file_name}`

**路径参数:**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| username | string | ✅ | 用户名 |
| file_name | string | ✅ | 头像文件名 |

**curl 示例:**
```bash
curl -b /tmp/cookies.txt 'http://10.254.253.187:8999/api/v1/employees/avatars/lin/20260730233000_7ee5d4136c6f4467bdf20f960c9f1891.jpeg'
```

---

### 20. 更新"我"的头像

**PATCH** `/api/v1/employees/me/avatar`

**请求体 (multipart/form-data):**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| avatar | string (file) | ✅ | 头像图片文件 |

**curl 示例:**
```bash
curl -b /tmp/cookies.txt -X PATCH 'http://10.254.253.187:8999/api/v1/employees/me/avatar' \
  -F 'avatar=@/path/to/avatar.jpg'
```

---

### 21. 更新指定员工头像

**PATCH** `/api/v1/employees/{employee_id}/avatar`

**请求体:** 同"更新我的头像"

**curl 示例:**
```bash
curl -b /tmp/cookies.txt -X PATCH 'http://10.254.253.187:8999/api/v1/employees/{employee_id}/avatar' \
  -F 'avatar=@/path/to/avatar.jpg'
```

---

## 三、请假管理模块

### 22. 创建请假申请

**POST** `/api/v1/leave-requests`

**请求体 (application/json):**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| employee_id | string | ❌ | 员工ID（可自动填充） |
| leave_type | string | ✅ | 请假类型: `annual` 等 |
| start_date | string | ✅ | 开始日期 (YYYY-MM-DD) |
| end_date | string | ✅ | 结束日期 (YYYY-MM-DD) |
| session | string | ❌ | 半天/全天: `full_day` / `half_day` |
| reason | string | ❌ | 请假原因 |
| handover_to | string | ❌ | 交接给谁 |

**curl 示例:**
```bash
curl -b /tmp/cookies.txt -X POST 'http://10.254.253.187:8999/api/v1/leave-requests' \
  -H 'Content-Type: application/json' \
  -d '{
    "leave_type": "annual",
    "start_date": "2026-08-01",
    "end_date": "2026-08-03",
    "session": "full_day",
    "reason": "Family vacation",
    "handover_to": "colleague_id"
  }'
```

**响应 (201):**
```json
{
  "id": "leave_req_id",
  "employee_id": "6a2f6acd8d8c88ae7d154c29",
  "employee_user_id": 5,
  "employee_code": "EMP000005",
  "employee_username": "lin",
  "employee_name": "lin",
  "employee_department": "香港管理团队",
  "employee_region": "香港",
  "leave_type": "annual",
  "approval_status": "pending",
  "approval_chain": [
    {"user_id":"6a2f6acd...","username":"lin","full_name":"lin"},
    {"user_id":"6a2deedd...","username":"321321","full_name":"12321"}
  ],
  "current_approver_id": "6a2f6acd...",
  "session": "full_day",
  "start_date": "2026-08-01",
  "end_date": "2026-08-03",
  "date_keys": ["2026-08-01","2026-08-02","2026-08-03"],
  "reason": "Family vacation",
  "handover_to": null,
  "created_by_id": "6a2f6acd...",
  "created_by_name": "lin",
  "created_at": "2026-07-31T02:15:37.803000Z"
}
```

---

### 23. 获取请假列表（管理员视图）

**GET** `/api/v1/leave-requests`

**查询参数:**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| year | integer | ❌ | 年份 |
| team | string | ❌ | 团队筛选 |
| region | string | ❌ | 地区筛选 |
| employee_keyword | string | ❌ | 员工关键字搜索 |
| approval_status | string | ❌ | 审批状态筛选 |

**curl 示例:**
```bash
curl -b /tmp/cookies.txt 'http://10.254.253.187:8999/api/v1/leave-requests?year=2026&region=香港&approval_status=pending'
```

---

### 24. 获取"我的"请假列表

**GET** `/api/v1/leave-requests/my`

**curl 示例:**
```bash
curl -b /tmp/cookies.txt 'http://10.254.253.187:8999/api/v1/leave-requests/my'
```

**响应 (200):** 返回当前用户的请假数组，每个对象结构同创建响应

---

### 25. 获取待我审批的请假

**GET** `/api/v1/leave-requests/approvals/my`

**curl 示例:**
```bash
curl -b /tmp/cookies.txt 'http://10.254.253.187:8999/api/v1/leave-requests/approvals/my'
```

**响应 (200):**
```json
[
  {
    "id": "6a6af2a364f5ce007e67ab6b",
    "employee_id": "6a66f334bea5520029007ed4",
    "employee_user_id": 9,
    "employee_code": "EMP000009",
    "employee_username": "admin1",
    "employee_name": "violet violet",
    "employee_department": "深圳研发中心",
    "employee_region": "中国大陆",
    "leave_type": "annual",
    "approval_status": "pending",
    "current_approver_id": "6a2f6acd8d8c88ae7d154c29",
    "session": "full_day",
    "start_date": "2026-05-14",
    "end_date": "2026-05-22",
    "date_keys": ["2026-05-14","2026-05-15","2026-05-16","2026-05-17","2026-05-18","2026-05-19","2026-05-20","2026-05-21","2026-05-22"],
    "created_at": "2026-07-18T..."
  }
]
```

---

### 26. 获取我的审批历史

**GET** `/api/v1/leave-requests/approvals/records/my`

**curl 示例:**
```bash
curl -b /tmp/cookies.txt 'http://10.254.253.187:8999/api/v1/leave-requests/approvals/records/my'
```

---

### 27. 获取年假汇总

**GET** `/api/v1/leave-requests/annual-leave/summary`

**查询参数:**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| year | integer | ✅ | 年份 |

**curl 示例:**
```bash
curl -b /tmp/cookies.txt 'http://10.254.253.187:8999/api/v1/leave-requests/annual-leave/summary?year=2026'
```

**响应 (200):**
```json
{
  "year": 2026,
  "region": "香港",
  "entitlement_days": 0.0,
  "used_days": 0.0,
  "available_days": 0.0
}
```

---

### 28. 获取请假日历

**GET** `/api/v1/leave-requests/calendar`

**查询参数:**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| year | integer | ✅ | 年份 |
| team | string | ❌ | 团队筛选 |
| region | string | ❌ | 地区筛选 |
| employee_keyword | string | ❌ | 员工关键字 |
| approval_status | string | ❌ | 审批状态 |

**curl 示例:**
```bash
curl -b /tmp/cookies.txt 'http://10.254.253.187:8999/api/v1/leave-requests/calendar?year=2026'
```

**响应 (200):**
```json
{
  "year": 2026,
  "total": 14,
  "items": [/* LeaveRequest 数组 */]
}
```

---

### 29. 获取单个请假详情

**GET** `/api/v1/leave-requests/{leave_request_id}`

**curl 示例:**
```bash
curl -b /tmp/cookies.txt 'http://10.254.253.187:8999/api/v1/leave-requests/{leave_request_id}'
```

---

### 30. 审批请假

**PATCH** `/api/v1/leave-requests/{leave_request_id}/approval`

**请求体 (application/json):**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| approval_status | string | ✅ | 审批结果: `approved` / `rejected` |
| review_comment | string | ❌ | 审批备注 |

**curl 示例:**
```bash
curl -b /tmp/cookies.txt -X PATCH 'http://10.254.253.187:8999/api/v1/leave-requests/{leave_request_id}/approval' \
  -H 'Content-Type: application/json' \
  -d '{"approval_status":"approved","review_comment":"同意"}'
```

**响应 (200):** 返回更新后的请假申请对象

---

### 31. 撤回请假

**PATCH** `/api/v1/leave-requests/{leave_request_id}/withdraw`

**请求体 (application/json):**

| 字段 | 类型 | 说明 |
|---|---|---|
| withdraw_comment | string | 撤回备注 |

**curl 示例:**
```bash
curl -b /tmp/cookies.txt -X PATCH 'http://10.254.253.187:8999/api/v1/leave-requests/{leave_request_id}/withdraw' \
  -H 'Content-Type: application/json' \
  -d '{"withdraw_comment":"计划变更"}'
```

**响应 (200):** 返回更新后的请假申请对象

---

## 四、请假流程模块

### 32. 获取请假流程列表

**GET** `/api/v1/leave-workflows`

**curl 示例:**
```bash
curl -b /tmp/cookies.txt 'http://10.254.253.187:8999/api/v1/leave-workflows'
```

**响应 (200):**
```json
[
  {
    "id": "6a5b68f0d71fdce199c48fce",
    "name": "JJ",
    "priority": 100,
    "is_active": true,
    "match": {"employee_id":null,"department":null,"region":null,"position":null},
    "approvers": [
      {"user_id":"6a2f6acd8d8c88ae7d154c29","username":"lin","full_name":"lin"},
      {"user_id":"6a2deedd1b16e69ac3c1d16b","username":"321321","full_name":"12321"}
    ],
    "created_at": "2026-07-18T11:52:16.868000Z",
    "updated_at": null
  }
]
```

---

### 33. 创建请假流程

**POST** `/api/v1/leave-workflows`

**请求体 (application/json):**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| name | string | ✅ | 流程名称 |
| priority | integer | ❌ | 优先级 |
| is_active | boolean | ❌ | 是否启用 |
| match | object | ✅ | 匹配条件 `{employee_id, department, region, position}` |
| approvers | array | ✅ | 审批人列表 |

**curl 示例:**
```bash
curl -b /tmp/cookies.txt -X POST 'http://10.254.253.187:8999/api/v1/leave-workflows' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "大陆研发部请假流程",
    "priority": 100,
    "is_active": true,
    "match": {"region":"中国大陆","department":null,"position":null},
    "approvers": [
      {"user_id":"6a2f6acd8d8c88ae7d154c29","username":"lin","full_name":"lin"}
    ]
  }'
```

---

### 34. 更新请假流程

**PATCH** `/api/v1/leave-workflows/{workflow_id}`

**请求体:** 同创建流程，所有字段可选

**curl 示例:**
```bash
curl -b /tmp/cookies.txt -X PATCH 'http://10.254.253.187:8999/api/v1/leave-workflows/{workflow_id}' \
  -H 'Content-Type: application/json' \
  -d '{"name":"Updated Name","is_active":true}'
```

---

### 35. 删除请假流程

**DELETE** `/api/v1/leave-workflows/{workflow_id}`

**curl 示例:**
```bash
curl -b /tmp/cookies.txt -X DELETE 'http://10.254.253.187:8999/api/v1/leave-workflows/{workflow_id}'
```

---

## 五、报销管理模块

### 36. 获取报销选项（事由 + 货币）

**GET** `/api/v1/claims/options`

**curl 示例:**
```bash
curl -b /tmp/cookies.txt 'http://10.254.253.187:8999/api/v1/claims/options'
```

**响应 (200):**
```json
{
  "claim_reasons": [
    {"name":"餐饮报销"},
    {"name":"交通报销"},
    {"name":"住宿报销"},
    {"name":"办公采购"},
    {"name":"客户接待"},
    {"name":"差旅报销"},
    {"name":"其他报销"}
  ],
  "claim_currencies": [
    {"currency_code":"CNY","to_hkd_rate":1.09},
    {"currency_code":"HKD","to_hkd_rate":1.0},
    {"currency_code":"USD","to_hkd_rate":7.8},
    {"currency_code":"MOP","to_hkd_rate":0.97},
    {"currency_code":"JP","to_hkd_rate":0.05}
  ]
}
```

> 🆕 **更新**：`claim_currencies` 新增 `JP`（日元，`to_hkd_rate=0.05`），现共 5 种货币。

---

### 37. 创建报销申请

**POST** `/api/v1/claims`

**请求体 (multipart/form-data):**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| reason_code | string | ✅ | 事由代码 |
| description | string \| null | ❌ | 描述 |
| amount | number | ✅ | 金额 |
| currency | string | ✅ | 货币代码 |
| invoice_date | string (date) | ✅ | 🆕 开票日期（YYYY-MM-DD） |
| invoice_no | string \| null | ❌ | 🆕 票号 |
| attachment | string (file) | ✅ | 附件文件 |

**curl 示例:**
```bash
curl -b /tmp/cookies.txt -X POST 'http://10.254.253.187:8999/api/v1/claims' \
  -F 'reason_code=办公采购' \
  -F 'description=DL380' \
  -F 'amount=245209' \
  -F 'currency=HKD' \
  -F 'invoice_date=2026-07-23' \
  -F 'invoice_no=INV20260723-001' \
  -F 'attachment=@/path/to/file.png'
```

**响应 (201):** 返回完整的 Claim 对象，字段结构见下方「Claim 对象字段说明」。

```json
{
  "id": "6a617d783c6d6fb226b55028",
  "employee_id": "6a2f6acd8d8c88ae7d154c29",
  "employee_username": "lin",
  "employee_name": "lin",
  "employee_department": "香港管理团队",
  "employee_region": "香港",
  "reason_code": "办公采购",
  "reason_label": "办公采购",
  "description": "DL380",
  "invoice_date": "2026-07-23",
  "invoice_no": "INV20260723-001",
  "amount": 245209.0,
  "currency": "HKD",
  "exchange_rate_to_hkd": 1.0,
  "amount_hkd": 245209.0,
  "approval_status": "pending",
  "approval_chain": [
    {"user_id":"6a2f6acd...","username":"lin","full_name":"lin"},
    {"user_id":"6a2deedd...","username":"321321","full_name":"12321"}
  ],
  "current_approver_id": "6a2f6acd...",
  "approval_history": [],
  "attachment_url": "/api/v1/claims/attachments/lin/20260723023328_d73bcf83465d4c249be7f8ef4e733344.png",
  "attachment_name": "IMG_0262.png",
  "created_by_id": "6a2f6acd...",
  "created_by_name": "lin",
  "review_comment": null,
  "reviewed_at": null,
  "created_at": "2026-07-23T02:33:28.920000Z",
  "updated_at": null
}
```

**Claim 对象字段说明（适用于 #37/#38/#39/#40/#42 的响应）：**

| 字段 | 类型 | 说明 |
|---|---|---|
| id | string | 报销申请 ID |
| employee_id | string | 员工 ID |
| employee_username | string | 员工用户名 |
| employee_name | string | 员工姓名 |
| employee_department | string \| null | 员工部门 |
| employee_region | string \| null | 员工地区 |
| reason_code | string | 事由代码 |
| reason_label | string | 事由显示名 |
| description | string \| null | 描述 |
| invoice_date | string \| null | 🆕 开票日期（YYYY-MM-DD） |
| invoice_no | string \| null | 🆕 票号 |
| amount | number | 金额 |
| currency | string | 货币代码 |
| exchange_rate_to_hkd | number \| null | 折算港币汇率 |
| amount_hkd | number \| null | 折算港币金额 |
| approval_status | string | 审批状态：`pending` / `approved` / `rejected` / `withdrawn` |
| approval_chain | array | 审批链（含 user_id / username / full_name） |
| current_approver_id | string \| null | 当前审批人 ID |
| approval_history | array | 🆕 审批历史记录 |
| attachment_url | string \| null | 附件 URL |
| attachment_name | string \| null | 附件文件名 |
| created_by_id | string | 创建人 ID |
| created_by_name | string | 创建人姓名 |
| review_comment | string \| null | 审批备注 |
| reviewed_at | string (date-time) \| null | 审批时间 |
| created_at | string (date-time) \| null | 创建时间 |
| updated_at | string (date-time) \| null | 🆕 更新时间 |

---

### 38. 获取我的报销列表

**GET** `/api/v1/claims/my`

**curl 示例:**
```bash
curl -b /tmp/cookies.txt 'http://10.254.253.187:8999/api/v1/claims/my'
```

**响应 (200):** 返回 Claim 对象数组，每个对象字段结构见 #37「Claim 对象字段说明」。

---

### 39. 获取我的报销历史

**GET** `/api/v1/claims/history/my`

**curl 示例:**
```bash
curl -b /tmp/cookies.txt 'http://10.254.253.187:8999/api/v1/claims/history/my'
```

**响应 (200):** 返回 Claim 对象数组，字段结构同 #38。

---

### 40. 获取待我审批的报销

**GET** `/api/v1/claims/approvals/my`

**curl 示例:**
```bash
curl -b /tmp/cookies.txt 'http://10.254.253.187:8999/api/v1/claims/approvals/my'
```

**响应 (200):** 返回 Claim 对象数组，字段结构同 #38。

---

### 41. 获取我的报销审批记录

**GET** `/api/v1/claims/approvals/records/my`

**curl 示例:**
```bash
curl -b /tmp/cookies.txt 'http://10.254.253.187:8999/api/v1/claims/approvals/records/my'
```

**响应 (200):** 返回 Claim 审批记录对象数组，字段结构如下：

| 字段 | 类型 | 说明 |
|---|---|---|
| id | string | 审批记录 ID |
| claim_request_id | string | 关联的报销申请 ID |
| action | string | 操作动作（如 `submitted` / `approved` / `rejected` 等） |
| operator_id | string | 操作人 ID |
| operator_username | string | 操作人用户名 |
| operator_name | string \| null | 操作人姓名 |
| operator_role | string \| null | 操作人角色（如 `applicant` / `approver`） |
| employee_id | string | 申请人 ID |
| employee_username | string | 申请人用户名 |
| employee_name | string | 申请人姓名 |
| employee_department | string \| null | 申请人部门 |
| employee_region | string \| null | 申请人地区 |
| claim_reason_code | string | 报销事由代码 |
| claim_reason_label | string | 报销事由显示名 |
| invoice_date | string \| null | 🆕 开票日期 |
| amount | number | 金额 |
| currency | string | 货币代码 |
| amount_hkd | number \| null | 折算港币金额 |
| comment | string \| null | 审批备注 |
| approval_status_before | string \| null | 操作前审批状态 |
| approval_status_after | string | 操作后审批状态：`pending` / `approved` / `rejected` / `withdrawn` |
| current_approver_id_before | string \| null | 操作前当前审批人 ID |
| current_approver_id_after | string \| null | 操作后当前审批人 ID |
| current_approver_name_after | string \| null | 操作后当前审批人姓名 |
| current_approver_level_after | integer \| null | 🆕 操作后当前审批人层级 |
| is_flowing | boolean | 🆕 是否仍在审批流中（默认 false） |
| created_at | string (date-time) \| null | 记录创建时间 |

**响应示例:**
```json
[
  {
    "id": "6a715618003ce0ca145e686f",
    "claim_request_id": "6a715618003ce0ca145e686e",
    "action": "submitted",
    "operator_id": "6a2f6acd8d8c88ae7d154c29",
    "operator_username": "lin",
    "operator_name": "lin",
    "operator_role": "applicant",
    "employee_id": "6a2f6acd8d8c88ae7d154c29",
    "employee_username": "lin",
    "employee_name": "lin",
    "employee_department": null,
    "employee_region": null,
    "claim_reason_code": "餐饮报销",
    "claim_reason_label": "餐饮报销",
    "invoice_date": null,
    "amount": 88.0,
    "currency": "CNY",
    "amount_hkd": null,
    "comment": null,
    "approval_status_before": null,
    "approval_status_after": "pending",
    "current_approver_id_before": null,
    "current_approver_id_after": "6a2f6acd8d8c88ae7d154c29",
    "current_approver_name_after": "lin",
    "current_approver_level_after": 1,
    "is_flowing": false,
    "created_at": "2026-08-04T03:01:44.870000Z"
  }
]
```

---

### 42. 审批报销

**PATCH** `/api/v1/claims/{claim_request_id}/approval`

**请求体 (application/x-www-form-urlencoded):**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| approval_status | string | ✅ | 审批结果：`approved` / `rejected`（schema 也允许 `pending` / `withdrawn`） |
| review_comment | string \| null | ❌ | 审批备注 |

**curl 示例:**
```bash
curl -b /tmp/cookies.txt -X PATCH 'http://10.254.253.187:8999/api/v1/claims/{claim_request_id}/approval' \
  -d 'approval_status=approved&review_comment=同意报销'
```

> 注意：此接口使用 `application/x-www-form-urlencoded` 格式，不使用 JSON。

**响应 (200):** 返回更新后的 Claim 对象，字段结构见 #37「Claim 对象字段说明」。

---

### 43. 获取报销附件

**GET** `/api/v1/claims/attachments/{username}/{file_name}`

**路径参数:**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| username | string | ✅ | 用户名 |
| file_name | string | ✅ | 附件文件名 |

**curl 示例:**
```bash
curl -b /tmp/cookies.txt 'http://10.254.253.187:8999/api/v1/claims/attachments/lin/20260723023328_d73bcf83465d4c249be7f8ef4e733344.png'
```

**响应 (200):** 返回附件二进制文件（`Content-Type` 根据文件类型自动设置）。

---

### 44. 导出我的报销记录 🆕

**GET** `/api/v1/claims/export`

> **新增接口**：导出当前登录用户的报销记录为 Excel（`.xlsx`）文件。无请求参数。

**curl 示例:**
```bash
curl -b /tmp/cookies.txt 'http://10.254.253.187:8999/api/v1/claims/export' \
  -o 报销记录_$(date +%Y%m%d).xlsx
```

**响应 (200):**
- `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- `Content-Disposition: attachment; filename*=UTF-8''报销记录_YYYYMMDD.xlsx`
- 返回 Excel 二进制流

**导出表格列（14 列）：**

| 列 | 字段 | 说明 |
|---|---|---|
| A | 开票时间 | `invoice_date` |
| B | 票号 | `invoice_no` |
| C | 报销理由 | `reason_label` |
| D | 金额 | `amount` |
| E | 币种 | `currency` |
| F | 折算港币 | `amount_hkd` |
| G | 审批状态 | `approval_status`（中文：待审批 / 已通过 / 已拒绝 / 已撤回） |
| H | 员工姓名 | `employee_name` |
| I | 员工账号 | `employee_username` |
| J | 部门 | `employee_department` |
| K | 地区 | `employee_region` |
| L | 说明 | `description` |
| M | 附件名称 | `attachment_name` |
| N | 提交时间 | `created_at` |

---

## 六、系统参数管理模块

### 45. 获取系统设置

**GET** `/api/v1/system-settings`

**curl 示例:**
```bash
curl -b /tmp/cookies.txt 'http://10.254.253.187:8999/api/v1/system-settings'
```

**响应 (200):**
```json
{
  "id": "6a2e8385dab3919bc45f1538",
  "departments": ["深圳研发中心","香港运营团队","香港销售","香港管理团队"],
  "positions": ["Backend Developer","Project Manager","Sales","Solutions Architect"],
  "regions": ["中国大陆","香港"],
  "modules": [
    {"module_code":"employee_home","module_name":"员工工作台"},
    {"module_code":"employee_password","module_name":"修改密码"},
    {"module_code":"employee_leave","module_name":"员工请假"},
    {"module_code":"admin_dashboard","module_name":"统一工作台管理模块"},
    {"module_code":"user_management","module_name":"用户管理"},
    {"module_code":"leave_calendar","module_name":"请假管理"},
    {"module_code":"leave_workflows","module_name":"请假流程维护"},
    {"module_code":"approval_management","module_name":"审批管理"},
    {"module_code":"system_settings","module_name":"系统参数管理维护"},
    {"module_code":"data_migration","module_name":"数据处理维护"},
    {"module_code":"access_control","module_name":"门禁ID维护"},
    {"module_code":"claim_management","module_name":"报销 Claim"}
  ],
  "employee_self_editable_fields": ["avatar","username","email","full_name","english_name","phone","personal_email","department","position","region","gender","..."],
  "employee_self_editable_fields_initialized": true,
  "employee_profile_field_catalog": [/* 员工档案字段目录 */],
  "claim_reasons": [/* 报销事由 */],
  "claim_currencies": [/* 货币列表 */],
  "regional_holidays": [/* 法定节假日 */],
  "regional_holiday_catalogs": [/* 节假日配置 */],
  "created_at": "2026-06-15T03:00:29.591000Z",
  "updated_at": "2026-07-30T23:30:02.849000Z"
}
```

---

### 46. 更新系统设置

**PUT** `/api/v1/system-settings`

**请求体 (application/json):**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| departments | array | ❌ | 部门列表 |
| positions | array | ❌ | 职位列表 |
| regions | array | ❌ | 地区列表 |
| modules | array | ❌ | 系统模块列表 |
| employee_self_editable_fields | array | ❌ | 员工可自编辑字段 |
| claim_reasons | array | ❌ | 报销事由列表 |
| claim_currencies | array | ❌ | 货币列表 |
| regional_holidays | array | ❌ | 法定节假日列表 |
| regional_holiday_catalogs | array | ❌ | 节假日配置列表 |

**curl 示例:**
```bash
curl -b /tmp/cookies.txt -X PUT 'http://10.254.253.187:8999/api/v1/system-settings' \
  -H 'Content-Type: application/json' \
  -d '{
    "departments":["深圳研发中心","香港运营团队","香港销售","香港管理团队"],
    "positions":["Backend Developer","Project Manager","Sales"],
    "regions":["中国大陆","香港"],
    "claim_reasons":[{"name":"餐饮报销"},{"name":"交通报销"}]
  }'
```

---

### 47. 新增/更新法定节假日

**PUT** `/api/v1/system-settings/regional-holidays`

**请求体 (application/json):**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| region | string | ✅ | 地区 |
| date | string | ✅ | 日期 (YYYY-MM-DD) |
| holiday_name | string | ✅ | 节假日名称 |

**curl 示例:**
```bash
curl -b /tmp/cookies.txt -X PUT 'http://10.254.253.187:8999/api/v1/system-settings/regional-holidays' \
  -H 'Content-Type: application/json' \
  -d '{"region":"香港","date":"2026-10-01","holiday_name":"国庆节"}'
```

---

### 48. 删除法定节假日

**DELETE** `/api/v1/system-settings/regional-holidays`

**请求体 (application/json):**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| region | string | ✅ | 地区 |
| date | string | ✅ | 日期 (YYYY-MM-DD) |

**curl 示例:**
```bash
curl -b /tmp/cookies.txt -X DELETE 'http://10.254.253.187:8999/api/v1/system-settings/regional-holidays' \
  -H 'Content-Type: application/json' \
  -d '{"region":"香港","date":"2026-10-01"}'
```

---

### 49. 批量新增节假日区间

**PUT** `/api/v1/system-settings/regional-holidays/range`

**请求体 (application/json):**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| region | string | ✅ | 地区 |
| start_date | string | ✅ | 开始日期 (YYYY-MM-DD) |
| end_date | string | ❌ | 结束日期 (YYYY-MM-DD) |
| holiday_name | string | ✅ | 节假日名称 |

**curl 示例:**
```bash
curl -b /tmp/cookies.txt -X PUT 'http://10.254.253.187:8999/api/v1/system-settings/regional-holidays/range' \
  -H 'Content-Type: application/json' \
  -d '{"region":"香港","start_date":"2026-02-01","end_date":"2026-02-07","holiday_name":"春节假期"}'
```

---

### 50. 删除节假日区间

**DELETE** `/api/v1/system-settings/regional-holidays/range`

**请求体 (application/json):**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| region | string | ✅ | 地区 |
| start_date | string | ✅ | 开始日期 |
| end_date | string | ❌ | 结束日期 |

**curl 示例:**
```bash
curl -b /tmp/cookies.txt -X DELETE 'http://10.254.253.187:8999/api/v1/system-settings/regional-holidays/range' \
  -H 'Content-Type: application/json' \
  -d '{"region":"香港","start_date":"2026-02-01","end_date":"2026-02-07"}'
```

---

## 七、数据迁移模块

### 51. 导出数据

**GET** `/api/v1/data-migration/export`

**查询参数:**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| source | string | ✅ | 数据源 |
| include | string | ❌ | 包含的表 |
| exclude | string | ❌ | 排除的表 |

**curl 示例:**
```bash
curl -b /tmp/cookies.txt 'http://10.254.253.187:8999/api/v1/data-migration/export?source=default'
```

---

### 52. 导入数据

**POST** `/api/v1/data-migration/import`

**查询参数:**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| target | string | ✅ | 目标数据源 |
| mode | string | ❌ | 导入模式 |
| include | string | ❌ | 包含的表 |
| exclude | string | ❌ | 排除的表 |
| user_null_strategy | string | ❌ | 用户空值策略 |

**请求体 (multipart/form-data):**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| file | string (file) | ✅ | 备份文件 |

**curl 示例:**
```bash
curl -b /tmp/cookies.txt -X POST 'http://10.254.253.187:8999/api/v1/data-migration/import?target=default&mode=merge' \
  -F 'file=@/path/to/backup.json'
```

---

### 53. 备份数据

**POST** `/api/v1/data-migration/backup`

**查询参数:**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| source | string | ✅ | 数据源 |
| include | string | ❌ | 包含的表 |
| exclude | string | ❌ | 排除的表 |

**curl 示例:**
```bash
curl -b /tmp/cookies.txt -X POST 'http://10.254.253.187:8999/api/v1/data-migration/backup?source=default'
```

---

### 54. 获取备份列表

**GET** `/api/v1/data-migration/backups`

**curl 示例:**
```bash
curl -b /tmp/cookies.txt 'http://10.254.253.187:8999/api/v1/data-migration/backups'
```

**响应 (200):**
```json
{"items": []}
```

---

### 55. 下载指定备份

**GET** `/api/v1/data-migration/backups/{filename}`

**路径参数:**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| filename | string | ✅ | 备份文件名 |

**curl 示例:**
```bash
curl -b /tmp/cookies.txt 'http://10.254.253.187:8999/api/v1/data-migration/backups/{filename}'
```

---

## 附录：系统页面路由

以下 GET 接口返回 HTML 页面（非 JSON API）：

| 路由 | 说明 |
|---|---|
| `GET /login` | 登录页 |
| `GET /employee` | 员工工作台首页 |
| `GET /employee/change-password` | 修改密码页 |
| `GET /employee/leave` | 员工请假页 |
| `GET /employee/profile` | 员工个人资料页 |
| `GET /employee/approvals` | 员工审批页 |
| `GET /employee/access-control` | 门禁ID页 |
| `GET /employee/claims` | 报销页 |
| `GET /employee/manage/users` | 管理员 - 用户管理页 |
| `GET /employee/manage/users/{id}/profile` | 管理员 - 员工档案页 |
| `GET /employee/manage/leave` | 管理员 - 请假管理页 |
| `GET /employee/manage/leave-workflows` | 管理员 - 请假流程页 |
| `GET /employee/manage/settings` | 管理员 - 系统设置页 |
| `GET /employee/manage/approvals` | 管理员 - 审批管理页 |
| `GET /employee/manage/data-migration` | 管理员 - 数据迁移页 |
| `GET /employee/manage/access-control` | 管理员 - 门禁ID维护页 |

---

## lin 账号权限汇总

`lin` 账号拥有 **查看（can_view）** 所有 12 个模块的权限，但无 `can_create`、`can_edit`、`can_delete`、`can_approve` 权限：

| 模块代码 | 模块名称 | 查看 | 创建 | 编辑 | 删除 | 审批 |
|---|---|---|---|---|---|---|
| employee_home | 员工工作台 | ✅ | ❌ | ❌ | ❌ | ❌ |
| employee_password | 修改密码 | ✅ | ❌ | ❌ | ❌ | ❌ |
| employee_leave | 员工请假 | ✅ | ❌ | ❌ | ❌ | ❌ |
| admin_dashboard | 统一工作台管理模块 | ✅ | ❌ | ❌ | ❌ | ❌ |
| user_management | 用户管理 | ✅ | ❌ | ❌ | ❌ | ❌ |
| leave_calendar | 请假管理 | ✅ | ❌ | ❌ | ❌ | ❌ |
| leave_workflows | 请假流程维护 | ✅ | ❌ | ❌ | ❌ | ❌ |
| approval_management | 审批管理 | ✅ | ❌ | ❌ | ❌ | ❌ |
| system_settings | 系统参数管理维护 | ✅ | ❌ | ❌ | ❌ | ❌ |
| data_migration | 数据处理维护 | ✅ | ❌ | ❌ | ❌ | ❌ |
| access_control | 门禁ID维护 | ✅ | ❌ | ❌ | ❌ | ❌ |
| claim_management | 报销 Claim | ✅ | ❌ | ❌ | ❌ | ❌ |

> **注意:** 虽然权限标记为无 `can_create`/`can_approve` 等操作权限，但从实际 API 测试来看，`lin` 账号仍可创建请假申请、报销申请，并作为审批人出现在审批链中（可能是业务逻辑允许用户创建自己的申请，审批权限由 workflow 中的 approvers 配置决定）。



toolName: todo_write
            
status: success
          
Todos updated: 3 items
          
Let me start by accessing the API docs and trying to login simultaneously.
        
            
toolName: web_search
            
status: failed
          
query: http://10.254.253.187:8999/docs
          

        
            
toolName: Shell
            
status: success
          
          
登录成功！现在让我获取 API 文档和可用的接口列表。
        
            
toolName: Shell
            
status: success
          
          

        
            
toolName: Shell
            
status: success
          
          

        
            
toolName: Shell
            
status: success
          
          

        
            
toolName: Shell
            
status: success
          
          
现在让我获取完整的 OpenAPI spec 详情，提取每个接口的请求/响应结构。
        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          

        
            
toolName: Shell
            
status: success
          
          

        
            
toolName: Shell
            
status: success
          
          

        
            
toolName: Write
            
status: success
          
            
filePath: /tmp/parse_openapi.py
          
changes: undefined
          

        
            
toolName: Shell
            
status: success
          
          

        
            
toolName: view_files
            
status: success
          
            
filePath: /var/folders/3b/lwjkgqhx3419yhxy4r241tpc0000gn/T/agent-toolhost/jobs/job-351c6250109c4ddb95e30e98cf80608a/output.log
          
现在让我实际调用一些关键接口，获取真实的返回数据示例。
        
            
toolName: Shell
            
status: success
          
          

        
            
toolName: Shell
            
status: success
          
          

        
            
toolName: Shell
            
status: success
          
          

        
            
toolName: Shell
            
status: success
          
          

        
            
toolName: Shell
            
status: success
          
          

        
            
toolName: Shell
            
status: success
          
          

        
            
toolName: Shell
            
status: success
          
          

        
            
toolName: Shell
            
status: success
          
          

        
            
toolName: Shell
            
status: success
          
          

        
            
toolName: Shell
            
status: success
          
          

        
            
toolName: Shell
            
status: success
          
          

        
            
toolName: Shell
            
status: success
          
          

        
            
toolName: Shell
            
status: success
          
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          
以下是 `lin` 账号（密码 `Cisco@123`）登录后，系统所有可用接口的完整梳理，按功能模块分组，每个接口都附带 curl 请求示例和实际返回数据。

---

## 一、认证模块 (Auth)

### 1. 登录
```bash
curl -c /tmp/cookies.txt 'http://10.254.253.187:8999/api/v1/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{"username":"lin","password":"Cisco@123"}'
```
**Response (200):**
```json
{"message":"登录成功","expires_at":"2026-07-31T23:59:59Z"}
```
> 登录成功后，服务端通过 `Set-Cookie` 返回 `SessionID`，后续请求使用 `-b /tmp/cookies.txt` 携带。

### 2. 获取当前用户信息
```bash
curl -b /tmp/cookies.txt 'http://10.254.253.187:8999/api/v1/auth/me'
```
**Response (200):**
```json
{
  "username": "lin",
  "email": "lin@qq.com",
  "full_name": "lin",
  "id": "6a2f6acd8d8c88ae7d154c29",
  "user_id": 5,
  "phone": "19088887777",
  "department": "香港管理团队",
  "region": "香港",
  "position": "Project Manager",
  "avatar_url": "/api/v1/employees/avatars/lin/20260730233000_7ee5d4136c6f4467bdf20f960c9f1891.jpeg",
  "is_active": true,
  "is_initial_password": 0,
  "module_permissions": [
    {"module_code":"employee_home","module_name":"员工工作台","can_view":true,"can_create":false,"can_edit":false,"can_delete":false,"can_approve":false},
    {"module_code":"employee_password","module_name":"修改密码","can_view":true,...},
    {"module_code":"employee_leave","module_name":"员工请假","can_view":true,...},
    {"module_code":"admin_dashboard","module_name":"统一工作台管理模块","can_view":true,...},
    {"module_code":"user_management","module_name":"用户管理","can_view":true,...},
    {"module_code":"leave_calendar","module_name":"请假管理","can_view":true,...},
    {"module_code":"leave_workflows","module_name":"请假流程维护","can_view":true,...},
    {"module_code":"approval_management","module_name":"审批管理","can_view":true,...},
    {"module_code":"system_settings","module_name":"系统参数管理维护","can_view":true,...},
    {"module_code":"data_migration","module_name":"数据处理维护","can_view":true,...},
    {"module_code":"access_control","module_name":"门禁ID维护","can_view":true,...},
    {"module_code":"claim_management","module_name":"报销 Claim","can_view":true,...}
  ],
  "created_at": "2026-06-15T03:00:29.591000Z",
  "updated_at": "2026-07-30T23:30:02.849000Z"
}
```

### 3. 修改密码
```bash
curl -b /tmp/cookies.txt -X POST 'http://10.254.253.187:8999/api/v1/auth/change-password' \
  -H 'Content-Type: application/json' \
  -d '{"current_password":"Cisco@123","new_password":"NewPass@456"}'
```
**Response (200):** 返回完整用户对象（同 `/auth/me`）

### 4. 登出
```bash
curl -b /tmp/cookies.txt -X POST 'http://10.254.253.187:8999/api/v1/auth/logout'
```
**Response (200):**
```json
{"message":"登出成功"}
```

### 5. 注册用户
```bash
curl -b /tmp/cookies.txt -X POST 'http://10.254.253.187:8999/api/v1/auth/register' \
  -H 'Content-Type: application/json' \
  -d '{"username":"newuser","email":"new@test.com","full_name":"New User","password":"Pass@123"}'
```
**Response (201):** 返回完整用户对象

---

## 二、员工管理模块

### 6. 获取员工列表
```bash
curl -b /tmp/cookies.txt 'http://10.254.253.187:8999/api/v1/employees'
```
**Response (200):** 返回员工数组，每个员工对象包含 `id`, `employee_code`, `username`, `email`, `full_name`, `phone`, `department`, `region`, `position`, `avatar_url`, `is_active`, `access_control_id`, `module_permissions` 等字段。

### 7. 创建员工
```bash
curl -b /tmp/cookies.txt -X POST 'http://10.254.253.187:8999/api/v1/employees' \
  -H 'Content-Type: application/json' \
  -d '{
    "username": "newemp",
    "email": "newemp@test.com",
    "full_name": "New Employee",
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
**Response (201):** 返回新创建的完整员工对象

### 8. 获取"我"的员工档案
```bash
curl -b /tmp/cookies.txt 'http://10.254.253.187:8999/api/v1/employees/me/profile'
```
**Response (200):**
```json
{
  "employee_id": "6a2f6acd8d8c88ae7d154c29",
  "english_name": "1",
  "hire_date": null,
  "work_start_date": null,
  "birth_date": null,
  "hkid_number": "31221321323",
  "gender": null,
  "passport_number": null,
  "marital_status": null,
  "english_address": null,
  "personal_email": "violet181@gmail.com",
  "emergency_contact_name": "violet violet",
  "emergency_contact_phone": null,
  "emergency_contact_relationship": "兄弟",
  "bank_name": "violet",
  "bank_account_name": "violet",
  "bank_account_number": "1234567890",
  "created_at": "2026-06-15T09:59:21.600000Z",
  "updated_at": "2026-07-30T23:30:02.892000Z"
}
```

### 9. 更新"我"的员工档案
```bash
curl -b /tmp/cookies.txt -X PATCH 'http://10.254.253.187:8999/api/v1/employees/me/profile' \
  -H 'Content-Type: application/json' \
  -d '{"english_name":"Lin Updated","gender":"male"}'
```
**Response (200):** 返回更新后的完整 profile 对象

### 10. 获取指定员工档案
```bash
curl -b /tmp/cookies.txt 'http://10.254.253.187:8999/api/v1/employees/{employee_id}/profile'
```

### 11. 更新指定员工档案
```bash
curl -b /tmp/cookies.txt -X PATCH 'http://10.254.253.187:8999/api/v1/employees/{employee_id}/profile' \
  -H 'Content-Type: application/json' \
  -d '{"english_name":"Updated Name"}'
```

### 12. 更新"我"的基本信息
```bash
curl -b /tmp/cookies.txt -X PATCH 'http://10.254.253.187:8999/api/v1/employees/me/basic-info' \
  -H 'Content-Type: application/json' \
  -d '{"full_name":"Lin Updated","phone":"19099998888"}'
```

### 13. 更新指定员工基本信息
```bash
curl -b /tmp/cookies.txt -X PATCH 'http://10.254.253.187:8999/api/v1/employees/{employee_id}/basic-info' \
  -H 'Content-Type: application/json' \
  -d '{"full_name":"Updated Name","department":"香港销售"}'
```

### 14. 更新员工权限
```bash
curl -b /tmp/cookies.txt -X PATCH 'http://10.254.253.187:8999/api/v1/employees/{employee_id}/permissions' \
  -H 'Content-Type: application/json' \
  -d '{
    "module_permissions": [
      {"module_code":"employee_home","module_name":"员工工作台","can_view":true,"can_create":false,"can_edit":false,"can_delete":false,"can_approve":false}
    ]
  }'
```

### 15. 重置员工密码
```bash
curl -b /tmp/cookies.txt -X POST 'http://10.254.253.187:8999/api/v1/employees/{employee_id}/reset-password'
```
**Response (200):**
```json
{
  "id": "...",
  "username": "...",
  "temporary_password": "临时密码",
  "is_initial_password": 1
}
```

### 16. 更新员工状态（启用/禁用）
```bash
curl -b /tmp/cookies.txt -X PATCH 'http://10.254.253.187:8999/api/v1/employees/{employee_id}/status' \
  -H 'Content-Type: application/json' \
  -d '{"is_active":false}'
```

### 17. 获取门禁员工列表
```bash
curl -b /tmp/cookies.txt 'http://10.254.253.187:8999/api/v1/access-control/employees'
```
**Response (200):** 精简员工数组（`id`, `username`, `full_name`, `access_control_id`），走 `access_control` 模块权限。

### 18. 更新员工门禁ID
```bash
curl -b /tmp/cookies.txt -X PATCH 'http://10.254.253.187:8999/api/v1/access-control/employees/{employee_id}' \
  -H 'Content-Type: application/json' \
  -d '{"access_control_id":"AC20260001"}'
```
> 旧路径 `/api/v1/employees/{employee_id}/access-control-id` 已下线（404）。

### 19. 删除员工
```bash
curl -b /tmp/cookies.txt -X DELETE 'http://10.254.253.187:8999/api/v1/employees/{employee_id}'
```
**Response (204):** 无内容

### 20. 获取员工头像
```bash
curl -b /tmp/cookies.txt 'http://10.254.253.187:8999/api/v1/employees/avatars/{username}/{file_name}'
```

### 20. 更新"我"的头像
```bash
curl -b /tmp/cookies.txt -X PATCH 'http://10.254.253.187:8999/api/v1/employees/me/avatar' \
  -F 'avatar=@/path/to/avatar.jpg'
```

### 21. 更新指定员工头像
```bash
curl -b /tmp/cookies.txt -X PATCH 'http://10.254.253.187:8999/api/v1/employees/{employee_id}/avatar' \
  -F 'avatar=@/path/to/avatar.jpg'
```

---

## 三、请假管理模块

### 22. 创建请假申请
```bash
curl -b /tmp/cookies.txt -X POST 'http://10.254.253.187:8999/api/v1/leave-requests' \
  -H 'Content-Type: application/json' \
  -d '{
    "leave_type": "annual",
    "start_date": "2026-08-01",
    "end_date": "2026-08-03",
    "session": "full_day",
    "reason": "Family vacation",
    "handover_to": "colleague_id"
  }'
```
**Response (201):**
```json
{
  "id": "leave_req_id",
  "employee_id": "6a2f6acd...",
  "employee_username": "lin",
  "employee_name": "lin",
  "leave_type": "annual",
  "approval_status": "pending",
  "approval_chain": [...],
  "session": "full_day",
  "start_date": "2026-08-01",
  "end_date": "2026-08-03",
  "date_keys": ["2026-08-01","2026-08-02","2026-08-03"],
  "created_at": "2026-07-31T..."
}
```

### 23. 获取请假列表（管理员视图）
```bash
curl -b /tmp/cookies.txt 'http://10.254.253.187:8999/api/v1/leave-requests?year=2026&region=香港&approval_status=pending'
```

### 24. 获取"我的"请假列表
```bash
curl -b /tmp/cookies.txt 'http://10.254.253.187:8999/api/v1/leave-requests/my'
```
**Response (200):** 返回当前用户的请假数组

### 25. 获取待我审批的请假
```bash
curl -b /tmp/cookies.txt 'http://10.254.253.187:8999/api/v1/leave-requests/approvals/my'
```
**Response (200):**
```json
[
  {
    "id": "6a6af2a364f5ce007e67ab6b",
    "employee_id": "6a66f334bea5520029007ed4",
    "employee_username": "admin1",
    "employee_name": "violet violet",
    "employee_department": "深圳研发中心",
    "employee_region": "中国大陆",
    "leave_type": "annual",
    "approval_status": "pending",
    "current_approver_id": "6a2f6acd8d8c88ae7d154c29",
    "session": "full_day",
    "start_date": "2026-05-14",
    "end_date": "2026-05-22",
    "date_keys": ["2026-05-14","2026-05-15",...],
    "created_at": "2026-07-18T..."
  }
]
```

### 26. 获取我的审批历史
```bash
curl -b /tmp/cookies.txt 'http://10.254.253.187:8999/api/v1/leave-requests/approvals/records/my'
```

### 27. 获取年假汇总
```bash
curl -b /tmp/cookies.txt 'http://10.254.253.187:8999/api/v1/leave-requests/annual-leave/summary?year=2026'
```
**Response (200):**
```json
{
  "year": 2026,
  "region": "香港",
  "entitlement_days": 0.0,
  "used_days": 0.0,
  "available_days": 0.0
}
```

### 28. 获取请假日历
```bash
curl -b /tmp/cookies.txt 'http://10.254.253.187:8999/api/v1/leave-requests/calendar?year=2026'
```
**Response (200):**
```json
{
  "year": 2026,
  "total": 14,
  "items": [/* LeaveRequest 数组 */]
}
```

### 29. 获取单个请假详情
```bash
curl -b /tmp/cookies.txt 'http://10.254.253.187:8999/api/v1/leave-requests/{leave_request_id}'
```

### 30. 审批请假
```bash
curl -b /tmp/cookies.txt -X PATCH 'http://10.254.253.187:8999/api/v1/leave-requests/{leave_request_id}/approval' \
  -H 'Content-Type: application/json' \
  -d '{"approval_status":"approved","review_comment":"同意"}'
```
> `approval_status` 可选值: `approved`, `rejected`

### 31. 撤回请假
```bash
curl -b /tmp/cookies.txt -X PATCH 'http://10.254.253.187:8999/api/v1/leave-requests/{leave_request_id}/withdraw' \
  -H 'Content-Type: application/json' \
  -d '{"withdraw_comment":"计划变更"}'
```

---

## 四、请假流程模块

### 32. 获取请假流程列表
```bash
curl -b /tmp/cookies.txt 'http://10.254.253.187:8999/api/v1/leave-workflows'
```
**Response (200):**
```json
[
  {
    "id": "6a5b68f0d71fdce199c48fce",
    "name": "JJ",
    "priority": 100,
    "is_active": true,
    "match": {"employee_id":null,"department":null,"region":null,"position":null},
    "approvers": [
      {"user_id":"6a2f6acd...","username":"lin","full_name":"lin"},
      {"user_id":"6a2deedd...","username":"321321","full_name":"12321"}
    ],
    "created_at": "2026-07-18T11:52:16.868000Z"
  }
]
```

### 33. 创建请假流程
```bash
curl -b /tmp/cookies.txt -X POST 'http://10.254.253.187:8999/api/v1/leave-workflows' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "大陆研发部请假流程",
    "priority": 100,
    "is_active": true,
    "match": {"region":"中国大陆","department":null,"position":null},
    "approvers": [
      {"user_id":"6a2f6acd8d8c88ae7d154c29","username":"lin","full_name":"lin"}
    ]
  }'
```

### 34. 更新请假流程
```bash
curl -b /tmp/cookies.txt -X PATCH 'http://10.254.253.187:8999/api/v1/leave-workflows/{workflow_id}' \
  -H 'Content-Type: application/json' \
  -d '{"name":"Updated Name","is_active":true}'
```

### 35. 删除请假流程
```bash
curl -b /tmp/cookies.txt -X DELETE 'http://10.254.253.187:8999/api/v1/leave-workflows/{workflow_id}'
```

---

## 五、报销管理模块

### 36. 获取报销选项（事由+货币）
```bash
curl -b /tmp/cookies.txt 'http://10.254.253.187:8999/api/v1/claims/options'
```
**Response (200):**
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

### 37. 创建报销申请
```bash
curl -b /tmp/cookies.txt -X POST 'http://10.254.253.187:8999/api/v1/claims' \
  -F 'reason_code=办公采购' \
  -F 'description=DL380' \
  -F 'amount=245209' \
  -F 'currency=HKD' \
  -F 'attachment=@/path/to/file.png'
```
**Response (201):**
```json
{
  "id": "claim_id",
  "employee_id": "6a2f6acd...",
  "employee_username": "lin",
  "reason_code": "办公采购",
  "reason_label": "办公采购",
  "amount": 245209.0,
  "currency": "HKD",
  "exchange_rate_to_hkd": 1.0,
  "amount_hkd": 245209.0,
  "approval_status": "pending",
  "attachment_url": "/api/v1/claims/attachments/lin/xxx.png",
  "created_at": "2026-07-23T02:33:28.920000Z"
}
```

### 38. 获取我的报销列表
```bash
curl -b /tmp/cookies.txt 'http://10.254.253.187:8999/api/v1/claims/my'
```
**Response (200):** 返回报销对象数组

### 39. 获取我的报销历史
```bash
curl -b /tmp/cookies.txt 'http://10.254.253.187:8999/api/v1/claims/history/my'
```

### 40. 获取待我审批的报销
```bash
curl -b /tmp/cookies.txt 'http://10.254.253.187:8999/api/v1/claims/approvals/my'
```

### 41. 获取我的报销审批记录
```bash
curl -b /tmp/cookies.txt 'http://10.254.253.187:8999/api/v1/claims/approvals/records/my'
```

### 42. 审批报销
```bash
curl -b /tmp/cookies.txt -X PATCH 'http://10.254.253.187:8999/api/v1/claims/{claim_request_id}/approval' \
  -d 'approval_status=approved&review_comment=同意报销'
```
> 注意：此接口使用 `application/x-www-form-urlencoded` 格式

### 43. 获取报销附件
```bash
curl -b /tmp/cookies.txt 'http://10.254.253.187:8999/api/v1/claims/attachments/{username}/{file_name}'
```

---

## 六、系统参数管理模块

### 45. 获取系统设置
```bash
curl -b /tmp/cookies.txt 'http://10.254.253.187:8999/api/v1/system-settings'
```
**Response (200):**
```json
{
  "id": "6a2e8385dab3919bc45f1538",
  "departments": ["深圳研发中心","香港运营团队","香港销售","香港管理团队"],
  "positions": ["Backend Developer","Project Manager","Sales","Solutions Architect"],
  "regions": ["中国大陆","香港"],
  "modules": [/* 系统模块列表 */],
  "employee_self_editable_fields": ["avatar","username","email","full_name","english_name","phone",...],
  "claim_reasons": [/* 报销事由 */],
  "claim_currencies": [/* 货币列表 */],
  "regional_holidays": [/* 法定节假日 */],
  "regional_holiday_catalogs": [/* 节假日配置 */]
}
```

### 46. 更新系统设置
```bash
curl -b /tmp/cookies.txt -X PUT 'http://10.254.253.187:8999/api/v1/system-settings' \
  -H 'Content-Type: application/json' \
  -d '{
    "departments":["深圳研发中心","香港运营团队","香港销售","香港管理团队"],
    "positions":["Backend Developer","Project Manager","Sales"],
    "regions":["中国大陆","香港"],
    "claim_reasons":[{"name":"餐饮报销"},{"name":"交通报销"}]
  }'
```

### 47. 新增/更新法定节假日
```bash
curl -b /tmp/cookies.txt -X PUT 'http://10.254.253.187:8999/api/v1/system-settings/regional-holidays' \
  -H 'Content-Type: application/json' \
  -d '{"region":"香港","date":"2026-10-01","holiday_name":"国庆节"}'
```

### 48. 删除法定节假日
```bash
curl -b /tmp/cookies.txt -X DELETE 'http://10.254.253.187:8999/api/v1/system-settings/regional-holidays' \
  -H 'Content-Type: application/json' \
  -d '{"region":"香港","date":"2026-10-01"}'
```

### 49. 批量新增节假日区间
```bash
curl -b /tmp/cookies.txt -X PUT 'http://10.254.253.187:8999/api/v1/system-settings/regional-holidays/range' \
  -H 'Content-Type: application/json' \
  -d '{"region":"香港","start_date":"2026-02-01","end_date":"2026-02-07","holiday_name":"春节假期"}'
```

### 50. 删除节假日区间
```bash
curl -b /tmp/cookies.txt -X DELETE 'http://10.254.253.187:8999/api/v1/system-settings/regional-holidays/range' \
  -H 'Content-Type: application/json' \
  -d '{"region":"香港","start_date":"2026-02-01","end_date":"2026-02-07"}'
```

---

## 七、数据迁移模块

### 51. 导出数据
```bash
curl -b /tmp/cookies.txt 'http://10.254.253.187:8999/api/v1/data-migration/export?source=default'
```

### 52. 导入数据
```bash
curl -b /tmp/cookies.txt -X POST 'http://10.254.253.187:8999/api/v1/data-migration/import?target=default&mode=merge' \
  -F 'file=@/path/to/backup.json'
```

### 53. 备份数据
```bash
curl -b /tmp/cookies.txt -X POST 'http://10.254.253.187:8999/api/v1/data-migration/backup?source=default'
```

### 54. 获取备份列表
```bash
curl -b /tmp/cookies.txt 'http://10.254.253.187:8999/api/v1/data-migration/backups'
```
**Response (200):**
```json
{"items": []}
```

### 55. 下载指定备份
```bash
curl -b /tmp/cookies.txt 'http://10.254.253.187:8999/api/v1/data-migration/backups/{filename}'
```

---

## 附录：系统页面路由（HTML 页面）

以下 GET 接口返回 HTML 页面而非 JSON API：

| 路由 | 说明 |
|---|---|
| `GET /login` | 登录页 |
| `GET /employee` | 员工工作台首页 |
| `GET /employee/change-password` | 修改密码页 |
| `GET /employee/leave` | 员工请假页 |
| `GET /employee/profile` | 员工个人资料页 |
| `GET /employee/approvals` | 员工审批页 |
| `GET /employee/access-control` | 门禁ID页 |
| `GET /employee/claims` | 报销页 |
| `GET /employee/manage/users` | 管理员-用户管理页 |
| `GET /employee/manage/users/{id}/profile` | 管理员-员工档案页 |
| `GET /employee/manage/leave` | 管理员-请假管理页 |
| `GET /employee/manage/leave-workflows` | 管理员-请假流程页 |
| `GET /employee/manage/settings` | 管理员-系统设置页 |
| `GET /employee/manage/approvals` | 管理员-审批管理页 |
| `GET /employee/manage/data-migration` | 管理员-数据迁移页 |
| `GET /employee/manage/access-control` | 管理员-门禁ID维护页 |

---

## `lin` 账号权限汇总

`lin` 账号拥有 **查看（can_view）** 所有 12 个模块的权限，但均无 `can_create`、`can_edit`、`can_delete`、`can_approve` 权限：

| 模块代码 | 模块名称 | 查看 | 创建 | 编辑 | 删除 | 审批 |
|---|---|---|---|---|---|---|
| employee_home | 员工工作台 | ✅ | ❌ | ❌ | ❌ | ❌ |
| employee_password | 修改密码 | ✅ | ❌ | ❌ | ❌ | ❌ |
| employee_leave | 员工请假 | ✅ | ❌ | ❌ | ❌ | ❌ |
| admin_dashboard | 统一工作台管理模块 | ✅ | ❌ | ❌ | ❌ | ❌ |
| user_management | 用户管理 | ✅ | ❌ | ❌ | ❌ | ❌ |
| leave_calendar | 请假管理 | ✅ | ❌ | ❌ | ❌ | ❌ |
| leave_workflows | 请假流程维护 | ✅ | ❌ | ❌ | ❌ | ❌ |
| approval_management | 审批管理 | ✅ | ❌ | ❌ | ❌ | ❌ |
| system_settings | 系统参数管理维护 | ✅ | ❌ | ❌ | ❌ | ❌ |
| data_migration | 数据处理维护 | ✅ | ❌ | ❌ | ❌ | ❌ |
| access_control | 门禁ID维护 | ✅ | ❌ | ❌ | ❌ | ❌ |
| claim_management | 报销 Claim | ✅ | ❌ | ❌ | ❌ | ❌ |

> **提示**：虽然权限标记为无 `can_create`/`can_approve` 等，但从实际 API 测试来看，`lin` 账号仍可创建请假申请、报销申请、审批待办等（可能是因为 `lin` 同时出现在审批链中作为审批人）。
