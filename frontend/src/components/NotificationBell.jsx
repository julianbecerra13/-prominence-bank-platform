import { useState } from 'react'
import { Bell, CreditCard, ArrowLeftRight, ShieldCheck, X } from 'lucide-react'

const mockNotifications = [
  { id: 1, icon: CreditCard, text: 'Deposit of $15,000 credited to PB-CHK-10000001', time: '2 hours ago', read: false },
  { id: 2, icon: ArrowLeftRight, text: 'Wire transfer request approved - $125,000', time: '5 hours ago', read: false },
  { id: 3, icon: ShieldCheck, text: 'KYC approved for customer PB-C-10000002', time: '1 day ago', read: true },
]

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const unread = mockNotifications.filter(n => !n.read).length

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative p-2 rounded-lg hover:bg-white/10 transition-colors">
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse-dot">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-modal">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h4 className="text-sm font-bold text-gray-800">Notifications</h4>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
            </div>
            <div className="max-h-72 overflow-y-auto">
              {mockNotifications.map(n => (
                <div key={n.id} className={`flex gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${!n.read ? 'bg-primary-50/30' : ''}`}>
                  <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <n.icon size={14} className="text-primary-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-700">{n.text}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{n.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
