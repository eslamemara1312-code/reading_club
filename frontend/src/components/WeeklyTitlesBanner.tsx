import React from 'react';
import { Award } from 'lucide-react';
import { WeeklyTitle } from '../api/gamification';

interface WeeklyTitlesBannerProps {
  titles: WeeklyTitle[];
}

export const WeeklyTitlesBanner: React.FC<WeeklyTitlesBannerProps> = ({ titles }) => {
  if (!titles || titles.length === 0) return null;

  return (
    <div className="glass-panel p-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
          <Award className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-bold text-sm text-amber-300">ألقاب الأسبوع الجماعية</h3>
          <p className="text-xs text-slate-400">تكريم تميز الأعضاء في الأسبوع الحالي</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {titles.slice(0, 3).map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-amber-500/30 text-xs"
          >
            <span className="font-bold text-amber-400">{t.title_name}</span>
            <span className="text-slate-300">({t.user.name})</span>
          </div>
        ))}
      </div>
    </div>
  );
};
