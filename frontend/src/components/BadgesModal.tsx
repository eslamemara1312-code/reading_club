import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, CheckCircle2, Lock, X, Sparkles } from 'lucide-react';
import Tilt from 'react-parallax-tilt';
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
      <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="badges-modal-title"
          initial={{ opacity: 0, scale: 0.9, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 15 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="bg-reader-panel p-6 rounded-3xl max-w-xl w-full border border-reader-border shadow-2xl space-y-5 max-h-[85vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-reader-border pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-reader-surface border border-reader-borderStrong flex items-center justify-center text-reader-accent shadow-sm">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h3 id="badges-modal-title" className="font-extrabold text-lg text-reader-text flex items-center flex-wrap gap-2">
                  <span>معرض الأوسمة والإنجازات</span>
                  <span className="inline-flex items-center justify-center font-mono whitespace-nowrap dir-ltr text-xs px-2.5 py-0.5 rounded-full bg-reader-accentSoft text-reader-accent font-bold border border-reader-borderStrong shrink-0">
                    {earnedCount} / {allBadges.length}
                  </span>
                </h3>
                <p className="text-xs text-reader-muted">إنجازاتك ومكافآت نقاط الخبرة XP</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-reader-muted hover:text-reader-text hover:bg-reader-surface rounded-xl transition-colors"
              aria-label="إغلاق نافذة الأوسمة"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            {allBadges.map((b, index) => {
              const isEarned = earnedBadgeIds.has(b.id);
              return (
                <Tilt key={b.id} tiltMaxAngleX={10} tiltMaxAngleY={10} perspective={800} scale={1.02} transitionSpeed={1200}>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 relative overflow-hidden h-full ${
                      isEarned
                        ? 'bg-reader-surface border-reader-borderStrong shadow-md'
                        : 'bg-reader-disabled border-reader-border opacity-80'
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl border flex items-center justify-center shrink-0 ${
                      isEarned ? 'bg-reader-raised border-reader-borderStrong text-reader-accent shadow-sm' : 'bg-reader-canvas border-reader-border text-reader-subtle'
                    }`}>
                      <Award className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="font-bold text-sm text-reader-text truncate">{b.name}</h4>
                        {isEarned ? (
                          <CheckCircle2 className="w-4 h-4 text-reader-metric-limeText shrink-0" />
                        ) : (
                          <Lock className="w-3.5 h-3.5 text-reader-subtle shrink-0" />
                        )}
                      </div>
                      <p className={`text-xs mt-1 leading-relaxed line-clamp-2 ${isEarned ? 'text-reader-text' : 'text-reader-muted'}`}>{b.description}</p>
                      <div className="mt-2.5 flex items-center gap-1.5">
                        <span className="text-[11px] font-bold text-reader-accent px-2.5 py-0.5 rounded-full bg-reader-accentSoft border border-reader-borderStrong flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-reader-accent" />
                          +{b.xp_award} XP
                        </span>
                      </div>
                    </div>
                  </motion.div>
                </Tilt>
              );
            })}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
