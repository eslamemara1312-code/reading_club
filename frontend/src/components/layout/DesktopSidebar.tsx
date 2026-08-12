import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  BookOpen,
  Calendar,
  ChevronDown,
  LibraryBig,
  LogOut,
  MessageSquare,
  Settings,
  ShieldAlert,
  Sparkles,
  Trophy,
  User as UserIcon,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { getGroupDetails, Group } from '../../api/groups';
import { getMyNotifications } from '../../api/notifications';
import { getActiveGroupBook, getProxiedCoverUrl, GroupBook } from '../../api/books';
import { getTodayStatus, MemberTodayStatus } from '../../api/checkins';
import { ThemeToggle } from './ThemeToggle';

interface DesktopSidebarProps {
  onOpenNotifications?: () => void;
  onOpenBadges?: () => void;
}

export function DesktopSidebar({ onOpenNotifications, onOpenBadges }: DesktopSidebarProps) {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { activeGroupId } = useUIStore();
  const navigate = useNavigate();
  const [groupDropdownOpen, setGroupDropdownOpen] = useState(false);

  const { data: activeGroup } = useQuery<Group>({
    queryKey: ['groupDetails', activeGroupId],
    queryFn: () => getGroupDetails(activeGroupId!),
    enabled: !!activeGroupId,
  });

  const { data: activeBook } = useQuery<GroupBook | null>({
    queryKey: ['activeBook', activeGroupId],
    queryFn: () => getActiveGroupBook(activeGroupId!),
    enabled: !!activeGroupId,
  });

  const { data: memberStatuses = [] } = useQuery<MemberTodayStatus[]>({
    queryKey: ['todayStatus', activeGroupId],
    queryFn: () => getTodayStatus(activeGroupId!),
    enabled: !!activeGroupId,
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: getMyNotifications,
  });

  const unreadCount = notifications.filter((notification) => !notification.is_read).length;
  const userLevel = user?.level || 1;
  const userXp = user?.xp_points || 0;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', label: 'الرئيسية', icon: BookOpen },
    { to: '/books', label: 'مكتبتي', icon: LibraryBig },
    { to: '/calendar', label: 'التقويم', icon: Calendar },
    { to: '/discussions', label: 'النادي', icon: MessageSquare },
    { to: '/vault', label: 'الخزينة', icon: ShieldAlert },
    { to: '/profile', label: 'حسابي', icon: UserIcon },
  ];

  return (
    <aside aria-label="التنقل الرئيسي" className="rc-column-scroll hidden h-full w-[270px] shrink-0 flex-col border-l border-reader-border bg-reader-panel px-5 py-7 text-reader-text min-[1200px]:flex overflow-y-auto">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <NavLink to="/profile" className="group flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-reader-borderStrong bg-reader-raised text-sm font-black text-reader-accent shadow-lg">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                user?.name?.charAt(0).toUpperCase() || 'ق'
              )}
            </div>
            <div className="min-w-0">
              <span className="block text-[10px] font-bold text-reader-muted">مرحبًا بعودتك</span>
              <strong className="block truncate text-sm font-black text-reader-text transition-colors group-hover:text-reader-accent">{user?.name || 'صديق القراءة'}</strong>
            </div>
          </NavLink>
          <ThemeToggle className="!min-h-[42px] !min-w-[42px] !rounded-full !bg-reader-subdued" />
        </div>

        <div className="relative">
          <button
            onClick={() => setGroupDropdownOpen((open) => !open)}
            aria-expanded={groupDropdownOpen}
            className="flex min-h-[48px] w-full items-center justify-between rounded-2xl border border-reader-border bg-reader-surface px-4 text-xs font-bold text-reader-text transition-colors hover:bg-reader-hover"
          >
            <span className="flex min-w-0 items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-reader-success shadow-[0_0_0_5px_var(--rc-accent-soft)]" />
              <span className="truncate">{activeGroup?.name || 'اختر نادي القراءة'}</span>
            </span>
            <ChevronDown className={`h-4 w-4 text-reader-muted transition-transform ${groupDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {groupDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                className="absolute right-0 top-full z-50 mt-2 w-full space-y-1 rounded-2xl border border-reader-border bg-reader-glass p-2 shadow-2xl backdrop-blur-2xl"
              >
                <div className="flex items-center gap-2 rounded-xl bg-reader-raised px-3 py-2 text-xs font-bold">
                  <Sparkles className="h-4 w-4 text-reader-metric-goldText" />
                  <span className="truncate">{activeGroup?.name || 'النادي الحالي'}</span>
                </div>
                <NavLink to="/onboarding" onClick={() => setGroupDropdownOpen(false)} className="block rounded-xl px-3 py-2 text-xs font-bold text-reader-accent hover:bg-reader-hover">
                  تبديل المجموعة أو الانضمام
                </NavLink>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-black text-reader-text">كتاب النادي</h2>
            <NavLink to="/books" className="text-[10px] font-bold text-reader-accent hover:underline">عرض الرف</NavLink>
          </div>

          <NavLink to="/books" className="group flex items-center gap-3 rounded-3xl border border-reader-border bg-reader-surface p-3 transition-colors hover:bg-reader-hover">
            <div className="h-20 w-14 shrink-0 overflow-hidden rounded-xl bg-reader-raised shadow-xl">
              {activeBook?.book.cover_url ? (
                <img src={getProxiedCoverUrl(activeBook.book.cover_url)} alt={activeBook.book.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full flex-col items-center justify-center bg-gradient-to-br from-reader-metric-violetBg to-reader-metric-skyBg text-reader-metric-ink">
                  <BookOpen className="h-5 w-5" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-xs font-black leading-relaxed text-reader-text group-hover:text-reader-accent">
                {activeBook?.book.title || 'اختر كتاب النادي القادم'}
              </p>
              <p className="mt-1 truncate text-[10px] text-reader-muted">{activeBook?.book.author || 'ابدأ رحلة قراءة جديدة'}</p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-reader-subdued">
                <div className="h-full w-1/3 rounded-full bg-reader-accent" />
              </div>
            </div>
          </NavLink>
        </section>

        <nav aria-label="أقسام التطبيق" className="grid grid-cols-2 gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `relative flex min-h-[64px] flex-col items-center justify-center gap-1.5 rounded-2xl border text-[10px] font-black transition-colors ${isActive ? 'border-reader-borderStrong bg-reader-raised text-reader-accent' : 'border-transparent text-reader-muted hover:border-reader-border hover:bg-reader-surface hover:text-reader-text'}`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-black text-reader-text">أعضاء النادي</h2>
            <span className="text-[10px] font-bold text-reader-muted">{memberStatuses.length} أعضاء</span>
          </div>
          <div className="space-y-2">
            {memberStatuses.slice(0, 5).map((status) => (
              <div key={status.user.id} className="flex items-center gap-3 px-1 py-1.5">
                <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-reader-border bg-reader-raised text-[10px] font-black text-reader-accent">
                  {status.user.avatar_url ? <img src={status.user.avatar_url} alt="" className="h-full w-full object-cover" /> : status.user.name.charAt(0).toUpperCase()}
                  <span className={`absolute bottom-0 left-0 h-2.5 w-2.5 rounded-full border-2 border-reader-panel ${status.has_checked_in ? 'bg-reader-success' : 'bg-reader-subtle'}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-bold text-reader-text">{status.user.name}</p>
                  <p className="text-[9px] text-reader-muted">{status.has_checked_in ? `${status.checkin?.pages_read || 0} صفحة اليوم` : 'بانتظار الورد'}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-auto space-y-3 border-t border-reader-border pt-5">
        <div className="flex items-center gap-2">
          <button onClick={onOpenBadges} className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-reader-surface text-xs font-black text-reader-metric-goldText hover:bg-reader-hover" aria-label="فتح الأوسمة">
            <Trophy className="h-4 w-4" /> م {userLevel}
          </button>
          <button onClick={onOpenNotifications} className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-reader-surface text-reader-text hover:bg-reader-hover" aria-label="فتح الإشعارات">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && <span className="absolute -left-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-reader-danger text-[9px] font-black text-white">{unreadCount}</span>}
          </button>
          <button onClick={() => navigate('/settings')} className="flex h-11 w-11 items-center justify-center rounded-xl bg-reader-surface text-reader-muted hover:bg-reader-hover hover:text-reader-text" aria-label="الإعدادات">
            <Settings className="h-4 w-4" />
          </button>
          <button onClick={handleLogout} className="flex h-11 w-11 items-center justify-center rounded-xl bg-reader-dangerSoft text-reader-danger hover:bg-reader-hover" aria-label="تسجيل الخروج">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
        <p className="text-center text-[9px] font-bold text-reader-subtle">{userXp} XP • قارئ في المستوى {userLevel}</p>
      </div>
    </aside>
  );
}
