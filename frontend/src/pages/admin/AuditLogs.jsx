import { useState, useEffect } from 'react'
import { ScrollText, Filter } from 'lucide-react'
import api from '../../api/client'
import PageHeader from '../../components/PageHeader'
import DataTable from '../../components/DataTable'
import StatusBadge from '../../components/StatusBadge'

const actionFilters = [
  { value: '', label: 'All Actions' },
  { value: 'create', label: 'Create' },
  { value: 'update', label: 'Update' },
  { value: 'deposit', label: 'Deposit' },
  { value: 'transfer', label: 'Transfer' },
  { value: 'hold_placed', label: 'Hold Placed' },
  { value: 'hold_released', label: 'Hold Released' },
  { value: 'instrument_issued', label: 'Instrument Issued' },
  { value: 'kyc_approved', label: 'KYC Approved' },
  { value: 'login', label: 'Login' },
]

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    setLoading(true)
    const url = filter ? `/admin/audit-logs/?action=${filter}` : '/admin/audit-logs/'
    api.get(url)
      .then(res => setLogs(res.data.results || res.data))
      .finally(() => setLoading(false))
  }, [filter])

  const columns = [
    { key: 'timestamp', label: 'Timestamp', render: row => <span className="text-gray-500 text-xs">{new Date(row.timestamp).toLocaleString()}</span> },
    { key: 'user_name', label: 'User' },
    { key: 'action', label: 'Action', render: row => <StatusBadge status={row.action} /> },
    { key: 'resource_type', label: 'Resource', render: row => <span className="font-mono text-xs">{row.resource_type} #{row.resource_id}</span> },
    { key: 'description', label: 'Description', render: row => <span className="text-sm">{row.description}</span> },
    { key: 'ip_address', label: 'IP', render: row => <span className="text-xs text-gray-400">{row.ip_address}</span> },
  ]

  return (
    <div className="space-y-6 page-enter">
      <PageHeader title="Audit Logs" subtitle="System activity and security events" />

      <div className="flex flex-wrap items-center gap-2">
        <Filter size={16} className="text-gray-400" />
        {actionFilters.map(af => (
          <button
            key={af.value}
            onClick={() => setFilter(af.value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filter === af.value
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {af.label}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={logs}
        searchable
        searchPlaceholder="Search logs..."
        loading={loading}
        pageSize={15}
        emptyTitle="No audit logs found"
        emptyDescription="Logs matching the selected filter will appear here"
        emptyIcon={ScrollText}
      />
    </div>
  )
}
