import { useState } from 'react';
import { Flame, CheckCircle, Trophy, BookOpen, Calendar, ShieldAlert, LogOut, Copy, Check, Loader2, Award, MessageSquare, Bell, Zap, TrendingUp, Wallet, Sparkles, ChevronRight, Settings, User as UserIcon } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { useNavigate } from 'react-router-dom';
import { useTodayStatus, useCheckinMutation } from '../hooks/useCheckin';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { getGroupDetails, Group } from '../api/groups';
import { getAllBadges, getUserBadges, getGroupTitles, Badge, UserBadge, WeeklyTitle } from '../api/gamification';
import { getMyNotifications, AppNotification } from '../api/notifications';
import { getActiveGroupBook as fetchActiveBook, GroupBook } from '../api/books';
import { getGroupVault as fetchGroupVault, FineVault } from '../api/fines';
import { getMonthlySummary, MonthlySummary } from '../api/stats';
import { useQuery } from '@tanstack/react-query';
import { WeeklyTitlesBanner } from '../components/WeeklyTitlesBanner';
import { BadgesModal } from '../components/BadgesModal';
import { NotificationCenterModal } from '../components/NotificationCenterModal';
import { NudgeButton } from '../components/NudgeButton';
import { WrappedModal } from '../components/WrappedModal';

export const Dashboard = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const activeGroupId = useUIStore((state) => state.activeGroupId);
  const navigate = useNavigate();

  const [copiedCode, setCopiedCode] = useState(false);
  const [pagesRead, setPagesRead] = useState('');
  const [note, setNote] = useState('');
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [showBadgesModal, setShowBadgesModal] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [showWrappedModal, setShowWrappedModal] = useState(false);

  // Queries
  const { data: group } = useQuery<Group>({
    queryKey: ['group', activeGroupId],
    queryFn: () => getGroupDetails(activeGroupId!),
    enabled: !!activeGroupId,
  });

  const { data: activeBook } = useQuery<GroupBook | null>({
    queryKey: ['activeBook', activeGroupId],
    queryFn: () => fetchActiveBook(activeGroupId!),
    enabled: !!activeGroupId,
  });

  const { data: vault } = useQuery<FineVault>({
    queryKey: ['vault', activeGroupId],
    queryFn: () => fetchGroupVault(activeGroupId!),
    enabled: !!activeGroupId,
  });

  const { data: allBadges } = useQuery<Badge[]>({
    queryKey: ['allBadges'],
    queryFn: getAllBadges,
  });

  const { data: userBadges } = useQuery<UserBadge[]>({
    queryKey: ['userBadges', user?.id],
    queryFn: () => getUserBadges(user!.id),
    enabled: !!user?.id,
  });

  const { data: groupTitles } = useQuery<WeeklyTitle[]>({
    queryKey: ['groupTitles', activeGroupId],
    queryFn: () => getGroupTitles(activeGroupId!),
    enabled: !!activeGroupId,
  });

  const { data: notifications } = useQuery<AppNotification[]>({
    queryKey: ['notifications'],
    queryFn: getMyNotifications,
  });

  const { data: monthlySummary } = useQuery<MonthlySummary | null>({
    queryKey: ['monthlySummary'],
    queryFn: () => getMonthlySummary(),
  });

  const unreadCount = notifications?.filter((n) => !n.is_read).length || 0;

  // Live Today Status & Leaderboard
  const { data: memberStatuses, isLoading: loadingStatus } = useTodayStatus(activeGroupId);
  const { data: leaderboard, isLoading: loadingLb } = useLeaderboard(activeGroupId);
  const checkinMutation = useCheckinMutation(activeGroupId);

  const currentUserStatus = memberStatuses?.find((m) => m.user.id === user?.id);
  const userStreak = currentUserStatus?.current_streak || 0;
  const userPagesToday = currentUserStatus?.checkin?.pages_read || 0;

  // XP Progress Calculation
  const userXp = user?.xp_points || 0;
  const userLevel = user?.level || 1;
  const xpInCurrentLevel = userXp % 200;
  const xpProgressPercent = Math.min(Math.round((xpInCurrentLevel / 200) * 100), 100);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCopyInviteCode = () => {
    if (group?.invite_code) {
      navigator.clipboard.writeText(group.invite_code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleQuickPageAdd = (amount: number) => {
    const current = pagesRead ? parseInt(pagesRead, 10) : 0;
    setPagesRead(String(current + amount));
  };

  const handleCheckinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    checkinMutation.mutate(
      {
        pages_read: pagesRead ? parseInt(pagesRead, 10) : undefined,
        note: note || undefined,
      },
      {
        onSuccess: () => {
          setShowCheckinModal(false);
          setPagesRead('');
          setNote('');

          confetti({
            particleCount: 100,
            spread: 80,
            origin: { y: 0.6 },
          });
        },
      }
    );
  };

  if (!activeGroupId) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
        <div className="glass-panel p-8 rounded-2xl max-w-md border border-slate-800 space-y-4">
          <BookOpen className="w-12 h-12 text-emerald-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">لم تنضم لأي مجموعة بعد</h2>
          <p className="text-slate-400 text-sm">أنشئ مجموعة جديدة أو انضم بكود دعوة للبدء في متابعة القراءة.</p>
          <button
            onClick={() => navigate('/onboarding')}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 font-semibold rounded-lg text-white shadow-lg shadow-emerald-900/30"
          >
            الانتقال للمجموعات
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24 selection:bg-emerald-500 selection:text-white">
      {/* Dynamic Background Glows */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed top-1/3 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-30 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          {/* Brand & User XP */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-lg shadow-emerald-900/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center font-bold text-emerald-400">
                📚
              </div>
            </div>
            <div>
              <div className="font-extrabold text-sm text-white flex items-center gap-2">
                {group?.name || 'Reading Club'}
                {group?.invite_code && (
                  <button
                    onClick={handleCopyInviteCode}
                    className="flex items-center gap-1 px-2 py-0.5 bg-slate-800/80 hover:bg-slate-700 rounded-md border border-slate-700 text-[10px] text-slate-300 font-mono transition-colors"
                    title="نسخ كود الدعوة"
                  >
                    {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
                    <span>{group.invite_code}</span>
                  </button>
                )}
              </div>
              {user && (
                <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                  <button
                    onClick={() => navigate('/profile')}
                    className="font-semibold text-slate-200 hover:text-emerald-400 flex items-center gap-1 transition-colors"
                    title="الملف الشخصي"
                  >
                    <UserIcon size={12} className="text-emerald-400" />
                    <span>{user.name}</span>
                  </button>
                  <div className="flex items-center gap-1.5 bg-slate-800/60 px-2 py-0.5 rounded-full border border-slate-700/60 text-[10px]">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span className="text-amber-300 font-bold">مستوى {userLevel}</span>
                    <div className="w-12 h-1.5 bg-slate-950 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full"
                        style={{ width: `${xpProgressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons & Streak */}
          <div className="flex items-center gap-2">
            {monthlySummary && (
              <button
                onClick={() => setShowWrappedModal(true)}
                className="p-2 bg-indigo-500/20 hover:bg-indigo-500/30 rounded-xl border border-indigo-500/40 text-indigo-300 transition-colors"
                title="حصاد الشهر Wrapped"
              >
                <Sparkles className="w-4 h-4 text-amber-400 animate-spin-slow" />
              </button>
            )}

            <button
              onClick={() => navigate('/settings')}
              className="p-2 bg-slate-800/80 hover:bg-slate-700/80 rounded-xl border border-slate-700/80 text-slate-300 transition-colors"
              title="إعدادات المجموعة"
            >
              <Settings className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowNotifModal(true)}
              className="p-2 bg-slate-800/80 hover:bg-slate-700/80 rounded-xl border border-slate-700/80 text-emerald-400 transition-colors relative"
              title="الإشعارات"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white font-bold text-[10px] rounded-full flex items-center justify-center animate-bounce shadow-md shadow-rose-900/50">
                  {unreadCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setShowBadgesModal(true)}
              className="p-2 bg-slate-800/80 hover:bg-slate-700/80 rounded-xl border border-slate-700/80 text-amber-400 transition-colors"
              title="معرض الأوسمة"
            >
              <Award className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 px-3 py-1.5 rounded-xl">
              <Flame className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse" />
              <span className="font-extrabold text-amber-400 text-xs font-mono">{userStreak}d Streak</span>
            </div>

            <button
              onClick={handleLogout}
              title="تسجيل الخروج"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-5xl mx-auto px-4 pt-6 space-y-6">
        {/* Weekly Titles Banner */}
        {groupTitles && <WeeklyTitlesBanner titles={groupTitles} />}

        {/* Hero Section: Active Book & Daily Reading CTA */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Book Card */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800/90 relative overflow-hidden flex flex-col justify-between group hover:border-emerald-500/40 transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-start justify-between">
              <div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[11px] font-semibold border border-emerald-500/20 mb-2">
                  <BookOpen className="w-3 h-3" /> الكتاب الحالي
                </span>
                <h3 className="font-extrabold text-lg text-white line-clamp-1">
                  {activeBook?.book.title || 'لم يتم تحديد كتاب بعد'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {activeBook ? `تأليف: ${activeBook.book.author}` : 'اضغط لإضافة كتاب للمجموعة'}
                </p>
              </div>

              <div className="w-12 h-16 bg-slate-900 border border-slate-700/80 rounded-lg flex items-center justify-center text-xl shadow-md shrink-0">
                📖
              </div>
            </div>

            {activeBook ? (
              <div className="space-y-3 pt-4 border-t border-slate-800/80 mt-4">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-amber-400" /> المعدل اليومي
                  </span>
                  <span className="font-bold text-amber-400 font-mono">
                    {activeBook.daily_target_pages} صفحة / يوم
                  </span>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1 font-mono">
                    <span>قراءتك اليوم: {userPagesToday} ص</span>
                    <span>الهدف: {activeBook.daily_target_pages} ص</span>
                  </div>
                  <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          Math.round((userPagesToday / (activeBook.daily_target_pages || 1)) * 100),
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => navigate('/books')}
                className="mt-4 w-full py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-emerald-400 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
              >
                تحديد كتاب الآن <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Daily Check-in Hero CTA */}
          <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800/90 relative overflow-hidden flex flex-col justify-between text-center md:text-right bg-gradient-to-br from-slate-900/90 via-slate-950 to-slate-950">
            <div className="absolute top-0 right-0 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 text-xs font-bold border border-emerald-500/20 mb-2">
                  <Sparkles className="w-3.5 h-3.5" /> الورد اليومي
                </span>
                <h2 className="text-2xl font-extrabold text-white">هل أتممت قراءتك اليوم؟</h2>
                <p className="text-slate-400 text-xs mt-1 max-w-md">
                  سجل قراءتك اليومية لرفع نسبة التزامك وضمان حماية رصيدك من الغرامة وتجاوز أعضاء المجموعة!
                </p>
              </div>

              {currentUserStatus?.has_checked_in ? (
                <div className="w-full md:w-auto py-3.5 px-6 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  تم تسجيل ورد اليوم بنجاح 🎉
                </div>
              ) : (
                <button
                  onClick={() => setShowCheckinModal(true)}
                  className="w-full md:w-auto py-3.5 px-8 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-white font-extrabold text-base rounded-xl shadow-xl shadow-emerald-950/60 active:scale-95 transition-all flex items-center justify-center gap-2 shrink-0"
                >
                  <CheckCircle className="w-5 h-5" />
                  تسجيل الورد الآن
                </button>
              )}
            </div>

            {/* Quick Stat Highlights */}
            <div className="grid grid-cols-3 gap-3 mt-6 pt-4 border-t border-slate-800/80">
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-center">
                <span className="block text-[11px] text-slate-400">قراءتك اليوم</span>
                <span className="font-extrabold text-emerald-400 font-mono text-base">{userPagesToday} صفحة</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-center">
                <span className="block text-[11px] text-slate-400">الـ Streak الحالي</span>
                <span className="font-extrabold text-amber-400 font-mono text-base">🔥 {userStreak} أيام</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-center">
                <span className="block text-[11px] text-slate-400">حصيلة الخزينة</span>
                <span className="font-extrabold text-sky-400 font-mono text-base">{vault?.total_amount || 0} ج.م</span>
              </div>
            </div>
          </div>
        </section>

        {/* 4 Metric Quick Stat Cards */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-panel p-4 rounded-2xl border border-slate-800/80 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">نسبة الالتزام</span>
              <span className="font-extrabold text-white font-mono text-base">
                {leaderboard?.find((l) => l.user.id === user?.id)?.commitment_rate || 100}%
              </span>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-slate-800/80 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Flame className="w-5 h-5 fill-amber-400" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">أطول Streak</span>
              <span className="font-extrabold text-white font-mono text-base">
                {leaderboard?.find((l) => l.user.id === user?.id)?.longest_streak || userStreak} أيام
              </span>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-slate-800/80 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">إجمالي الصفحات</span>
              <span className="font-extrabold text-white font-mono text-base">
                {leaderboard?.find((l) => l.user.id === user?.id)?.total_pages_read || 0} ص
              </span>
            </div>
          </div>

          <div
            onClick={() => navigate('/vault')}
            className="glass-panel p-4 rounded-2xl border border-slate-800/80 flex items-center gap-3 cursor-pointer hover:border-amber-500/40 transition-colors"
          >
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">خزينة الغرامات</span>
              <span className="font-extrabold text-amber-400 font-mono text-base">
                {vault?.total_amount || 0} EGP
              </span>
            </div>
          </div>
        </section>

        {/* Dashboard Main Grid: Leaderboard & Member Attendance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Commitment Leaderboard */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800/90 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2 font-extrabold text-white text-sm">
                <Trophy className="w-5 h-5 text-amber-400" />
                متصدري الالتزام بالجماعة
              </div>
              <span className="text-xs text-slate-400 font-mono">الالتزام %</span>
            </div>

            {loadingLb ? (
              <div className="text-center py-8 text-slate-500 text-sm flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" /> جاري تحميل اللوحة...
              </div>
            ) : leaderboard && leaderboard.length > 0 ? (
              <div className="space-y-3">
                {leaderboard.map((entry) => (
                  <div
                    key={entry.user.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      entry.rank === 1
                        ? 'bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 border-amber-500/30 shadow-md shadow-amber-950/20'
                        : entry.rank === 2
                        ? 'bg-gradient-to-r from-slate-400/10 via-slate-900 to-slate-900 border-slate-700/60'
                        : entry.rank === 3
                        ? 'bg-gradient-to-r from-amber-700/10 via-slate-900 to-slate-900 border-amber-700/40'
                        : 'bg-slate-900/60 border-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 text-center font-extrabold text-xs">
                        {entry.rank === 1 ? (
                          <span className="text-lg">🥇</span>
                        ) : entry.rank === 2 ? (
                          <span className="text-lg">🥈</span>
                        ) : entry.rank === 3 ? (
                          <span className="text-lg">🥉</span>
                        ) : (
                          <span className="text-slate-400 font-mono">#{entry.rank}</span>
                        )}
                      </div>

                      <div>
                        <div className="font-bold text-sm text-white flex items-center gap-1.5">
                          {entry.user.name}
                          {entry.user.id === user?.id && (
                            <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded font-semibold">أنت</span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-1 text-amber-400 font-mono">🔥 {entry.current_streak}d</span>
                          <span>•</span>
                          <span className="font-mono">{entry.total_pages_read} صفحة</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono font-extrabold text-emerald-400 text-sm">
                        {entry.commitment_rate}%
                      </div>
                      <div className="w-16 h-1.5 bg-slate-950 rounded-full overflow-hidden mt-1 border border-slate-800">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${entry.commitment_rate}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 text-sm">
                لا يوجد سجلات بعد لهذه المجموعة
              </div>
            )}
          </div>

          {/* Members Today Status */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800/90 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2 font-extrabold text-white text-sm">
                <Calendar className="w-5 h-5 text-emerald-400" />
                حالة قراءة الأعضاء اليوم
              </div>
              <span className="text-xs text-slate-400 font-mono">{group?.members_count || 0} عضو</span>
            </div>

            {loadingStatus ? (
              <div className="text-center py-8 text-slate-500 text-sm flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" /> جاري تحميل الحالة...
              </div>
            ) : memberStatuses && memberStatuses.length > 0 ? (
              <div className="space-y-2.5">
                {memberStatuses.map((m) => (
                  <div
                    key={m.user.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800/80"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 font-bold flex items-center justify-center text-xs">
                        {m.user.name[0]}
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-slate-200">{m.user.name}</div>
                        {m.checkin?.pages_read && (
                          <div className="text-[10px] text-slate-400 font-mono">قرأ {m.checkin.pages_read} صفحة</div>
                        )}
                      </div>
                    </div>

                    {m.has_checked_in ? (
                      <span className="text-xs font-bold px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> تم القراءة
                      </span>
                    ) : (
                      <div className="flex items-center gap-2">
                        {user && m.user.id !== user.id && activeGroupId ? (
                          <NudgeButton
                            groupId={activeGroupId}
                            toUserId={m.user.id}
                            toUserName={m.user.name}
                            hasCheckedIn={false}
                          />
                        ) : (
                          <span className="text-xs font-semibold px-3 py-1 bg-rose-500/10 text-rose-400 rounded-full border border-rose-500/20">
                            لم يقرأ بعد
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 text-sm">
                لا يوجد أعضاء في المجموعة
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Checkin Modal */}
      {showCheckinModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-2xl max-w-md w-full border border-slate-800 space-y-4 shadow-2xl">
            <div className="text-center space-y-1">
              <h3 className="text-xl font-bold text-white">تسجيل ورد اليوم 📖</h3>
              <p className="text-slate-400 text-xs">حدد الصفحات التي قرأتها لإكمال المهمة اليومية</p>
            </div>

            <form onSubmit={handleCheckinSubmit} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">عدد الصفحات التي قرأتها</label>

                {/* Quick Add Buttons */}
                <div className="flex gap-2 mb-2">
                  {[5, 10, 15, 20].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleQuickPageAdd(num)}
                      className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 text-emerald-400 font-bold text-xs rounded-lg border border-slate-700/80 transition-colors"
                    >
                      +{num}
                    </button>
                  ))}
                </div>

                <input
                  type="number"
                  min="1"
                  value={pagesRead}
                  onChange={(e) => setPagesRead(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm font-mono focus:outline-none focus:border-emerald-500"
                  placeholder="أدخل عدد الصفحات (مثال: 15)"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">فائدة أو ملاحظة (اختياري)</label>
                <input
                  type="text"
                  maxLength={280}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                  placeholder="مثال: فصل بناء العادات في كتاب العادات الذرية"
                />
              </div>

              {checkinMutation.isError && (
                <div className="text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20 text-center">
                  {(checkinMutation.error as any)?.response?.data?.detail || 'حدث خطأ أثناء التسجيل'}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCheckinModal(false)}
                  className="w-1/2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl text-sm"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={checkinMutation.isPending}
                  className="w-1/2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 disabled:opacity-50"
                >
                  {checkinMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'تأكيد الورد'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Badges Modal */}
      {showBadgesModal && allBadges && userBadges && (
        <BadgesModal
          allBadges={allBadges}
          userBadges={userBadges}
          onClose={() => setShowBadgesModal(false)}
        />
      )}

      {/* Notification Center Modal */}
      {showNotifModal && notifications && (
        <NotificationCenterModal
          notifications={notifications}
          onClose={() => setShowNotifModal(false)}
        />
      )}

      {/* Wrapped Summary Modal */}
      {showWrappedModal && monthlySummary && user && (
        <WrappedModal
          summary={monthlySummary}
          userName={user.name}
          onClose={() => setShowWrappedModal(false)}
        />
      )}

      {/* Bottom Navigation for Mobile & Desktop */}
      <nav className="fixed bottom-0 left-0 right-0 border-t border-slate-800/80 bg-slate-900/90 backdrop-blur-xl px-2 py-2.5 z-20 shadow-2xl">
        <div className="max-w-md mx-auto flex justify-around items-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex flex-col items-center gap-1 text-emerald-400 font-bold text-[11px]"
          >
            <BookOpen className="w-5 h-5" />
            الرئيسية
          </button>
          <button
            onClick={() => navigate('/books')}
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-200 text-[11px] font-medium"
          >
            <BookOpen className="w-5 h-5 text-amber-400" />
            الكتاب
          </button>
          <button
            onClick={() => navigate('/discussions')}
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-200 text-[11px] font-medium"
          >
            <MessageSquare className="w-5 h-5 text-sky-400" />
            النقاشات
          </button>
          <button
            onClick={() => navigate('/calendar')}
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-200 text-[11px] font-medium"
          >
            <Calendar className="w-5 h-5 text-emerald-400" />
            التقويم
          </button>
          <button
            onClick={() => navigate('/vault')}
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-200 text-[11px] font-medium"
          >
            <ShieldAlert className="w-5 h-5 text-amber-500" />
            الخزينة
          </button>
          <button
            onClick={() => navigate('/profile')}
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-200 text-[11px] font-medium"
          >
            <UserIcon className="w-5 h-5 text-indigo-400" />
            حسابي
          </button>
        </div>
      </nav>
    </div>
  );
};
