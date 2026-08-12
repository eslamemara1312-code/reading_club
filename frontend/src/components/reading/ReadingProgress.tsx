interface ReadingProgressProps {
  current: number;
  total: number;
  label?: string;
  unit?: string;
  showPercent?: boolean;
  colorClass?: string;
  className?: string;
}

export function ReadingProgress({
  current,
  total,
  label,
  unit = 'صفحة',
  showPercent = true,
  colorClass = 'bg-reader-accent',
  className = '',
}: ReadingProgressProps) {
  const safeTotal = total > 0 ? total : 1;
  const percent = Math.min(Math.round((current / safeTotal) * 100), 100);

  return (
    <div className={`space-y-1.5 ${className}`}>
      {(label || showPercent) && (
        <div className="flex items-center justify-between text-xs font-bold">
          {label && <span className="text-reader-muted">{label}</span>}
          <div className="flex items-center gap-2 font-mono">
            <span className="text-reader-text">
              {current} / {total} {unit}
            </span>
            {showPercent && (
              <span className="text-reader-accent font-black">{percent}%</span>
            )}
          </div>
        </div>
      )}

      <div className="w-full h-2.5 bg-reader-raised rounded-full overflow-hidden border border-reader-border">
        <div
          className={`h-full ${colorClass} rounded-full transition-all duration-500 shadow-sm`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
