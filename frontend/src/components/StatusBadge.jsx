const statusMap = {
  active: 'status-active',
  approved: 'status-active',
  posted: 'status-active',
  issued: 'status-active',
  released: 'status-active',
  completed: 'status-completed',
  pending: 'status-pending',
  pending_review: 'status-pending',
  under_review: 'status-under_review',
  draft: 'status-draft',
  rejected: 'status-rejected',
  failed: 'status-rejected',
  cancelled: 'status-rejected',
  frozen: 'status-frozen',
  closed: 'status-frozen',
  expired: 'status-frozen',
  low: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10',
  medium: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/10',
  high: 'bg-red-50 text-red-700 ring-1 ring-red-600/10',
}

export default function StatusBadge({ status }) {
  const cls = statusMap[status] || 'status-draft'
  const label = (status || '').replace(/_/g, ' ')
  return <span className={`status-badge ${cls}`}>{label}</span>
}
