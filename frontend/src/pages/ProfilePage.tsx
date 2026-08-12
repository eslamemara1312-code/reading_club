import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Trophy, BookOpen, Award, Zap, Calendar, TrendingUp, Sparkles, LogOut, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { getAllBadges, getUserBadges } from '../api/gamification';
import { getMonthlySummary } from '../api/stats';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { AppShell } from '../components/layout/AppShell';

const LEVEL_TITLES: Record<number, string> = {
  1: 'مبتدئ القراءة 📖',
  2: 'قارئ شغوف 🚀',
  3: 'مثابر على الورد 💪',
  4: 'ملتزم يوماً بيوم ✨',
  5: 'بطل القراءة الجماعية 🏆',
  6: 'أسطورة الكتب 👑',
  7: 'خارق الالتزام ⚡',
  8: 'عبقري المعرفة 🧠',
  9: 'أيقونة النادي 💎',
  10: 'فيلسوف القراءة 🌟',
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const activeGroupId = useUIStore((state) => state.activeGroupId);
  const [activeTab, setActiveTab] = useState<'badges' | 'stats'>('badges');

  const { data: allBadges } = useQuery({
    queryKey: ['allBadges'],
    queryFn: getAllBadges,
  });

  const { data: userBadges } = useQuery({
    queryKey: ['userBadges', user?.id],
    queryFn: () => getUserBadges(user!.id),
    enabled: !!user,
  });

  const { data: monthlySummary } = useQuery({
    queryKey: ['monthlySummary'],
    queryFn: () => getMonthlySummary(),
  });

  const { data: leaderboard } = useLeaderboard(activeGroupId);

  if (!user) return null;

  const earnedBadgeIds = new Set(userBadges?.map(ub => ub.badge_id) || []);
  const xpForNextLevel = user.level * 100;
  const xpProgress = Math.min((user.xp_points / xpForNextLevel) * 100, 100);
  const levelTitle = LEVEL_TITLES[user.level] || LEVEL_TITLES[10];

  const userRankInGroup = leaderboard?.find((l) => l.user.id === user?.id);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <AppShell>
      <div className="space-y-8 sm:space-y-12 max-w-4xl mx-auto">
        {/* Profile Card Header */}
        <div className="bg-reader-panel p-6 md:p-8 rounded-3xl border border-reader-border relative text-center shadow-xl">
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <button
              onClick={() => navigate('/settings')}
              className="p-2 bg-reader-surface hover:bg-reader-hover rounded-xl border border-reader-border text-reader-text transition-colors flex items-center gap-1.5 text-xs font-bold"
              title="إعدادات المجموعة"
            >
              <Settings size={15} className="text-reader-accent" />
              <span className="hidden sm:inline">الإعدادات</span>
            </button>

            <button
              onClick={handleLogout}
              className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-xl border border-red-500/20 text-red-400 transition-colors flex items-center gap-1.5 text-xs font-bold"
              title="تسجيل الخروج"
            >
              <LogOut size={15} />
              <span>خروج</span>
            </button>
          </div>

          <div className="flex flex-col items-center">
            <div className="relative mb-4">
              <div className="w-24 h-24 rounded-full bg-reader-surface border-2 border-reader-borderStrong flex items-center justify-center text-3xl font-black text-reader-accent overflow-hidden shadow-inner">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user.name?.charAt(0)?.toUpperCase()
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-reader-surface border border-reader-borderStrong rounded-full px-2.5 py-0.5 text-[11px] font-mono font-bold text-reader-accent shadow-sm">
                مستوى {user.level}
              </div>
            </div>

            <h2 className="text-2xl font-black text-reader-text mb-0.5">{user.name}</h2>
            <p className="text-reader-accent text-xs font-bold mb-1 tracking-wide">{levelTitle}</p>

            {/* XP Progress Bar */}
            <div className="w-full max-w-xs mt-4">
              <div className="flex items-center justify-between text-xs text-reader-muted font-semibold mb-1.5">
                <span className="flex items-center gap-1 text-reader-accent">
                  <Zap size={13} className="text-reader-accent fill-reader-accent" /> {user.xp_points} XP
                </span>
                <span className="font-mono">{xpForNextLevel} XP</span>
              </div>
              <div className="h-2 bg-reader-surface rounded-full overflow-hidden border border-reader-border">
                <div
                  className="h-full bg-reader-accent rounded-full transition-all duration-500"
                  style={{ width: `${xpProgress}%` }}
                />
              </div>
              <p className="text-center text-[11px] text-reader-subtle font-medium mt-1.5">
                متبقي <span className="text-reader-accent font-bold font-mono">{Math.round(xpForNextLevel - user.xp_points)} XP</span> للمستوى التالي
              </p>
            </div>
          </div>
        </div>

        {/* MEMBER RANK IN GROUP */}
        {userRankInGroup && leaderboard && (
          <div className="flex items-center justify-between p-4 bg-reader-panel rounded-2xl border border-reader-border text-xs shadow-md">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-reader-accent" />
              <span className="font-bold text-reader-text">ترتيبك في المجموعة:</span>
            </div>
            <div className="font-mono text-reader-accent font-bold">
              المركز #{userRankInGroup.rank} من أصل {leaderboard.length} أعضاء ({userRankInGroup.commitment_rate}% استمرارية)
            </div>
          </div>
        )}

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-reader-panel p-4 rounded-2xl border border-reader-border text-center shadow-md">
            <Flame size={20} className="text-reader-metric-coralText mx-auto mb-1" />
            <p className="text-xl font-black text-reader-text font-mono">{monthlySummary?.stats?.longest_streak || 0}</p>
            <p className="text-[11px] text-reader-muted font-semibold">أطول حماسة (أيام)</p>
          </div>
          <div className="bg-reader-panel p-4 rounded-2xl border border-reader-border text-center shadow-md">
            <BookOpen size={20} className="text-reader-text mx-auto mb-1" />
            <p className="text-xl font-black text-reader-text font-mono">{monthlySummary?.stats?.total_pages || 0}</p>
            <p className="text-[11px] text-reader-muted font-semibold">صفحة مقروءة</p>
          </div>
          <div className="bg-reader-panel p-4 rounded-2xl border border-reader-border text-center shadow-md">
            <Trophy size={20} className="text-reader-metric-goldText mx-auto mb-1" />
            <p className="text-xl font-black text-reader-text font-mono">{userBadges?.length || 0}</p>
            <p className="text-[11px] text-reader-muted font-semibold">وسام مكتسب</p>
          </div>
        </div>

        {/* Segmented Tab Switcher */}
        <div className="bg-reader-panel p-1.5 rounded-2xl border border-reader-border flex gap-2 shadow-sm">
          <button
            onClick={() => setActiveTab('badges')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'badges'
                ? 'bg-reader-surface text-reader-accent border border-reader-borderStrong shadow-sm'
                : 'text-reader-muted hover:text-reader-text'
            }`}
          >
            <Award size={15} />
            سجل الأوسمة الإنجازية
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'stats'
                ? 'bg-reader-surface text-reader-accent border border-reader-borderStrong shadow-sm'
                : 'text-reader-muted hover:text-reader-text'
            }`}
          >
            <TrendingUp size={15} />
            إحصائيات القراءة والالتزام
          </button>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'badges' && (
            <motion.div
              key="badges"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-3"
            >
              {allBadges?.map((badge) => {
                const earned = earnedBadgeIds.has(badge.id);
                const earnedInfo = userBadges?.find((ub) => ub.badge_id === badge.id);
                return (
                  <div
                    key={badge.id}
                    className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                      earned
                        ? 'bg-reader-panel border-reader-borderStrong shadow-md'
                        : 'bg-reader-disabled border-reader-border opacity-60'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      earned ? 'bg-reader-surface border border-reader-borderStrong text-reader-accent' : 'bg-reader-canvas text-reader-muted'
                    }`}>
                      <Award size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`font-bold text-xs ${earned ? 'text-reader-text' : 'text-reader-muted'}`}>
                          {badge.name}
                        </p>
                        {earned && <Sparkles size={13} className="text-reader-accent" />}
                      </div>
                      <p className="text-[11px] text-reader-muted truncate mt-0.5 font-medium">{badge.description}</p>
                      {earned && earnedInfo && (
                        <p className="text-[10px] text-reader-metric-limeText font-medium mt-1 font-mono">
                          تم الحصول عليه بتاريخ {new Date(earnedInfo.earned_at).toLocaleDateString('ar-EG')}
                        </p>
                      )}
                    </div>
                    <div className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border shrink-0 font-mono ${
                      earned ? 'bg-reader-surface text-reader-accent border-reader-borderStrong' : 'bg-reader-canvas border-reader-border text-reader-muted'
                    }`}>
                      +{badge.xp_award} XP
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}

          {activeTab === 'stats' && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4"
            >
              {monthlySummary ? (
                <div className="bg-reader-panel p-6 rounded-3xl border border-reader-border space-y-4 shadow-xl">
                  <h3 className="text-xs font-bold text-reader-text flex items-center gap-2 border-b border-reader-border pb-3">
                    <Calendar size={16} className="text-reader-accent" />
                    ملخص أداء الشهر الحالي والأسابيع الماضية
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-reader-surface p-4 rounded-xl border border-reader-border">
                      <p className="text-[11px] text-reader-muted mb-1 font-semibold">نسبة الالتزام بالشهر</p>
                      <p className="text-xl font-black text-reader-metric-limeText font-mono">{monthlySummary.stats.commitment_rate}%</p>
                    </div>
                    <div className="bg-reader-surface p-4 rounded-xl border border-reader-border">
                      <p className="text-[11px] text-reader-muted mb-1 font-semibold">أيام الحضور والإنتاج</p>
                      <p className="text-xl font-black text-reader-text font-mono">{monthlySummary.stats.total_checkins}/{monthlySummary.stats.days_in_month}</p>
                    </div>
                    <div className="bg-reader-surface p-4 rounded-xl border border-reader-border">
                      <p className="text-[11px] text-reader-muted mb-1 font-semibold">إجمالي الصفحات المقروءة</p>
                      <p className="text-xl font-black text-reader-accent font-mono">{monthlySummary.stats.total_pages}</p>
                    </div>
                    <div className="bg-reader-surface p-4 rounded-xl border border-reader-border">
                      <p className="text-[11px] text-reader-muted mb-1 font-semibold">غرامات مسجلة</p>
                      <p className="text-xl font-black text-red-400 font-mono">{monthlySummary.stats.total_fines} ج.م</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-reader-panel p-10 rounded-3xl border border-reader-border text-center text-reader-muted shadow-lg">
                  <TrendingUp size={40} className="mx-auto mb-3 text-reader-muted" />
                  <p className="text-xs font-bold text-reader-text">لا يوجد ملخص شهري بعد</p>
                  <p className="text-[11px] text-reader-muted mt-1 font-medium">يتم احتساب ملخص الإحصائيات تلقائياً بمرور أيام القراءة.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppShell>
  );
}
