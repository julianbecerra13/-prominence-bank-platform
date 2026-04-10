import { useState, useEffect } from 'react'
import api from '../../api/client'
import PageHeader from '../../components/PageHeader'
import DataTable from '../../components/DataTable'
import StatusBadge from '../../components/StatusBadge'
import Modal from '../../components/Modal'

export default function ClientTransactions() {
  const [accounts, setAccounts] = useState([])
  const [selectedAccount, setSelectedAccount] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTx, setSelectedTx] = useState(null)

  useEffect(() => {
    api.get('/client/accounts/').then(res => {
      const accts = res.data.results || res.data
      setAccounts(accts)
      if (accts.length > 0) setSelectedAccount(accts[0].id)
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (selectedAccount) {
      setLoading(true)
      api.get(`/client/accounts/${selectedAccount}/transactions/`)
        .then(res => setTransactions(res.data.results || res.data))
        .finally(() => setLoading(false))
    }
  }, [selectedAccount])

  const columns = [
    { key: 'created_at', label: 'Date', render: row => <span className="text-gray-500">{new Date(row.created_at).toLocaleString()}</span> },
    { key: 'reference', label: 'Reference', render: row => <span className="font-mono text-xs">{row.reference?.slice(0, 12)}...</span> },
    { key: 'description', label: 'Description' },
    { key: 'transaction_type', label: 'Type', render: row => <span className="capitalize">{row.transaction_type?.replace(/_/g, ' ')}</span> },
    { key: 'amount', label: 'Amount', align: 'right', render: row => <span className="font-semibold">${Number(row.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span> },
    { key: 'status', label: 'Status', render: row => <StatusBadge status={row.status} /> },
  ]

  return (
    <div className="space-y-6 page-enter">
      <PageHeader title="Transaction History" />

      <div className="card p-4">
        <label className="label">Select Account</label>
        <select
          value={selectedAccount || ''}
          onChange={e => setSelectedAccount(Number(e.target.value))}
          className="input-field max-w-md"
        >
          {accounts.map(a => (
            <option key={a.id} value={a.id}>{a.account_number} - {a.account_name || a.account_type}</option>
          ))}
        </select>
      </div>

      <DataTable
        columns={columns}
        data={transactions}
        searchable
        searchPlaceholder="Search transactions..."
        loading={loading}
        onRowClick={setSelectedTx}
        emptyTitle="No transactions found"
        emptyDescription="Transactions for this account will appear here"
      />

      <Modal isOpen={!!selectedTx} onClose={() => setSelectedTx(null)} title="Transaction Details" size="md">
        {selectedTx && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Reference</p>
                <p className="text-sm font-mono font-medium">{selectedTx.reference}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Status</p>
                <StatusBadge status={selectedTx.status} />
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Type</p>
                <p className="text-sm capitalize">{selectedTx.transaction_type?.replace(/_/g, ' ')}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Amount</p>
                <p className="text-lg font-bold text-primary-500">${Number(selectedTx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-400 mb-0.5">Description</p>
                <p className="text-sm">{selectedTx.description || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Date</p>
                <p className="text-sm">{new Date(selectedTx.created_at).toLocaleString()}</p>
              </div>
              {selectedTx.balance_after != null && (
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Balance After</p>
                  <p className="text-sm font-medium">${Number(selectedTx.balance_after).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
