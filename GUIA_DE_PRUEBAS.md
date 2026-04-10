# PROMINENCE BANK - GUIA DE PRUEBAS PASO A PASO

## URLs
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000

---

## PARTE 1: ADMIN BACK OFFICE (Portal de Administracion)

### 1.1 Login como Admin Manager

1. Abre http://localhost:3000
2. Ingresa las credenciales:
   - Email: `admin@prominencebank.com`
   - Password: `Admin2026!Secure`
3. Click en **Sign In**
4. Veras un toast amarillo con el OTP (ej: "Dev OTP: 123456")
5. Copia ese numero de 6 digitos
6. Pegalo en el campo OTP y click **Verify & Login**
7. **RESULTADO ESPERADO:** Te lleva al Admin Dashboard con 4 tarjetas:
   - Total Customers (3)
   - Total Accounts (6)
   - Pending Transfers (1)
   - Audit Entries (12+)

---

### 1.2 Gestion de Clientes (Customers)

1. Click en **Customers** en el menu lateral
2. **RESULTADO ESPERADO:** Tabla con 3 clientes:
   - PB-C-10000001 - John Doe (KYC: approved)
   - PB-C-10000002 - Maria Santos (KYC: approved)
   - PB-C-10000003 - Robert Williams (KYC: pending)

#### Crear un nuevo cliente:
3. Click **New Customer**
4. Llena el formulario:
   - Email: `test.demo@email.com`
   - Password: `TestDemo2026!`
   - First Name: `Thomas`
   - Last Name: `Anderson`
   - Type: Personal
   - Phone: `+1 555 999 0000`
5. Click **Create Customer**
6. **RESULTADO ESPERADO:** Aparece en la tabla con KYC: pending

#### Aprobar KYC:
7. En la fila de Thomas Anderson, click **Approve**
8. **RESULTADO ESPERADO:** KYC cambia a "approved"

#### Rechazar KYC (probar con Robert Williams):
9. En la fila de Robert Williams, click **Reject**
10. **RESULTADO ESPERADO:** KYC cambia a "rejected"

---

### 1.3 Gestion de Cuentas (Accounts)

1. Click en **Accounts** en el menu lateral
2. **RESULTADO ESPERADO:** Tabla con cuentas bancarias mostrando balances:
   - PB-CHK-10000001 (John Doe - Personal Checking) ~$240,000
   - PB-SAV-10000001 (John Doe - Savings) ~$525,000
   - PB-CRY-10000001 (John Doe - Crypto/BTC) $0
   - PB-BIZ-10000001 (Maria Santos - Business) ~$1,525,000
   - PB-CUS-10000001 (Maria Santos - Custody) $0

#### Abrir nueva cuenta:
3. Click **Open Account**
4. Selecciona:
   - Customer: PB-C-10000001 - John Doe
   - Account Type: Savings
   - Currency: EUR
   - Account Name: Euro Savings
5. Click **Open Account**
6. **RESULTADO ESPERADO:** Nueva cuenta aparece en la tabla con balance $0.00

---

### 1.4 Depositos (EL FLUJO MAS IMPORTANTE)

Este es el flujo que demuestra el ledger de doble entrada.

1. Click en **Deposits** en el menu lateral
2. Selecciona una cuenta (ej: la nueva cuenta Euro Savings, o PB-CHK-10000001)
3. Amount: `50000`
4. Description: `Wire deposit from external bank`
5. Click **Post Deposit**
6. **RESULTADO ESPERADO:** A la derecha aparece un panel verde con:
   - Transaction reference (UUID)
   - Amount: $50,000.00
   - New Available Balance (actualizado)
   - New Ledger Balance (actualizado)
7. **VERIFICACION CRITICA:** Vuelve a **Accounts** y confirma que el balance se actualizo

#### Hacer varios depositos para tener historial:
8. Vuelve a Deposits, misma cuenta, deposita $25,000 con descripcion "Client wire - Invoice #1042"
9. Deposita $10,000 con descripcion "Cash deposit"
10. **RESULTADO ESPERADO:** Cada deposito muestra el balance creciendo

---

### 1.5 Holds (Retenciones)

1. Click en **Holds** en el menu lateral
2. **RESULTADO ESPERADO:** Tabla con 1 hold activo (AML review - $50,000 en cuenta de Maria Santos)

#### Colocar un hold:
3. Selecciona cuenta PB-CHK-10000001 (John Doe)
4. Amount: `15000`
5. Reason: `Suspicious activity review`
6. Click **Place Hold**
7. **RESULTADO ESPERADO:** Hold aparece en la tabla como "active"
8. Vuelve a **Accounts** y verifica que:
   - Available Balance BAJO en $15,000
   - Held Balance SUBIO en $15,000
   - Ledger Balance permanece IGUAL (available + held = ledger)

#### Liberar un hold:
9. Vuelve a **Holds**
10. Click **Release** en el hold que acabas de crear
11. **RESULTADO ESPERADO:** Status cambia a "released"
12. Verifica en Accounts que el balance volvio a la normalidad

---

### 1.6 Aprobacion de Transferencias (Maker-Checker)

Este flujo demuestra que 2 admins diferentes son requeridos.

1. Click en **Transfer Approvals** en el menu lateral
2. **RESULTADO ESPERADO:** 1 transferencia pendiente:
   - Maria Santos -> Shanghai Manufacturing Co.
   - $125,000 USD
   - Status: pending_review

#### Step 1 - Review (primer admin):
3. Click **Review** en esa transferencia
4. **RESULTADO ESPERADO:** Status cambia a "under_review", tu nombre aparece como Reviewer

#### Step 2 - Approve (necesita OTRO admin):
5. Click **Approve**
6. **RESULTADO ESPERADO:** ERROR "Approver must be different from reviewer (maker-checker policy)"
   - ESTO ES CORRECTO - demuestra que maker-checker funciona
7. Para completar la aprobacion:
   - Haz logout (boton Logout abajo del menu)
   - Login como Admin Operator: `operator@prominencebank.com` / `Operator2026!Secure`
   - Ve a Transfer Approvals
   - Click **Approve** en la transferencia under_review
8. **RESULTADO ESPERADO:** Status cambia a "completed", se descontaron $125,000 de la cuenta de Maria Santos

---

### 1.7 Instrumentos Bancarios

1. Click en **Instruments** en el menu lateral
2. **RESULTADO ESPERADO:** 2 instrumentos:
   - PB-CD-100001 (Certificate of Deposit - John Doe - $100,000)
   - PB-SBLC-100001 (Standby Letter of Credit - Maria Santos - $500,000)

#### Emitir nuevo instrumento:
3. Click **Issue Instrument**
4. Llena:
   - Type: BG - Bank Guarantee (Fee: $2000)
   - Customer: Maria Santos
   - Face Value: 250000
   - Currency: USD
   - Issue Date: 2026-04-10
   - Maturity Date: 2027-04-10
   - Receiving Bank: Deutsche Bank Frankfurt
   - SWIFT Code: DEUTDEFF
   - Beneficiary: European Steel Corp.
5. Click **Issue Instrument**
6. **RESULTADO ESPERADO:** Nuevo instrumento aparece en la tabla con status "issued"

---

### 1.8 Audit Logs

1. Click en **Audit Logs** en el menu lateral
2. **RESULTADO ESPERADO:** Lista de TODAS las acciones que hiciste:
   - Depositos realizados
   - Holds colocados/liberados
   - Clientes creados
   - Instrumentos emitidos
   - Cada accion con: timestamp, usuario, tipo, descripcion, IP
3. Usa el filtro dropdown para filtrar por tipo (deposit, hold_placed, etc.)
4. **VERIFICACION CRITICA:** Cada accion que hiciste en los pasos anteriores debe tener un registro aqui

---

## PARTE 2: CLIENT PORTAL (Portal del Cliente)

### 2.1 Login como Cliente

1. Haz logout del admin
2. Login con: `john.doe@email.com` / `Client2026!Secure`
3. Ingresa el OTP del toast
4. **RESULTADO ESPERADO:** Dashboard del cliente con:
   - Available Balance total (suma de todas sus cuentas)
   - Held Balance total
   - Total Accounts (3+)
   - Tabla "My Accounts" con sus cuentas y balances
   - Tabla "Recent Transactions" con historial

---

### 2.2 Historial de Transacciones

1. Click en **Transactions** en el menu lateral
2. Selecciona cuenta PB-CHK-10000001 en el dropdown
3. **RESULTADO ESPERADO:** Lista de todas las transacciones de esa cuenta:
   - Depositos iniciales
   - Transferencia a savings
   - Depositos que hiciste como admin
   - Holds (si los hiciste en esa cuenta)
4. Cambia a PB-SAV-10000001
5. **RESULTADO ESPERADO:** Transacciones de la cuenta de savings

---

### 2.3 Beneficiarios

1. Click en **Beneficiaries**
2. **RESULTADO ESPERADO:** 1 beneficiario: "My Chase Account - John Doe"

#### Agregar beneficiario:
3. Click **Add Beneficiary**
4. Llena:
   - Nickname: Mi cuenta Bank of America
   - Beneficiary Name: John Doe
   - Bank Name: Bank of America
   - Account Number: 9876543210
   - Routing Number: 026009593
5. Click **Save Beneficiary**
6. **RESULTADO ESPERADO:** Nuevo beneficiario aparece en la tabla

---

### 2.4 Solicitud de Wire Transfer

1. Click en **Wire Transfer**
2. Llena el formulario:
   - Source Account: PB-CHK-10000001 (muestra el balance disponible)
   - Beneficiary: Mi cuenta Bank of America (el que acabas de crear)
   - Amount: 5000
   - Reference: TRANSFER-001
   - Purpose: Personal transfer to external account
3. Click **Submit Wire Transfer Request**
4. **RESULTADO ESPERADO:** 
   - Toast de exito "Wire transfer request submitted for review"
   - La transferencia aparece abajo en "My Transfer Requests" con status "pending_review"
5. **NOTA:** Esta transferencia ahora necesita aprobacion de 2 admins (maker-checker)

---

### 2.5 Funding Instructions

1. Click en **Funding Instructions**
2. Selecciona cuenta PB-CHK-10000001
3. **RESULTADO ESPERADO:** Panel azul con instrucciones de deposito:
   - Bank Name: Prominence Bank
   - SWIFT Code: PRMBUSNY
   - Routing Number: 021000089
   - Instrucciones detalladas de como hacer wire al banco

---

### 2.6 Descarga de Statement PDF

1. Click en **Statements**
2. Selecciona cuenta PB-CHK-10000001
3. Ajusta las fechas (Start: 2026-01-01, End: 2026-12-31)
4. Click **Download PDF Statement**
5. **RESULTADO ESPERADO:** Se descarga un PDF con:
   - Header "PROMINENCE BANK"
   - Datos de la cuenta
   - Balance Summary (Available, Held, In-Transit, Ledger)
   - Tabla de transacciones con fechas, descripciones, debitos y creditos
   - Footer del banco

---

### 2.7 Instrumentos Bancarios (vista cliente)

1. Click en **Bank Instruments**
2. **RESULTADO ESPERADO:** Tabla con el Certificate of Deposit:
   - PB-CD-100001 - $100,000 - Active
   - (Solo ve los instrumentos emitidos a su nombre)

---

## PARTE 3: PRUEBAS DE SEGURIDAD Y RBAC

### 3.1 Admin Viewer (solo lectura)

1. Logout
2. Login como: `viewer@prominencebank.com` / `Viewer2026!Secure`
3. Navega por Customers, Accounts, Transfers, Audit Logs
4. **RESULTADO ESPERADO:** Puede VER todo pero NO puede:
   - Crear clientes
   - Hacer depositos
   - Aprobar transferencias
   - (Los botones de accion no deberian funcionar para este rol)

### 3.2 Account Lockout

1. Logout
2. Intenta login con `john.doe@email.com` y password INCORRECTO 5 veces seguidas
3. **RESULTADO ESPERADO:** Despues del 5to intento, la cuenta se bloquea:
   - Mensaje: "Account is temporarily locked. Try again later."

### 3.3 OTP Expirado

1. Login con credenciales correctas
2. Recibe el OTP pero NO lo ingreses
3. Espera 10 minutos (o para probar rapido, puedes verificar que un OTP viejo no funciona)
4. Ingresa un OTP inventado (ej: 000000)
5. **RESULTADO ESPERADO:** "Invalid or expired OTP"

---

## PARTE 4: SEGUNDO CLIENTE (Maria Santos - Business)

### 4.1 Login como cliente business

1. Login con: `maria.santos@globalcorp.com` / `Client2026!Secure`
2. **RESULTADO ESPERADO:** Dashboard muestra:
   - Business Checking con ~$1,400,000+ (o menos si aprobaste la transferencia de $125K)
   - Custody Account con $0
   - Held Balance de $50,000 (AML review hold)
3. Verifica que ve la SBLC en Bank Instruments
4. Verifica que ve su beneficiario (Supplier - Shanghai Co.)
5. Verifica que la transferencia de $125K aparece como "completed" (si la aprobaste)

---

## PARTE 5: FLUJO COMPLETO END-TO-END

Este es el flujo para el VIDEO DEMO del concurso:

### Guion del demo (5-7 minutos):

1. **[Admin]** Login como admin -> mostrar dashboard
2. **[Admin]** Crear un cliente nuevo (Thomas Anderson)
3. **[Admin]** Aprobar su KYC
4. **[Admin]** Abrir cuenta checking para Thomas
5. **[Admin]** Depositar $100,000 -> mostrar balance actualizandose
6. **[Admin]** Depositar $50,000 mas -> mostrar balance creciendo
7. **[Admin]** Colocar hold de $20,000 -> mostrar available baja, held sube, ledger igual
8. **[Admin]** Liberar hold -> mostrar balance vuelve a normal
9. **[Admin]** Emitir un SBLC para Thomas
10. **[Admin]** Mostrar Audit Logs con todas las acciones registradas
11. **[Client]** Login como Thomas Anderson
12. **[Client]** Dashboard muestra cuentas y balances correctos
13. **[Client]** Ver transacciones (depositos visibles)
14. **[Client]** Agregar beneficiario
15. **[Client]** Solicitar wire transfer
16. **[Client]** Descargar PDF statement
17. **[Client]** Ver instrumentos (SBLC visible)
18. **[Admin]** Login como admin operator -> Review la transferencia
19. **[Admin]** Login como admin manager -> Approve (maker-checker)
20. **[Client]** Login como Thomas -> transferencia muestra "completed"

---

## CHECKLIST DE VERIFICACION

| # | Funcionalidad | Status |
|---|---|---|
| 1 | Login con email + password | [ ] |
| 2 | OTP verification | [ ] |
| 3 | Redireccion admin vs client segun rol | [ ] |
| 4 | Admin Dashboard con estadisticas | [ ] |
| 5 | Crear cliente (admin) | [ ] |
| 6 | Aprobar/Rechazar KYC | [ ] |
| 7 | Abrir cuenta bancaria | [ ] |
| 8 | Hacer deposito (balance se actualiza) | [ ] |
| 9 | Colocar hold (available baja, held sube) | [ ] |
| 10 | Liberar hold (balance restaurado) | [ ] |
| 11 | Emitir instrumento bancario | [ ] |
| 12 | Revisar transferencia (Step 1 - Review) | [ ] |
| 13 | Maker-checker enforcement (mismo user no puede aprobar) | [ ] |
| 14 | Aprobar transferencia (Step 2 - otro admin) | [ ] |
| 15 | Balance descontado tras aprobacion | [ ] |
| 16 | Audit logs registran TODAS las acciones | [ ] |
| 17 | Client Dashboard con balances | [ ] |
| 18 | Client ve historial de transacciones | [ ] |
| 19 | Client agrega beneficiario | [ ] |
| 20 | Client solicita wire transfer | [ ] |
| 21 | Client ve funding instructions | [ ] |
| 22 | Client descarga PDF statement | [ ] |
| 23 | Client ve instrumentos bancarios | [ ] |
| 24 | Admin Viewer solo puede ver (no modificar) | [ ] |
| 25 | Account lockout tras 5 intentos fallidos | [ ] |
| 26 | Branding "Prominence Bank" visible en toda la UI | [ ] |
| 27 | Double-entry: cada deposito crea 2 ledger entries | [ ] |
| 28 | Balances cuadran: available + held + in_transit = ledger | [ ] |

---

## CREDENCIALES COMPLETAS

| Rol | Email | Password |
|---|---|---|
| Admin Manager (superadmin) | admin@prominencebank.com | Admin2026!Secure |
| Admin Operator | operator@prominencebank.com | Operator2026!Secure |
| Admin Viewer (solo lectura) | viewer@prominencebank.com | Viewer2026!Secure |
| Client - John Doe (personal) | john.doe@email.com | Client2026!Secure |
| Client - Maria Santos (business) | maria.santos@globalcorp.com | Client2026!Secure |
| Client - Robert Williams (KYC pending) | pending.client@email.com | Client2026!Secure |
| Client - Thomas Anderson (lo creas tu) | test.demo@email.com | TestDemo2026! |
