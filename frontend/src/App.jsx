import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

import LoginPage from './pages/auth/Login'
import OTPVerifyPage from './pages/auth/OTPVerify'

import ClientLayout from './layouts/ClientLayout'
import ClientDashboard from './pages/client/Dashboard'
import ClientTransactions from './pages/client/Transactions'
import ClientBeneficiaries from './pages/client/Beneficiaries'
import ClientWireRequest from './pages/client/WireRequest'
import ClientFundingInstructions from './pages/client/FundingInstructions'
import ClientStatements from './pages/client/Statements'
import ClientInstruments from './pages/client/Instruments'

import AdminLayout from './layouts/AdminLayout'
import AdminDashboard from './pages/admin/Dashboard'
import AdminCustomers from './pages/admin/Customers'
import AdminAccounts from './pages/admin/Accounts'
import AdminDeposits from './pages/admin/Deposits'
import AdminHolds from './pages/admin/Holds'
import AdminTransfers from './pages/admin/Transfers'
import AdminInstruments from './pages/admin/Instruments'
import AdminAuditLogs from './pages/admin/AuditLogs'

function ProtectedRoute({ children, requireAdmin }) {
  const { user, isAdmin } = useAuth()
  if (!user) return <Navigate to="/login" />
  if (requireAdmin && !isAdmin) return <Navigate to="/client" />
  return children
}

export default function App() {
  const { user, isAdmin } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={isAdmin ? '/admin' : '/client'} /> : <LoginPage />} />
      <Route path="/verify-otp" element={<OTPVerifyPage />} />

      {/* Client Portal */}
      <Route path="/client" element={<ProtectedRoute><ClientLayout /></ProtectedRoute>}>
        <Route index element={<ClientDashboard />} />
        <Route path="transactions" element={<ClientTransactions />} />
        <Route path="beneficiaries" element={<ClientBeneficiaries />} />
        <Route path="wire-transfer" element={<ClientWireRequest />} />
        <Route path="funding" element={<ClientFundingInstructions />} />
        <Route path="statements" element={<ClientStatements />} />
        <Route path="instruments" element={<ClientInstruments />} />
      </Route>

      {/* Admin Back Office */}
      <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminLayout /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="customers" element={<AdminCustomers />} />
        <Route path="accounts" element={<AdminAccounts />} />
        <Route path="deposits" element={<AdminDeposits />} />
        <Route path="holds" element={<AdminHolds />} />
        <Route path="transfers" element={<AdminTransfers />} />
        <Route path="instruments" element={<AdminInstruments />} />
        <Route path="audit" element={<AdminAuditLogs />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  )
}
