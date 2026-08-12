import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Onboarding } from './pages/Onboarding';
import { Dashboard } from './pages/Dashboard';
import { ProtectedRoute } from './components/ProtectedRoute';

import { VaultPage } from './pages/Vault';
import { CalendarPage } from './pages/CalendarPage';
import { BookPage } from './pages/BookPage';
import { ReaderPage } from './pages/ReaderPage';
import { DiscussionPage } from './pages/DiscussionPage';
import ProfilePage from './pages/ProfilePage';
import { GroupSettingsPage } from './pages/GroupSettingsPage';
import { ToastContainer } from './components/Toast';
import { useAuthStore } from './store/authStore';
import { useUIStore } from './store/uiStore';
import { getCurrentUser } from './api/auth';
import { getMyGroups } from './api/groups';

import Lenis from 'lenis';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      retry: 1,
    },
  },
});

export function App() {
  const { isAuthenticated, setUser } = useAuthStore();
  const { activeGroupId, setActiveGroupId, initTheme } = useUIStore();

  // Root theme initialization
  useEffect(() => {
    initTheme();
  }, [initTheme]);

  // Smooth Scroll Initialization with Lenis (Desktop only to preserve mobile native touch inertia scroll)
  useEffect(() => {
    const isDesktop = window.innerWidth >= 1024 && window.matchMedia('(pointer: fine)').matches;
    if (!isDesktop) return;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      getCurrentUser()
        .then((u) => setUser(u))
        .catch(() => {});

      getMyGroups()
        .then((groups) => {
          if (groups && groups.length > 0) {
            const hasGroup = groups.some((g) => g.id === activeGroupId);
            if (!hasGroup || !activeGroupId) {
              setActiveGroupId(groups[0].id);
            }
          } else {
            setActiveGroupId(null);
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated, setUser, setActiveGroupId, activeGroupId]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ToastContainer />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vault"
            element={
              <ProtectedRoute>
                <VaultPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/calendar"
            element={
              <ProtectedRoute>
                <CalendarPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/books"
            element={
              <ProtectedRoute>
                <BookPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/groups/:groupId/books/:bookId/read"
            element={
              <ProtectedRoute>
                <ReaderPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/discussions"
            element={
              <ProtectedRoute>
                <DiscussionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <GroupSettingsPage />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
