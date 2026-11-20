import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  Building2,
  Users,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  BarChart3,
  Award,
  AlertTriangle,
  FileCheck2,
  Check,
  ChefHat,
  Search,
  Filter
} from 'lucide-react';

export function SocietyDashboardPage() {
  const { user, activeSocietyId, showToast } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [cooks, setCooks] = useState([]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [an, ck] = await Promise.all([
          api.getSocietyAnalytics(activeSocietyId).catch(() => null),
          api.getCooks(activeSocietyId).catch(() => [])
        ]);
        setAnalytics(an);
        setCooks(ck);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [activeSocietyId]);

  const totalCooks = analytics?.activeCooksCount || cooks.length || 18;
  const participatingFlats = analytics?.currentSubscribedFlats || 42;
  const totalHouseholds = analytics?.totalRegisteredHouseholds || 120;
  const cooksRoster = analytics?.cooksRoster || cooks;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-xs font-bold text-slate-500">
        <div className="w-5 h-5 border-2 border-[#153D32] border-t-transparent rounded-full animate-spin mr-2" />
        Loading Campus Control Desk...
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Hero Welcome Card */}
      <div className="bg-gradient-to-br from-[#153D32] to-[#1E5747] text-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-[#153D32]/15 space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[#E9A15B] text-xs font-extrabold uppercase tracking-wider">
          <Building2 className="w-3.5 h-3.5" />
          Society RWA & Security Operations Desk
        </div>
        <h1 className="text-2xl sm:text-3xl font-black">
          {analytics?.society?.name || 'Prestige Falcon City (Sample Pilot)'} Campus Control
        </h1>
        <p className="text-emerald-100 text-xs sm:text-sm max-w-xl font-medium">
          Multi-tower domestic workforce management, police clearance oversight, and real-time gate pass authorization.
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-white/15">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4">
            <span className="text-[10px] text-emerald-200 uppercase tracking-wider font-extrabold block">Authorized Staff</span>
            <span className="text-2xl font-black text-white mt-1 block">{totalCooks} Cooks</span>
            <span className="text-[10px] text-emerald-300 font-bold">100% Background Verified</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4">
            <span className="text-[10px] text-emerald-200 uppercase tracking-wider font-extrabold block">Subscribed Flats</span>
            <span className="text-2xl font-black text-white mt-1 block">{participatingFlats} Flats</span>
            <span className="text-[10px] text-[#E9A15B] font-bold">In 8 Tower Clusters</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4">
            <span className="text-[10px] text-emerald-200 uppercase tracking-wider font-extrabold block">Total Roster</span>
            <span className="text-2xl font-black text-white mt-1 block">{totalHouseholds} Units</span>
            <span className="text-[10px] text-slate-300 font-bold">Registered on App</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4">
            <span className="text-[10px] text-emerald-200 uppercase tracking-wider font-extrabold block">Gate Pass Status</span>
            <span className="text-2xl font-black text-emerald-300 mt-1 block">Active</span>
            <span className="text-[10px] text-emerald-200 font-bold">Syncing with Main Gate</span>
          </div>
        </div>
      </div>

      {/* RWA Clearances Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-[#DDE9D8] dark:border-white/10 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#DDE9D8]/60 dark:border-white/10">
          <div>
            <h3 className="font-extrabold text-sm text-[#202A25] dark:text-white">Active Domestic Workforce Roster</h3>
            <p className="text-[11px] text-[#64746B] dark:text-slate-400">Police cleared, medical screening passed, and gate authorized</p>
          </div>
          <Link
            to="/app/society/professionals"
            className="text-xs font-bold text-[#153D32] dark:text-[#E9A15B] hover:underline"
          >
            View Full Clearances →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#FBF7EF] dark:bg-white/5 border-b border-[#DDE9D8] dark:border-white/10 text-slate-500 font-bold uppercase">
              <tr>
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Specialization</th>
                <th className="py-3 px-4">Assigned Tower</th>
                <th className="py-3 px-4">Police Clearance</th>
                <th className="py-3 px-4">Gate Authorization</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDE9D8]/50 dark:divide-white/5">
              {(cooksRoster.slice(0, 5)).map((cook, idx) => (
                <tr key={cook.id || idx} className="hover:bg-slate-50 dark:hover:bg-white/5">
                  <td className="py-3.5 px-4 font-extrabold text-[#202A25] dark:text-white">
                    {cook.name}
                  </td>
                  <td className="py-3.5 px-4 text-[#64746B] dark:text-slate-300">
                    {cook.professional_type === 'MULTI_SKILLED' ? 'Cook + Utensil Care' : cook.professional_type === 'DISHWASHER' ? 'Utensil Specialist' : 'Home Cook'}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-medium">
                    Tower A & B
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[10px] inline-flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Cleared
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[10px]">
                      Pass Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function SocietyHouseholdsPage() {
  const { activeSocietyId } = useAuth();
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-black text-[#153D32] dark:text-white">
          Registered Campus Households
        </h1>
        <p className="text-xs sm:text-sm text-[#64746B] dark:text-slate-400 mt-1">
          Flats participating in cooperative tower cooking & utensil clusters
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-[#DDE9D8] dark:border-white/10 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { flat: 'A-101', resident: 'Rahul Sharma', cluster: 'Cluster 1', status: 'Active (Cooking + Wash)' },
            { flat: 'A-202', resident: 'Priya Iyer', cluster: 'Cluster 1', status: 'Active (Cooking)' },
            { flat: 'A-304', resident: 'Vikram Mehta', cluster: 'Cluster 1', status: 'Active (Cooking)' },
            { flat: 'A-401', resident: 'Sunita Rao', cluster: 'Cluster 1', status: 'Active (Wash Only)' },
            { flat: 'B-102', resident: 'Ananya Roy', cluster: 'Cluster 2', status: 'Active (Cooking + Wash)' },
            { flat: 'B-205', resident: 'Deepak Patel', cluster: 'Cluster 2', status: 'Active (Cooking)' },
            { flat: 'B-301', resident: 'Karthik N', cluster: 'Cluster 2', status: 'Active (Cooking + Wash)' },
            { flat: 'B-403', resident: 'Rohan Gupta', cluster: 'Cluster 2', status: 'Active (Cooking)' }
          ].map((h) => (
            <div key={h.flat} className="p-4 rounded-2xl bg-[#FBF7EF] dark:bg-white/5 border border-[#DDE9D8] dark:border-white/10">
              <div className="font-mono font-black text-base text-[#153D32] dark:text-[#E9A15B]">{h.flat}</div>
              <div className="font-extrabold text-xs text-[#202A25] dark:text-white mt-1">{h.resident}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{h.cluster}</div>
              <span className="mt-2 inline-block text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                {h.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SocietyProfessionalsPage() {
  const { activeSocietyId } = useAuth();
  const [cooks, setCooks] = useState([]);

  useEffect(() => {
    api.getCooks(activeSocietyId).then(setCooks).catch(() => setCooks([]));
  }, [activeSocietyId]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-black text-[#153D32] dark:text-white">
          Domestic Staff Clearances & Gate Verification
        </h1>
        <p className="text-xs sm:text-sm text-[#64746B] dark:text-slate-400 mt-1">
          Police verification numbers, biometric badges, and health certificates
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-[#DDE9D8] dark:border-white/10 shadow-sm overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-[#FBF7EF] dark:bg-white/5 border-b border-[#DDE9D8] dark:border-white/10 text-slate-500 font-bold uppercase">
            <tr>
              <th className="py-3 px-4">Staff Name</th>
              <th className="py-3 px-4">Verification ID</th>
              <th className="py-3 px-4">Health Screening</th>
              <th className="py-3 px-4">Security Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#DDE9D8]/50 dark:divide-white/5">
            {cooks.map((c) => (
              <tr key={c.id}>
                <td className="py-3.5 px-4 font-bold text-[#202A25] dark:text-white">{c.name}</td>
                <td className="py-3.5 px-4 font-mono text-slate-500">KSP-2026-00{c.id}</td>
                <td className="py-3.5 px-4">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    Cleared (Dr. Lal PathLabs)
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  <button
                    type="button"
                    className="px-3 py-1 rounded-lg bg-[#153D32] text-white text-[11px] font-bold cursor-pointer"
                  >
                    Generate Daily QR Gate Pass
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function SocietyComplaintsPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-black text-[#153D32] dark:text-white">
          Incident Reports & Hygiene Resolution Log
        </h1>
        <p className="text-xs sm:text-sm text-[#64746B] dark:text-slate-400 mt-1">
          RWA incident tracking for punctuality, kitchen cleanliness, and gate authorization
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-[#DDE9D8] dark:border-white/10 shadow-sm space-y-4">
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <div>
              <div className="font-bold text-xs text-emerald-900 dark:text-emerald-200">Zero Open Incidents</div>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400">All 38 household sessions this week operated with 100% punctuality and verified cleanliness.</p>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-800">100% Hygiene Score</span>
        </div>
      </div>
    </div>
  );
}

export function SocietySettingsPage() {
  const { showToast } = useAuth();
  const [gates, setGates] = useState('Gate 1 (North), Gate 2 (Service)');
  const [cutoff, setCutoff] = useState('22:00');

  const handleSave = (e) => {
    e.preventDefault();
    showToast('Campus security parameters updated.');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-black text-[#153D32] dark:text-white">
          Campus Gate & Security Parameters
        </h1>
        <p className="text-xs sm:text-sm text-[#64746B] dark:text-slate-400 mt-1">
          RWA entry restrictions, domestic staff biometric gates, and timing cutoffs
        </p>
      </div>

      <div className="max-w-xl bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-[#DDE9D8] dark:border-white/10 shadow-sm">
        <form onSubmit={handleSave} className="space-y-4 text-xs font-semibold">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 mb-1">Permitted Entry Gates</label>
            <input
              type="text"
              value={gates}
              onChange={(e) => setGates(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-300 mb-1">Evening Gate Pass Cutoff Time</label>
            <input
              type="time"
              value={cutoff}
              onChange={(e) => setCutoff(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-[#153D32] text-white font-bold cursor-pointer"
          >
            Save Campus Rules
          </button>
        </form>
      </div>
    </div>
  );
}

