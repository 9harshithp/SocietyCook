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

  useEffect(() => {
    if (user) {
      api.getNotifications().then(setNotifications).catch(() => {});
    }
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 lg:gap-4">
        {/* Brand Logo & Society Selector */}
        <div className="flex items-center gap-3 sm:gap-5 shrink-0">
          <Link to={user ? '/app' : '/'} className="flex items-center gap-2.5 group shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-green-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform shrink-0">
              <ChefHat className="w-5 h-5" />
            </div>
            <div className="shrink-0">
              <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5 leading-none">
                SocietyCook
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  v2.0
                </span>
              </span>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block mt-0.5">
                Hire together. Save together.
              </p>
            </div>
          </Link>

          {/* Society Selector */}
          {user && (
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 shrink-0">
              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <select
                value={activeSocietyId}
                onChange={(e) => setActiveSocietyId(Number(e.target.value))}
                className="bg-transparent border-none text-xs font-bold focus:outline-none cursor-pointer pr-1"
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

        {/* Center: 1-Click Demo Personas Bar (Always Single Line with Fixed Heights) */}
        <div className="hidden lg:flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 shrink-0">
          <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 dark:text-slate-500 px-2 whitespace-nowrap select-none">
            1-Click Demo:
          </span>
          <div className="flex items-center gap-1 shrink-0">
            {DEMO_PERSONAS.map((p) => {
              const isActive = user?.email === p.email;
              return (
                <button
                  key={p.email}
                  type="button"
                  onClick={() => switchPersona(p.email)}
                  className={`h-7 px-2.5 text-xs font-semibold rounded-xl whitespace-nowrap inline-flex items-center justify-center transition-all border shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs font-bold'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-emerald-600 border-slate-200/80 dark:border-slate-700/80 hover:border-emerald-500/50'
                  }`}
                  title={p.desc}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Tools (Theme toggle, Notifications, User) */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Dark Mode Toggle */}
          <button
            type="button"
            onClick={toggleDarkMode}
            className="w-8 h-8 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 bg-slate-100 dark:bg-slate-800 transition-colors flex items-center justify-center shrink-0 cursor-pointer"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {user ? (
            <>
              {/* Notification Center */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center relative cursor-pointer"
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
                        type="button"
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
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800 shrink-0">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                  {user.name?.[0] || 'U'}
                </div>
                <div className="hidden xl:block text-left text-xs max-w-[120px] shrink-0">
                  <span className="font-bold text-slate-900 dark:text-white block leading-tight truncate">
                    {user.name}
                  </span>
                  <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                    {user.role}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 shrink-0">
              <Link
                to="/login"
                className="px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-emerald-600"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
              >
                Join
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Responsive Demo Persona Bar for Mobile/Tablet (< lg) */}
      <div className="lg:hidden flex items-center gap-1.5 px-4 py-1.5 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200/80 dark:border-slate-800/80 overflow-x-auto no-scrollbar">
        <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 dark:text-slate-500 px-1 whitespace-nowrap shrink-0">
          Demo:
        </span>
        {DEMO_PERSONAS.map((p) => {
          const isActive = user?.email === p.email;
          return (
            <button
              key={p.email}
              type="button"
              onClick={() => switchPersona(p.email)}
              className={`h-6 px-2 text-[11px] font-semibold rounded-lg whitespace-nowrap inline-flex items-center justify-center transition-all border shrink-0 ${
                isActive
                  ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>
    </header>
  );
}
