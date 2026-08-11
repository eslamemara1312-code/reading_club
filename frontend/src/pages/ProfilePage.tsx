/*
===============================================================================
 خريطة الوظائف المحفوظة (Preserved Functionality Map) — ProfilePage.tsx
===============================================================================
1. State Store & Router:
   - user: useAuthStore((state) => state.user)
   - logout: useAuthStore((state) => state.logout)
   - activeGroupId: useUIStore((state) => state.activeGroupId)
   - navigate: useNavigate()
   - activeTab: 'badges' | 'stats'

2. Queries:
   - allBadges: getAllBadges() [Key: 'allBadges']
   - userBadges: getUserBadges(user.id) [Key: 'userBadges', user.id]
   - monthlySummary: getMonthlySummary() [Key: 'monthlySummary']
   - leaderboard: useLeaderboard(activeGroupId) [Key: 'leaderboard', activeGroupId]

3. Computed Values:
   - earnedBadgeIds: Set of badge_ids
   - xpForNextLevel, xpProgress, levelTitle
   - userRankInGroup: leaderboard?.find(l => l.user.id === user?.id)
===============================================================================
*/

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
import { Navbar } from '../components/Navbar';

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
    <div className="min-h-screen bg-apple-bg text-apple-text pb-32 lg:pb-16 relative dir-rtl font-sans transition-colors duration-300">
      {/* Quiet Header Navbar */}
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-8 pt-8 space-y-8 relative z-10">
        {/* Profile Card Header */}
        <div className="bg-apple-surface p-6 md:p-8 rounded-2xl border border-apple-border relative text-center shadow-xl">
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <button
              onClick={() => navigate('/settings')}
              className="p-2 bg-apple-card hover:bg-apple-elevated rounded-xl border border-apple-border text-apple-text transition-colors flex items-center gap-1.5 text-xs font-bold"
              title="إعدادات المجموعة"
            >
              <Settings size={15} className="text-apple-gold" />
              <span className="hidden sm:inline">الإعدادات</span>
            </button>

            <button
              onClick={handleLogout}
              className="p-2 bg-apple-red/10 hover:bg-apple-red/20 rounded-xl border border-apple-red/20 text-apple-red transition-colors flex items-center gap-1.5 text-xs font-bold"
              title="تسجيل الخروج"
            >
              <LogOut size={15} />
              <span>خروج</span>
            </button>
          </div>

          <div className="flex flex-col items-center">
            <div className="relative mb-4">
              <div className="w-24 h-24 rounded-full bg-apple-bg border-2 border-apple-gold/60 flex items-center justify-center text-3xl font-black text-apple-gold overflow-hidden shadow-inner">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user.name?.charAt(0)?.toUpperCase()
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-apple-card border border-apple-gold/40 rounded-full px-2.5 py-0.5 text-[11px] font-mono font-bold text-apple-gold shadow-sm">
                مستوى {user.level}
              </div>
            </div>

            <h2 className="text-2xl font-black text-apple-text mb-0.5">{user.name}</h2>
            <p className="text-apple-gold text-xs font-bold mb-1 tracking-wide">{levelTitle}</p>

            {/* XP Progress Bar */}
            <div className="w-full max-w-xs mt-4">
              <div className="flex items-center justify-between text-xs text-apple-secondary font-semibold mb-1.5">
                <span className="flex items-center gap-1 text-apple-gold">
                  <Zap size={13} className="text-apple-gold fill-apple-gold" /> {user.xp_points} XP
                </span>
                <span className="font-mono">{xpForNextLevel} XP</span>
              </div>
              <div className="h-2 bg-apple-bg rounded-full overflow-hidden border border-apple-border">
                <div
                  className="h-full bg-apple-gold rounded-full transition-all duration-500"
                  style={{ width: `${xpProgress}%` }}
                />
              </div>
              <p className="text-center text-[11px] text-apple-muted font-medium mt-1.5">
                متبقي <span className="text-apple-gold font-bold font-mono">{Math.round(xpForNextLevel - user.xp_points)} XP</span> للمستوى التالي
              </p>
            </div>
          </div>
        </div>

        {/* MEMBER RANK IN GROUP COMPETITION LINE (الترتيب الجماعي بين الأعضاء) */}
        {userRankInGroup && leaderboard && (
          <div className="flex items-center justify-between p-4 bg-apple-surface rounded-2xl border border-apple-border text-xs shadow-md">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-apple-gold" />
              <span className="font-bold text-apple-text">ترتيبك في المجموعة:</span>
            </div>
            <div className="font-mono text-apple-gold font-bold">
              المركز #{userRankInGroup.rank} من أصل {leaderboard.length} أعضاء ({userRankInGroup.commitment_rate}% استمرارية)
            </div>
          </div>
        )}

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-apple-surface p-4 rounded-2xl border border-apple-border text-center shadow-md">
            <Flame size={20} className="text-apple-gold mx-auto mb-1" />
            <p className="text-xl font-black text-apple-text font-mono">{monthlySummary?.stats?.longest_streak || 0}</p>
            <p className="text-[11px] text-apple-muted font-semibold">أطول حماسة (أيام)</p>
          </div>
          <div className="bg-apple-surface p-4 rounded-2xl border border-apple-border text-center shadow-md">
            <BookOpen size={20} className="text-apple-text mx-auto mb-1" />
            <p className="text-xl font-black text-apple-text font-mono">{monthlySummary?.stats?.total_pages || 0}</p>
            <p className="text-[11px] text-apple-muted font-semibold">صفحة مقروءة</p>
          </div>
          <div className="bg-apple-surface p-4 rounded-2xl border border-apple-border text-center shadow-md">
            <Trophy size={20} className="text-apple-gold mx-auto mb-1" />
            <p className="text-xl font-black text-apple-text font-mono">{userBadges?.length || 0}</p>
            <p className="text-[11px] text-apple-muted font-semibold">وسام مكتسب</p>
          </div>
        </div>

        {/* Segmented Tab Switcher */}
        <div className="bg-apple-surface p-1.5 rounded-2xl border border-apple-border flex gap-2 shadow-sm">
          <button
            onClick={() => setActiveTab('badges')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'badges'
                ? 'bg-apple-card text-apple-gold border border-apple-gold/30 shadow-sm'
                : 'text-apple-secondary hover:text-apple-text'
            }`}
          >
            <Award size={15} />
            سجل الأوسمة الإنجازية
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'stats'
                ? 'bg-apple-card text-apple-gold border border-apple-gold/30 shadow-sm'
                : 'text-apple-secondary hover:text-apple-text'
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
                        ? 'bg-apple-surface border-apple-gold/30 shadow-md'
                        : 'bg-apple-surface/50 border-apple-border opacity-50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      earned ? 'bg-apple-card border border-apple-gold/40 text-apple-gold' : 'bg-apple-bg text-apple-muted'
                    }`}>
                      <Award size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`font-bold text-xs ${earned ? 'text-apple-text' : 'text-apple-muted'}`}>
                          {badge.name}
                        </p>
                        {earned && <Sparkles size={13} className="text-apple-gold" />}
                      </div>
                      <p className="text-[11px] text-apple-secondary truncate mt-0.5 font-medium">{badge.description}</p>
                      {earned && earnedInfo && (
                        <p className="text-[10px] text-apple-green font-medium mt-1 font-mono">
                          تم الحصول عليه بتاريخ {new Date(earnedInfo.earned_at).toLocaleDateString('ar-EG')}
                        </p>
                      )}
                    </div>
                    <div className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border shrink-0 font-mono ${
                      earned ? 'bg-apple-card text-apple-gold border-apple-gold/30' : 'bg-apple-bg border-apple-border text-apple-muted'
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
                <div className="bg-apple-surface p-6 rounded-2xl border border-apple-border space-y-4 shadow-xl">
                  <h3 className="text-xs font-bold text-apple-text flex items-center gap-2 border-b border-apple-border pb-3">
                    <Calendar size={16} className="text-apple-gold" />
                    ملخص أداء الشهر الحالي والأسابيع الماضية
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-apple-bg p-4 rounded-xl border border-apple-border">
                      <p className="text-[11px] text-apple-muted mb-1 font-semibold">نسبة الالتزام بالشهر</p>
                      <p className="text-xl font-black text-apple-green font-mono">{monthlySummary.stats.commitment_rate}%</p>
                    </div>
                    <div className="bg-apple-bg p-4 rounded-xl border border-apple-border">
                      <p className="text-[11px] text-apple-muted mb-1 font-semibold">أيام الحضور والإنتاج</p>
                      <p className="text-xl font-black text-apple-text font-mono">{monthlySummary.stats.total_checkins}/{monthlySummary.stats.days_in_month}</p>
                    </div>
                    <div className="bg-apple-bg p-4 rounded-xl border border-apple-border">
                      <p className="text-[11px] text-apple-muted mb-1 font-semibold">إجمالي الصفحات المقروءة</p>
                      <p className="text-xl font-black text-apple-gold font-mono">{monthlySummary.stats.total_pages}</p>
                    </div>
                    <div className="bg-apple-bg p-4 rounded-xl border border-apple-border">
                      <p className="text-[11px] text-apple-muted mb-1 font-semibold">غرامات مسجلة</p>
                      <p className="text-xl font-black text-apple-red font-mono">{monthlySummary.stats.total_fines} ج.م</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-apple-surface p-10 rounded-2xl border border-apple-border text-center text-apple-muted shadow-lg">
                  <TrendingUp size={40} className="mx-auto mb-3 text-apple-muted" />
                  <p className="text-xs font-bold text-apple-text">لا يوجد ملخص شهري بعد</p>
                  <p className="text-[11px] text-apple-muted mt-1 font-medium">يتم احتساب ملخص الإحصائيات تلقائياً بمرور أيام القراءة.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
