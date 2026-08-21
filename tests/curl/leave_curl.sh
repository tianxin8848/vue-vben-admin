#!/usr/bin/env bash
# 请假相关 API curl 测试脚本 (参照 setting.txt 风格)
# 后端: http://10.254.253.187:8999
#
# 三段测试:
#   A) 个人接口 (employee_leave 权限) -> /api/v1/me/leave-requests  账号: lin
#   B) 管理端接口 (leave_calendar 权限) -> /api/v1/leave-requests   账号: admin
#   C) 审批流配置 (leave_workflows 权限) -> /api/v1/leave-workflows  账号: admin
#
# 用法:
#   bash leave_curl.sh            # 跑全部三段
#   bash leave_curl.sh A          # 只跑个人段
#   bash leave_curl.sh B          # 只跑管理段
#   bash leave_curl.sh C          # 只跑审批流段
#
# 说明: 所有写操作 (POST 提交请假、PUT 假期、POST/PATCH/DELETE 审批流)
#       都在脚本末尾做清理，不会遗留测试数据。

set -uo pipefail
BASE="http://10.254.253.187:8999"
MODE="${1:-ALL}"
YEAR="$(date +%Y)"

c() { printf '\n\033[1;36m[%s]\033[0m %s\n' "$1" "$2"; }

login() {  # $1=user $2=password $3=cookie_file
  curl -s -c "$3" -X POST "$BASE/api/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"$1\",\"password\":\"$2\"}" -o /dev/null
}

# ============ A. 个人接口 (employee_leave) — 账号 lin ============
run_A() {
  COOKIE=/tmp/leave_me_cookie.txt
  c "A1" "登录 (lin / Cisco@123)"
  login "lin" "Cisco@123" "$COOKIE"

  c "A2" "GET /me/leave-requests — 列出当前用户请假"
  curl -s -b "$COOKIE" "$BASE/api/v1/me/leave-requests" | head -c 800; echo

  c "A3" "GET /me/leave-requests/annual-leave/summary?year=$YEAR — 年假汇总"
  curl -s -b "$COOKIE" "$BASE/api/v1/me/leave-requests/annual-leave/summary?year=$YEAR" | head -c 400; echo

  c "A4" "POST /me/leave-requests — 提交一条请假 (待会儿撤回清理)"
  BODY=$(curl -s -b "$COOKIE" -X POST "$BASE/api/v1/me/leave-requests" \
    -H "Content-Type: application/json" \
    -d "{\"leave_type\":\"personal\",\"start_date\":\"2099-01-05\",\"end_date\":\"2099-01-05\",\"session\":\"full_day\",\"reason\":\"curl测试-稍后撤回\",\"handover_to\":null,\"regional_holiday_mode\":\"exclude\"}")
  echo "$BODY" | head -c 600; echo
  LR_ID=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null)

  c "A5" "GET /me/leave-requests/department — 同部门请假"
  curl -s -b "$COOKIE" "$BASE/api/v1/me/leave-requests/department" | head -c 400; echo

  c "A6" "GET /me/leave-requests/approvals — 我的待审"
  curl -s -b "$COOKIE" "$BASE/api/v1/me/leave-requests/approvals" | head -c 400; echo

  c "A7" "GET /me/leave-requests/approval-records — 我相关的审批记录"
  curl -s -b "$COOKIE" "$BASE/api/v1/me/leave-requests/approval-records" | head -c 400; echo

  if [ -n "$LR_ID" ]; then
    c "A8" "PATCH /me/leave-requests/$LR_ID/withdraw — 撤回上面那条请假 (清理)"
    curl -s -b "$COOKIE" -X PATCH "$BASE/api/v1/me/leave-requests/$LR_ID/withdraw" \
      -H "Content-Type: application/json" -d '{"withdraw_comment":"curl测试-撤回"}' | head -c 400; echo
  fi
}

# ============ B. 管理端接口 (leave_calendar) — 账号 admin ============
run_B() {
  COOKIE=/tmp/leave_admin_cookie.txt
  c "B1" "登录 (admin / Cisco@123)"
  login "admin" "Cisco@123" "$COOKIE"

  c "B2" "GET /leave-requests?year=$YEAR — 全员请假 (带过滤)"
  curl -s -b "$COOKIE" "$BASE/api/v1/leave-requests?year=$YEAR&approval_status=pending" | head -c 800; echo

  c "B3" "GET /leave-requests/approvals/meta — 审批筛选项"
  curl -s -b "$COOKIE" "$BASE/api/v1/leave-requests/approvals/meta" | head -c 400; echo

  c "B4" "GET /leave-requests/calendar?year=$YEAR — 请假日历"
  curl -s -b "$COOKIE" "$BASE/api/v1/leave-requests/calendar?year=$YEAR" | head -c 600; echo

  c "B5" "GET /leave-requests/calendar/meta — 日历筛选项"
  curl -s -b "$COOKIE" "$BASE/api/v1/leave-requests/calendar/meta" | head -c 400; echo

  c "B6" "PUT /leave-requests/calendar/regional-holidays — 写入地区假期 (稍后删除清理)"
  curl -s -b "$COOKIE" -X PUT "$BASE/api/v1/leave-requests/calendar/regional-holidays" \
    -H "Content-Type: application/json" \
    -d '{"region":"香港","date":"2099-12-31","holiday_name":"curl测试假期"}' | head -c 400; echo

  c "B7" "DELETE /leave-requests/calendar/regional-holidays — 删除上面那条假期 (清理)"
  curl -s -b "$COOKIE" -X DELETE "$BASE/api/v1/leave-requests/calendar/regional-holidays" \
    -H "Content-Type: application/json" \
    -d '{"region":"香港","date":"2099-12-31"}' | head -c 400; echo

  # B8: 读取单条 — 先从列表里取一个 id
  c "B8" "GET /leave-requests/{id} — 读取一条请假 (取列表首个 id)"
  LR_ID=$(curl -s -b "$COOKIE" "$BASE/api/v1/leave-requests?year=$YEAR" \
    | python3 -c "import sys,json; d=json.load(sys.stdin); print(d[0]['id'] if d else '')" 2>/dev/null)
  if [ -n "$LR_ID" ]; then
    curl -s -b "$COOKIE" "$BASE/api/v1/leave-requests/$LR_ID" | head -c 600; echo
  else
    echo "  (本年无请假记录，跳过)"
  fi

  # B9: 审批 — 仅当恰好有待审且当前用户是审批人时才会成功，否则预期 403
  c "B9" "PATCH /leave-requests/{id}/approval — 审批 (需当前用户是审批人, 否则 403)"
  PENDING_ID=$(curl -s -b "$COOKIE" "$BASE/api/v1/me/leave-requests/approvals" \
    | python3 -c "import sys,json; d=json.load(sys.stdin); print(d[0]['id'] if d else '')" 2>/dev/null)
  if [ -n "$PENDING_ID" ]; then
    curl -s -b "$COOKIE" -X PATCH "$BASE/api/v1/leave-requests/$PENDING_ID/approval" \
      -H "Content-Type: application/json" \
      -d '{"approval_status":"approved","review_comment":"curl测试-审批通过"}' | head -c 400; echo
  else
    echo "  (admin 不是任何请假的审批人，跳过审批测试; 这是预期行为)"
  fi
}

# ============ C. 审批流配置 (leave_workflows) — 账号 admin ============
run_C() {
  COOKIE=/tmp/leave_wf_cookie.txt
  c "C1" "登录 (admin / Cisco@123)"
  login "admin" "Cisco@123" "$COOKIE"

  c "C2" "GET /leave-workflows/meta — 审批流元数据 (下拉选项)"
  curl -s -b "$COOKIE" "$BASE/api/v1/leave-workflows/meta" | head -c 600; echo

  c "C3" "GET /leave-workflows — 列出现有审批流"
  curl -s -b "$COOKIE" "$BASE/api/v1/leave-workflows" | head -c 600; echo

  c "C4" "POST /leave-workflows — 创建一条审批流 (稍后删除清理)"
  BODY=$(curl -s -b "$COOKIE" -X POST "$BASE/api/v1/leave-workflows" \
    -H "Content-Type: application/json" \
    -d '{"name":"curl测试审批流","priority":9999,"is_active":true,"match":{"department":"深圳研发中心"},"approvers":[]}')
  echo "$BODY" | head -c 600; echo
  WF_ID=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null)

  if [ -n "$WF_ID" ]; then
    c "C5" "PATCH /leave-workflows/$WF_ID — 更新 (改优先级+停用)"
    curl -s -b "$COOKIE" -X PATCH "$BASE/api/v1/leave-workflows/$WF_ID" \
      -H "Content-Type: application/json" \
      -d '{"priority":8888,"is_active":false}' | head -c 400; echo

    c "C6" "DELETE /leave-workflows/$WF_ID — 删除 (清理)"
    curl -s -b "$COOKIE" -X DELETE "$BASE/api/v1/leave-workflows/$WF_ID" | head -c 400; echo
  fi
}

case "$MODE" in
  A) run_A ;;
  B) run_B ;;
  C) run_C ;;
  *) run_A; run_B; run_C ;;
esac

echo
echo "=== leave_curl.sh 完成 ==="
