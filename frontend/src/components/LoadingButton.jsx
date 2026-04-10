import { Loader2 } from 'lucide-react'

export default function LoadingButton({ loading, children, className = 'btn-primary', ...props }) {
  return (
    <button className={`${className} flex items-center justify-center gap-2`} disabled={loading} {...props}>
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  )
}
