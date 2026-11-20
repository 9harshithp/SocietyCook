import React, { useEffect } from 'react';
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PremiumNavLink } from '../components/PremiumNavLink';
import {
  LayoutDashboard,
  Users,
  UtensilsCrossed,
  Calendar,
  CreditCard,
  Bell,
  Settings,
  User,
  ShieldCheck,
  Building2,
  DollarSign,
  Clock,
  FileCheck2,
  AlertTriangle,
  Layers,
  HelpCircle,
  Activity,
  Award,
  Sparkles,
  BarChart3,
  Server
} from 'lucide-react';

export function getRoleDashboardPath(role) {
  switch (role) {
    case 'COOK':
      return '/app/professional/dashboard';
    case 'SOCIETY_MANAGER':
      return '/app/society/dashboard';
    case 'ADMIN':
      return '/admin/dashboard';
    case 'RESIDENT':
    default:
      return '/app/dashboard';
  }
}

export function DashboardLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // If visiting apex /app, redirect to role-specific dashboard
  useEffect(() => {
    if (location.pathname === '/app' || location.pathname === '/app/') {
      navigate(getRoleDashboardPath(user?.role), { replace: true });
    }
  }, [location.pathname, user?.role, navigate]);

  // Resident Nav Items
  const residentNav = [
    { to: '/app/dashboard', label: 'Overview', icon: LayoutDashboard, exact: true },
    { to: '/app/discover', label: 'Find Cooks', icon: UtensilsCrossed },
    { to: '/app/services', label: 'Services', icon: Layers },
    { to: '/app/bookings', label: 'Bookings', icon: Calendar },
    { to: '/app/community', label: 'Tower Groups', icon: Users, badge: 'Save 32%' },
    { to: '/app/subscriptions', label: 'Billing', icon: CreditCard },
    { to: '/app/notifications', label: 'Alerts', icon: Bell },
    { to: '/app/support', label: 'Support', icon: HelpCircle },
    { to: '/app/profile', label: 'My Flat', icon: User },
    { to: '/app/settings', label: 'Settings', icon: Settings }
  ];

  // Professional Nav Items
  const professionalNav = [
    { to: '/app/professional/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { to: '/app/professional/schedule', label: 'Schedule', icon: Calendar },
    { to: '/app/professional/bookings', label: 'Households', icon: Users },
    { to: '/app/professional/attendance', label: 'Attendance', icon: Clock },
    { to: '/app/professional/earnings', label: 'Earnings', icon: DollarSign },
    { to: '/app/professional/availability', label: 'Leave & Availability', icon: Calendar },
    { to: '/app/professional/profile', label: 'Credentials', icon: Award },
    { to: '/app/settings', label: 'Settings', icon: Settings }
  ];

  // Society Manager Nav Items
  const managerNav = [
    { to: '/app/society/dashboard', label: 'Campus Overview', icon: LayoutDashboard, exact: true },
    { to: '/app/society/households', label: 'Households', icon: Building2 },
    { to: '/app/society/professionals', label: 'Staff Clearances', icon: ShieldCheck },
    { to: '/app/society/community', label: 'Tower Clusters', icon: Users },
    { to: '/app/society/analytics', label: 'Society Analytics', icon: BarChart3 },
    { to: '/app/society/complaints', label: 'Incident Log', icon: AlertTriangle },
    { to: '/app/society/settings', label: 'Campus Settings', icon: Settings }
  ];

  // Admin Nav Items
  const adminNav = [
    { to: '/admin/dashboard', label: 'Command Center', icon: LayoutDashboard, exact: true },
    { to: '/admin/users', label: 'User Directory', icon: Users },
    { to: '/admin/societies', label: 'Societies', icon: Building2 },
    { to: '/admin/professionals', label: 'Cook Approvals', icon: Award },
    { to: '/admin/bookings', label: 'Dispatches', icon: Calendar },
    { to: '/admin/payments', label: 'Reconciliation', icon: DollarSign },
    { to: '/admin/verification', label: 'Audit Queue', icon: FileCheck2 },
    { to: '/admin/security', label: 'Security & Telemetry', icon: Server },
    { to: '/admin/settings', label: 'Platform Engine', icon: Settings }
  ];

  let currentNav = residentNav;
  let roleTitle = 'Resident Portal';
  let roleBadge = 'Resident';

  if (user?.role === 'COOK') {
    currentNav = professionalNav;
    roleTitle = 'Service Professional Hub';
    roleBadge = 'Verified Professional Cook';
  } else if (user?.role === 'SOCIETY_MANAGER') {
    currentNav = managerNav;
    roleTitle = 'Society Management Hub';
    roleBadge = 'RWA Operations Desk';
  } else if (user?.role === 'ADMIN') {
    currentNav = adminNav;
    roleTitle = 'Platform Operations Command';
    roleBadge = 'Superadmin';
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col bg-[#FBF7EF] dark:bg-[#0D1613]">
      {/* Role Navigation Bar with Left-to-Right Animated Underline */}
      <div className="bg-white/90 dark:bg-[#121E19]/90 backdrop-blur-md border-b border-[#DDE9D8] dark:border-white/10 sticky top-[61px] z-30 transition-colors shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between gap-4 py-1.5">
            {/* Scrollable Navigation Strip */}
            <nav
              aria-label={`${roleTitle} Navigation`}
              className="flex items-center gap-4 sm:gap-6 overflow-x-auto no-scrollbar py-1 flex-1 min-w-0"
            >
              {currentNav.map((item) => (
                <PremiumNavLink
                  key={item.to}
                  to={item.to}
                  icon={item.icon}
                  exact={item.exact}
                  badge={item.badge}
                >
                  {item.label}
                </PremiumNavLink>
              ))}
            </nav>

            {/* Role Verification Badge */}
            <div className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#153D32]/10 dark:bg-white/10 text-[#153D32] dark:text-[#E9A15B] text-[11px] font-bold shrink-0">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{roleBadge}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Outlet Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Outlet />
      </div>
    </div>
  );
}

