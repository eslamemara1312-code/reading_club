import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Calendar, MessageSquare, User as UserIcon } from 'lucide-react';

export function MobileBottomNav() {
  const mobileNavItems = [
    { to: '/dashboard', label: 'الرئيسية', icon: BookOpen },
    { to: '/books', label: 'الكتب', icon: BookOpen },
    { to: '/calendar', label: 'التقويم', icon: Calendar },
    { to: '/discussions', label: 'النادي', icon: MessageSquare },
    { to: '/profile', label: 'حسابي', icon: UserIcon },
  ];

  return (
    <nav aria-label="التنقل الرئيسي للهاتف" className="fixed bottom-0 left-0 right-0 z-40 bg-reader-glass backdrop-blur-2xl border-t border-reader-border py-2 px-3 flex md:hidden items-center justify-around shadow-2xl safe-area-bottom">
      {mobileNavItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `relative min-w-[44px] min-h-[44px] flex flex-col items-center justify-center gap-1 text-[10px] font-bold py-1 px-3 rounded-xl transition-all ${
                isActive
                  ? 'text-reader-accent'
                  : 'text-reader-muted hover:text-reader-text'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className="w-5 h-5 z-10" />
                <span className="z-10">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeMobileBottomTab"
                    className="absolute inset-0 rounded-xl bg-reader-accentSoft border border-reader-borderStrong"
                    transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                  />
                )}
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}
