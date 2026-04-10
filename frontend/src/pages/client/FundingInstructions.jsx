import { useState, useEffect } from 'react'
import { Building2, Copy, Check } from 'lucide-react'
import api from '../../api/client'
import toast from 'react-hot-toast'
import PageHeader from '../../components/PageHeader'
import { SkeletonCard } from '../../components/Skeleton'

export default function ClientFundingInstructions() {
  const [accounts, setAccounts] = useState([])
  const [selectedAccount, setSelectedAccount] = useState(null)
  const [instructions, setInstructions] = useState([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(null)

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
      api.get(`/client/accounts/${selectedAccount}/funding-instructions/`)
        .then(res => setInstructions(res.data.results || res.data || []))
        .finally(() => setLoading(false))
    }
  }, [selectedAccount])

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text)
    setCopied(field)
    toast.success('Copied to clipboard')
    setTimeout(() => setCopied(null), 2000)
  }

  const CopyBtn = ({ value, field }) => (
    <button
      onClick={() => copyToClipboard(value, field)}
      className="ml-2 text-gray-300 hover:text-primary-500 transition-colors"
    >
      {copied === field ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
    </button>
  )

  return (
    <div className="space-y-6 page-enter">
      <PageHeader title="Funding Instructions" subtitle="Wire transfer details for receiving funds" />

      <div className="card p-4">
        <label className="label">Select Account</label>
        <select
          className="input-field max-w-md"
          value={selectedAccount || ''}
          onChange={e => setSelectedAccount(Number(e.target.value))}
        >
          {accounts.map(a => (
            <option key={a.id} value={a.id}>{a.account_number} - {a.account_name || a.account_type}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : instructions.length > 0 ? (
        instructions.map((inst, i) => (
          <div key={i} className="card border border-primary-100 bg-gradient-to-br from-primary-50/50 to-white overflow-hidden">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                <Building2 size={20} className="text-primary-500" />
              </div>
              <div>
                <h3 className="font-bold text-primary-500">Wire Transfer Instructions</h3>
                <p className="text-xs text-gray-400">Use these details to fund your account</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: 'Bank Name', value: inst.bank_name, field: `bank_${i}` },
                { label: 'SWIFT Code', value: inst.swift_code, field: `swift_${i}` },
                { label: 'Routing Number', value: inst.routing_number, field: `routing_${i}` },
                { label: 'Account Holder', value: inst.account_holder, field: `holder_${i}` },
              ].map(({ label, value, field }) => (
                <div key={field} className="bg-white rounded-lg border border-gray-100 p-3">
                  <p className="text-xs text-gray-400 mb-1">{label}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-800">{value}</p>
                    {value && <CopyBtn value={value} field={field} />}
                  </div>
                </div>
              ))}
            </div>

            {inst.instructions_html && (
              <div className="mt-5 p-4 bg-white rounded-lg border border-gray-100 text-sm prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: inst.instructions_html }} />
            )}
          </div>
        ))
      ) : (
        <div className="card">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <Building2 size={28} className="text-gray-400" />
            </div>
            <h3 className="text-sm font-semibold text-gray-600 mb-1">No funding instructions available</h3>
            <p className="text-xs text-gray-400">Instructions for this account will appear here once configured</p>
          </div>
        </div>
      )}
    </div>
  )
}
