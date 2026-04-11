import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Users, Wallet, ArrowLeftRight, ScrollText, Clock, ChevronRight } from 'lucide-react'
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts'
import api from '../../api/client'
import StatCard from '../../components/StatCard'
import StatusBadge from '../../components/StatusBadge'
import PageHeader from '../../components/PageHeader'
import { SkeletonCard } from '../../components/Skeleton'

const COLORS = ['#0A1F44', '#C5A55A', '#10B981', '#3B82F6', '#8B5CF6']
const mockBarData = [
  { day: 'Mon', txns: 12 }, { day: 'Tue', txns: 19 }, { day: 'Wed', txns: 8 },
  { day: 'Thu', txns: 24 }, { day: 'Fri', txns: 15 }, { day: 'Sat', txns: 6 }, { day: 'Sun', txns: 3 },
]

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [pendingTransfers, setPendingTransfers] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [accountTypes, setAccountTypes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/admin/customers/'),
      api.get('/admin/accounts/'),
      api.get('/admin/transfers/?status=pending_review'),
      api.get('/admin/audit-logs/'),
    ]).then(([cust, acct, trans, audit]) => {
      const custs = cust.data.results || cust.data
      const accts = (acct.data.results || acct.data).filter(a => !a.account_number.startsWith('PB-OPS'))
      const transfers = trans.data.results || trans.data
      const logs = audit.data.results || audit.data

      setStats({
        customers: custs.length,
        accounts: accts.length,
        pendingTransfers: transfers.length,
        auditEntries: audit.data.count || logs.length,
      })
      setPendingTransfers(transfers.slice(0, 5))
      setAuditLogs(logs.slice(0, 8))

      // Account type distribution
      const typeCounts = {}
      accts.forEach(a => { typeCounts[a.account_type] = (typeCounts[a.account_type] || 0) + 1 })
      setAccountTypes(Object.entries(typeCounts).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value })))
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="space-y-6 page-enter">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4"><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
    </div>
  )

  const quickActions = [
    { to: '/admin/customers', icon: Users, label: 'New Customer', color: 'text-blue-500' },
    { to: '/admin/deposits', icon: Wallet, label: 'Make Deposit', color: 'text-emerald-500' },
    { to: '/admin/transfers', icon: ArrowLeftRight, label: 'Review Transfers', color: 'text-amber-500' },
    { to: '/admin/audit', icon: ScrollText, label: 'Audit Logs', color: 'text-purple-500' },
  ]

  function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  return (
    <div className="space-y-6 page-enter">
      <PageHeader title="Admin Dashboard" subtitle="System overview and quick actions" />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Customers" value={stats?.customers} prefix="" decimals={0} gradient="stat-navy" />
        <StatCard icon={Wallet} label="Total Accounts" value={stats?.accounts} prefix="" decimals={0} gradient="stat-green" />
        <StatCard icon={ArrowLeftRight} label="Pending Transfers" value={stats?.pendingTransfers} prefix="" decimals={0} gradient="stat-amber" />
        <StatCard icon={ScrollText} label="Audit Entries" value={stats?.auditEntries} prefix="" decimals={0} gradient="stat-purple" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Transactions This Week</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={mockBarData}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="txns" fill="#0A1F44" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card flex flex-col items-center justify-center">
          <h3 className="text-sm font-semibold text-gray-800 mb-2 self-start">Account Types</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={accountTypes} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value">
                {accountTypes.map((d, i) => <Cell key={d.name} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 mt-2">
            {accountTypes.map((d, i) => (
              <span key={d.name} className="flex items-center gap-1 text-[10px] text-gray-500 capitalize">
                <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                {d.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Pending Approvals */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-800">Pending Approvals</h3>
            <Link to="/admin/transfers" className="text-xs text-accent-500 font-medium hover:text-accent-600">View all &rarr;</Link>
          </div>
          {pendingTransfers.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No pending transfers</p>
          ) : (
            <div className="space-y-3">
              {pendingTransfers.map(t => (
                <Link key={t.id} to="/admin/transfers" className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-primary-50/50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{t.beneficiary_name}</p>
                    <p className="text-xs text-gray-400">${Number(t.amount).toLocaleString()}</p>
                  </div>
                  <StatusBadge status={t.status} />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Activity Timeline */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-800">Recent Activity</h3>
            <Link to="/admin/audit" className="text-xs text-accent-500 font-medium hover:text-accent-600">View all &rarr;</Link>
          </div>
          <div className="space-y-0">
            {auditLogs.map((log, i) => (
              <div key={log.id} className="flex gap-3 py-2.5 border-b border-gray-50 last:border-0">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-primary-400 mt-1.5" />
                  {i < auditLogs.length - 1 && <div className="w-px flex-1 bg-gray-200 mt-1" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 truncate">{log.description}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-gray-400">{log.user_name}</span>
                    <span className="text-[10px] text-gray-300">&bull;</span>
                    <span className="text-[10px] text-gray-400">{timeAgo(log.timestamp)}</span>
                  </div>
                </div>
                <StatusBadge status={log.action} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {quickActions.map(({ to, icon: Icon, label, color }) => (
          <Link key={to} to={to} className="card-hover flex flex-col items-center py-5 gap-2 text-center">
            <Icon size={24} className={color} />
            <span className="text-sm font-medium text-gray-700">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
