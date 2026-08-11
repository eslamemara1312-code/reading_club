import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Trophy, 
  Calendar, 
  ShieldAlert, 
  MessageSquare, 
  Bell, 
  User as UserIcon, 
  LogOut, 
  ChevronDown,
  Settings,
  Sparkles,
  Users,
  Sun,
  Moon
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { useQuery } from '@tanstack/react-query';
import { getGroupDetails, Group } from '../api/groups';
import { getMyNotifications } from '../api/notifications';

interface NavbarProps {
  onOpenNotifications?: () => void;
  onOpenBadges?: () => void;
}

export function Navbar({ onOpenNotifications, onOpenBadges }: NavbarProps) {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { activeGroupId, theme, toggleTheme, initTheme } = useUIStore();
  const navigate = useNavigate();

  const [groupDropdownOpen, setGroupDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  useEffect(() => {
    initTheme();
  }, [initTheme]);

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

  const mobileNavItems = [
    { to: '/dashboard', label: 'الرئيسية', icon: BookOpen },
    { to: '/books', label: 'الكتب', icon: BookOpen },
    { to: '/calendar', label: 'التقويم', icon: Calendar },
    { to: '/discussions', label: 'النادي', icon: MessageSquare },
    { to: '/profile', label: 'حسابي', icon: UserIcon },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 px-2.5 sm:px-8 py-2.5 sm:py-3.5 safe-area-top transition-all bg-apple-header backdrop-blur-2xl border-b border-apple-border w-full max-w-full overflow-hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          {/* Brand Logo & Group Selector */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0 min-w-0">
            <NavLink to="/dashboard" className="flex items-center gap-2 group shrink-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-apple-surface border border-apple-gold/30 flex items-center justify-center text-apple-gold shadow-sm">
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="hidden md:flex flex-col">
                <span className="font-black text-sm tracking-tight text-apple-text group-hover:text-apple-gold transition-colors">
                  نادي القراءة
                </span>
                <span className="text-[9px] text-apple-gold font-bold -mt-0.5 tracking-wider uppercase">مجتمع القراء</span>
              </div>
            </NavLink>

            {/* Active Group Selector */}
            <div className="relative">
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => setGroupDropdownOpen(!groupDropdownOpen)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-apple-surface hover:bg-apple-elevated border border-apple-border text-xs font-semibold text-apple-text transition-colors"
              >
                <span className="w-2 h-2 rounded-full bg-apple-gold shrink-0" />
                <span className="max-w-[75px] xs:max-w-[110px] sm:max-w-[150px] truncate text-[11px] sm:text-xs font-bold">
                  {activeGroup?.name || 'اختر مجموعة'}
                </span>
                <ChevronDown className="w-3 h-3 text-apple-muted shrink-0" />
              </motion.button>

              <AnimatePresence>
                {groupDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    className="absolute right-0 mt-2 w-56 p-2 rounded-2xl bg-apple-surface border border-apple-border shadow-2xl z-50 space-y-1"
                  >
                    <div className="px-3 py-2 border-b border-apple-border text-[11px] font-medium text-apple-secondary">
                      المجموعة الحالية
                    </div>
                    <div className="px-3 py-2 rounded-xl bg-apple-card text-xs font-bold text-apple-text flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-apple-gold shrink-0" />
                      <span className="truncate">{activeGroup?.name || 'مجموعة تجريبية'}</span>
                    </div>
                    <NavLink
                      to="/onboarding"
                      onClick={() => setGroupDropdownOpen(false)}
                      className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold text-apple-gold hover:bg-apple-card rounded-xl transition-colors"
                    >
                      + تبديل أو إنضمام لمجموعة
                    </NavLink>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Quiet Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1.5 p-1 rounded-2xl bg-apple-surface border border-apple-border">
            {desktopNavItems.map((item) => {
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `px-4 py-1.5 rounded-xl text-xs font-bold transition-all relative ${
                      isActive
                        ? 'text-apple-gold bg-apple-card shadow-sm border border-apple-gold/20'
                        : 'text-apple-secondary hover:text-apple-text hover:bg-apple-card/50'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span>{item.label}</span>
                      {isActive && (
                        <motion.div
                          layoutId="activeTabBadge"
                          className="absolute bottom-0 left-3 right-3 h-0.5 bg-apple-gold rounded-full"
                          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                        />
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Actions: Level, Badges, Notifications, Theme Switcher & Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Level Badge Pill */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={onOpenBadges}
              className="flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-apple-surface border border-apple-gold/30 text-apple-gold text-[10px] sm:text-xs font-extrabold hover:border-apple-gold/50 transition-all shrink-0"
            >
              <Trophy className="w-3.5 h-3.5 text-apple-gold shrink-0" />
              <span>م {userLevel}</span>
              <span className="text-[10px] text-apple-secondary font-normal hidden sm:inline">({userXp} XP)</span>
            </motion.button>

            {/* Theme Toggle Button (Sun / Moon) */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              className="p-1.5 sm:p-2 rounded-xl bg-apple-surface hover:bg-apple-elevated border border-apple-border text-apple-text transition-colors shrink-0"
              title={theme === 'dark' ? 'التبديل إلى الوضع الفاتح (Light Mode)' : 'التبديل إلى الوضع الداكن (Dark Mode)'}
              aria-label="تبديل المظهر"
            >
              {theme === 'dark' ? (
                <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-apple-gold" />
              ) : (
                <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-apple-text" />
              )}
            </motion.button>

            {/* Notifications Icon Button */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={onOpenNotifications}
              className="relative p-1.5 sm:p-2 rounded-xl bg-apple-surface hover:bg-apple-elevated border border-apple-border text-apple-muted transition-colors shrink-0"
              aria-label="التنبيهات"
            >
              <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-apple-text" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-apple-red text-[9px] font-bold text-white flex items-center justify-center shadow-md">
                  {unreadCount}
                </span>
              )}
            </motion.button>

            {/* User Profile Menu */}
            <div className="relative shrink-0">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-1.5 p-1 rounded-xl bg-apple-surface hover:bg-apple-elevated border border-apple-border text-apple-text transition-colors"
              >
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-apple-card border border-apple-border text-apple-gold text-xs font-black flex items-center justify-center overflow-hidden shrink-0">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    user?.name ? user.name.charAt(0).toUpperCase() : 'U'
                  )}
                </div>
                <span className="text-xs font-bold max-w-[85px] truncate hidden md:inline-block pr-1 text-apple-text">{user?.name}</span>
              </motion.button>

              <AnimatePresence>
                {profileDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                    className="absolute left-0 mt-2 w-56 rounded-2xl bg-apple-surface backdrop-blur-xl shadow-2xl border border-apple-border overflow-hidden z-50 py-1.5"
                  >
                    <div className="px-3.5 py-2.5 border-b border-apple-border">
                      <p className="text-xs font-black text-apple-text truncate">{user?.name}</p>
                      <p className="text-[10px] text-apple-gold font-bold mt-0.5">مستوى {userLevel} • {userXp} XP</p>
                    </div>

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        navigate('/profile');
                      }}
                      className="w-full text-right px-3.5 py-2.5 text-xs text-apple-secondary hover:bg-apple-elevated hover:text-apple-text flex items-center gap-2 font-bold transition-colors"
                    >
                      <UserIcon className="w-4 h-4 text-apple-gold" />
                      الملف الشخصي
                    </button>

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        navigate('/settings');
                      }}
                      className="w-full text-right px-3.5 py-2.5 text-xs text-apple-secondary hover:bg-apple-elevated hover:text-apple-text flex items-center gap-2 font-bold transition-colors"
                    >
                      <Settings className="w-4 h-4 text-apple-muted" />
                      إعدادات المجموعة
                    </button>

                    <div className="border-t border-apple-border my-1" />

                    <button
                      onClick={handleLogout}
                      className="w-full text-right px-3.5 py-2.5 text-xs text-apple-red hover:bg-apple-red/10 font-bold flex items-center gap-2 transition-colors"
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

      {/* Floating Translucent Mobile Navigation Bar */}
      <nav className="fixed bottom-3 left-3 right-3 z-40 bg-apple-header backdrop-blur-xl border border-apple-border rounded-2xl py-2 px-3 flex lg:hidden items-center justify-around shadow-2xl safe-area-bottom">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `relative flex flex-col items-center gap-1 text-[10px] font-bold py-1 px-3 rounded-xl transition-all ${
                  isActive
                    ? 'text-apple-gold'
                    : 'text-apple-secondary hover:text-apple-text'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="w-5 h-5 z-10" />
                  <span className="z-10">{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeMobileTab"
                      className="absolute inset-0 rounded-xl bg-apple-gold/10 border border-apple-gold/30"
                      transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                    />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>
    </>
  );
}


