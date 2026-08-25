#!/usr/bin/env bash
# Smoke-tests the ported Express endpoints against a running backend on :4000.
# Creates a temporary SUPER_ADMIN user, exercises the routes, then deletes it.
# Usage: bash test-api.sh
set -u

BASE=http://localhost:4000
PASS=0
FAIL=0

check() { # check <label> <expected-status> <actual-status> [body]
  if [ "$2" = "$3" ]; then
    PASS=$((PASS + 1)); printf '  ok   %-52s %s\n' "$1" "$3"
  else
    FAIL=$((FAIL + 1)); printf '  FAIL %-52s expected %s got %s\n' "$1" "$2" "$3"
    [ $# -ge 4 ] && printf '       body: %.300s\n' "$4"
  fi
}

# hit <label> <expected> <method> <path> [json-body]
hit() {
  local label="$1" expected="$2" method="$3" path="$4" body="${5:-}"
  local out code
  if [ -n "$body" ]; then
    out=$(curl -s -w '\n%{http_code}' -X "$method" "$BASE$path" \
      -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d "$body")
  else
    out=$(curl -s -w '\n%{http_code}' -X "$method" "$BASE$path" -H "Authorization: Bearer $TOKEN")
  fi
  code=$(printf '%s' "$out" | tail -n1)
  check "$label" "$expected" "$code" "$(printf '%s' "$out" | head -n-1)"
}

echo "== auth =="
TOKEN=$(curl -s -X POST "$BASE/api/auth/login" -H 'Content-Type: application/json' \
  -d '{"username":"__api_test_admin__","password":"TestPass123"}' \
  | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{console.log(JSON.parse(d).token||'')}catch{console.log('')}})")

if [ -z "$TOKEN" ]; then
  echo "  FAIL could not log in as __api_test_admin__ (run seed step first)"; exit 1
fi
echo "  ok   logged in"

code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/api/auth/me" -H "Authorization: Bearer $TOKEN")
check "GET /api/auth/me" 200 "$code"
code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/api/auth/refresh" -H "Authorization: Bearer $TOKEN")
check "GET /api/auth/refresh" 200 "$code"
code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/api/leads")
check "GET /api/leads (no token -> 401)" 401 "$code"

echo "== leads =="
hit "GET /api/leads"                    200 GET  "/api/leads"
hit "GET /api/leads?search=a&page=1"    200 GET  "/api/leads?search=a&page=1&limit=5"
hit "GET /api/leads?archived=1"         200 GET  "/api/leads?archived=1"
hit "GET /api/leads/export (xlsx)"      200 GET  "/api/leads/export"
hit "GET /api/leads/__nope__ (404)"     404 GET  "/api/leads/__nope__"
hit "POST /api/leads (validation)"      400 POST "/api/leads" '{"fullName":"x"}'

# full create -> read -> patch -> activity -> delete cycle
PHONE="+99890$(( RANDOM % 9000000 + 1000000 ))"
CREATED=$(curl -s -X POST "$BASE/api/leads" -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"fullName\":\"API Test Lead\",\"phone\":\"$PHONE\",\"source\":\"OTHER\"}")
LEAD_ID=$(printf '%s' "$CREATED" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{console.log(JSON.parse(d).id||'')}catch{console.log('')}})")

if [ -n "$LEAD_ID" ]; then
  check "POST /api/leads (created)" "ok" "ok"
  hit "GET /api/leads/:id"              200 GET   "/api/leads/$LEAD_ID"
  hit "PATCH /api/leads/:id"            200 PATCH "/api/leads/$LEAD_ID" '{"notes":"ported"}'
  hit "POST /api/leads/:id/activity"    201 POST  "/api/leads/$LEAD_ID/activity" '{"action":"note_added"}'
  hit "POST /api/leads/:id/coins"       200 POST  "/api/leads/$LEAD_ID/coins" '{"amount":5,"reason":"test"}'
  hit "POST /api/leads/:id/coins (0)"   400 POST  "/api/leads/$LEAD_ID/coins" '{"amount":0,"reason":"test"}'
  hit "POST /api/leads/:id/notify (no tg)" 400 POST "/api/leads/$LEAD_ID/notify" '{"text":"hi"}'
  hit "POST /api/leads dup phone"       409 POST  "/api/leads" "{\"fullName\":\"Dup\",\"phone\":\"$PHONE\"}"
  hit "DELETE /api/leads/:id"           200 DELETE "/api/leads/$LEAD_ID"
else
  check "POST /api/leads (created)" "ok" "FAILED-no-id" "$CREATED"
fi

echo "== reference data =="
hit "GET /api/users"          200 GET "/api/users"
hit "GET /api/courses"        200 GET "/api/courses"
hit "GET /api/teachers"       200 GET "/api/teachers"
hit "GET /api/groups"         200 GET "/api/groups"
hit "GET /api/stages"         200 GET "/api/stages"
hit "GET /api/tags"           200 GET "/api/tags"
hit "GET /api/timeslots"      200 GET "/api/timeslots"
hit "GET /api/holidays"       200 GET "/api/holidays"
hit "GET /api/payment-types"  200 GET "/api/payment-types"
hit "GET /api/staff-attendance" 200 GET "/api/staff-attendance"
hit "GET /api/attendance (no groupId)" 400 GET "/api/attendance"

# stage create -> patch -> delete
SID=$(curl -s -X POST "$BASE/api/stages" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"name":"__test_stage__"}' | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{console.log(JSON.parse(d).id||'')}catch{console.log('')}})")
if [ -n "$SID" ]; then
  hit "PATCH /api/stages/:id"  200 PATCH  "/api/stages/$SID" '{"name":"__test_stage2__"}'
  hit "DELETE /api/stages/:id" 200 DELETE "/api/stages/$SID"
else
  check "POST /api/stages" ok FAILED-no-id
fi

# course create -> patch -> delete
CID=$(curl -s -X POST "$BASE/api/courses" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"name":"Test Course","slug":"test-course-tmp","durationMonths":3,"price":100}' \
  | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{console.log(JSON.parse(d).id||'')}catch{console.log('')}})")
if [ -n "$CID" ]; then
  hit "PATCH /api/courses/:id"  200 PATCH  "/api/courses/$CID" '{"price":150}'
  hit "DELETE /api/courses/:id" 200 DELETE "/api/courses/$CID"
else
  check "POST /api/courses" ok FAILED-no-id
fi

echo "== finance =="
hit "GET /api/payments"       200 GET "/api/payments"
hit "GET /api/payments?month" 200 GET "/api/payments?month=2026-01&page=1"
hit "GET /api/expenses"       200 GET "/api/expenses"
hit "GET /api/incomes"        200 GET "/api/incomes"
hit "GET /api/payroll"        200 GET "/api/payroll"
hit "GET /api/debtors"        200 GET "/api/debtors"
hit "GET /api/cashflow"       200 GET "/api/cashflow"

echo "== exams / tasks / reminders / misc =="
hit "GET /api/exams"          200 GET "/api/exams"
hit "GET /api/exams/__nope__" 404 GET "/api/exams/__nope__"
hit "GET /api/tasks"          200 GET "/api/tasks"
hit "GET /api/tasks?overdue=1" 200 GET "/api/tasks?overdue=1"
hit "GET /api/reminders"      200 GET "/api/reminders"
hit "GET /api/logs"           200 GET "/api/logs"
hit "GET /api/leaderboard"    200 GET "/api/leaderboard"

# task create -> patch -> delete
TID=$(curl -s -X POST "$BASE/api/tasks" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"title":"__test_task__"}' | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{console.log(JSON.parse(d).id||'')}catch{console.log('')}})")
if [ -n "$TID" ]; then
  hit "PATCH /api/tasks/:id"  200 PATCH  "/api/tasks/$TID" '{"status":"DONE"}'
  hit "DELETE /api/tasks/:id" 200 DELETE "/api/tasks/$TID"
else
  check "POST /api/tasks" ok FAILED-no-id
fi

echo "== dashboard / analytics / reports / settings =="
hit "GET /api/dashboard"                200 GET "/api/dashboard"
hit "GET /api/analytics"                200 GET "/api/analytics"
hit "GET /api/reports"                  200 GET "/api/reports"
hit "GET /api/reports?from&to"          200 GET "/api/reports?from=2026-01-01&to=2026-12-31"
hit "GET /api/reports/export (xlsx)"    200 GET "/api/reports/export"
hit "GET /api/reports/financial"        200 GET "/api/reports/financial"
hit "GET /api/reports/financial (csv)"  200 GET "/api/reports/financial?format=csv"
hit "GET /api/reports/teacher-performance" 200 GET "/api/reports/teacher-performance"
hit "GET /api/settings"                 200 GET "/api/settings"
hit "GET /api/settings?prefix"          200 GET "/api/settings?prefix=brand"

echo "== teacher portal =="
hit "GET /api/teacher/dashboard"        200 GET "/api/teacher/dashboard"
hit "GET /api/teacher/profile"          200 GET "/api/teacher/profile"
hit "GET /api/teacher/students"         200 GET "/api/teacher/students"
hit "GET /api/teacher/students?search"  200 GET "/api/teacher/students?search=a"
hit "GET /api/teacher/homework"         200 GET "/api/teacher/homework"
hit "GET /api/teacher/students/__nope__" 404 GET "/api/teacher/students/__nope__"

# group-scoped teacher routes need a real group id
GID=$(curl -s "$BASE/api/groups?limit=1" -H "Authorization: Bearer $TOKEN" \
  | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{console.log(JSON.parse(d).groups?.[0]?.id||'')}catch{console.log('')}})")
if [ -n "$GID" ]; then
  hit "GET /api/teacher/groups/:id"           200 GET "/api/teacher/groups/$GID"
  hit "GET .../attendance?month"              200 GET "/api/teacher/groups/$GID/attendance?month=2026-08"
  hit "GET .../attendance (no month)"         400 GET "/api/teacher/groups/$GID/attendance"
  hit "GET .../scores?month"                  200 GET "/api/teacher/groups/$GID/scores?month=2026-08"
  hit "GET .../exercises?month"               200 GET "/api/teacher/groups/$GID/exercises?month=2026-08"
  hit "GET .../exams"                         200 GET "/api/teacher/groups/$GID/exams"
  hit "GET .../ranking"                       200 GET "/api/teacher/groups/$GID/ranking"
  hit "GET .../ranking?metric=coin"           200 GET "/api/teacher/groups/$GID/ranking?metric=coin"
else
  echo "  --   no group in DB, skipping group-scoped teacher routes"
fi

echo "== permissions =="
UID_=$(curl -s "$BASE/api/auth/me" -H "Authorization: Bearer $TOKEN" \
  | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{console.log(JSON.parse(d).user.id)}catch{console.log('')}})")
hit "GET /api/permissions/users/:id"    200 GET "/api/permissions/users/$UID_"
hit "GET /api/permissions/users/__nope__" 404 GET "/api/permissions/users/__nope__"
hit "PATCH /api/permissions/users/:id"  200 PATCH "/api/permissions/users/$UID_" '{"grants":[{"module":"leads","action":"view","granted":true}]}'

echo "== student portal (staff token must be rejected) =="
hit "GET /api/student/dashboard (staff)" 401 GET "/api/student/dashboard"

echo "== public (no auth) =="
code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/api/public/lead");      check "GET /api/public/lead" 200 "$code"
code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/api/branding");         check "GET /api/branding" 200 "$code"
code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/api/branding/logo");    check "GET /api/branding/logo" 200 "$code"
code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/api/public/lead" \
  -H 'Content-Type: application/json' -d '{"fullName":"x"}');               check "POST /api/public/lead (invalid)" 400 "$code"
# honeypot: bots get a silent 200 and no row created
code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/api/public/lead" \
  -H 'Content-Type: application/json' \
  -d '{"fullName":"Bot","phone":"+998900000000","website":"spam"}');        check "POST /api/public/lead (honeypot)" 200 "$code"
# telegram webhook: no token configured -> still 200 ok (never leaks)
code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/api/telegram/webhook" \
  -H 'Content-Type: application/json' -d '{}');                             check "POST /api/telegram/webhook" 200 "$code"
code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/api/telegram/miniapp/profile" \
  -H 'Content-Type: application/json' -d '{"initData":"bogus"}')
[ "$code" = "401" ] || [ "$code" = "500" ]; check "POST /api/telegram/miniapp/profile (bad initData)" 0 "$?"
# cron endpoints are reachable in dev (CRON_SECRET only enforced in production)
code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/api/cron/check-reminders"); check "GET /api/cron/check-reminders" 200 "$code"
code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/api/cron/follow-up");       check "GET /api/cron/follow-up" 200 "$code"

echo "== auth boundaries =="
for p in users courses groups payments expenses dashboard reports teacher/dashboard admin/migrate; do
  code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/api/$p")
  check "GET /api/$p without token" 401 "$code"
done

echo
echo "passed: $PASS   failed: $FAIL"
[ "$FAIL" -eq 0 ] || exit 1
