import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Eye, ArrowLeftRight } from 'lucide-react'
import api from '../../api/client'
import toast from 'react-hot-toast'
import PageHeader from '../../components/PageHeader'
import DataTable from '../../components/DataTable'
import StatusBadge from '../../components/StatusBadge'
import Modal from '../../components/Modal'
import ConfirmDialog from '../../components/ConfirmDialog'

export default function AdminTransfers() {
  const [transfers, setTransfers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [selectedTransfer, setSelectedTransfer] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => { loadData() }, [filter])

  const loadData = () => {
    setLoading(true)
    const url = filter ? `/admin/transfers/?status=${filter}` : '/admin/transfers/'
    api.get(url)
      .then(res => setTransfers(res.data.results || res.data))
      .finally(() => setLoading(false))
  }

  const handleAction = async (id, action) => {
    setActionLoading(true)
    try {
      const payload = action === 'reject' ? { reason: 'Rejected by admin' } : {}
      await api.post(`/admin/transfers/${id}/${action}/`, payload)
      toast.success(`Transfer ${action}ed`)
      setConfirmAction(null)
      setSelectedTransfer(null)
      loadData()
    } catch (err) {
      toast.error(err.response?.data?.error || `Failed to ${action}`)
    } finally {
      setActionLoading(false)
    }
  }

  const columns = [
    { key: 'created_at', label: 'Date', render: row => <span className="text-gray-500">{new Date(row.created_at).toLocaleDateString()}</span> },
    { key: 'submitted_by_name', label: 'Customer' },
    { key: 'source_account_number', label: 'From Account', render: row => <span className="font-mono text-sm">{row.source_account_number}</span> },
    { key: 'beneficiary_name', label: 'Beneficiary' },
    { key: 'amount', label: 'Amount', align: 'right', render: row => <span className="font-semibold">${Number(row.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span> },
    { key: 'status', label: 'Status', render: row => <StatusBadge status={row.status} /> },
    { key: 'reviewed_by_name', label: 'Reviewer', render: row => row.reviewed_by_name || '-' },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: row => (
        <div className="flex gap-1">
          {row.status === 'pending_review' && (
            <button
              onClick={(e) => { e.stopPropagation(); handleAction(row.id, 'review') }}
              className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-md hover:bg-blue-200 transition-colors font-medium"
            >
              <Eye size={12} /> Review
            </button>
          )}
          {row.status === 'under_review' && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setConfirmAction({ id: row.id, action: 'approve', amount: row.amount, beneficiary: row.beneficiary_name }) }}
                className="flex items-center gap-1 text-xs bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-md hover:bg-emerald-200 transition-colors font-medium"
              >
                <CheckCircle size={12} /> Approve
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setConfirmAction({ id: row.id, action: 'reject', amount: row.amount, beneficiary: row.beneficiary_name }) }}
                className="flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2.5 py-1 rounded-md hover:bg-red-200 transition-colors font-medium"
              >
                <XCircle size={12} /> Reject
              </button>
            </>
          )}
        </div>
      )
    },
  ]

  return (
    <div className="space-y-6 page-enter">
      <PageHeader title="Transfer Approvals" />

      <div className="flex items-center gap-3">
        <select className="input-field max-w-xs" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">All Transfers</option>
          <option value="pending_review">Pending Review</option>
          <option value="under_review">Under Review</option>
          <option value="completed">Completed</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={transfers}
        searchable
        searchPlaceholder="Search transfers..."
        loading={loading}
        onRowClick={setSelectedTransfer}
        emptyTitle="No transfers found"
        emptyIcon={ArrowLeftRight}
      />

      <Modal isOpen={!!selectedTransfer} onClose={() => setSelectedTransfer(null)} title="Transfer Details" size="md">
        {selectedTransfer && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Customer</p>
                <p className="text-sm font-medium">{selectedTransfer.submitted_by_name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Status</p>
                <StatusBadge status={selectedTransfer.status} />
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">From Account</p>
                <p className="text-sm font-mono">{selectedTransfer.source_account_number}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Beneficiary</p>
                <p className="text-sm">{selectedTransfer.beneficiary_name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Amount</p>
                <p className="text-lg font-bold text-primary-500">${Number(selectedTransfer.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Date</p>
                <p className="text-sm">{new Date(selectedTransfer.created_at).toLocaleString()}</p>
              </div>
              {selectedTransfer.purpose && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-400 mb-0.5">Purpose</p>
                  <p className="text-sm">{selectedTransfer.purpose}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Reviewer</p>
                <p className="text-sm">{selectedTransfer.reviewed_by_name || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Approver</p>
                <p className="text-sm">{selectedTransfer.approved_by_name || '-'}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => confirmAction && handleAction(confirmAction.id, confirmAction.action)}
        loading={actionLoading}
        title={`${confirmAction?.action === 'approve' ? 'Approve' : 'Reject'} Transfer`}
        message={`${confirmAction?.action === 'approve' ? 'Approve' : 'Reject'} wire transfer of $${confirmAction ? Number(confirmAction.amount).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0'} to ${confirmAction?.beneficiary}?`}
        confirmText={confirmAction?.action === 'approve' ? 'Approve Transfer' : 'Reject Transfer'}
        danger={confirmAction?.action === 'reject'}
      />
    </div>
  )
}
