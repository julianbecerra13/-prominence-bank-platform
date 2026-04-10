import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LayoutDashboard, Users, Wallet, CircleDollarSign, Lock, ArrowLeftRight, Shield, ScrollText, LogOut, Settings } from 'lucide-react'
import Breadcrumbs from '../components/Breadcrumbs'

const navSections = [
  {
    title: 'Overview',
    items: [
      { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
    ]
  },
  {
    title: 'Banking',
    items: [
      { to: '/admin/customers', icon: Users, label: 'Customers' },
      { to: '/admin/accounts', icon: Wallet, label: 'Accounts' },
      { to: '/admin/deposits', icon: CircleDollarSign, label: 'Deposits' },
      { to: '/admin/holds', icon: Lock, label: 'Holds' },
    ]
  },
  {
    title: 'Operations',
    items: [
      { to: '/admin/transfers', icon: ArrowLeftRight, label: 'Transfer Approvals' },
      { to: '/admin/instruments', icon: Shield, label: 'Instruments' },
    ]
  },
  {
    title: 'System',
    items: [
      { to: '/admin/audit', icon: ScrollText, label: 'Audit Logs' },
    ]
  },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside className="w-[260px] bg-gradient-to-b from-primary-600 via-primary-700 to-primary-900 text-white min-h-screen flex flex-col relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(circle at 50% 50%, white 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }} />

        {/* Logo */}
        <div className="relative z-10 p-5 pb-4">
          <img src="/logo.svg" alt="Prominence Bank" className="h-10 brightness-0 invert mx-auto" />
          <div className="flex items-center justify-center gap-2 mt-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-accent-400/30" />
            <span className="text-[10px] text-accent-400/70 font-semibold tracking-[0.2em]">BACK OFFICE</span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-accent-400/30" />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-2 px-3 relative z-10 space-y-4">
          {navSections.map(section => (
            <div key={section.title}>
              <p className="text-[10px] font-bold text-primary-300/50 uppercase tracking-[0.15em] px-4 mb-1.5">{section.title}</p>
              <div className="space-y-0.5">
                {section.items.map(({ to, icon: Icon, label, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                        isActive
                          ? 'text-accent-400 bg-white/10 shadow-lg shadow-black/5 border-l-2 border-accent-400 ml-0'
                          : 'text-primary-200 hover:text-white hover:bg-white/5 border-l-2 border-transparent'
                      }`
                    }
                  >
                    <Icon size={17} className="transition-transform duration-200 group-hover:scale-110" />
                    <span>{label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* User info */}
        <div className="relative z-10 p-4 border-t border-white/10">
          <div className="flex items-center gap-3 p-2">
            <div className="w-9 h-9 rounded-xl bg-accent-400/20 flex items-center justify-center text-accent-400 font-bold text-sm">
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.first_name} {user?.last_name}</p>
              <p className="text-[10px] text-accent-400/70 font-semibold uppercase tracking-wider">{user?.role?.replace(/_/g, ' ')}</p>
            </div>
            <button onClick={handleLogout} className="p-2 rounded-lg text-primary-300 hover:text-white hover:bg-white/10 transition-all duration-200 active:scale-90">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-7 overflow-auto">
        <Breadcrumbs />
        <div key={location.pathname} className="page-enter">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
