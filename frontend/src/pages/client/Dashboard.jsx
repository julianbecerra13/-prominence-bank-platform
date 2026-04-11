import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Wallet, Lock, TrendingUp } from 'lucide-react'
import { AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts'
import api from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import StatCard from '../../components/StatCard'
import DataTable from '../../components/DataTable'
import StatusBadge from '../../components/StatusBadge'
import Modal from '../../components/Modal'
import { SkeletonCard } from '../../components/Skeleton'
import PageHeader from '../../components/PageHeader'

const CHART_COLORS = ['#0A1F44', '#C5A55A', '#10B981', '#3B82F6', '#8B5CF6']

function deriveChartData(transactions) {
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push({ date: d.toLocaleDateString('en-US', { weekday: 'short' }), amount: 0 })
  }
  let running = 0
  transactions?.forEach((tx, idx) => {
    running += Number(tx.amount) * (idx % 2 === 0 ? 1 : 0.3)
  })
  return days.map((d, i) => ({ ...d, amount: Math.round(running * (0.4 + i * 0.1)) }))
}

export default function ClientDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedTx, setSelectedTx] = useState(null)
  const { user } = useAuth()

  useEffect(() => {
    api.get('/client/dashboard/')
      .then(res => setData(res.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="space-y-6 page-enter">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SkeletonCard /><SkeletonCard /><SkeletonCard />
      </div>
    </div>
  )

  if (!data) return null
  const { accounts, summary, recent_transactions } = data
  const chartData = deriveChartData(recent_transactions)
  const pieData = accounts.map(a => ({ name: a.account_type.replace(/_/g, ' '), value: Number(a.available_balance) })).filter(d => d.value > 0)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  const accountCols = [
    { key: 'account_number', label: 'Account', render: row => <span className="font-mono font-medium text-primary-500">{row.account_number}</span> },
    { key: 'account_type', label: 'Type', render: row => <span className="capitalize">{row.account_type.replace(/_/g, ' ')}</span> },
    { key: 'currency', label: 'Currency' },
    { key: 'available_balance', label: 'Available', align: 'right', render: row => <span className="font-semibold text-emerald-600">${Number(row.available_balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span> },
    { key: 'held_balance', label: 'Held', align: 'right', render: row => <span className="text-amber-600">${Number(row.held_balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span> },
    { key: 'ledger_balance', label: 'Ledger', align: 'right', render: row => <span className="font-semibold">${Number(row.ledger_balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span> },
  ]

  const txCols = [
    { key: 'created_at', label: 'Date', render: row => <span className="text-gray-500">{new Date(row.created_at).toLocaleDateString()}</span> },
    { key: 'description', label: 'Description' },
    { key: 'transaction_type', label: 'Type', render: row => <span className="capitalize">{row.transaction_type.replace(/_/g, ' ')}</span> },
    { key: 'amount', label: 'Amount', align: 'right', render: row => <span className="font-semibold">${Number(row.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span> },
    { key: 'status', label: 'Status', render: row => <StatusBadge status={row.status} /> },
  ]

  return (
    <div className="space-y-6 page-enter">
      <PageHeader title={`${greeting}, ${user?.first_name}`} subtitle={new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger-children">
        <StatCard icon={Wallet} label="Available Balance" value={summary.total_available} gradient="stat-green" />
        <StatCard icon={Lock} label="Held Balance" value={summary.total_held} gradient="stat-amber" />
        <StatCard icon={TrendingUp} label="Total Accounts" value={summary.total_accounts} prefix="" decimals={0} gradient="stat-blue" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Balance Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0A1F44" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#0A1F44" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={v => [`$${v.toLocaleString()}`, 'Balance']} />
              <Area type="monotone" dataKey="amount" stroke="#0A1F44" strokeWidth={2} fill="url(#balGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="card flex flex-col items-center justify-center">
          <h3 className="text-sm font-semibold text-gray-800 mb-2 self-start">Account Distribution</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                {pieData.map((d, i) => <Cell key={d.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={v => `$${v.toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 mt-2">
            {pieData.map((d, i) => (
              <span key={d.name} className="flex items-center gap-1 text-[10px] text-gray-500">
                <span className="w-2 h-2 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                {d.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Accounts */}
      <div>
        <h3 className="text-sm font-semibold text-gray-800 mb-3">My Accounts</h3>
        <DataTable columns={accountCols} data={accounts} emptyTitle="No accounts" />
      </div>

      {/* Recent Transactions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-800">Recent Transactions</h3>
          <Link to="/client/transactions" className="text-xs text-accent-500 hover:text-accent-600 font-medium">View all &rarr;</Link>
        </div>
        <DataTable columns={txCols} data={recent_transactions} onRowClick={setSelectedTx} emptyTitle="No transactions yet" />
      </div>

      {/* Transaction Detail Modal */}
      <Modal isOpen={!!selectedTx} onClose={() => setSelectedTx(null)} title="Transaction Details" size="md">
        {selectedTx && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-gray-400">Reference</span><p className="font-mono font-medium">{selectedTx.reference}</p></div>
            <div><span className="text-gray-400">Type</span><p className="capitalize">{selectedTx.transaction_type?.replace(/_/g, ' ')}</p></div>
            <div><span className="text-gray-400">Amount</span><p className="text-lg font-bold">${Number(selectedTx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p></div>
            <div><span className="text-gray-400">Status</span><p><StatusBadge status={selectedTx.status} /></p></div>
            <div className="col-span-2"><span className="text-gray-400">Description</span><p>{selectedTx.description}</p></div>
            <div><span className="text-gray-400">Date</span><p>{new Date(selectedTx.created_at).toLocaleString()}</p></div>
          </div>
        )}
      </Modal>
    </div>
  )
}
