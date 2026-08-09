import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, CheckCircle2, Lock, X, Sparkles } from 'lucide-react';
import { Badge, UserBadge } from '../api/gamification';

interface BadgesModalProps {
  allBadges: Badge[];
  userBadges: UserBadge[];
  onClose: () => void;
}

export const BadgesModal: React.FC<BadgesModalProps> = ({ allBadges, userBadges, onClose }) => {
  const earnedBadgeIds = new Set(userBadges.map((ub) => ub.badge_id));
  const earnedCount = earnedBadgeIds.size;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-obsidian-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 15 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="glass-panel p-6 rounded-3xl max-w-xl w-full border border-slate-700/80 shadow-2xl space-y-5 max-h-[85vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-glow-amber">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-white flex items-center gap-2">
                  معرض الأوسمة والإنجازات
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                    {earnedCount} / {allBadges.length}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">إنجازاتك ومكافآت نقاط الخبرة XP</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            {allBadges.map((b, index) => {
              const isEarned = earnedBadgeIds.has(b.id);
              return (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  whileHover={{ scale: 1.02, translateY: -2 }}
                  className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 relative overflow-hidden ${
                    isEarned
                      ? 'bg-gradient-to-br from-amber-950/40 via-slate-900/60 to-slate-900/80 border-amber-500/40 shadow-lg shadow-amber-950/20'
                      : 'bg-slate-900/40 border-slate-800/80 opacity-60'
                  }`}
                >
                  {isEarned && (
                    <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
                  )}
                  <div className={`text-2xl p-2.5 rounded-xl border flex items-center justify-center shrink-0 ${
                    isEarned ? 'bg-amber-500/15 border-amber-500/30 text-amber-300 shadow-sm' : 'bg-slate-900 border-slate-800 text-slate-600'
                  }`}>
                    {b.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="font-bold text-sm text-white truncate">{b.name}</h4>
                      {isEarned ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">{b.description}</p>
                    <div className="mt-2.5 flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-amber-300 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        +{b.xp_award} XP
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

