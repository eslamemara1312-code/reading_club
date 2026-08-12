import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Calendar, 
  ShieldAlert, 
  Bell, 
  User as UserIcon, 
  LogOut, 
  ChevronDown,
  Settings,
  Sparkles,
  Users
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { useQuery } from '@tanstack/react-query';
import { getGroupDetails, Group } from '../api/groups';
import { getMyNotifications } from '../api/notifications';
import { ThemeToggle } from './layout/ThemeToggle';

interface NavbarProps {
  onOpenNotifications?: () => void;
  onOpenBadges?: () => void;
}

export function Navbar({ onOpenNotifications, onOpenBadges }: NavbarProps) {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { activeGroupId } = useUIStore();
  const navigate = useNavigate();

  const [groupDropdownOpen, setGroupDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

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

  const desktopNavItems = [
    { to: '/dashboard', label: 'الرئيسية', icon: BookOpen },
    { to: '/books', label: 'مكتبتي', icon: BookOpen },
    { to: '/calendar', label: 'التقويم', icon: Calendar },
    { to: '/vault', label: 'الخزينة', icon: ShieldAlert },
    { to: '/discussions', label: 'النادي', icon: Users },
  ];

  return (
    <header className="sticky top-0 z-40 px-3 sm:px-6 py-3 safe-area-top transition-all bg-reader-glass backdrop-blur-2xl border-b border-reader-border w-full max-w-full overflow-hidden">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Logo & Group Selector */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0 min-w-0">
          <NavLink to="/dashboard" className="flex items-center gap-2 group shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-reader-surface border border-reader-borderStrong flex items-center justify-center text-reader-accent shadow-sm">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="hidden md:flex flex-col">
              <span className="font-black text-sm tracking-tight text-reader-text group-hover:text-reader-accent transition-colors">
                نادي القراءة
              </span>
              <span className="text-[9px] text-reader-muted font-bold -mt-0.5 tracking-wider uppercase">مجتمع القراء</span>
            </div>
          </NavLink>

          {/* Active Group Selector */}
          <div className="relative">
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => setGroupDropdownOpen(!groupDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-reader-surface hover:bg-reader-hover border border-reader-border text-xs font-semibold text-reader-text transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-reader-accent shrink-0" />
              <span className="max-w-[85px] xs:max-w-[120px] sm:max-w-[160px] truncate text-[11px] sm:text-xs font-bold">
                {activeGroup?.name || 'اختر مجموعة'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-reader-muted shrink-0" />
            </motion.button>

            <AnimatePresence>
              {groupDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  className="absolute right-0 mt-2 w-56 p-2 rounded-2xl bg-reader-surface border border-reader-border shadow-2xl z-50 space-y-1"
                >
                  <div className="px-3 py-2 border-b border-reader-border text-[11px] font-medium text-reader-muted">
                    المجموعة الحالية
                  </div>
                  <div className="px-3 py-2 rounded-xl bg-reader-raised text-xs font-bold text-reader-text flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-reader-metric-goldText shrink-0" />
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
        </div>

        {/* Top Header Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1.5 p-1 rounded-2xl bg-reader-surface border border-reader-border">
          {desktopNavItems.map((item) => {
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `px-4 py-1.5 rounded-xl text-xs font-bold transition-all relative ${
                    isActive
                      ? 'text-reader-accent bg-reader-accentSoft shadow-sm border border-reader-borderStrong'
                      : 'text-reader-muted hover:text-reader-text hover:bg-reader-hover'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span>{item.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="activeTopNavBadge"
                        className="absolute bottom-0 left-3 right-3 h-0.5 bg-reader-accent rounded-full"
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Right Actions: Level, Badges, Notifications, Theme Toggle & Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Level Badge Pill */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={onOpenBadges}
            className="min-h-[44px] flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-reader-surface border border-reader-border text-reader-metric-goldText text-[10px] sm:text-xs font-extrabold hover:bg-reader-hover transition-all shrink-0"
            aria-label="فتح الأوسمة والإنجازات"
          >
            <span>م {userLevel}</span>
            <span className="text-[10px] text-reader-muted font-normal hidden sm:inline">({userXp} XP)</span>
          </motion.button>

          {/* Theme Toggle Button */}
          <ThemeToggle />

          {/* Notifications Icon Button */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={onOpenNotifications}
            className="relative p-2 rounded-xl bg-reader-surface hover:bg-reader-hover border border-reader-border text-reader-text transition-colors shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="التنبيهات"
          >
            <Bell className="w-4 h-4 text-reader-text" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center shadow-md">
                {unreadCount}
              </span>
            )}
          </motion.button>

          {/* User Profile Dropdown Menu */}
          <div className="relative shrink-0">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center gap-1.5 p-1 rounded-xl bg-reader-surface hover:bg-reader-hover border border-reader-border text-reader-text transition-colors"
              aria-label="فتح قائمة الحساب"
            >
              <div className="w-7 h-7 rounded-lg bg-reader-raised border border-reader-border text-reader-accent text-xs font-black flex items-center justify-center overflow-hidden shrink-0">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user?.name ? user.name.charAt(0).toUpperCase() : 'U'
                )}
              </div>
              <span className="text-xs font-bold max-w-[85px] truncate hidden md:inline-block pr-1 text-reader-text">{user?.name}</span>
            </motion.button>

            <AnimatePresence>
              {profileDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                  className="absolute left-0 mt-2 w-56 rounded-2xl bg-reader-surface backdrop-blur-xl shadow-2xl border border-reader-border overflow-hidden z-50 py-1.5"
                >
                  <div className="px-3.5 py-2.5 border-b border-reader-border">
                    <p className="text-xs font-black text-reader-text truncate">{user?.name}</p>
                    <p className="text-[10px] text-reader-metric-goldText font-bold mt-0.5">مستوى {userLevel} • {userXp} XP</p>
                  </div>

                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      navigate('/profile');
                    }}
                    className="w-full text-right px-3.5 py-2.5 text-xs text-reader-muted hover:bg-reader-hover hover:text-reader-text flex items-center gap-2 font-bold transition-colors"
                  >
                    <UserIcon className="w-4 h-4 text-reader-accent" />
                    الملف الشخصي
                  </button>

                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      navigate('/settings');
                    }}
                    className="w-full text-right px-3.5 py-2.5 text-xs text-reader-muted hover:bg-reader-hover hover:text-reader-text flex items-center gap-2 font-bold transition-colors"
                  >
                    <Settings className="w-4 h-4 text-reader-muted" />
                    إعدادات المجموعة
                  </button>

                  <div className="border-t border-reader-border my-1" />

                  <button
                    onClick={handleLogout}
                    className="w-full text-right px-3.5 py-2.5 text-xs text-red-400 hover:bg-red-500/10 font-bold flex items-center gap-2 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    تسجيل الخروج
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
