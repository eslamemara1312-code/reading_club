import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, CheckCircle, Trophy, BookOpen, Calendar, Loader2, Zap, TrendingUp, Wallet, Sparkles, ChevronRight } from 'lucide-react';
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
import { Navbar } from '../components/Navbar';
import { WeeklyTitlesBanner } from '../components/WeeklyTitlesBanner';
import { BadgesModal } from '../components/BadgesModal';
import { NotificationCenterModal } from '../components/NotificationCenterModal';
import { NudgeButton } from '../components/NudgeButton';
import { WrappedModal } from '../components/WrappedModal';

export const Dashboard = () => {
  const user = useAuthStore((state) => state.user);
  const activeGroupId = useUIStore((state) => state.activeGroupId);
  const navigate = useNavigate();

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

  // Live Today Status & Leaderboard
  const { data: memberStatuses, isLoading: loadingStatus } = useTodayStatus(activeGroupId);
  const { data: leaderboard, isLoading: loadingLb } = useLeaderboard(activeGroupId);
  const checkinMutation = useCheckinMutation(activeGroupId);

  const currentUserStatus = memberStatuses?.find((m) => m.user.id === user?.id);
  const userStreak = currentUserStatus?.current_streak || 0;
  const userPagesToday = currentUserStatus?.checkin?.pages_read || 0;

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
            particleCount: 120,
            spread: 90,
            origin: { y: 0.6 },
          });
        },
      }
    );
  };

  if (!activeGroupId) {
    return (
      <div className="min-h-screen bg-obsidian-950 flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">
        <div className="glow-orb w-96 h-96 bg-emerald-500/20 top-1/4" />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel p-8 rounded-3xl max-w-md border border-slate-800 space-y-5 shadow-2xl relative z-10"
        >
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30 shadow-glow-emerald">
            <BookOpen className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-white">لم تنضم لأي مجموعة قراءة بعد</h2>
          <p className="text-slate-400 text-xs leading-relaxed">
            أنشئ مجموعة جديدة أو انضم عبر كود الدعوة للبدء في متابعة ورد القراءة مع أصحابك.
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/onboarding')}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 font-extrabold rounded-xl text-white text-sm shadow-lg shadow-emerald-950/50"
          >
            الانتقال للمجموعات
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-obsidian-950 text-slate-100 pb-32 lg:pb-12 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="glow-orb w-96 h-96 bg-emerald-500/10 top-0 left-1/4 animate-pulse-subtle" />
      <div className="glow-orb w-96 h-96 bg-amber-500/10 top-1/3 right-1/4 animate-pulse-subtle" />

      {/* Modern Sticky Navigation */}
      <Navbar
        onOpenNotifications={() => setShowNotifModal(true)}
        onOpenBadges={() => setShowBadgesModal(true)}
      />

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 pt-6 space-y-6 relative z-10">
        {/* Weekly Titles Banner */}
        {groupTitles && <WeeklyTitlesBanner titles={groupTitles} />}

        {/* Hero Section: Active Book & Daily Reading CTA */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Book Card */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="glass-card p-6 rounded-3xl relative overflow-hidden flex flex-col justify-between group"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 text-xs font-bold border border-emerald-500/20 mb-3">
                  <BookOpen className="w-3.5 h-3.5" /> الكتاب الحالي
                </span>
                <h3 className="font-extrabold text-lg text-white line-clamp-1">
                  {activeBook?.book.title || 'لم يتم تحديد كتاب بعد'}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {activeBook ? `تأليف: ${activeBook.book.author}` : 'اضغط لإضافة كتاب للمجموعة'}
                </p>
              </div>

              <div className="w-14 h-18 bg-slate-900 border border-slate-700/80 rounded-xl flex items-center justify-center text-2xl shadow-xl shrink-0">
                📖
              </div>
            </div>

            {activeBook ? (
              <div className="space-y-3.5 pt-4 border-t border-slate-800/80 mt-5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-amber-400" /> المعدل اليومي
                  </span>
                  <span className="font-extrabold text-amber-300 font-mono">
                    {activeBook.daily_target_pages} صفحة / يوم
                  </span>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1.5 font-mono">
                    <span>قراءتك اليوم: <strong className="text-white">{userPagesToday} ص</strong></span>
                    <span>الهدف: <strong className="text-emerald-400">{activeBook.daily_target_pages} ص</strong></span>
                  </div>
                  <div className="w-full h-2.5 bg-obsidian-900 rounded-full overflow-hidden border border-slate-800">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min(
                          Math.round((userPagesToday / (activeBook.daily_target_pages || 1)) * 100),
                          100
                        )}%`,
                      }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 rounded-full"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/books')}
                className="mt-5 w-full py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-emerald-400 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
              >
                تحديد كتاب الآن <ChevronRight className="w-4 h-4" />
              </motion.button>
            )}
          </motion.div>

          {/* Daily Check-in Hero CTA */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="lg:col-span-2 glass-card p-6 rounded-3xl relative overflow-hidden flex flex-col justify-between text-center md:text-right bg-gradient-to-br from-slate-900/90 via-slate-950 to-obsidian-950"
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-5">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-xs font-extrabold border border-emerald-500/30 mb-3 shadow-glow-emerald">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> الورد اليومي
                </span>
                <h2 className="text-2xl font-black text-white tracking-tight">هل أتممت قراءتك اليوم؟</h2>
                <p className="text-slate-400 text-xs mt-1.5 max-w-md leading-relaxed">
                  سجل ورد قراءتك اليومية لرفع الـ Streak وتجنب الغرامة المالية في الخزينة!
                </p>
              </div>

              {currentUserStatus?.has_checked_in ? (
                <motion.div
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  className="w-full md:w-auto py-3.5 px-6 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-bold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-glow-emerald"
                >
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                  تم تسجيل الورد بنجاح 🎉
                </motion.div>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setShowCheckinModal(true)}
                  className="w-full md:w-auto py-4 px-8 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-sm rounded-2xl shadow-xl shadow-emerald-950/60 transition-all flex items-center justify-center gap-2 shrink-0"
                >
                  <CheckCircle className="w-5 h-5" />
                  تسجيل الورد الآن
                </motion.button>
              )}
            </div>

            {/* Quick Stat Highlights */}
            <div className="grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-slate-800/80">
              <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-center">
                <span className="block text-[11px] font-semibold text-slate-400">قراءتك اليوم</span>
                <span className="font-extrabold text-emerald-400 font-mono text-base">{userPagesToday} صفحة</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-center">
                <span className="block text-[11px] font-semibold text-slate-400">سلسلة الأيام Streak</span>
                <span className="font-extrabold text-amber-400 font-mono text-base flex items-center justify-center gap-1">
                  <Flame className="w-4 h-4 text-amber-400 animate-flame-bounce" /> {userStreak}d
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-center">
                <span className="block text-[11px] font-semibold text-slate-400">رصيد الخزينة</span>
                <span className="font-extrabold text-sky-400 font-mono text-base">{vault?.total_amount || 0} ج.م</span>
              </div>
            </div>
          </motion.div>
        </section>

        {/* 4 Metric Quick Stat Cards */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div whileHover={{ translateY: -3 }} className="glass-card p-4 rounded-2xl border border-slate-800/80 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-semibold">نسبة الالتزام</span>
              <span className="font-black text-white font-mono text-base">
                {leaderboard?.find((l) => l.user.id === user?.id)?.commitment_rate || 100}%
              </span>
            </div>
          </motion.div>

          <motion.div whileHover={{ translateY: -3 }} className="glass-card p-4 rounded-2xl border border-slate-800/80 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Flame className="w-5 h-5 text-amber-400 fill-amber-400 animate-pulse" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-semibold">أعلى Streak</span>
              <span className="font-black text-white font-mono text-base">
                {leaderboard?.find((l) => l.user.id === user?.id)?.longest_streak || userStreak} يوم
              </span>
            </div>
          </motion.div>

          <motion.div whileHover={{ translateY: -3 }} className="glass-card p-4 rounded-2xl border border-slate-800/80 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-semibold">إجمالي الصفحات</span>
              <span className="font-black text-white font-mono text-base">
                {leaderboard?.find((l) => l.user.id === user?.id)?.total_pages_read || 0} ص
              </span>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ translateY: -3 }}
            onClick={() => navigate('/vault')}
            className="glass-card p-4 rounded-2xl border border-slate-800/80 flex items-center gap-3 cursor-pointer hover:border-amber-500/40"
          >
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-semibold">خزينة الغرامات</span>
              <span className="font-black text-amber-400 font-mono text-base">
                {vault?.total_amount || 0} EGP
              </span>
            </div>
          </motion.div>
        </section>

        {/* Dashboard Main Grid: Leaderboard & Member Attendance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Commitment Leaderboard */}
          <div className="glass-card p-6 rounded-3xl border border-slate-800/90 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3.5">
              <div className="flex items-center gap-2 font-extrabold text-white text-sm">
                <Trophy className="w-5 h-5 text-amber-400" />
                متصدري الالتزام بالحضور
              </div>
              <span className="text-xs text-slate-400 font-mono">نسبة الالتزام %</span>
            </div>

            {loadingLb ? (
              <div className="text-center py-8 text-slate-500 text-xs flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" /> جاري تحميل المتصدرين...
              </div>
            ) : leaderboard && leaderboard.length > 0 ? (
              <div className="space-y-3">
                {leaderboard.map((entry, idx) => (
                  <motion.div
                    key={entry.user.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    whileHover={{ scale: 1.01 }}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                      entry.rank === 1
                        ? 'bg-gradient-to-r from-amber-500/15 via-slate-900 to-obsidian-900 border-amber-500/40 shadow-glow-amber'
                        : entry.rank === 2
                        ? 'bg-gradient-to-r from-slate-300/10 via-slate-900 to-obsidian-900 border-slate-600/60'
                        : entry.rank === 3
                        ? 'bg-gradient-to-r from-amber-700/15 via-slate-900 to-obsidian-900 border-amber-700/40'
                        : 'bg-slate-900/60 border-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 text-center font-extrabold text-xs shrink-0">
                        {entry.rank === 1 ? (
                          <span className="text-xl">🥇</span>
                        ) : entry.rank === 2 ? (
                          <span className="text-xl">🥈</span>
                        ) : entry.rank === 3 ? (
                          <span className="text-xl">🥉</span>
                        ) : (
                          <span className="text-slate-400 font-mono">#{entry.rank}</span>
                        )}
                      </div>

                      <div>
                        <div className="font-bold text-sm text-white flex items-center gap-1.5">
                          {entry.user.name}
                          {entry.user.id === user?.id && (
                            <span className="text-[10px] px-2 py-0.2 bg-emerald-500/20 text-emerald-300 rounded-full font-bold">أنت</span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5 font-mono">
                          <span className="flex items-center gap-1 text-amber-300 font-bold">🔥 {entry.current_streak}d</span>
                          <span>•</span>
                          <span>{entry.total_pages_read} صفحة</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono font-black text-emerald-400 text-sm">
                        {entry.commitment_rate}%
                      </div>
                      <div className="w-16 h-1.5 bg-obsidian-900 rounded-full overflow-hidden mt-1 border border-slate-800">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${entry.commitment_rate}%` }}
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 text-xs">
                لا يوجد سجلات بعد لهذه المجموعة
              </div>
            )}
          </div>

          {/* Members Today Status */}
          <div className="glass-card p-6 rounded-3xl border border-slate-800/90 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3.5">
              <div className="flex items-center gap-2 font-extrabold text-white text-sm">
                <Calendar className="w-5 h-5 text-emerald-400" />
                حالة قراءة الأعضاء اليوم
              </div>
              <span className="text-xs text-slate-400 font-mono">{group?.members_count || 0} عضو</span>
            </div>

            {loadingStatus ? (
              <div className="text-center py-8 text-slate-500 text-xs flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" /> جاري تحميل حالة اليوم...
              </div>
            ) : memberStatuses && memberStatuses.length > 0 ? (
              <div className="space-y-3">
                {memberStatuses.map((m, idx) => (
                  <motion.div
                    key={m.user.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 text-white font-bold flex items-center justify-center text-xs">
                        {m.user.name[0]}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-200">{m.user.name}</div>
                        {m.checkin?.pages_read && (
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">قرأ {m.checkin.pages_read} صفحة</div>
                        )}
                      </div>
                    </div>

                    {m.has_checked_in ? (
                      <span className="text-xs font-bold px-3 py-1 bg-emerald-500/10 text-emerald-300 rounded-full border border-emerald-500/20 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> تم القراءة
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
                          <span className="text-xs font-bold px-3 py-1 bg-rose-500/10 text-rose-300 rounded-full border border-rose-500/20">
                            لم يقرأ بعد
                          </span>
                        )}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 text-xs">
                لا يوجد أعضاء بالمجموعة
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Checkin Modal */}
      <AnimatePresence>
        {showCheckinModal && (
          <div className="fixed inset-0 bg-obsidian-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className="glass-panel p-6 rounded-3xl max-w-md w-full border border-slate-700/80 space-y-4 shadow-2xl"
            >
              <div className="text-center space-y-1">
                <h3 className="text-xl font-extrabold text-white">تسجيل ورد القراءة اليومي 📖</h3>
                <p className="text-slate-400 text-xs">حدد الصفحات المقروءة لإكمال مهمة اليوم</p>
              </div>

              <form onSubmit={handleCheckinSubmit} className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">عدد الصفحات التي قرأتها</label>

                  {/* Quick Add Buttons */}
                  <div className="flex gap-2 mb-2.5">
                    {[5, 10, 15, 20].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => handleQuickPageAdd(num)}
                        className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-emerald-400 font-bold text-xs rounded-xl border border-slate-700/80 transition-colors"
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
                    className="w-full px-4 py-3 bg-obsidian-950 border border-slate-700 rounded-xl text-white text-xs font-mono focus:border-emerald-500 outline-none"
                    placeholder="أدخل عدد الصفحات (مثال: 15)"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">فائدة أو تدوينة بسيطة (اختياري)</label>
                  <input
                    type="text"
                    maxLength={280}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full px-4 py-3 bg-obsidian-950 border border-slate-700 rounded-xl text-white text-xs focus:border-emerald-500 outline-none"
                    placeholder="مثال: فائدة رائعة من الفصل الثالث"
                  />
                </div>

                {checkinMutation.isError && (
                  <div className="text-xs text-rose-300 bg-rose-950/60 p-3 rounded-xl border border-rose-500/30 text-center font-semibold">
                    {(checkinMutation.error as any)?.response?.data?.detail || 'حدث خطأ أثناء تسجيل الورد'}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCheckinModal(false)}
                    className="w-1/2 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={checkinMutation.isPending}
                    className="w-1/2 py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 disabled:opacity-50"
                  >
                    {checkinMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : 'تأكيد الورد 🚀'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
    </div>
  );
};

