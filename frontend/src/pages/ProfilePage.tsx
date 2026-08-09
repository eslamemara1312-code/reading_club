import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Flame, Trophy, BookOpen, Award, Zap, Calendar, TrendingUp, Sparkles, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { getAllBadges, getUserBadges } from '../api/gamification';
import { getMonthlySummary } from '../api/stats';

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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 to-transparent"></div>
        <div className="relative px-4 pt-4 pb-6">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 bg-slate-800/60 hover:bg-slate-700/60 rounded-full border border-slate-700/50 text-slate-300 transition-all"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-lg font-bold text-white">الملف الشخصي</h1>
            <button
              onClick={handleLogout}
              className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-full border border-red-500/30 text-red-400 transition-all"
            >
              <LogOut size={20} />
            </button>
          </div>

          {/* Avatar & Level Card */}
          <div className="flex flex-col items-center">
            <div className="relative mb-4">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-3xl font-bold text-white shadow-lg shadow-emerald-500/25 ring-4 ring-emerald-500/20">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  user.name?.charAt(0)?.toUpperCase()
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full px-2.5 py-0.5 text-xs font-bold text-white shadow-lg">
                Lv.{user.level}
              </div>
            </div>
            <h2 className="text-xl font-bold text-white mb-0.5">{user.name}</h2>
            <p className="text-emerald-400 text-sm font-medium mb-1">{levelTitle}</p>
            <p className="text-slate-500 text-xs">{user.email}</p>

            {/* XP Progress Bar */}
            <div className="w-full max-w-xs mt-4">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span className="flex items-center gap-1"><Zap size={12} className="text-amber-400" /> {user.xp_points} XP</span>
                <span>{xpForNextLevel} XP</span>
              </div>
              <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700"
                  style={{ width: `${xpProgress}%` }}
                ></div>
              </div>
              <p className="text-center text-xs text-slate-500 mt-1">
                {Math.round(xpForNextLevel - user.xp_points)} XP للمستوى التالي
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="px-4 -mt-2">
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-slate-800/60 backdrop-blur border border-slate-700/50 rounded-xl p-3 text-center">
            <Flame size={20} className="text-orange-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-white">{monthlySummary?.stats?.longest_streak || 0}</p>
            <p className="text-xs text-slate-400">أطول سلسلة</p>
          </div>
          <div className="bg-slate-800/60 backdrop-blur border border-slate-700/50 rounded-xl p-3 text-center">
            <BookOpen size={20} className="text-blue-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-white">{monthlySummary?.stats?.total_pages || 0}</p>
            <p className="text-xs text-slate-400">صفحة</p>
          </div>
          <div className="bg-slate-800/60 backdrop-blur border border-slate-700/50 rounded-xl p-3 text-center">
            <Trophy size={20} className="text-amber-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-white">{userBadges?.length || 0}</p>
            <p className="text-xs text-slate-400">وسام</p>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="px-4 mb-4">
        <div className="flex bg-slate-800/50 rounded-xl p-1 border border-slate-700/50">
          <button
            onClick={() => setActiveTab('badges')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'badges'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <Award size={16} className="inline mr-1.5" />
            الأوسمة
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'stats'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <TrendingUp size={16} className="inline mr-1.5" />
            إحصائياتي
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-24">
        {activeTab === 'badges' && (
          <div className="space-y-3">
            {allBadges?.map(badge => {
              const earned = earnedBadgeIds.has(badge.id);
              const earnedInfo = userBadges?.find(ub => ub.badge_id === badge.id);
              return (
                <div
                  key={badge.id}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all ${
                    earned
                      ? 'bg-gradient-to-r from-amber-500/10 to-orange-500/5 border-amber-500/30'
                      : 'bg-slate-800/30 border-slate-700/30 opacity-50'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                    earned ? 'bg-amber-500/20' : 'bg-slate-700/50'
                  }`}>
                    {BADGE_ICONS[badge.slug] || badge.icon || '🏅'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`font-semibold text-sm ${earned ? 'text-white' : 'text-slate-500'}`}>
                        {badge.name}
                      </p>
                      {earned && <Sparkles size={14} className="text-amber-400" />}
                    </div>
                    <p className="text-xs text-slate-400 truncate">{badge.description}</p>
                    {earned && earnedInfo && (
                      <p className="text-xs text-emerald-400 mt-0.5">
                        حصلت عليه {new Date(earnedInfo.earned_at).toLocaleDateString('ar-EG')}
                      </p>
                    )}
                  </div>
                  <div className={`text-xs font-bold px-2 py-1 rounded-lg ${
                    earned ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700/50 text-slate-500'
                  }`}>
                    +{badge.xp_award} XP
                  </div>
                </div>
              );
            })}
            {(!allBadges || allBadges.length === 0) && (
              <div className="text-center py-12 text-slate-500">
                <Award size={48} className="mx-auto mb-3 opacity-30" />
                <p>لا توجد أوسمة متاحة بعد</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'stats' && monthlySummary && (
          <div className="space-y-3">
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Calendar size={16} className="text-emerald-400" />
                ملخص الشهر الماضي
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-900/50 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-1">نسبة الالتزام</p>
                  <p className="text-xl font-bold text-emerald-400">{monthlySummary.stats.commitment_rate}%</p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-1">أيام الحضور</p>
                  <p className="text-xl font-bold text-blue-400">{monthlySummary.stats.total_checkins}/{monthlySummary.stats.days_in_month}</p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-1">صفحات مقروءة</p>
                  <p className="text-xl font-bold text-purple-400">{monthlySummary.stats.total_pages}</p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-1">إجمالي الغرامات</p>
                  <p className="text-xl font-bold text-red-400">{monthlySummary.stats.total_fines} ج.م</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stats' && !monthlySummary && (
          <div className="text-center py-12 text-slate-500">
            <TrendingUp size={48} className="mx-auto mb-3 opacity-30" />
            <p>لا يوجد ملخص شهري بعد</p>
            <p className="text-xs mt-1">يتم إنشاؤه تلقائياً في بداية كل شهر</p>
          </div>
        )}
      </div>
    </div>
  );
}
