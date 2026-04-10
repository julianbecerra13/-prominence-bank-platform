#!/bin/bash
API="http://localhost:8000/api/v1"
PASS=0
FAIL=0

test_result() {
  if [ "$1" = "true" ]; then
    echo "  PASS: $2"
    PASS=$((PASS+1))
  else
    echo "  FAIL: $2"
    FAIL=$((FAIL+1))
  fi
}

get_json() {
  node -e "process.stdin.on('data',d=>{try{console.log(eval('JSON.parse(d)'+'.'+process.argv[1]))}catch(e){console.log('')}})" "$1"
}

login_user() {
  local email=$1
  local pass=$2
  local resp=$(curl -s $API/auth/login/ -X POST -H "Content-Type: application/json" -d "{\"email\":\"$email\",\"password\":\"$pass\"}")
  local otp=$(echo "$resp" | get_json "dev_otp")
  local token_resp=$(curl -s $API/auth/verify-otp/ -X POST -H "Content-Type: application/json" -d "{\"email\":\"$email\",\"otp_code\":\"$otp\"}")
  echo "$token_resp" | get_json "access"
}

echo ""
echo "========================================================"
echo "  PROMINENCE BANK - TEST SUITE COMPLETO"
echo "========================================================"

echo ""
echo "--- TEST 1: ADMIN LOGIN + OTP ---"
LOGIN_RESP=$(curl -s $API/auth/login/ -X POST -H "Content-Type: application/json" -d '{"email":"admin@prominencebank.com","password":"Admin2026!Secure"}')
OTP_REQ=$(echo "$LOGIN_RESP" | get_json "otp_required")
DEV_OTP=$(echo "$LOGIN_RESP" | get_json "dev_otp")
test_result "$([ "$OTP_REQ" = "true" ] && echo true || echo false)" "Login devuelve otp_required=true"
test_result "$([ ${#DEV_OTP} -eq 6 ] && echo true || echo false)" "OTP de 6 digitos generado: $DEV_OTP"

VERIFY_RESP=$(curl -s $API/auth/verify-otp/ -X POST -H "Content-Type: application/json" -d "{\"email\":\"admin@prominencebank.com\",\"otp_code\":\"$DEV_OTP\"}")
ADMIN_TOKEN=$(echo "$VERIFY_RESP" | get_json "access")
ADMIN_ROLE=$(echo "$VERIFY_RESP" | get_json "user.role")
test_result "$([ ${#ADMIN_TOKEN} -gt 20 ] && echo true || echo false)" "JWT token recibido (${#ADMIN_TOKEN} chars)"
test_result "$([ "$ADMIN_ROLE" = "superadmin" ] && echo true || echo false)" "Rol correcto: $ADMIN_ROLE"

ME_RESP=$(curl -s -H "Authorization: Bearer $ADMIN_TOKEN" $API/auth/me/)
ME_EMAIL=$(echo "$ME_RESP" | get_json "email")
test_result "$([ "$ME_EMAIL" = "admin@prominencebank.com" ] && echo true || echo false)" "Endpoint /me/: $ME_EMAIL"

echo ""
echo "--- TEST 2: CUSTOMERS CRUD + KYC ---"
CUSTS=$(curl -s -H "Authorization: Bearer $ADMIN_TOKEN" $API/admin/customers/)
CUST_COUNT=$(echo "$CUSTS" | node -e "process.stdin.on('data',d=>{const r=JSON.parse(d);console.log((r.results||r).length)})")
test_result "$([ "$CUST_COUNT" -ge 3 ] && echo true || echo false)" "Clientes iniciales: $CUST_COUNT (esperado >=3)"

NEW_CUST=$(curl -s -X POST -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" $API/admin/customers/ -d '{"email":"thomas.anderson@test.com","password":"TestDemo2026!Sec","first_name":"Thomas","last_name":"Anderson","customer_type":"personal","phone":"+1 555 999 0000","country":"United States"}')
NEW_CUST_ID=$(echo "$NEW_CUST" | get_json "id")
NEW_KYC=$(echo "$NEW_CUST" | get_json "kyc_status")
test_result "$([ -n "$NEW_CUST_ID" ] && [ "$NEW_CUST_ID" != "undefined" ] && echo true || echo false)" "Cliente Thomas Anderson creado (ID: $NEW_CUST_ID)"
test_result "$([ "$NEW_KYC" = "pending" ] && echo true || echo false)" "KYC inicial: $NEW_KYC"

APPROVE=$(curl -s -X POST -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" "$API/admin/customers/$NEW_CUST_ID/approve_kyc/" -d '{"notes":"Verified"}')
APP_KYC=$(echo "$APPROVE" | get_json "kyc_status")
test_result "$([ "$APP_KYC" = "approved" ] && echo true || echo false)" "KYC aprobado: $APP_KYC"

REJECT=$(curl -s -X POST -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" "$API/admin/customers/3/reject_kyc/" -d '{"notes":"Incomplete"}')
REJ_KYC=$(echo "$REJECT" | get_json "kyc_status")
test_result "$([ "$REJ_KYC" = "rejected" ] && echo true || echo false)" "KYC rechazado (Robert): $REJ_KYC"

echo ""
echo "--- TEST 3: OPEN ACCOUNT ---"
NEW_ACCT=$(curl -s -X POST -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" $API/admin/accounts/ -d "{\"customer_id\":$NEW_CUST_ID,\"account_type\":\"personal_checking\",\"currency\":\"USD\",\"account_name\":\"Thomas Primary\"}")
NEW_ACCT_ID=$(echo "$NEW_ACCT" | get_json "id")
NEW_ACCT_NUM=$(echo "$NEW_ACCT" | get_json "account_number")
INIT_BAL=$(echo "$NEW_ACCT" | get_json "available_balance")
test_result "$([ -n "$NEW_ACCT_ID" ] && [ "$NEW_ACCT_ID" != "undefined" ] && echo true || echo false)" "Cuenta creada: $NEW_ACCT_NUM (ID: $NEW_ACCT_ID)"
test_result "$([ "$INIT_BAL" = "0.0000" ] && echo true || echo false)" "Balance inicial: \$$INIT_BAL"

echo ""
echo "--- TEST 4: DEPOSITS (DOUBLE-ENTRY LEDGER) ---"
DEP1=$(curl -s -X POST -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" $API/admin/deposits/ -d "{\"account_id\":$NEW_ACCT_ID,\"amount\":\"100000.00\",\"description\":\"Initial wire deposit from Chase\"}")
DEP1_ST=$(echo "$DEP1" | get_json "transaction.status")
DEP1_BAL=$(echo "$DEP1" | get_json "account.available_balance")
test_result "$([ "$DEP1_ST" = "posted" ] && echo true || echo false)" "Deposito 1 (\$100K): status=$DEP1_ST"
test_result "$(echo "$DEP1_BAL" | grep -q '100000' && echo true || echo false)" "Balance: \$$DEP1_BAL"

DEP2=$(curl -s -X POST -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" $API/admin/deposits/ -d "{\"account_id\":$NEW_ACCT_ID,\"amount\":\"50000.00\",\"description\":\"Wire from Bank of America\"}")
DEP2_BAL=$(echo "$DEP2" | get_json "account.available_balance")
test_result "$(echo "$DEP2_BAL" | grep -q '150000' && echo true || echo false)" "Deposito 2 (\$50K) acumulado: \$$DEP2_BAL"

DEP3=$(curl -s -X POST -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" $API/admin/deposits/ -d "{\"account_id\":$NEW_ACCT_ID,\"amount\":\"25000.00\",\"description\":\"Cash deposit\"}")
DEP3_BAL=$(echo "$DEP3" | get_json "account.available_balance")
test_result "$(echo "$DEP3_BAL" | grep -q '175000' && echo true || echo false)" "Deposito 3 (\$25K) acumulado: \$$DEP3_BAL"

echo ""
echo "--- TEST 5: HOLDS (AVAILABLE vs HELD vs LEDGER) ---"
HOLD=$(curl -s -X POST -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" $API/admin/hold-place/ -d "{\"account_id\":$NEW_ACCT_ID,\"amount\":\"40000.00\",\"reason\":\"AML compliance review\"}")
HOLD_ID=$(echo "$HOLD" | get_json "hold.id")
H_AVAIL=$(echo "$HOLD" | get_json "account.available_balance")
H_HELD=$(echo "$HOLD" | get_json "account.held_balance")
H_LEDGER=$(echo "$HOLD" | get_json "account.ledger_balance")
test_result "$([ -n "$HOLD_ID" ] && echo true || echo false)" "Hold creado (ID: $HOLD_ID)"
test_result "$(echo "$H_AVAIL" | grep -q '135000' && echo true || echo false)" "Available bajo: \$$H_AVAIL (esperado 135000)"
test_result "$(echo "$H_HELD" | grep -q '40000' && echo true || echo false)" "Held subio: \$$H_HELD (esperado 40000)"
test_result "$(echo "$H_LEDGER" | grep -q '175000' && echo true || echo false)" "Ledger intacto: \$$H_LEDGER (esperado 175000 = 135K+40K)"

REL=$(curl -s -X POST -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" "$API/admin/hold-release/$HOLD_ID/")
R_AVAIL=$(echo "$REL" | get_json "account.available_balance")
R_HELD=$(echo "$REL" | get_json "account.held_balance")
R_STATUS=$(echo "$REL" | get_json "hold.status")
test_result "$([ "$R_STATUS" = "released" ] && echo true || echo false)" "Hold liberado: $R_STATUS"
test_result "$(echo "$R_AVAIL" | grep -q '175000' && echo true || echo false)" "Available restaurado: \$$R_AVAIL"
test_result "$(echo "$R_HELD" | grep -q '0.0000' && echo true || echo false)" "Held a cero: \$$R_HELD"

echo ""
echo "--- TEST 6: MAKER-CHECKER (TRANSFER APPROVAL) ---"
# Admin reviews the pending transfer (Maria Santos $125K)
TRANSFERS=$(curl -s -H "Authorization: Bearer $ADMIN_TOKEN" "$API/admin/transfers/?status=pending_review")
TRANSFER_ID=$(echo "$TRANSFERS" | node -e "process.stdin.on('data',d=>{const r=JSON.parse(d);const t=(r.results||r)[0];console.log(t?t.id:'')})")
test_result "$([ -n "$TRANSFER_ID" ] && echo true || echo false)" "Transferencia pendiente encontrada (ID: $TRANSFER_ID)"

# Step 1: Review by admin manager
REVIEW=$(curl -s -X POST -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" "$API/admin/transfers/$TRANSFER_ID/review/")
REV_ST=$(echo "$REVIEW" | get_json "status")
test_result "$([ "$REV_ST" = "under_review" ] && echo true || echo false)" "Step 1 - Review: $REV_ST"

# Step 2: Try to approve with SAME user (should fail)
SAME_APPROVE=$(curl -s -X POST -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" "$API/admin/transfers/$TRANSFER_ID/approve/")
SAME_ERR=$(echo "$SAME_APPROVE" | get_json "error")
test_result "$(echo "$SAME_ERR" | grep -qi 'maker-checker\|different' && echo true || echo false)" "Maker-checker BLOQUEADO: mismo usuario no puede aprobar"

# Step 3: Login as operator and approve
OPER_TOKEN=$(login_user "operator@prominencebank.com" "Operator2026!Secure")
test_result "$([ ${#OPER_TOKEN} -gt 20 ] && echo true || echo false)" "Operator logueado correctamente"

APPROVE=$(curl -s -X POST -H "Authorization: Bearer $OPER_TOKEN" -H "Content-Type: application/json" "$API/admin/transfers/$TRANSFER_ID/approve/")
APP_ST=$(echo "$APPROVE" | get_json "status")
test_result "$([ "$APP_ST" = "completed" ] && echo true || echo false)" "Step 2 - Aprobado por otro admin: $APP_ST"

echo ""
echo "--- TEST 7: INSTRUMENTS ---"
TYPES=$(curl -s -H "Authorization: Bearer $ADMIN_TOKEN" $API/admin/instrument-types/)
TYPE_COUNT=$(echo "$TYPES" | node -e "process.stdin.on('data',d=>{const r=JSON.parse(d);console.log((r.results||r).length)})")
test_result "$([ "$TYPE_COUNT" -ge 9 ] && echo true || echo false)" "Tipos de instrumento: $TYPE_COUNT (esperado 9)"

# Get SBLC type ID
SBLC_ID=$(echo "$TYPES" | node -e "process.stdin.on('data',d=>{const r=JSON.parse(d);const t=(r.results||r).find(x=>x.code==='SBLC');console.log(t?t.id:'')})")
BG_ID=$(echo "$TYPES" | node -e "process.stdin.on('data',d=>{const r=JSON.parse(d);const t=(r.results||r).find(x=>x.code==='BG');console.log(t?t.id:'')})")

# Issue a Bank Guarantee
NEW_INST=$(curl -s -X POST -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" $API/admin/instruments/ -d "{\"instrument_type_id\":$BG_ID,\"customer_id\":$NEW_CUST_ID,\"face_value\":\"250000.00\",\"currency\":\"USD\",\"issue_date\":\"2026-04-10\",\"maturity_date\":\"2027-04-10\",\"receiving_bank\":\"Deutsche Bank Frankfurt\",\"bank_swift_code\":\"DEUTDEFF\",\"beneficiary_name\":\"European Steel Corp.\"}")
INST_REF=$(echo "$NEW_INST" | get_json "reference_number")
INST_ST=$(echo "$NEW_INST" | get_json "status")
test_result "$([ -n "$INST_REF" ] && [ "$INST_REF" != "undefined" ] && echo true || echo false)" "Bank Guarantee emitido: $INST_REF"
test_result "$([ "$INST_ST" = "issued" ] && echo true || echo false)" "Status: $INST_ST"

echo ""
echo "--- TEST 8: AUDIT LOGS ---"
AUDIT=$(curl -s -H "Authorization: Bearer $ADMIN_TOKEN" "$API/admin/audit-logs/")
AUDIT_COUNT=$(echo "$AUDIT" | node -e "process.stdin.on('data',d=>{const r=JSON.parse(d);console.log((r.results||r).length)})")
test_result "$([ "$AUDIT_COUNT" -ge 10 ] && echo true || echo false)" "Audit logs: $AUDIT_COUNT entradas (esperado >=10)"

# Check specific audit types
AUDIT_DEPOSITS=$(curl -s -H "Authorization: Bearer $ADMIN_TOKEN" "$API/admin/audit-logs/?action=deposit")
DEP_AUDIT=$(echo "$AUDIT_DEPOSITS" | node -e "process.stdin.on('data',d=>{const r=JSON.parse(d);console.log((r.results||r).length)})")
test_result "$([ "$DEP_AUDIT" -ge 3 ] && echo true || echo false)" "Depositos auditados: $DEP_AUDIT"

AUDIT_HOLDS=$(curl -s -H "Authorization: Bearer $ADMIN_TOKEN" "$API/admin/audit-logs/?action=hold_placed")
HOLD_AUDIT=$(echo "$AUDIT_HOLDS" | node -e "process.stdin.on('data',d=>{const r=JSON.parse(d);console.log((r.results||r).length)})")
test_result "$([ "$HOLD_AUDIT" -ge 1 ] && echo true || echo false)" "Holds auditados: $HOLD_AUDIT"

echo ""
echo "========================================================"
echo "  TEST 9: CLIENT PORTAL (John Doe)"
echo "========================================================"
CLIENT_TOKEN=$(login_user "john.doe@email.com" "Client2026!Secure")
test_result "$([ ${#CLIENT_TOKEN} -gt 20 ] && echo true || echo false)" "Client login exitoso"

# Dashboard
DASH=$(curl -s -H "Authorization: Bearer $CLIENT_TOKEN" $API/client/dashboard/)
DASH_ACCTS=$(echo "$DASH" | node -e "process.stdin.on('data',d=>{console.log(JSON.parse(d).accounts?.length||0)})")
DASH_TOTAL=$(echo "$DASH" | get_json "summary.total_available")
DASH_TX=$(echo "$DASH" | node -e "process.stdin.on('data',d=>{console.log(JSON.parse(d).recent_transactions?.length||0)})")
test_result "$([ "$DASH_ACCTS" -ge 2 ] && echo true || echo false)" "Dashboard cuentas: $DASH_ACCTS"
test_result "$([ -n "$DASH_TOTAL" ] && echo true || echo false)" "Balance total disponible: \$$DASH_TOTAL"
test_result "$([ "$DASH_TX" -ge 1 ] && echo true || echo false)" "Transacciones recientes: $DASH_TX"

# Get account with balance (skip crypto/empty accounts)
ACCT1_ID=$(echo "$DASH" | node -e "process.stdin.on('data',d=>{const a=JSON.parse(d).accounts;const f=a.find(x=>Number(x.available_balance)>0);console.log(f?.id||a[0]?.id||'')})")

# Transactions for account
TX=$(curl -s -H "Authorization: Bearer $CLIENT_TOKEN" "$API/client/accounts/$ACCT1_ID/transactions/")
TX_COUNT=$(echo "$TX" | node -e "process.stdin.on('data',d=>{const r=JSON.parse(d);console.log((r.results||r).length)})")
test_result "$([ "$TX_COUNT" -ge 1 ] && echo true || echo false)" "Historial transacciones: $TX_COUNT"

# Beneficiaries
BENS=$(curl -s -H "Authorization: Bearer $CLIENT_TOKEN" $API/client/beneficiaries/)
BEN_COUNT=$(echo "$BENS" | node -e "process.stdin.on('data',d=>{const r=JSON.parse(d);console.log((r.results||r).length)})")
test_result "$([ "$BEN_COUNT" -ge 1 ] && echo true || echo false)" "Beneficiarios existentes: $BEN_COUNT"

# Add beneficiary
NEW_BEN=$(curl -s -X POST -H "Authorization: Bearer $CLIENT_TOKEN" -H "Content-Type: application/json" $API/client/beneficiaries/ -d '{"nickname":"My BofA Account","bank_name":"Bank of America","beneficiary_name":"John Doe","account_number":"9876543210","routing_number":"026009593"}')
BEN_ID=$(echo "$NEW_BEN" | get_json "id")
test_result "$([ -n "$BEN_ID" ] && [ "$BEN_ID" != "undefined" ] && echo true || echo false)" "Beneficiario creado (ID: $BEN_ID)"

# Wire transfer request
WIRE=$(curl -s -X POST -H "Authorization: Bearer $CLIENT_TOKEN" -H "Content-Type: application/json" $API/client/transfers/ -d "{\"source_account_id\":$ACCT1_ID,\"beneficiary_id\":$BEN_ID,\"amount\":\"5000.00\",\"currency\":\"USD\",\"purpose\":\"Personal transfer\",\"reference\":\"WIRE-TEST-001\"}")
WIRE_ST=$(echo "$WIRE" | get_json "status")
test_result "$([ "$WIRE_ST" = "pending_review" ] && echo true || echo false)" "Wire request creado: status=$WIRE_ST"

# Funding instructions
FUND=$(curl -s -H "Authorization: Bearer $CLIENT_TOKEN" "$API/client/accounts/$ACCT1_ID/funding-instructions/")
FUND_COUNT=$(echo "$FUND" | node -e "process.stdin.on('data',d=>{const r=JSON.parse(d);console.log((Array.isArray(r)?r:r.results||[]).length)})")
test_result "$([ "$FUND_COUNT" -ge 1 ] && echo true || echo false)" "Funding instructions: $FUND_COUNT"

# Statement PDF
STMT_CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $CLIENT_TOKEN" "$API/client/accounts/$ACCT1_ID/statement/?start_date=2026-01-01&end_date=2026-12-31")
test_result "$([ "$STMT_CODE" = "200" ] && echo true || echo false)" "PDF Statement descargado (HTTP $STMT_CODE)"

# Client instruments
INST=$(curl -s -H "Authorization: Bearer $CLIENT_TOKEN" $API/client/instruments/)
INST_COUNT=$(echo "$INST" | node -e "process.stdin.on('data',d=>{const r=JSON.parse(d);console.log((r.results||r).length)})")
test_result "$([ "$INST_COUNT" -ge 1 ] && echo true || echo false)" "Instrumentos visibles: $INST_COUNT"

echo ""
echo "========================================================"
echo "  TEST 10: SEGURIDAD"
echo "========================================================"

# Test RBAC: Viewer cannot deposit
VIEWER_TOKEN=$(login_user "viewer@prominencebank.com" "Viewer2026!Secure")
test_result "$([ ${#VIEWER_TOKEN} -gt 20 ] && echo true || echo false)" "Viewer login exitoso"

VIEWER_DEP=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "Authorization: Bearer $VIEWER_TOKEN" -H "Content-Type: application/json" $API/admin/deposits/ -d '{"account_id":1,"amount":"1000","description":"test"}')
test_result "$([ "$VIEWER_DEP" = "403" ] && echo true || echo false)" "RBAC: Viewer no puede depositar (HTTP $VIEWER_DEP)"

# Viewer CAN read customers
VIEWER_CUST=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $VIEWER_TOKEN" $API/admin/customers/)
test_result "$([ "$VIEWER_CUST" = "200" ] && echo true || echo false)" "RBAC: Viewer puede leer customers (HTTP $VIEWER_CUST)"

# Client cannot access admin endpoints
CLIENT_ADMIN=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $CLIENT_TOKEN" $API/admin/customers/)
test_result "$([ "$CLIENT_ADMIN" = "403" ] && echo true || echo false)" "RBAC: Client no puede acceder admin (HTTP $CLIENT_ADMIN)"

# Invalid OTP
BAD_OTP=$(curl -s $API/auth/verify-otp/ -X POST -H "Content-Type: application/json" -d '{"email":"admin@prominencebank.com","otp_code":"000000"}')
BAD_OTP_ERR=$(echo "$BAD_OTP" | get_json "error")
test_result "$([ -n "$BAD_OTP_ERR" ] && echo true || echo false)" "OTP invalido rechazado: $BAD_OTP_ERR"

# Wrong password
BAD_PASS=$(curl -s $API/auth/login/ -X POST -H "Content-Type: application/json" -d '{"email":"admin@prominencebank.com","password":"wrongpassword"}')
BAD_PASS_ERR=$(echo "$BAD_PASS" | get_json "error")
test_result "$(echo "$BAD_PASS_ERR" | grep -qi 'invalid\|credential' && echo true || echo false)" "Password incorrecto rechazado"

# Unauthenticated access
UNAUTH=$(curl -s -o /dev/null -w "%{http_code}" $API/admin/customers/)
test_result "$([ "$UNAUTH" = "401" ] && echo true || echo false)" "Sin token = 401 Unauthorized (HTTP $UNAUTH)"

echo ""
echo "========================================================"
echo "  TEST 11: SEGUNDO CLIENTE (Maria Santos - Business)"
echo "========================================================"
MARIA_TOKEN=$(login_user "maria.santos@globalcorp.com" "Client2026!Secure")
test_result "$([ ${#MARIA_TOKEN} -gt 20 ] && echo true || echo false)" "Maria Santos login exitoso"

MARIA_DASH=$(curl -s -H "Authorization: Bearer $MARIA_TOKEN" $API/client/dashboard/)
MARIA_ACCTS=$(echo "$MARIA_DASH" | node -e "process.stdin.on('data',d=>{console.log(JSON.parse(d).accounts?.length||0)})")
test_result "$([ "$MARIA_ACCTS" -ge 2 ] && echo true || echo false)" "Maria tiene $MARIA_ACCTS cuentas (business+custody)"

MARIA_INST=$(curl -s -H "Authorization: Bearer $MARIA_TOKEN" $API/client/instruments/)
MARIA_INST_CT=$(echo "$MARIA_INST" | node -e "process.stdin.on('data',d=>{const r=JSON.parse(d);console.log((r.results||r).length)})")
test_result "$([ "$MARIA_INST_CT" -ge 1 ] && echo true || echo false)" "Maria ve $MARIA_INST_CT instrumentos (SBLC)"

echo ""
echo "========================================================"
echo "========================================================"
echo ""
echo "  RESULTADOS FINALES"
echo ""
echo "  PASSED: $PASS"
echo "  FAILED: $FAIL"
echo "  TOTAL:  $((PASS+FAIL))"
echo ""
echo "========================================================"
echo "========================================================"
