# OA System API 接口文档

> **Base URL**: `http://10.254.253.187:8999`  
> **API 版本**: 1.0.0 (OAS 3.1)  
> **认证方式**: OAuth2 Password Bearer Token

---

## 目录

- [1. 认证 (Auth)](#1-认证-auth)
- [2. 员工管理 (Employees)](#2-员工管理-employees)
- [3. 请假管理 (Leave Requests)](#3-请假管理-leave-requests)
- [4. 请假流程 (Leave Workflows)](#4-请假流程-leave-workflows)
- [5. 系统设置 (System Settings)](#5-系统设置-system-settings)
- [6. 公共数据模型](#6-公共数据模型)
- [7. 枚举类型](#7-枚举类型)

---

## 认证说明

所有需要认证的接口均使用 **OAuth2PasswordBearer** 方案：

- **类型**: OAuth2
- **Flow**: password
- **Token URL**: `/api/v1/auth/login`
- **请求头**: `Authorization: Bearer <token>`

---

## 1. 认证 (Auth)

### 1.1 登录

**POST** `/api/v1/auth/login`  
**无需认证**

**请求体** (`LoginRequest`, `application/json`):

| 字段 | 类型 | 必填 | 约束 | 说明 |
|------|------|------|------|------|
| `username` | string | ✅ | 3-50 字符 | 用户名 |
| `password` | string | ✅ | 6-128 字符 | 密码 |

**请求示例**:
```json
{
  "username": "admin",
  "password": "Cisco@123"
}
```

**响应 200** (`LoginResponse`):

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `message` | string | 否 | `"登录成功"` | 登录成功消息 |
| `expires_at` | string (datetime) | ✅ | — | 会话过期时间 |

**响应示例**:
```json
{
  "message": "登录成功",
  "expires_at": "2026-07-23T10:00:00Z"
}
```

**错误响应**: 422 `HTTPValidationError`

---

### 1.2 注册用户

**POST** `/api/v1/auth/register`  
**无需认证**

**请求体** (`UserCreate`, `application/json`):

| 字段 | 类型 | 必填 | 约束 | 说明 |
|------|------|------|------|------|
| `username` | string | ✅ | 3-50 字符 | 用户名 |
| `email` | string (email) | ✅ | — | 邮箱地址 |
| `full_name` | string \| null | 否 | — | 全名 |
| `password` | string | ✅ | 6-128 字符 | 密码 |

**请求示例**:
```json
{
  "username": "zhangsan",
  "email": "zhangsan@example.com",
  "full_name": "张三",
  "password": "Abc123456"
}
```

**响应 201** (`UserResponse`): 见 [UserResponse 模型](#userresponse)

---

### 1.3 获取当前用户

**GET** `/api/v1/auth/me`  
**需要认证** ✅

**请求参数**: 无

**响应 200** (`UserResponse`): 见 [UserResponse 模型](#userresponse)

---

### 1.4 修改密码

**POST** `/api/v1/auth/change-password`  
**需要认证** ✅

**请求体** (`ChangePasswordRequest`, `application/json`):

| 字段 | 类型 | 必填 | 约束 | 说明 |
|------|------|------|------|------|
| `current_password` | string | ✅ | 6-128 字符 | 当前密码 |
| `new_password` | string | ✅ | 8-128 字符 | 新密码 |

**请求示例**:
```json
{
  "current_password": "Cisco@123",
  "new_password": "NewPass@456"
}
```

**响应 200** (`UserResponse`)

---

### 1.5 退出登录

**POST** `/api/v1/auth/logout`  
**无需认证**

**请求参数**: 无

**响应 200** (`LogoutResponse`):

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `message` | string | 否 | `"已退出登录"` | 退出消息 |

---

## 2. 员工管理 (Employees)

> 以下所有接口均需认证 ✅

### 2.1 获取员工列表

**GET** `/api/v1/employees`

**请求参数**: 无

**响应 200** (`EmployeeResponse[]`):

```json
[
  {
    "id": "uuid-string",
    "user_id": 1,
    "employee_code": "EMP001",
    "username": "admin",
    "email": "admin@example.com",
    "full_name": "管理员",
    "phone": "13800138000",
    "department": "技术部",
    "region": "北京",
    "position": "技术总监",
    "hire_date": "2024-01-01",
    "work_start_date": "2024-01-01",
    "is_active": true,
    "is_admin": true,
    "is_initial_password": 0,
    "temporary_password": null,
    "module_permissions": [],
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
]
```

---

### 2.2 创建员工

**POST** `/api/v1/employees`

**请求体** (`EmployeeCreate`, `application/json`):

| 字段 | 类型 | 必填 | 约束 | 默认值 | 说明 |
|------|------|------|------|--------|------|
| `username` | string | ✅ | 3-50 字符 | — | 用户名 |
| `email` | string (email) | ✅ | — | — | 邮箱 |
| `full_name` | string | ✅ | 2-50 字符 | — | 姓名 |
| `phone` | string \| null | 否 | ≤20 字符 | — | 手机号 |
| `department` | string | ✅ | 2-50 字符 | — | 部门 |
| `region` | string \| null | 否 | ≤50 字符 | — | 区域 |
| `position` | string \| null | 否 | ≤50 字符 | — | 职位 |
| `is_active` | boolean | 否 | — | `true` | 是否激活 |
| `is_admin` | boolean | 否 | — | `false` | 是否管理员 |
| `module_permissions` | ModulePermission[] | 否 | — | — | 模块权限 |

**请求示例**:
```json
{
  "username": "lisi",
  "email": "lisi@example.com",
  "full_name": "李四",
  "phone": "13900139000",
  "department": "产品部",
  "region": "上海",
  "position": "产品经理",
  "is_active": true,
  "is_admin": false,
  "module_permissions": [
    {
      "module_code": "leave",
      "module_name": "请假管理",
      "can_view": true,
      "can_create": true,
      "can_edit": false,
      "can_delete": false,
      "can_approve": false
    }
  ]
}
```

**响应 201** (`EmployeeResponse`)

---

### 2.3 更新员工权限

**PATCH** `/api/v1/employees/{employee_id}/permissions`

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `employee_id` | string | ✅ | 员工 ID |

**请求体** (`EmployeePermissionUpdate`):

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `module_permissions` | ModulePermission[] | 否 | 模块权限列表 |

**响应 200** (`EmployeeResponse`)

---

### 2.4 重置员工密码

**POST** `/api/v1/employees/{employee_id}/reset-password`

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `employee_id` | string | ✅ | 员工 ID |

**请求体**: 无

**响应 200** (`EmployeePasswordResetResponse`):

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `id` | string | ✅ | — | 员工 ID |
| `user_id` | integer \| null | 否 | — | 用户 ID |
| `employee_code` | string \| null | 否 | — | 员工编号 |
| `username` | string | ✅ | — | 用户名 |
| `temporary_password` | string | ✅ | — | 临时密码 |
| `is_initial_password` | integer | 否 | `1` | 是否初始密码 (0/1) |

---

### 2.5 更新员工状态

**PATCH** `/api/v1/employees/{employee_id}/status`

**路径参数**: `employee_id` (string, 必填)

**请求体** (`EmployeeStatusUpdate`):

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `is_active` | boolean | ✅ | 是否激活 |

**响应 200** (`EmployeeResponse`)

---

### 2.6 更新员工管理员状态

**PATCH** `/api/v1/employees/{employee_id}/admin`

**路径参数**: `employee_id` (string, 必填)

**请求体** (`EmployeeAdminUpdate`):

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `is_admin` | boolean | ✅ | 是否管理员 |

**响应 200** (`EmployeeResponse`)

---

### 2.7 更新我的基本信息

**PATCH** `/api/v1/employees/me/basic-info`

**请求体** (`EmployeeBasicInfoUpdate`):

| 字段 | 类型 | 必填 | 约束 | 说明 |
|------|------|------|------|------|
| `department` | string \| null | 否 | ≤50 字符 | 部门 |
| `position` | string \| null | 否 | ≤50 字符 | 职位 |
| `region` | string \| null | 否 | ≤50 字符 | 区域 |

**响应 200** (`EmployeeResponse`)

---

### 2.8 更新员工基本信息

**PATCH** `/api/v1/employees/{employee_id}/basic-info`

**路径参数**: `employee_id` (string, 必填)

**请求体**: 同 2.7 (`EmployeeBasicInfoUpdate`)

**响应 200** (`EmployeeResponse`)

---

### 2.9 获取我的详细档案

**GET** `/api/v1/employees/me/profile`

**请求参数**: 无

**响应 200** (`EmployeeProfileResponse`):

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `employee_id` | string | ✅ | 员工 ID |
| `hire_date` | string (date) \| null | 否 | 入职日期 |
| `work_start_date` | string (date) \| null | 否 | 工作开始日期 |
| `birth_date` | string (date) \| null | 否 | 出生日期 |
| `id_number` | string \| null | 否 | 身份证号 |
| `address` | string \| null | 否 | 地址 |
| `emergency_contact_name` | string \| null | 否 | 紧急联系人姓名 |
| `emergency_contact_phone` | string \| null | 否 | 紧急联系人电话 |
| `created_at` | string (datetime) \| null | 否 | 创建时间 |
| `updated_at` | string (datetime) \| null | 否 | 更新时间 |

---

### 2.10 更新我的详细档案

**PATCH** `/api/v1/employees/me/profile`

**请求体** (`EmployeeProfileUpdate`):

| 字段 | 类型 | 必填 | 约束 | 说明 |
|------|------|------|------|------|
| `hire_date` | string (date) \| null | 否 | — | 入职日期 |
| `work_start_date` | string (date) \| null | 否 | — | 工作开始日期 |
| `birth_date` | string (date) \| null | 否 | — | 出生日期 |
| `id_number` | string \| null | 否 | ≤50 字符 | 身份证号 |
| `address` | string \| null | 否 | ≤200 字符 | 地址 |
| `emergency_contact_name` | string \| null | 否 | ≤50 字符 | 紧急联系人姓名 |
| `emergency_contact_phone` | string \| null | 否 | ≤30 字符 | 紧急联系人电话 |

**响应 200** (`EmployeeProfileResponse`)

---

### 2.11 获取员工详细档案

**GET** `/api/v1/employees/{employee_id}/profile`

**路径参数**: `employee_id` (string, 必填)

**响应 200** (`EmployeeProfileResponse`)

---

### 2.12 更新员工详细档案

**PATCH** `/api/v1/employees/{employee_id}/profile`

**路径参数**: `employee_id` (string, 必填)

**请求体**: 同 2.10 (`EmployeeProfileUpdate`)

**响应 200** (`EmployeeProfileResponse`)

---

## 3. 请假管理 (Leave Requests)

> 以下所有接口均需认证 ✅

### 3.1 创建请假申请

**POST** `/api/v1/leave-requests`

**请求体** (`LeaveRequestCreate`, `application/json`):

| 字段 | 类型 | 必填 | 约束 | 默认值 | 说明 |
|------|------|------|------|--------|------|
| `employee_id` | string \| null | 否 | — | — | 员工 ID（管理员可代请） |
| `leave_type` | LeaveType | ✅ | 见枚举 | — | 请假类型 |
| `start_date` | string (date) | ✅ | — | — | 开始日期 |
| `end_date` | string (date) | ✅ | — | — | 结束日期 |
| `session` | LeaveSession | 否 | 见枚举 | `full_day` | 请假时段 |
| `reason` | string \| null | 否 | ≤500 字符 | — | 请假原因 |
| `handover_to` | string \| null | 否 | ≤100 字符 | — | 工作交接人 |

**请求示例**:
```json
{
  "leave_type": "annual",
  "start_date": "2026-08-01",
  "end_date": "2026-08-03",
  "session": "full_day",
  "reason": "家庭事务",
  "handover_to": "王五"
}
```

**响应 201** (`LeaveRequestResponse`)

---

### 3.2 获取请假列表

**GET** `/api/v1/leave-requests`

**查询参数**:

| 参数 | 类型 | 必填 | 约束 | 说明 |
|------|------|------|------|------|
| `year` | integer \| null | 否 | 2000-2100 | 年份 |
| `team` | string \| null | 否 | — | 团队/部门筛选 |
| `region` | string \| null | 否 | — | 区域筛选 |
| `employee_keyword` | string \| null | 否 | — | 员工关键字搜索 |
| `approval_status` | LeaveApprovalStatus \| null | 否 | 见枚举 | 审批状态筛选 |

**响应 200** (`LeaveRequestResponse[]`)

---

### 3.3 获取我的请假列表

**GET** `/api/v1/leave-requests/my`

**请求参数**: 无

**响应 200** (`LeaveRequestResponse[]`)

---

### 3.4 获取我的待审批列表

**GET** `/api/v1/leave-requests/approvals/my`

**请求参数**: 无

**响应 200** (`LeaveRequestResponse[]`)

---

### 3.5 获取我的审批记录

**GET** `/api/v1/leave-requests/approvals/records/my`

**请求参数**: 无

**响应 200** (`LeaveApprovalRecordResponse[]`)

---

### 3.6 获取年假汇总

**GET** `/api/v1/leave-requests/annual-leave/summary`

**查询参数**:

| 参数 | 类型 | 必填 | 约束 | 说明 |
|------|------|------|------|------|
| `year` | integer | ✅ | 2000-2100 | 年份 |

**响应 200** (`AnnualLeaveSummaryResponse`):

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `year` | integer | ✅ | 年份 |
| `region` | string \| null | 否 | 区域 |
| `entitlement_days` | number | ✅ | 应享年假天数 |
| `used_days` | number | ✅ | 已使用天数 |
| `available_days` | number | ✅ | 剩余可用天数 |

**响应示例**:
```json
{
  "year": 2026,
  "region": "北京",
  "entitlement_days": 15,
  "used_days": 3,
  "available_days": 12
}
```

---

### 3.7 获取请假日历

**GET** `/api/v1/leave-requests/calendar`

**查询参数**:

| 参数 | 类型 | 必填 | 约束 | 说明 |
|------|------|------|------|------|
| `year` | integer | ✅ | 2000-2100 | 年份 |
| `team` | string \| null | 否 | — | 团队筛选 |
| `region` | string \| null | 否 | — | 区域筛选 |
| `employee_keyword` | string \| null | 否 | — | 员工关键字 |
| `approval_status` | LeaveApprovalStatus \| null | 否 | 见枚举 | 审批状态 |

**响应 200** (`LeaveCalendarResponse`):

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `year` | integer | ✅ | 年份 |
| `total` | integer | ✅ | 请假总数 |
| `items` | LeaveRequestResponse[] | 否 | 请假列表 |

---

### 3.8 获取单个请假申请

**GET** `/api/v1/leave-requests/{leave_request_id}`

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `leave_request_id` | string | ✅ | 请假申请 ID |

**响应 200** (`LeaveRequestResponse`)

---

### 3.9 审批请假申请

**PATCH** `/api/v1/leave-requests/{leave_request_id}/approval`

**路径参数**: `leave_request_id` (string, 必填)

**请求体** (`LeaveRequestApprovalUpdate`, `application/json`):

| 字段 | 类型 | 必填 | 约束 | 说明 |
|------|------|------|------|------|
| `approval_status` | LeaveApprovalStatus | ✅ | 见枚举 | 审批结果 |
| `review_comment` | string \| null | 否 | ≤500 字符 | 审批意见 |

**请求示例**:
```json
{
  "approval_status": "approved",
  "review_comment": "同意"
}
```

**响应 200** (`LeaveRequestResponse`)

---

### 3.10 撤回请假申请

**PATCH** `/api/v1/leave-requests/{leave_request_id}/withdraw`

**路径参数**: `leave_request_id` (string, 必填)

**请求体** (`LeaveRequestWithdraw`, `application/json`):

| 字段 | 类型 | 必填 | 约束 | 说明 |
|------|------|------|------|------|
| `withdraw_comment` | string \| null | 否 | ≤500 字符 | 撤回原因 |

**响应 200** (`LeaveRequestResponse`)

---

## 4. 请假流程 (Leave Workflows)

> 以下所有接口均需认证 ✅

### 4.1 获取请假流程列表

**GET** `/api/v1/leave-workflows`

**请求参数**: 无

**响应 200** (`LeaveWorkflowResponse[]`)

---

### 4.2 创建请假流程

**POST** `/api/v1/leave-workflows`

**请求体** (`LeaveWorkflowCreate`, `application/json`):

| 字段 | 类型 | 必填 | 约束 | 默认值 | 说明 |
|------|------|------|------|--------|------|
| `name` | string | ✅ | 2-50 字符 | — | 流程名称 |
| `priority` | integer | 否 | 1-9999 | `100` | 优先级（数字越小优先级越高） |
| `is_active` | boolean | 否 | — | `true` | 是否启用 |
| `match` | LeaveWorkflowMatch | 否 | — | — | 匹配条件 |
| `approvers` | LeaveWorkflowApprover[] | 否 | — | — | 审批人列表 |

**请求示例**:
```json
{
  "name": "技术部请假审批",
  "priority": 1,
  "is_active": true,
  "match": {
    "department": "技术部"
  },
  "approvers": [
    {
      "user_id": "uuid-string",
      "username": "manager",
      "full_name": "部门经理"
    }
  ]
}
```

**响应 200** (`LeaveWorkflowResponse`)

---

### 4.3 更新请假流程

**PATCH** `/api/v1/leave-workflows/{workflow_id}`

**路径参数**: `workflow_id` (string, 必填)

**请求体** (`LeaveWorkflowUpdate`, `application/json`):

| 字段 | 类型 | 必填 | 约束 | 说明 |
|------|------|------|------|------|
| `name` | string \| null | 否 | 2-50 字符 | 流程名称 |
| `priority` | integer \| null | 否 | 1-9999 | 优先级 |
| `is_active` | boolean \| null | 否 | — | 是否启用 |
| `match` | LeaveWorkflowMatch \| null | 否 | — | 匹配条件 |
| `approvers` | LeaveWorkflowApprover[] \| null | 否 | — | 审批人列表 |

**响应 200** (`LeaveWorkflowResponse`)

---

### 4.4 删除请假流程

**DELETE** `/api/v1/leave-workflows/{workflow_id}`

**路径参数**: `workflow_id` (string, 必填)

**响应 200**: 空对象 `{}`

---

## 5. 系统设置 (System Settings)

> 以下所有接口均需认证 ✅

### 5.1 获取系统设置

**GET** `/api/v1/system-settings`

**请求参数**: 无

**响应 200** (`SystemSettingsResponse`):

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | ✅ | 设置 ID |
| `departments` | string[] | 否 | 部门列表 |
| `positions` | string[] | 否 | 职位列表 |
| `regions` | string[] | 否 | 区域列表 |
| `modules` | SystemModuleItem[] | 否 | 系统模块列表 |
| `regional_holidays` | RegionalHolidayItem[] | 否 | 区域假日列表 |
| `regional_holiday_catalogs` | RegionalHolidayCatalogItem[] | 否 | 区域假日目录 |
| `created_at` | string (datetime) \| null | 否 | 创建时间 |
| `updated_at` | string (datetime) \| null | 否 | 更新时间 |

---

### 5.2 更新系统设置

**PUT** `/api/v1/system-settings`

**请求体** (`SystemSettingsUpdate`, `application/json`):

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `departments` | string[] | 否 | 部门列表 |
| `positions` | string[] | 否 | 职位列表 |
| `regions` | string[] | 否 | 区域列表 |
| `modules` | SystemModuleItem[] | 否 | 系统模块 |
| `regional_holidays` | RegionalHolidayItem[] | 否 | 区域假日 |
| `regional_holiday_catalogs` | RegionalHolidayCatalogItem[] | 否 | 区域假日目录 |

**请求示例**:
```json
{
  "departments": ["技术部", "产品部", "市场部", "人事部"],
  "positions": ["工程师", "产品经理", "设计师", "总监"],
  "regions": ["北京", "上海", "深圳", "广州"]
}
```

**响应 200** (`SystemSettingsResponse`)

---

### 5.3 新增/更新区域假日

**PUT** `/api/v1/system-settings/regional-holidays`

**请求体** (`RegionalHolidayUpsert`, `application/json`):

| 字段 | 类型 | 必填 | 约束 | 说明 |
|------|------|------|------|------|
| `region` | string | ✅ | 1-50 字符 | 区域 |
| `date` | string (date) | ✅ | — | 假日日期 |
| `holiday_name` | string | ✅ | 1-50 字符 | 假日名称 |

**响应 200** (`SystemSettingsResponse`)

---

### 5.4 删除区域假日

**DELETE** `/api/v1/system-settings/regional-holidays`

**请求体** (`RegionalHolidayDelete`, `application/json`):

| 字段 | 类型 | 必填 | 约束 | 说明 |
|------|------|------|------|------|
| `region` | string | ✅ | 1-50 字符 | 区域 |
| `date` | string (date) | ✅ | — | 假日日期 |

**响应 200** (`SystemSettingsResponse`)

---

### 5.5 批量新增/更新区域假日

**PUT** `/api/v1/system-settings/regional-holidays/range`

**请求体** (`RegionalHolidayRangeUpsert`, `application/json`):

| 字段 | 类型 | 必填 | 约束 | 说明 |
|------|------|------|------|------|
| `region` | string | ✅ | 1-50 字符 | 区域 |
| `start_date` | string (date) | ✅ | — | 开始日期 |
| `end_date` | string (date) \| null | 否 | — | 结束日期 |
| `holiday_name` | string | ✅ | 1-50 字符 | 假日名称 |

**响应 200** (`SystemSettingsResponse`)

---

### 5.6 批量删除区域假日

**DELETE** `/api/v1/system-settings/regional-holidays/range`

**请求体** (`RegionalHolidayRangeDelete`, `application/json`):

| 字段 | 类型 | 必填 | 约束 | 说明 |
|------|------|------|------|------|
| `region` | string | ✅ | 1-50 字符 | 区域 |
| `start_date` | string (date) | ✅ | — | 开始日期 |
| `end_date` | string (date) \| null | 否 | — | 结束日期 |

**响应 200** (`SystemSettingsResponse`)

---

## 6. 公共数据模型

### UserResponse

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `id` | string | ✅ | — | 用户 ID |
| `user_id` | integer \| null | 否 | — | 关联的 employee user_id |
| `username` | string | ✅ | — | 用户名 (3-50) |
| `email` | string (email) | ✅ | — | 邮箱 |
| `full_name` | string \| null | 否 | — | 全名 |
| `phone` | string \| null | 否 | — | 电话 |
| `department` | string \| null | 否 | — | 部门 |
| `region` | string \| null | 否 | — | 区域 |
| `position` | string \| null | 否 | — | 职位 |
| `hire_date` | string \| null | 否 | — | 入职日期 |
| `work_start_date` | string \| null | 否 | — | 工作开始日期 |
| `is_active` | boolean | 否 | `true` | 是否激活 |
| `is_admin` | boolean | 否 | `false` | 是否管理员 |
| `is_initial_password` | integer | 否 | `0` | 是否初始密码 (0/1) |
| `temporary_password` | string \| null | 否 | — | 临时密码 |
| `module_permissions` | ModulePermission[] | 否 | — | 模块权限 |
| `created_at` | string (datetime) \| null | 否 | — | 创建时间 |
| `updated_at` | string (datetime) \| null | 否 | — | 更新时间 |

### EmployeeResponse

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `id` | string | ✅ | — | 员工 ID |
| `user_id` | integer \| null | 否 | — | 用户 ID |
| `employee_code` | string \| null | 否 | — | 员工编号 |
| `username` | string | ✅ | — | 用户名 |
| `email` | string (email) | ✅ | — | 邮箱 |
| `full_name` | string \| null | 否 | — | 姓名 |
| `phone` | string \| null | 否 | — | 电话 |
| `department` | string \| null | 否 | — | 部门 |
| `region` | string \| null | 否 | — | 区域 |
| `position` | string \| null | 否 | — | 职位 |
| `hire_date` | string \| null | 否 | — | 入职日期 |
| `work_start_date` | string \| null | 否 | — | 工作开始日期 |
| `is_active` | boolean | 否 | `true` | 是否激活 |
| `is_admin` | boolean | 否 | `false` | 是否管理员 |
| `is_initial_password` | integer | 否 | `0` | 是否初始密码 |
| `temporary_password` | string \| null | 否 | — | 临时密码 |
| `module_permissions` | ModulePermission[] | 否 | — | 模块权限 |
| `created_at` | string (datetime) \| null | 否 | — | 创建时间 |
| `updated_at` | string (datetime) \| null | 否 | — | 更新时间 |

### EmployeeProfileResponse

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `employee_id` | string | ✅ | 员工 ID |
| `hire_date` | string (date) \| null | 否 | 入职日期 |
| `work_start_date` | string (date) \| null | 否 | 工作开始日期 |
| `birth_date` | string (date) \| null | 否 | 出生日期 |
| `id_number` | string \| null | 否 | 身份证号 |
| `address` | string \| null | 否 | 地址 |
| `emergency_contact_name` | string \| null | 否 | 紧急联系人姓名 |
| `emergency_contact_phone` | string \| null | 否 | 紧急联系人电话 |
| `created_at` | string (datetime) \| null | 否 | 创建时间 |
| `updated_at` | string (datetime) \| null | 否 | 更新时间 |

### ModulePermission

| 字段 | 类型 | 必填 | 约束 | 默认值 | 说明 |
|------|------|------|------|--------|------|
| `module_code` | string | ✅ | 2-50 字符 | — | 模块代码 |
| `module_name` | string | ✅ | 2-50 字符 | — | 模块名称 |
| `can_view` | boolean | 否 | — | `true` | 查看权限 |
| `can_create` | boolean | 否 | — | `false` | 创建权限 |
| `can_edit` | boolean | 否 | — | `false` | 编辑权限 |
| `can_delete` | boolean | 否 | — | `false` | 删除权限 |
| `can_approve` | boolean | 否 | — | `false` | 审批权限 |

### LeaveRequestResponse

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | ✅ | 请假 ID |
| `employee_id` | string | ✅ | 员工 ID |
| `employee_user_id` | integer \| null | 否 | 员工 user_id |
| `employee_code` | string \| null | 否 | 员工编号 |
| `employee_username` | string | ✅ | 员工用户名 |
| `employee_name` | string | ✅ | 员工姓名 |
| `employee_department` | string \| null | 否 | 员工部门 |
| `employee_region` | string \| null | 否 | 员工区域 |
| `leave_type` | LeaveType | ✅ | 请假类型 |
| `approval_status` | LeaveApprovalStatus | ✅ | 审批状态 |
| `approval_chain` | object[] | 否 | 审批链 |
| `current_approver_id` | string \| null | 否 | 当前审批人 ID |
| `approval_history` | object[] | 否 | 审批历史 |
| `session` | LeaveSession | ✅ | 请假时段 |
| `start_date` | string (date) | ✅ | 开始日期 |
| `end_date` | string (date) | ✅ | 结束日期 |
| `date_keys` | string[] | 否 | 日期键列表 |
| `reason` | string \| null | 否 | 请假原因 |
| `handover_to` | string \| null | 否 | 工作交接人 |
| `created_by_id` | string | ✅ | 创建人 ID |
| `created_by_name` | string | ✅ | 创建人姓名 |
| `reviewer_id` | string \| null | 否 | 审批人 ID |
| `reviewer_name` | string \| null | 否 | 审批人姓名 |
| `review_comment` | string \| null | 否 | 审批意见 |
| `reviewed_at` | string (datetime) \| null | 否 | 审批时间 |
| `created_at` | string (datetime) \| null | 否 | 创建时间 |
| `updated_at` | string (datetime) \| null | 否 | 更新时间 |

### LeaveApprovalRecordResponse

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | ✅ | 记录 ID |
| `leave_request_id` | string | ✅ | 请假申请 ID |
| `action` | LeaveApprovalRecordAction | ✅ | 操作类型 |
| `operator_id` | string | ✅ | 操作人 ID |
| `operator_username` | string | ✅ | 操作人用户名 |
| `operator_name` | string \| null | 否 | 操作人姓名 |
| `operator_role` | string \| null | 否 | 操作人角色 |
| `employee_id` | string | ✅ | 员工 ID |
| `employee_user_id` | integer \| null | 否 | 员工 user_id |
| `employee_code` | string \| null | 否 | 员工编号 |
| `employee_username` | string | ✅ | 员工用户名 |
| `employee_name` | string | ✅ | 员工姓名 |
| `employee_department` | string \| null | 否 | 员工部门 |
| `employee_region` | string \| null | 否 | 员工区域 |
| `leave_type` | LeaveType | ✅ | 请假类型 |
| `session` | LeaveSession | ✅ | 请假时段 |
| `start_date` | string (date) | ✅ | 开始日期 |
| `end_date` | string (date) | ✅ | 结束日期 |
| `reason` | string \| null | 否 | 请假原因 |
| `handover_to` | string \| null | 否 | 交接人 |
| `comment` | string \| null | 否 | 操作备注 |
| `approval_status_before` | LeaveApprovalStatus \| null | 否 | 操作前状态 |
| `approval_status_after` | LeaveApprovalStatus | ✅ | 操作后状态 |
| `current_approver_id_before` | string \| null | 否 | 操作前审批人 ID |
| `current_approver_id_after` | string \| null | 否 | 操作后审批人 ID |
| `current_approver_name_after` | string \| null | 否 | 操作后审批人姓名 |
| `current_approver_level_after` | integer \| null | 否 | 操作后审批级别 |
| `is_flowing` | boolean | 否 | 是否流转中 (默认 false) |
| `created_at` | string (datetime) \| null | 否 | 创建时间 |

### LeaveWorkflowResponse

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | ✅ | 流程 ID |
| `name` | string | ✅ | 流程名称 |
| `priority` | integer | ✅ | 优先级 |
| `is_active` | boolean | ✅ | 是否启用 |
| `match` | LeaveWorkflowMatch | ✅ | 匹配条件 |
| `approvers` | LeaveWorkflowApprover[] | 否 | 审批人列表 |
| `created_at` | string (datetime) \| null | 否 | 创建时间 |
| `updated_at` | string (datetime) \| null | 否 | 更新时间 |

### LeaveWorkflowMatch

| 字段 | 类型 | 必填 | 约束 | 说明 |
|------|------|------|------|------|
| `employee_id` | string \| null | 否 | — | 指定员工 |
| `department` | string \| null | 否 | ≤50 字符 | 匹配部门 |
| `region` | string \| null | 否 | ≤50 字符 | 匹配区域 |
| `position` | string \| null | 否 | ≤50 字符 | 匹配职位 |

### LeaveWorkflowApprover

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `user_id` | string | ✅ | 审批人 ID |
| `username` | string | ✅ | 审批人用户名 |
| `full_name` | string \| null | 否 | 审批人姓名 |

### SystemSettingsResponse

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | ✅ | 设置 ID |
| `departments` | string[] | 否 | 部门列表 |
| `positions` | string[] | 否 | 职位列表 |
| `regions` | string[] | 否 | 区域列表 |
| `modules` | SystemModuleItem[] | 否 | 系统模块 |
| `regional_holidays` | RegionalHolidayItem[] | 否 | 区域假日 |
| `regional_holiday_catalogs` | RegionalHolidayCatalogItem[] | 否 | 假日目录 |
| `created_at` | string (datetime) \| null | 否 | 创建时间 |
| `updated_at` | string (datetime) \| null | 否 | 更新时间 |

### SystemModuleItem

| 字段 | 类型 | 必填 | 约束 | 说明 |
|------|------|------|------|------|
| `module_code` | string | ✅ | 2-50 字符 | 模块代码 |
| `module_name` | string | ✅ | 2-50 字符 | 模块名称 |

### RegionalHolidayItem

| 字段 | 类型 | 必填 | 约束 | 说明 |
|------|------|------|------|------|
| `region` | string | ✅ | 1-50 字符 | 区域 |
| `date` | string (date) | ✅ | — | 假日日期 |
| `holiday_name` | string | ✅ | 1-50 字符 | 假日名称 |

### RegionalHolidayCatalogItem

| 字段 | 类型 | 必填 | 约束 | 说明 |
|------|------|------|------|------|
| `region` | string | ✅ | 1-50 字符 | 区域 |
| `holiday_names` | string[] | 否 | — | 假日名称列表 |

### HTTPValidationError (422 错误响应)

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `detail` | ValidationError[] | 否 | 验证错误列表 |

### ValidationError

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `loc` | (string \| integer)[] | ✅ | 错误字段路径 |
| `msg` | string | ✅ | 错误消息 |
| `type` | string | ✅ | 错误类型 |

---

## 7. 枚举类型

### LeaveType (请假类型)

| 值 | 说明 |
|------|------|
| `annual` | 年假 |
| `personal` | 事假 |
| `sick` | 病假 |
| `lieu` | 调休 |
| `long` | 长假 |

### LeaveSession (请假时段)

| 值 | 说明 |
|------|------|
| `full_day` | 全天 |
| `morning` | 上午 |
| `afternoon` | 下午 |

### LeaveApprovalStatus (审批状态)

| 值 | 说明 |
|------|------|
| `pending` | 待审批 |
| `approved` | 已通过 |
| `rejected` | 已拒绝 |
| `withdrawn` | 已撤回 |

### LeaveApprovalRecordAction (审批操作类型)

| 值 | 说明 |
|------|------|
| `submitted` | 提交 |
| `approved` | 通过 |
| `rejected` | 拒绝 |
| `withdrawn` | 撤回 |

---

## 附录：HTTP 状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 401 | 未认证（Token 无效或过期） |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 422 | 参数验证失败 |
| 500 | 服务器内部错误 |
## API汇总

根据 `http://10.254.253.187:8999/docs#/` 的后台API，共分为5个模块：

### 1. 认证模块 (`/api/v1/auth`)
| 接口 | 方法 | 功能 |
|------|------|------|
| `/auth/login` | POST | 用户登录 |
| `/auth/logout` | POST | 用户登出 |
| `/auth/change-password` | POST | 修改密码 |

### 2. 员工管理 (`/api/v1/employees`)
| 接口 | 方法 | 功能 |
|------|------|------|
| `/employees` | GET | 获取员工列表 |
| `/employees` | POST | 创建新员工 |
| `/employees/me/profile` | GET | 获取当前用户档案 |
| `/employees/me/profile` | PATCH | 更新当前用户档案 |
| `/employees/me/basic-info` | PATCH | 更新当前用户基本信息 |
| `/employees/{id}/profile` | GET | 获取指定员工档案 |
| `/employees/{id}/profile` | PATCH | 更新指定员工档案 |
| `/employees/{id}/basic-info` | PATCH | 更新指定员工基本信息 |
| `/employees/{id}/status` | PATCH | 更新员工在职状态 |
| `/employees/{id}/admin` | PATCH | 更新员工管理员权限 |
| `/employees/{id}/permissions` | PATCH | 更新员工模块权限 |
| `/employees/{id}/reset-password` | POST | 重置员工密码 |

### 3. 请假管理 (`/api/v1/leave-requests`)
| 接口 | 方法 | 功能 |
|------|------|------|
| `/leave-requests` | GET | 获取请假申请列表 |
| `/leave-requests` | POST | 提交请假申请 |
| `/leave-requests/{id}` | GET | 获取请假申请详情 |
| `/leave-requests/{id}` | DELETE | 撤销请假申请 |
| `/leave-requests/{id}/review` | POST | 审批请假申请 |

### 4. 请假流程 (`/api/v1/leave-workflows`)
| 接口 | 方法 | 功能 |
|------|------|------|
| `/leave-workflows` | GET | 获取审批流程列表 |
| `/leave-workflows` | POST | 创建审批流程 |
| `/leave-workflows/{id}` | GET | 获取流程详情 |
| `/leave-workflows/{id}` | PUT | 更新审批流程 |
| `/leave-workflows/{id}` | DELETE | 删除审批流程 |

### 5. 系统参数 (`/api/v1/system-settings`)
| 接口 | 方法 | 功能 |
|------|------|------|
| `/system-settings` | GET | 获取系统设置 |
| `/system-settings` | PUT | 更新系统设置 |
| `/system-settings/regional-holidays` | PUT | 新增/更新区域节日 |
| `/system-settings/regional-holidays` | DELETE | 删除区域节日 |
| `/system-settings/regional-holidays/range` | PUT | 新增/更新区域假期范围 |
| `/system-settings/regional-holidays/range` | DELETE | 删除区域假期范围 |
