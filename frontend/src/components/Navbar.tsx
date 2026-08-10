import { useState } from 'react';
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
  Settings
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
    { to: '/books', label: 'الكتاب', icon: BookOpen },
    { to: '/calendar', label: 'التقويم', icon: Calendar },
    { to: '/vault', label: 'الخزينة', icon: ShieldAlert },
    { to: '/discussions', label: 'النقاشات', icon: MessageSquare },
  ];

  const mobileNavItems = [
    { to: '/dashboard', label: 'الرئيسية', icon: BookOpen },
    { to: '/books', label: 'الكتاب', icon: BookOpen },
    { to: '/calendar', label: 'التقويم', icon: Calendar },
    { to: '/discussions', label: 'النقاشات', icon: MessageSquare },
    { to: '/profile', label: 'حسابي', icon: UserIcon },
  ];

  return (
    <header className="sticky top-0 z-40 glass-header px-2.5 sm:px-4 py-2 safe-area-top transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand & Group Selector */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          <NavLink to="/dashboard" className="flex items-center gap-2 group">
            <motion.div 
              whileHover={{ scale: 1.08, rotate: -5 }}
              whileTap={{ scale: 0.95 }}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20"
            >
              <div className="w-full h-full bg-obsidian-900 rounded-[10px] flex items-center justify-center">
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
              </div>
            </motion.div>
            <span className="font-extrabold text-base sm:text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-emerald-400 hidden sm:inline-block">
              نادي القراءة
            </span>
          </NavLink>

          {/* Active Group Selector */}
          <div className="relative">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setGroupDropdownOpen(!groupDropdownOpen)}
              className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-xs font-semibold text-slate-200 transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="max-w-[85px] sm:max-w-[130px] truncate text-[11px] sm:text-xs">{activeGroup?.name || 'اختر مجموعة'}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${groupDropdownOpen ? 'rotate-180' : ''}`} />
            </motion.button>

            <AnimatePresence>
              {groupDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-56 rounded-xl glass-panel shadow-2xl border border-slate-700/80 overflow-hidden z-50 py-1.5"
                >
                  <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">المجموعة الحالية</div>
                  {activeGroup ? (
                    <div className="px-3 py-2 text-xs text-emerald-300 font-bold bg-emerald-500/15 border-r-2 border-emerald-500 flex items-center justify-between">
                      <span className="truncate">{activeGroup.name}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    </div>
                  ) : (
                    <div className="px-3 py-2 text-xs text-slate-400">لا توجد مجموعة محددة</div>
                  )}

                  <div className="border-t border-slate-800 my-1 pt-1">
                    <button
                      onClick={() => {
                        setGroupDropdownOpen(false);
                        navigate('/onboarding');
                      }}
                      className="w-full text-right px-3 py-2 text-xs text-emerald-400 font-semibold hover:bg-emerald-500/10 transition-colors"
                    >
                      + الانضمام أو إنشاء مجموعة
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Navigation Tabs (Desktop & Tablet) */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800/80">
          {desktopNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `relative px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    isActive
                      ? 'text-emerald-400 bg-emerald-500/10 shadow-sm border border-emerald-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Right Actions: Level, Badges, Notifications & Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Level Pill */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onOpenBadges}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] sm:text-xs font-semibold hover:bg-amber-500/20 transition-colors shadow-sm"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>مستوى {userLevel}</span>
            <span className="text-[10px] text-amber-400/80 font-normal hidden sm:inline">({userXp} XP)</span>
          </motion.button>

          {/* Notifications Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onOpenNotifications}
            className="relative p-1.5 sm:p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-300 transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </motion.button>

          {/* User Profile Menu */}
          <div className="relative">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-1.5 p-1 rounded-full bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-200 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-xs font-black flex items-center justify-center shadow-md overflow-hidden shrink-0">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user?.name ? user.name.charAt(0).toUpperCase() : 'U'
                )}
              </div>
              <span className="text-xs font-semibold max-w-[80px] truncate hidden md:inline-block pr-1">{user?.name}</span>
            </motion.button>

            <AnimatePresence>
              {profileDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 mt-2 w-52 rounded-xl glass-panel shadow-2xl border border-slate-700/80 overflow-hidden z-50 py-1.5"
                >
                  <div className="px-3 py-2 border-b border-slate-800">
                    <p className="text-xs font-bold text-white truncate">{user?.name}</p>
                  </div>

                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      navigate('/profile');
                    }}
                    className="w-full text-right px-3 py-2 text-xs text-slate-300 hover:bg-slate-800/80 hover:text-white flex items-center gap-2 transition-colors"
                  >
                    <UserIcon className="w-4 h-4 text-emerald-400" />
                    الملف الشخصي
                  </button>

                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      navigate('/settings');
                    }}
                    className="w-full text-right px-3 py-2 text-xs text-slate-300 hover:bg-slate-800/80 hover:text-white flex items-center gap-2 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    إعدادات المجموعة
                  </button>

                  <div className="border-t border-slate-800 my-1" />

                  <button
                    onClick={handleLogout}
                    className="w-full text-right px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 font-semibold flex items-center gap-2 transition-colors"
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

      {/* Fixed Bottom Navigation Bar for Mobile App Feel */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-obsidian-900/95 backdrop-blur-xl border-t border-slate-800/90 py-2 px-2 flex lg:hidden items-center justify-around shadow-2xl safe-area-bottom">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 text-[10px] font-bold py-1 px-2 rounded-xl transition-all ${
                  isActive
                    ? 'text-emerald-400 bg-emerald-500/15 border border-emerald-500/25 shadow-glow-emerald scale-105'
                    : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </header>
  );
}

