import { Search } from 'lucide-react'

export default function SearchBar({ placeholder = 'Search...', value, onChange }) {
  return (
    <div className="relative">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        value={value || ''}
        onChange={e => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg
                   focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500
                   placeholder:text-gray-400 transition-all"
      />
    </div>
  )
}
