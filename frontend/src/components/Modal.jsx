import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

export default function Modal({ isOpen, onClose, title, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!isOpen) return
    const handleEscape = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-primary-900/30 backdrop-blur-md animate-fade-in" onClick={onClose} />

      {/* Modal */}
      <div className={`relative w-full ${sizes[size]} bg-white rounded-3xl shadow-2xl shadow-primary-900/10 animate-modal overflow-hidden`}>
        {/* Subtle top accent */}
        <div className="h-1 bg-gradient-to-r from-accent-400 via-accent-500 to-primary-500" />

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-7 py-5">
            <h3 className="text-lg font-bold text-primary-500">{title}</h3>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200 active:scale-90"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="px-7 pb-6 max-h-[70vh] overflow-y-auto">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-7 py-4 border-t border-gray-100 bg-gray-50/50">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
