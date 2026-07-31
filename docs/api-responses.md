# 后端接口返回说明文档

## 基础信息

- **后端服务地址**: `http://10.254.253.187:8999`
- **登录接口**: `POST /api/v1/auth/login`
- **获取用户信息**: `GET /api/v1/auth/me`
- **认证方式**: Session Cookie（登录成功后后端通过 `Set-Cookie` 返回 `SessionID）

---

## 账号列表

### 1. admin1 — 项目经理（全权限）

| 字段 | 值 |
|------|-----|
| 用户名 | admin1 |
| 密码 | `Yu&A4fMl9B4^YX` |
| 邮箱 | violet881@gmail.com |
| 姓名 | violet violet |
| 工号 | 9 |
| 部门 | 深圳研发中心 |
| 区域 | 中国大陆 |
| 职位 | Project Manager |

**`module_permissions` (共 12 项，全部 `can_view: true`)**:

| module_code | module_name | can_view |
|---|---|---|
| `employee_home` | 员工工作台 | ✅ |
| `employee_password` | 修改密码 | ✅ |
| `employee_leave` | 员工请假 | ✅ |
| `admin_dashboard` | 统一工作台管理模块 | ✅ |
| `user_management` | 用户管理 | ✅ |
| `leave_calendar` | 请假管理 | ✅ |
| `leave_workflows` | 请假流程维护 | ✅ |
| `approval_management` | 审批管理 | ✅ |
| `system_settings` | 系统参数维护 | ✅ |
| `data_migration` | 数据处理维护 | ✅ |
| `access_control` | 门禁ID维护 | ✅ |
| `claim_management` | 报销 Claim | ✅ |

**对应的前端路由**: 全部菜单（个人中心 + 员工管理全部子模块 + 审批记录）

---

### 2. admin2 — 销售（受限权限）

| 字段 | 值 |
|------|-----|
| 用户名 | admin2 |
| 密码 | `Yu&A4fMl9B4^YX` |
| 邮箱 | violet8281@gmail.com |
| 姓名 | violet violet |
| 工号 | 10 |
| 部门 | 香港销售 |
| 区域 | 香港 |
| 职位 | — |

**`module_permissions` (共 7 项)**:

| module_code | module_name | can_view |
|---|---|---|
| `employee_home` | 员工工作台 | ✅ |
| `employee_password` | 修改密码 | ✅ |
| `employee_leave` | 员工请假 | ✅ |
| `user_management` | 用户管理 | ✅ |
| `system_settings` | 系统参数维护 | ✅ |
| `data_migration` | 数据处理维护 | ✅ |
| `claim_management` | 报销 Claim | ✅ |

**缺少的模块**: `leave_calendar`（请假管理）、`leave_workflows`（请假流程）、`approval_management`（审批管理）、`access_control`（门禁ID维护）、`admin_dashboard`

**对应的前端路由**: 个人中心（无"审批记录"）+ 员工管理（仅员工列表、系统参数、数据处理维护）

---

### 3. admin — 超级管理员

| 字段 | 值 |
|------|-----|
| 用户名 | admin |
| 密码 | `Cisco@123` |
| 邮箱 | admin@oa-system.com |
| 姓名 | 超级管理员 |
| 工号 | 1 |
| 部门 | — |
| 区域 | — |
| 职位 | — |

**`module_permissions`: 空数组 `[]`**

> ⚠️ **注意**: 超级管理员的 `module_permissions` 为空数组。前端检测到 `roles` 包含 `admin` 且权限列表为空时，会自动授予 **4 个核心管理模块** 权限作为兜底：
> - `user_management` → 用户列表 `/employee/manage/users`
> - `system_settings` → 系统参数 `/employee/manage/settings`
> - `data_migration` → 数据处理维护 `/employee/manage/data-migration`
> - `access_control` → 门禁维护 `/employee/manage/access-control`

**对应的前端路由**: 个人中心 + 员工管理（仅 4 个核心子模块：用户列表、系统参数、数据处理维护、门禁管理）。不包含请假管理、审批管理、审批记录等。

---

## 接口调用示例

### 步骤 1 — 登录

```bash
curl -v -X POST 'http://10.254.253.187:8999/api/v1/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin1","password":"Yu&A4fMl9B4^YX"}'
```

响应头中包含 `Set-Cookie: SessionID=xxx...`，需保存用于后续请求。

### 步骤 2 — 获取用户信息

```bash
# 先用登录获取 SessionID
SESSIONID=$(curl -s -v -X POST 'http://10.254.253.187:8999/api/v1/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin1","password":"Yu&A4fMl9B4^YX"}' \
  2>&1 | grep 'set-cookie' | sed 's/.*set-cookie: //' | cut -d';' -f1)

# 使用 SessionID 获取用户信息
curl -s -b "$SESSIONID" 'http://10.254.253.187:8999/api/v1/auth/me' | python3 -m json.tool
```

### 步骤 3 — 退出登录

```bash
curl -X POST 'http://10.254.253.187:8999/api/v1/auth/logout'
```

---

## module_code 与前端路由映射表

| module_code | 管理路由模板 | 前端路径 |
|---|---|---|
| `user_management` | EmployeeManageUsers | `/employee/manage/users` |
| `user_management` | EmployeeManageUserProfile | `/employee/manage/users/:id/profile` |
| `leave_calendar` | LeaveManageAdmin | `/employee/manage/leave` |
| `leave_workflows` | LeaveManageWorkflows | `/employee/manage/leave-workflows` |
| `approval_management` | LeaveManageApprovals | `/employee/manage/approvals` |
| `system_settings` | EmployeeManageSettings | `/employee/manage/settings` |
| `data_migration` | EmployeeManageDataMigration | `/employee/manage/data-migration` |
| `access_control` | EmployeeManageAccessControl | `/employee/manage/access-control` |

**注意**: `employee_home`、`employee_password`、`employee_leave`、`claim_management`、`admin_dashboard` 为基础模块，不直接映射到管理子路由，而是影响工作台及个人中心菜单的显示。
