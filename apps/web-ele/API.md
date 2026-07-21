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
