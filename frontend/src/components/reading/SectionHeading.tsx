import React from 'react';

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
}

export function SectionHeading({
  title,
  subtitle,
  action,
  icon,
  badge,
  className = '',
}: SectionHeadingProps) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 ${className}`}>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          {icon && <span className="text-reader-accent">{icon}</span>}
          <h2 className="text-lg sm:text-xl font-black text-reader-text tracking-tight">
            {title}
          </h2>
          {badge}
        </div>
        {subtitle && (
          <p className="text-xs font-semibold text-reader-muted">
            {subtitle}
          </p>
        )}
      </div>

      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
