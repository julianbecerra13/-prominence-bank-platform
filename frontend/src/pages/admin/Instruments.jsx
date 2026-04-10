import { useState, useEffect } from 'react'
import { Plus, Shield } from 'lucide-react'
import api from '../../api/client'
import toast from 'react-hot-toast'
import PageHeader from '../../components/PageHeader'
import DataTable from '../../components/DataTable'
import StatusBadge from '../../components/StatusBadge'
import Modal from '../../components/Modal'
import LoadingButton from '../../components/LoadingButton'

const emptyForm = { instrument_type_id: '', customer_id: '', face_value: '', currency: 'USD', issue_date: '', maturity_date: '', receiving_bank: '', bank_swift_code: '', beneficiary_name: '' }

export default function AdminInstruments() {
  const [instruments, setInstruments] = useState([])
  const [types, setTypes] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState(emptyForm)

  useEffect(() => { loadData() }, [])

  const loadData = () => {
    setLoading(true)
    Promise.all([
      api.get('/admin/instruments/').then(res => setInstruments(res.data.results || res.data)),
      api.get('/admin/instrument-types/').then(res => setTypes(res.data.results || res.data)),
      api.get('/admin/customers/').then(res => setCustomers(res.data.results || res.data)),
    ]).finally(() => setLoading(false))
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post('/admin/instruments/', {
        ...form,
        instrument_type_id: Number(form.instrument_type_id),
        customer_id: Number(form.customer_id),
      })
      toast.success('Instrument issued')
      setShowModal(false)
      setForm(emptyForm)
      loadData()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to issue instrument')
    } finally {
      setSubmitting(false)
    }
  }

  const columns = [
    { key: 'reference_number', label: 'Reference', render: row => <span className="font-mono font-medium">{row.reference_number}</span> },
    { key: 'instrument_type_name', label: 'Type', render: row => `${row.instrument_type_code} - ${row.instrument_type_name}` },
    { key: 'customer_name', label: 'Customer' },
    { key: 'face_value', label: 'Face Value', align: 'right', render: row => <span className="font-semibold">${Number(row.face_value).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span> },
    { key: 'issue_date', label: 'Issue Date' },
    { key: 'maturity_date', label: 'Maturity' },
    { key: 'status', label: 'Status', render: row => <StatusBadge status={row.status} /> },
  ]

  return (
    <div className="space-y-6 page-enter">
      <PageHeader
        title="Bank Instruments"
        action={
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Issue Instrument
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={instruments}
        searchable
        searchPlaceholder="Search instruments..."
        loading={loading}
        emptyTitle="No instruments issued"
        emptyIcon={Shield}
      />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Issue New Instrument" size="lg">
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Instrument Type</label>
            <select className="input-field" value={form.instrument_type_id} onChange={e => setForm({ ...form, instrument_type_id: e.target.value })} required>
              <option value="">Select type...</option>
              {types.map(t => <option key={t.id} value={t.id}>{t.code} - {t.name} (Fee: ${t.fee_amount})</option>)}
            </select>
          </div>
          <div>
            <label className="label">Customer</label>
            <select className="input-field" value={form.customer_id} onChange={e => setForm({ ...form, customer_id: e.target.value })} required>
              <option value="">Select customer...</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.customer_number} - {c.user?.first_name} {c.user?.last_name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Face Value</label>
            <input type="number" step="0.01" className="input-field" value={form.face_value} onChange={e => setForm({ ...form, face_value: e.target.value })} required />
          </div>
          <div>
            <label className="label">Currency</label>
            <select className="input-field" value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })}>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
          <div>
            <label className="label">Issue Date</label>
            <input type="date" className="input-field" value={form.issue_date} onChange={e => setForm({ ...form, issue_date: e.target.value })} />
          </div>
          <div>
            <label className="label">Maturity Date</label>
            <input type="date" className="input-field" value={form.maturity_date} onChange={e => setForm({ ...form, maturity_date: e.target.value })} />
          </div>
          <div>
            <label className="label">Receiving Bank</label>
            <input className="input-field" value={form.receiving_bank} onChange={e => setForm({ ...form, receiving_bank: e.target.value })} />
          </div>
          <div>
            <label className="label">Bank SWIFT Code</label>
            <input className="input-field" value={form.bank_swift_code} onChange={e => setForm({ ...form, bank_swift_code: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <label className="label">Beneficiary Name</label>
            <input className="input-field" value={form.beneficiary_name} onChange={e => setForm({ ...form, beneficiary_name: e.target.value })} />
          </div>
          <div className="md:col-span-2 flex gap-3 pt-2">
            <LoadingButton type="submit" loading={submitting}>Issue Instrument</LoadingButton>
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
