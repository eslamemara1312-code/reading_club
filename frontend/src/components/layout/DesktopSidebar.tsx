import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Calendar,
  ShieldAlert,
  Users,
  User as UserIcon,
  Bell,
  Trophy,
  LogOut,
  ChevronDown,
  Sparkles,
  Settings
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { useQuery } from '@tanstack/react-query';
import { getGroupDetails, Group } from '../../api/groups';
import { getMyNotifications } from '../../api/notifications';
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

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: getMyNotifications,
  });

  const unreadCount = notifications?.filter((n) => !n.is_read).length || 0;
  const userLevel = user?.level || 1;
  const userXp = user?.xp_points || 0;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', label: 'الرئيسية', icon: BookOpen },
    { to: '/books', label: 'مكتبتي', icon: BookOpen },
    { to: '/calendar', label: 'التقويم', icon: Calendar },
    { to: '/discussions', label: 'النادي', icon: Users },
    { to: '/vault', label: 'الخزينة', icon: ShieldAlert },
    { to: '/profile', label: 'الملف الشخصي', icon: UserIcon },
  ];

  return (
    <aside aria-label="التنقل الرئيسي" className="w-[260px] shrink-0 sticky top-0 h-screen py-6 px-4 flex-col justify-between hidden min-[1200px]:flex border-l border-reader-border bg-reader-panel text-reader-text transition-colors overflow-y-auto no-scrollbar">
      <div className="space-y-6">
        {/* Brand Header */}
        <NavLink to="/dashboard" className="flex items-center gap-3 group px-2">
          <div className="w-10 h-10 rounded-2xl bg-reader-surface border border-reader-borderStrong flex items-center justify-center text-reader-accent shadow-sm group-hover:scale-105 transition-transform">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-base tracking-tight text-reader-text group-hover:text-reader-accent transition-colors">
              نادي القراءة
            </span>
            <span className="text-[10px] text-reader-muted font-bold tracking-wider uppercase">مجتمع القراء</span>
          </div>
        </NavLink>

        {/* Group Selector */}
        <div className="relative">
          <button
            onClick={() => setGroupDropdownOpen(!groupDropdownOpen)}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-reader-surface hover:bg-reader-hover border border-reader-border text-xs font-semibold text-reader-text transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-reader-accent shrink-0" />
              <span className="truncate font-bold text-xs">
                {activeGroup?.name || 'اختر مجموعة'}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-reader-muted shrink-0" />
          </button>

          <AnimatePresence>
            {groupDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                className="absolute right-0 top-full mt-2 w-full p-2 rounded-2xl bg-reader-surface border border-reader-border shadow-xl z-50 space-y-1"
              >
                <div className="px-3 py-1.5 text-[11px] font-medium text-reader-muted">
                  المجموعة الحالية
                </div>
                <div className="px-3 py-2 rounded-xl bg-reader-raised text-xs font-bold text-reader-text flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-reader-metric-goldText shrink-0" />
                  <span className="truncate">{activeGroup?.name || 'مجموعة تجريبية'}</span>
                </div>
                <NavLink
                  to="/onboarding"
                  onClick={() => setGroupDropdownOpen(false)}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold text-reader-accent hover:bg-reader-hover rounded-xl transition-colors"
                >
                  + تبديل أو إنضمام لمجموعة
                </NavLink>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5 pt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all relative ${
                    isActive
                      ? 'text-reader-accent bg-reader-accentSoft border border-reader-borderStrong'
                      : 'text-reader-muted hover:text-reader-text hover:bg-reader-surface'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-4 h-4 ${isActive ? 'text-reader-accent' : 'text-reader-muted'}`} />
                    <span>{item.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="activeDesktopRailBadge"
                        className="absolute right-0 top-2 bottom-2 w-1 bg-reader-accent rounded-l-full"
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User Actions Footer */}
      <div className="pt-4 border-t border-reader-border space-y-3">
        {/* User Card */}
        <div className="flex items-center justify-between p-2.5 rounded-2xl bg-reader-surface border border-reader-border">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-reader-raised border border-reader-border text-reader-accent text-xs font-black flex items-center justify-center overflow-hidden shrink-0">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user?.name ? user.name.charAt(0).toUpperCase() : 'U'
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-reader-text truncate">{user?.name}</span>
              <span className="text-[10px] text-reader-muted font-semibold">مستوى {userLevel} • {userXp} XP</span>
            </div>
          </div>

          <button
            onClick={() => navigate('/settings')}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-reader-hover text-reader-muted hover:text-reader-text transition-colors"
            title="إعدادات المجموعة"
            aria-label="إعدادات المجموعة"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        {/* Action Controls Row */}
        <div className="flex items-center justify-between gap-1.5">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={onOpenBadges}
            className="min-h-[44px] flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-reader-surface hover:bg-reader-hover border border-reader-border text-reader-metric-goldText text-xs font-bold transition-all"
            title="الأوسمة والإنجازات"
            aria-label="فتح الأوسمة والإنجازات"
          >
            <Trophy className="w-4 h-4 shrink-0" />
            <span>م {userLevel}</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={onOpenNotifications}
            className="relative min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-reader-surface hover:bg-reader-hover border border-reader-border text-reader-text transition-colors"
            title="التنبيهات"
            aria-label="فتح التنبيهات"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center shadow-md">
                {unreadCount}
              </span>
            )}
          </motion.button>

          <ThemeToggle />

          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleLogout}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-reader-surface hover:bg-reader-dangerSoft border border-reader-border text-reader-danger transition-colors"
            title="تسجيل الخروج"
            aria-label="تسجيل الخروج"
          >
            <LogOut className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </aside>
  );
}
