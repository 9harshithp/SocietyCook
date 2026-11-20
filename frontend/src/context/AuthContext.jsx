import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const DEMO_PERSONAS = [
  { label: 'Resident (Rahul)', email: 'resident@example.com', role: 'RESIDENT', desc: 'Flat A-101' },
  { label: 'Cook (Ramesh)', email: 'ramesh@example.com', role: 'COOK', desc: 'Tower A Route' },
  { label: 'Cook (Lakshmi)', email: 'cook@example.com', role: 'COOK', desc: 'South Indian' },
  { label: 'Society Manager', email: 'manager@example.com', role: 'SOCIETY_MANAGER', desc: 'Greenwood Desk' },
  { label: 'Platform Admin', email: 'admin@example.com', role: 'ADMIN', desc: 'Ops & Backup' }
];

const DEFAULT_SOCIETIES = [
  { id: 1, name: 'Prestige Falcon City', city: 'Bengaluru' },
  { id: 2, name: 'Sobha Dream Acres', city: 'Bengaluru' },
  { id: 3, name: 'Brigade Gateway', city: 'Bengaluru' }
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSocietyId, setActiveSocietyId] = useState(1);
  const [societies, setSocieties] = useState(DEFAULT_SOCIETIES);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    const saved = localStorage.getItem('sc_theme');
    if (saved === 'dark') return true;
    if (saved === 'light') return false;
    return Boolean(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', message: '' }

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      if (document.body) document.body.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('sc_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      if (document.body) document.body.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('sc_theme', 'light');
    }
  }, [isDarkMode]);

  const fetchMe = async () => {
    try {
      const me = await api.getMe();
      setUser(me);
      if (me.society_id) setActiveSocietyId(me.society_id);
    } catch {
      sessionStorage.removeItem('sc_access_token');
      sessionStorage.removeItem('sc_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const loadSocieties = async () => {
    try {
      const data = await api.getSocieties();
      if (Array.isArray(data) && data.length > 0) {
        setSocieties(data);
      }
    } catch {
      // Graceful fallback to default societies when backend is cold or offline
    }
  };

  useEffect(() => {
    const token = sessionStorage.getItem('sc_access_token') || sessionStorage.getItem('sc_token');
    if (token) {
      fetchMe();
      loadSocieties();
    } else {
      setLoading(false);
      // Defer remote societies fetch to non-blocking idle cycle for anonymous visitors
      // Default verified societies are immediately available from memory
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        window.requestIdleCallback(() => loadSocieties(), { timeout: 3500 });
      } else {
        setTimeout(loadSocieties, 2500);
      }
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.login({ email, password });
    const token = res.accessToken || res.token;
    sessionStorage.setItem('sc_access_token', token);
    sessionStorage.setItem('sc_token', token);
    await fetchMe();
    showToast(`Welcome back, ${res.user?.name || 'User'}!`);
    return res;
  };

  const switchPersona = async (email) => {
    try {
      await login(email, 'Demo12345!');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const logout = async () => {
    sessionStorage.removeItem('sc_access_token');
    sessionStorage.removeItem('sc_token');
    setUser(null);
    showToast('Signed out successfully.');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        societies,
        activeSocietyId,
        setActiveSocietyId,
        isDarkMode,
        toggleDarkMode,
        toast,
        showToast,
        login,
        switchPersona,
        logout,
        refreshUser: fetchMe
      }}
    >
      {children}
      {/* Global Toast Banner */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border animate-in slide-in-from-bottom-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs font-semibold">
          <div
            className={`w-2 h-2 rounded-full ${
              toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'
            }`}
          />
          <span className={toast.type === 'error' ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-slate-100'}>
            {toast.message}
          </span>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

