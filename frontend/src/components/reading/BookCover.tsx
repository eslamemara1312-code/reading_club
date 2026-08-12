import { useState } from 'react';
import { BookOpen } from 'lucide-react';

interface BookCoverProps {
  coverUrl?: string | null;
  title: string;
  author?: string;
  size?: 'sm' | 'md' | 'lg';
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
        <div className="w-full h-full bg-gradient-to-br from-reader-surface via-reader-raised to-reader-hover p-3 flex flex-col justify-between items-center text-center">
          <BookOpen className="w-8 h-8 text-reader-accent mt-2" />
          <div className="space-y-1 my-auto">
            <p className="font-bold text-reader-text line-clamp-2 text-[11px] leading-tight">
              {title}
            </p>
            {author && (
              <p className="text-[9px] text-reader-muted line-clamp-1">{author}</p>
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
