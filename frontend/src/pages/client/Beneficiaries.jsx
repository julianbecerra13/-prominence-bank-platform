import { useState, useEffect } from 'react'
import { Plus, Users } from 'lucide-react'
import api from '../../api/client'
import toast from 'react-hot-toast'
import PageHeader from '../../components/PageHeader'
import DataTable from '../../components/DataTable'
import StatusBadge from '../../components/StatusBadge'
import Modal from '../../components/Modal'
import LoadingButton from '../../components/LoadingButton'

const emptyForm = { nickname: '', bank_name: '', beneficiary_name: '', account_number: '', routing_number: '', swift_code: '' }

export default function ClientBeneficiaries() {
  const [beneficiaries, setBeneficiaries] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState(emptyForm)

  useEffect(() => { loadData() }, [])

  const loadData = () => {
    setLoading(true)
    api.get('/client/beneficiaries/')
      .then(res => setBeneficiaries(res.data.results || res.data))
      .finally(() => setLoading(false))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post('/client/beneficiaries/', form)
      toast.success('Beneficiary added')
      setShowModal(false)
      setForm(emptyForm)
      loadData()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to add beneficiary')
    } finally {
      setSubmitting(false)
    }
  }

  const columns = [
    { key: 'nickname', label: 'Nickname', render: row => <span className="font-medium">{row.nickname}</span> },
    { key: 'beneficiary_name', label: 'Beneficiary Name' },
    { key: 'bank_name', label: 'Bank' },
    { key: 'account_number', label: 'Account', render: row => <span className="font-mono text-sm">{row.account_number}</span> },
    { key: 'swift_code', label: 'SWIFT', render: row => row.swift_code || '-' },
    { key: 'status', label: 'Status', render: row => <StatusBadge status={row.status} /> },
  ]

  return (
    <div className="space-y-6 page-enter">
      <PageHeader
        title="Beneficiaries"
        action={
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Add Beneficiary
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={beneficiaries}
        searchable
        searchPlaceholder="Search beneficiaries..."
        loading={loading}
        emptyTitle="No beneficiaries added yet"
        emptyDescription="Add a beneficiary to start sending wire transfers"
        emptyIcon={Users}
      />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Beneficiary" size="lg">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Nickname</label>
            <input className="input-field" value={form.nickname} onChange={e => setForm({ ...form, nickname: e.target.value })} required />
          </div>
          <div>
            <label className="label">Beneficiary Name</label>
            <input className="input-field" value={form.beneficiary_name} onChange={e => setForm({ ...form, beneficiary_name: e.target.value })} required />
          </div>
          <div>
            <label className="label">Bank Name</label>
            <input className="input-field" value={form.bank_name} onChange={e => setForm({ ...form, bank_name: e.target.value })} required />
          </div>
          <div>
            <label className="label">Account Number</label>
            <input className="input-field" value={form.account_number} onChange={e => setForm({ ...form, account_number: e.target.value })} required />
          </div>
          <div>
            <label className="label">Routing Number</label>
            <input className="input-field" value={form.routing_number} onChange={e => setForm({ ...form, routing_number: e.target.value })} />
          </div>
          <div>
            <label className="label">SWIFT Code</label>
            <input className="input-field" value={form.swift_code} onChange={e => setForm({ ...form, swift_code: e.target.value })} />
          </div>
          <div className="md:col-span-2 flex gap-3 pt-2">
            <LoadingButton type="submit" loading={submitting}>Save Beneficiary</LoadingButton>
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
