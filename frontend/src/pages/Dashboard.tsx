import React, { lazy, Suspense, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, CheckCircle2, RotateCcw, Edit3, Loader2, ChevronLeft,
  Flame, Trophy, Zap, ShieldAlert, Users, Copy, Check
} from 'lucide-react';
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

import { AppShell } from '../components/layout/AppShell';
import { BookCover } from '../components/reading/BookCover';
import { ReadingProgress } from '../components/reading/ReadingProgress';
import { MetricCard } from '../components/reading/MetricCard';
import { SectionHeading } from '../components/reading/SectionHeading';
import { NudgeButton } from '../components/NudgeButton';
import { WeeklyTitlesBanner } from '../components/WeeklyTitlesBanner';
import { DashboardActivityRail } from '../components/layout/DashboardActivityRail';

const BadgesModal = lazy(() => import('../components/BadgesModal').then((module) => ({ default: module.BadgesModal })));
const NotificationCenterModal = lazy(() => import('../components/NotificationCenterModal').then((module) => ({ default: module.NotificationCenterModal })));
const WrappedModal = lazy(() => import('../components/WrappedModal').then((module) => ({ default: module.WrappedModal })));

export const Dashboard = () => {
  const user = useAuthStore((state) => state.user);
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
  const [inviteCodeCopied, setInviteCodeCopied] = useState(false);

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
    enabled: showBadgesModal,
  });

  const { data: userBadges } = useQuery<UserBadge[]>({
    queryKey: ['userBadges', user?.id],
    queryFn: () => getUserBadges(user!.id),
    enabled: showBadgesModal && !!user?.id,
  });

  const { data: groupTitles } = useQuery<WeeklyTitle[]>({
    queryKey: ['groupTitles', activeGroupId],
    queryFn: () => getGroupTitles(activeGroupId!),
    enabled: !!activeGroupId,
  });

  const { data: notifications } = useQuery<AppNotification[]>({
    queryKey: ['notifications'],
    queryFn: getMyNotifications,
    enabled: showNotifModal,
  });

  const { data: monthlySummary } = useQuery<MonthlySummary | null>({
    queryKey: ['monthlySummary'],
    queryFn: () => getMonthlySummary(),
    enabled: showWrappedModal,
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

          void import('canvas-confetti')
            .then(({ default: confetti }) => {
              confetti({
                particleCount: 100,
                spread: 80,
                origin: { y: 0.6 },
                colors: ['#58bddb', '#ffe46f', '#aff06b'],
              });
            })
            .catch(() => {});
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

  const handleCopyInviteCode = async () => {
    if (!group?.invite_code) return;

    try {
      await navigator.clipboard.writeText(group.invite_code);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = group.invite_code;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      textArea.remove();
    }

    setInviteCodeCopied(true);
    window.setTimeout(() => setInviteCodeCopied(false), 2000);
  };

  if (!activeGroupId) {
    return (
      <div className="min-h-screen bg-reader-canvas text-reader-text flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full py-12 px-8 bg-reader-panel border border-reader-border rounded-3xl space-y-6 shadow-2xl">
          <BookOpen className="w-12 h-12 text-reader-accent mx-auto" />
          <h2 className="text-xl font-bold text-reader-text">لم تنضم لأي مجموعة قراءة بعد</h2>
          <p className="text-xs text-reader-muted leading-relaxed">
            أنشئ مجموعة جديدة أو انضم عبر كود الدعوة للبدء في متابعة ورد القراءة اليومي مع أصحابك.
          </p>
          <button
            onClick={() => navigate('/onboarding')}
            className="w-full py-3.5 bg-reader-accent text-reader-accentForeground font-bold text-xs rounded-2xl hover:bg-reader-accentHover transition-colors"
          >
            الانتقال للمجموعات
          </button>
        </div>
      </div>
    );
  }

  return (
    <AppShell
      onOpenNotifications={() => setShowNotifModal(true)}
      onOpenBadges={() => setShowBadgesModal(true)}
      leftRail={(
        <DashboardActivityRail
          memberStatuses={memberStatuses}
          leaderboard={leaderboard}
        />
      )}
    >
      <div className="mx-auto max-w-6xl space-y-7">
        {group?.invite_code && (
          <section className="flex flex-col gap-3 rounded-2xl border border-reader-borderStrong bg-reader-panel px-4 py-3 shadow-lg sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 text-center sm:text-right">
              <p className="text-xs font-black text-reader-text">ادعُ أصحابك للمجموعة</p>
              <p className="mt-1 text-[11px] font-medium text-reader-muted">
                ابعت لهم كود الدعوة للانضمام إلى {group.name}
              </p>
            </div>

            <div className="flex items-stretch gap-2" dir="ltr">
              <code className="flex min-w-0 flex-1 items-center justify-center rounded-xl border border-reader-border bg-reader-surface px-4 py-2.5 text-base font-black tracking-[0.2em] text-reader-accent sm:min-w-36">
                {group.invite_code}
              </code>
              <button
                type="button"
                onClick={handleCopyInviteCode}
                className="inline-flex min-w-24 items-center justify-center gap-2 rounded-xl bg-reader-accent px-4 py-2.5 text-xs font-black text-reader-accentForeground transition-colors hover:bg-reader-accentHover"
                aria-label="نسخ كود الدعوة"
              >
                {inviteCodeCopied ? <Check size={16} /> : <Copy size={16} />}
                <span>{inviteCodeCopied ? 'تم النسخ' : 'نسخ الكود'}</span>
              </button>
            </div>
          </section>
        )}

        {/* Weekly Titles Banner */}
        {groupTitles && <WeeklyTitlesBanner titles={groupTitles} />}

        {/* 1. ACTIVE BOOK HERO — mirrors Reference #3 */}
        <section className="relative overflow-hidden rounded-[34px] border border-reader-border bg-reader-subdued p-5 shadow-2xl sm:p-7">
          <div className="pointer-events-none absolute -left-24 -top-28 h-72 w-72 rounded-full bg-reader-accentSoft blur-3xl" />
          <div className="relative flex flex-col gap-7 md:flex-row md:items-center">
            <BookCover
              coverUrl={activeBook?.book.cover_url}
              title={activeBook?.book.title || 'كتاب النادي القادم'}
              author={activeBook?.book.author || 'اختر كتابًا من المكتبة'}
              size="xl"
              className="mx-auto shadow-2xl md:mx-0"
            />

            <div className="min-w-0 flex-1 space-y-5 text-center md:text-right">
              <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
                <span className="inline-flex items-center gap-2 rounded-full border border-reader-borderStrong bg-reader-surface px-3 py-1.5 text-[11px] font-black text-reader-accent">
                  <span className="h-2 w-2 rounded-full bg-reader-success" />
                  كتاب النادي الحالي
                </span>
                <span className="text-[11px] font-bold text-reader-muted">{getGreeting()}، {user?.name || 'صديق القراءة'}</span>
              </div>

              <div>
                <h1 className="max-w-2xl text-3xl font-black leading-[1.25] tracking-tight text-reader-text sm:text-4xl xl:text-5xl">
                  {activeBook?.book.title || 'اختر قصة تستحق أن تعيش معها'}
                </h1>
                <p className="mt-2 text-sm font-bold text-reader-muted sm:text-base">بقلم {activeBook?.book.author || 'مؤلفك المفضل'}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-reader-border bg-reader-surface p-3">
                  <span className="block text-[10px] font-bold text-reader-muted">هدف اليوم</span>
                  <strong className="mt-1 block font-mono text-xl text-reader-text">{activeBook?.daily_target_pages || 20} صفحة</strong>
                </div>
                <div className="rounded-2xl border border-reader-border bg-reader-surface p-3">
                  <span className="block text-[10px] font-bold text-reader-muted">ما قرأته</span>
                  <strong className="mt-1 block font-mono text-xl text-reader-text">{userPagesToday} صفحة</strong>
                </div>
                <div className="col-span-2 rounded-2xl border border-reader-border bg-reader-surface p-3 sm:col-span-1">
                  <span className="block text-[10px] font-bold text-reader-muted">استمراريتك</span>
                  <strong className="mt-1 flex items-center justify-center gap-1 font-mono text-xl text-reader-text md:justify-start"><Flame className="h-5 w-5 text-reader-metric-coralText" /> {userStreak} أيام</strong>
                </div>
              </div>

              <ReadingProgress current={userPagesToday} total={activeBook?.daily_target_pages || 20} label="تقدم ورد اليوم" unit="صفحة" colorClass="bg-reader-accent" />

              <div className="flex flex-col justify-center gap-3 sm:flex-row md:justify-start">
                <button
                  onClick={() => activeBook ? navigate(`/groups/${activeGroupId}/books/${activeBook.id}/read`) : navigate('/books')}
                  className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-reader-accent px-6 text-sm font-black text-reader-accentForeground shadow-xl transition-colors hover:bg-reader-accentHover"
                >
                  <BookOpen className="h-5 w-5" />
                  {activeBook ? 'استكمال القراءة' : 'اختيار كتاب'}
                </button>
                <button onClick={() => navigate('/books')} className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border border-reader-borderStrong bg-reader-surface px-6 text-sm font-black text-reader-text transition-colors hover:bg-reader-hover">
                  عرض الكتب المرتبطة
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 2. METRIC CARDS ROW (Reference #3 inspired) */}
        <section className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <MetricCard
            title="صفحات اليوم"
            value={userPagesToday}
            subtitle={`من ${activeBook?.daily_target_pages || 20} ص`}
            icon={<BookOpen className="w-4 h-4" />}
            variant="gold"
            className="col-span-2 md:col-span-2"
          />
          <MetricCard
            title="أيام الستريك"
            value={`${userStreak} ي`}
            subtitle="استمرارية متواصلة"
            icon={<Flame className="w-4 h-4" />}
            variant="coral"
            className="col-span-2 md:col-span-1"
          />
          <MetricCard
            title="المستوى الحرفي"
            value={`مـ${user?.level || 1}`}
            subtitle={`${user?.xp_points || 0} XP`}
            icon={<Zap className="w-4 h-4" />}
            variant="violet"
          />
          <MetricCard
            title="التزام النادي"
            value={`${clubParticipationPercent}%`}
            subtitle={`${checkedInCount}/${totalMembersCount} أعضاء`}
            icon={<Users className="w-4 h-4" />}
            variant="lime"
          />
          <MetricCard
            title="خزينة الغرامات"
            value={`${vault?.total_amount || 0}`}
            subtitle={group?.currency || 'EGP'}
            icon={<ShieldAlert className="w-4 h-4" />}
            variant="sky"
          />
        </section>

        {/* 3. DAILY CHECK-IN ACTION PANEL */}
        <section className="space-y-4">
          {currentUserStatus?.has_checked_in ? (
            <div className="p-5 sm:p-6 rounded-3xl bg-reader-panel border border-reader-borderStrong flex flex-col sm:flex-row items-center justify-between gap-4 text-xs shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-reader-metric-limeBg border border-reader-border flex items-center justify-center text-reader-metric-limeText shrink-0 shadow-md">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <span className="font-black text-sm text-reader-text block">عظيم جداً! تم تسجيل ورد اليوم بنجاح ✨</span>
                  <span className="text-reader-muted text-xs font-medium">أنجزت حتى الآن <strong className="text-reader-accent font-mono font-bold text-sm">{userPagesToday} صفحة</strong> اليوم</span>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => setShowEditPagesModal(true)}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-reader-surface hover:bg-reader-hover text-reader-text border border-reader-border font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                >
                  <Edit3 className="w-4 h-4 text-reader-accent" />
                  <span>إضافة صفحات أخرى</span>
                </button>
                <button
                  onClick={() => setShowUndoModal(true)}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>تراجع</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 sm:p-8 rounded-3xl bg-reader-panel border border-reader-borderStrong shadow-xl flex flex-col lg:flex-row items-center justify-between gap-6 relative overflow-hidden">
              <div className="space-y-2 text-center lg:text-right">
                <span className="text-xs font-extrabold text-reader-accent tracking-widest uppercase flex items-center justify-center lg:justify-start gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-reader-accent animate-ping" />
                  تحدي اليوم 🔥
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-reader-text">هل قرأت وردك اليومي؟</h2>
                <p className="text-xs text-reader-muted font-medium">اختر كم صفحة قرأت وسجّلها بلمسة واحدة لمواصلة الستريك!</p>

                {/* Quick Action Chips */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-2">
                  {[10, 15, 20, 30].map((num) => (
                    <button
                      key={num}
                      onClick={() => {
                        setPagesRead(String(num));
                        setShowCheckinModal(true);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-reader-surface hover:bg-reader-accent hover:text-reader-accentForeground border border-reader-border text-reader-accent font-mono font-bold text-xs transition-all shadow-sm"
                    >
                      +{num} ص
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto shrink-0">
                <button
                  onClick={() => setShowCheckinModal(true)}
                  className="w-full sm:w-auto px-8 py-4 bg-reader-accent hover:bg-reader-accentHover text-reader-accentForeground font-black text-base rounded-2xl transition-all active:scale-[0.97] text-center shadow-xl border border-reader-borderStrong flex items-center justify-center gap-2"
                >
                  <BookOpen className="w-5 h-5" />
                  <span>تسجيل الورد الآن 📖</span>
                </button>
              </div>
            </div>
          )}
        </section>

        {/* 4. LEADERBOARD PODIUM & SPOTLIGHT */}
        {leaderboard && leaderboard.length > 0 && (
          <section className="rc-deferred-content space-y-4">
            <SectionHeading
              title="صدارة التزام المجموعة"
              subtitle="المتنافسون الأوائل في نسبة الاستمرارية هذا الشهر"
              icon={<Trophy className="w-5 h-5" />}
              action={
                <button
                  onClick={() => navigate('/discussions')}
                  className="text-xs text-reader-accent font-bold hover:underline flex items-center gap-1"
                >
                  <span>عرض الكل</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              }
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {leaderboard.slice(0, 3).map((entry, index) => {
                const colors = [
                  { badge: '👑 المركز الأول', border: 'border-reader-borderStrong', text: 'text-reader-metric-goldText' },
                  { badge: '🥈 المركز الثاني', border: 'border-reader-border', text: 'text-reader-text' },
                  { badge: '🥉 المركز الثالث', border: 'border-reader-border', text: 'text-reader-metric-coralText' },
                ][index];

                return (
                  <motion.div
                    key={entry.user.id}
                    whileHover={{ y: -3 }}
                    className={`p-5 rounded-2xl bg-reader-panel border ${colors.border} space-y-3 relative shadow-lg flex flex-col justify-between`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full bg-reader-surface ${colors.text} border border-reader-border shadow-sm`}>
                        {colors.badge}
                      </span>
                      {entry.user.id === user?.id && (
                        <span className="text-[10px] font-black text-reader-accent bg-reader-accentSoft px-2 py-0.5 rounded-md border border-reader-borderStrong">أنت</span>
                      )}
                    </div>

                    <div className="space-y-1 pt-1">
                      <h3 className="font-black text-base text-reader-text line-clamp-1">{entry.user.name}</h3>
                      <div className="flex items-center justify-between text-xs text-reader-muted">
                        <span>الاستمرارية:</span>
                        <strong className="text-reader-metric-limeText font-mono font-black text-base">{entry.commitment_rate}%</strong>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-reader-subtle pt-2 border-t border-reader-border font-mono font-bold">
                      <span>🔥 {entry.current_streak} يوم</span>
                      <span>📚 {entry.total_pages_read} صفحة</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>
        )}

        {/* 5. MEMBER STATUS FEED ("من قرأ اليوم؟") */}
        <section className="rc-deferred-content space-y-4 bg-reader-panel border border-reader-border p-6 rounded-3xl shadow-xl">
          <SectionHeading
            title="من قرأ اليوم؟"
            subtitle="متابعة شرف اليوم وتنبيه الأصدقاء"
            icon={<Users className="w-5 h-5" />}
            badge={
              <span className="text-xs font-bold text-reader-accent font-mono bg-reader-accentSoft px-3 py-1 rounded-full border border-reader-borderStrong">
                {checkedInCount} / {totalMembersCount} أعضاء ({clubParticipationPercent}%)
              </span>
            }
          />

          {loadingStatus ? (
            <div className="py-6 text-xs text-reader-muted flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-reader-accent" /> جاري التحميل...
            </div>
          ) : memberStatuses && memberStatuses.length > 0 ? (
            <div className="divide-y divide-reader-border">
              {memberStatuses.map((m) => (
                <div key={m.user.id} className="py-3.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-reader-text text-sm">{m.user.name}</span>
                    {m.checkin?.pages_read && (
                      <span className="text-reader-metric-goldText font-mono font-bold bg-reader-surface px-2.5 py-0.5 rounded-lg border border-reader-border">
                        {m.checkin.pages_read} صفحة
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {m.has_checked_in ? (
                      <span className="text-reader-metric-limeText font-bold flex items-center gap-1.5 bg-reader-surface px-3 py-1 rounded-full border border-reader-border">
                        <CheckCircle2 className="w-4 h-4 text-reader-metric-limeText" /> تمت القراءة
                      </span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-red-400 font-bold text-xs bg-reader-surface px-2.5 py-1 rounded-full border border-reader-border">لم يقرأ بعد</span>
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
            <p className="text-xs text-reader-muted pt-2 text-center">لا يوجد أعضاء بالمجموعة بعد.</p>
          )}
        </section>
      </div>

      {/* ALL MODALS (Functionality 100% Intact) */}

      {/* Checkin Modal */}
      <AnimatePresence>
        {showCheckinModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-reader-panel p-6 rounded-3xl max-w-md w-full border border-reader-border space-y-4 shadow-2xl"
            >
              <div className="text-center space-y-1">
                <h3 className="text-lg font-bold text-reader-text">تسجيل ورد القراءة اليومي 📖</h3>
                <p className="text-reader-muted text-xs">أدخل عدد الصفحات المقروءة اليوم</p>
              </div>

              <form onSubmit={handleCheckinSubmit} className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-reader-muted mb-1.5">عدد الصفحات</label>

                  <div className="flex gap-2 mb-2.5">
                    {[5, 10, 15, 20].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => handleQuickPageAdd(num)}
                        className="flex-1 py-2 bg-reader-surface text-reader-accent font-semibold text-xs rounded-xl hover:bg-reader-hover transition-colors border border-reader-border"
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
                    className="w-full px-4 py-3 bg-reader-surface border border-reader-border rounded-xl text-reader-text text-xs font-mono focus:border-reader-accent outline-none"
                    placeholder="أدخل عدد الصفحات (مثال: 15)"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-reader-muted mb-1.5">فائدة أو ملاحظة (اختياري)</label>
                  <input
                    type="text"
                    maxLength={280}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full px-4 py-3 bg-reader-surface border border-reader-border rounded-xl text-reader-text text-xs focus:border-reader-accent outline-none"
                    placeholder="فائدة بسيطة من كتاب اليوم..."
                  />
                </div>

                {checkinMutation.isError && (
                  <div className="text-xs text-red-400 bg-red-500/10 p-3 rounded-xl border border-red-500/20 text-center font-medium">
                    {(checkinMutation.error as any)?.response?.data?.detail || 'حدث خطأ أثناء تسجيل الورد'}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCheckinModal(false)}
                    className="w-1/2 py-3 bg-reader-surface text-reader-muted font-semibold rounded-xl text-xs border border-reader-border"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={checkinMutation.isPending}
                    className="w-1/2 py-3 bg-reader-accent hover:bg-reader-accentHover text-reader-accentForeground font-black rounded-xl text-xs flex items-center justify-center gap-2 disabled:opacity-50"
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
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-reader-panel p-6 rounded-3xl max-w-sm w-full border border-reader-border space-y-4 text-center shadow-2xl"
            >
              <h3 className="text-base font-bold text-reader-text">إلغاء تسجيل الورد اليومي</h3>
              <p className="text-reader-muted text-xs leading-relaxed">
                هل أنت متأكد أنك تريد تراجع التسجيل؟
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUndoModal(false)}
                  className="w-1/2 py-2.5 bg-reader-surface text-reader-muted font-semibold rounded-xl text-xs border border-reader-border"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  disabled={undoCheckinMutation.isPending}
                  onClick={handleUndoConfirm}
                  className="w-1/2 py-2.5 bg-red-500 hover:opacity-90 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1"
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
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-reader-panel p-6 rounded-3xl max-w-sm w-full border border-reader-border space-y-4 text-center shadow-2xl"
            >
              <h3 className="text-base font-bold text-reader-text">إضافة صفحات جديدة لليوم</h3>
              <p className="text-reader-muted text-xs">أدخل عدد الصفحات الإضافية التي تم إنجازها</p>

              <form onSubmit={handleAddMorePages} className="space-y-3">
                <input
                  type="number"
                  min="1"
                  value={additionalPages}
                  onChange={(e) => setAdditionalPages(e.target.value)}
                  className="w-full px-4 py-3 bg-reader-surface border border-reader-border rounded-xl text-reader-text text-xs font-mono focus:border-reader-accent outline-none text-center"
                  placeholder="عدد الصفحات الإضافية"
                />

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowEditPagesModal(false)}
                    className="w-1/2 py-2.5 bg-reader-surface text-reader-muted font-semibold rounded-xl text-xs border border-reader-border"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={updateCheckinMutation.isPending}
                    className="w-1/2 py-2.5 bg-reader-accent hover:bg-reader-accentHover text-reader-accentForeground font-bold rounded-xl text-xs flex items-center justify-center gap-1"
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
        <Suspense fallback={null}>
          <BadgesModal
            allBadges={allBadges}
            userBadges={userBadges}
            onClose={() => setShowBadgesModal(false)}
          />
        </Suspense>
      )}

      {/* Notification Center Modal */}
      {showNotifModal && notifications && (
        <Suspense fallback={null}>
          <NotificationCenterModal
            notifications={notifications}
            onClose={() => setShowNotifModal(false)}
          />
        </Suspense>
      )}

      {/* Wrapped Summary Modal */}
      {showWrappedModal && monthlySummary && user && (
        <Suspense fallback={null}>
          <WrappedModal
            summary={monthlySummary}
            userName={user.name}
            onClose={() => setShowWrappedModal(false)}
          />
        </Suspense>
      )}
    </AppShell>
  );
};
