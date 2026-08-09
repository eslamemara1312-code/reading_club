import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Trophy, BookOpen, Award, Zap, Calendar, TrendingUp, Sparkles, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { getAllBadges, getUserBadges } from '../api/gamification';
import { getMonthlySummary } from '../api/stats';
import { Navbar } from '../components/Navbar';

const LEVEL_TITLES: Record<number, string> = {
  1: 'مبتدئ',
  2: 'قارئ ناشئ',
  3: 'مثابر',
  4: 'ملتزم',
  5: 'بطل القراءة',
  6: 'أسطورة',
  7: 'خارق',
  8: 'عبقري',
  9: 'أيقونة',
  10: 'إله القراءة',
};

const BADGE_ICONS: Record<string, string> = {
  streak_7: '🔥',
  streak_30: '💎',
  streak_100: '👑',
  first_book: '📖',
  first_checkin: '✅',
  speed_reader: '⚡',
  night_owl: '🦉',
  early_bird: '🐦',
  consistent: '💪',
  rescuer: '🦸',
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
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

  if (!user) return null;

  const earnedBadgeIds = new Set(userBadges?.map(ub => ub.badge_id) || []);
  const xpForNextLevel = user.level * 100;
  const xpProgress = Math.min((user.xp_points / xpForNextLevel) * 100, 100);
  const levelTitle = LEVEL_TITLES[user.level] || LEVEL_TITLES[10];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-obsidian-950 text-slate-100 pb-24 relative overflow-hidden">
      {/* Dynamic Glows */}
      <div className="glow-orb w-96 h-96 bg-emerald-500/10 top-0 left-1/2 -translate-x-1/2 animate-pulse-subtle" />

      {/* Navbar Header */}
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 pt-6 space-y-6 relative z-10">
        {/* Profile Card Header */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 md:p-8 rounded-3xl border border-slate-800/90 shadow-2xl relative overflow-hidden text-center"
        >
          <div className="absolute top-4 left-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className="p-2.5 bg-rose-500/10 hover:bg-rose-500/20 rounded-2xl border border-rose-500/30 text-rose-400 transition-all flex items-center gap-1.5 text-xs font-bold"
              title="تسجيل الخروج"
            >
              <LogOut size={16} />
              <span>خروج</span>
            </motion.button>
          </div>

          <div className="flex flex-col items-center">
            <div className="relative mb-4">
              <motion.div 
                whileHover={{ scale: 1.05, rotate: 2 }}
                className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-700 flex items-center justify-center text-3xl font-black text-white shadow-xl shadow-emerald-500/20 ring-4 ring-emerald-500/20"
              >
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  user.name?.charAt(0)?.toUpperCase()
                )}
              </motion.div>
              <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-amber-500 to-flame-500 rounded-full px-3 py-0.5 text-xs font-black text-white shadow-lg border border-amber-400/30">
                Lv.{user.level}
              </div>
            </div>

            <h2 className="text-2xl font-black text-white mb-0.5">{user.name}</h2>
            <p className="text-emerald-400 text-xs font-bold mb-1 tracking-wide">{levelTitle}</p>
            <p className="text-slate-400 text-xs font-mono">{user.email}</p>

            {/* XP Progress Bar */}
            <div className="w-full max-w-xs mt-5">
              <div className="flex items-center justify-between text-xs text-slate-400 font-bold mb-1.5">
                <span className="flex items-center gap-1 text-amber-300">
                  <Zap size={14} className="text-amber-400 fill-amber-400" /> {user.xp_points} XP
                </span>
                <span>{xpForNextLevel} XP</span>
              </div>
              <div className="h-3 bg-obsidian-950 rounded-full overflow-hidden border border-slate-700/60 p-0.5 shadow-inner">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${xpProgress}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 rounded-full shadow-glow-emerald"
                />
              </div>
              <p className="text-center text-[11px] text-slate-400 font-medium mt-1.5">
                تبقي <span className="text-emerald-400 font-bold">{Math.round(xpForNextLevel - user.xp_points)} XP</span> للمستوى التالي 🎯
              </p>
            </div>
          </div>
        </motion.div>

        {/* Quick Stats Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-3"
        >
          <div className="glass-card p-4 rounded-2xl border border-slate-800/90 text-center">
            <Flame size={22} className="text-flame-400 mx-auto mb-1 animate-flame-bounce" />
            <p className="text-xl font-black text-white font-mono">{monthlySummary?.stats?.longest_streak || 0}</p>
            <p className="text-[11px] text-slate-400 font-bold">أطول سلسلة (أيام)</p>
          </div>
          <div className="glass-card p-4 rounded-2xl border border-slate-800/90 text-center">
            <BookOpen size={22} className="text-sky-400 mx-auto mb-1" />
            <p className="text-xl font-black text-white font-mono">{monthlySummary?.stats?.total_pages || 0}</p>
            <p className="text-[11px] text-slate-400 font-bold">صفحة مقروءة</p>
          </div>
          <div className="glass-card p-4 rounded-2xl border border-slate-800/90 text-center">
            <Trophy size={22} className="text-amber-400 mx-auto mb-1" />
            <p className="text-xl font-black text-white font-mono">{userBadges?.length || 0}</p>
            <p className="text-[11px] text-slate-400 font-bold">وسام مكتسب</p>
          </div>
        </motion.div>

        {/* Segmented Tab Switcher */}
        <div className="glass-panel p-1.5 rounded-2xl border border-slate-800 flex gap-2">
          <button
            onClick={() => setActiveTab('badges')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'badges'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-950/50'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Award size={16} />
            سجل الأوسمة الإنجازية
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'stats'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-950/50'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp size={16} />
            إحصائيات القراءة والالتزام
          </button>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'badges' && (
            <motion.div
              key="badges"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              {allBadges?.map((badge, idx) => {
                const earned = earnedBadgeIds.has(badge.id);
                const earnedInfo = userBadges?.find((ub) => ub.badge_id === badge.id);
                return (
                  <motion.div
                    key={badge.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                      earned
                        ? 'glass-card border-amber-500/30 bg-gradient-to-r from-amber-950/20 via-slate-900/60 to-obsidian-950 shadow-lg shadow-amber-950/10'
                        : 'glass-panel border-slate-800/60 opacity-50'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-inner ${
                      earned ? 'bg-amber-500/20 border border-amber-500/30' : 'bg-slate-800/50'
                    }`}>
                      {BADGE_ICONS[badge.slug] || badge.icon || '🏅'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`font-extrabold text-sm ${earned ? 'text-white' : 'text-slate-400'}`}>
                          {badge.name}
                        </p>
                        {earned && <Sparkles size={14} className="text-amber-400" />}
                      </div>
                      <p className="text-xs text-slate-400 truncate mt-0.5">{badge.description}</p>
                      {earned && earnedInfo && (
                        <p className="text-[11px] text-emerald-400 font-semibold mt-1">
                          تم الحصول عليه بتاريخ {new Date(earnedInfo.earned_at).toLocaleDateString('ar-EG')}
                        </p>
                      )}
                    </div>
                    <div className={`text-xs font-black px-3 py-1.5 rounded-xl border shrink-0 ${
                      earned ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-slate-800 border-slate-700 text-slate-500'
                    }`}>
                      +{badge.xp_award} XP
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {activeTab === 'stats' && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {monthlySummary ? (
                <div className="glass-card p-6 rounded-3xl border border-slate-800/90 space-y-4">
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                    <Calendar size={18} className="text-emerald-400" />
                    ملخص أداء الشهر الحالي والسابيع الماضي
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-obsidian-950 p-4 rounded-2xl border border-slate-800">
                      <p className="text-xs text-slate-400 mb-1 font-semibold">نسبة الالتزام بالشهر</p>
                      <p className="text-2xl font-black text-emerald-400 font-mono">{monthlySummary.stats.commitment_rate}%</p>
                    </div>
                    <div className="bg-obsidian-950 p-4 rounded-2xl border border-slate-800">
                      <p className="text-xs text-slate-400 mb-1 font-semibold">أيام الحضور والإنتاج</p>
                      <p className="text-2xl font-black text-sky-400 font-mono">{monthlySummary.stats.total_checkins}/{monthlySummary.stats.days_in_month}</p>
                    </div>
                    <div className="bg-obsidian-950 p-4 rounded-2xl border border-slate-800">
                      <p className="text-xs text-slate-400 mb-1 font-semibold">إجمالي الصفحات المقروءة</p>
                      <p className="text-2xl font-black text-amber-400 font-mono">{monthlySummary.stats.total_pages}</p>
                    </div>
                    <div className="bg-obsidian-950 p-4 rounded-2xl border border-slate-800">
                      <p className="text-xs text-slate-400 mb-1 font-semibold">غرامات مسجلة</p>
                      <p className="text-2xl font-black text-rose-400 font-mono">{monthlySummary.stats.total_fines} ج.م</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="glass-card p-10 rounded-3xl border border-slate-800 text-center text-slate-500">
                  <TrendingUp size={48} className="mx-auto mb-3 text-slate-600" />
                  <p className="text-sm font-extrabold text-white">لا يوجد ملخص شهري بعد</p>
                  <p className="text-xs text-slate-400 mt-1">يتم احتساب ملخص الإحصائيات تلقائياً بمرور أيقونات القراءة.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

