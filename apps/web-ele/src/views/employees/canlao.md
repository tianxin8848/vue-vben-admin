## 接口分布

| 权限模块 | 路由前缀 | 接口数 | 说明 |
|---|---|---|---|
| `employee_leave`(请假申请/个人) | `/api/v1/me/leave-requests` | **7** | 只能看/操作自己的 |
| `leave_calendar`(请假管理) | `/api/v1/leave-requests`(不带 /me) | **8** | 看全员 + 日历 + 地区假期 |
| `leave_workflows`(请假流程) | `/api/v1/leave-workflows` | **5** | 审批流配置 |

要点(可能与直觉不符的):
- Swagger 的两个分组里，**请假管理** tag 同时包含 `/me/`(个人)和 `/api/v1/leave-requests`(管理)两套；**请假流程** tag 单独是 `/leave-workflows`。
- `/api/v1/leave-requests/{id}` 单条读取的鉴权其实是 `employee_leave`(申请人或同部门同事只读)，不是 `leave_calendar`。
- 审批 `PATCH /leave-requests/{id}/approval` 只要"登录 + 是该请假的当前审批人"即可，**不**依赖 `can_approve` 字段；admin 若不是审批人会返回 403，属预期行为。
- `approvals/meta`、`approval-records`、`approvals` 只需登录，无需特定模块权限。

## 产出文件

- [leave_api_overview.txt](file:///Users/xi/Documents/github/7-13/vue-vben-admin/tests/curl/leave_api_overview.txt) — 接口总览文档(权限分组、20 个接口的参数/Body/返回、枚举值、业务流程)
- [leave_curl.sh](file:///Users/xi/Documents/github/7-13/vue-vben-admin/tests/curl/leave_curl.sh) — curl 命令测试脚本，支持 `bash leave_curl.sh A|B|C` 分段跑
- [test_leave_api.py](file:///Users/xi/Documents/github/7-13/vue-vben-admin/tests/curl/test_leave_api.py) — Python 全流程测试，`--admin` 跑管理端+审批流，默认跑个人端，所有写操作末尾自动清理

运行示例:
```bash
cd /Users/xi/Documents/github/7-13/vue-vben-admin/tests/curl
bash leave_curl.sh                # 全部三段
python3 test_leave_api.py         # 个人接口 (lin)
python3 test_leave_api.py --admin # 管理端 + 审批流 (admin)
```

测试账号用 `lin`(个人)和 `admin`(管理)，与同目录 [setting.txt](file:///Users/xi/Documents/github/7-13/vue-vben-admin/tests/curl/setting.txt) 和 [test_claim_api.py](file:///Users/xi/Documents/github/7-13/vue-vben-admin/tests/test_claim_api.py) 保持一致。两个脚本均通过语法检查。
