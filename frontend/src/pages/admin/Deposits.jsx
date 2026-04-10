import { useState, useEffect } from 'react'
import { CircleDollarSign, CheckCircle, ArrowRight } from 'lucide-react'
import api from '../../api/client'
import toast from 'react-hot-toast'
import PageHeader from '../../components/PageHeader'
import LoadingButton from '../../components/LoadingButton'

export default function AdminDeposits() {
  const [accounts, setAccounts] = useState([])
  const [form, setForm] = useState({ account_id: '', amount: '', description: '' })
  const [result, setResult] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const loadAccounts = () => {
    api.get('/admin/accounts/').then(res => setAccounts((res.data.results || res.data).filter(a => !a.account_number.startsWith('PB-OPS'))))
  }

  useEffect(() => { loadAccounts() }, [])

  const handleDeposit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const { data } = await api.post('/admin/deposits/', {
        account_id: Number(form.account_id),
        amount: form.amount,
        description: form.description,
      })
      setResult(data)
      toast.success(`Deposited $${Number(form.amount).toLocaleString()} successfully`)
      setForm({ ...form, amount: '', description: '' })
      loadAccounts()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Deposit failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 page-enter">
      <PageHeader title="Deposits" subtitle="Post deposits to customer accounts" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card overflow-hidden">
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-4 -mx-6 -mt-6 mb-6">
            <div className="flex items-center gap-3 text-white">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <CircleDollarSign size={20} />
              </div>
              <div>
                <h3 className="font-bold">Make Deposit</h3>
                <p className="text-sm text-primary-100">Credit funds to an account</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleDeposit} className="space-y-4">
            <div>
              <label className="label">Account</label>
              <select className="input-field" value={form.account_id} onChange={e => setForm({ ...form, account_id: e.target.value })} required>
                <option value="">Select account...</option>
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.account_number} - {a.customer_name} (${Number(a.available_balance).toLocaleString()})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Amount</label>
              <input type="number" step="0.01" min="0.01" className="input-field" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required placeholder="0.00" />
            </div>
            <div>
              <label className="label">Description</label>
              <input className="input-field" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="e.g., Wire from external bank" />
            </div>
            <LoadingButton type="submit" loading={submitting} className="btn-primary w-full py-3">
              Post Deposit
            </LoadingButton>
          </form>
        </div>

        {result ? (
          <div className="card border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white animate-scale-in">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center animate-success">
                <CheckCircle size={24} className="text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-emerald-800">Deposit Posted</h3>
                <p className="text-xs text-emerald-600">Transaction completed successfully</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-emerald-100">
                <span className="text-sm text-gray-500">Transaction</span>
                <span className="text-sm font-mono font-medium">{result.transaction.reference}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-emerald-100">
                <span className="text-sm text-gray-500">Amount</span>
                <span className="text-sm font-bold text-emerald-700">${Number(result.transaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-emerald-100">
                <span className="text-sm text-gray-500">Account</span>
                <span className="text-sm font-mono">{result.account.account_number}</span>
              </div>
              <div className="bg-emerald-100/50 rounded-xl p-4 mt-4">
                <p className="text-xs text-emerald-600 mb-1">New Available Balance</p>
                <p className="text-2xl font-bold text-emerald-700">${Number(result.account.available_balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                <p className="text-xs text-gray-500 mt-1">Ledger: ${Number(result.account.ledger_balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>

            <button onClick={() => setResult(null)} className="btn-secondary w-full mt-4 flex items-center justify-center gap-2">
              New Deposit <ArrowRight size={14} />
            </button>
          </div>
        ) : (
          <div className="card flex flex-col items-center justify-center text-center py-12 border-dashed border-2 border-gray-200">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <CircleDollarSign size={28} className="text-gray-400" />
            </div>
            <h3 className="text-sm font-semibold text-gray-600 mb-1">Deposit Result</h3>
            <p className="text-xs text-gray-400">Post a deposit to see the confirmation here</p>
          </div>
        )}
      </div>
    </div>
  )
}
