import { useState, useEffect } from 'react'
import { Plus, Wallet } from 'lucide-react'
import api from '../../api/client'
import toast from 'react-hot-toast'
import PageHeader from '../../components/PageHeader'
import DataTable from '../../components/DataTable'
import StatusBadge from '../../components/StatusBadge'
import Modal from '../../components/Modal'
import LoadingButton from '../../components/LoadingButton'

const emptyForm = { customer_id: '', account_type: 'personal_checking', currency: 'USD', account_name: '' }

export default function AdminAccounts() {
  const [accounts, setAccounts] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState(emptyForm)

  useEffect(() => { loadData() }, [])

  const loadData = () => {
    setLoading(true)
    Promise.all([
      api.get('/admin/accounts/').then(res => setAccounts((res.data.results || res.data).filter(a => !a.account_number.startsWith('PB-OPS')))),
      api.get('/admin/customers/').then(res => setCustomers(res.data.results || res.data)),
    ]).finally(() => setLoading(false))
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post('/admin/accounts/', { ...form, customer_id: Number(form.customer_id) })
      toast.success('Account created')
      setShowModal(false)
      setForm(emptyForm)
      loadData()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create account')
    } finally {
      setSubmitting(false)
    }
  }

  const columns = [
    { key: 'account_number', label: 'Account #', render: row => <span className="font-mono font-medium">{row.account_number}</span> },
    { key: 'customer_name', label: 'Customer' },
    { key: 'account_type', label: 'Type', render: row => <span className="capitalize">{row.account_type.replace(/_/g, ' ')}</span> },
    { key: 'currency', label: 'Currency' },
    { key: 'available_balance', label: 'Available', align: 'right', render: row => <span className="text-emerald-700 font-medium">${Number(row.available_balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span> },
    { key: 'held_balance', label: 'Held', align: 'right', render: row => <span className="text-amber-700">${Number(row.held_balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span> },
    { key: 'ledger_balance', label: 'Ledger', align: 'right', render: row => <span className="font-medium">${Number(row.ledger_balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span> },
    { key: 'status', label: 'Status', render: row => <StatusBadge status={row.status} /> },
  ]

  return (
    <div className="space-y-6 page-enter">
      <PageHeader
        title="Accounts"
        action={
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Open Account
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={accounts}
        searchable
        searchPlaceholder="Search accounts..."
        loading={loading}
        emptyTitle="No accounts found"
        emptyIcon={Wallet}
      />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Open New Account" size="lg">
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Customer</label>
            <select className="input-field" value={form.customer_id} onChange={e => setForm({ ...form, customer_id: e.target.value })} required>
              <option value="">Select customer...</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.customer_number} - {c.user?.first_name || ''} {c.user?.last_name || ''}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Account Type</label>
            <select className="input-field" value={form.account_type} onChange={e => setForm({ ...form, account_type: e.target.value })}>
              <option value="personal_checking">Personal Checking</option>
              <option value="business_checking">Business Checking</option>
              <option value="savings">Savings</option>
              <option value="crypto">Cryptocurrency</option>
              <option value="custody">Custody / Safekeeping</option>
            </select>
          </div>
          <div>
            <label className="label">Currency</label>
            <select className="input-field" value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })}>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="BTC">BTC</option>
              <option value="ETH">ETH</option>
            </select>
          </div>
          <div>
            <label className="label">Account Name</label>
            <input className="input-field" value={form.account_name} onChange={e => setForm({ ...form, account_name: e.target.value })} placeholder="Optional label" />
          </div>
          <div className="md:col-span-2 flex gap-3 pt-2">
            <LoadingButton type="submit" loading={submitting}>Open Account</LoadingButton>
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
