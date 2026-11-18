import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  Wallet,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { useAuth, DEMO_PERSONAS } from '../context/AuthContext';
import { api } from '../services/api';

export function Navbar() {
  const { user, societies, activeSocietyId, setActiveSocietyId, isDarkMode, toggleDarkMode, switchPersona, logout } =
    useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (user) {
      api.getNotifications().then(setNotifications).catch(() => {});
    }
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-6">
          <Link to={user ? '/app' : '/'} className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-green-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                SocietyCook
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  v2.0
                </span>
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
                Hire together. Save together.
              </p>
            </div>
          </Link>

          {/* Society Selector */}
          {user && (
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <select
                value={activeSocietyId}
                onChange={(e) => setActiveSocietyId(Number(e.target.value))}
                className="bg-transparent border-none text-xs font-bold focus:outline-none cursor-pointer"
              >
                {societies.map((s) => (
                  <option key={s.id} value={s.id} className="dark:bg-slate-900">
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Center / Demo Personas Bar */}
        <div className="hidden lg:flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
          <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 px-2.5">
            1-Click Demo:
          </span>
          {DEMO_PERSONAS.map((p) => {
            const isActive = user?.email === p.email;
            return (
              <button
                key={p.email}
                onClick={() => switchPersona(p.email)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-xl transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-emerald-600 border border-slate-200/60 dark:border-slate-800'
                }`}
                title={p.desc}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Right Tools (Theme toggle, Notifications, User) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 bg-slate-100 dark:bg-slate-800 transition-colors"
            title="Toggle theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {user ? (
            <>
              {/* Notification Center */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors relative"
                  title="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-600 text-white text-[9px] font-bold flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 z-50 animate-in fade-in slide-in-from-top-2 text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                      <span className="font-bold uppercase tracking-wider text-slate-500">Notifications</span>
                      <button
                        onClick={() => {
                          api.markNotificationsRead();
                          setNotifications(notifications.map((n) => ({ ...n, is_read: 1 })));
                        }}
                        className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline text-[11px]"
                      >
                        Mark all read
                      </button>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-64 overflow-y-auto mt-2">
                      {notifications.length === 0 ? (
                        <p className="text-slate-400 py-4 text-center">No notifications</p>
                      ) : (
                        notifications.map((n) => (
                          <div key={n.id} className="py-2.5">
                            <span className="font-bold text-slate-900 dark:text-slate-100 block">{n.title}</span>
                            <p className="text-slate-600 dark:text-slate-300 mt-0.5">{n.message}</p>
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
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                  {user.name[0]}
                </div>
                <div className="hidden sm:block text-left text-xs">
                  <span className="font-bold text-slate-900 dark:text-white block leading-tight">{user.name}</span>
                  <span className="text-[10px] text-slate-400 block">{user.role}</span>
                </div>
                <button
                  onClick={logout}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-1"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-emerald-600"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
              >
                Join Society
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
