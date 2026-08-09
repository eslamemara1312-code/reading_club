import React from 'react';
import { motion } from 'framer-motion';
import { Award, Crown } from 'lucide-react';
import { WeeklyTitle } from '../api/gamification';

interface WeeklyTitlesBannerProps {
  titles: WeeklyTitle[];
}

export const WeeklyTitlesBanner: React.FC<WeeklyTitlesBannerProps> = ({ titles }) => {
  if (!titles || titles.length === 0) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel p-4 rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-950/20 via-slate-900/60 to-obsidian-900 flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg shadow-amber-950/10"
    >
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold shadow-glow-amber">
          <Award className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <h3 className="font-extrabold text-sm text-amber-300 flex items-center gap-1.5">
            <Crown className="w-4 h-4 text-amber-400" />
            ألقاب وتكريمات الأسبوع
          </h3>
          <p className="text-xs text-slate-400">تكريم تميز وتصدر الأعضاء لهذا الأسبوع</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {titles.slice(0, 3).map((t, i) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ scale: 1.05, translateY: -2 }}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-amber-500/35 text-xs shadow-md"
          >
            <span className="font-extrabold text-amber-300">{t.title_name}</span>
            <span className="text-slate-300 font-medium">({t.user.name})</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

