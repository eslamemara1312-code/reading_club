/*
===============================================================================
 خريطة الوظائف المحفوظة (Preserved Functionality Map) — Dashboard.tsx
===============================================================================
1. State Store / Auth & UI:
   - user: useAuthStore((state) => state.user)
   - activeGroupId: useUIStore((state) => state.activeGroupId)
   - navigate: useNavigate()

2. Queries:
   - group: getGroupDetails(activeGroupId!) [Key: 'group', activeGroupId]
   - activeBook: getActiveGroupBook(activeGroupId!) [Key: 'activeBook', activeGroupId]
   - vault: getGroupVault(activeGroupId!) [Key: 'vault', activeGroupId]
   - allBadges: getAllBadges() [Key: 'allBadges']
   - userBadges: getUserBadges(user.id) [Key: 'userBadges', user.id]
   - groupTitles: getGroupTitles(activeGroupId!) [Key: 'groupTitles', activeGroupId]
   - notifications: getMyNotifications() [Key: 'notifications']
   - monthlySummary: getMonthlySummary() [Key: 'monthlySummary']
   - memberStatuses: useTodayStatus(activeGroupId)
   - leaderboard: useLeaderboard(activeGroupId)

3. Mutations & Handlers:
   - checkinMutation: useCheckinMutation(activeGroupId)
   - undoCheckinMutation: useUndoCheckinMutation(activeGroupId)
   - updateCheckinMutation: useUpdateCheckinMutation(activeGroupId)
   - handleCheckinSubmit: submits pages_read & note, triggers confetti & invalidates queries
   - handleUndoConfirm: triggers undoCheckinMutation
   - handleAddMorePages: triggers updateCheckinMutation with additional_pages
   - handleQuickPageAdd: increments pagesRead input value

4. Computed Derived Values:
   - currentUserStatus: memberStatuses?.find(m => m.user.id === user?.id)
   - userStreak: currentUserStatus?.current_streak || 0
   - userPagesToday: currentUserStatus?.checkin?.pages_read || 0
   - checkedInCount: memberStatuses?.filter(m => m.has_checked_in).length || 0
   - totalMembersCount: memberStatuses?.length || group?.members_count || 1
   - clubParticipationPercent: Math.round((checkedInCount / totalMembersCount) * 100)

5. Modals & Conditional Logic:
   - if (!activeGroupId): render onboarding redirect prompt
   - showCheckinModal, showUndoModal, showEditPagesModal, showBadgesModal, showNotifModal, showWrappedModal
===============================================================================
*/

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, CheckCircle2, RotateCcw, Edit3, Loader2, ChevronLeft
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { useTodayStatus, useCheckinMutation, useUndoCheckinMutation, useUpdateCheckinMutation } from '../hooks/useCheckin';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { getGroupDetails, Group } from '../api/groups';
import { getAllBadges, getUserBadges, getGroupTitles, Badge, UserBadge, WeeklyTitle } from '../api/gamification';
import { getMyNotifications, AppNotification } from '../api/notifications';
import { useQuery } from '@tanstack/react-query';
import { getActiveGroupBook, GroupBook } from '../api/books';
import { getGroupVault, FineVault } from '../api/fines';
import { getMonthlySummary, MonthlySummary } from '../api/stats';
import { NudgeButton } from '../components/NudgeButton';
import { BadgesModal } from '../components/BadgesModal';
import { NotificationCenterModal } from '../components/NotificationCenterModal';
import { WrappedModal } from '../components/WrappedModal';
import { WeeklyTitlesBanner } from '../components/WeeklyTitlesBanner';
import { Navbar } from '../components/Navbar';

export const Dashboard = () => {
  const { user } = useAuthStore();
  const activeGroupId = useUIStore((state) => state.activeGroupId);
  const navigate = useNavigate();

  // Modals & form states
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [showUndoModal, setShowUndoModal] = useState(false);
  const [pagesRead, setPagesRead] = useState('20');
  const [note, setNote] = useState('');

  const [showEditPagesModal, setShowEditPagesModal] = useState(false);
  const [additionalPages, setAdditionalPages] = useState('10');

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
    queryFn: () => getActiveGroupBook(activeGroupId!),
    enabled: !!activeGroupId,
  });

  const { data: vault } = useQuery<FineVault>({
    queryKey: ['vault', activeGroupId],
    queryFn: () => getGroupVault(activeGroupId!),
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
  const { data: leaderboard } = useLeaderboard(activeGroupId);
  const checkinMutation = useCheckinMutation(activeGroupId);
  const undoCheckinMutation = useUndoCheckinMutation(activeGroupId);
  const updateCheckinMutation = useUpdateCheckinMutation(activeGroupId);

  const currentUserStatus = memberStatuses?.find((m) => m.user.id === user?.id);
  const userStreak = currentUserStatus?.current_streak || 0;
  const userPagesToday = currentUserStatus?.checkin?.pages_read || 0;

  const checkedInCount = memberStatuses?.filter((m) => m.has_checked_in).length || 0;
  const totalMembersCount = memberStatuses?.length || group?.members_count || 1;
  const clubParticipationPercent = Math.round((checkedInCount / totalMembersCount) * 100);

  const userStatsInLb = leaderboard?.find((l) => l.user.id === user?.id);
  const userTotalPages = userStatsInLb?.total_pages_read || 0;
  const userMaxStreak = userStatsInLb?.longest_streak || userStreak;

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
            colors: ['#D9A441', '#C96F4A', '#7C9A72'],
          });
        },
      }
    );
  };

  const handleUndoConfirm = () => {
    undoCheckinMutation.mutate(undefined, {
      onSuccess: () => {
        setShowUndoModal(false);
      },
    });
  };

  const handleAddMorePages = (e: React.FormEvent) => {
    e.preventDefault();
    const count = parseInt(additionalPages, 10);
    if (!count || count <= 0) return;
    updateCheckinMutation.mutate(
      { additional_pages: count },
      {
        onSuccess: () => {
          setShowEditPagesModal(false);
          setAdditionalPages('');
        },
      }
    );
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'صباح الخير والبركة';
    if (hour >= 12 && hour < 17) return 'مساء الخير والأنوار';
    return 'مساء الخير';
  };

  if (!activeGroupId) {
    return (
      <div className="min-h-screen bg-apple-bg text-apple-text flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full py-12 px-8 bg-apple-surface border border-apple-border rounded-2xl space-y-5 shadow-2xl">
          <BookOpen className="w-10 h-10 text-apple-gold mx-auto" />
          <h2 className="text-xl font-bold text-apple-text">لم تنضم لأي مجموعة قراءة بعد</h2>
          <p className="text-xs text-apple-secondary leading-relaxed">
            أنشئ مجموعة جديدة أو انضم عبر كود الدعوة للبدء في متابعة ورد القراءة اليومي مع أصحابك.
          </p>
          <button
            onClick={() => navigate('/onboarding')}
            className="w-full py-3.5 bg-apple-card text-apple-gold border border-apple-gold/30 font-bold text-xs rounded-xl hover:bg-apple-elevated transition-colors"
          >
            الانتقال للمجموعات
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-apple-bg text-apple-text pb-24 font-sans dir-rtl transition-colors duration-300">
      {/* Shared Unified Header Navbar across all 7 pages */}
      <Navbar
        onOpenNotifications={() => setShowNotifModal(true)}
        onOpenBadges={() => setShowBadgesModal(true)}
      />

      {/* MAIN CONTAINER — UNIFORM SPACING SCALE BETWEEN ALL SECTIONS */}
      <main className="w-full max-w-5xl mx-auto px-3.5 sm:px-10 pt-6 sm:pt-8 space-y-8 sm:space-y-12 overflow-hidden">
        {/* Weekly Titles Banner */}
        {groupTitles && <WeeklyTitlesBanner titles={groupTitles} />}

        {/* 1. HERO SECTION WITH STREAK FLAME & ACTIVE BOOK */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Hero Left Column Container (~60% / 7 cols) */}
          <div className="lg:col-span-7 flex flex-col justify-between p-6 sm:p-8 bg-apple-surface border border-apple-border rounded-2xl shadow-xl space-y-6 relative overflow-hidden">
            {/* Background ambient glow accent */}
            <div className="absolute -top-12 -left-12 w-48 h-48 bg-apple-gold/10 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-3 relative z-10">
              <div className="flex items-center justify-between">
                <span className="text-xs text-apple-secondary font-bold tracking-wide flex items-center gap-1.5">
                  {getGreeting()} 📖
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-apple-gold/15 border border-apple-gold/30 text-apple-gold shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-apple-gold animate-ping" />
                  مباشر النادي اليوم
                </span>
              </div>

              {/* HERO HEADING */}
              <h1 className="text-3xl sm:text-4xl font-black text-apple-text tracking-tight leading-snug">
                أهلاً، <span className="text-apple-gold font-bold">{user?.name || 'صديق القراءة'}</span> ⚡
              </h1>

              {/* LEVEL & XP PROGRESS BAR */}
              <div className="p-3 bg-apple-card/80 border border-apple-border rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-apple-gold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-apple-gold" />
                    المستوى {user?.level || 1} • قارئ ملتزم 🏅
                  </span>
                  <span className="text-apple-muted font-mono">{user?.xp_points || 0} / {((user?.level || 1) * 200)} XP</span>
                </div>
                <div className="w-full h-2 bg-apple-bg rounded-full overflow-hidden border border-apple-border">
                  <div
                    className="h-full bg-gradient-to-r from-apple-amber to-apple-gold rounded-full transition-all duration-500 shadow-sm"
                    style={{
                      width: `${Math.min(
                        Math.round(((user?.xp_points || 40) / ((user?.level || 1) * 200)) * 100),
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* 1-line motivational sentence */}
              <p className="text-xs sm:text-sm text-apple-secondary font-medium leading-relaxed">
                "صفحة واحدة يومياً تفصلك عن الحفاظ على العادة وإلهام رفاق النادي."
              </p>
            </div>

            {/* STREAK FLAME & MILESTONE BOX */}
            <div className="p-4 bg-apple-card border border-apple-border rounded-xl flex items-center justify-between shadow-inner relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-apple-amber/20 border border-apple-amber/40 flex items-center justify-center text-2xl animate-flame shadow-md">
                  🔥
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-apple-text font-mono">{userStreak}</span>
                    <span className="text-xs font-bold text-apple-secondary">أيام استمرارية متواصلة</span>
                  </div>
                  <p className="text-[11px] text-apple-muted font-medium mt-0.5">
                    الوسام القادم عند الوصول إلى <strong className="text-apple-gold font-bold">7 أيام 🏆</strong>
                  </p>
                </div>
              </div>

              {/* Freeze status indicator */}
              <div className="text-left font-mono text-xs">
                <span className="inline-flex items-center gap-1 text-apple-blue font-bold px-3 py-1.5 rounded-lg bg-apple-blue/15 border border-apple-blue/30 shadow-sm">
                  ❄️ 2 تجميد متبقي
                </span>
              </div>
            </div>
          </div>

          {/* 2. BOOK SHOWCASE (~40% / 5 cols) */}
          <div className="lg:col-span-5">
            {activeBook ? (
              <div className="bg-apple-surface border border-apple-border p-6 rounded-2xl space-y-4 shadow-xl h-full flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-apple-border pb-3">
                  <span className="text-xs font-bold text-apple-gold tracking-wider uppercase flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4" />
                    كتاب النادي الحالي
                  </span>
                  <span className="text-[11px] font-bold text-apple-muted font-mono">
                    هدف اليوم: {activeBook.daily_target_pages} ص/يوم
                  </span>
                </div>

                <div className="flex gap-4 items-center flex-1">
                  {/* Book cover image */}
                  <div className="w-24 h-36 bg-apple-bg rounded-lg overflow-hidden shadow-2xl flex items-center justify-center shrink-0 border border-apple-border">
                    {activeBook.book.cover_url ? (
                      <img
                        src={activeBook.book.cover_url}
                        alt={activeBook.book.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <BookOpen className="w-10 h-10 text-apple-muted" />
                    )}
                  </div>

                  {/* Metadata */}
                  <div className="space-y-2 min-w-0 flex-1">
                    <h3 className="font-black text-base text-apple-text line-clamp-2 leading-snug">
                      {activeBook.book.title}
                    </h3>
                    <p className="text-xs text-apple-secondary font-medium line-clamp-1">
                      {activeBook.book.author}
                    </p>

                    <div className="flex items-center justify-between text-xs text-apple-muted pt-1 font-mono">
                      <span>إنجازك اليوم: <strong className="text-apple-gold font-bold">{userPagesToday} ص</strong></span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full h-2 bg-apple-card rounded-full overflow-hidden border border-apple-border mt-1">
                      <div
                        className="h-full bg-apple-gold rounded-full transition-all duration-300 shadow-sm"
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
              </div>
            ) : (
              /* NO ACTIVE BOOK CHOSEN */
              <div className="bg-apple-surface border border-apple-border p-6 rounded-2xl space-y-4 flex flex-col justify-between h-full min-h-[220px] shadow-xl">
                <div className="space-y-2">
                  <span className="text-xs font-bold text-apple-gold tracking-wider uppercase block">كتاب النادي الحالي</span>
                  <h3 className="text-base font-bold text-apple-text">لم يتم اختيار كتاب للمجموعة</h3>
                  <p className="text-xs text-apple-secondary leading-relaxed">
                    اختر الكتاب الذي سيقرؤه النادي حالياً للبدء في تتبع ورد القراءة اليومي.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/books')}
                  className="w-full py-3 px-4 bg-apple-card hover:bg-apple-elevated text-apple-gold border border-apple-gold/30 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <span>اختيار كتاب من الرف</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </section>

        {/* 3. HIGH-ENERGY DAILY ACTION BANNER WITH QUICK PAGE CHIPS */}
        <section className="space-y-4">
          {currentUserStatus?.has_checked_in ? (
            <div className="p-5 bg-apple-surface rounded-2xl border border-apple-green/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-apple-green/20 border border-apple-green/40 flex items-center justify-center text-apple-green shrink-0 shadow-md">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <span className="font-black text-sm text-apple-text block">عظيم جداً! تم تسجيل ورد اليوم بنجاح ✨</span>
                  <span className="text-apple-secondary text-xs font-medium">أنجزت حتى الآن <strong className="text-apple-gold font-mono font-bold text-sm">{userPagesToday} صفحة</strong> اليوم</span>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => setShowEditPagesModal(true)}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-apple-card hover:bg-apple-elevated text-apple-text border border-apple-border font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                >
                  <Edit3 className="w-3.5 h-3.5 text-apple-gold" />
                  <span>إضافة صفحات أخرى</span>
                </button>
                <button
                  onClick={() => setShowUndoModal(true)}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-apple-red/10 hover:bg-apple-red/20 text-apple-red border border-apple-red/30 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>تراجع</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 bg-gradient-to-r from-apple-surface via-apple-card to-apple-surface rounded-2xl border border-apple-gold/50 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-6 relative overflow-hidden">
              <div className="space-y-1.5 text-center lg:text-right">
                <span className="text-xs font-extrabold text-apple-gold tracking-widest uppercase flex items-center justify-center lg:justify-start gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-apple-gold animate-ping" />
                  تحدي اليوم 🔥
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-apple-text">هل قرأت وردك اليومي؟</h2>
                <p className="text-xs text-apple-secondary font-medium">اختر كم صفحة قرأت وسجّلها بلمسة واحدة لمواصلة الستريك!</p>

                {/* Quick Action Chips */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-2">
                  {[10, 15, 20, 30].map((num) => (
                    <button
                      key={num}
                      onClick={() => {
                        setPagesRead(String(num));
                        setShowCheckinModal(true);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-apple-card hover:bg-apple-gold hover:text-black border border-apple-gold/30 text-apple-gold font-mono font-bold text-xs transition-colors shadow-sm"
                    >
                      +{num} ص
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto shrink-0">
                <button
                  onClick={() => setShowCheckinModal(true)}
                  className="w-full sm:w-auto px-8 py-4 bg-apple-gold hover:opacity-95 text-black font-black text-base rounded-xl transition-all active:scale-[0.97] text-center shadow-xl border border-apple-gold/50 flex items-center justify-center gap-2"
                >
                  <BookOpen className="w-5 h-5" />
                  <span>تسجيل الورد الآن 📖</span>
                </button>
              </div>
            </div>
          )}
        </section>

        {/* 4. TOP 3 PODIUM & COMPETITION SPOTLIGHT */}
        {leaderboard && leaderboard.length > 0 && (
          <section className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-apple-text flex items-center gap-2">
                  🏆 صدارة التزام المجموعة
                </h2>
                <p className="text-xs text-apple-secondary font-medium mt-0.5">المتنافسون الأوائل في نسبة الاستمرارية هذا الشهر</p>
              </div>
              <button
                onClick={() => navigate('/discussions')}
                className="text-xs text-apple-gold font-bold hover:underline flex items-center gap-1"
              >
                <span>عرض الكل</span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* PODIUM GRID (Top 3) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {leaderboard.slice(0, 3).map((entry, index) => {
                const colors = [
                  { badge: '👑 المركز الأول', border: 'border-apple-gold/60', bg: 'bg-apple-gold/15', text: 'text-apple-gold' },
                  { badge: '🥈 المركز الثاني', border: 'border-apple-secondary/40', bg: 'bg-apple-card', text: 'text-apple-text' },
                  { badge: '🥉 المركز الثالث', border: 'border-apple-amber/40', bg: 'bg-apple-card', text: 'text-apple-amber' },
                ][index];

                return (
                  <motion.div
                    key={entry.user.id}
                    whileHover={{ y: -4 }}
                    className={`p-5 rounded-2xl bg-apple-surface border ${colors.border} space-y-3 relative shadow-xl flex flex-col justify-between`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${colors.bg} ${colors.text} border ${colors.border} shadow-sm`}>
                        {colors.badge}
                      </span>
                      {entry.user.id === user?.id && (
                        <span className="text-[10px] font-black text-apple-gold bg-apple-gold/15 px-2 py-0.5 rounded-md border border-apple-gold/30">أنت</span>
                      )}
                    </div>

                    <div className="space-y-1 pt-1">
                      <h3 className="font-black text-base text-apple-text line-clamp-1">{entry.user.name}</h3>
                      <div className="flex items-center justify-between text-xs text-apple-secondary">
                        <span>الاستمرارية:</span>
                        <strong className="text-apple-green font-mono font-black text-base">{entry.commitment_rate}%</strong>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-apple-muted pt-2 border-t border-apple-border font-mono font-bold">
                      <span>🔥 {entry.current_streak} يوم</span>
                      <span>📚 {entry.total_pages_read} صفحة</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>
        )}

        {/* 5. SOCIAL LIST: "من قرأ اليوم؟" */}
        <section className="space-y-4 bg-apple-surface border border-apple-border p-6 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-apple-border">
            <div>
              <h2 className="text-lg font-extrabold text-apple-text">
                من قرأ اليوم؟ 👥
              </h2>
              <p className="text-xs text-apple-secondary font-medium">متابعة شرف اليوم وتنبيه الأصدقاء</p>
            </div>
            <span className="text-xs font-bold text-apple-gold font-mono bg-apple-gold/10 px-3 py-1.5 rounded-full border border-apple-gold/20">
              {checkedInCount} / {totalMembersCount} أصل أعضاء ({clubParticipationPercent}%)
            </span>
          </div>

          {loadingStatus ? (
            <div className="py-6 text-xs text-apple-muted flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-apple-gold" /> جاري التحميل...
            </div>
          ) : memberStatuses && memberStatuses.length > 0 ? (
            <div className="divide-y divide-apple-border">
              {memberStatuses.map((m) => (
                <div key={m.user.id} className="py-3.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-apple-text text-sm">{m.user.name}</span>
                    {m.checkin?.pages_read && (
                      <span className="text-apple-gold font-mono font-bold bg-apple-gold/10 px-2 py-0.5 rounded-md">
                        {m.checkin.pages_read} صفحة
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {m.has_checked_in ? (
                      <span className="text-apple-green font-bold flex items-center gap-1.5 bg-apple-green/10 px-3 py-1 rounded-full border border-apple-green/20">
                        <CheckCircle2 className="w-4 h-4" /> تمت القراءة
                      </span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-apple-red font-bold text-xs bg-apple-red/10 px-2.5 py-1 rounded-full border border-apple-red/20">لم يقرأ بعد</span>
                        {user && m.user.id !== user.id && activeGroupId && (
                          <NudgeButton
                            groupId={activeGroupId}
                            toUserId={m.user.id}
                            toUserName={m.user.name}
                            hasCheckedIn={false}
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-apple-muted pt-2 text-center">لا يوجد أعضاء بالمجموعة بعد.</p>
          )}
        </section>

        {/* 6. GROUP STATS & FULL LEADERBOARD TABLE */}
        <section className="space-y-6">
          {/* Horizontal stats summary bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-apple-surface border border-apple-border rounded-xl space-y-1 shadow-md text-center">
              <span className="text-xs text-apple-secondary font-medium">خزينة غرامات النادي</span>
              <p className="text-xl font-black text-apple-gold font-mono">{vault?.total_amount || 0} {group?.currency || 'EGP'}</p>
            </div>

            <div className="p-4 bg-apple-surface border border-apple-border rounded-xl space-y-1 shadow-md text-center">
              <span className="text-xs text-apple-secondary font-medium">إجمالي صفحاتك المقروءة</span>
              <p className="text-xl font-black text-apple-text font-mono">{userTotalPages} صفحة</p>
            </div>

            <div className="p-4 bg-apple-surface border border-apple-border rounded-xl space-y-1 shadow-md text-center">
              <span className="text-xs text-apple-secondary font-medium">أعلى حماسة (Streak)</span>
              <p className="text-xl font-black text-apple-amber font-mono">{userMaxStreak} يوم 🔥</p>
            </div>
          </div>
        </section>
      </main>

      {/* ALL MODALS (Functionality 100% Intact) */}

      {/* Checkin Modal */}
      <AnimatePresence>
        {showCheckinModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-apple-surface p-6 rounded-2xl max-w-md w-full border border-apple-border space-y-4 shadow-2xl"
            >
              <div className="text-center space-y-1">
                <h3 className="text-lg font-bold text-apple-text">تسجيل ورد القراءة اليومي 📖</h3>
                <p className="text-apple-muted text-xs">أدخل عدد الصفحات المقروءة اليوم</p>
              </div>

              <form onSubmit={handleCheckinSubmit} className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-apple-secondary mb-1.5">عدد الصفحات</label>

                  {/* Quick Add Buttons */}
                  <div className="flex gap-2 mb-2.5">
                    {[5, 10, 15, 20].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => handleQuickPageAdd(num)}
                        className="flex-1 py-1.5 bg-apple-card text-apple-gold font-semibold text-xs rounded-lg hover:bg-apple-elevated transition-colors"
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
                    className="w-full px-4 py-3 bg-apple-bg border border-apple-border rounded-xl text-apple-text text-xs font-mono focus:border-apple-gold outline-none"
                    placeholder="أدخل عدد الصفحات (مثال: 15)"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-apple-secondary mb-1.5">فائدة أو ملاحظة (اختياري)</label>
                  <input
                    type="text"
                    maxLength={280}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full px-4 py-3 bg-apple-bg border border-apple-border rounded-xl text-apple-text text-xs focus:border-apple-gold outline-none"
                    placeholder="فائدة بسيطة من كتاب اليوم..."
                  />
                </div>

                {checkinMutation.isError && (
                  <div className="text-xs text-apple-red bg-apple-red/10 p-3 rounded-xl border border-apple-red/20 text-center font-medium">
                    {(checkinMutation.error as any)?.response?.data?.detail || 'حدث خطأ أثناء تسجيل الورد'}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCheckinModal(false)}
                    className="w-1/2 py-3 bg-apple-card text-apple-secondary font-semibold rounded-xl text-xs"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={checkinMutation.isPending}
                    className="w-1/2 py-3 bg-apple-gold hover:opacity-90 text-black font-black rounded-xl text-xs flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {checkinMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'تأكيد الورد ✓'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Undo Checkin Modal */}
      <AnimatePresence>
        {showUndoModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-apple-surface p-6 rounded-2xl max-w-sm w-full border border-apple-border space-y-4 text-center shadow-2xl"
            >
              <h3 className="text-base font-bold text-apple-text">إلغاء تسجيل الورد اليومي</h3>
              <p className="text-apple-secondary text-xs leading-relaxed">
                هل أنت متأكد أنك تريد تراجع التسجيل؟
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUndoModal(false)}
                  className="w-1/2 py-2.5 bg-apple-card text-apple-secondary font-semibold rounded-xl text-xs"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  disabled={undoCheckinMutation.isPending}
                  onClick={handleUndoConfirm}
                  className="w-1/2 py-2.5 bg-apple-red hover:opacity-90 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1"
                >
                  {undoCheckinMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'تأكيد التراجع'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit/Add Pages Modal */}
      <AnimatePresence>
        {showEditPagesModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-apple-surface p-6 rounded-2xl max-w-sm w-full border border-apple-border space-y-4 text-center shadow-2xl"
            >
              <h3 className="text-base font-bold text-apple-text">إضافة صفحات جديدة لليوم</h3>
              <p className="text-apple-muted text-xs">أدخل عدد الصفحات الإضافية التي تم إنجازها</p>

              <form onSubmit={handleAddMorePages} className="space-y-3">
                <input
                  type="number"
                  min="1"
                  value={additionalPages}
                  onChange={(e) => setAdditionalPages(e.target.value)}
                  className="w-full px-4 py-3 bg-apple-bg border border-apple-border rounded-xl text-apple-text text-xs font-mono focus:border-apple-gold outline-none text-center"
                  placeholder="عدد الصفحات الإضافية"
                />

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowEditPagesModal(false)}
                    className="w-1/2 py-2.5 bg-apple-card text-apple-secondary font-semibold rounded-xl text-xs"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={updateCheckinMutation.isPending}
                    className="w-1/2 py-2.5 bg-apple-gold hover:opacity-90 text-black font-bold rounded-xl text-xs flex items-center justify-center gap-1"
                  >
                    {updateCheckinMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'تأكيد الإضافة'}
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
