import { useState } from 'react';
import { BookOpen } from 'lucide-react';

interface BookCoverProps {
  coverUrl?: string | null;
  title: string;
  author?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  progress?: number;
  className?: string;
}

export function BookCover({
  coverUrl,
  title,
  author,
  size = 'md',
  progress,
  className = '',
}: BookCoverProps) {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    sm: 'w-16 h-24 text-xs',
    md: 'w-24 h-36 text-xs',
    lg: 'w-36 h-52 text-sm',
    xl: 'w-44 h-64 text-base rounded-[24px]',
  };

  return (
    <div
      className={`relative aspect-[2/3] rounded-xl overflow-hidden shadow-lg border border-reader-border bg-reader-surface flex flex-col justify-between shrink-0 group ${sizeClasses[size]} ${className}`}
    >
      {coverUrl && !imageError ? (
        <img
          src={coverUrl}
          alt={title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="relative w-full h-full overflow-hidden bg-gradient-to-br from-reader-metric-violetBg via-reader-metric-skyBg to-reader-metric-coralBg p-3 flex flex-col justify-between items-center text-center text-reader-metric-ink">
          <span className="absolute -top-7 -left-7 h-20 w-20 rounded-full border-[12px] border-white/25" />
          <span className="absolute -bottom-10 -right-8 h-28 w-28 rounded-full bg-white/20" />
          <BookOpen className="relative z-10 w-8 h-8 mt-2" />
          <div className="relative z-10 space-y-1 my-auto">
            <p className="font-extrabold line-clamp-2 text-[11px] leading-tight">
              {title}
            </p>
            {author && (
              <p className="text-[9px] opacity-70 line-clamp-1">{author}</p>
            )}
          </div>
        </div>
      )}

      {typeof progress === 'number' && (
        <div className="absolute bottom-0 left-0 right-0 bg-reader-glass backdrop-blur-md px-2 py-1 border-t border-reader-border">
          <div className="w-full h-1.5 bg-reader-raised rounded-full overflow-hidden">
            <div
              className="h-full bg-reader-accent rounded-full transition-all duration-300"
              style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
