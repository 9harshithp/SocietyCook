import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ChefHat,
  Bell,
  Sun,
  Moon,
  LogOut,
  MapPin,
  Menu,
  X,
  ShieldCheck,
  Users,
  Calendar,
  Sparkles,
  ChevronDown,
  UtensilsCrossed,
  Droplets,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useAuth, DEMO_PERSONAS } from '../context/AuthContext';
import { api } from '../services/api';

export function Navbar() {
  const { user, societies, activeSocietyId, setActiveSocietyId, isDarkMode, toggleDarkMode, switchPersona, logout } =
    useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (user) {
      api.getNotifications().then(setNotifications).catch(() => {});
    }
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <header className="sticky top-0 z-50 bg-[#FBF7EF]/90 dark:bg-[#121E19]/90 backdrop-blur-md border-b border-[#DDE9D8]/80 dark:border-white/10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3 lg:gap-5">
        {/* Brand Logo & Tagline */}
        <div className="flex items-center gap-3 sm:gap-6 shrink-0">
          <Link to={user ? '/app' : '/'} className="flex items-center gap-3 group shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#153D32] to-[#1E5747] flex items-center justify-center text-[#E9A15B] shadow-md shadow-[#153D32]/25 group-hover:scale-105 transition-transform shrink-0 border border-[#E9A15B]/30">
              <ChefHat className="w-5 h-5 text-[#E9A15B]" />
            </div>
            <div className="shrink-0 text-left">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-serif font-black text-lg tracking-tight text-[#153D32] dark:text-[#FBF7EF]">
                  SocietyCook
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-[#E9A15B]/15 text-[#C47B35] dark:text-[#E9A15B] border border-[#E9A15B]/30">
                  v3.0
                </span>
              </div>
              <p className="text-[10px] text-[#42524A] dark:text-[#A4B5AC] font-medium hidden sm:block mt-0.5">
                More living. Less chores.
              </p>
            </div>
          </Link>

          {/* Society Selector for Logged-In User */}
          {user && (
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-white/5 border border-[#DDE9D8] dark:border-white/10 text-xs font-semibold text-[#202A25] dark:text-slate-200 shrink-0 shadow-xs">
              <MapPin className="w-3.5 h-3.5 text-[#153D32] dark:text-[#E9A15B] shrink-0" />
              <select
                value={activeSocietyId}
                onChange={(e) => setActiveSocietyId(Number(e.target.value))}
                className="bg-transparent border-none text-xs font-bold focus:outline-none cursor-pointer pr-1 text-[#202A25] dark:text-white"
              >
                {societies.map((s) => (
                  <option key={s.id} value={s.id} className="dark:bg-slate-900 text-slate-800 dark:text-white">
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Public Navigation Links (When on landing page or not logged in) */}
        {!user && (
          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-[#202A25] dark:text-slate-200">
            {/* Services Dropdown */}
            <div className="relative" onMouseLeave={() => setServicesOpen(false)}>
              <button
                type="button"
                onClick={() => setServicesOpen(!servicesOpen)}
                onMouseEnter={() => setServicesOpen(true)}
                aria-expanded={servicesOpen}
                aria-label="Toggle services menu"
                className="flex items-center gap-1 hover:text-[#153D32] dark:hover:text-[#E9A15B] transition-colors py-1 cursor-pointer"
              >
                <span>Services</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${servicesOpen ? 'rotate-180' : ''}`} />
              </button>

              {servicesOpen && (
                <div className="absolute top-full -left-4 w-72 pt-2 z-50">
                  <div className="bg-white dark:bg-[#182821] rounded-2xl shadow-xl border border-[#DDE9D8] dark:border-white/10 p-3 space-y-1 animate-in fade-in slide-in-from-top-1">
                    <a
                      href="#services"
                      onClick={() => setServicesOpen(false)}
                      className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-[#FBF7EF] dark:hover:bg-white/5 transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#153D32]/10 dark:bg-emerald-950 flex items-center justify-center text-[#153D32] dark:text-emerald-400 shrink-0 group-hover:bg-[#153D32] group-hover:text-white transition-colors">
                        <UtensilsCrossed className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-xs text-[#202A25] dark:text-white">Home Cooking</div>
                        <p className="text-[11px] text-[#42524A] dark:text-slate-400">Fresh daily meals tailored to your taste</p>
                      </div>
                    </a>

                    <a
                      href="#services"
                      onClick={() => setServicesOpen(false)}
                      className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-[#FBF7EF] dark:hover:bg-white/5 transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#E9A15B]/15 dark:bg-amber-950 flex items-center justify-center text-[#C47B35] dark:text-[#E9A15B] shrink-0 group-hover:bg-[#E9A15B] group-hover:text-white transition-colors">
                        <Droplets className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-xs text-[#202A25] dark:text-white">Utensil Care & Dishwashing</div>
                        <p className="text-[11px] text-[#42524A] dark:text-slate-400">Spotless sink hygiene & gleaming vessels</p>
                      </div>
                    </a>

                    <a
                      href="#services"
                      onClick={() => setServicesOpen(false)}
                      className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-[#FBF7EF] dark:hover:bg-white/5 transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950 flex items-center justify-center text-teal-700 dark:text-teal-300 shrink-0 group-hover:bg-teal-700 group-hover:text-white transition-colors">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-xs text-[#202A25] dark:text-white flex items-center gap-1.5">
                          Complete Kitchen Care
                          <span className="text-[9px] px-1.5 py-0.2 bg-[#E9A15B] text-white font-bold rounded-full">POPULAR</span>
                        </div>
                        <p className="text-[11px] text-[#42524A] dark:text-slate-400">Cooking + Dishwashing synchronized</p>
                      </div>
                    </a>
                  </div>
                </div>
              )}
            </div>

            <a href="#how-it-works" className="hover:text-[#153D32] dark:hover:text-[#E9A15B] transition-colors">
              How It Works
            </a>
            <a href="#community-pricing" className="hover:text-[#153D32] dark:hover:text-[#E9A15B] transition-colors">
              Community Pricing
            </a>
            <a href="#for-societies" className="hover:text-[#153D32] dark:hover:text-[#E9A15B] transition-colors">
              For Societies
            </a>
            <a href="#for-professionals" className="hover:text-[#153D32] dark:hover:text-[#E9A15B] transition-colors">
              For Professionals
            </a>
          </nav>
        )}

        {/* In-App Navigation Links (When logged in) */}
        {user && (
          <nav className="hidden lg:flex items-center gap-5 text-xs font-bold text-[#202A25] dark:text-slate-200">
            <Link to="/app" className="hover:text-[#153D32] dark:hover:text-[#E9A15B] transition-colors">
              Dashboard
            </Link>
            <Link to="/app/groups" className="hover:text-[#153D32] dark:hover:text-[#E9A15B] transition-colors">
              Groups
            </Link>
            <Link to="/app/cooks" className="hover:text-[#153D32] dark:hover:text-[#E9A15B] transition-colors">
              Cooks
            </Link>
            <Link to="/app/schedule" className="hover:text-[#153D32] dark:hover:text-[#E9A15B] transition-colors">
              Schedule
            </Link>
            <Link to="/app/billing" className="hover:text-[#153D32] dark:hover:text-[#E9A15B] transition-colors">
              Billing
            </Link>
            <Link to="/app/analytics" className="hover:text-[#153D32] dark:hover:text-[#E9A15B] transition-colors">
              Analytics
            </Link>
          </nav>
        )}

        {/* Right Tools (Theme toggle, Notifications, User Auth) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Dark Mode Toggle */}
          <button
            type="button"
            onClick={toggleDarkMode}
            className="w-9 h-9 rounded-xl text-[#202A25] hover:text-[#153D32] dark:text-slate-300 dark:hover:text-[#E9A15B] bg-white dark:bg-white/5 border border-[#DDE9D8] dark:border-white/10 transition-colors flex items-center justify-center shrink-0 cursor-pointer shadow-xs"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-[#E9A15B]" /> : <Moon className="w-4 h-4 text-[#153D32]" />}
          </button>

          {user ? (
            <>
              {/* Notification Center */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setShowNotifications(!showNotifications)}
                  aria-label="View notifications"
                  className="w-9 h-9 rounded-xl bg-white dark:bg-white/5 border border-[#DDE9D8] dark:border-white/10 text-[#202A25] dark:text-slate-200 hover:bg-[#DDE9D8]/30 dark:hover:bg-white/10 transition-colors flex items-center justify-center relative cursor-pointer shadow-xs"
                  title="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#E9A15B] text-white text-[9px] font-black flex items-center justify-center shadow-xs">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#182821] rounded-2xl shadow-2xl border border-[#DDE9D8] dark:border-white/10 p-4 z-50 animate-in fade-in slide-in-from-top-2 text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-[#DDE9D8]/50 dark:border-white/10">
                      <span className="font-bold uppercase tracking-wider text-[#42524A] dark:text-slate-400">Notifications</span>
                      <button
                        type="button"
                        onClick={() => {
                          api.markNotificationsRead();
                          setNotifications(notifications.map((n) => ({ ...n, is_read: 1 })));
                        }}
                        className="text-[#153D32] dark:text-[#E9A15B] font-semibold hover:underline text-[11px]"
                      >
                        Mark all read
                      </button>
                    </div>
                    <div className="divide-y divide-[#DDE9D8]/40 dark:divide-white/5 max-h-64 overflow-y-auto mt-2">
                      {notifications.length === 0 ? (
                        <p className="text-slate-400 py-4 text-center">No notifications</p>
                      ) : (
                        notifications.map((n) => (
                          <div key={n.id} className="py-2.5">
                            <span className="font-bold text-[#202A25] dark:text-slate-100 block">{n.title}</span>
                            <p className="text-[#42524A] dark:text-slate-300 mt-0.5">{n.message}</p>
                            <span className="text-[10px] text-slate-400 mt-1 block">
                              {String(n.created_at || '').slice(0, 10)}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Avatar & Logout */}
              <div className="flex items-center gap-2 pl-2 border-l border-[#DDE9D8] dark:border-white/10 shrink-0">
                <div className="w-9 h-9 rounded-xl bg-[#153D32] text-[#E9A15B] font-bold text-xs flex items-center justify-center shrink-0 shadow-xs border border-[#E9A15B]/30">
                  {user.name?.[0] || 'U'}
                </div>
                <div className="hidden xl:block text-left text-xs max-w-[120px] shrink-0">
                  <span className="font-bold text-[#202A25] dark:text-white block leading-tight truncate">
                    {user.name}
                  </span>
                  <span className="text-[10px] text-[#42524A] dark:text-slate-400 block uppercase font-bold">
                    {user.role}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  className="p-1.5 rounded-lg text-[#42524A] hover:text-red-500 hover:bg-red-50 dark:hover:bg-white/5 transition-colors shrink-0 cursor-pointer"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <Link
                to="/login"
                className="px-2.5 py-1.5 text-xs font-bold text-[#202A25] dark:text-slate-200 hover:text-[#153D32] dark:hover:text-[#E9A15B] transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="hidden sm:inline-flex px-3.5 py-2 text-xs font-bold rounded-xl bg-[#153D32] hover:bg-[#1C4E40] text-white shadow-md shadow-[#153D32]/20 transition-all hover:-translate-y-0.5 border border-[#153D32]"
              >
                Get Started
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-[#202A25] dark:text-white hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Unified 1-Click Demo Persona Bar (Fits screen width 100% on all viewports) */}
      <div className="w-full bg-[#F4EFE6]/90 dark:bg-[#101A16] border-t border-[#DDE9D8]/70 dark:border-white/5 py-1.5 transition-colors overflow-hidden">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 flex items-center justify-between sm:justify-start gap-1 sm:gap-2">
          <span className="hidden sm:inline-flex text-[10px] uppercase font-black tracking-wider text-[#42524A] dark:text-slate-400 px-1 whitespace-nowrap shrink-0">
            1-Click Demo:
          </span>
          <div className="grid grid-cols-5 sm:flex sm:flex-wrap items-center gap-1 sm:gap-1.5 w-full sm:w-auto">
            {DEMO_PERSONAS.map((p) => {
              const isActive = user?.email === p.email;
              const shortName =
                p.role === 'SOCIETY_MANAGER'
                  ? 'Manager'
                  : p.role === 'ADMIN'
                  ? 'Admin'
                  : p.label.replace('Cook (', '').replace('Resident (', '').replace(')', '');
              return (
                <button
                  key={p.email}
                  type="button"
                  onClick={async () => {
                    await switchPersona(p.email);
                    navigate('/app');
                  }}
                  aria-label={`Switch demo persona to ${p.label}`}
                  className={`h-7 px-1 sm:px-2.5 text-[11px] sm:text-xs font-semibold rounded-lg sm:rounded-xl truncate flex items-center justify-center transition-all border shrink-0 cursor-pointer text-center ${
                    isActive
                      ? 'bg-[#153D32] dark:bg-[#E9A15B] text-white dark:text-[#153D32] border-[#153D32] dark:border-[#E9A15B] shadow-xs font-bold'
                      : 'bg-white dark:bg-slate-900 text-[#202A25] dark:text-slate-300 hover:text-[#153D32] dark:hover:text-[#E9A15B] border-[#DDE9D8] dark:border-white/10 hover:border-[#153D32]/40'
                  }`}
                  title={`${p.label} (${p.desc})`}
                >
                  <span className="sm:hidden">{shortName}</span>
                  <span className="hidden sm:inline">{p.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#DDE9D8] dark:border-white/10 bg-[#FBF7EF] dark:bg-[#121E19] px-4 py-4 space-y-3">
          <div className="space-y-1 font-semibold text-sm text-[#202A25] dark:text-slate-200">
            {!user ? (
              <>
                <a
                  href="#services"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl hover:bg-[#DDE9D8]/30 dark:hover:bg-white/5"
                >
                  Household Services
                </a>
                <a
                  href="#how-it-works"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl hover:bg-[#DDE9D8]/30 dark:hover:bg-white/5"
                >
                  How It Works
                </a>
                <a
                  href="#community-pricing"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl hover:bg-[#DDE9D8]/30 dark:hover:bg-white/5"
                >
                  Community Pricing
                </a>
                <a
                  href="#for-societies"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl hover:bg-[#DDE9D8]/30 dark:hover:bg-white/5"
                >
                  For Societies
                </a>
                <a
                  href="#for-professionals"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl hover:bg-[#DDE9D8]/30 dark:hover:bg-white/5"
                >
                  For Professionals
                </a>
              </>
            ) : (
              <>
                <Link
                  to="/app"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl hover:bg-[#DDE9D8]/30 dark:hover:bg-white/5"
                >
                  Dashboard
                </Link>
                <Link
                  to="/app/groups"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl hover:bg-[#DDE9D8]/30 dark:hover:bg-white/5"
                >
                  Community Groups
                </Link>
                <Link
                  to="/app/cooks"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl hover:bg-[#DDE9D8]/30 dark:hover:bg-white/5"
                >
                  Cooks Directory
                </Link>
                <Link
                  to="/app/schedule"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl hover:bg-[#DDE9D8]/30 dark:hover:bg-white/5"
                >
                  Schedule
                </Link>
                <Link
                  to="/app/billing"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl hover:bg-[#DDE9D8]/30 dark:hover:bg-white/5"
                >
                  Billing & Invoices
                </Link>
                <Link
                  to="/app/analytics"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl hover:bg-[#DDE9D8]/30 dark:hover:bg-white/5"
                >
                  Analytics & Reports
                </Link>
              </>
            )}
          </div>

          <div className="pt-2 border-t border-[#DDE9D8]/60 dark:border-white/10 flex flex-col gap-2">
            {!user ? (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 text-center text-xs font-bold rounded-xl border border-[#153D32] text-[#153D32] dark:text-white"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 text-center text-xs font-bold rounded-xl bg-[#153D32] text-white"
                >
                  Get Started
                </Link>
              </>
            ) : (
              <Link
                to="/app"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 text-center text-xs font-bold rounded-xl bg-[#153D32] text-white"
              >
                Go to Dashboard
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
