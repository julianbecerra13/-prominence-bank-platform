export function SkeletonLine({ className = '' }) {
  return <div className={`h-4 rounded-md animate-shimmer ${className}`} />
}

export function SkeletonCard() {
  return (
    <div className="card space-y-3">
      <SkeletonLine className="w-1/3 h-3" />
      <SkeletonLine className="w-2/3 h-8" />
      <SkeletonLine className="w-1/2 h-3" />
    </div>
  )
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="space-y-3">
      <div className="flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonLine key={i} className="flex-1 h-3" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 py-2">
          {Array.from({ length: cols }).map((_, c) => (
            <SkeletonLine key={c} className="flex-1 h-4" />
          ))}
        </div>
      ))}
    </div>
  )
}
