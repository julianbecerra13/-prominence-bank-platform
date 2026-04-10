import { useState, useEffect } from 'react'
import { Lock, Unlock } from 'lucide-react'
import api from '../../api/client'
import toast from 'react-hot-toast'
import PageHeader from '../../components/PageHeader'
import DataTable from '../../components/DataTable'
import StatusBadge from '../../components/StatusBadge'
import Modal from '../../components/Modal'
import LoadingButton from '../../components/LoadingButton'
import ConfirmDialog from '../../components/ConfirmDialog'

const emptyForm = { account_id: '', amount: '', reason: '' }

export default function AdminHolds() {
  const [holds, setHolds] = useState([])
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [releaseConfirm, setReleaseConfirm] = useState(null)
  const [releaseLoading, setReleaseLoading] = useState(false)

  useEffect(() => { loadData() }, [])

  const loadData = () => {
    setLoading(true)
    Promise.all([
      api.get('/admin/holds/').then(res => setHolds(res.data.results || res.data)),
      api.get('/admin/accounts/').then(res => setAccounts((res.data.results || res.data).filter(a => !a.account_number.startsWith('PB-OPS')))),
    ]).finally(() => setLoading(false))
  }

  const placeHold = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post('/admin/hold-place/', { account_id: Number(form.account_id), amount: form.amount, reason: form.reason })
      toast.success('Hold placed')
      setShowModal(false)
      setForm(emptyForm)
      loadData()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to place hold')
    } finally {
      setSubmitting(false)
    }
  }

  const releaseHold = async () => {
    if (!releaseConfirm) return
    setReleaseLoading(true)
    try {
      await api.post(`/admin/hold-release/${releaseConfirm.id}/`)
      toast.success('Hold released')
      setReleaseConfirm(null)
      loadData()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to release hold')
    } finally {
      setReleaseLoading(false)
    }
  }

  const columns = [
    { key: 'account_number', label: 'Account', render: row => <span className="font-mono">{row.account_number}</span> },
    { key: 'amount', label: 'Amount', align: 'right', render: row => <span className="font-semibold">${Number(row.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span> },
    { key: 'reason', label: 'Reason' },
    { key: 'placed_by_name', label: 'Placed By' },
    { key: 'created_at', label: 'Date', render: row => <span className="text-gray-500">{new Date(row.created_at).toLocaleDateString()}</span> },
    { key: 'status', label: 'Status', render: row => <StatusBadge status={row.status} /> },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: row => row.status === 'active' ? (
        <button
          onClick={(e) => { e.stopPropagation(); setReleaseConfirm(row) }}
          className="flex items-center gap-1 text-xs bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-md hover:bg-emerald-200 transition-colors font-medium"
        >
          <Unlock size={12} /> Release
        </button>
      ) : null
    },
  ]

  return (
    <div className="space-y-6 page-enter">
      <PageHeader
        title="Holds Management"
        action={
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Lock size={16} /> Place Hold
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={holds}
        searchable
        searchPlaceholder="Search holds..."
        loading={loading}
        emptyTitle="No holds"
        emptyDescription="Active and released holds will appear here"
        emptyIcon={Lock}
      />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Place Hold" size="md">
        <form onSubmit={placeHold} className="space-y-4">
          <div>
            <label className="label">Account</label>
            <select className="input-field" value={form.account_id} onChange={e => setForm({ ...form, account_id: e.target.value })} required>
              <option value="">Select account...</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.account_number} - {a.customer_name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Amount</label>
            <input type="number" step="0.01" min="0.01" className="input-field" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
          </div>
          <div>
            <label className="label">Reason</label>
            <input className="input-field" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} required placeholder="Reason for hold..." />
          </div>
          <div className="flex gap-3 pt-2">
            <LoadingButton type="submit" loading={submitting}>Place Hold</LoadingButton>
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!releaseConfirm}
        onClose={() => setReleaseConfirm(null)}
        onConfirm={releaseHold}
        loading={releaseLoading}
        title="Release Hold"
        message={`Release hold of $${releaseConfirm ? Number(releaseConfirm.amount).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0'} on account ${releaseConfirm?.account_number}?`}
        confirmText="Release Hold"
      />
    </div>
  )
}
