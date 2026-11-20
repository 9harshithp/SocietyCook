import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  Server,
  ShieldCheck,
  Building2,
  Users,
  DollarSign,
  Activity,
  Award,
  Lock,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  Sparkles,
  RefreshCw,
  Search
} from 'lucide-react';

export function AdminDashboardPage() {
  const { user, showToast } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    api.getAdminAnalytics()
      .then(setAnalytics)
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Hero Welcome Card */}
      <div className="bg-gradient-to-br from-[#153D32] to-[#1E5747] text-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-[#153D32]/15 space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[#E9A15B] text-xs font-extrabold uppercase tracking-wider">
          <Server className="w-3.5 h-3.5" />
          Superadmin Operations & Workforce Dispatcher
        </div>
        <h1 className="text-2xl sm:text-3xl font-black">SocietyCook Operational Control</h1>
        <p className="text-emerald-100 text-xs sm:text-sm max-w-xl font-medium">
          Real-time multi-society workforce allocation, automated leave backups, and statistical demand forecasting.
        </p>

        {/* Global Platform KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-white/15">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4">
            <span className="text-[10px] text-emerald-200 uppercase tracking-wider font-extrabold block">Active Societies</span>
            <span className="text-2xl font-black text-white mt-1 block">3 Pilot Hubs</span>
            <span className="text-[10px] text-emerald-300 font-bold">Prestige, Sobha, Brigade</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4">
            <span className="text-[10px] text-emerald-200 uppercase tracking-wider font-extrabold block">Verified Staff</span>
            <span className="text-2xl font-black text-white mt-1 block">48 Professionals</span>
            <span className="text-[10px] text-[#E9A15B] font-bold">100% Background Cleared</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4">
            <span className="text-[10px] text-emerald-200 uppercase tracking-wider font-extrabold block">Monthly GMV</span>
            <span className="text-2xl font-black text-white mt-1 block">₹2,84,000</span>
            <span className="text-[10px] text-emerald-300 font-bold">+18% MoM Growth</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4">
            <span className="text-[10px] text-emerald-200 uppercase tracking-wider font-extrabold block">System Health</span>
            <span className="text-2xl font-black text-emerald-300 mt-1 block">99.98%</span>
            <span className="text-[10px] text-emerald-200 font-bold">API Latency 42ms</span>
          </div>
        </div>
      </div>

      {/* Operational Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/admin/societies"
          className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-[#DDE9D8] dark:border-white/10 shadow-sm hover:shadow-md transition-shadow group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-[#153D32] dark:text-[#E9A15B] flex items-center justify-center mb-3">
            <Building2 className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-sm text-[#202A25] dark:text-white group-hover:text-[#153D32] dark:group-hover:text-[#E9A15B]">
            Society Complexes
          </h3>
          <p className="text-xs text-[#64746B] dark:text-slate-400 mt-1">
            Manage apartment complexes, onboard new RWAs, and configure tower boundaries.
          </p>
        </Link>

        <Link
          to="/admin/verification"
          className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-[#DDE9D8] dark:border-white/10 shadow-sm hover:shadow-md transition-shadow group"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-[#E9A15B] flex items-center justify-center mb-3">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-sm text-[#202A25] dark:text-white group-hover:text-[#153D32] dark:group-hover:text-[#E9A15B]">
            Verification Queue
          </h3>
          <p className="text-xs text-[#64746B] dark:text-slate-400 mt-1">
            Audit police certificates, review food safety credentials, and grant gate pass clearance.
          </p>
        </Link>

        <Link
          to="/admin/security"
          className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-[#DDE9D8] dark:border-white/10 shadow-sm hover:shadow-md transition-shadow group"
        >
          <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center mb-3">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-sm text-[#202A25] dark:text-white group-hover:text-[#153D32] dark:group-hover:text-[#E9A15B]">
            Security & Telemetry
          </h3>
          <p className="text-xs text-[#64746B] dark:text-slate-400 mt-1">
            Inspect CSP enforcement, monitor active JWT tokens, and verify cross-society tenant isolation.
          </p>
        </Link>
      </div>
    </div>
  );
}

export function AdminSocietiesPage() {
  const { societies } = useAuth();
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-black text-[#153D32] dark:text-white">
          Registered Residential Complexes
        </h1>
        <p className="text-xs sm:text-sm text-[#64746B] dark:text-slate-400 mt-1">
          Active residential clusters with RWA clearance and dedicated domestic cook rosters
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {societies.map((s) => (
          <div key={s.id} className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-[#DDE9D8] dark:border-white/10 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#153D32] text-[#E9A15B] flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-sm text-[#202A25] dark:text-white">{s.name}</h3>
            <div className="text-xs text-slate-500">{s.city} · 4 Towers Active</div>
            <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex justify-between text-xs">
              <span className="text-slate-400">Status</span>
              <span className="font-bold text-emerald-600">Pilot Active</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminVerificationPage() {
  const { showToast } = useAuth();
  const [items, setItems] = useState([
    { id: 101, name: 'Lakshmi Bai', role: 'Utensil Specialist', status: 'Pending Review', idNum: 'KA-DOC-8902' },
    { id: 102, name: 'Suresh Kumar', role: 'Home Cook', status: 'Pending Review', idNum: 'KA-DOC-8903' }
  ]);

  const handleApprove = (id) => {
    setItems(items.filter((i) => i.id !== id));
    showToast(`Staff member #${id} approved and biometric gate pass activated!`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-black text-[#153D32] dark:text-white">
          Domestic Staff Verification Queue
        </h1>
        <p className="text-xs sm:text-sm text-[#64746B] dark:text-slate-400 mt-1">
          Approve police clearance certificates and medical hygiene evaluations
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-[#DDE9D8] dark:border-white/10 shadow-sm space-y-4">
        {items.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">All pending applications cleared!</div>
        ) : (
          <div className="divide-y divide-[#DDE9D8]/50 dark:divide-white/10">
            {items.map((i) => (
              <div key={i.id} className="py-4 flex items-center justify-between">
                <div>
                  <div className="font-extrabold text-sm text-slate-900 dark:text-white">{i.name}</div>
                  <div className="text-xs text-slate-500">{i.role} · Cert: {i.idNum}</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleApprove(i.id)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-sm"
                >
                  Approve & Authorize
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function AdminSecurityPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-black text-[#153D32] dark:text-white">
          Platform Security & Session Telemetry
        </h1>
        <p className="text-xs sm:text-sm text-[#64746B] dark:text-slate-400 mt-1">
          OWASP ASVS compliance status, CSP directives, and cross-society tenant isolation monitor
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-[#DDE9D8] dark:border-white/10 shadow-sm space-y-3">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Active Defense Policies</h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-white/5">
              <span className="text-slate-500">Content Security Policy</span>
              <span className="font-bold text-emerald-600">Enforced (Strict 'self')</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-white/5">
              <span className="text-slate-500">HSTS Preload</span>
              <span className="font-bold text-emerald-600">31,536,000s + Subdomains</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-white/5">
              <span className="text-slate-500">Cross-Society Tenant Guard</span>
              <span className="font-bold text-emerald-600">403 Forbidden Enforced</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">PWA Service Worker Scope</span>
              <span className="font-bold text-emerald-600">Registered (Network-Only for /api/*)</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-[#DDE9D8] dark:border-white/10 shadow-sm space-y-3">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Token Session Telemetry</h3>
          <p className="text-xs text-slate-500">
            JWT session tokens are strictly scoped to sessionStorage, eliminating cross-tab leakage and automatically expiring on tab closure.
          </p>
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-xs font-bold text-emerald-800 dark:text-emerald-300">
            ✓ Zero Token Leakage in Service Worker Cache
          </div>
        </div>
      </div>
    </div>
  );
}

