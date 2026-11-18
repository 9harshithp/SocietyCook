import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ChefHat,
  Users,
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Star,
  QrCode,
  FileText,
  DollarSign,
  AlertTriangle,
  UserCheck,
  Check,
  X,
  Plus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export function DashboardHub() {
  const { user, activeSocietyId, showToast } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    sessions: [],
    groups: [],
    bookings: [],
    leaves: [],
    cooks: []
  });

  const [otpInput, setOtpInput] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [reviewModal, setReviewModal] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  // Leave application state
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');
  const [leaveReason, setLeaveReason] = useState('Personal family event');

  const loadData = async () => {
    try {
      setLoading(true);
      const [sessions, groups, bookings, leaves, cooks] = await Promise.all([
        api.getSessions({ societyId: activeSocietyId }).catch(() => []),
        api.getGroups(activeSocietyId).catch(() => []),
        api.getBookings().catch(() => []),
        api.getLeaves().catch(() => []),
        api.getCooks(activeSocietyId).catch(() => [])
      ]);
      setData({ sessions, groups, bookings, leaves, cooks });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeSocietyId, user]);

  const handleAttendance = async (sessionId, action) => {
    try {
      await api.updateAttendance(sessionId, action, otpInput);
      showToast(`Attendance updated: ${action} successful!`);
      setOtpInput('');
      setSelectedSessionId(null);
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    try {
      await api.applyLeave({
        cook_id: user?.cook_id || user?.id,
        start_date: leaveStart,
        end_date: leaveEnd,
        reason: leaveReason
      });
      showToast('Leave request submitted! Automated backup cook matching initiated.');
      setShowLeaveModal(false);
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleApproveLeave = async (leaveId) => {
    try {
      await api.approveLeave(leaveId);
      showToast('Leave approved and verified backup cook reassigned!');
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const submitReview = async () => {
    try {
      await api.submitReview({
        cook_id: reviewModal.cook_id,
        booking_id: reviewModal.id,
        rating,
        comment
      });
      showToast('Review submitted successfully!');
      setReviewModal(null);
      setComment('');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500 font-bold text-sm">
          <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          Loading Society Hub...
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RESIDENT DASHBOARD VIEW
  // -------------------------------------------------------------
  if (user?.role === 'RESIDENT') {
    const todaySession = data.sessions[0];
    const activeGroup = data.groups.find((g) => g.status === 'ACTIVE' || g.status === 'RECRUITING') || data.groups[0];

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Resident Portal · {user.block_name || 'Tower A'}, Flat {user.flat_number || '101'}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black">Welcome home, {user.name}!</h1>
            <p className="text-emerald-100 text-xs sm:text-sm mt-1 max-w-xl">
              Your society cook cluster is active. Today's meals are scheduled in your private kitchen.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/groups"
              className="px-5 py-2.5 rounded-xl bg-white text-emerald-800 font-bold text-xs hover:bg-slate-100 shadow-md transition-transform active:scale-95"
            >
              Discover Groups
            </Link>
            <Link
              to="/schedule"
              className="px-5 py-2.5 rounded-xl bg-emerald-800/60 hover:bg-emerald-800 text-white font-bold text-xs border border-emerald-400/40"
            >
              View Route Calendar
            </Link>
          </div>
        </div>

        {/* 2-Column Grid: Today's Session & Active Group Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Cooking Session Card */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-emerald-600 dark:text-emerald-400">
                  Daily Appointment
                </span>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">Today's Cooking Session</h2>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                {todaySession?.status || 'SCHEDULED'}
              </span>
            </div>

            {todaySession ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <div className="flex items-center gap-4 md:col-span-2">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xl text-emerald-600 border border-slate-200 dark:border-slate-700">
                    👨‍🍳
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                      {todaySession.cook_name || 'Ramesh Kumar'}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                      <Clock className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{todaySession.time_slot || '07:00 PM – 07:45 PM'}</span>
                      <span>·</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">{todaySession.meal_type || 'Dinner'}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Tower A · Dedicated slot (Phulkas, Dal Tadka, Paneer Bhurji)
                    </p>
                  </div>
                </div>

                {/* OTP Box for Resident Verification */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Session Verification OTP</span>
                  <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-widest my-1">
                    {todaySession.otp_code || '4829'}
                  </div>
                  <p className="text-[10px] text-slate-500">Share with cook upon kitchen arrival</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs">
                No active cooking appointment scheduled for today. Check your group status below.
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Backup Cook Guarantee: On Standby</span>
              </div>
              <button
                type="button"
                onClick={() => setReviewModal({ id: 1, cook_id: todaySession?.cook_id || 3 })}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                <Star className="w-3.5 h-3.5 fill-emerald-600" />
                Rate Previous Cook
              </button>
            </div>
          </div>

          {/* Active Cluster Savings Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase text-emerald-600 dark:text-emerald-400">
                Community Benefits
              </span>
              <h2 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">Your Group Savings</h2>
              <div className="mt-4 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                <span className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold">
                  {activeGroup?.name || 'Sunrise Towers Dinner Club'}
                </span>
                <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 my-1">
                  ₹4,200<span className="text-xs font-medium text-slate-500">/mo</span>
                </div>
                <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                  🎉 Saving ₹800/mo vs individual solo cook (₹5,000)
                </div>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Participating Flats</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {activeGroup?.current_members || 4} / {activeGroup?.max_members || 5} Flats
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-600 h-full w-4/5 rounded-full" />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                1 more flat needed to unlock ₹4,000/mo tier (-₹1,000 discount)!
              </p>
            </div>

            <Link
              to={`/groups/${activeGroup?.id || 1}`}
              className="w-full py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs text-center transition-colors"
            >
              Manage Group & Roster
            </Link>
          </div>
        </div>

        {/* 7-Day Interactive Meal Planner */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase text-emerald-600 dark:text-emerald-400">
                Weekly Preferences
              </span>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">7-Day Kitchen Meal Plan</h2>
            </div>
            <span className="text-xs text-slate-400 font-semibold">Shared directly with your cook</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {[
              { day: 'Mon', meal: 'Paneer Bhurji & Phulkas', spice: 'Medium', type: 'Veg' },
              { day: 'Tue', meal: 'Dal Makhani & Jeera Rice', spice: 'Mild', type: 'Veg' },
              { day: 'Wed', meal: 'Chicken Curry / Tofu', spice: 'Spicy', type: 'Non-Veg' },
              { day: 'Thu', meal: 'Aloo Gobi & Fresh Rotis', spice: 'Medium', type: 'Veg' },
              { day: 'Fri', meal: 'Chole Bhature / Kulcha', spice: 'Medium', type: 'Veg' },
              { day: 'Sat', meal: 'Vegetable Biryani & Raita', spice: 'Spicy', type: 'Veg' },
              { day: 'Sun', meal: 'Special Kadhai Curry', spice: 'Mild', type: 'Veg' }
            ].map((plan) => (
              <div
                key={plan.day}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2 hover:border-emerald-500 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-slate-900 dark:text-white">{plan.day}</span>
                  <span
                    className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md ${
                      plan.type === 'Veg' ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300' : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {plan.type}
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-tight">
                  {plan.meal}
                </p>
                <div className="text-[10px] text-slate-400 font-semibold">Spice: {plan.spice}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // COOK DASHBOARD VIEW
  // -------------------------------------------------------------
  if (user?.role === 'COOK') {
    const todayAppointments = [
      { id: 101, time: '07:00 AM – 07:45 AM', flat: 'Tower A · Flat 101', meal: 'Breakfast', status: 'COMPLETED' },
      { id: 102, time: '08:00 AM – 08:45 AM', flat: 'Tower A · Flat 204', meal: 'Breakfast', status: 'IN_PROGRESS' },
      { id: 103, time: '12:30 PM – 01:15 PM', flat: 'Tower A · Flat 302', meal: 'Lunch', status: 'SCHEDULED' },
      { id: 104, time: '07:30 PM – 08:15 PM', flat: 'Tower A · Flat 401', meal: 'Dinner', status: 'SCHEDULED' },
      { id: 105, time: '08:30 PM – 09:15 PM', flat: 'Tower A · Flat 505', meal: 'Dinner', status: 'SCHEDULED' }
    ];

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Cook Hero */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl border border-slate-800">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 text-xs font-bold mb-2">
              <UserCheck className="w-3.5 h-3.5" />
              Verified Professional Cook · Greenwood Heights
            </div>
            <h1 className="text-2xl sm:text-3xl font-black">Hello, Chef {user.name}!</h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-xl">
              You have 5 household appointments today, all concentrated inside Tower A with zero commute travel.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowLeaveModal(true)}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-colors"
            >
              Apply for Leave
            </button>
          </div>
        </div>

        {/* Cook Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-[10px] font-bold uppercase text-slate-400">Total Monthly Payout</span>
            <div className="text-2xl font-black text-emerald-600 mt-1">₹24,500</div>
            <p className="text-[10px] text-slate-500 mt-1">Direct Bank Deposit (1st of month)</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-[10px] font-bold uppercase text-slate-400">Active Cluster Flats</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">5 Flats</div>
            <p className="text-[10px] text-slate-500 mt-1">Tower A (100% same society)</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-[10px] font-bold uppercase text-slate-400">Reliability Score</span>
            <div className="text-2xl font-black text-emerald-600 mt-1">4.92 ★</div>
            <p className="text-[10px] text-slate-500 mt-1">98.5% Punctuality on OTPs</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-[10px] font-bold uppercase text-slate-400">Commute Time Saved</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">3.5 Hrs/Day</div>
            <p className="text-[10px] text-slate-500 mt-1">Zero auto/bus travel between flats</p>
          </div>
        </div>

        {/* Today's Route Schedule & Flat OTP Check-in */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase text-emerald-600 dark:text-emerald-400">
                Route Execution
              </span>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">Today's Flat-by-Flat Schedule</h2>
            </div>
            <span className="text-xs text-slate-400 font-semibold">15-minute elevator buffers included</span>
          </div>

          <div className="space-y-3">
            {todayAppointments.map((apt) => (
              <div
                key={apt.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-xs">
                    {apt.meal[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">{apt.flat}</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {apt.meal}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-600" />
                      {apt.time}
                    </p>
                  </div>
                </div>

                {/* Actions / OTP Check-in */}
                <div className="flex items-center gap-2">
                  {apt.status === 'COMPLETED' ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                      <CheckCircle2 className="w-4 h-4" /> Completed
                    </span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        maxLength="4"
                        placeholder="Flat OTP"
                        value={selectedSessionId === apt.id ? otpInput : ''}
                        onChange={(e) => {
                          setSelectedSessionId(apt.id);
                          setOtpInput(e.target.value);
                        }}
                        className="w-24 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-center tracking-widest focus:ring-2 focus:ring-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleAttendance(apt.id, apt.status === 'IN_PROGRESS' ? 'CHECK_OUT' : 'CHECK_IN')}
                        className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                      >
                        {apt.status === 'IN_PROGRESS' ? 'Check Out' : 'Check In'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Leave Application Modal */}
        {showLeaveModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Apply for Leave</h3>
                <button type="button" onClick={() => setShowLeaveModal(false)}>
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleApplyLeave} className="space-y-4 text-xs font-semibold">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={leaveStart}
                    onChange={(e) => setLeaveStart(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={leaveEnd}
                    onChange={(e) => setLeaveEnd(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Reason</label>
                  <input
                    type="text"
                    required
                    value={leaveReason}
                    onChange={(e) => setLeaveReason(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    placeholder="e.g. Village function or health rest"
                  />
                </div>

                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-800 dark:text-emerald-300 text-[11px] leading-relaxed">
                  ✓ SocietyCook automated backup cook will be dispatched for your flats. No salary penalty on approved leaves.
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md"
                >
                  Submit Leave Request
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // SOCIETY MANAGER DASHBOARD VIEW
  // -------------------------------------------------------------
  if (user?.role === 'SOCIETY_MANAGER') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl border border-slate-800">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 text-xs font-bold mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              Society RWA & Security Operations Desk
            </div>
            <h1 className="text-2xl sm:text-3xl font-black">Greenwood Heights Campus Control</h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-xl">
              Monitor verified domestic cook entries, gate clearance passes, and building-level meal demand clusters.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-4 py-2 rounded-xl bg-emerald-600/20 text-emerald-400 font-bold text-xs border border-emerald-500/30">
              Gate Clearance Sync Active
            </span>
          </div>
        </div>

        {/* Manager KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-[10px] font-bold uppercase text-slate-400">Total Active Cooks</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">8 Cooks</div>
            <p className="text-[10px] text-slate-500 mt-1">100% Police Verified & Cleared</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-[10px] font-bold uppercase text-slate-400">Participating Flats</span>
            <div className="text-2xl font-black text-emerald-600 mt-1">36 Flats</div>
            <p className="text-[10px] text-slate-500 mt-1">Across Towers A, B, and C</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-[10px] font-bold uppercase text-slate-400">Society Gate Passes</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">#SC-8942</div>
            <p className="text-[10px] text-slate-500 mt-1">Live QR Scan verification</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-[10px] font-bold uppercase text-slate-400">Traffic Congestion</span>
            <div className="text-2xl font-black text-emerald-600 mt-1">-68%</div>
            <p className="text-[10px] text-slate-500 mt-1">Fewer external visitors at gate</p>
          </div>
        </div>

        {/* Verified Cook Roster & Gate Pass Status */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="text-lg font-black text-slate-900 dark:text-white">Active Cook Campus Clearances</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-bold uppercase">
                <tr>
                  <th className="p-3">Cook Name</th>
                  <th className="p-3">Assigned Tower</th>
                  <th className="p-3">Govt ID & Background</th>
                  <th className="p-3">Gate Pass Code</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.cooks.map((c) => (
                  <tr key={c.id}>
                    <td className="p-3 font-bold text-slate-900 dark:text-white">{c.name}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-300">Tower A & B</td>
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Aadhaar + Police Cleared
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                      PASS-SC-{c.id + 100}
                    </td>
                    <td className="p-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        CLEARED
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

  // -------------------------------------------------------------
  // PLATFORM ADMIN DASHBOARD VIEW
  // -------------------------------------------------------------
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl border border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Superadmin Operations & Workforce Dispatcher
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">SocietyCook Operational Control</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-xl">
            Real-time multi-society workforce allocation, automated leave backups, and statistical demand forecasting.
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            to="/analytics"
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md"
          >
            Forecasting & Analytics
          </Link>
        </div>
      </div>

      {/* Admin Operations KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-slate-400">Total Society GMV</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">₹4,20,000</div>
          <p className="text-[10px] text-slate-500 mt-1">Monthly recurring subscription volume</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-slate-400">Platform Commission (10%)</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">₹42,000</div>
          <p className="text-[10px] text-slate-500 mt-1">Net platform revenue</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-slate-400">Active Groups</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">{data.groups.length} Clusters</div>
          <p className="text-[10px] text-slate-500 mt-1">Across 3 residential societies</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-slate-400">Pending Leaves</span>
          <div className="text-2xl font-black text-amber-500 mt-1">{data.leaves.length} Pending</div>
          <p className="text-[10px] text-slate-500 mt-1">Automated backup cook ready</p>
        </div>
      </div>

      {/* Leave Dispatcher & Automated Backup Allocation */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase text-amber-500">Service Reliability</span>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              Cook Leaves & Automated Backup Dispatcher
            </h2>
          </div>
        </div>

        {data.leaves.length > 0 ? (
          <div className="space-y-3">
            {data.leaves.map((l) => (
              <div
                key={l.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                      Cook: {l.cook_name || 'Lakshmi Devi'}
                    </h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      {l.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Dates: {l.start_date?.slice(0, 10)} to {l.end_date?.slice(0, 10)} · Reason: {l.reason}
                  </p>
                  <p className="text-[11px] text-emerald-600 font-bold mt-1">
                    ✓ Recommended Backup Cook: Chef Ramesh Kumar (Match Score: 95%, Free Slot available)
                  </p>
                </div>

                {l.status === 'PENDING' && (
                  <button
                    type="button"
                    onClick={() => handleApproveLeave(l.id)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                  >
                    Approve & Dispatch Backup
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-4">No active leaves pending approval.</p>
        )}
      </div>

      {/* Review Modal */}
      {reviewModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Rate Cook Service</h3>
              <button type="button" onClick={() => setReviewModal(null)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-2">Cooking Quality & Hygiene</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-700'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Feedback / Notes</label>
                <textarea
                  rows="3"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="e.g. Delicious soft rotis and very punctual arrival!"
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <button
                type="button"
                onClick={submitReview}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md"
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
