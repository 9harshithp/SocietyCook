import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { CookieConsentBanner } from './components/CookieConsentBanner';
import { initAnalytics, trackPageView } from './services/analytics';

// Lazy-loaded routes for optimal mobile performance and minimal initial bundle size
const LoginPage = React.lazy(() => import('./pages/AuthPages').then(m => ({ default: m.LoginPage })));
const RegisterPage = React.lazy(() => import('./pages/AuthPages').then(m => ({ default: m.RegisterPage })));
const ForgotPasswordPage = React.lazy(() => import('./pages/AuthPages').then(m => ({ default: m.ForgotPasswordPage })));
const DashboardHub = React.lazy(() => import('./pages/DashboardHub').then(m => ({ default: m.DashboardHub })));
const GroupHub = React.lazy(() => import('./pages/GroupHub').then(m => ({ default: m.GroupHub })));
const GroupDetailsPage = React.lazy(() => import('./pages/GroupDetailsPage').then(m => ({ default: m.GroupDetailsPage })));
const CookDirectoryPage = React.lazy(() => import('./pages/CookDirectoryPage').then(m => ({ default: m.CookDirectoryPage })));
const ScheduleCalendarPage = React.lazy(() => import('./pages/ScheduleCalendarPage').then(m => ({ default: m.ScheduleCalendarPage })));
const BillingPage = React.lazy(() => import('./pages/BillingPage').then(m => ({ default: m.BillingPage })));
const AnalyticsPage = React.lazy(() => import('./pages/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })));
const TermsPage = React.lazy(() => import('./pages/StaticPages').then(m => ({ default: m.TermsPage })));
const PrivacyPage = React.lazy(() => import('./pages/StaticPages').then(m => ({ default: m.PrivacyPage })));
const NotFoundPage = React.lazy(() => import('./pages/StaticPages').then(m => ({ default: m.NotFoundPage })));
const ForbiddenPage = React.lazy(() => import('./pages/StaticPages').then(m => ({ default: m.ForbiddenPage })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 2 // 2 minutes
    }
  }
});

// Protected Route Guard
function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex items-center gap-2 text-slate-500 font-bold text-xs">
          <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          Authenticating Society Session...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <ForbiddenPage />;
  }

  return children;
}

// SPA Navigation Listener for Duplicate-Free Google Analytics 4 Tracking
function AnalyticsListener() {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname + location.search, document.title);
  }, [location.pathname, location.search]);

  return null;
}

export function App() {
  useEffect(() => {
    initAnalytics();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AnalyticsListener />
          <div className="min-h-screen flex flex-col bg-[#FBF7EF] dark:bg-[#0D1613] text-[#202A25] dark:text-[#EDE8DF] font-sans transition-colors overflow-x-hidden w-full">
            <Navbar />
            <main className="flex-1 w-full overflow-x-hidden">
              <React.Suspense
                fallback={
                  <div className="min-h-[50vh] flex items-center justify-center p-8">
                    <div className="w-8 h-8 border-3 border-[#153D32] border-t-transparent rounded-full animate-spin" />
                  </div>
                }
              >
                <Routes>
                  {/* Public Marketing & Info */}
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/terms" element={<TermsPage />} />
                  <Route path="/privacy" element={<PrivacyPage />} />

                  {/* Core Application Protected Views */}
                <Route
                  path="/app"
                  element={
                    <ProtectedRoute>
                      <DashboardHub />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/groups"
                  element={
                    <ProtectedRoute>
                      <GroupHub />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/app/groups"
                  element={
                    <ProtectedRoute>
                      <GroupHub />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/groups/:id"
                  element={
                    <ProtectedRoute>
                      <GroupDetailsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/app/groups/:id"
                  element={
                    <ProtectedRoute>
                      <GroupDetailsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/cooks"
                  element={
                    <ProtectedRoute>
                      <CookDirectoryPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/app/cooks"
                  element={
                    <ProtectedRoute>
                      <CookDirectoryPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/schedule"
                  element={
                    <ProtectedRoute>
                      <ScheduleCalendarPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/app/schedule"
                  element={
                    <ProtectedRoute>
                      <ScheduleCalendarPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/billing"
                  element={
                    <ProtectedRoute>
                      <BillingPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/app/billing"
                  element={
                    <ProtectedRoute>
                      <BillingPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/analytics"
                  element={
                    <ProtectedRoute>
                      <AnalyticsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/app/analytics"
                  element={
                    <ProtectedRoute>
                      <AnalyticsPage />
                    </ProtectedRoute>
                  }
                />

                {/* 404 Catch-All */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </React.Suspense>
          </main>
          <CookieConsentBanner />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
