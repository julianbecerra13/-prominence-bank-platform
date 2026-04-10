import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LayoutDashboard, ArrowLeftRight, Users, Send, Building2, FileText, Shield, LogOut, ChevronRight } from 'lucide-react'
import NotificationBell from '../components/NotificationBell'
import Breadcrumbs from '../components/Breadcrumbs'

const navItems = [
  { to: '/client', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/client/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { to: '/client/beneficiaries', icon: Users, label: 'Beneficiaries' },
  { to: '/client/wire-transfer', icon: Send, label: 'Wire Transfer' },
  { to: '/client/funding', icon: Building2, label: 'Funding Instructions' },
  { to: '/client/statements', icon: FileText, label: 'Statements' },
  { to: '/client/instruments', icon: Shield, label: 'Bank Instruments' },
]

export default function ClientLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Top bar */}
      <header className="bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600 text-white shadow-lg shadow-primary-900/10 relative overflow-hidden">
        {/* Subtle animated accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-accent-400/60 to-transparent" />
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/logo.svg" alt="Prominence Bank" className="h-10 brightness-0 invert" />
            <div className="hidden md:block h-6 w-px bg-white/20" />
            <span className="hidden md:block text-xs text-primary-200 font-medium tracking-wide">CLIENT PORTAL</span>
          </div>
          <div className="flex items-center gap-5">
            <NotificationBell />
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium">{user?.first_name} {user?.last_name}</p>
              <p className="text-[10px] text-primary-200 uppercase tracking-wider">{user?.role}</p>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-primary-200 hover:text-white hover:bg-white/10 transition-all duration-200 active:scale-95">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto flex">
        {/* Sidebar */}
        <nav className="w-60 min-h-[calc(100vh-60px)] bg-white border-r border-gray-100 py-6 flex flex-col">
          <div className="flex-1 space-y-0.5 px-3">
            {navItems.map(({ to, icon: Icon, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                    isActive
                      ? 'text-primary-600 bg-primary-50 shadow-sm shadow-primary-100'
                      : 'text-gray-500 hover:text-primary-600 hover:bg-gray-50'
                  }`
                }
              >
                <Icon size={18} className="transition-transform duration-200 group-hover:scale-110" />
                <span className="flex-1">{label}</span>
              </NavLink>
            ))}
          </div>

          {/* Bottom branding */}
          <div className="px-6 pt-4 border-t border-gray-100 mt-4">
            <p className="text-[10px] text-gray-300 font-medium tracking-wider">PROMINENCE BANK</p>
            <p className="text-[10px] text-gray-300">v1.0 &bull; Smart Banking</p>
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1 p-6 min-h-[calc(100vh-60px)]">
          <Breadcrumbs />
          <div key={location.pathname} className="page-enter">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
