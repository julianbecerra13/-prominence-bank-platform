import Modal from './Modal'
import { AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react'
import LoadingButton from './LoadingButton'

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', danger = false, loading = false }) {
  const Icon = danger ? ShieldAlert : CheckCircle

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="text-center py-4">
        <div className={`w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center animate-success
          ${danger
            ? 'bg-gradient-to-br from-red-100 to-red-50 shadow-lg shadow-red-100'
            : 'bg-gradient-to-br from-emerald-100 to-emerald-50 shadow-lg shadow-emerald-100'
          }`}
        >
          <Icon size={30} className={danger ? 'text-red-600' : 'text-emerald-600'} />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
        {message && <p className="text-sm text-gray-500 mb-8 max-w-xs mx-auto leading-relaxed">{message}</p>}
        <div className="flex gap-3 justify-center">
          <button onClick={onClose} className="btn-secondary px-8">Cancel</button>
          <LoadingButton
            loading={loading}
            onClick={onConfirm}
            className={`${danger ? 'btn-danger' : 'btn-primary'} px-8`}
          >
            {confirmText}
          </LoadingButton>
        </div>
      </div>
    </Modal>
  )
}
