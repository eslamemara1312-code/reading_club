import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DesktopSidebar } from './DesktopSidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { Navbar } from '../Navbar';
import { BadgesModal } from '../BadgesModal';
import { NotificationCenterModal } from '../NotificationCenterModal';
import { getAllBadges, getUserBadges } from '../../api/gamification';
import { getMyNotifications } from '../../api/notifications';
import { useAuthStore } from '../../store/authStore';

interface AppShellProps {
  children: React.ReactNode;
  leftRail?: React.ReactNode;
  isReaderPage?: boolean;
  onOpenNotifications?: () => void;
  onOpenBadges?: () => void;
}

export function AppShell({
  children,
  leftRail,
  isReaderPage = false,
  onOpenNotifications,
  onOpenBadges,
}: AppShellProps) {
  const user = useAuthStore((state) => state.user);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showBadges, setShowBadges] = useState(false);

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: getMyNotifications,
    enabled: !isReaderPage,
  });

  const { data: allBadges = [] } = useQuery({
    queryKey: ['allBadges'],
    queryFn: getAllBadges,
    enabled: !isReaderPage,
  });

  const { data: userBadges = [] } = useQuery({
    queryKey: ['userBadges', user?.id],
    queryFn: () => getUserBadges(user!.id),
    enabled: !isReaderPage && !!user?.id,
  });

  const openNotifications = onOpenNotifications ?? (() => setShowNotifications(true));
  const openBadges = onOpenBadges ?? (() => setShowBadges(true));

  if (isReaderPage) {
    return (
      <div className="h-dvh overflow-hidden bg-reader-canvas text-reader-text transition-colors">
        {children}
      </div>
    );
  }

  return (
    <div className="rc-app-stage bg-reader-canvas text-reader-text transition-colors selection:bg-reader-accentSoft selection:text-reader-accent">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:right-4 focus:z-[70] focus:rounded-xl focus:bg-reader-accent focus:px-4 focus:py-3 focus:text-reader-accentForeground focus:font-bold">
        تخطي إلى المحتوى
      </a>

      <div className="rc-app-frame">
        {/* RTL Right Sidebar (Desktop) */}
        <DesktopSidebar
          onOpenNotifications={openNotifications}
          onOpenBadges={openBadges}
        />

        {/* Central Content Area */}
        <main id="main-content" className="rc-column-scroll h-full flex-1 min-w-0 overflow-y-auto px-4 sm:px-6 lg:px-7 py-5 sm:py-7 pb-24 md:pb-8">
          <div className="mb-6 block min-[1200px]:hidden">
            <Navbar
              onOpenNotifications={openNotifications}
              onOpenBadges={openBadges}
            />
          </div>
          {children}
        </main>

        {/* Optional Left Activity Rail (Wide Desktop Only) */}
        {leftRail && (
          <aside className="rc-column-scroll h-full w-[320px] min-[1536px]:w-[360px] shrink-0 py-7 px-5 hidden min-[1440px]:block border-r border-reader-border bg-reader-panel transition-colors overflow-y-auto">
            {leftRail}
          </aside>
        )}
      </div>

      {/* Fixed Mobile Bottom Navigation */}
      <MobileBottomNav />

      {showBadges && (
        <BadgesModal
          allBadges={allBadges}
          userBadges={userBadges}
          onClose={() => setShowBadges(false)}
        />
      )}

      {showNotifications && (
        <NotificationCenterModal
          notifications={notifications}
          onClose={() => setShowNotifications(false)}
        />
      )}
    </div>
  );
}
