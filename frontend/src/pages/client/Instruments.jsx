import { useState, useEffect } from 'react'
import { Shield } from 'lucide-react'
import api from '../../api/client'
import PageHeader from '../../components/PageHeader'
import DataTable from '../../components/DataTable'
import StatusBadge from '../../components/StatusBadge'

export default function ClientInstruments() {
  const [instruments, setInstruments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/client/instruments/')
      .then(res => setInstruments(res.data.results || res.data))
      .finally(() => setLoading(false))
  }, [])

  const columns = [
    { key: 'reference_number', label: 'Reference', render: row => <span className="font-mono font-medium">{row.reference_number}</span> },
    { key: 'instrument_type_name', label: 'Type' },
    { key: 'face_value', label: 'Face Value', align: 'right', render: row => <span className="font-semibold">${Number(row.face_value).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span> },
    { key: 'issue_date', label: 'Issue Date' },
    { key: 'maturity_date', label: 'Maturity Date' },
    { key: 'status', label: 'Status', render: row => <StatusBadge status={row.status} /> },
  ]

  return (
    <div className="space-y-6 page-enter">
      <PageHeader title="Bank Instruments" subtitle="View your issued bank instruments" />

      <DataTable
        columns={columns}
        data={instruments}
        searchable
        searchPlaceholder="Search instruments..."
        loading={loading}
        emptyTitle="No instruments issued"
        emptyDescription="Your bank instruments will appear here"
        emptyIcon={Shield}
      />
    </div>
  )
}
