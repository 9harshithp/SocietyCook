import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PWAProvider } from './context/PWAContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { CookieConsentBanner } from './components/CookieConsentBanner';
import { InstallAppBanner } from './components/InstallAppBanner';
import { UpdateNotificationBanner } from './components/UpdateNotificationBanner';
import { initAnalytics, trackPageView } from './services/analytics';
import { registerServiceWorker } from './serviceWorkerRegistration';
import { DashboardLayout, getRoleDashboardPath } from './layouts/DashboardLayout';

// Lazy-loaded routes for optimal mobile performance and minimal initial bundle size
const LoginPage = React.lazy(() => import('./pages/AuthPages').then(m => ({ default: m.LoginPage })));
const RegisterPage = React.lazy(() => import('./pages/AuthPages').then(m => ({ default: m.RegisterPage })));
const ForgotPasswordPage = React.lazy(() => import('./pages/AuthPages').then(m => ({ default: m.ForgotPasswordPage })));
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

// Resident Views
const ResidentOverviewPage = React.lazy(() => import('./pages/dashboard/ResidentViews').then(m => ({ default: m.ResidentOverviewPage })));
const ResidentServicesPage = React.lazy(() => import('./pages/dashboard/ResidentViews').then(m => ({ default: m.ResidentServicesPage })));
const ResidentBookingsPage = React.lazy(() => import('./pages/dashboard/ResidentViews').then(m => ({ default: m.ResidentBookingsPage })));
const ResidentNotificationsPage = React.lazy(() => import('./pages/dashboard/ResidentViews').then(m => ({ default: m.ResidentNotificationsPage })));
const ResidentSupportPage = React.lazy(() => import('./pages/dashboard/ResidentViews').then(m => ({ default: m.ResidentSupportPage })));
const ResidentProfilePage = React.lazy(() => import('./pages/dashboard/ResidentViews').then(m => ({ default: m.ResidentProfilePage })));
const ResidentSettingsPage = React.lazy(() => import('./pages/dashboard/ResidentViews').then(m => ({ default: m.ResidentSettingsPage })));

// Professional Views
const ProfessionalDashboardPage = React.lazy(() => import('./pages/dashboard/ProfessionalViews').then(m => ({ default: m.ProfessionalDashboardPage })));
const ProfessionalEarningsPage = React.lazy(() => import('./pages/dashboard/ProfessionalViews').then(m => ({ default: m.ProfessionalEarningsPage })));
const ProfessionalAvailabilityPage = React.lazy(() => import('./pages/dashboard/ProfessionalViews').then(m => ({ default: m.ProfessionalAvailabilityPage })));
const ProfessionalProfilePage = React.lazy(() => import('./pages/dashboard/ProfessionalViews').then(m => ({ default: m.ProfessionalProfilePage })));

// Society Manager Views
const SocietyDashboardPage = React.lazy(() => import('./pages/dashboard/SocietyViews').then(m => ({ default: m.SocietyDashboardPage })));
const SocietyHouseholdsPage = React.lazy(() => import('./pages/dashboard/SocietyViews').then(m => ({ default: m.SocietyHouseholdsPage })));
const SocietyProfessionalsPage = React.lazy(() => import('./pages/dashboard/SocietyViews').then(m => ({ default: m.SocietyProfessionalsPage })));
const SocietyComplaintsPage = React.lazy(() => import('./pages/dashboard/SocietyViews').then(m => ({ default: m.SocietyComplaintsPage })));
const SocietySettingsPage = React.lazy(() => import('./pages/dashboard/SocietyViews').then(m => ({ default: m.SocietySettingsPage })));

// Admin Views
const AdminDashboardPage = React.lazy(() => import('./pages/dashboard/AdminViews').then(m => ({ default: m.AdminDashboardPage })));
const AdminSocietiesPage = React.lazy(() => import('./pages/dashboard/AdminViews').then(m => ({ default: m.AdminSocietiesPage })));
const AdminVerificationPage = React.lazy(() => import('./pages/dashboard/AdminViews').then(m => ({ default: m.AdminVerificationPage })));
const AdminSecurityPage = React.lazy(() => import('./pages/dashboard/AdminViews').then(m => ({ default: m.AdminSecurityPage })));

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
    registerServiceWorker();
  }, []);

  return (
    <AuthProvider>
      <PWAProvider>
        <BrowserRouter>
          <AnalyticsListener />
          <div className="min-h-screen flex flex-col bg-[#FBF7EF] dark:bg-[#0D1613] text-[#202A25] dark:text-[#EDE8DF] font-sans transition-colors overflow-x-clip w-full">
            <Navbar />
            <main className="flex-1 w-full overflow-x-clip">
              <React.Suspense
                fallback={
                  <div className="min-h-[50vh] flex items-center justify-center p-8">
                    <div className="w-8 h-8 border-3 border-[#153D32] border-t-transparent rounded-full animate-spin" />
                  </div>
                }
              >
                <Routes>
                  {/* Public Marketing & Legal Pages */}
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/terms" element={<TermsPage />} />
                  <Route path="/privacy" element={<PrivacyPage />} />

                  {/* Nested Application Layout & URL-Driven Dashboard Architecture */}
                  <Route
                    path="/app"
                    element={
                      <ProtectedRoute>
                        <DashboardLayout />
                      </ProtectedRoute>
                    }
                  >
                    {/* Resident Sub-Routes */}
                    <Route path="dashboard" element={<ResidentOverviewPage />} />
                    <Route path="discover" element={<CookDirectoryPage />} />
                    <Route path="cooks" element={<CookDirectoryPage />} />
                    <Route path="services" element={<ResidentServicesPage />} />
                    <Route path="bookings" element={<ResidentBookingsPage />} />
                    <Route path="bookings/:bookingId" element={<ResidentBookingsPage />} />
                    <Route path="community" element={<GroupHub />} />
                    <Route path="community/:id" element={<GroupDetailsPage />} />
                    <Route path="groups" element={<GroupHub />} />
                    <Route path="groups/:id" element={<GroupDetailsPage />} />
                    <Route path="subscriptions" element={<BillingPage />} />
                    <Route path="billing" element={<BillingPage />} />
                    <Route path="payments" element={<BillingPage />} />
                    <Route path="notifications" element={<ResidentNotificationsPage />} />
                    <Route path="support" element={<ResidentSupportPage />} />
                    <Route path="profile" element={<ResidentProfilePage />} />
                    <Route path="settings" element={<ResidentSettingsPage />} />
                    <Route path="schedule" element={<ScheduleCalendarPage />} />
                    <Route path="analytics" element={<AnalyticsPage />} />

                    {/* Professional Sub-Routes */}
                    <Route
                      path="professional/dashboard"
                      element={
                        <ProtectedRoute allowedRoles={['COOK', 'ADMIN']}>
                          <ProfessionalDashboardPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="professional/schedule"
                      element={
                        <ProtectedRoute allowedRoles={['COOK', 'ADMIN']}>
                          <ScheduleCalendarPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="professional/bookings"
                      element={
                        <ProtectedRoute allowedRoles={['COOK', 'ADMIN']}>
                          <ProfessionalDashboardPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="professional/attendance"
                      element={
                        <ProtectedRoute allowedRoles={['COOK', 'ADMIN']}>
                          <ProfessionalDashboardPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="professional/earnings"
                      element={
                        <ProtectedRoute allowedRoles={['COOK', 'ADMIN']}>
                          <ProfessionalEarningsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="professional/availability"
                      element={
                        <ProtectedRoute allowedRoles={['COOK', 'ADMIN']}>
                          <ProfessionalAvailabilityPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="professional/profile"
                      element={
                        <ProtectedRoute allowedRoles={['COOK', 'ADMIN']}>
                          <ProfessionalProfilePage />
                        </ProtectedRoute>
                      }
                    />

                    {/* Society Manager Sub-Routes */}
                    <Route
                      path="society/dashboard"
                      element={
                        <ProtectedRoute allowedRoles={['SOCIETY_MANAGER', 'ADMIN']}>
                          <SocietyDashboardPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="society/households"
                      element={
                        <ProtectedRoute allowedRoles={['SOCIETY_MANAGER', 'ADMIN']}>
                          <SocietyHouseholdsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="society/professionals"
                      element={
                        <ProtectedRoute allowedRoles={['SOCIETY_MANAGER', 'ADMIN']}>
                          <SocietyProfessionalsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="society/community"
                      element={
                        <ProtectedRoute allowedRoles={['SOCIETY_MANAGER', 'ADMIN']}>
                          <GroupHub />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="society/analytics"
                      element={
                        <ProtectedRoute allowedRoles={['SOCIETY_MANAGER', 'ADMIN']}>
                          <AnalyticsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="society/complaints"
                      element={
                        <ProtectedRoute allowedRoles={['SOCIETY_MANAGER', 'ADMIN']}>
                          <SocietyComplaintsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="society/settings"
                      element={
                        <ProtectedRoute allowedRoles={['SOCIETY_MANAGER', 'ADMIN']}>
                          <SocietySettingsPage />
                        </ProtectedRoute>
                      }
                    />
                  </Route>

                  {/* Administrator Nested Layout & Routes */}
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute allowedRoles={['ADMIN']}>
                        <DashboardLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<AdminDashboardPage />} />
                    <Route path="dashboard" element={<AdminDashboardPage />} />
                    <Route path="users" element={<AdminDashboardPage />} />
                    <Route path="societies" element={<AdminSocietiesPage />} />
                    <Route path="professionals" element={<AdminVerificationPage />} />
                    <Route path="bookings" element={<AdminDashboardPage />} />
                    <Route path="payments" element={<AdminDashboardPage />} />
                    <Route path="verification" element={<AdminVerificationPage />} />
                    <Route path="security" element={<AdminSecurityPage />} />
                    <Route path="audit-logs" element={<AdminSecurityPage />} />
                    <Route path="settings" element={<AdminSecurityPage />} />
                  </Route>

                  {/* Backward-Compatibility Top-Level Aliases */}
                  <Route path="/groups" element={<Navigate to="/app/community" replace />} />
                  <Route path="/groups/:id" element={<ProtectedRoute><GroupDetailsPage /></ProtectedRoute>} />
                  <Route path="/cooks" element={<Navigate to="/app/discover" replace />} />
                  <Route path="/schedule" element={<Navigate to="/app/schedule" replace />} />
                  <Route path="/billing" element={<Navigate to="/app/subscriptions" replace />} />
                  <Route path="/analytics" element={<Navigate to="/app/analytics" replace />} />

                  {/* 404 Catch-All */}
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </React.Suspense>
            </main>
            <CookieConsentBanner />
            <InstallAppBanner />
            <UpdateNotificationBanner />
          </div>
        </BrowserRouter>
      </PWAProvider>
    </AuthProvider>
  );
}

export default App;
