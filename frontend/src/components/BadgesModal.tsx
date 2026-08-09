import React from 'react';
import { Award, CheckCircle2, Lock, X } from 'lucide-react';
import { Badge, UserBadge } from '../api/gamification';

interface BadgesModalProps {
  allBadges: Badge[];
  userBadges: UserBadge[];
  onClose: () => void;
}

export const BadgesModal: React.FC<BadgesModalProps> = ({ allBadges, userBadges, onClose }) => {
  const earnedBadgeIds = new Set(userBadges.map((ub) => ub.badge_id));

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-panel p-6 rounded-2xl max-w-lg w-full border border-slate-800 space-y-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 font-bold text-lg text-white">
            <Award className="w-6 h-6 text-amber-400" />
            معرض الأوسمة والإنجازات
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {allBadges.map((b) => {
            const isEarned = earnedBadgeIds.has(b.id);
            return (
              <div
                key={b.id}
                className={`p-3 rounded-xl border transition-all flex items-start gap-3 ${
                  isEarned
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : 'bg-slate-900/40 border-slate-800 opacity-60'
                }`}
              >
                <div className="text-2xl p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center">
                  {b.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-white">{b.name}</h4>
                    {isEarned ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-slate-500" />
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{b.description}</p>
                  <span className="inline-block text-[10px] font-semibold text-amber-400 mt-2 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                    +{b.xp_award} XP
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
