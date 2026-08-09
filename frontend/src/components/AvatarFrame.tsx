interface AvatarFrameProps {
  avatarUrl?: string;
  name: string;
  frame?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function AvatarFrame({ avatarUrl, name, frame = 'none', size = 'md' }: AvatarFrameProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-base',
    lg: 'w-20 h-20 text-2xl',
  }[size];

  const frameBorders = {
    none: 'ring-2 ring-slate-700',
    bronze: 'ring-4 ring-amber-700 shadow-amber-900/50 shadow-md',
    silver: 'ring-4 ring-slate-300 shadow-slate-400/50 shadow-md',
    gold: 'ring-4 ring-amber-400 shadow-amber-500/50 shadow-lg animate-pulse',
    emerald: 'ring-4 ring-emerald-400 shadow-emerald-500/50 shadow-lg',
  }[frame] || 'ring-2 ring-slate-700';

  return (
    <div className={`relative rounded-full flex items-center justify-center font-bold bg-gradient-to-br from-emerald-500 to-teal-700 text-white ${sizeClasses} ${frameBorders}`}>
      {avatarUrl ? (
        <img src={avatarUrl} alt={name} className="w-full h-full rounded-full object-cover" />
      ) : (
        <span>{name ? name.charAt(0).toUpperCase() : '?'}</span>
      )}
    </div>
  );
}
