export function SkeletonCard() {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 animate-pulse space-y-3">
      <div className="h-4 bg-slate-800 rounded w-1/3" />
      <div className="h-8 bg-slate-800 rounded w-2/3" />
      <div className="h-3 bg-slate-800/60 rounded w-1/2" />
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-3.5 flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-800 rounded-full" />
            <div className="space-y-2">
              <div className="h-3.5 bg-slate-800 rounded w-24" />
              <div className="h-2.5 bg-slate-800/60 rounded w-16" />
            </div>
          </div>
          <div className="h-6 bg-slate-800 rounded w-12" />
        </div>
      ))}
    </div>
  );
}
