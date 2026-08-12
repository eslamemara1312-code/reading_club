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
  const variantStyles: Record<MetricVariant, { bg: string; accent: string }> = {
    gold: {
      bg: 'bg-reader-metric-goldBg',
      accent: 'text-reader-metric-goldText',
    },
    coral: {
      bg: 'bg-reader-metric-coralBg',
      accent: 'text-reader-metric-coralText',
    },
    violet: {
      bg: 'bg-reader-metric-violetBg',
      accent: 'text-reader-metric-violetText',
    },
    lime: {
      bg: 'bg-reader-metric-limeBg',
      accent: 'text-reader-metric-limeText',
    },
    sky: {
      bg: 'bg-reader-metric-skyBg',
      accent: 'text-reader-metric-skyText',
    },
  };

  const style = variantStyles[variant];

  return (
    <div
      className={`relative flex min-h-[170px] flex-col justify-between overflow-hidden rounded-[28px] border border-white/30 p-5 text-reader-metric-ink shadow-xl transition-transform duration-200 hover:-translate-y-1 ${style.bg} ${className}`}
    >
      <span className="pointer-events-none absolute -left-8 -top-10 h-28 w-28 rounded-full bg-white/25 blur-2xl" />
      <div className="flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-wide text-reader-metric-ink">{title}</span>
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-black/10 bg-white/25 ${style.accent}`}
        >
          {icon}
        </div>
      </div>

      <div>
        <p className="font-mono text-4xl font-black tracking-tight text-reader-metric-ink sm:text-5xl">
          {value}
        </p>
        {subtitle && (
          <p className="mt-2 line-clamp-2 text-[11px] font-bold leading-relaxed text-reader-metric-ink opacity-70">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
