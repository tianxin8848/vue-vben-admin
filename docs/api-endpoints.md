# 后端接口分类梳理

> 后端地址：`http://10.254.253.187:8999`
> API 文档：`http://10.254.253.187:8999/docs`
> 统计时间：2026-08-17

## 总览

| 分类 | 接口数 | 说明 |
|------|--------|------|
| 认证（共用） | 5 | 登录/登出/注册/改密/获取当前用户 |
| 员工端（/me/*） | 22 | 员工自助：个人信息、请假、报销 |
| 管理端 | 47 | 管理员功能：员工管理、门禁、请假审批、流程、系统参数管理、数据迁移 |
| **合计** | **74** | |

---

## 一、认证接口（共用，5 个）

所有已登录用户均可调用。

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/api/v1/auth/login` | 登录 | 无需登录 |
| POST | `/api/v1/auth/logout` | 登出 | 无需登录 |
| POST | `/api/v1/auth/register` | 注册用户 | 无需登录 |
| GET | `/api/v1/auth/me` | 获取当前用户信息（含 module_permissions） | 需登录 |
| POST | `/api/v1/auth/change-password` | 修改自己的密码 | 需登录 |

---

## 二、员工端接口（/me/*，22 个）

普通员工自助操作，路径统一以 `/api/v1/me/` 开头。

### 2.1 个人信息（6 个）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/v1/me/basic-info` | 读取当前用户基础信息 | 需登录 |
| PATCH | `/api/v1/me/basic-info` | 更新当前用户基础信息 | 需登录 |
| PATCH | `/api/v1/me/avatar` | 更新当前用户头像 | 需登录 |
| GET | `/api/v1/me/profile` | 读取当前用户档案 | 需登录 |
| PATCH | `/api/v1/me/profile` | 更新当前用户档案（受自助可编辑字段限制） | 需登录 |
| GET | `/api/v1/me/profile-meta` | 当前用户档案元数据（下拉选项） | 需登录 |

### 2.2 请假申请（7 个）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/v1/me/leave-requests` | 列出当前用户的请假 | `employee_leave` |
| POST | `/api/v1/me/leave-requests` | 提交当前用户的请假 | `employee_leave` |
| GET | `/api/v1/me/leave-requests/annual-leave/summary` | 当前用户年假汇总 | `employee_leave` |
| GET | `/api/v1/me/leave-requests/department` | 列出当前用户部门的请假 | `employee_leave` |
| PATCH | `/api/v1/me/leave-requests/{leave_request_id}/withdraw` | 撤回当前用户的请假 | `employee_leave` |
| GET | `/api/v1/me/leave-requests/approvals` | 列出当前用户待审的请假 | 需登录 |
| GET | `/api/v1/me/leave-requests/approval-records` | 列出当前用户相关的请假审批记录 | 需登录 |

### 2.3 报销管理（9 个）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/api/v1/me/claims` | 创建当前用户的报销草稿 | `claim_management` |
| GET | `/api/v1/me/claims` | 列出当前用户的报销 | `claim_management` |
| POST | `/api/v1/me/claims/submit` | 批量提交报销草稿 | `claim_management` |
| POST | `/api/v1/me/claims/{claim_id}/submit` | 提交单条报销草稿 | `claim_management` |
| DELETE | `/api/v1/me/claims/{claim_id}` | 删除报销草稿 | `claim_management` |
| PATCH | `/api/v1/me/claims/{claim_id}/withdraw` | 撤回待审批报销 | `claim_management` |
| GET | `/api/v1/me/claims/export` | 导出当前用户的报销 | `claim_management` |
| GET | `/api/v1/me/claims/approvals` | 列出当前用户待审的报销 | 需登录 |
| GET | `/api/v1/me/claims/approval-records` | 列出当前用户相关的报销审批记录 | 需登录 |

---

## 三、管理端接口（47 个）

管理员才能调用，按功能模块划分。

### 3.1 员工管理（15 个）— 需要 `user_management`

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/v1/employees` | 列出全部员工 | `user_management` |
| POST | `/api/v1/employees` | 创建员工 | `user_management` |
| GET | `/api/v1/employees/manage/meta` | 用户管理元数据（部门/岗位/地区/模块选项） | `user_management` |
| DELETE | `/api/v1/employees/{employee_id}` | 删除员工 | `user_management` |
| PATCH | `/api/v1/employees/{employee_id}/avatar` | 更新指定员工头像 | `user_management` |
| GET | `/api/v1/employees/{employee_id}/basic-info` | 读取指定员工基础信息 | `user_management` |
| PATCH | `/api/v1/employees/{employee_id}/basic-info` | 更新指定员工基础信息 | `user_management` |
| PATCH | `/api/v1/employees/{employee_id}/permissions` | 更新员工模块权限 | `user_management` |
| GET | `/api/v1/employees/{employee_id}/profile` | 读取指定员工档案 | `user_management` |
| PATCH | `/api/v1/employees/{employee_id}/profile` | 更新指定员工档案 | `user_management` |
| GET | `/api/v1/employees/{employee_id}/profile-meta` | 指定员工档案元数据 | `user_management` |
| POST | `/api/v1/employees/{employee_id}/reset-password` | 重置员工密码 | `user_management` |
| PATCH | `/api/v1/employees/{employee_id}/status` | 更新员工启用状态 | `user_management` |
| GET | `/api/v1/employees/org-options` | 组织下拉选项 | 需登录 |
| GET | `/api/v1/employees/avatars/{username}/{file_name}` | 读取员工头像文件 | 需登录 |

### 3.2 门禁维护（3 个）— 需要 `access_control`

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/v1/access-control/employees` | 列出门禁员工 | `access_control` |
| PATCH | `/api/v1/access-control/employees/{employee_id}` | 更新员工门禁 ID | `access_control` |
| PATCH | `/api/v1/employees/{employee_id}/access-control-id` | 更新员工门禁 ID | `access_control` |

### 3.3 请假管理（8 个）— 需要 `leave_calendar`

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/v1/leave-requests` | 列出全部请假 | `leave_calendar` |
| GET | `/api/v1/leave-requests/{leave_request_id}` | 读取一条请假 | `employee_leave` |
| PATCH | `/api/v1/leave-requests/{leave_request_id}/approval` | 审批一条请假 | 需登录（审批人） |
| GET | `/api/v1/leave-requests/approvals/meta` | 请假审批筛选项 | 需登录 |
| GET | `/api/v1/leave-requests/calendar` | 请假日历 | `leave_calendar` |
| GET | `/api/v1/leave-requests/calendar/meta` | 请假日历筛选项 | `leave_calendar` |
| PUT | `/api/v1/leave-requests/calendar/regional-holidays` | 写入地区假期 | `leave_calendar` |
| DELETE | `/api/v1/leave-requests/calendar/regional-holidays` | 删除地区假期 | `leave_calendar` |

### 3.4 请假流程（5 个）— 需要 `leave_workflows`

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/v1/leave-workflows` | 列出请假流程 | `leave_workflows` |
| POST | `/api/v1/leave-workflows` | 创建请假流程 | `leave_workflows` |
| GET | `/api/v1/leave-workflows/meta` | 请假流程元数据 | `leave_workflows` |
| PATCH | `/api/v1/leave-workflows/{workflow_id}` | 更新请假流程 | `leave_workflows` |
| DELETE | `/api/v1/leave-workflows/{workflow_id}` | 删除请假流程 | `leave_workflows` |

### 3.5 报销管理（5 个）— 需要 `claim_management`

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/v1/claims` | 列出全部报销 | `claim_management` |
| GET | `/api/v1/claims/options` | 报销选项（理由与币种） | `claim_management` |
| GET | `/api/v1/claims/{claim_id}` | 读取一条报销 | `claim_management` |
| PATCH | `/api/v1/claims/{claim_id}/approval` | 审批一条报销 | 需登录（审批人） |
| GET | `/api/v1/claims/attachments/{username}/{file_name}` | 读取报销附件 | 需登录（申请人/审批人/管理员） |

### 3.6 系统参数管理（6 个）— 需要 `system_settings`

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/v1/system-settings` | 获取系统设置 | `system_settings` |
| PUT | `/api/v1/system-settings` | 更新系统设置 | `system_settings` |
| PUT | `/api/v1/system-settings/regional-holidays` | 写入地区假期 | `system_settings` |
| DELETE | `/api/v1/system-settings/regional-holidays` | 删除地区假期 | `system_settings` |
| PUT | `/api/v1/system-settings/regional-holidays/range` | 写入地区假期范围 | `system_settings` |
| DELETE | `/api/v1/system-settings/regional-holidays/range` | 删除地区假期范围 | `system_settings` |

### 3.7 数据迁移（5 个）— 需要 `data_migration`

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/api/v1/data-migration/backup` | 备份全部数据 | `data_migration` |
| GET | `/api/v1/data-migration/backups` | 列出备份 | `data_migration` |
| GET | `/api/v1/data-migration/backups/{filename}` | 下载备份 | `data_migration` |
| GET | `/api/v1/data-migration/export` | 导出全部数据 | `data_migration` |
| POST | `/api/v1/data-migration/import` | 导入全部数据 | `data_migration` |

---

## 四、模块权限码汇总

| 模块权限码 | 对应功能 | 管理端接口数 | 员工端接口数 |
|-----------|---------|-------------|-------------|
| `user_management` | 员工管理 | 15 | 0 |
| `access_control` | 门禁维护 | 3 | 0 |
| `leave_calendar` | 请假管理/日历 | 8 | 0 |
| `leave_workflows` | 请假流程配置 | 5 | 0 |
| `approval_management` | 审批管理 | 2（审批接口） | 0 |
| `claim_management` | 报销管理 | 5 | 9 |
| `system_settings` | 系统参数管理 | 6 | 0 |
| `data_migration` | 数据迁移 | 5 | 0 |
| `employee_leave` | 员工请假申请 | 0 | 7 |
| —（仅需登录） | 个人信息/审批记录 | 0 | 6 |

> **注意：** 超级管理员（admin）的 `module_permissions` 为空数组，前端兜底逻辑会自动授予 4 个核心模块：`user_management`、`system_settings`、`data_migration`、`access_control`。

---

## 五、前端路由与接口对应关系

### 管理端路由（admin 可见）

| 路由路径 | 页面名称 | 对应模块权限 | 主要接口 |
|---------|---------|-------------|---------|
| `/employee/manage/users` | 用户列表 | `user_management` | `/api/v1/employees` |
| `/employee/manage/settings` | 系统参数管理 | `system_settings` | `/api/v1/system-settings` |
| `/employee/manage/data-migration` | 数据处理维护 | `data_migration` | `/api/v1/data-migration/*` |
| `/employee/manage/access-control` | 门禁维护 | `access_control` | `/api/v1/access-control/*` |
| `/employee/manage/leave` | 请假管理 | `leave_calendar` | `/api/v1/leave-requests` |
| `/employee/manage/workflows` | 审批流程配置 | `leave_workflows` | `/api/v1/leave-workflows` |
| `/employee/manage/approvals` | 审批管理 | `approval_management` | `/api/v1/leave-requests/*/approval` |

### 员工端路由（普通用户可见）

| 路由路径 | 页面名称 | 模块权限 | 主要接口 |
|---------|---------|---------|---------|
| `/employee` | 工作台 | — | `/api/v1/auth/me` |
| `/employee/leave` | 请假申请 | `employee_leave` | `/api/v1/me/leave-requests` |
| `/employee/claims` | 报销管理 | `claim_management` | `/api/v1/me/claims` |
| `/employee/approvals` | 审批记录 | — | `/api/v1/me/leave-requests/approvals` |
| `/employee/change-password` | 修改密码 | — | `/api/v1/auth/change-password` |
| `/employee/profile` | 个人档案 | — | `/api/v1/me/profile` |
