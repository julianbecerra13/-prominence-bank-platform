import AnimatedNumber from './AnimatedNumber'

export default function StatCard({ icon: Icon, label, value, prefix = '$', decimals = 2, gradient = 'stat-navy', animate = true, delay = 0 }) {
  return (
    <div
      className={`rounded-2xl p-5 relative overflow-hidden group ${gradient}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Glossy overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/5 pointer-events-none" />

      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)',
        backgroundSize: '30px 30px'
      }} />

      {/* Decorative icon */}
      {Icon && (
        <div className="absolute -top-2 -right-2 opacity-10 group-hover:opacity-20 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
          <Icon size={72} strokeWidth={1} />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10">
        <p className="text-sm font-medium opacity-80 mb-2 tracking-wide">{label}</p>
        <p className="text-3xl font-extrabold tracking-tight">
          {animate ? (
            <AnimatedNumber value={value} prefix={prefix} decimals={decimals} />
          ) : (
            <>{prefix}{Number(value).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}</>
          )}
        </p>

        {/* Subtle bottom accent line */}
        <div className="mt-3 h-0.5 w-12 bg-white/30 rounded-full group-hover:w-20 transition-all duration-500" />
      </div>
    </div>
  )
}
