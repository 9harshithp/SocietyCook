import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { usePWA } from '../../context/PWAContext';
import { api } from '../../services/api';
import { getConsentStatus, setConsentStatus } from '../../services/analytics';
import {
  ChefHat,
  Users,
  CheckCircle2,
  Calendar,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Star,
  Download,
  Moon,
  Sun,
  Bell,
  HelpCircle,
  UtensilsCrossed,
  Droplets,
  Layers,
  MapPin,
  Check,
  AlertTriangle,
  Smartphone
} from 'lucide-react';

export function ResidentOverviewPage() {
  const { user, activeSocietyId, showToast } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ sessions: [], groups: [], analytics: null });
  const [otpInput, setOtpInput] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [sessions, groups, analytics] = await Promise.all([
          api.getSessions({ societyId: activeSocietyId }).catch(() => []),
          api.getGroups(activeSocietyId).catch(() => []),
          api.getResidentAnalytics().catch(() => null)
        ]);
        setData({ sessions, groups, analytics });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [activeSocietyId]);

  const todaySession = data.sessions[0];
  const activeGroup = data.groups.find((g) => g.status === 'ACTIVE' || g.status === 'RECRUITING') || data.groups[0];

  const handleVerifyOtp = async (sessionId) => {
    if (!otpInput || otpInput.length < 4) {
      showToast('Please enter a valid 4-digit OTP', 'error');
      return;
    }
    try {
      await api.verifySessionOtp(sessionId, otpInput);
      showToast('Session verified successfully! Chef is cleared for entry.');
      setOtpInput('');
      setSelectedSessionId(null);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-xs font-bold text-slate-500">
        <div className="w-5 h-5 border-2 border-[#153D32] border-t-transparent rounded-full animate-spin mr-2" />
        Loading Resident Hub...
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Hero Welcome Card */}
      <div className="bg-gradient-to-br from-[#153D32] to-[#1E5747] text-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-[#153D32]/15 relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[#E9A15B] text-xs font-extrabold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Resident Portal · {user?.block_name || 'Tower A'}, Flat {user?.flat_number || '101'}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">Welcome home, {user?.name}!</h1>
          <p className="text-emerald-100 text-xs sm:text-sm max-w-xl font-medium">
            Your society cook cluster is active. Today's meals and utensil sanitization are scheduled in your private kitchen.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              to="/app/discover"
              className="px-4 py-2.5 rounded-xl bg-[#E9A15B] hover:bg-[#D88F4A] text-[#153D32] font-black text-xs inline-flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <UtensilsCrossed className="w-3.5 h-3.5" />
              <span>Explore Cooks</span>
            </Link>
            <Link
              to="/app/community"
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs inline-flex items-center gap-1.5 border border-white/20 cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-[#E9A15B]" />
              <span>Tower Group (32% Saved)</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Grid: Today's Meal & Tower Group */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Appointment & OTP */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-[#DDE9D8] dark:border-white/10 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#DDE9D8]/60 dark:border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-[#153D32] dark:text-[#E9A15B] flex items-center justify-center">
                <ChefHat className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-[#202A25] dark:text-white">Today's Appointment</h3>
                <p className="text-[11px] text-[#64746B] dark:text-slate-400">Doorstep Meal Preparation</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[10px] uppercase">
              {todaySession?.status || 'Scheduled'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#FBF7EF] dark:bg-white/5 border border-[#DDE9D8] dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs text-[#64746B] dark:text-slate-400 font-medium">Assigned Professional</div>
              <div className="font-extrabold text-sm text-[#202A25] dark:text-white mt-0.5">
                {todaySession?.cook_name || 'Chef Ramesh Kumar'}
              </div>
              <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1 mt-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Police Cleared · Tower A Route
              </div>
            </div>
            <div className="text-right sm:border-l sm:border-[#DDE9D8] dark:sm:border-white/10 sm:pl-6">
              <div className="text-xs text-[#64746B] dark:text-slate-400 font-medium">Scheduled Arrival</div>
              <div className="font-extrabold text-sm text-[#153D32] dark:text-[#E9A15B] mt-0.5">
                {todaySession?.scheduled_start_time?.slice(0, 5) || '19:00'} – {todaySession?.scheduled_end_time?.slice(0, 5) || '19:45'}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Slot: Dinner Prep + Kadhais</div>
            </div>
          </div>

          {/* OTP Section */}
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#964208] dark:text-[#E9A15B]" />
                <span className="font-extrabold text-xs text-[#964208] dark:text-[#E9A15B]">Gate Pass Verification OTP</span>
              </div>
              <span className="text-[10px] font-bold text-slate-500">Share with cook upon doorstep arrival</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="font-mono font-black text-2xl tracking-widest text-[#153D32] dark:text-white px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 shadow-xs">
                {todaySession?.otp_code || '4821'}
              </div>
              <div className="text-[11px] text-[#64746B] dark:text-slate-400">
                Cook punches this OTP into the mobile terminal to authenticate entrance and start session timer.
              </div>
            </div>
          </div>
        </div>

        {/* Active Tower Group Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-[#DDE9D8] dark:border-white/10 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-[#DDE9D8]/60 dark:border-white/10">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#153D32] dark:text-[#E9A15B]" />
                <h3 className="font-extrabold text-sm text-[#202A25] dark:text-white">Tower Group</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold">
                {activeGroup?.status || 'ACTIVE'}
              </span>
            </div>

            <div className="font-black text-base text-[#153D32] dark:text-white">
              {activeGroup?.name || 'Tower A Evening Dining Cluster'}
            </div>
            <p className="text-xs text-[#64746B] dark:text-slate-400">
              {activeGroup?.description || '4 adjacent flats sharing Chef Ramesh for consecutive dinner prep.'}
            </p>

            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-[#42524A] dark:text-slate-300 font-medium">Cluster Discount</span>
                <span className="font-extrabold text-emerald-700 dark:text-emerald-400">32% Applied</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#42524A] dark:text-slate-300 font-medium">Monthly Savings</span>
                <span className="font-extrabold text-[#964208] dark:text-[#E9A15B]">₹2,100 / month</span>
              </div>
            </div>
          </div>

          <Link
            to={`/app/community/${activeGroup?.id || 1}`}
            className="w-full py-2.5 rounded-xl bg-[#FBF7EF] dark:bg-white/5 hover:bg-[#DDE9D8]/40 dark:hover:bg-white/10 text-[#202A25] dark:text-white font-bold text-xs text-center transition-colors border border-[#DDE9D8] dark:border-white/10 block"
          >
            Manage Group & Roster
          </Link>
        </div>
      </div>

      {/* Weekly Menu Preview */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-[#DDE9D8] dark:border-white/10 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#DDE9D8]/60 dark:border-white/10">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="w-4 h-4 text-[#153D32] dark:text-[#E9A15B]" />
            <h3 className="font-extrabold text-sm text-[#202A25] dark:text-white">This Week's Meal Plan</h3>
          </div>
          <span className="text-xs text-[#64746B] dark:text-slate-400 font-medium">Customized for Low Oil & North Indian Homestyle</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { day: 'Mon', meal: 'Dal Tadka & Phulkas', type: 'Veg', active: true },
            { day: 'Tue', meal: 'Paneer Bhurji & Jeera Rice', type: 'Veg' },
            { day: 'Wed', meal: 'Mix Veg Curry & Rotis', type: 'Veg' },
            { day: 'Thu', meal: 'Rajma Masala & Steamed Rice', type: 'Veg' },
            { day: 'Fri', meal: 'Chole & Fresh Rotis', type: 'Veg' },
            { day: 'Sat', meal: 'Vegetable Biryani & Raita', type: 'Veg' },
            { day: 'Sun', meal: 'Special Weekend Thali', type: 'Special' }
          ].map((item) => (
            <div
              key={item.day}
              className={`p-3 rounded-2xl border text-center transition-all ${
                item.active
                  ? 'bg-[#153D32] text-white border-[#153D32] shadow-sm'
                  : 'bg-[#FBF7EF] dark:bg-white/5 text-[#202A25] dark:text-white border-[#DDE9D8] dark:border-white/10'
              }`}
            >
              <div className={`text-[10px] font-black uppercase ${item.active ? 'text-[#E9A15B]' : 'text-slate-400'}`}>
                {item.day}
              </div>
              <div className="font-bold text-xs mt-1 line-clamp-2 leading-tight">
                {item.meal}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ResidentServicesPage() {
  const services = [
    {
      id: 'COOKING',
      title: 'Home Cooking',
      icon: UtensilsCrossed,
      tag: 'DAILY ESSENTIAL',
      desc: 'Dedicated home cooks preparing fresh, nutritious, regional homestyle meals tailored to your dietary choices.',
      pricing: '₹3,500 / month',
      discounted: '₹2,380 / month with tower group',
      features: ['2 meals daily (Lunch + Dinner)', 'Phulkas, Curries, Rice & Dal', 'Custom spice & oil preferences', 'Guaranteed leave backup cover']
    },
    {
      id: 'DISHWASHING',
      title: 'Utensil Care & Dishwashing',
      icon: Droplets,
      tag: 'HYGIENE SPECIALIST',
      desc: 'Meticulous sink cleaning, pressure cooker descaling, and sparkling vessel sanitization right after your meals.',
      pricing: '₹2,200 / month',
      discounted: '₹1,490 / month with tower group',
      features: ['Heavy kadhai & pan scrubbing', 'Sink basin scrub & sanitization', 'Zero oil residue guarantee', 'Twice-daily scheduled slots']
    },
    {
      id: 'COMBINED',
      title: 'Complete Kitchen Care',
      icon: Layers,
      tag: 'MOST POPULAR',
      popular: true,
      desc: 'The complete synchronized kitchen solution: fresh meal cooking immediately followed by spotless utensil cleaning.',
      pricing: '₹5,200 / month',
      discounted: '₹3,536 / month with tower group',
      features: ['All cooking + dishwashing combined', 'Zero transition gap in your kitchen', 'Single trusted verified staff', 'Save ₹2,000+ monthly in cluster']
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#153D32]/10 dark:bg-white/10 text-[#153D32] dark:text-[#E9A15B] text-xs font-bold mb-2">
          <Layers className="w-3.5 h-3.5" />
          Household Service Portfolio
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-black text-[#153D32] dark:text-white">
          SocietyCook Service Tiers
        </h1>
        <p className="text-[#64746B] dark:text-slate-400 text-xs sm:text-sm mt-1 max-w-xl">
          Choose standalone meal cooking, utensil hygiene care, or full synchronized kitchen management.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {services.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.id}
              className={`rounded-3xl p-6 border flex flex-col justify-between transition-all ${
                s.popular
                  ? 'bg-white dark:bg-slate-900 border-2 border-[#153D32] dark:border-[#E9A15B] shadow-xl relative'
                  : 'bg-white dark:bg-slate-900 border-[#DDE9D8] dark:border-white/10 shadow-sm'
              }`}
            >
              {s.popular && (
                <div className="absolute -top-3 left-6 px-3 py-0.5 rounded-full bg-[#E9A15B] text-[#153D32] font-black text-[10px] uppercase tracking-wider shadow-xs">
                  {s.tag}
                </div>
              )}
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#153D32] to-[#1E5747] text-[#E9A15B] flex items-center justify-center">
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-[#202A25] dark:text-white">{s.title}</h3>
                  <p className="text-xs text-[#64746B] dark:text-slate-400 mt-1 leading-relaxed">{s.desc}</p>
                </div>

                <div className="pt-2 border-t border-[#DDE9D8]/60 dark:border-white/10">
                  <div className="text-xs text-slate-400 line-through">{s.pricing}</div>
                  <div className="font-black text-xl text-[#153D32] dark:text-[#E9A15B] mt-0.5">
                    {s.discounted}
                  </div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Includes 32% Tower Cluster Savings</div>
                </div>

                <ul className="space-y-2 text-xs text-[#42524A] dark:text-slate-300 pt-2">
                  {s.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6">
                <Link
                  to={`/app/discover?service=${s.id}`}
                  className="w-full py-3 rounded-xl bg-[#153D32] hover:bg-[#1C4E40] text-white font-bold text-xs text-center block transition-colors shadow-sm"
                >
                  Find {s.title} Staff
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ResidentBookingsPage() {
  const { activeSocietyId } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getSessions({ societyId: activeSocietyId })
      .then(setSessions)
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  }, [activeSocietyId]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-black text-[#153D32] dark:text-white">
            My Household Bookings
          </h1>
          <p className="text-xs sm:text-sm text-[#64746B] dark:text-slate-400 mt-1">
            Active and upcoming daily kitchen care appointments
          </p>
        </div>
        <Link
          to="/app/discover"
          className="px-4 py-2 rounded-xl bg-[#153D32] hover:bg-[#1E5244] text-white font-bold text-xs inline-flex items-center gap-1.5"
        >
          <UtensilsCrossed className="w-3.5 h-3.5" /> Book New Service
        </Link>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-[#DDE9D8] dark:border-white/10 shadow-sm">
        {loading ? (
          <div className="text-center py-10 text-xs text-slate-400">Loading appointments...</div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
            <div className="font-bold text-sm text-slate-700 dark:text-slate-200">No Active Appointments Found</div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Join a tower group cluster or book a verified professional to schedule your daily kitchen care.
            </p>
            <Link
              to="/app/community"
              className="inline-block px-4 py-2 rounded-xl bg-[#E9A15B] text-[#153D32] font-black text-xs"
            >
              Join Tower Cluster
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-[#DDE9D8]/50 dark:divide-white/10">
            {sessions.map((s) => (
              <div key={s.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#153D32]/10 dark:bg-white/10 flex items-center justify-center text-[#153D32] dark:text-[#E9A15B] font-bold">
                    <ChefHat className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-extrabold text-sm text-[#202A25] dark:text-white">
                      {s.cook_name || 'Assigned Cook'} · {s.meal_type || 'Dinner'}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>{s.scheduled_date || 'Today'}</span>
                      <span>•</span>
                      <span>{s.scheduled_start_time?.slice(0, 5) || '19:00'} - {s.scheduled_end_time?.slice(0, 5) || '19:45'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    {s.status || 'SCHEDULED'}
                  </span>
                  <span className="font-mono font-bold text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                    OTP: {s.otp_code || '4821'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function ResidentNotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getNotifications()
      .then(setNotifications)
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false));
  }, []);

  const handleMarkAll = async () => {
    await api.markNotificationsRead();
    setNotifications(notifications.map((n) => ({ ...n, is_read: 1 })));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-black text-[#153D32] dark:text-white">
            Notifications Center
          </h1>
          <p className="text-xs sm:text-sm text-[#64746B] dark:text-slate-400 mt-1">
            Real-time gate pass approvals, leave backups, and cluster savings
          </p>
        </div>
        <button
          type="button"
          onClick={handleMarkAll}
          className="px-3.5 py-2 rounded-xl border border-[#DDE9D8] dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-xs font-bold transition-colors cursor-pointer"
        >
          Mark all as read
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-[#DDE9D8] dark:border-white/10 shadow-sm divide-y divide-[#DDE9D8]/50 dark:divide-white/10">
        {loading ? (
          <div className="text-center py-8 text-xs text-slate-400">Loading alerts...</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">No notifications right now. All clear!</div>
        ) : (
          notifications.map((n) => (
            <div key={n.id} className="py-4 flex items-start gap-3">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                n.is_read ? 'bg-slate-100 dark:bg-white/5 text-slate-400' : 'bg-emerald-100 dark:bg-emerald-950 text-[#153D32] dark:text-[#E9A15B]'
              }`}>
                <Bell className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-extrabold text-xs text-[#202A25] dark:text-white truncate">{n.title}</h4>
                  <span className="text-[10px] text-slate-400 shrink-0">{String(n.created_at || '').slice(0, 10)}</span>
                </div>
                <p className="text-xs text-[#64746B] dark:text-slate-300 mt-0.5">{n.message}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function ResidentSupportPage() {
  const [submitted, setSubmitted] = useState(false);
  const [subject, setSubject] = useState('');
  const [details, setDetails] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-black text-[#153D32] dark:text-white">
          Resident Support & RWA Helpdesk
        </h1>
        <p className="text-xs sm:text-sm text-[#64746B] dark:text-slate-400 mt-1">
          24/7 assistance for cook replacements, gate pass queries, and billing support
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-[#DDE9D8] dark:border-white/10 shadow-sm space-y-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-[#153D32] dark:text-[#E9A15B] flex items-center justify-center">
            <HelpCircle className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-sm text-[#202A25] dark:text-white">Emergency Cook Backup</h3>
          <p className="text-xs text-[#64746B] dark:text-slate-400">
            If your assigned professional is on sudden medical leave, our automated backup cluster dispatches a certified standby cook within 45 minutes.
          </p>
          <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
            Helpline: +91 80 4567 8900
          </div>
        </div>

        <div className="md:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-[#DDE9D8] dark:border-white/10 shadow-sm">
          <h3 className="font-extrabold text-sm text-[#202A25] dark:text-white mb-4">Submit a Helpdesk Request</h3>
          {submitted ? (
            <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-center space-y-2">
              <Check className="w-8 h-8 text-emerald-600 mx-auto" />
              <div className="font-bold text-sm text-emerald-900 dark:text-emerald-200">Request Registered (Ticket #SC-8921)</div>
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                Our resident relationship manager will contact your flat within 30 minutes.
              </p>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="mt-3 px-4 py-2 rounded-xl bg-[#153D32] text-white font-bold text-xs"
              >
                Submit Another Request
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1">Issue Category</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Schedule Timing Adjustment / Dietary Preferences"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea
                  rows={4}
                  required
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Explain your request or dietary adjustment in detail..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-[#153D32] hover:bg-[#1E5244] text-white font-bold cursor-pointer"
              >
                Send Request
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export function ResidentProfilePage() {
  const { user, showToast } = useAuth();
  const [flat, setFlat] = useState(user?.flat_number || 'A-101');
  const [household, setHousehold] = useState(user?.household_size || '3');
  const [diet, setDiet] = useState(user?.dietary_preference || 'VEG');
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    showToast('Resident profile preferences updated successfully!');
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-black text-[#153D32] dark:text-white">
          My Flat & Dietary Preferences
        </h1>
        <p className="text-xs sm:text-sm text-[#64746B] dark:text-slate-400 mt-1">
          These preferences are shared with your assigned cook to prepare tailored meals.
        </p>
      </div>

      <div className="max-w-2xl bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-[#DDE9D8] dark:border-white/10 shadow-sm">
        <form onSubmit={handleSave} className="space-y-5 text-xs font-semibold">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                disabled
                value={user?.name || 'Rahul Sharma'}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                disabled
                value={user?.email || 'resident@example.com'}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 mb-1">Flat / Unit Number</label>
              <input
                type="text"
                value={flat}
                onChange={(e) => setFlat(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 mb-1">Household Members</label>
              <input
                type="number"
                min="1"
                max="10"
                value={household}
                onChange={(e) => setHousehold(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 mb-1">Dietary Category</label>
            <select
              value={diet}
              onChange={(e) => setDiet(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            >
              <option value="VEG">Pure Vegetarian (No Onion / Garlic optional)</option>
              <option value="NON_VEG">Non-Vegetarian (Chicken & Fish on selected days)</option>
              <option value="JAIN">Strict Jain (No root vegetables)</option>
              <option value="VEGAN">Plant-based / Vegan</option>
            </select>
          </div>

          <div className="flex items-center gap-3 pt-3">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#153D32] hover:bg-[#1E5244] text-white font-bold transition-colors cursor-pointer"
            >
              Save Preferences
            </button>
            {saved && (
              <span className="text-emerald-600 font-bold inline-flex items-center gap-1">
                <Check className="w-4 h-4" /> Preferences Updated
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export function ResidentSettingsPage() {
  const { isDarkMode, toggleDarkMode } = useAuth();
  const { isInstallable, isStandalone, promptInstall } = usePWA();
  const [consent, setConsent] = useState(() => getConsentStatus());
  const [consentSaved, setConsentSaved] = useState(false);

  const handleConsentChange = (newStatus) => {
    setConsentStatus(newStatus);
    setConsent(newStatus);
    setConsentSaved(true);
    setTimeout(() => setConsentSaved(false), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-black text-[#153D32] dark:text-white">
          Account & Device Settings
        </h1>
        <p className="text-xs sm:text-sm text-[#64746B] dark:text-slate-400 mt-1">
          Manage progressive web app installation, theme, privacy controls and device sync
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PWA Installation Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-[#DDE9D8] dark:border-white/10 shadow-sm space-y-4">
          <div className="w-10 h-10 rounded-xl bg-[#153D32] text-[#E9A15B] flex items-center justify-center">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-[#202A25] dark:text-white">SocietyCook PWA Application</h3>
            <p className="text-xs text-[#64746B] dark:text-slate-400 mt-1">
              {isStandalone
                ? 'SocietyCook is currently running as an installed standalone application on this device.'
                : 'Install SocietyCook to your home screen or desktop dock for instant access and native performance.'}
            </p>
          </div>

          <div>
            {isStandalone ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-xs">
                <Check className="w-4 h-4" /> Installed (Standalone Mode)
              </span>
            ) : isInstallable ? (
              <button
                type="button"
                onClick={promptInstall}
                className="px-4 py-2.5 rounded-xl bg-[#E9A15B] hover:bg-[#D88F4A] text-[#153D32] font-black text-xs inline-flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                <span>Install SocietyCook App</span>
              </button>
            ) : (
              <span className="text-xs text-slate-400 font-medium">
                Installed or running on an active web browser.
              </span>
            )}
          </div>
        </div>

        {/* Theme Preferences */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-[#DDE9D8] dark:border-white/10 shadow-sm space-y-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-[#E9A15B] flex items-center justify-center">
            {isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-[#202A25] dark:text-white">Theme & Appearance</h3>
            <p className="text-xs text-[#64746B] dark:text-slate-400 mt-1">
              Toggle between warm SocietyCook daylight mode and high-contrast dark room mode.
            </p>
          </div>
          <button
            type="button"
            onClick={toggleDarkMode}
            className="px-4 py-2.5 rounded-xl border border-[#DDE9D8] dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 font-bold text-xs inline-flex items-center gap-2 cursor-pointer"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-[#E9A15B]" /> : <Moon className="w-4 h-4 text-[#153D32]" />}
            <span>Switch to {isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        </div>

        {/* Privacy & Cookie Consent */}
        <div className="md:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-[#DDE9D8] dark:border-white/10 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-[#202A25] dark:text-white">
                Google Analytics & Privacy Preferences
              </h3>
              <p className="text-xs text-[#64746B] dark:text-slate-400 mt-0.5">
                Manage your Consent Mode v2 analytics storage preferences anytime.
              </p>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
              consent === 'granted'
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
            }`}>
              {consent === 'granted' ? 'Analytics Active' : 'Analytics Declined'}
            </span>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => handleConsentChange('granted')}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer"
            >
              Grant Consent
            </button>
            <button
              type="button"
              onClick={() => handleConsentChange('denied')}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              Decline All Analytics
            </button>
            {consentSaved && (
              <span className="text-xs text-emerald-600 font-bold inline-flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Preference saved
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

