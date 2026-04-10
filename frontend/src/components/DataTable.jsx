import { useState, useMemo } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { SkeletonTable } from './Skeleton'
import EmptyState from './EmptyState'

export default function DataTable({
  columns,
  data = [],
  searchable = false,
  searchPlaceholder = 'Search...',
  pageSize: defaultPageSize = 10,
  loading = false,
  onRowClick,
  emptyTitle = 'No data found',
  emptyDescription,
  emptyIcon,
}) {
  const [sortKey, setSortKey] = useState(null)
  const [sortDir, setSortDir] = useState('asc')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [pageSize] = useState(defaultPageSize)

  const filtered = useMemo(() => {
    let result = [...data]
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(row =>
        columns.some(col => {
          const val = typeof col.key === 'function' ? '' : String(row[col.key] || '')
          return val.toLowerCase().includes(q)
        })
      )
    }
    if (sortKey) {
      result.sort((a, b) => {
        const av = a[sortKey], bv = b[sortKey]
        if (av == null) return 1
        if (bv == null) return -1
        const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv))
        return sortDir === 'asc' ? cmp : -cmp
      })
    }
    return result
  }, [data, search, sortKey, sortDir, columns])

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize)

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  if (loading) return (
    <div className="card p-6">
      <SkeletonTable rows={5} cols={columns.length} />
    </div>
  )

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100/80 overflow-hidden transition-all duration-300 hover:shadow-md">
      {/* Search bar */}
      {searchable && (
        <div className="px-5 py-4 border-b border-gray-100/80">
          <div className="relative max-w-sm group">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-accent-500 transition-colors duration-200" />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0) }}
              placeholder={searchPlaceholder}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl
                focus:outline-none focus:ring-2 focus:ring-accent-400/20 focus:border-accent-400
                hover:border-gray-300 transition-all duration-200 bg-gray-50/50 focus:bg-white"
            />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-gray-50/80 to-gray-50/40 border-b border-gray-100">
              {columns.map(col => (
                <th
                  key={col.key || col.label}
                  className={`table-header ${col.align === 'right' ? 'text-right' : ''} ${col.sortable !== false && typeof col.key === 'string' ? 'cursor-pointer select-none group' : ''}`}
                  onClick={() => col.sortable !== false && typeof col.key === 'string' && handleSort(col.key)}
                >
                  <div className={`flex items-center gap-1.5 ${col.align === 'right' ? 'justify-end' : ''}`}>
                    {col.label}
                    {col.sortable !== false && typeof col.key === 'string' && (
                      <span className="text-gray-300 group-hover:text-accent-500 transition-colors duration-200">
                        {sortKey === col.key ? (sortDir === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />) : <ChevronsUpDown size={13} />}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paged.map((row, i) => (
              <tr
                key={row.id || i}
                className={`transition-all duration-200 ${onRowClick ? 'cursor-pointer' : ''}`}
                onClick={() => onRowClick?.(row)}
                style={{ animationDelay: `${i * 30}ms` }}
              >
                {columns.map(col => (
                  <td key={col.key || col.label} className={`table-cell ${col.align === 'right' ? 'text-right' : ''} ${col.className || ''}`}>
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty state */}
      {paged.length === 0 && !loading && (
        <EmptyState title={emptyTitle} description={emptyDescription} icon={emptyIcon} />
      )}

      {/* Pagination */}
      {filtered.length > pageSize && (
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100/80 bg-gray-50/30">
          <div className="text-xs text-gray-400">
            {page * pageSize + 1}–{Math.min((page + 1) * pageSize, filtered.length)} of {filtered.length}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 active:scale-90"
            >
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
              const pageNum = totalPages <= 5 ? i : Math.max(0, Math.min(page - 2, totalPages - 5)) + i
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-8 h-8 text-xs font-semibold rounded-lg transition-all duration-200 active:scale-90 ${
                    page === pageNum
                      ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20'
                      : 'border border-gray-200 hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  {pageNum + 1}
                </button>
              )
            })}
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 active:scale-90"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
