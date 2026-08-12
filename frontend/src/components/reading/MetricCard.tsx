import React from 'react';

export type MetricVariant = 'gold' | 'coral' | 'violet' | 'lime' | 'sky';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  variant?: MetricVariant;
  className?: string;
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  variant = 'gold',
  className = '',
}: MetricCardProps) {
  const variantStyles: Record<MetricVariant, { bg: string; text: string; border: string }> = {
    gold: {
      bg: 'bg-reader-metric-goldBg',
      text: 'text-reader-metric-goldText',
      border: 'border-reader-border',
    },
    coral: {
      bg: 'bg-reader-metric-coralBg',
      text: 'text-reader-metric-coralText',
      border: 'border-reader-border',
    },
    violet: {
      bg: 'bg-reader-metric-violetBg',
      text: 'text-reader-metric-violetText',
      border: 'border-reader-border',
    },
    lime: {
      bg: 'bg-reader-metric-limeBg',
      text: 'text-reader-metric-limeText',
      border: 'border-reader-border',
    },
    sky: {
      bg: 'bg-reader-metric-skyBg',
      text: 'text-reader-metric-skyText',
      border: 'border-reader-border',
    },
  };

  const style = variantStyles[variant];

  return (
    <div
      className={`p-4 sm:p-5 rounded-2xl bg-reader-surface border ${style.border} shadow-lg space-y-3 relative overflow-hidden transition-all hover:translate-y-[-2px] ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-reader-muted">{title}</span>
        <div
          className={`w-9 h-9 rounded-xl ${style.bg} ${style.text} flex items-center justify-center border border-reader-border shrink-0`}
        >
          {icon}
        </div>
      </div>

      <div>
        <p className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${style.text}`}>
          {value}
        </p>
        {subtitle && (
          <p className="text-[11px] font-semibold text-reader-subtle mt-1 line-clamp-1">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
