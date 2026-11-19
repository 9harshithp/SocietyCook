import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Plus,
  Search,
  Filter,
  Sparkles,
  ArrowRight,
  Clock,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  X,
  Share2,
  UtensilsCrossed,
  Droplets,
  Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export function GroupHub() {
  const { user, activeSocietyId, showToast } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterService, setFilterService] = useState('ALL');
  const [filterMeal, setFilterMeal] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Modal create group state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [serviceType, setServiceType] = useState('COOKING');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [mealService, setMealService] = useState('DINNER');
  const [utensilLoad, setUtensilLoad] = useState('STANDARD');
  const [cuisinePreferences, setCuisinePreferences] = useState('North Indian, Homestyle');
  const [dietaryRequirements, setDietaryRequirements] = useState('VEGETARIAN');
  const [preferredSlot, setPreferredSlot] = useState('19:30-20:15');
  const [maxMembers, setMaxMembers] = useState(5);
  const [budget, setBudget] = useState(4500);

  // Join group state
  const [showJoinModal, setShowJoinModal] = useState(null);
  const [joinSlot, setJoinSlot] = useState('19:30-20:15');

  const loadGroups = async () => {
    try {
      setLoading(true);
      const data = await api.getGroups(activeSocietyId);
      setGroups(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, [activeSocietyId]);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      await api.createGroup({
        society_id: activeSocietyId,
        service_type: serviceType,
        utensil_load: utensilLoad,
        name,
        description,
        meal_service: mealService,
        cuisine_preferences: cuisinePreferences,
        dietary_requirements: dietaryRequirements,
        preferred_slot: preferredSlot,
        min_members: 3,
        max_members: Number(maxMembers),
        budget_per_household: Number(budget)
      });
      showToast('Group created! Invite neighbours to reach the discount threshold.');
      setShowCreateModal(false);
      loadGroups();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleJoinGroup = async (groupId) => {
    try {
      await api.joinGroup(groupId, {
        preferred_slot: joinSlot,
        dietary_preferences: 'Homestyle Veg'
      });
      showToast('Successfully joined community group!');
      setShowJoinModal(null);
      loadGroups();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const filteredGroups = groups.filter((g) => {
    if (filterService !== 'ALL') {
      const type = g.service_type || 'COOKING';
      if (type !== filterService) return false;
    }
    if (filterMeal !== 'ALL' && g.meal_service !== filterMeal) return false;
    if (filterStatus !== 'ALL' && g.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#153D32]/10 dark:bg-white/10 text-[#153D32] dark:text-[#E9A15B] text-xs font-bold mb-2">
            <Users className="w-3.5 h-3.5" />
            Tower Community Clusters
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-black text-[#153D32] dark:text-white">
            Community Service Groups
          </h1>
          <p className="text-[#64746B] dark:text-slate-400 text-xs sm:text-sm mt-1 max-w-xl">
            Pool your household demand with neighbours in your tower to unlock up to 35% monthly savings for cooking, utensil care, and full kitchen maintenance.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3 rounded-2xl bg-[#153D32] hover:bg-[#1E5747] text-white font-bold text-xs shadow-lg shadow-[#153D32]/20 flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4 text-[#E9A15B]" />
          Create New Group
        </button>
      </div>

      {/* Service Type Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: 'ALL', label: 'All Services', icon: Sparkles },
          { id: 'COOKING', label: 'Home Cooking', icon: UtensilsCrossed },
          { id: 'DISHWASHING', label: 'Utensil Care & Dishwashing', icon: Droplets },
          { id: 'COMBO', label: 'Complete Kitchen Care (Combo)', icon: Layers }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = filterService === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterService(tab.id)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold inline-flex items-center gap-2 border transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#153D32] text-white border-[#153D32] shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-[#202A25] dark:text-slate-300 border-[#DDE9D8] dark:border-white/10 hover:border-[#153D32]/40'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#E9A15B]' : 'text-[#64746B]'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Secondary Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-[#DDE9D8] dark:border-white/10 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-400 mr-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Meal:
          </span>
          {['ALL', 'BREAKFAST', 'LUNCH', 'DINNER', 'MULTIPLE'].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setFilterMeal(m)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterMeal === m
                  ? 'bg-[#153D32] text-white'
                  : 'bg-[#FBF7EF] dark:bg-slate-800 text-[#64746B] dark:text-slate-300 hover:bg-[#DDE9D8]/40'
              }`}
            >
              {m === 'ALL' ? 'All Schedules' : m}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 mr-2">Status:</span>
          {['ALL', 'RECRUITING', 'THRESHOLD_REACHED', 'ACTIVE'].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterStatus === s
                  ? 'bg-[#153D32] text-white'
                  : 'bg-[#FBF7EF] dark:bg-slate-800 text-[#64746B] dark:text-slate-300 hover:bg-[#DDE9D8]/40'
              }`}
            >
              {s === 'ALL' ? 'All Status' : s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Group Cards Grid */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 text-xs">Loading society groups...</div>
      ) : filteredGroups.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-[#DDE9D8] dark:border-white/10 p-8">
          <Users className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="font-bold text-base text-[#202A25] dark:text-white">No groups found</h3>
          <p className="text-xs text-[#64746B] mt-1 mb-4">
            Be the pioneer in your tower by creating the first service cluster!
          </p>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2.5 rounded-xl bg-[#153D32] hover:bg-[#1E5747] text-white font-bold text-xs cursor-pointer"
          >
            Create First Group
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGroups.map((g) => {
            const current = g.current_members || 1;
            const max = g.max_members || 5;
            const pct = Math.min(100, Math.round((current / max) * 100));
            const isDishwashing = g.service_type === 'DISHWASHING';
            const isCombo = g.service_type === 'COMBO';

            return (
              <div
                key={g.id}
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-[#DDE9D8] dark:border-white/10 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow group"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                          isCombo ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300' :
                          isDishwashing ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                          'bg-[#153D32]/10 text-[#153D32] dark:bg-white/10 dark:text-[#E9A15B]'
                        }`}>
                          {isCombo ? '✨ Combo Care' : isDishwashing ? '🫧 Utensil Care' : '🍳 Home Cooking'}
                        </span>
                        <span className="text-[10px] font-bold text-[#64746B] dark:text-slate-400">
                          {g.meal_service}
                        </span>
                      </div>
                      <h3 className="font-extrabold text-base text-[#202A25] dark:text-white mt-1.5">
                        {g.name}
                      </h3>
                    </div>
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full shrink-0 ${
                        g.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : g.status === 'THRESHOLD_REACHED'
                          ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {g.status.replace('_', ' ')}
                    </span>
                  </div>

                  <p className="text-xs text-[#64746B] dark:text-slate-400 line-clamp-2">
                    {g.description || 'Tower sharing cluster for dedicated daily in-home services.'}
                  </p>

                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-[#202A25] dark:text-slate-300">
                      <span>Households</span>
                      <span>
                        {current} of {max} Joined
                      </span>
                    </div>
                    <div className="w-full bg-[#FBF7EF] dark:bg-slate-800 h-2.5 rounded-full overflow-hidden border border-[#DDE9D8]/50 dark:border-white/5">
                      <div
                        className="bg-[#153D32] dark:bg-emerald-500 h-full rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Pricing Snapshot */}
                  <div className="p-3.5 rounded-2xl bg-[#FBF7EF] dark:bg-white/5 border border-[#DDE9D8] dark:border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-[#64746B] dark:text-slate-400 block">Est. Monthly / Flat</span>
                      <span className="text-lg font-black text-[#153D32] dark:text-[#E9A15B]">
                        ₹{(g.budget_per_household || 4200).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <span className="text-[10px] font-extrabold text-[#153D32] dark:text-[#E9A15B] bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-[#DDE9D8] dark:border-white/10">
                      Save up to 35%
                    </span>
                  </div>
                </div>

                <div className="pt-6 border-t border-[#DDE9D8]/80 dark:border-white/10 flex items-center justify-between gap-3 mt-6">
                  <Link
                    to={`/groups/${g.id}`}
                    className="flex-1 py-2.5 rounded-xl bg-[#FBF7EF] hover:bg-[#DDE9D8]/50 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#202A25] dark:text-slate-200 font-bold text-xs text-center transition-colors"
                  >
                    View Roster
                  </Link>

                  {g.status === 'RECRUITING' && (
                    <button
                      type="button"
                      onClick={() => setShowJoinModal(g.id)}
                      className="flex-1 py-2.5 rounded-xl bg-[#153D32] hover:bg-[#1E5747] text-white font-bold text-xs text-center shadow-xs transition-transform active:scale-95 cursor-pointer"
                    >
                      Join Group
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-[#DDE9D8] dark:border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg font-black text-[#153D32] dark:text-white">
                Create Community Group
              </h3>
              <button type="button" onClick={() => setShowCreateModal(false)} className="cursor-pointer">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-[#202A25] dark:text-slate-300 mb-1">Service Category</label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#DDE9D8] dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
                >
                  <option value="COOKING">Home Cooking</option>
                  <option value="DISHWASHING">Utensil Care & Dishwashing</option>
                  <option value="COMBO">Complete Kitchen Care (Combo)</option>
                </select>
              </div>

              <div>
                <label className="block text-[#202A25] dark:text-slate-300 mb-1">Group Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Tower B Morning Kitchen Care Club"
                  className="w-full p-3 rounded-xl border border-[#DDE9D8] dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[#202A25] dark:text-slate-300 mb-1">Description</label>
                <textarea
                  rows="2"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Looking for 4 flats in Tower B for healthy homestyle food and sparkling utensils."
                  className="w-full p-3 rounded-xl border border-[#DDE9D8] dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#202A25] dark:text-slate-300 mb-1">Schedule Slot</label>
                  <select
                    value={mealService}
                    onChange={(e) => setMealService(e.target.value)}
                    className="w-full p-3 rounded-xl border border-[#DDE9D8] dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
                  >
                    <option value="BREAKFAST">Breakfast & Morning Prep</option>
                    <option value="LUNCH">Lunch</option>
                    <option value="DINNER">Dinner</option>
                    <option value="MULTIPLE">Morning & Evening</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#202A25] dark:text-slate-300 mb-1">Max Households</label>
                  <input
                    type="number"
                    min="2"
                    max="8"
                    value={maxMembers}
                    onChange={(e) => setMaxMembers(e.target.value)}
                    className="w-full p-3 rounded-xl border border-[#DDE9D8] dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {serviceType !== 'COOKING' && (
                <div>
                  <label className="block text-[#202A25] dark:text-slate-300 mb-1">Utensil Load Tier</label>
                  <select
                    value={utensilLoad}
                    onChange={(e) => setUtensilLoad(e.target.value)}
                    className="w-full p-3 rounded-xl border border-[#DDE9D8] dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
                  >
                    <option value="LIGHT">Light (1-2 persons)</option>
                    <option value="STANDARD">Standard (3-4 persons)</option>
                    <option value="HEAVY">Heavy (5+ persons / Frequent cooking)</option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#202A25] dark:text-slate-300 mb-1">Target Monthly Budget (₹)</label>
                  <input
                    type="number"
                    step="100"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full p-3 rounded-xl border border-[#DDE9D8] dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[#202A25] dark:text-slate-300 mb-1">Dietary Spec</label>
                  <select
                    value={dietaryRequirements}
                    onChange={(e) => setDietaryRequirements(e.target.value)}
                    className="w-full p-3 rounded-xl border border-[#DDE9D8] dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
                  >
                    <option value="VEGETARIAN">Pure Vegetarian</option>
                    <option value="NON_VEGETARIAN">Non-Vegetarian</option>
                    <option value="JAIN">Jain</option>
                    <option value="MIXED">Mixed / Any</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-[#153D32] hover:bg-[#1E5747] text-white font-bold shadow-md shadow-[#153D32]/20 cursor-pointer"
              >
                Create Group & Start Recruiting
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Join Group Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-6 border border-[#DDE9D8] dark:border-white/10 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-base font-bold text-[#153D32] dark:text-white">Join Service Cluster</h3>
              <button type="button" onClick={() => setShowJoinModal(null)} className="cursor-pointer">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-semibold">
              <p className="text-[#64746B] dark:text-slate-400">
                You are joining this community group for recurring in-home services in your flat. Select your preferred daily time slot.
              </p>

              <div>
                <label className="block text-[#202A25] dark:text-slate-300 mb-1">Preferred Time Slot</label>
                <select
                  value={joinSlot}
                  onChange={(e) => setJoinSlot(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#DDE9D8] dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
                >
                  <option value="07:30-08:15">07:30 – 08:15 AM</option>
                  <option value="08:15-09:00">08:15 – 09:00 AM</option>
                  <option value="09:00-09:45">09:00 – 09:45 AM</option>
                  <option value="19:00-19:45">19:00 – 19:45 PM</option>
                  <option value="19:45-20:30">19:45 – 20:30 PM</option>
                  <option value="20:30-21:15">20:30 – 21:15 PM</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => handleJoinGroup(showJoinModal)}
                className="w-full py-3 rounded-xl bg-[#153D32] hover:bg-[#1E5747] text-white font-bold shadow-md shadow-[#153D32]/20 cursor-pointer"
              >
                Confirm Membership
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
