import { useState, useEffect } from 'react'
import { Plus, Users } from 'lucide-react'
import api from '../../api/client'
import toast from 'react-hot-toast'
import PageHeader from '../../components/PageHeader'
import DataTable from '../../components/DataTable'
import StatusBadge from '../../components/StatusBadge'
import Modal from '../../components/Modal'
import LoadingButton from '../../components/LoadingButton'
import ConfirmDialog from '../../components/ConfirmDialog'

const emptyForm = { email: '', first_name: '', last_name: '', password: '', customer_type: 'personal', phone: '', country: '' }

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [kycConfirm, setKycConfirm] = useState(null)
  const [kycLoading, setKycLoading] = useState(false)

  useEffect(() => { loadData() }, [])

  const loadData = () => {
    setLoading(true)
    api.get('/admin/customers/')
      .then(res => setCustomers(res.data.results || res.data))
      .finally(() => setLoading(false))
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post('/admin/customers/', form)
      toast.success('Customer created')
      setShowModal(false)
      setForm(emptyForm)
      loadData()
    } catch (err) {
      toast.error(err.response?.data?.email?.[0] || err.response?.data?.detail || 'Failed to create customer')
    } finally {
      setSubmitting(false)
    }
  }

  const handleKyc = async () => {
    if (!kycConfirm) return
    setKycLoading(true)
    try {
      await api.post(`/admin/customers/${kycConfirm.id}/${kycConfirm.action}_kyc/`, { notes: `${kycConfirm.action} via admin panel` })
      toast.success(`KYC ${kycConfirm.action}d`)
      setKycConfirm(null)
      loadData()
    } catch {
      toast.error('Failed to update KYC')
    } finally {
      setKycLoading(false)
    }
  }

  const columns = [
    { key: 'customer_number', label: 'Customer #', render: row => <span className="font-mono font-medium">{row.customer_number}</span> },
    { key: 'name', label: 'Name', render: row => `${row.user?.first_name || ''} ${row.user?.last_name || ''}`.trim() },
    { key: 'email', label: 'Email', render: row => <span className="text-gray-500">{row.user?.email}</span> },
    { key: 'customer_type', label: 'Type', render: row => <span className="capitalize">{row.customer_type}</span> },
    { key: 'kyc_status', label: 'KYC Status', render: row => <StatusBadge status={row.kyc_status} /> },
    { key: 'risk_rating', label: 'Risk', render: row => <StatusBadge status={row.risk_rating} /> },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: row => row.kyc_status !== 'approved' ? (
        <div className="flex gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); setKycConfirm({ id: row.id, action: 'approve', name: `${row.user?.first_name} ${row.user?.last_name}` }) }}
            className="text-xs bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-md hover:bg-emerald-200 transition-colors font-medium"
          >
            Approve
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setKycConfirm({ id: row.id, action: 'reject', name: `${row.user?.first_name} ${row.user?.last_name}` }) }}
            className="text-xs bg-red-100 text-red-700 px-2.5 py-1 rounded-md hover:bg-red-200 transition-colors font-medium"
          >
            Reject
          </button>
        </div>
      ) : null
    },
  ]

  return (
    <div className="space-y-6 page-enter">
      <PageHeader
        title="Customers"
        action={
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> New Customer
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={customers}
        searchable
        searchPlaceholder="Search customers..."
        loading={loading}
        emptyTitle="No customers found"
        emptyIcon={Users}
      />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Customer" size="lg">
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Email</label>
            <input type="email" className="input-field" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div>
            <label className="label">Password</label>
            <input type="password" className="input-field" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={10} />
          </div>
          <div>
            <label className="label">First Name</label>
            <input className="input-field" value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} required />
          </div>
          <div>
            <label className="label">Last Name</label>
            <input className="input-field" value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} required />
          </div>
          <div>
            <label className="label">Type</label>
            <select className="input-field" value={form.customer_type} onChange={e => setForm({ ...form, customer_type: e.target.value })}>
              <option value="personal">Personal</option>
              <option value="business">Business</option>
            </select>
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input-field" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="md:col-span-2 flex gap-3 pt-2">
            <LoadingButton type="submit" loading={submitting}>Create Customer</LoadingButton>
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!kycConfirm}
        onClose={() => setKycConfirm(null)}
        onConfirm={handleKyc}
        loading={kycLoading}
        title={`${kycConfirm?.action === 'approve' ? 'Approve' : 'Reject'} KYC`}
        message={`Are you sure you want to ${kycConfirm?.action} KYC for ${kycConfirm?.name}?`}
        confirmText={kycConfirm?.action === 'approve' ? 'Approve KYC' : 'Reject KYC'}
        danger={kycConfirm?.action === 'reject'}
      />
    </div>
  )
}
