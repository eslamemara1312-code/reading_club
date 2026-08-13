import React, { lazy, Suspense, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DesktopSidebar } from './DesktopSidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { Navbar } from '../Navbar';
import { getAllBadges, getUserBadges } from '../../api/gamification';
import { getMyNotifications } from '../../api/notifications';
import { useAuthStore } from '../../store/authStore';

const BadgesModal = lazy(() => import('../BadgesModal').then((module) => ({ default: module.BadgesModal })));
const NotificationCenterModal = lazy(() => import('../NotificationCenterModal').then((module) => ({ default: module.NotificationCenterModal })));

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
  const [showDesktopSidebar, setShowDesktopSidebar] = useState(
    () => window.matchMedia('(min-width: 1200px)').matches,
  );
  const [showActivityRail, setShowActivityRail] = useState(
    () => window.matchMedia('(min-width: 1440px)').matches,
  );

  useEffect(() => {
    const desktopSidebarQuery = window.matchMedia('(min-width: 1200px)');
    const activityRailQuery = window.matchMedia('(min-width: 1440px)');
    const syncDesktopSidebar = (event: MediaQueryListEvent) => setShowDesktopSidebar(event.matches);
    const syncActivityRail = (event: MediaQueryListEvent) => setShowActivityRail(event.matches);

    desktopSidebarQuery.addEventListener('change', syncDesktopSidebar);
    activityRailQuery.addEventListener('change', syncActivityRail);

    return () => {
      desktopSidebarQuery.removeEventListener('change', syncDesktopSidebar);
      activityRailQuery.removeEventListener('change', syncActivityRail);
    };
  }, []);

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: getMyNotifications,
    enabled: !isReaderPage && showNotifications,
  });

  const { data: allBadges = [] } = useQuery({
    queryKey: ['allBadges'],
    queryFn: getAllBadges,
    enabled: !isReaderPage && showBadges,
  });

  const { data: userBadges = [] } = useQuery({
    queryKey: ['userBadges', user?.id],
    queryFn: () => getUserBadges(user!.id),
    enabled: !isReaderPage && showBadges && !!user?.id,
  });

  const openNotifications = onOpenNotifications ?? (() => setShowNotifications(true));
  const openBadges = onOpenBadges ?? (() => setShowBadges(true));

  if (isReaderPage) {
    return (
      <div className="h-[100svh] overflow-hidden bg-reader-canvas text-reader-text transition-colors">
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
        {showDesktopSidebar && (
          <DesktopSidebar
            onOpenNotifications={openNotifications}
            onOpenBadges={openBadges}
          />
        )}

        {/* Central Content Area */}
        <main id="main-content" className="rc-column-scroll h-full flex-1 min-w-0 overflow-y-auto px-4 sm:px-6 lg:px-7 py-5 sm:py-7 pb-24 md:pb-8">
          {!showDesktopSidebar && (
            <div className="mb-6">
              <Navbar
                onOpenNotifications={openNotifications}
                onOpenBadges={openBadges}
              />
            </div>
          )}
          {children}
        </main>

        {/* Optional Left Activity Rail (Wide Desktop Only) */}
        {leftRail && showActivityRail && (
          <aside className="rc-column-scroll h-full w-[320px] min-[1536px]:w-[360px] shrink-0 py-7 px-5 border-r border-reader-border bg-reader-panel transition-colors overflow-y-auto">
            {leftRail}
          </aside>
        )}
      </div>

      {/* Fixed Mobile Bottom Navigation */}
      {!showDesktopSidebar && <MobileBottomNav />}

      {showBadges && (
        <Suspense fallback={null}>
          <BadgesModal
            allBadges={allBadges}
            userBadges={userBadges}
            onClose={() => setShowBadges(false)}
          />
        </Suspense>
      )}

      {showNotifications && (
        <Suspense fallback={null}>
          <NotificationCenterModal
            notifications={notifications}
            onClose={() => setShowNotifications(false)}
          />
        </Suspense>
      )}
    </div>
  );
}
