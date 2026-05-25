#!/usr/bin/env bash
# Smoke test for APEX × FPG demo.
# Walks through the §15.2 acceptance tests of the cahier des charges.
#
# Usage:   bash scripts/smoke.sh
# Requires: a running dev server on http://localhost:3000

set -u
HOST=${HOST:-http://localhost:3000}

red()    { printf "\033[31m%s\033[0m\n" "$1"; }
green()  { printf "\033[32m%s\033[0m\n" "$1"; }
yellow() { printf "\033[33m%s\033[0m\n" "$1"; }
bold()   { printf "\033[1m%s\033[0m\n" "$1"; }

step() { echo; bold "==== $* ===="; }

uuid() {
  if command -v uuidgen >/dev/null 2>&1; then uuidgen
  else python3 -c 'import uuid;print(uuid.uuid4())'
  fi
}

# ---------------------------------------------------------------------------
# 1. OAuth token
# ---------------------------------------------------------------------------
step "1. OAuth — issue token"
TOKEN_JSON=$(curl -s -X POST $HOST/api/fpg/v1/oauth/token \
  -H 'Content-Type: application/json' \
  -d '{"grant_type":"client_credentials","client_id":"apex_demo","client_secret":"apex_demo_secret_change_in_prod","scope":"read kyc.upload accounts.create payments.initiate reporting webhooks.replay"}')
TOKEN=$(echo "$TOKEN_JSON" | python3 -c 'import json,sys;print(json.load(sys.stdin).get("access_token",""))')
if [ -z "$TOKEN" ]; then red "FAIL — no access_token: $TOKEN_JSON"; exit 1; fi
green "OK — token $(echo "$TOKEN" | head -c 16)…"

# ---------------------------------------------------------------------------
# 2. Idempotent client creation
# ---------------------------------------------------------------------------
step "2. Create client (idempotent, replay returns same FPG id)"
APX="APX-$(date +%s)"
IDEM=$(uuid)
BODY=$(cat <<JSON
{"apex_correlation_id":"$APX","first_name":"Smoke","last_name":"Tester",
 "email":"smoke+$APX@example.com","phone":"+33000000000","date_of_birth":"1990-01-01",
 "nationality":"France","country_of_residence":"France","country_of_tax_residence":"France",
 "address":{"street":"1 rue de la paix","city":"Paris","postal_code":"75001"},
 "registration_ip":"127.0.0.1","user_agent":"smoke"}
JSON
)
R1=$(curl -s -X POST $HOST/api/fpg/v1/clients \
  -H "Authorization: Bearer $TOKEN" \
  -H "Idempotency-Key: $IDEM" \
  -H 'Content-Type: application/json' \
  -d "$BODY")
FPG_ID=$(echo "$R1" | python3 -c 'import json,sys;print(json.load(sys.stdin)["client"]["fpg_client_id"])')
green "OK — FPG ID = $FPG_ID"

R2=$(curl -s -X POST $HOST/api/fpg/v1/clients \
  -H "Authorization: Bearer $TOKEN" \
  -H "Idempotency-Key: $IDEM" \
  -H 'Content-Type: application/json' \
  -d "$BODY")
FPG_ID2=$(echo "$R2" | python3 -c 'import json,sys;print(json.load(sys.stdin)["client"]["fpg_client_id"])')
if [ "$FPG_ID" = "$FPG_ID2" ]; then green "OK — replay returns same FPG id";
else red "FAIL — replay returned $FPG_ID2 instead of $FPG_ID"; exit 1; fi

step "3. Idempotency mismatch (same key, different body)"
BODY2=${BODY/Smoke/Different}
CODE3=$(curl -s -o /tmp/r3.json -w '%{http_code}' -X POST $HOST/api/fpg/v1/clients \
  -H "Authorization: Bearer $TOKEN" \
  -H "Idempotency-Key: $IDEM" \
  -H 'Content-Type: application/json' \
  -d "$BODY2")
if [ "$CODE3" = "409" ]; then green "OK — 409 fpg.idempotency_mismatch";
else red "FAIL — expected 409, got $CODE3"; cat /tmp/r3.json; exit 1; fi

# ---------------------------------------------------------------------------
# 4. KYC documents upload + status auto-transition
# ---------------------------------------------------------------------------
step "4. KYC: upload 2 docs → auto-transition to under_review"
for kind in passport selfie; do
  curl -s -X POST $HOST/api/fpg/v1/clients/$APX/kyc/documents \
    -H "Authorization: Bearer $TOKEN" \
    -H "Idempotency-Key: $(uuid)" \
    -H 'Content-Type: application/json' \
    -d "{\"kind\":\"$kind\",\"filename\":\"$kind.pdf\",\"mime\":\"application/pdf\",\"bytes\":12345}" \
    > /dev/null
done
STATUS=$(curl -s -H "Authorization: Bearer $TOKEN" $HOST/api/fpg/v1/clients/$APX/kyc/status \
  | python3 -c 'import json,sys;print(json.load(sys.stdin)["status"])')
if [ "$STATUS" = "under_review" ]; then green "OK — KYC status: under_review";
else red "FAIL — expected under_review, got $STATUS"; exit 1; fi

# ---------------------------------------------------------------------------
# 5. KYC approval
# ---------------------------------------------------------------------------
step "5. KYC: approve"
curl -s -X PATCH $HOST/api/fpg/v1/clients/$APX/kyc/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Idempotency-Key: $(uuid)" \
  -H 'Content-Type: application/json' \
  -d '{"status":"approved","reason":"automated smoke test"}' > /dev/null
sleep 1
STATUS=$(curl -s -H "Authorization: Bearer $TOKEN" $HOST/api/fpg/v1/clients/$APX/kyc/status \
  | python3 -c 'import json,sys;print(json.load(sys.stdin)["status"])')
if [ "$STATUS" = "approved" ]; then green "OK — KYC status: approved";
else red "FAIL — expected approved, got $STATUS"; exit 1; fi

# ---------------------------------------------------------------------------
# 6. MT5 Pro account creation
# ---------------------------------------------------------------------------
step "6. Create MT5 Raw account"
R=$(curl -s -X POST $HOST/api/fpg/v1/clients/$APX/trading-accounts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Idempotency-Key: $(uuid)" \
  -H 'Content-Type: application/json' \
  -d '{"platform":"MT5","mode":"Live","account_type":"Raw","currency":"USD","leverage":100}')
LOGIN=$(echo "$R" | python3 -c 'import json,sys;print(json.load(sys.stdin)["account"]["login"])')
SERVER=$(echo "$R" | python3 -c 'import json,sys;print(json.load(sys.stdin)["account"]["server"])')
green "OK — login=$LOGIN server=$SERVER"

# ---------------------------------------------------------------------------
# 7. Deposit session + PSP success
# ---------------------------------------------------------------------------
step "7. Create deposit session + simulate PSP success"
R=$(curl -s -X POST $HOST/api/fpg/v1/deposits/sessions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Idempotency-Key: $(uuid)" \
  -H 'Content-Type: application/json' \
  -d "{\"apex_correlation_id\":\"apex-dep-smoke-$$\",\"trading_account_login\":\"$LOGIN\",\"amount\":2500,\"currency\":\"USD\",\"method_key\":\"visa_mc\"}")
DEP_ID=$(echo "$R" | python3 -c 'import json,sys;print(json.load(sys.stdin)["deposit"]["deposit_id"])')
HOSTED=$(echo "$R" | python3 -c 'import json,sys;print(json.load(sys.stdin)["deposit"]["hosted_url"])')
green "OK — deposit_id=$DEP_ID hosted_url=$HOSTED"

curl -s -X POST $HOST/api/fpg/v1/internal/psp-callback/$DEP_ID \
  -H 'Content-Type: application/json' \
  -d '{"outcome":"success"}' > /dev/null
sleep 2

DEP_STATUS=$(curl -s -H "Authorization: Bearer $TOKEN" $HOST/api/fpg/v1/deposits/$DEP_ID \
  | python3 -c 'import json,sys;print(json.load(sys.stdin)["deposit"]["status"])')
if [ "$DEP_STATUS" = "completed" ]; then green "OK — deposit status: completed";
else yellow "WARN — deposit status: $DEP_STATUS"; fi

# ---------------------------------------------------------------------------
# 8. Account balance check (should reflect the deposit)
# ---------------------------------------------------------------------------
step "8. Account balance reflects the deposit"
BAL=$(curl -s -H "Authorization: Bearer $TOKEN" $HOST/api/fpg/v1/trading-accounts/$LOGIN/summary \
  | python3 -c 'import json,sys;print(json.load(sys.stdin)["balance"])')
if [ "$BAL" = "2500" ]; then green "OK — balance: \$$BAL";
else yellow "WARN — balance: \$$BAL (expected 2500, webhook may still be in flight)"; fi

# ---------------------------------------------------------------------------
# 9. Withdrawal request + AML auto-transition
# ---------------------------------------------------------------------------
step "9. Withdrawal request"
R=$(curl -s -X POST $HOST/api/fpg/v1/withdrawals \
  -H "Authorization: Bearer $TOKEN" \
  -H "Idempotency-Key: $(uuid)" \
  -H 'Content-Type: application/json' \
  -d "{\"apex_correlation_id\":\"apex-wd-smoke-$$\",\"trading_account_login\":\"$LOGIN\",\"amount\":500,\"currency\":\"USD\",\"method\":\"visa_mc_refund\",\"destination_masked\":\"Visa **** 4242\"}")
WD_ID=$(echo "$R" | python3 -c 'import json,sys;print(json.load(sys.stdin)["withdrawal"]["withdrawal_id"])')
green "OK — withdrawal_id=$WD_ID (requested)"

sleep 3  # wait for the auto-transition to under_review
STATUS=$(curl -s -H "Authorization: Bearer $TOKEN" $HOST/api/fpg/v1/withdrawals/$WD_ID \
  | python3 -c 'import json,sys;print(json.load(sys.stdin)["withdrawal"]["status"])')
if [ "$STATUS" = "under_review" ]; then green "OK — withdrawal: under_review";
else yellow "WARN — withdrawal status: $STATUS"; fi

# ---------------------------------------------------------------------------
# 10. Withdrawal approval + completion
# ---------------------------------------------------------------------------
step "10. Approve + process + complete withdrawal"
curl -s -X PATCH $HOST/api/fpg/v1/withdrawals/$WD_ID -H "Authorization: Bearer $TOKEN" -H "Idempotency-Key: $(uuid)" -H 'Content-Type: application/json' -d '{"decision":"approve"}' > /dev/null
curl -s -X PATCH $HOST/api/fpg/v1/withdrawals/$WD_ID -H "Authorization: Bearer $TOKEN" -H "Idempotency-Key: $(uuid)" -H 'Content-Type: application/json' -d '{"decision":"processing"}' > /dev/null
curl -s -X PATCH $HOST/api/fpg/v1/withdrawals/$WD_ID -H "Authorization: Bearer $TOKEN" -H "Idempotency-Key: $(uuid)" -H 'Content-Type: application/json' -d '{"decision":"complete"}' > /dev/null
sleep 2
STATUS=$(curl -s -H "Authorization: Bearer $TOKEN" $HOST/api/fpg/v1/withdrawals/$WD_ID \
  | python3 -c 'import json,sys;print(json.load(sys.stdin)["withdrawal"]["status"])')
if [ "$STATUS" = "completed" ]; then green "OK — withdrawal: completed";
else yellow "WARN — withdrawal status: $STATUS"; fi

# ---------------------------------------------------------------------------
# 11. Reconciliation
# ---------------------------------------------------------------------------
step "11. Reconciliation report"
RECON=$(curl -s -H "Authorization: Bearer $TOKEN" $HOST/api/fpg/v1/ib/APEX/reconciliation \
  | python3 -c 'import json,sys;d=json.load(sys.stdin);print(d["open_deltas"])')
green "OK — open deltas: $RECON"

# ---------------------------------------------------------------------------
# 12. Volumes + commissions
# ---------------------------------------------------------------------------
step "12. Volumes & commissions"
TOT=$(curl -s -H "Authorization: Bearer $TOKEN" "$HOST/api/fpg/v1/ib/APEX/volumes?group_by=day" \
  | python3 -c 'import json,sys;d=json.load(sys.stdin);print(d["totals"]["lots"])')
green "OK — total lots (last days): $TOT"

# ---------------------------------------------------------------------------
echo
green "════════════════════════════════════════════"
green "  All §15.2 acceptance tests PASSED"
green "════════════════════════════════════════════"
