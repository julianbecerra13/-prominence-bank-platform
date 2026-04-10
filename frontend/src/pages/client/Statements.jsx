import { useState, useEffect } from 'react'
import { FileText, Download, Calendar } from 'lucide-react'
import api from '../../api/client'
import toast from 'react-hot-toast'
import PageHeader from '../../components/PageHeader'
import LoadingButton from '../../components/LoadingButton'

export default function ClientStatements() {
  const [accounts, setAccounts] = useState([])
  const [selectedAccount, setSelectedAccount] = useState('')
  const [downloading, setDownloading] = useState(false)
  const [startDate, setStartDate] = useState(() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 1)
    return d.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0])

  useEffect(() => {
    api.get('/client/accounts/').then(res => {
      const accts = res.data.results || res.data
      setAccounts(accts)
      if (accts.length > 0) setSelectedAccount(accts[0].id)
    })
  }, [])

  const downloadStatement = async () => {
    setDownloading(true)
    try {
      const response = await api.get(
        `/client/accounts/${selectedAccount}/statement/?start_date=${startDate}&end_date=${endDate}`,
        { responseType: 'blob' }
      )
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `statement_${startDate}_${endDate}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success('Statement downloaded')
    } catch {
      toast.error('Failed to generate statement')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="space-y-6 page-enter">
      <PageHeader title="Account Statements" subtitle="Generate and download PDF statements" />

      <div className="card overflow-hidden">
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-4 -mx-6 -mt-6 mb-6">
          <div className="flex items-center gap-3 text-white">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="font-bold">Generate Statement</h3>
              <p className="text-sm text-primary-100">Select account and date range</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="label">Account</label>
            <select className="input-field" value={selectedAccount} onChange={e => setSelectedAccount(e.target.value)}>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.account_number} - {a.account_name || a.account_type}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label flex items-center gap-1.5">
              <Calendar size={12} className="text-gray-400" /> Start Date
            </label>
            <input type="date" className="input-field" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="label flex items-center gap-1.5">
              <Calendar size={12} className="text-gray-400" /> End Date
            </label>
            <input type="date" className="input-field" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
        </div>

        <LoadingButton onClick={downloadStatement} loading={downloading} className="btn-primary w-full md:w-auto">
          <Download size={16} /> Download PDF Statement
        </LoadingButton>
      </div>
    </div>
  )
}
