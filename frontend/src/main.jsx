import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ChefHat,
  CalendarDays,
  Home,
  LogOut,
  Users,
  Wallet,
  ShieldCheck,
  Bell,
  Star,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Utensils,
  ChevronRight,
  Filter,
  Sparkles,
  TrendingUp,
  QrCode,
  Phone,
  Flame,
  ArrowRight,
  Check,
  X,
  CreditCard,
  Building2,
  Calendar,
  AlertTriangle,
  UserCheck,
  HeartHandshake,
  Award,
  Layers,
  Search,
  RefreshCw,
  PlusCircle,
  MessageSquare,
  FileText
} from 'lucide-react';
import './style.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
let authToken = sessionStorage.getItem('sc_token');

async function api(path, body) {
  const res = await fetch(API_BASE + path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: 'Bearer ' + authToken } : {})
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

const money = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
const day = (v) => String(v || '').slice(0, 10);
const todayStr = () => new Date().toISOString().slice(0, 10);

const DEMO_PERSONAS = [
  { label: 'Resident (Rahul)', email: 'resident@example.com', role: 'RESIDENT', desc: 'Flat A-101' },
  { label: 'Cook (Ramesh)', email: 'ramesh@example.com', role: 'COOK', desc: '5 Flats in Tower A' },
  { label: 'Cook (Lakshmi)', email: 'cook@example.com', role: 'COOK', desc: 'South Indian' },
  { label: 'Society Manager', email: 'manager@example.com', role: 'SOCIETY_MANAGER', desc: 'Greenwood' },
  { label: 'Platform Admin', email: 'admin@example.com', role: 'ADMIN', desc: 'Ops & Backup' }
];

const DEFAULT_WEEKLY_MENU = [
  { day: 'Monday', meal: 'Dinner', dishes: 'Dal Tadka, Fresh Phulkas (3), Seasonal Aloo Bhindi, Green Salad', tag: 'Homestyle Comfort' },
  { day: 'Tuesday', meal: 'Dinner', dishes: 'Paneer Butter Masala, Jeera Rice, Soft Rotis, Cucumber Raita', tag: 'High Protein' },
  { day: 'Wednesday', meal: 'Dinner', dishes: 'Panchmel Dal, Methi Thepla, Baingan Bharta, Roasted Papad', tag: 'Rajasthani' },
  { day: 'Thursday', meal: 'Dinner', dishes: 'Rajma Masala, Steamed Basmati Rice, Curd, Kachumber Salad', tag: 'Desi Classic' },
  { day: 'Friday', meal: 'Dinner', dishes: 'Vegetable Pulao, Dal Makhani, Phulkas, Boondi Raita', tag: 'Weekend Special' },
  { day: 'Saturday', meal: 'Dinner', dishes: 'Masala Dosa / Utthapam, Traditional Sambar, Coconut Chutney', tag: 'South Indian' },
  { day: 'Sunday', meal: 'Dinner', dishes: 'Chole Masala, Ajwain Poori, Sweet Semolina Halwa', tag: 'Feast' }
];

function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('Overview');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [societies, setSocieties] = useState([]);
  const [activeSocietyId, setActiveSocietyId] = useState(1);
  const [data, setData] = useState({});
  const [selectedCook, setSelectedCook] = useState(null);
  const [cookModalDetails, setCookModalDetails] = useState(null);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [pendingBooking, setPendingBooking] = useState(null);
  const [cuisineFilter, setCuisineFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'

  // Weekly Menu state
  const [weeklyMenu, setWeeklyMenu] = useState(DEFAULT_WEEKLY_MENU);

  // Business Calculator state (PRD Section 12)
  const [calcHouseholds, setCalcHouseholds] = useState(5);
  const [calcPrice, setCalcPrice] = useState(4000);
  const [calcCommission, setCalcCommission] = useState(10);
  const [calcActiveCooks, setCalcActiveCooks] = useState(100);

  // Authentication & Initial Load
  const fetchMe = async () => {
    try {
      const me = await api('/auth/me');
      setUser(me);
      if (me.society_id) setActiveSocietyId(me.society_id);
    } catch {
      authToken = null;
      sessionStorage.removeItem('sc_token');
      setUser(null);
    }
  };

  const loadSocieties = async () => {
    try {
      const socs = await api('/societies');
      setSocieties(socs);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadSocieties();
    if (authToken) {
      fetchMe();
    }
  }, []);

  const refreshAllData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const paths = {
        bookings: '/bookings',
        sessions: '/sessions',
        notifications: '/notifications'
      };

      if (user.role === 'RESIDENT' || user.role === 'ADMIN' || user.role === 'SOCIETY_MANAGER') {
        paths.cooks = `/cooks?society_id=${activeSocietyId}`;
        paths.replacements = '/replacements';
      }

      if (user.role === 'COOK' || user.role === 'ADMIN' || user.role === 'SOCIETY_MANAGER') {
        paths.leaves = '/leaves';
      }

      if (user.role === 'ADMIN') {
        paths.adminStats = '/admin/stats';
        paths.adminCooks = '/admin/cooks';
      }

      if (user.role === 'SOCIETY_MANAGER' || user.role === 'ADMIN') {
        paths.societyDash = '/society/dashboard';
      }

      const results = await Promise.all(
        Object.entries(paths).map(async ([key, url]) => {
          try {
            return [key, await api(url)];
          } catch {
            return [key, []];
          }
        })
      );
      setData(Object.fromEntries(results));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      refreshAllData();
    }
  }, [user, activeSocietyId]);

  const switchPersona = async (email) => {
    setError('');
    setSuccess('');
    try {
      const res = await api('/auth/login', { email, password: 'Demo12345!' });
      authToken = res.token;
      sessionStorage.setItem('sc_token', authToken);
      const me = await api('/auth/me');
      setUser(me);
      if (me.society_id) setActiveSocietyId(me.society_id);
      setActiveTab('Overview');
      setSelectedCook(null);
      setSuccess(`Switched persona to ${me.name} (${me.role})`);
    } catch (e) {
      setError(e.message);
    }
  };

  const handleLogout = () => {
    authToken = null;
    sessionStorage.removeItem('sc_token');
    setUser(null);
    setData({});
    setSelectedCook(null);
    setActiveTab('Overview');
  };

  // Open cook slot modal
  const openCookModal = async (cook) => {
    try {
      const details = await api(`/cooks/${cook.id}`);
      setSelectedCook(details);
      setCookModalDetails(details);
      setShowSlotModal(true);
    } catch (e) {
      setError(e.message);
    }
  };

  // Confirm Slot Booking
  const handleSlotBooking = async (slot) => {
    setError('');
    try {
      const booking = await api('/bookings', {
        cookId: selectedCook.id,
        startDate: todayStr(),
        startTime: slot.start,
        mealType: slot.meal,
        slotLabel: slot.label
      });
      setShowSlotModal(false);
      setPendingBooking(booking);
      setShowPayModal(true);
    } catch (e) {
      setError(e.message);
    }
  };

  // Complete Demo Payment
  const completePayment = async () => {
    if (!pendingBooking) return;
    setError('');
    try {
      await api(`/bookings/${pendingBooking.id}/pay-demo`);
      setShowPayModal(false);
      setPendingBooking(null);
      setSuccess('🎉 Monthly subscription activated! Your cook will arrive at the scheduled slot.');
      await refreshAllData();
      setActiveTab('My Subscription');
    } catch (e) {
      setError(e.message);
    }
  };

  // Attendance Check-in / Check-out for cook
  const handleAttendance = async (sessionId, action) => {
    setError('');
    try {
      await api(`/sessions/${sessionId}/attendance`, { action });
      setSuccess(action === 'in' ? '👨‍🍳 Checked in successfully at flat!' : '✅ Check-out recorded. Service completed!');
      await refreshAllData();
    } catch (e) {
      setError(e.message);
    }
  };

  // Submit Review
  const submitReview = async () => {
    if (!showReviewModal) return;
    try {
      await api('/reviews', {
        bookingId: showReviewModal.id,
        rating: reviewRating,
        comment: reviewComment || 'Delicious home-cooked meal! Very hygienic and disciplined.'
      });
      setShowReviewModal(null);
      setReviewComment('');
      setSuccess('⭐ Thank you for rating your cook!');
      await refreshAllData();
    } catch (e) {
      setError(e.message);
    }
  };

  // Request Backup Cook
  const requestReplacement = async (sessionId) => {
    try {
      await api('/replacements', { sessionId, reason: 'Resident requested backup cook' });
      setSuccess('🛡️ Backup cook request submitted. Platform operations is matching an available cook.');
      await refreshAllData();
    } catch (e) {
      setError(e.message);
    }
  };

  // Apply Leave for Cook
  const applyLeave = async (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      await api('/leaves', {
        startDate: form.get('startDate'),
        endDate: form.get('endDate'),
        reason: form.get('reason')
      });
      setSuccess('Leave request submitted. Operations will arrange backup cooks for your households.');
      e.currentTarget.reset();
      await refreshAllData();
    } catch (err) {
      setError(err.message);
    }
  };

  // Approve Leave for Admin
  const approveLeave = async (leaveId) => {
    try {
      await api(`/leaves/${leaveId}/approve`);
      setSuccess('Leave approved and backup cook auto-matched to affected sessions!');
      await refreshAllData();
    } catch (err) {
      setError(err.message);
    }
  };

  // Assign Replacement Cook for Admin
  const assignReplacement = async (replacementId, cookId) => {
    try {
      await api(`/replacements/${replacementId}/assign`, { cookId });
      setSuccess('Backup cook successfully assigned to session!');
      await refreshAllData();
    } catch (err) {
      setError(err.message);
    }
  };

  // Toggle Cook Verification for Admin
  const toggleVerification = async (cookId, currentStatus) => {
    try {
      await api(`/admin/cooks/${cookId}/verify`, { verified: !currentStatus });
      setSuccess(`Cook status updated to ${!currentStatus ? 'VERIFIED' : 'UNVERIFIED'}`);
      await refreshAllData();
    } catch (err) {
      setError(err.message);
    }
  };

  // Derived filtered cooks
  const filteredCooks = useMemo(() => {
    const list = data.cooks || [];
    return list.filter((c) => {
      const matchSearch =
        (c.name + ' ' + c.cuisine + ' ' + (c.dietary_tags || '')).toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchSearch) return false;
      if (cuisineFilter === 'ALL') return true;
      if (cuisineFilter === 'NORTH' && c.cuisine.toLowerCase().includes('north')) return true;
      if (cuisineFilter === 'SOUTH' && c.cuisine.toLowerCase().includes('south')) return true;
      if (cuisineFilter === 'VEG' && (c.cuisine.toLowerCase().includes('veg') || (c.dietary_tags || '').toLowerCase().includes('veg'))) return true;
      if (cuisineFilter === 'HEALTHY' && (c.cuisine.toLowerCase().includes('health') || (c.dietary_tags || '').toLowerCase().includes('protein'))) return true;
      if (cuisineFilter === 'JAIN' && (c.dietary_tags || '').toLowerCase().includes('jain')) return true;
      return true;
    });
  }, [data.cooks, searchQuery, cuisineFilter]);

  // Active bookings & sessions
  const bookings = data.bookings || [];
  const sessions = data.sessions || [];
  const notifications = data.notifications || [];
  const activeSubscription = bookings.find((b) => b.status === 'ACTIVE');
  const leaves = data.leaves || [];
  const replacements = data.replacements || [];

  // Cook's specific today sessions
  const todayCookSessions = useMemo(() => {
    if (user?.role !== 'COOK') return [];
    return sessions.filter((s) => s.service_date === todayStr() || true).slice(0, 5);
  }, [sessions, user]);

  // Calculate Revenue Projection (PRD Section 12)
  const calcGrossRevenuePerCook = calcHouseholds * calcPrice;
  const calcPlatformRevPerCook = (calcGrossRevenuePerCook * calcCommission) / 100;
  const calcCookPayout = calcGrossRevenuePerCook - calcPlatformRevPerCook;
  const calcTotalMonthlyPlatformRev = calcPlatformRevPerCook * calcActiveCooks;
  const calcTotalAnnualPlatformRev = calcTotalMonthlyPlatformRev * 12;

  // Render Unauthenticated Landing Page
  if (!user) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex flex-col text-stone-800">
        {/* Top Header */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-stone-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-stone-900 flex items-center gap-1.5">
                SocietyCook
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">MVP 1.0</span>
              </span>
              <p className="text-xs text-stone-500">Shared Cook Booking Platform · Bengaluru</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-stone-500 hidden sm:inline">Try Demo Persona:</span>
            <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl">
              {DEMO_PERSONAS.map((p) => (
                <button
                  key={p.email}
                  onClick={() => switchPersona(p.email)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white shadow-xs hover:bg-orange-500 hover:text-white transition-all text-stone-700 border border-stone-200/60"
                  title={p.desc}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <main className="flex-1 max-w-7xl mx-auto px-6 py-12 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-100 text-orange-800 text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              HYPERLOCAL SERVICE MARKETPLACE · INDIA
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-stone-900 leading-[1.12]">
              Your Kitchen. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-amber-600 to-amber-500">
                Your Cook.
              </span>{' '}
              Your Time.
            </h1>

            <p className="text-lg text-stone-600 leading-relaxed max-w-2xl">
              Multiple households within the same residential apartment share a verified professional cook by booking individual cooking time slots.
              Enjoy fresh home-cooked meals in your kitchen with guaranteed backup coverage.
            </p>

            {/* Value props badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-white border border-stone-200/80 shadow-xs">
                <ShieldCheck className="w-5 h-5 text-emerald-600 mb-1.5" />
                <h4 className="text-xs font-bold text-stone-800">100% Verified</h4>
                <p className="text-[11px] text-stone-500">ID, Police & Hygiene check</p>
              </div>
              <div className="p-3.5 rounded-xl bg-white border border-stone-200/80 shadow-xs">
                <Clock className="w-5 h-5 text-orange-600 mb-1.5" />
                <h4 className="text-xs font-bold text-stone-800">Zero Travel Lag</h4>
                <p className="text-[11px] text-stone-500">2 min elevator transit</p>
              </div>
              <div className="p-3.5 rounded-xl bg-white border border-stone-200/80 shadow-xs">
                <HeartHandshake className="w-5 h-5 text-amber-600 mb-1.5" />
                <h4 className="text-xs font-bold text-stone-800">Guaranteed Backup</h4>
                <p className="text-[11px] text-stone-500">Replacements on leave</p>
              </div>
              <div className="p-3.5 rounded-xl bg-white border border-stone-200/80 shadow-xs">
                <Wallet className="w-5 h-5 text-teal-600 mb-1.5" />
                <h4 className="text-xs font-bold text-stone-800">₹4,000 / month</h4>
                <p className="text-[11px] text-stone-500">Save 40% vs private</p>
              </div>
            </div>

            {/* Quick Demo Launchpad */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 via-orange-50/50 to-stone-50 border border-orange-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold tracking-wide uppercase text-orange-900 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-orange-600" />
                  Instant Interactive Demo Personas
                </span>
                <span className="text-xs text-orange-700 font-medium">Click to test live app</span>
              </div>
              <div className="grid sm:grid-cols-3 gap-2.5">
                <button
                  onClick={() => switchPersona('resident@example.com')}
                  className="p-3 rounded-xl bg-white hover:border-orange-500 border border-stone-200 text-left transition-all hover:shadow-md group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-900 group-hover:text-orange-600">Rahul (Resident)</span>
                    <ChevronRight className="w-4 h-4 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <p className="text-[11px] text-stone-500 mt-1">Book slots, active ₹4k plan, backup alert</p>
                </button>

                <button
                  onClick={() => switchPersona('ramesh@example.com')}
                  className="p-3 rounded-xl bg-white hover:border-orange-500 border border-stone-200 text-left transition-all hover:shadow-md group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-900 group-hover:text-orange-600">Ramesh (Cook)</span>
                    <ChevronRight className="w-4 h-4 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <p className="text-[11px] text-stone-500 mt-1">5 Flats schedule, ₹20k earnings, check-in</p>
                </button>

                <button
                  onClick={() => switchPersona('manager@example.com')}
                  className="p-3 rounded-xl bg-white hover:border-orange-500 border border-stone-200 text-left transition-all hover:shadow-md group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-900 group-hover:text-orange-600">Society Manager</span>
                    <ChevronRight className="w-4 h-4 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <p className="text-[11px] text-stone-500 mt-1">Security gate QR passes & tower roster</p>
                </button>
              </div>
            </div>
          </div>

          {/* Sign In / Sign Up Card */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-3xl p-8 border border-stone-200 shadow-xl shadow-stone-200/50">
              <div className="flex items-center justify-between border-b border-stone-100 pb-4 mb-6">
                <div>
                  <h3 className="text-xl font-bold text-stone-900">
                    {authMode === 'login' ? 'Sign in to SocietyCook' : 'Join Your Society Network'}
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {authMode === 'login' ? 'Access your daily cooking schedule' : 'Register for verified home cooking'}
                  </p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
                  {authMode === 'login' ? '🔑' : '✨'}
                </div>
              </div>

              {error && (
                <div className="p-3.5 mb-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setError('');
                  const fd = Object.fromEntries(new FormData(e.currentTarget));
                  try {
                    if (authMode === 'register') {
                      fd.societyId = Number(fd.societyId);
                      const res = await api('/auth/register', fd);
                      authToken = res.token;
                      sessionStorage.setItem('sc_token', authToken);
                      await fetchMe();
                    } else {
                      const res = await api('/auth/login', fd);
                      authToken = res.token;
                      sessionStorage.setItem('sc_token', authToken);
                      await fetchMe();
                    }
                  } catch (err) {
                    setError(err.message);
                  }
                }}
                className="space-y-4"
              >
                {authMode === 'register' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">Full Name</label>
                      <input
                        name="name"
                        required
                        placeholder="e.g. Rahul Sharma"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">I am a</label>
                        <select
                          name="role"
                          className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                          <option value="RESIDENT">Resident (Customer)</option>
                          <option value="COOK">Professional Cook</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">Flat / Unit</label>
                        <input
                          name="flat"
                          placeholder="e.g. Tower A - 101"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">Select Society</label>
                      <select
                        name="societyId"
                        className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        {societies.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.address.split(',')[0]})
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Email Address</label>
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="you@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Password</label>
                  <input
                    name="password"
                    type="password"
                    required
                    minLength={8}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-2"
                >
                  {authMode === 'login' ? 'Sign In to Dashboard' : 'Create Account'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="mt-5 text-center">
                <button
                  onClick={() => {
                    setError('');
                    setAuthMode(authMode === 'login' ? 'register' : 'login');
                  }}
                  className="text-xs text-orange-700 hover:text-orange-800 font-semibold underline underline-offset-4"
                >
                  {authMode === 'login' ? "Don't have an account? Create one" : 'Already registered? Sign in here'}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Navigation Menus by Role
  const role = user.role;
  const navItems =
    role === 'RESIDENT'
      ? [
          { id: 'Find cooks', label: 'Find Cooks', icon: Utensils },
          { id: 'My Subscription', label: 'My Subscription', icon: CalendarDays },
          { id: 'Daily Sessions', label: 'Sessions & Attendance', icon: Clock },
          { id: 'Meal Planner', label: 'Weekly Menu Planner', icon: Sparkles },
          { id: 'Replacements', label: 'Backup Coverage', icon: HeartHandshake },
          { id: 'Revenue Calculator', label: 'Platform Economics', icon: TrendingUp }
        ]
      : role === 'COOK'
      ? [
          { id: 'Cook Dashboard', label: "Today's Schedule", icon: Clock },
          { id: 'Earnings', label: 'Monthly Earnings', icon: Wallet },
          { id: 'Leaves', label: 'Leave & Backups', icon: Calendar },
          { id: 'Profile', label: 'My Cook Profile', icon: UserCheck },
          { id: 'Revenue Calculator', label: 'Platform Economics', icon: TrendingUp }
        ]
      : role === 'SOCIETY_MANAGER'
      ? [
          { id: 'Gate & Security', label: 'Security & Gate Pass', icon: QrCode },
          { id: 'Towers & Flats', label: 'Tower Directory', icon: Building2 },
          { id: 'Cooks Roster', label: 'Verified Cooks', icon: ChefHat },
          { id: 'Revenue Calculator', label: 'Economics Model', icon: TrendingUp }
        ]
      : [
          // ADMIN
          { id: 'Admin Overview', label: 'Operations Overview', icon: Layers },
          { id: 'Cook Verification', label: 'Cook KYC & Verification', icon: ShieldCheck },
          { id: 'Backup Dispatcher', label: 'Backup Allocations', icon: HeartHandshake },
          { id: 'All Bookings', label: 'Bookings & Payouts', icon: Wallet },
          { id: 'Revenue Calculator', label: 'Revenue Model', icon: TrendingUp }
        ];

  return (
    <div className="min-h-screen bg-[#faf8f5] flex flex-col text-stone-800">
      {/* Top Banner & Quick Persona Switcher */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-stone-200 px-6 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-white shadow-xs">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-stone-900">SocietyCook</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {role.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>

          {/* Society Selector */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 border border-stone-200/80 text-xs font-semibold text-stone-700">
            <MapPin className="w-3.5 h-3.5 text-orange-600" />
            <select
              value={activeSocietyId}
              onChange={(e) => {
                setActiveSocietyId(Number(e.target.value));
                setSuccess('Switched society context');
              }}
              className="bg-transparent border-none text-xs font-bold text-stone-800 focus:outline-none cursor-pointer"
            >
              {societies.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Persona quick switch buttons */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-stone-400 px-2">Demo Role:</span>
            {DEMO_PERSONAS.map((p) => (
              <button
                key={p.email}
                onClick={() => switchPersona(p.email)}
                className={`px-2 py-1 text-xs font-semibold rounded-lg transition-all ${
                  user.email === p.email
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200/50'
                }`}
              >
                {p.label.split(' ')[0]}
              </button>
            ))}
          </div>

          {/* Notifications bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors relative"
            >
              <Bell className="w-4 h-4" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-orange-600 text-white text-[9px] font-bold flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-stone-200 p-4 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Notifications</span>
                  <span className="text-[11px] text-stone-400">{notifications.length} total</span>
                </div>
                <div className="divide-y divide-stone-100 max-h-64 overflow-y-auto mt-2">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-stone-400 py-4 text-center">No new notifications</p>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className="py-2.5 text-xs text-stone-700">
                        <p>{n.message}</p>
                        <span className="text-[10px] text-stone-400 mt-1 block">{day(n.created_at)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User profile & logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-stone-200">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 text-white font-bold text-xs flex items-center justify-center">
              {user.name[0]}
            </div>
            <div className="hidden sm:block text-left">
              <span className="block text-xs font-bold text-stone-800 leading-tight">{user.name}</span>
              <span className="block text-[10px] text-stone-500">{user.flat || user.role}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors ml-1"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Global Alerts */}
      {error && (
        <div className="bg-red-500 text-white text-xs px-6 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')}><X className="w-4 h-4" /></button>
        </div>
      )}
      {success && (
        <div className="bg-emerald-600 text-white text-xs px-6 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Main Workspace with Sidebar Tabs */}
      <div className="flex-1 flex max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 gap-6">
        {/* Navigation Sidebar */}
        <aside className="w-56 shrink-0 hidden md:block">
          <div className="sticky top-20 space-y-1 bg-white p-3 rounded-2xl border border-stone-200/80 shadow-xs">
            <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-stone-400">
              {role === 'RESIDENT' ? 'Resident Portal' : role === 'COOK' ? 'Cook Workplace' : role === 'SOCIETY_MANAGER' ? 'Society Gate' : 'Admin Operations'}
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setError('');
                    setSuccess('');
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                    isActive
                      ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-xs shadow-orange-500/20'
                      : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-stone-500'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Society Stat widget */}
          <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50/60 border border-orange-200/70 text-xs space-y-2">
            <span className="text-[10px] uppercase font-bold text-orange-800 tracking-wider">Hyperlocal Cluster</span>
            <p className="text-stone-700 font-medium leading-relaxed">
              In <b>Greenwood Residency</b>, sharing a cook saves ₹6,500/mo vs private cook with 0 travel delay!
            </p>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 min-w-0">
          {/* Mobile Tab Bar */}
          <div className="md:hidden flex overflow-x-auto gap-2 pb-3 mb-4 scrollbar-none">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap ${
                  activeTab === item.id ? 'bg-orange-600 text-white' : 'bg-white text-stone-700 border border-stone-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* TAB 1: Resident - Find Cooks */}
          {(activeTab === 'Find cooks' || (role === 'RESIDENT' && activeTab === 'Overview')) && (
            <div className="space-y-6">
              {/* Header Banner */}
              <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 text-white p-6 sm:p-8 rounded-3xl shadow-lg relative overflow-hidden">
                <div className="relative z-10 max-w-xl space-y-2">
                  <span className="text-xs uppercase font-bold tracking-widest text-orange-400">
                    My Society · Tower A & B
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                    Find Your Daily Cook
                  </h2>
                  <p className="text-stone-300 text-xs sm:text-sm">
                    Home-cooked meals made easy. Verified professional cooks preparing fresh meals inside your kitchen during dedicated 45-min slots.
                  </p>
                </div>
                <ChefHat className="absolute -bottom-6 -right-6 w-48 h-48 text-white/5 pointer-events-none" />
              </div>

              {/* Search & Cuisine Filter Pills */}
              <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by cook name, cuisine (e.g. North Indian, Chettinad, Jain) or dietary preference..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {[
                    { id: 'ALL', label: 'All Cooks' },
                    { id: 'NORTH', label: 'North Indian & Phulkas' },
                    { id: 'SOUTH', label: 'South Indian & Sambar' },
                    { id: 'VEG', label: 'Pure Veg & Sattvic' },
                    { id: 'HEALTHY', label: 'High Protein & Fitness' },
                    { id: 'JAIN', label: '100% Jain Friendly' }
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setCuisineFilter(filter.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        cuisineFilter === filter.id
                          ? 'bg-orange-600 text-white shadow-xs'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cook Cards Grid (matching PRD wireframe!) */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-5">
                {filteredCooks.map((cook) => (
                  <div
                    key={cook.id}
                    className="bg-white rounded-3xl border border-stone-200/90 hover:border-orange-300 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
                  >
                    <div>
                      {/* Cook Header Image & Verified Badge */}
                      <div className="relative h-44 bg-stone-100 overflow-hidden">
                        <img
                          src={cook.photo_url || 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=400&q=80'}
                          alt={cook.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-bold shadow-xs">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Verified
                        </div>
                        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur text-white text-[11px] font-bold">
                          {cook.experience} yrs exp.
                        </div>

                        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-white">
                          <div>
                            <h3 className="text-xl font-bold tracking-tight">{cook.name}</h3>
                            <p className="text-xs text-stone-200 flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              <span className="font-bold">{Number(cook.rating || 4.8).toFixed(1)}</span>
                              <span className="text-stone-300">({cook.review_count || 12} reviews)</span>
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-black text-amber-300">{money(cook.price)}</span>
                            <span className="text-[11px] text-stone-300 block">/month</span>
                          </div>
                        </div>
                      </div>

                      {/* Cook details */}
                      <div className="p-5 space-y-3">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-orange-700">
                          <Flame className="w-3.5 h-3.5" />
                          <span>{cook.cuisine}</span>
                        </div>

                        <p className="text-xs text-stone-600 leading-relaxed line-clamp-2">{cook.bio}</p>

                        {/* Dietary tags */}
                        {cook.dietary_tags && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {cook.dietary_tags.split(',').map((tag, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 text-[10px] font-medium"
                              >
                                {tag.trim()}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Active households in society */}
                        <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs text-stone-500">
                          <span className="flex items-center gap-1 font-semibold text-stone-700">
                            <Building2 className="w-3.5 h-3.5 text-stone-400" />
                            {cook.active_households || 3} flats in Tower A & B
                          </span>
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full text-[11px]">
                            Available for Booking
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Book Slot Button */}
                    <div className="p-5 pt-0">
                      <button
                        onClick={() => openCookModal(cook)}
                        className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-2"
                      >
                        <CalendarDays className="w-4 h-4" />
                        View Available Slots & Book
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: Resident - My Subscription & Backup Coverage */}
          {activeTab === 'My Subscription' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-extrabold text-stone-900">My Subscription</h2>
                <p className="text-xs text-stone-500">Active monthly cooking service and replacement management</p>
              </div>

              {activeSubscription ? (
                  <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-md space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-stone-100">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                          ● Active Monthly Plan
                        </span>
                        <h3 className="text-3xl font-black text-stone-900 mt-2">
                          {money(activeSubscription.amount)}{' '}
                          <span className="text-sm font-medium text-stone-500">/month</span>
                        </h3>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-stone-400 block">Next Renewal Date</span>
                        <span className="text-sm font-bold text-stone-800">{day(activeSubscription.end_date)}</span>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-3 gap-4">
                      <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80">
                        <span className="text-xs text-stone-500 block mb-1">Assigned Cook</span>
                        <span className="text-base font-bold text-stone-900 flex items-center gap-2">
                          <ChefHat className="w-4 h-4 text-orange-600" />
                          {activeSubscription.cook_name}
                        </span>
                        <span className="text-xs text-stone-500 mt-0.5 block">{activeSubscription.cook_cuisine}</span>
                      </div>

                      <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80">
                        <span className="text-xs text-stone-500 block mb-1">Daily Time Slot</span>
                        <span className="text-base font-bold text-stone-900 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-amber-600" />
                          {activeSubscription.slot_label || activeSubscription.start_time.slice(0, 5)}
                        </span>
                        <span className="text-xs text-stone-500 mt-0.5 block">{activeSubscription.meal_type || 'Dinner'} Service (45 mins)</span>
                      </div>

                      <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80">
                        <span className="text-xs text-stone-500 block mb-1">Service Address</span>
                        <span className="text-base font-bold text-stone-900 flex items-center gap-2">
                          <Home className="w-4 h-4 text-teal-600" />
                          Flat {user.flat || 'A-101'}
                        </span>
                        <span className="text-xs text-stone-500 mt-0.5 block">Greenwood Residency, Tower A</span>
                      </div>
                    </div>

                    {/* PRD Wireframe Alert Banner: Backup Cook Scenario */}
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                      <HeartHandshake className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                      <div className="flex-1 text-xs">
                        <h4 className="font-bold text-amber-900">Cook Leave & Backup Guarantee Policy</h4>
                        <p className="text-amber-800 mt-0.5">
                          When your primary cook applies for planned or emergency leave, SocietyCook automatically assigns a verified backup cook from your society cluster. Your service is never disrupted.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          const todaySession = sessions.find((s) => s.booking_id === activeSubscription.id);
                          if (todaySession) requestReplacement(todaySession.id);
                          else setSuccess('Backup cook requested for upcoming service');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-amber-700 text-white font-bold text-xs hover:bg-amber-800 transition-colors shrink-0"
                      >
                        Request Replacement
                      </button>
                    </div>

                    {/* Review Trigger */}
                    <div className="pt-2 flex justify-between items-center text-xs text-stone-500 border-t border-stone-100">
                      <span>Rate your experience to help maintain cooking quality</span>
                      <button
                        onClick={() => setShowReviewModal(activeSubscription)}
                        className="font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
                      >
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        Leave Cook Review
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 space-y-4">
                    <ChefHat className="w-12 h-12 text-stone-300 mx-auto" />
                    <h3 className="text-lg font-bold text-stone-800">No Active Monthly Subscription</h3>
                    <p className="text-xs text-stone-500 max-w-md mx-auto">
                      Choose an available professional cook in your society and reserve your recurring daily slot.
                    </p>
                    <button
                      onClick={() => setActiveTab('Find cooks')}
                      className="px-6 py-2.5 rounded-xl bg-orange-600 text-white font-bold text-xs hover:bg-orange-700 transition-colors inline-flex items-center gap-2"
                    >
                      <Utensils className="w-4 h-4" />
                      Browse Verified Cooks
                    </button>
                  </div>
                )}
            </div>
          )}

          {/* TAB 3: Resident - Daily Sessions & Attendance */}
          {activeTab === 'Daily Sessions' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-extrabold text-stone-900">Cooking Sessions & Attendance</h2>
                  <p className="text-xs text-stone-500">Track cook arrival, check-in timestamps and service history</p>
                </div>
              </div>

              {sessions.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-3xl border border-stone-200 text-stone-400 text-xs">
                  No sessions scheduled yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {sessions.slice(0, 10).map((sess) => (
                    <div
                      key={sess.id}
                      className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-wrap items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm ${
                            sess.status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : sess.status === 'IN_PROGRESS'
                              ? 'bg-orange-100 text-orange-800 animate-pulse'
                              : 'bg-stone-100 text-stone-700'
                          }`}
                        >
                          <Clock className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-stone-900">
                              {sess.slot_label || sess.start_time?.slice(0, 5) || '08:30 PM'}
                            </span>
                            <span
                              className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                                sess.status === 'COMPLETED'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : sess.status === 'IN_PROGRESS'
                                  ? 'bg-orange-50 text-orange-700 border border-orange-200'
                                  : 'bg-stone-100 text-stone-600'
                              }`}
                            >
                              {sess.status.replace('_', ' ')}
                            </span>
                            {sess.replacement_status && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                                🛡️ Backup Cook Assigned
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-stone-500 mt-0.5">
                            Cook: <b>{sess.cook_name}</b> · Flat {sess.flat || 'A-101'} · Date: {day(sess.service_date)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {sess.check_in && (
                          <div className="text-right text-xs">
                            <span className="text-stone-400 block text-[10px]">Check-in Time</span>
                            <span className="font-semibold text-stone-700">{String(sess.check_in).slice(11, 16)}</span>
                          </div>
                        )}
                        {sess.status === 'SCHEDULED' && (
                          <button
                            onClick={() => requestReplacement(sess.id)}
                            className="px-3 py-1.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-semibold"
                          >
                            Need Backup?
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Resident - Weekly Meal Planner (Unique Feature PRD P2) */}
          {activeTab === 'Meal Planner' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-extrabold text-stone-900">Weekly Meal Planner</h2>
                  <p className="text-xs text-stone-500">
                    Personalized 7-day dinner menu synced directly with your assigned cook
                  </p>
                </div>
                <button
                  onClick={() => setSuccess('Weekly menu preferences saved and notified to cook!')}
                  className="px-4 py-2 rounded-xl bg-orange-600 text-white font-bold text-xs hover:bg-orange-700 transition-colors shadow-xs"
                >
                  Save & Sync with Cook
                </button>
              </div>

              {/* Dietary Controls */}
              <div className="bg-white p-5 rounded-2xl border border-stone-200 space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Family Taste & Dietary Settings</span>
                <div className="grid sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                    <span className="text-stone-500 block mb-1">Spice Preference</span>
                    <select className="w-full bg-white border border-stone-300 rounded-lg p-1.5 text-xs font-semibold">
                      <option>Medium Desi Spice</option>
                      <option>Mild / Kid Friendly</option>
                      <option>High Spice (Andhra Style)</option>
                    </select>
                  </div>
                  <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                    <span className="text-stone-500 block mb-1">Oil / Ghee Usage</span>
                    <select className="w-full bg-white border border-stone-300 rounded-lg p-1.5 text-xs font-semibold">
                      <option>Minimal Cold Pressed Oil</option>
                      <option>Desi Ghee Phulkas</option>
                      <option>Standard Homestyle</option>
                    </select>
                  </div>
                  <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                    <span className="text-stone-500 block mb-1">Dietary Category</span>
                    <select className="w-full bg-white border border-stone-300 rounded-lg p-1.5 text-xs font-semibold">
                      <option>Vegetarian</option>
                      <option>Jain (No Onion / Garlic)</option>
                      <option>Non-Veg Allowed</option>
                      <option>High Protein Fitness</option>
                    </select>
                  </div>
                  <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                    <span className="text-stone-500 block mb-1">Household Size</span>
                    <select className="w-full bg-white border border-stone-300 rounded-lg p-1.5 text-xs font-semibold">
                      <option>2 Adults</option>
                      <option>2 Adults + 1 Kid</option>
                      <option>4 Adults (Family)</option>
                      <option>Bachelor Flatshare</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 7-Day Interactive Menu Board */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {weeklyMenu.map((item, idx) => (
                  <div key={item.day} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm text-stone-900">{item.day}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">
                        {item.tag}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-stone-50 border border-stone-100">
                      <span className="text-[10px] text-stone-400 uppercase font-bold block mb-1">Proposed Dinner</span>
                      <p className="text-xs font-semibold text-stone-800">{item.dishes}</p>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-stone-400 text-[11px]">45 min prep</span>
                      <button
                        onClick={() => {
                          const updated = [...weeklyMenu];
                          const newDish = prompt(`Custom dish for ${item.day}:`, item.dishes);
                          if (newDish) {
                            updated[idx].dishes = newDish;
                            setWeeklyMenu(updated);
                          }
                        }}
                        className="text-orange-600 font-bold hover:underline"
                      >
                        Customize
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: Resident - Backup Coverage */}
          {activeTab === 'Replacements' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-extrabold text-stone-900">Backup Cook Coverage</h2>
                <p className="text-xs text-stone-500">Live replacement tracker when regular cooks are on leave</p>
              </div>

              {replacements.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-3xl border border-stone-200 text-stone-400 text-xs">
                  All cooking appointments are fulfilled on regular schedule. No active replacements.
                </div>
              ) : (
                <div className="space-y-4">
                  {replacements.map((r) => (
                    <div key={r.id} className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-100">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-stone-900">Service Date: {day(r.service_date)}</span>
                          <span
                            className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                              r.status === 'ASSIGNED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {r.status === 'ASSIGNED' ? '✅ Replacement Confirmed' : '⏳ Matching Backup'}
                          </span>
                        </div>
                        <span className="text-xs text-stone-400">Flat: {r.flat || 'A-101'}</span>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4 text-xs">
                        <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                          <span className="text-stone-400 block mb-1">Primary Cook on Leave</span>
                          <span className="font-bold text-stone-800">{r.orig_cook_name || 'Lakshmi Narayanan'}</span>
                          <p className="text-[11px] text-stone-500 mt-1">Reason: {r.reason || 'Planned family leave'}</p>
                        </div>

                        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                          <span className="text-emerald-700 font-bold block mb-1">Assigned Backup Cook</span>
                          <span className="font-bold text-emerald-950 text-sm">
                            {r.backup_cook_name || 'Sunita Sharma (Verified)'}
                          </span>
                          <p className="text-[11px] text-emerald-800 mt-1">
                            Same society cluster. Familiar with kitchen safety and hygiene guidelines.
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: Cook - Today's Schedule & Attendance Dashboard (PRD Wireframe Replica) */}
          {(activeTab === 'Cook Dashboard' || (role === 'COOK' && activeTab === 'Overview')) && (
            <div className="space-y-6">
              {/* Cook Earnings & Household KPI Header (PRD Wireframe Replica) */}
              <div className="bg-gradient-to-r from-stone-900 to-stone-800 text-white p-6 sm:p-8 rounded-3xl shadow-lg">
                <div className="flex flex-wrap items-center justify-between gap-6">
                  <div>
                    <span className="text-xs uppercase font-bold tracking-wider text-orange-400">
                      Cook Partner Dashboard · Tower A Cluster
                    </span>
                    <h3 className="text-3xl sm:text-4xl font-black mt-2">
                      This Month's Earnings: <span className="text-emerald-400">₹20,000</span>
                    </h3>
                    <p className="text-stone-300 text-xs sm:text-sm mt-1">
                      5 Active Households · 100% On-Time Performance · 4.9 ★ Rating
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="bg-white/10 backdrop-blur p-4 rounded-2xl border border-white/10 text-center">
                      <span className="text-xs text-stone-300 block">Transit Time</span>
                      <span className="text-lg font-bold text-white">2 mins</span>
                      <span className="text-[10px] text-stone-400 block">Elevator only</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Today's Schedule Roster (PRD Wireframe Replica!) */}
              <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                  <div>
                    <h3 className="text-lg font-bold text-stone-900">Today's Hyperlocal Cooking Route</h3>
                    <p className="text-xs text-stone-500">Greenwood Residency · Tower A Floor-by-Floor Service</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
                    5 Sessions Today
                  </span>
                </div>

                <div className="space-y-3">
                  {[
                    { id: 1, time: '07:00 PM', flat: 'Flat A-101', resident: 'Priya Varma', status: 'COMPLETED', dishes: 'Dal Tadka, 4 Phulkas, Bhindi Masala' },
                    { id: 2, time: '07:45 PM', flat: 'Flat A-102', resident: 'Arjun Nair', status: 'IN_PROGRESS', dishes: 'Paneer Butter Masala, Jeera Rice' },
                    { id: 3, time: '08:30 PM', flat: 'Flat A-103', resident: 'Rahul Sharma (Demo)', status: 'SCHEDULED', dishes: 'Panchmel Dal, Theplas, Baingan Bharta' },
                    { id: 4, time: '09:15 PM', flat: 'Flat A-104', resident: 'Neha Kapoor', status: 'SCHEDULED', dishes: 'Rajma Masala, Basmati Rice, Salad' },
                    { id: 5, time: '10:00 PM', flat: 'Flat A-105', resident: 'Karthik & Pooja', status: 'SCHEDULED', dishes: 'Mix Veg, 6 Phulkas, Yellow Dal' }
                  ].map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl border border-stone-200/90 hover:border-orange-300 transition-all flex flex-wrap items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-bold text-xs ${
                            item.status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.status === 'IN_PROGRESS'
                              ? 'bg-orange-100 text-orange-800 animate-pulse'
                              : 'bg-stone-100 text-stone-700'
                          }`}
                        >
                          <span className="text-sm">{item.time.split(' ')[0]}</span>
                          <span className="text-[10px] font-normal">{item.time.split(' ')[1]}</span>
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-stone-900">{item.flat}</span>
                            <span className="text-xs text-stone-500 font-medium">({item.resident})</span>
                            <span
                              className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                                item.status === 'COMPLETED'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : item.status === 'IN_PROGRESS'
                                  ? 'bg-orange-50 text-orange-700'
                                  : 'bg-stone-100 text-stone-600'
                              }`}
                            >
                              {item.status.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-xs text-stone-600 mt-1 flex items-center gap-1.5">
                            <Utensils className="w-3.5 h-3.5 text-orange-600" />
                            <span>Menu: {item.dishes}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {item.status === 'SCHEDULED' && (
                          <button
                            onClick={() => handleAttendance(item.id, 'in')}
                            className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-xs"
                          >
                            Check In at Flat
                          </button>
                        )}
                        {item.status === 'IN_PROGRESS' && (
                          <button
                            onClick={() => handleAttendance(item.id, 'out')}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                          >
                            Mark Completed
                          </button>
                        )}
                        {item.status === 'COMPLETED' && (
                          <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" /> Finished
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: Cook - Earnings & Payouts */}
          {activeTab === 'Earnings' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-extrabold text-stone-900">Monthly Earnings & Payouts</h2>
                <p className="text-xs text-stone-500">Transparent earnings calculation and direct bank payout records</p>
              </div>

              <div className="grid sm:grid-cols-3 gap-5">
                <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-1">
                  <span className="text-xs font-bold text-stone-400 uppercase">Gross Subscription Earnings</span>
                  <h3 className="text-3xl font-black text-stone-900">₹20,000</h3>
                  <p className="text-xs text-stone-500">5 households × ₹4,000/mo</p>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-1">
                  <span className="text-xs font-bold text-stone-400 uppercase">Platform Fee (10%)</span>
                  <h3 className="text-3xl font-black text-stone-500">₹2,000</h3>
                  <p className="text-xs text-stone-500">Includes backup insurance & app ops</p>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-1">
                  <span className="text-xs font-bold text-emerald-600 uppercase">Net Monthly Payout</span>
                  <h3 className="text-3xl font-black text-emerald-600">₹18,000</h3>
                  <p className="text-xs text-emerald-700 font-semibold">Credited on 1st of every month via UPI</p>
                </div>
              </div>

              {/* Roster of subscribed households */}
              <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
                <h3 className="text-base font-bold text-stone-900">Subscribed Households in Your Cluster</h3>
                <div className="divide-y divide-stone-100 text-xs">
                  {[
                    { flat: 'A-101', name: 'Priya Varma', slot: '07:00 PM', amount: 4000, status: 'Active' },
                    { flat: 'A-102', name: 'Arjun Nair', slot: '07:45 PM', amount: 4000, status: 'Active' },
                    { flat: 'A-103', name: 'Rahul Sharma', slot: '08:30 PM', amount: 4000, status: 'Active' },
                    { flat: 'A-104', name: 'Neha Kapoor', slot: '09:15 PM', amount: 4000, status: 'Active' },
                    { flat: 'A-105', name: 'Karthik & Pooja', slot: '10:00 PM', amount: 4000, status: 'Active' }
                  ].map((row, idx) => (
                    <div key={idx} className="py-3 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-stone-900">{row.flat}</span> · {row.name}
                        <span className="text-stone-400 block text-[11px]">Daily Slot: {row.slot}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-stone-900">{money(row.amount)}</span>
                        <span className="text-emerald-700 block text-[10px] font-semibold">● Paid</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: Cook - Leave Application & Coverages */}
          {activeTab === 'Leaves' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-extrabold text-stone-900">Leave Management</h2>
                  <p className="text-xs text-stone-500">Apply for planned leaves; backup cooks automatically cover your flats</p>
                </div>
              </div>

              {/* Leave Application Form */}
              <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
                <h3 className="text-base font-bold text-stone-900">Request Time Off</h3>
                <form onSubmit={applyLeave} className="grid sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block text-stone-600 font-semibold mb-1">From Date</label>
                    <input
                      name="startDate"
                      type="date"
                      required
                      min={todayStr()}
                      className="w-full p-2.5 rounded-xl border border-stone-300"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-600 font-semibold mb-1">To Date</label>
                    <input
                      name="endDate"
                      type="date"
                      required
                      min={todayStr()}
                      className="w-full p-2.5 rounded-xl border border-stone-300"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-600 font-semibold mb-1">Reason</label>
                    <input
                      name="reason"
                      placeholder="e.g. Village function, festival, personal"
                      required
                      className="w-full p-2.5 rounded-xl border border-stone-300"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-xs transition-colors"
                    >
                      Submit Leave Request
                    </button>
                  </div>
                </form>
              </div>

              {/* Leave Records List */}
              <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
                <h3 className="text-base font-bold text-stone-900">Your Leave History</h3>
                {leaves.length === 0 ? (
                  <p className="text-xs text-stone-400 py-4">No leaves requested yet.</p>
                ) : (
                  <div className="divide-y divide-stone-100 text-xs">
                    {leaves.map((l) => (
                      <div key={l.id} className="py-3 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-stone-800">
                            {day(l.start_date)} to {day(l.end_date)}
                          </span>
                          <span className="text-stone-500 block text-[11px] mt-0.5">Reason: {l.reason}</span>
                        </div>
                        <div>
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              l.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {l.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 9: Cook - Profile & Availability */}
          {activeTab === 'Profile' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-extrabold text-stone-900">Cook Profile & Availability</h2>
                <p className="text-xs text-stone-500">Update your culinary specialties, monthly rates and working hours</p>
              </div>

              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-xs">
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const fd = Object.fromEntries(new FormData(e.currentTarget));
                    try {
                      await api('/cooks/profile', {
                        cuisine: fd.cuisine,
                        bio: fd.bio,
                        price: Number(fd.price),
                        experience: Number(fd.experience),
                        from: fd.from,
                        to: fd.to,
                        dietary_tags: fd.dietary_tags
                      });
                      setSuccess('Profile updated successfully!');
                      await refreshAllData();
                    } catch (err) {
                      setError(err.message);
                    }
                  }}
                  className="space-y-4 text-xs"
                >
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-stone-700 font-semibold mb-1">Cuisines / Specialties</label>
                      <input
                        name="cuisine"
                        defaultValue="North Indian, Punjabi & Mughlai Delicacies"
                        required
                        className="w-full p-2.5 rounded-xl border border-stone-300"
                      />
                    </div>
                    <div>
                      <label className="block text-stone-700 font-semibold mb-1">Dietary Tags</label>
                      <input
                        name="dietary_tags"
                        defaultValue="North Indian, High Protein, Custom Spice, Homestyle"
                        className="w-full p-2.5 rounded-xl border border-stone-300"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-stone-700 font-semibold mb-1">Bio / About You</label>
                    <textarea
                      name="bio"
                      rows={3}
                      defaultValue="Known as the Phulka Master! Specializes in hot rotis, layered parathas, authentic dal makhani, rajma-chawal, shahi paneer, seasonal sabzi, and nutritious daily khichdi."
                      className="w-full p-2.5 rounded-xl border border-stone-300"
                    />
                  </div>

                  <div className="grid sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-stone-700 font-semibold mb-1">Monthly Fee (₹)</label>
                      <input
                        name="price"
                        type="number"
                        min={1000}
                        defaultValue={4000}
                        required
                        className="w-full p-2.5 rounded-xl border border-stone-300"
                      />
                    </div>
                    <div>
                      <label className="block text-stone-700 font-semibold mb-1">Years of Experience</label>
                      <input
                        name="experience"
                        type="number"
                        min={0}
                        defaultValue={8}
                        required
                        className="w-full p-2.5 rounded-xl border border-stone-300"
                      />
                    </div>
                    <div>
                      <label className="block text-stone-700 font-semibold mb-1">Available From</label>
                      <input
                        name="from"
                        type="time"
                        defaultValue="07:00"
                        required
                        className="w-full p-2.5 rounded-xl border border-stone-300"
                      />
                    </div>
                    <div>
                      <label className="block text-stone-700 font-semibold mb-1">Available Until</label>
                      <input
                        name="to"
                        type="time"
                        defaultValue="22:00"
                        required
                        className="w-full p-2.5 rounded-xl border border-stone-300"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-xs transition-colors"
                    >
                      Save Cook Profile
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 10: Society Manager - Security Gate Pass & Cluster Roster (Unique Touch PRD Section 7 & 21) */}
          {(activeTab === 'Gate & Security' || activeTab === 'Towers & Flats' || activeTab === 'Cooks Roster' || (role === 'SOCIETY_MANAGER' && activeTab === 'Overview')) && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-extrabold text-stone-900">
                    Society Security & Gate Pass Management
                  </h2>
                  <p className="text-xs text-stone-500">
                    MyGate & NoBrokerHood integrated security validation for verified cooks
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" /> Society Authorized
                  </span>
                </div>
              </div>

              {/* Digital Gate Pass Card Mockup */}
              <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 text-white p-6 sm:p-8 rounded-3xl shadow-lg relative overflow-hidden">
                <div className="relative z-10 max-w-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase font-extrabold tracking-widest text-amber-200">
                      GATED COMMUNITY ACCESS BADGE
                    </span>
                    <span className="text-xs font-bold bg-white/20 px-2.5 py-0.5 rounded-full">
                      PASS #SC-8942
                    </span>
                  </div>

                  <div>
                    <h3 className="text-2xl font-black">Greenwood Residency Main Security Gate</h3>
                    <p className="text-xs text-amber-100 mt-0.5">
                      Authorized Entry: Tower A, B, C · Daily 06:30 AM – 10:30 PM
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-2 text-xs">
                    <div className="bg-black/20 p-2.5 rounded-xl backdrop-blur">
                      <span className="text-amber-200 block text-[10px]">Active Cooks</span>
                      <span className="text-base font-bold">5 Verified</span>
                    </div>
                    <div className="bg-black/20 p-2.5 rounded-xl backdrop-blur">
                      <span className="text-amber-200 block text-[10px]">Towers Covered</span>
                      <span className="text-base font-bold">3 Towers</span>
                    </div>
                    <div className="bg-black/20 p-2.5 rounded-xl backdrop-blur">
                      <span className="text-amber-200 block text-[10px]">Security Clear</span>
                      <span className="text-base font-bold">100% Police Verified</span>
                    </div>
                  </div>
                </div>
                <QrCode className="absolute -bottom-6 -right-6 w-44 h-44 text-white/15 pointer-events-none" />
              </div>

              {/* Tower & Flats Cluster Table */}
              <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-stone-900">Tower Flat Allocations & Cook Cluster</h3>
                  <span className="text-xs text-stone-400">Showing active Tower A cluster</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider font-bold">
                      <tr>
                        <th className="py-3 px-4 rounded-l-xl">Flat</th>
                        <th className="py-3 px-4">Resident</th>
                        <th className="py-3 px-4">Assigned Cook</th>
                        <th className="py-3 px-4">Time Slot</th>
                        <th className="py-3 px-4 rounded-r-xl">Security Clearance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {[
                        { flat: 'A-101', name: 'Rahul Sharma', cook: 'Ramesh Kumar', slot: '08:30 PM', pass: 'Validated' },
                        { flat: 'A-102', name: 'Priya Varma', cook: 'Ramesh Kumar', slot: '07:00 PM', pass: 'Validated' },
                        { flat: 'A-103', name: 'Arjun Nair', cook: 'Ramesh Kumar', slot: '07:45 PM', pass: 'Validated' },
                        { flat: 'A-104', name: 'Neha Kapoor', cook: 'Ramesh Kumar', slot: '09:15 PM', pass: 'Validated' },
                        { flat: 'A-105', name: 'Karthik & Pooja', cook: 'Ramesh Kumar', slot: '10:00 PM', pass: 'Validated' },
                        { flat: 'B-302', name: 'Ananya Sen', cook: 'Lakshmi Narayanan', slot: '12:30 PM', pass: 'Validated' }
                      ].map((row, idx) => (
                        <tr key={idx} className="hover:bg-stone-50/70">
                          <td className="py-3 px-4 font-bold text-stone-900">{row.flat}</td>
                          <td className="py-3 px-4">{row.name}</td>
                          <td className="py-3 px-4 font-semibold text-stone-800">{row.cook}</td>
                          <td className="py-3 px-4 text-stone-600">{row.slot}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              🛡️ Gate PIN Active
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 11: Admin - KYC Verification & Operations Desk */}
          {(activeTab === 'Admin Overview' || activeTab === 'Cook Verification' || activeTab === 'Backup Dispatcher' || activeTab === 'All Bookings' || (role === 'ADMIN' && activeTab === 'Overview')) && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-extrabold text-stone-900">Platform Operations Command</h2>
                <p className="text-xs text-stone-500">
                  Manage societies, verified cook KYC, backup allocations, and transaction volumes
                </p>
              </div>

              {/* Admin KPI Cards */}
              <div className="grid sm:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
                  <span className="text-xs font-bold text-stone-400 uppercase">Gross Booking Value</span>
                  <h3 className="text-2xl font-black text-stone-900 mt-1">₹24,000</h3>
                  <span className="text-[11px] text-emerald-600 font-semibold">100% Payment Fulfillment</span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
                  <span className="text-xs font-bold text-stone-400 uppercase">Verified Cooks</span>
                  <h3 className="text-2xl font-black text-stone-900 mt-1">5 Cooks</h3>
                  <span className="text-[11px] text-stone-500">Across 4 Societies</span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
                  <span className="text-xs font-bold text-stone-400 uppercase">Active Subscriptions</span>
                  <h3 className="text-2xl font-black text-stone-900 mt-1">6 Households</h3>
                  <span className="text-[11px] text-stone-500">Tower A & B clusters</span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
                  <span className="text-xs font-bold text-stone-400 uppercase">Backup Fulfillment</span>
                  <h3 className="text-2xl font-black text-emerald-600 mt-1">100%</h3>
                  <span className="text-[11px] text-emerald-700 font-semibold">Zero unattended leaves</span>
                </div>
              </div>

              {/* Cook Verification & KYC Desk */}
              <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-stone-900">Cook Verification & KYC Status</h3>
                  <span className="text-xs text-stone-400">Identity & Police Verification</span>
                </div>

                <div className="divide-y divide-stone-100 text-xs">
                  {(data.adminCooks || data.cooks || []).map((c) => (
                    <div key={c.id} className="py-3.5 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={c.photo_url || 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=400&q=80'}
                          alt={c.name}
                          className="w-10 h-10 rounded-full object-cover border border-stone-200"
                        />
                        <div>
                          <span className="font-bold text-stone-900 text-sm">{c.name}</span>
                          <p className="text-stone-500 text-[11px]">
                            {c.cuisine} · {c.experience} yrs exp · {money(c.price)}/mo
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            c.verified ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {c.verified ? 'VERIFIED' : 'PENDING KYC'}
                        </span>

                        <button
                          onClick={() => toggleVerification(c.id, c.verified)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors ${
                            c.verified
                              ? 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          }`}
                        >
                          {c.verified ? 'Revoke Access' : 'Approve KYC'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Leaves & Backup Allocation Desk */}
              <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-stone-900">Pending Cook Leaves & Backup Allocations</h3>
                  <span className="text-xs text-stone-400">Match backup cooks</span>
                </div>

                {leaves.length === 0 ? (
                  <p className="text-xs text-stone-400 py-3">No pending leaves.</p>
                ) : (
                  <div className="space-y-3">
                    {leaves.map((l) => (
                      <div
                        key={l.id}
                        className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <span className="font-bold text-stone-900">{l.name || 'Cook'}</span> · {day(l.start_date)} to{' '}
                          {day(l.end_date)}
                          <p className="text-stone-500 text-[11px] mt-0.5">Reason: {l.reason}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              l.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {l.status}
                          </span>
                          {l.status === 'PENDING' && (
                            <button
                              onClick={() => approveLeave(l.id)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700"
                            >
                              Approve & Match Backup
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 12: Interactive Business Revenue Calculator (PRD Section 12) */}
          {activeTab === 'Revenue Calculator' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-extrabold text-stone-900">
                  Interactive Business Revenue Calculator
                </h2>
                <p className="text-xs text-stone-500">
                  From PRD Section 12: Hyperlocal unit economics, cook earnings, and platform scaling projections
                </p>
              </div>

              {/* Interactive Sliders & Live Results */}
              <div className="grid lg:grid-cols-12 gap-6">
                {/* Sliders Input Panel */}
                <div className="lg:col-span-6 bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-xs space-y-6">
                  <h3 className="text-base font-bold text-stone-900 border-b border-stone-100 pb-3">
                    Model Assumptions & Parameters
                  </h3>

                  <div className="space-y-5 text-xs">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-stone-700">Households per Cook</span>
                        <span className="px-2 py-0.5 rounded-md bg-orange-100 text-orange-800 font-black">
                          {calcHouseholds} flats
                        </span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={8}
                        value={calcHouseholds}
                        onChange={(e) => setCalcHouseholds(Number(e.target.value))}
                        className="w-full accent-orange-600 cursor-pointer"
                      />
                      <span className="text-[10px] text-stone-400">45-min slots per flat within the same building</span>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-stone-700">Monthly Price per Household</span>
                        <span className="px-2 py-0.5 rounded-md bg-orange-100 text-orange-800 font-black">
                          {money(calcPrice)}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={2000}
                        max={8000}
                        step={250}
                        value={calcPrice}
                        onChange={(e) => setCalcPrice(Number(e.target.value))}
                        className="w-full accent-orange-600 cursor-pointer"
                      />
                      <span className="text-[10px] text-stone-400">Standard market rate in Bengaluru gated societies</span>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-stone-700">Platform Commission (%)</span>
                        <span className="px-2 py-0.5 rounded-md bg-orange-100 text-orange-800 font-black">
                          {calcCommission}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={5}
                        max={25}
                        value={calcCommission}
                        onChange={(e) => setCalcCommission(Number(e.target.value))}
                        className="w-full accent-orange-600 cursor-pointer"
                      />
                      <span className="text-[10px] text-stone-400">Covers backup cook insurance, app ops and payments</span>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-stone-700">Active Cooks on Platform</span>
                        <span className="px-2 py-0.5 rounded-md bg-orange-100 text-orange-800 font-black">
                          {calcActiveCooks.toLocaleString()} cooks
                        </span>
                      </div>
                      <input
                        type="range"
                        min={10}
                        max={1000}
                        step={10}
                        value={calcActiveCooks}
                        onChange={(e) => setCalcActiveCooks(Number(e.target.value))}
                        className="w-full accent-orange-600 cursor-pointer"
                      />
                      <span className="text-[10px] text-stone-400">Servicing {calcActiveCooks * calcHouseholds} households</span>
                    </div>
                  </div>
                </div>

                {/* Outputs & Breakdown */}
                <div className="lg:col-span-6 bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col justify-between space-y-6">
                  <div>
                    <span className="text-xs uppercase font-extrabold tracking-widest text-amber-400">
                      LIVE UNIT ECONOMICS
                    </span>
                    <h3 className="text-2xl font-black mt-1">Platform Revenue Projection</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-white/10 backdrop-blur border border-white/10">
                      <span className="text-stone-300 text-xs block">Cook's Monthly Payout</span>
                      <span className="text-2xl font-black text-emerald-400">{money(calcCookPayout)}</span>
                      <span className="text-[10px] text-stone-400 block mt-0.5">90% directly to cook</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/10 backdrop-blur border border-white/10">
                      <span className="text-stone-300 text-xs block">Platform Rev / Cook</span>
                      <span className="text-2xl font-black text-amber-400">{money(calcPlatformRevPerCook)}</span>
                      <span className="text-[10px] text-stone-400 block mt-0.5">10% gross margin</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/10 backdrop-blur border border-white/10">
                      <span className="text-stone-300 text-xs block">Platform Monthly Revenue</span>
                      <span className="text-2xl font-black text-white">{money(calcTotalMonthlyPlatformRev)}</span>
                      <span className="text-[10px] text-stone-400 block mt-0.5">{calcActiveCooks} active cooks</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/10 backdrop-blur border border-white/10">
                      <span className="text-stone-300 text-xs block">Annual Gross Revenue</span>
                      <span className="text-2xl font-black text-amber-300">{money(calcTotalAnnualPlatformRev)}</span>
                      <span className="text-[10px] text-stone-400 block mt-0.5">12 months projection</span>
                    </div>
                  </div>

                  {/* Revenue Share Visual Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-stone-300">
                      <span>● Cook Payout: {100 - calcCommission}%</span>
                      <span>● Platform Commission: {calcCommission}%</span>
                    </div>
                    <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden flex">
                      <div
                        className="bg-emerald-500 h-full transition-all"
                        style={{ width: `${100 - calcCommission}%` }}
                      />
                      <div
                        className="bg-amber-400 h-full transition-all"
                        style={{ width: `${calcCommission}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* PRD Revenue Scaling Table */}
              <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
                <h3 className="text-base font-bold text-stone-900">PRD Scaled Projections (Assuming 5 Households/Cook & ₹4,000/mo)</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-stone-50 text-stone-600 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-4 rounded-l-xl">Active Cooks</th>
                        <th className="py-3 px-4">Households</th>
                        <th className="py-3 px-4">Monthly Revenue</th>
                        <th className="py-3 px-4 rounded-r-xl">Annual Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 font-medium">
                      {[
                        { cooks: 10, households: 50, monthly: '₹20,000', annual: '₹2.4 Lakh' },
                        { cooks: 100, households: 500, monthly: '₹2 Lakh', annual: '₹24 Lakh' },
                        { cooks: 500, households: '2,500', monthly: '₹10 Lakh', annual: '₹1.2 Crore' },
                        { cooks: '1,000', households: '5,000', monthly: '₹20 Lakh', annual: '₹2.4 Crore' },
                        { cooks: '10,000', households: '50,000', monthly: '₹2 Crore', annual: '₹24 Crore' }
                      ].map((row, idx) => (
                        <tr key={idx} className="hover:bg-stone-50">
                          <td className="py-3 px-4 font-bold text-stone-900">{row.cooks}</td>
                          <td className="py-3 px-4">{row.households}</td>
                          <td className="py-3 px-4 font-bold text-emerald-700">{row.monthly}</td>
                          <td className="py-3 px-4 font-bold text-orange-600">{row.annual}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* SLOT BOOKING DRAWER / MODAL (PRD Wireframe Replica!) */}
      {showSlotModal && selectedCook && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600">
                  Recurring Monthly Plan
                </span>
                <h3 className="text-xl font-black text-stone-900">
                  Book a Slot · {selectedCook.name}
                </h3>
              </div>
              <button
                onClick={() => setShowSlotModal(false)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-orange-50/70 border border-orange-200 flex items-center justify-between">
              <div>
                <span className="text-xs text-orange-900 block font-semibold">Monthly Plan Fee</span>
                <span className="text-2xl font-black text-stone-900">{money(selectedCook.price)}</span>
                <span className="text-xs text-stone-500 block">30 days recurring cooking service</span>
              </div>
              <div className="text-right text-xs text-stone-600">
                <span className="block font-bold">45 min cooking</span>
                <span>+ 15 min buffer</span>
              </div>
            </div>

            {/* Time Slot Picker (PRD Section 9 Wireframe Replica) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-600">
                  Available Time Slots
                </span>
                <span className="text-[11px] text-stone-400">Greenwood Residency Cluster</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {(selectedCook.slots || []).map((slot) => {
                  const isBooked = slot.isBooked;
                  return (
                    <button
                      key={slot.label}
                      disabled={isBooked}
                      onClick={() => handleSlotBooking(slot)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isBooked
                          ? 'bg-stone-100 border-stone-200 text-stone-400 cursor-not-allowed opacity-60'
                          : 'bg-white hover:border-orange-500 hover:bg-orange-50/50 border-stone-200 text-stone-800 shadow-xs'
                      }`}
                    >
                      <span className="text-xs font-black block">{slot.label}</span>
                      <span
                        className={`text-[10px] font-bold block mt-0.5 ${
                          isBooked ? 'text-red-500' : 'text-emerald-700'
                        }`}
                      >
                        {isBooked ? 'Booked' : '● Available'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reviews snippet */}
            {selectedCook.reviews?.length > 0 && (
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-100 space-y-2">
                <span className="text-[11px] uppercase font-bold text-stone-500">Resident Feedback</span>
                <p className="text-xs italic text-stone-700">
                  "{selectedCook.reviews[0].comment}"
                </p>
                <span className="text-[10px] text-stone-400 block">
                  — {selectedCook.reviews[0].resident_name} (Flat {selectedCook.reviews[0].flat})
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DEMO PAYMENT SIMULATOR MODAL */}
      {showPayModal && pendingBooking && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-stone-900">Confirm Monthly Plan</h3>
              <p className="text-xs text-stone-500">
                Simulated UPI / Card payment gateway for MVP prototype
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-stone-500">Service</span>
                <span className="font-bold text-stone-800">30-Day Shared Cook Booking</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Time Slot</span>
                <span className="font-bold text-stone-800">{pendingBooking.slotLabel || '08:30 PM'}</span>
              </div>
              <div className="flex justify-between border-t border-stone-200 pt-2 text-sm font-bold">
                <span>Total Amount</span>
                <span className="text-emerald-700">{money(pendingBooking.amount)}</span>
              </div>
            </div>

            <div className="space-y-2.5">
              <button
                onClick={completePayment}
                className="w-full py-3 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 text-xs"
              >
                <Check className="w-4 h-4" />
                Pay {money(pendingBooking.amount)} (Simulate UPI Success)
              </button>

              <button
                onClick={() => setShowPayModal(false)}
                className="w-full py-2.5 rounded-xl font-bold text-stone-600 hover:bg-stone-100 transition-colors text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LEAVE REVIEW MODAL */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-base font-bold text-stone-900">Rate Your Cook</h3>
              <button onClick={() => setShowReviewModal(null)}><X className="w-4 h-4" /></button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-stone-600 font-semibold mb-2">Cooking & Punctuality Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-1 text-2xl hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-stone-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-stone-600 font-semibold mb-1">Your Comments</label>
                <textarea
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="e.g. Delicious soft phulkas, dal tadka had great aroma, very punctual and kept kitchen clean!"
                  className="w-full p-3 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <button
                onClick={submitReview}
                className="w-full py-2.5 rounded-xl font-bold text-white bg-orange-600 hover:bg-orange-700 shadow-xs text-xs"
              >
                Submit Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
