import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ToastContainer } from './components/Toast';
import { useAuthStore } from './store/authStore';
import { useUIStore } from './store/uiStore';
import { getCurrentUser } from './api/auth';
import { getMyGroups } from './api/groups';

const Login = lazy(() => import('./pages/Login').then((module) => ({ default: module.Login })));
const Register = lazy(() => import('./pages/Register').then((module) => ({ default: module.Register })));
const Onboarding = lazy(() => import('./pages/Onboarding').then((module) => ({ default: module.Onboarding })));
const Dashboard = lazy(() => import('./pages/Dashboard').then((module) => ({ default: module.Dashboard })));
const VaultPage = lazy(() => import('./pages/Vault').then((module) => ({ default: module.VaultPage })));
const CalendarPage = lazy(() => import('./pages/CalendarPage').then((module) => ({ default: module.CalendarPage })));
const BookPage = lazy(() => import('./pages/BookPage').then((module) => ({ default: module.BookPage })));
const ReaderPage = lazy(() => import('./pages/ReaderPage').then((module) => ({ default: module.ReaderPage })));
const DiscussionPage = lazy(() => import('./pages/DiscussionPage').then((module) => ({ default: module.DiscussionPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const GroupSettingsPage = lazy(() => import('./pages/GroupSettingsPage').then((module) => ({ default: module.GroupSettingsPage })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      retry: 1,
    },
  },
});

function RouteFallback() {
  return (
    <div className="min-h-screen bg-reader-canvas text-reader-text flex items-center justify-center" role="status" aria-label="جارٍ تحميل الصفحة">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-reader-border border-t-reader-accent" />
    </div>
  );
}

export function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setUser = useAuthStore((state) => state.setUser);
  const setActiveGroupId = useUIStore((state) => state.setActiveGroupId);
  const initTheme = useUIStore((state) => state.initTheme);

  // Root theme initialization
  useEffect(() => {
    initTheme();
  }, [initTheme]);

  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;

    getCurrentUser()
      .then((user) => {
        if (!cancelled) setUser(user);
      })
      .catch(() => {});

    getMyGroups()
      .then((groups) => {
        if (cancelled) return;

        if (groups && groups.length > 0) {
          const activeGroupId = useUIStore.getState().activeGroupId;
          const hasGroup = groups.some((group) => group.id === activeGroupId);
          if (!hasGroup) setActiveGroupId(groups[0].id);
        } else {
          setActiveGroupId(null);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, setUser, setActiveGroupId]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ToastContainer />
        <Suspense fallback={<RouteFallback />}>
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
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
