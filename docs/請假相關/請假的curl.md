The user wants me to list curl commands for the leave API endpoints too. Let me explore the leave-related routers in the codebase.

Based on AGENTS.md, leave endpoints are at:
- `/api/v1/leave-requests` (admin/cross-user)
- `/api/v1/me/leave-requests` (current user)
- `/api/v1/leave-requests/lieu-leave/grants` (lieu grants)

Let me look at the actual router files.

### Relevant Code Snippets
1. /Users/xi/Documents/github/8-24/OA-System/app/api/v1/leave.py:L29-L32
   — Leave API router definition: module router uses prefix `/leave-requests`, current-user router also mounts under `/leave-requests` and is later included under `/me`; permission gates `employee_leave` and `leave_calendar` are defined here.

2. /Users/xi/Documents/github/8-24/OA-System/app/api/v1/leave.py:L77-L95
   — `POST /api/v1/me/leave-requests` — 当前用户提交请假；解析 JSON/form 参数，依赖 `get_current_leave_user`，返回 `LeaveRequestResponse`。

3. /Users/xi/Documents/github/8-24/OA-System/app/api/v1/leave.py:L98-L135
   — 当前用户请假列表与配置端点：`GET /me/leave-requests`、`GET /me/leave-requests/department`、`GET /me/leave-requests/leave-types`，均使用 `employee_leave` 权限。

4. /Users/xi/Documents/github/8-24/OA-System/app/api/v1/leave.py:L138-L188
   — 当前用户审批与年假汇总：`GET /me/leave-requests/approvals`、`/approval-records`、`/annual-leave/summary`，覆盖待审请假、审批记录与年假额度。

5. /Users/xi/Documents/github/8-24/OA-System/app/api/v1/leave.py:L191-L212
   — 当前用户调休汇总：`GET /me/leave-requests/lieu-leave/summary`，查询参数 `year`，依赖 `employee_leave`，返回 `LieuLeaveSummaryResponse`。

6. /Users/xi/Documents/github/8-24/OA-System/app/api/v1/leave.py:L235-L269
   — 管理侧请假日历：`GET /leave-requests/calendar`，支持 `year/team/region/employee_keyword/approval_status` 查询参数，依赖 `leave_calendar`。

7. /Users/xi/Documents/github/8-24/OA-System/app/api/v1/leave.py:L310-L359
   — 调休额度相关端点：`POST /leave-requests/lieu-leave/grants` 与 `GET /leave-requests/lieu-leave/summary`，包含请求体/查询参数、`leave_calendar` 权限与响应模型。

8. /Users/xi/Documents/github/8-24/OA-System/app/api/v1/leave.py:L362-L437
   — 管理侧请假 CRUD 与审批：`GET /leave-requests`、`GET /{id}/medical-certificate`、`GET /{id}`、`PATCH /{id}/approval`，覆盖全部请假列表、病假纸读取、单条读取与审批。

9. /Users/xi/Documents/github/8-24/OA-System/app/api/v1/leave_workflow.py:L10-L59
   — Leave workflow router：`/leave-workflows` 下的列表、元数据、创建、更新、删除端点，使用 `leave_workflows` 模块权限。

10. /Users/xi/Documents/github/8-24/OA-System/app/api/v1/router.py:L15-L32
   — API 注册入口：`/api/v1/me` 包含 `leave.me_router`，根 `/api/v1` 包含 `leave.router` 与 `leave_workflow.router`，说明 leave 端点如何挂载到 `/api/v1/me/leave-requests` 与 `/api/v1/leave-requests`。

11. /Users/xi/Documents/github/8-24/OA-System/app/schemas/leave.py:L35-L73
   — 请假创建/审批/撤回的请求体模型：`LeaveRequestCreate`、`LeaveRequestApprovalUpdate`、`LeaveRequestWithdraw`，对应各 endpoint 的 body/query 字段与校验规则。

12. /Users/xi/Documents/github/8-24/OA-System/app/schemas/leave.py:L76-L175
   — 请假相关响应模型与汇总模型：`LeaveRequestResponse`、`LieuLeaveGrantCreate`、`LieuLeaveSummaryResponse` 等，是 leave API 端点返回值的 schema 定义。

I have everything I need. Let me also check the leave_workflow.py file briefly to include those endpoints.

Now I have all the information needed. Let me write the comprehensive curl list for leave endpoints. I'll organize it into:
1. Current user (employee_leave permission) endpoints under /api/v1/me/leave-requests
2. Calendar/management endpoints under /api/v1/leave-requests
3. Leave workflows under /api/v1/leave-workflows

Let me note key business rules from the schema:
- Leave types: annual, personal, sick, lieu, long
- Sessions: full_day, morning, afternoon
- Approval statuses: pending, approved, rejected, withdrawn
- Date validation: end_date >= start_date; half-day sessions only on single day
- Lieu grants: days must be >0, ≤366, multiple of 0.5
- Reject requires review_comment

Let me write this concisely. The user already understands the auth pattern from before, so I'll just reference that and focus on leave specifics.

I'll use the tianxin user from before with the cookie file pattern established earlier.
接續上一則，這裡是**請假相關**的全部 curl，分三組：當前用戶 (`/api/v1/me/leave-requests`)、管理側 (`/api/v1/leave-requests`)、請假流程 (`/api/v1/leave-workflows`)。代碼位置：[app/api/v1/leave.py](file:///Users/xi/Documents/github/8-24/OA-System/app/api/v1/leave.py)、[app/schemas/leave.py](file:///Users/xi/Documents/github/8-24/OA-System/app/schemas/leave.py)、[app/api/v1/leave_workflow.py](file:///Users/xi/Documents/github/8-24/OA-System/app/api/v1/leave_workflow.py)。

**前置**：先登入拿 cookie 寫到 `/tmp/oa_cookies.txt`（見上一則的 `/auth/login`），後面一律 `-b /tmp/oa_cookies.txt` 帶會話。tianxin 需有對應 `module_permissions` 才能過權限閘。

---

# A. 當前用戶請假（`/api/v1/me/leave-requests/*`，需 `employee_leave`）

## A1. `POST /api/v1/me/leave-requests` — 提交請假

**邏輯**（[leave.py:77-95](file:///Users/xi/Documents/github/8-24/OA-System/app/api/v1/leave.py#L77-L95)）：
- 支援 JSON 或 `multipart/form-data`（病假紙文件走 multipart）
- `leave_type`：`annual`/`personal`/`sick`/`lieu`/`long`（[leave.py:7-12](file:///Users/xi/Documents/github/8-24/OA-System/app/schemas/leave.py#L7-L12)）
- `session`：`full_day`/`morning`/`afternoon`；半天只能在單日（[leave.py:44-50](file:///Users/xi/Documents/github/8-24/OA-System/app/schemas/leave.py#L44-L50)）
- `end_date < start_date` → 422
- 業務約束（service 內）：開始日期必須在提交前 1 個月內（`assert_leave_start_within_grace`），超期 → 400；與既有 pending/approved 請假日期重疊 → 409；病假紙必須 `leave_type=sick` 才能帶文件，否則 400
- annual 受年度 16 天封頂；lieu 受 `lieu_leave_balances` 記錄封頂（無記錄時不限制）；annual 在僱用後 6 個月內日期被拒
- 周末/地區公眾假期從 `date_keys` 剔除但不影響 `total_days` 計算階段

**JSON 版 curl**：
```bash
curl -i -X POST 'http://10.254.253.187:8999/api/v1/me/leave-requests' \
  -H 'Content-Type: application/json' \
  -b /tmp/oa_cookies.txt \
  -d '{
    "leave_type":"annual",
    "start_date":"2026-09-10",
    "end_date":"2026-09-11",
    "session":"full_day",
    "reason":"家中有事",
    "handover_to":"張三"
  }'
```

**帶病假紙 multipart 版**：
```bash
curl -i -X POST 'http://10.254.253.187:8999/api/v1/me/leave-requests' \
  -b /tmp/oa_cookies.txt \
  -F 'leave_type=sick' \
  -F 'start_date=2026-09-10' \
  -F 'end_date=2026-09-10' \
  -F 'session=full_day' \
  -F 'reason=感冒發燒' \
  -F 'medical_certificate=@/tmp/sick.jpg'
```

**返回**（201，`LeaveRequestResponse`，[leave.py:76-110](file:///Users/xi/Documents/github/8-24/OA-System/app/schemas/leave.py#L76-L110)）：
```json
{
  "id": "65e8...",
  "employee_id": "65a1...",
  "employee_user_id": 1024,
  "employee_code": "T001",
  "employee_username": "tianxin",
  "employee_name": "田鑫",
  "employee_department": "技術部",
  "employee_region": "HK",
  "leave_type": "annual",
  "approval_status": "pending",
  "approval_chain": [{"user_id":"...","username":"...","level":1}],
  "current_approver_id": "65a2...",
  "approval_history": [],
  "session": "full_day",
  "start_date": "2026-09-10",
  "end_date": "2026-09-11",
  "date_keys": ["2026-09-10","2026-09-11"],
  "total_days": 2.0,
  "include_regional_holidays": false,
  "reason": "家中有事",
  "handover_to": "張三",
  "medical_certificate_id": null,
  "medical_certificate_name": null,
  "medical_certificate_url": null,
  "created_by_id": "65a1...",
  "created_by_name": "田鑫",
  "reviewer_id": null,
  "review_comment": null,
  "reviewed_at": null,
  "created_at": "2026-09-04T08:00:00Z",
  "updated_at": "2026-09-04T08:00:00Z"
}
```

**失敗**：400（超期/病假紙與非 sick 組合）、409（日期重疊）、422（校驗）、403（無 employee_leave 權限，內置 admin 也 403）

---

## A2. `GET /api/v1/me/leave-requests` — 我的請假列表

[leave.py:98-109](file:///Users/xi/Documents/github/8-24/OA-System/app/api/v1/leave.py#L98-L109)

```bash
curl -s 'http://10.254.253.187:8999/api/v1/me/leave-requests' -b /tmp/oa_cookies.txt | jq
```

返回：`[LeaveRequestResponse, ...]`

## A3. `GET /api/v1/me/leave-requests/department` — 同部門請假

[leave.py:112-123](file:///Users/xi/Documents/github/8-24/OA-System/app/api/v1/leave.py#L112-L123)

```bash
curl -s 'http://10.254.253.187:8999/api/v1/me/leave-requests/department' -b /tmp/oa_cookies.txt | jq
```

返回：`[LeaveRequestResponse, ...]`，按當前用戶 `department` 字段過濾。

## A4. `GET /api/v1/me/leave-requests/leave-types` — 可用請假類型

[leave.py:126-135](file:///Users/xi/Documents/github/8-24/OA-System/app/api/v1/leave.py#L126-L135)

```bash
curl -s 'http://10.254.253.187:8999/api/v1/me/leave-requests/leave-types' -b /tmp/oa_cookies.txt | jq
```

返回（`system_settings.leave_types` 目錄，空則恢復默認 `annual/personal/sick/lieu/long`）：
```json
[{"code":"annual","label":"年假"},{"code":"sick","label":"病假"}]
```

## A5. `GET /api/v1/me/leave-requests/approvals` — 待我審的請假

[leave.py:138-149](file:///Users/xi/Documents/github/8-24/OA-System/app/api/v1/leave.py#L138-L149)。**只需登入**（無 employee_leave 閘，所有登入用戶可見自己待審）。

```bash
curl -s 'http://10.254.253.187:8999/api/v1/me/leave-requests/approvals' -b /tmp/oa_cookies.txt | jq
```

返回：`[LeaveRequestResponse, ...]`（`current_approver_id == 當前用戶 id` 且 `pending`）

## A6. `GET /api/v1/me/leave-requests/approval-records` — 我的審批記錄

[leave.py:152-163](file:///Users/xi/Documents/github/8-24/OA-System/app/api/v1/leave.py#L152-L163)。當前用戶作為操作人或申請人的記錄。

```bash
curl -s 'http://10.254.253.187:8999/api/v1/me/leave-requests/approval-records' -b /tmp/oa_cookies.txt | jq
```

返回：`[LeaveApprovalRecordResponse, ...]`（字段見 [leave.py:119-150](file:///Users/xi/Documents/github/8-24/OA-System/app/schemas/leave.py#L119-L150)，含 `action`/`is_flowing`/`approval_status_before/after` 等）

## A7. `GET /api/v1/me/leave-requests/annual-leave/summary?year=2026` — 年假匯總

[leave.py:166-188](file:///Users/xi/Documents/github/8-24/OA-System/app/api/v1/leave.py#L166-L188)

```bash
curl -s 'http://10.254.253.187:8999/api/v1/me/leave-requests/annual-leave/summary?year=2026' -b /tmp/oa_cookies.txt | jq
```

返回（[leave.py:153-160](file:///Users/xi/Documents/github/8-24/OA-System/app/schemas/leave.py#L153-L160)）：
```json
{
  "year": 2026,
  "region": "HK",
  "entitlement_days": 16.0,
  "used_days": 2.0,
  "available_days": 14.0,
  "carry_over_days": 0,
  "usable_from": "2024-09-01"
}
```

## A8. `GET /api/v1/me/leave-requests/lieu-leave/summary?year=2026` — 調休匯總

[leave.py:191-212](file:///Users/xi/Documents/github/8-24/OA-System/app/api/v1/leave.py#L191-L212)

```bash
curl -s 'http://10.254.253.187:8999/api/v1/me/leave-requests/lieu-leave/summary?year=2026' -b /tmp/oa_cookies.txt | jq
```

返回（[leave.py:169-175](file:///Users/xi/Documents/github/8-24/OA-System/app/schemas/leave.py#L169-L175)）：
```json
{
  "year": 2026,
  "employee_id": "65a1...",
  "granted_days": 4.0,
  "used_days": 1.0,
  "available_days": 3.0,
  "capped": true
}
```

無 grant 記錄時 `granted_days=0`、`capped=false`（不限制）。

## A9. `PATCH /api/v1/me/leave-requests/{id}/withdraw` — 撤回

[leave.py:215-232](file:///Users/xi/Documents/github/8-24/OA-System/app/api/v1/leave.py#L215-L232)。只能撤回自己 pending 的請假。

```bash
curl -i -X PATCH 'http://10.254.253.187:8999/api/v1/me/leave-requests/65e8.../withdraw' \
  -H 'Content-Type: application/json' \
  -b /tmp/oa_cookies.txt \
  -d '{"withdraw_comment":"計劃變更"}'
```

返回：`LeaveRequestResponse`（`approval_status=withdrawn`）。病假紙文件會被刪除並清空 `medical_certificate_*` 字段。

失敗：404（不存在/非本人）、409（非 pending 不能撤回）

---

# B. 管理側請假（`/api/v1/leave-requests/*`，需 `leave_calendar` 權限）

## B1. `GET /api/v1/leave-requests/calendar?year=2026` — 請假日曆

[leave.py:247-269](file:///Users/xi/Documents/github/8-24/OA-System/app/api/v1/leave.py#L247-L269)。內置 admin 無 leave_calendar 權限 → 403。

```bash
curl -s 'http://10.254.253.187:8999/api/v1/leave-requests/calendar?year=2026&team=技術部&region=HK&approval_status=pending' -b /tmp/oa_cookies.txt | jq
```

查詢參數（均可選，year 必填）：`year`、`team`、`region`、`employee_keyword`、`approval_status`（pending/approved/rejected/withdrawn）。

返回（[leave.py:113-116](file:///Users/xi/Documents/github/8-24/OA-System/app/schemas/leave.py#L113-L116)）：
```json
{"year":2026,"total":12,"items":[LeaveRequestResponse,...]}
```

## B2. `GET /api/v1/leave-requests/calendar/meta` — 日曆篩選項

[leave.py:272-281](file:///Users/xi/Documents/github/8-24/OA-System/app/api/v1/leave.py#L272-L281)

```bash
curl -s 'http://10.254.253.187:8999/api/v1/leave-requests/calendar/meta' -b /tmp/oa_cookies.txt | jq
```

返回：`{"teams":[...],"regions":[...]}`

## B3. `PUT /api/v1/leave-requests/calendar/regional-holidays` — 寫地區假期

[leave.py:284-294](file:///Users/xi/Documents/github/8-24/OA-System/app/api/v1/leave.py#L284-L294)

```bash
curl -i -X PUT 'http://10.254.253.187:8999/api/v1/leave-requests/calendar/regional-holidays' \
  -H 'Content-Type: application/json' \
  -b /tmp/oa_cookies.txt \
  -d '{"region":"HK","date":"2026-10-01","holiday_name":"國慶日"}'
```

返回：`{"updated":true}`（或類似 dict）

## B4. `DELETE /api/v1/leave-requests/calendar/regional-holidays` — 刪地區假期

[leave.py:297-307](file:///Users/xi/Documents/github/8-24/OA-System/app/api/v1/leave.py#L297-L307)。**DELETE 帶 body**，需要顯式傳 JSON。

```bash
curl -i -X DELETE 'http://10.254.253.187:8999/api/v1/leave-requests/calendar/regional-holidays' \
  -H 'Content-Type: application/json' \
  -b /tmp/oa_cookies.txt \
  -d '{"region":"HK","date":"2026-10-01"}'
```

返回：`{"deleted":true}`

## B5. `POST /api/v1/leave-requests/lieu-leave/grants` — 給員工加調休額度

[leave.py:310-334](file:///Users/xi/Documents/github/8-24/OA-System/app/api/v1/leave.py#L310-L334)。body 見 [LieuLeaveGrantCreate](file:///Users/xi/Documents/github/8-24/OA-System/app/schemas/leave.py#L163-L166)：`days` 須 >0、≤366、0.5 倍數。

```bash
curl -i -X POST 'http://10.254.253.187:8999/api/v1/leave-requests/lieu-leave/grants' \
  -H 'Content-Type: application/json' \
  -b /tmp/oa_cookies.txt \
  -d '{"employee_id":"65a1...","year":2026,"days":2.0}'
```

返回：`LieuLeaveSummaryResponse`（同 A8）。成功後該員工當年 lieu 受封頂。

## B6. `GET /api/v1/leave-requests/lieu-leave/summary?employee_id=...&year=2026` — 指定員工調休匯總

[leave.py:337-359](file:///Users/xi/Documents/github/8-24/OA-System/app/api/v1/leave.py#L337-L359)

```bash
curl -s 'http://10.254.253.187:8999/api/v1/leave-requests/lieu-leave/summary?employee_id=65a1...&year=2026' -b /tmp/oa_cookies.txt | jq
```

返回：`LieuLeaveSummaryResponse`

## B7. `GET /api/v1/leave-requests` — 全部請假

[leave.py:362-384](file:///Users/xi/Documents/github/8-24/OA-System/app/api/v1/leave.py#L362-L384)。過濾參數全可選。

```bash
curl -s 'http://10.254.253.187:8999/api/v1/leave-requests?year=2026&region=HK&approval_status=approved' -b /tmp/oa_cookies.txt | jq
```

返回：`[LeaveRequestResponse, ...]`

## B8. `GET /api/v1/leave-requests/approvals/meta` — 審批頁元數據

[leave.py:235-244](file:///Users/xi/Documents/github/8-24/OA-System/app/api/v1/leave.py#L235-L244)。**只需登入**（無 leave_calendar 閘）。

```bash
curl -s 'http://10.254.253.187:8999/api/v1/leave-requests/approvals/meta' -b /tmp/oa_cookies.txt | jq
```

返回：`{"regions":[...],"departments":[...]}`

## B9. `GET /api/v1/leave-requests/{id}/medical-certificate` — 讀病假紙

[leave.py:387-400](file:///Users/xi/Documents/github/8-24/OA-System/app/api/v1/leave.py#L387-L400)。**只需登入**；service 校驗申請人/當前或歷史審批人/admin 可讀，否則 403；draft/rejected/withdrawn 文件會被刪除所以 404。

```bash
curl -s -o /tmp/sick.jpg 'http://10.254.253.187:8999/api/v1/leave-requests/65e8.../medical-certificate' -b /tmp/oa_cookies.txt
```

返回：`FileResponse`（image/jpeg 等）。失敗：404（無文件/已刪）、403（無權讀）

## B10. `GET /api/v1/leave-requests/{id}` — 讀單條請假

[leave.py:403-417](file:///Users/xi/Documents/github/8-24/OA-System/app/api/v1/leave.py#L403-L417)。需 `employee_leave`；申請人或同部門只讀，否則 403。

```bash
curl -s 'http://10.254.253.187:8999/api/v1/leave-requests/65e8...' -b /tmp/oa_cookies.txt | jq
```

返回：`LeaveRequestResponse`

## B11. `PATCH /api/v1/leave-requests/{id}/approval` — 審批

[leave.py:420-436](file:///Users/xi/Documents/github/8-24/OA-System/app/api/v1/leave.py#L420-L436)。**只需登入**；service 校驗必須是當前審批人。body 見 [LeaveRequestApprovalUpdate](file:///Users/xi/Documents/github/8-24/OA-System/app/schemas/leave.py#L53-L69)：`approval_status` 只能 `approved`/`rejected`；rejected 必填 `review_comment`。

```bash
# 通過
curl -i -X PATCH 'http://10.254.253.187:8999/api/v1/leave-requests/65e8.../approval' \
  -H 'Content-Type: application/json' \
  -b /tmp/oa_cookies.txt \
  -d '{"approval_status":"approved","review_comment":"OK"}'

# 駁回（必須帶 review_comment）
curl -i -X PATCH 'http://10.254.253.187:8999/api/v1/leave-requests/65e8.../approval' \
  -H 'Content-Type: application/json' \
  -b /tmp/oa_cookies.txt \
  -d '{"approval_status":"rejected","review_comment":"事由不充分"}'
```

返回：`LeaveRequestResponse`（更新後狀態，可能流轉到下一級審批人或最終 approved）

失敗：403（非當前審批人）、422（rejected 沒帶 comment）、409（非 pending 不能審）

---

# C. 請假流程配置（`/api/v1/leave-workflows/*`，需 `leave_workflows` 權限）

[leave_workflow.py](file:///Users/xi/Documents/github/8-24/OA-System/app/api/v1/leave_workflow.py)。用於配置匹配規則→審批人鏈。

## C1. `GET /api/v1/leave-workflows` — 列出全部流程

```bash
curl -s 'http://10.254.253.187:8999/api/v1/leave-workflows' -b /tmp/oa_cookies.txt | jq
```

返回：`[LeaveWorkflowResponse, ...]`（[schema](file:///Users/xi/Documents/github/8-24/OA-System/app/schemas/leave_workflow.py#L35-L43)）

## C2. `GET /api/v1/leave-workflows/meta` — 元數據

```bash
curl -s 'http://10.254.253.187:8999/api/v1/leave-workflows/meta' -b /tmp/oa_cookies.txt | jq
```

返回：`{"departments":[...],"regions":[...],"positions":[...],"employees":[...]}`

## C3. `POST /api/v1/leave-workflows` — 建流程

body 見 [LeaveWorkflowCreate](file:///Users/xi/Documents/github/8-24/OA-System/app/schemas/leave_workflow.py#L19-L24)：`name` 2~200、`priority` 1~9999、`match` 可空字段、`approvers` 列表。

```bash
curl -i -X POST 'http://10.254.253.187:8999/api/v1/leave-workflows' \
  -H 'Content-Type: application/json' \
  -b /tmp/oa_cookies.txt \
  -d '{
    "name":"技術部-默認流程",
    "priority":100,
    "is_active":true,
    "match":{"department":"技術部","region":"HK"},
    "approvers":[
      {"user_id":"65a2...","username":"manager_li","full_name":"李經理"},
      {"user_id":"65a3...","username":"director_zhao","full_name":"趙總"}
    ]
  }'
```

返回：201 + `LeaveWorkflowResponse`

## C4. `PATCH /api/v1/leave-workflows/{id}` — 改流程

```bash
curl -i -X PATCH 'http://10.254.253.187:8999/api/v1/leave-workflows/65e9...' \
  -H 'Content-Type: application/json' \
  -b /tmp/oa_cookies.txt \
  -d '{"priority":50,"is_active":false}'
```

返回：`LeaveWorkflowResponse`

## C5. `DELETE /api/v1/leave-workflows/{id}` — 刪流程

```bash
curl -i -X DELETE 'http://10.254.253.187:8999/api/v1/leave-workflows/65e9...' -b /tmp/oa_cookies.txt
```

返回：`{"deleted":true}`

---

# 權限速查

| 權限碼 | 誰有 | 影響的 leave 端點 |
|---|---|---|
| `employee_leave` | tianxin 等普通員工（HR 配置） | A1-A4、A7-A9、B10 |
| `leave_calendar` | 日曆管理員（HR 配置） | B1-B7 |
| `leave_workflows` | 流程管理員 | C1-C5 |
| 只需登入 | 任何 active 用戶 | A5、A6、B8、B9、B11 |
| 內置 `admin` | 超管，但**不在** `_system_admin_allowed_modules()` | 所有 leave 模塊端點 → 403 |

若 tianxin 調上述帶權限閘的接口返回 403，說明該賬號在 `system_settings.modules[].module_permissions` 裡沒配對應 `module_code` 的 `can_view=true`，需要 admin 走 `PUT /api/v1/system-settings` 給 tianxin 加權限。

