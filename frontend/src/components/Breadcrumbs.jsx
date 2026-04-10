import { useLocation, Link } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'

const nameMap = {
  client: 'Portal',
  admin: 'Back Office',
  transactions: 'Transactions',
  beneficiaries: 'Beneficiaries',
  'wire-transfer': 'Wire Transfer',
  funding: 'Funding Instructions',
  statements: 'Statements',
  instruments: 'Instruments',
  customers: 'Customers',
  accounts: 'Accounts',
  deposits: 'Deposits',
  holds: 'Holds',
  transfers: 'Transfer Approvals',
  audit: 'Audit Logs',
}

export default function Breadcrumbs() {
  const location = useLocation()
  const parts = location.pathname.split('/').filter(Boolean)

  if (parts.length <= 1) return null

  return (
    <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-4">
      <Home size={12} />
      {parts.map((part, i) => {
        const path = '/' + parts.slice(0, i + 1).join('/')
        const isLast = i === parts.length - 1
        const name = nameMap[part] || part

        return (
          <span key={path} className="flex items-center gap-1.5">
            <ChevronRight size={12} />
            {isLast ? (
              <span className="font-medium text-gray-600">{name}</span>
            ) : (
              <Link to={path} className="hover:text-primary-500 transition-colors">{name}</Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}
