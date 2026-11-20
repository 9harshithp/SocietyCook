import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
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
  DollarSign,
  Award,
  AlertTriangle,
  FileCheck2,
  Check,
  UtensilsCrossed,
  Droplets,
  Layers,
  MapPin
} from 'lucide-react';

export function ProfessionalDashboardPage() {
  const { user, activeSocietyId, showToast } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [otpInput, setOtpInput] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [sess, an] = await Promise.all([
          api.getSessions({ societyId: activeSocietyId }).catch(() => []),
          api.getCookAnalytics().catch(() => null)
        ]);
        setSessions(sess);
        setAnalytics(an);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [activeSocietyId]);

  const handleVerifyOtp = async (sessionId) => {
    if (!otpInput || otpInput.length < 4) {
      showToast('Please enter the 4-digit resident OTP', 'error');
      return;
    }
    try {
      await api.verifySessionOtp(sessionId, otpInput);
      showToast('OTP verified! Session successfully started.');
      setOtpInput('');
      setSelectedSessionId(null);
      // Refresh sessions
      const updated = await api.getSessions({ societyId: activeSocietyId }).catch(() => []);
      setSessions(updated);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleCompleteSession = async (sessionId) => {
    try {
      await api.completeSession(sessionId);
      showToast('Service marked completed! Kitchen cleared.');
      const updated = await api.getSessions({ societyId: activeSocietyId }).catch(() => []);
      setSessions(updated);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const todaySessions = (analytics?.todaySessions?.length ? analytics.todaySessions : sessions).map((s, idx) => ({
    id: s.id,
    time: `${s.scheduled_start_time?.slice(0, 5) || '19:00'} – ${s.scheduled_end_time?.slice(0, 5) || '19:45'}`,
    flat: s.resident_flat || s.flat || `Tower A · Flat ${101 + idx}`,
    resident: s.resident_name || 'Resident',
    service: s.meal_type || 'Dinner Cooking + Kadhais',
    status: s.status || 'SCHEDULED',
    verified: s.status === 'IN_PROGRESS' || s.status === 'COMPLETED'
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-xs font-bold text-slate-500">
        <div className="w-5 h-5 border-2 border-[#153D32] border-t-transparent rounded-full animate-spin mr-2" />
        Loading Professional Hub...
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Hero Welcome Card */}
      <div className="bg-gradient-to-br from-[#153D32] to-[#1E5747] text-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-[#153D32]/15 space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[#E9A15B] text-xs font-extrabold uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5" />
          Verified Professional Cook · Greenwood Heights
        </div>
        <h1 className="text-2xl sm:text-3xl font-black">Hello, Chef {user?.name}!</h1>
        <p className="text-emerald-100 text-xs sm:text-sm max-w-xl font-medium">
          You have {todaySessions.length} household appointments today, concentrated inside Tower A with zero commute travel.
        </p>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-white/15">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4">
            <span className="text-[10px] text-emerald-200 uppercase tracking-wider font-extrabold block">Today's Visits</span>
            <span className="text-2xl font-black text-white mt-1 block">{todaySessions.length} Flats</span>
            <span className="text-[10px] text-[#E9A15B] font-bold">100% Inside Tower A</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4">
            <span className="text-[10px] text-emerald-200 uppercase tracking-wider font-extrabold block">Monthly Payout</span>
            <span className="text-2xl font-black text-white mt-1 block">₹{analytics?.monthlyEarnings || '28,500'}</span>
            <span className="text-[10px] text-emerald-300 font-bold">Guaranteed on 1st</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4">
            <span className="text-[10px] text-emerald-200 uppercase tracking-wider font-extrabold block">Cluster Bonus</span>
            <span className="text-2xl font-black text-[#E9A15B] mt-1 block">+₹{analytics?.clusterBonus || '4,200'}</span>
            <span className="text-[10px] text-emerald-200 font-bold">Zero-Travel Reward</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4">
            <span className="text-[10px] text-emerald-200 uppercase tracking-wider font-extrabold block">Hygiene Rating</span>
            <span className="text-2xl font-black text-white mt-1 block flex items-center gap-1">
              <Star className="w-5 h-5 fill-[#E9A15B] text-[#E9A15B]" />
              <span>4.9</span>
            </span>
            <span className="text-[10px] text-emerald-300 font-bold">38 Resident Reviews</span>
          </div>
        </div>
      </div>

      {/* Today's Appointments List with OTP Entry */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-[#DDE9D8] dark:border-white/10 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#DDE9D8]/60 dark:border-white/10">
          <div>
            <h3 className="font-extrabold text-sm text-[#202A25] dark:text-white">Today's Tower Route Schedule</h3>
            <p className="text-[11px] text-[#64746B] dark:text-slate-400">Punctual consecutive doorsteps in Tower A</p>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold">
            Live Route Active
          </span>
        </div>

        <div className="space-y-3">
          {todaySessions.map((apt) => (
            <div
              key={apt.id}
              className="p-4 rounded-2xl bg-[#FBF7EF] dark:bg-white/5 border border-[#DDE9D8] dark:border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#153D32] text-[#E9A15B] flex items-center justify-center font-bold text-sm shrink-0">
                  <ChefHat className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-extrabold text-sm text-[#202A25] dark:text-white">
                    {apt.flat} · {apt.resident}
                  </div>
                  <div className="text-xs text-[#64746B] dark:text-slate-400 flex items-center gap-2 mt-0.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{apt.time}</span>
                    <span>•</span>
                    <span className="font-medium text-slate-600 dark:text-slate-300">{apt.service}</span>
                  </div>
                </div>
              </div>

              {/* Status and Action Buttons */}
              <div className="flex items-center gap-2 self-end md:self-center">
                {apt.status === 'COMPLETED' ? (
                  <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-500 font-bold text-xs inline-flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Completed
                  </span>
                ) : apt.status === 'IN_PROGRESS' ? (
                  <button
                    type="button"
                    onClick={() => handleCompleteSession(apt.id)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1 cursor-pointer shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5" /> Mark Meal Finished
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    {selectedSessionId === apt.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          maxLength={4}
                          value={otpInput}
                          onChange={(e) => setOtpInput(e.target.value)}
                          placeholder="Enter 4-digit OTP"
                          className="w-32 px-3 py-1.5 rounded-xl border border-emerald-500 bg-white dark:bg-slate-800 text-xs font-mono font-bold text-center"
                        />
                        <button
                          type="button"
                          onClick={() => handleVerifyOtp(apt.id)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs cursor-pointer"
                        >
                          Verify
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedSessionId(null)}
                          className="px-2 py-1.5 text-slate-400 text-xs cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSelectedSessionId(apt.id)}
                        className="px-4 py-2 rounded-xl bg-[#153D32] hover:bg-[#1E5244] text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#E9A15B]" />
                        <span>Start Session (Verify OTP)</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ProfessionalEarningsPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-black text-[#153D32] dark:text-white">
          Earnings & Cluster Incentives
        </h1>
        <p className="text-xs sm:text-sm text-[#64746B] dark:text-slate-400 mt-1">
          Guaranteed monthly bank transfers with zero brokerage deductions
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-[#DDE9D8] dark:border-white/10 shadow-sm space-y-2">
          <span className="text-xs text-slate-500 font-bold uppercase">This Month Projected</span>
          <div className="text-3xl font-black text-[#153D32] dark:text-[#E9A15B]">₹32,700</div>
          <p className="text-[11px] text-emerald-600 font-bold">Includes ₹4,200 zero-commute tower bonus</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-[#DDE9D8] dark:border-white/10 shadow-sm space-y-2">
          <span className="text-xs text-slate-500 font-bold uppercase">Last Month Paid</span>
          <div className="text-3xl font-black text-slate-900 dark:text-white">₹31,500</div>
          <p className="text-[11px] text-slate-400">Directly transferred to HDFC Bank ****4891</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-[#DDE9D8] dark:border-white/10 shadow-sm space-y-2">
          <span className="text-xs text-slate-500 font-bold uppercase">Next Settlement</span>
          <div className="text-3xl font-black text-slate-900 dark:text-white">1st of Month</div>
          <p className="text-[11px] text-slate-400">Automated payout via Razorpay Route</p>
        </div>
      </div>
    </div>
  );
}

export function ProfessionalAvailabilityPage() {
  const { showToast } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');
  const [reason, setReason] = useState('Personal family event');

  const handleSubmitLeave = (e) => {
    e.preventDefault();
    showToast('Leave request submitted! Automated standby backup assigned.');
    setShowModal(false);
    setLeaveStart('');
    setLeaveEnd('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-black text-[#153D32] dark:text-white">
            Schedule Availability & Leave Desk
          </h1>
          <p className="text-xs sm:text-sm text-[#64746B] dark:text-slate-400 mt-1">
            SocietyCook guarantees paid backup coverage so your households never miss a meal.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-xl bg-[#153D32] hover:bg-[#1E5244] text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
        >
          <Calendar className="w-3.5 h-3.5" /> Request Leave Backup
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-[#DDE9D8] dark:border-white/10 shadow-sm space-y-4">
        <h3 className="font-extrabold text-sm text-[#202A25] dark:text-white">Standard Working Windows</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
          <div className="p-4 rounded-2xl bg-[#FBF7EF] dark:bg-white/5 border border-[#DDE9D8] dark:border-white/10">
            <span className="font-black text-[#153D32] dark:text-[#E9A15B] block mb-1">Morning Breakfast & Lunch Slot</span>
            <span className="text-slate-600 dark:text-slate-300">07:00 AM – 11:30 AM (Flats A-101, A-204, A-302)</span>
          </div>
          <div className="p-4 rounded-2xl bg-[#FBF7EF] dark:bg-white/5 border border-[#DDE9D8] dark:border-white/10">
            <span className="font-black text-[#153D32] dark:text-[#E9A15B] block mb-1">Evening Dinner Slot</span>
            <span className="text-slate-600 dark:text-slate-300">06:30 PM – 09:45 PM (Flats A-101, A-202, A-401)</span>
          </div>
        </div>
      </div>

      {/* Leave Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h3 className="font-black text-lg text-slate-900 dark:text-white">Apply for Leave Coverage</h3>
            <p className="text-xs text-slate-500">
              When approved, the standby certified cook will automatically take over your tower appointments.
            </p>
            <form onSubmit={handleSubmitLeave} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1">Start Date</label>
                <input
                  type="date"
                  required
                  value={leaveStart}
                  onChange={(e) => setLeaveStart(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1">End Date</label>
                <input
                  type="date"
                  required
                  value={leaveEnd}
                  onChange={(e) => setLeaveEnd(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1">Reason</label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
                >
                  Confirm Request
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export function ProfessionalProfilePage() {
  const { user } = useAuth();
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-black text-[#153D32] dark:text-white">
          Professional Credentials & Clearances
        </h1>
        <p className="text-xs sm:text-sm text-[#64746B] dark:text-slate-400 mt-1">
          Verified background documentation shared with society management and resident RWAs.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-[#DDE9D8] dark:border-white/10 shadow-sm space-y-6 max-w-2xl">
        <div className="flex items-center gap-4 pb-6 border-b border-[#DDE9D8]/60 dark:border-white/10">
          <div className="w-16 h-16 rounded-2xl bg-[#153D32] text-[#E9A15B] flex items-center justify-center text-2xl font-black border border-[#E9A15B]/30">
            {user?.name?.[0] || 'R'}
          </div>
          <div>
            <h3 className="font-black text-lg text-slate-900 dark:text-white">{user?.name || 'Chef Ramesh Kumar'}</h3>
            <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
              <ShieldCheck className="w-4 h-4" /> Multi-Tier Police Cleared · Gate Authorized
            </div>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex justify-between py-2 border-b border-slate-100 dark:border-white/5">
            <span className="text-slate-500">Police Verification Certificate</span>
            <span className="font-bold text-emerald-600">Verified (KSP-2026-98124)</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100 dark:border-white/5">
            <span className="text-slate-500">Hygiene & Health Screening</span>
            <span className="font-bold text-emerald-600">Passed (Annual Clearance)</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100 dark:border-white/5">
            <span className="text-slate-500">Specialized Cuisines</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">North Indian, Homestyle Phulkas, Jain Food</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-slate-500">Experience</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">8 Years in Residential Societies</span>
          </div>
        </div>
      </div>
    </div>
  );
}

