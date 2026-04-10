import { useState, useEffect } from 'react'
import { Send } from 'lucide-react'
import api from '../../api/client'
import toast from 'react-hot-toast'
import PageHeader from '../../components/PageHeader'
import DataTable from '../../components/DataTable'
import StatusBadge from '../../components/StatusBadge'
import Modal from '../../components/Modal'
import LoadingButton from '../../components/LoadingButton'

const emptyForm = { source_account_id: '', beneficiary_id: '', amount: '', purpose: '', reference: '' }

export default function ClientWireRequest() {
  const [accounts, setAccounts] = useState([])
  const [beneficiaries, setBeneficiaries] = useState([])
  const [transfers, setTransfers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    Promise.all([
      api.get('/client/accounts/').then(res => setAccounts(res.data.results || res.data)),
      api.get('/client/beneficiaries/').then(res => setBeneficiaries(res.data.results || res.data)),
      api.get('/client/transfers/').then(res => setTransfers(res.data.results || res.data)),
    ]).finally(() => setLoading(false))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post('/client/transfers/', {
        ...form,
        source_account_id: Number(form.source_account_id),
        beneficiary_id: Number(form.beneficiary_id),
      })
      toast.success('Wire transfer request submitted for review')
      setShowModal(false)
      setForm(emptyForm)
      api.get('/client/transfers/').then(res => setTransfers(res.data.results || res.data))
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit request')
    } finally {
      setSubmitting(false)
    }
  }

  const columns = [
    { key: 'created_at', label: 'Date', render: row => <span className="text-gray-500">{new Date(row.created_at).toLocaleDateString()}</span> },
    { key: 'source_account_number', label: 'From', render: row => <span className="font-mono text-sm">{row.source_account_number}</span> },
    { key: 'beneficiary_name', label: 'Beneficiary' },
    { key: 'amount', label: 'Amount', align: 'right', render: row => <span className="font-semibold">${Number(row.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span> },
    { key: 'status', label: 'Status', render: row => <StatusBadge status={row.status} /> },
  ]

  return (
    <div className="space-y-6 page-enter">
      <PageHeader
        title="Wire Transfer"
        action={
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Send size={16} /> New Transfer
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={transfers}
        searchable
        searchPlaceholder="Search transfers..."
        loading={loading}
        emptyTitle="No transfer requests"
        emptyDescription="Submit a wire transfer request to get started"
        emptyIcon={Send}
      />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Wire Transfer" size="lg">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Source Account</label>
            <select className="input-field" value={form.source_account_id} onChange={e => setForm({ ...form, source_account_id: e.target.value })} required>
              <option value="">Select account...</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.account_number} (${Number(a.available_balance).toLocaleString()})</option>)}
            </select>
          </div>
          <div>
            <label className="label">Beneficiary</label>
            <select className="input-field" value={form.beneficiary_id} onChange={e => setForm({ ...form, beneficiary_id: e.target.value })} required>
              <option value="">Select beneficiary...</option>
              {beneficiaries.map(b => <option key={b.id} value={b.id}>{b.nickname} - {b.beneficiary_name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Amount (USD)</label>
            <input type="number" step="0.01" min="0.01" className="input-field" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
          </div>
          <div>
            <label className="label">Reference</label>
            <input className="input-field" value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })} placeholder="e.g., INV-2026-001" />
          </div>
          <div className="md:col-span-2">
            <label className="label">Purpose</label>
            <textarea className="input-field" rows={2} value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })} placeholder="Purpose of transfer..." />
          </div>
          <div className="md:col-span-2 flex gap-3 pt-2">
            <LoadingButton type="submit" loading={submitting}>Submit Wire Transfer</LoadingButton>
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
