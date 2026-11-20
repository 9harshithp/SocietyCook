import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Users,
  Share2,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Star,
  ChefHat,
  Award,
  DollarSign,
  TrendingUp,
  MapPin,
  CalendarCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { trackSubscriptionActivated } from '../services/analytics';

export function GroupDetailsPage() {
  const { id } = useParams();
  const { user, showToast } = useAuth();
  const [group, setGroup] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadGroupDetails = async () => {
    try {
      setLoading(true);
      const [grpRes, recsRes] = await Promise.all([
        api.getGroup(id),
        api.getGroupRecommendations(id).catch(() => null)
      ]);
      
      const rawGroup = grpRes?.group || grpRes || {};
      const normalizedGroup = {
        ...rawGroup,
        members: grpRes?.members || rawGroup.members || [],
        pricing: grpRes?.pricing || rawGroup.pricing || null,
        isMember: grpRes?.isMember ?? rawGroup.isMember ?? false,
        activationThresholdMet: grpRes?.activationThresholdMet ?? rawGroup.activationThresholdMet ?? false
      };
      setGroup(normalizedGroup);

      const recList = Array.isArray(recsRes)
        ? recsRes
        : (recsRes?.rankedMatches || (recsRes?.topMatch ? [recsRes.topMatch] : []));
      setRecommendations(recList);
    } catch (err) {
      console.error('Failed to load group details:', err);
      showToast('Failed to load group details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroupDetails();
  }, [id]);

  const handleProposeCook = async (cookId) => {
    try {
      setActionLoading(true);
      await api.proposeCookForGroup(id, cookId);
      showToast('Assigned verified cook to cluster!');
      loadGroupDetails();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivateGroup = async () => {
    try {
      setActionLoading(true);
      await api.activateGroup(id);
      trackSubscriptionActivated({ subscriptionId: id, planTier: 'COMMUNITY_GROUP' });
      showToast('Group activated! Schedules and daily sessions generated.');
      loadGroupDetails();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const copyInviteLink = () => {
    const inviteUrl = `${window.location.origin}/groups/${id}?invite=true`;
    navigator.clipboard.writeText(inviteUrl);
    showToast('Invitation link copied to clipboard!');
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(
      `Hey neighbour! Join our ${group?.name || 'SocietyCook cluster'} to get delicious daily home cooking in your kitchen at a group discount: ${window.location.origin}/groups/${id}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  if (loading || !group) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500 font-bold text-sm">
          <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          Loading cluster details...
        </div>
      </div>
    );
  }

  const status = group?.status || 'RECRUITING';
  const statusLabel = status.replace(/_/g, ' ');
  const mealService = group?.meal_service || 'DINNER';
  const groupName = group?.name || 'Cook Hiring Cluster';
  const description = group?.description || 'Tower cluster for concentrated daily cooking.';
  const members = group?.members || [];
  const currentCount = members.length || group?.current_households || group?.current_members || 0;
  const minCount = group?.min_households || group?.min_members || 3;
  const maxCount = group?.max_households || group?.max_members || 5;
  const pricePerFlat = group?.pricing?.pricePerHousehold || group?.monthly_budget_max || group?.budget_per_household || 4200;
  const totalSavings = group?.pricing?.totalGroupSavings || (5000 - pricePerFlat) * currentCount;
  const cuisines = group?.preferred_cuisines || group?.cuisine_preferences || 'North Indian';
  const diet = group?.dietary_pref || group?.dietary_requirements || 'Vegetarian';
  const assignedCookName = group?.cook_name || group?.assigned_cook_name;
  const assignedCookId = group?.assigned_cook_id;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Back button */}
      <div>
        <Link
          to="/groups"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-emerald-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Society Groups
        </Link>
      </div>

      {/* Main Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 dark:border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {mealService}
              </span>
              <span
                className={`text-[10px] font-extrabold px-3 py-1 rounded-full ${
                  status === 'ACTIVE'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                }`}
              >
                {statusLabel}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {groupName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
              {description}
            </p>
          </div>

          {/* Social Share Buttons */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={copyInviteLink}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              Copy Link
            </button>
            <button
              type="button"
              onClick={shareWhatsApp}
              className="px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-green-600/20 transition-transform active:scale-95 cursor-pointer"
            >
              WhatsApp Invite
            </button>
          </div>
        </div>

        {/* Cluster Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-bold uppercase text-slate-400">Monthly Per Flat</span>
            <div className="text-xl font-black text-emerald-600 mt-0.5">
              ₹{pricePerFlat.toLocaleString('en-IN')}
            </div>
            <p className="text-[10px] text-slate-500 mt-1">vs ₹5,000 solo price</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-bold uppercase text-slate-400">Total Group Savings</span>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
              ₹{totalSavings.toLocaleString('en-IN')}/mo
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Collective community benefit</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-bold uppercase text-slate-400">Cuisines</span>
            <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 truncate">
              {cuisines}
            </div>
            <p className="text-[10px] text-slate-500 mt-1">{diet}</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-bold uppercase text-slate-400">Assigned Cook</span>
            <div className="text-sm font-bold text-emerald-600 mt-0.5 truncate">
              {assignedCookName || 'Matching Best Cook'}
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              {assignedCookId ? 'Confirmed & Active' : 'Pending Selection'}
            </p>
          </div>
        </div>

        {/* Group Activation Bar (If ready) */}
        {status !== 'ACTIVE' && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h4 className="font-extrabold text-xs text-emerald-900 dark:text-emerald-200">
                Ready for Activation
              </h4>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                {currentCount >= minCount
                  ? 'Threshold reached! Activate to generate non-overlapping cooking slots and start daily service.'
                  : `Need ${minCount - currentCount} more flats to hit minimum activation threshold.`}
              </p>
            </div>
            <button
              type="button"
              disabled={actionLoading || currentCount < minCount}
              onClick={handleActivateGroup}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/30 disabled:opacity-50 transition-transform active:scale-95 cursor-pointer"
            >
              {actionLoading ? 'Activating...' : 'Activate Group Now'}
            </button>
          </div>
        )}
      </div>

      {/* 2-Column: Member Roster & Smart Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Member Roster */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase text-slate-400">Demand Aggregation</span>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Participating Households ({currentCount} / {maxCount})
              </h3>
            </div>
          </div>

          <div className="space-y-3">
            {members.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                No members joined yet. Invite neighbours to join!
              </p>
            ) : (
              members.map((m, idx) => {
                const memberName = m.resident_name || m.name || `Resident ${idx + 1}`;
                const memberFlat = m.flat_number || m.flat || 'A-101';
                const memberSlot = m.preferred_slot || (m.preferred_slot_start ? `${m.preferred_slot_start.slice(0, 5)} PM` : 'Dedicated Slot');

                return (
                  <div
                    key={m.id || idx}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-xs">
                        {idx + 1}
                      </div>
                      <div>
                        <h5 className="font-extrabold text-xs text-slate-900 dark:text-white">{memberName}</h5>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {memberFlat.includes('Tower') ? memberFlat : `Tower A · Flat ${memberFlat}`}
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                      {memberSlot}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Smart Cook Recommendations (7-factor algorithm) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> 7-Factor Weighted Matching
            </span>
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Recommended Professional Cooks
            </h3>
          </div>

          {recommendations.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              No cooks matched yet. Society verified cooks will appear here.
            </p>
          ) : (
            <div className="space-y-3">
              {recommendations.map((rec, rIdx) => {
                const cId = rec.cook_id || rec.cookId || rec.cook?.id;
                const cName = rec.cook_name || rec.name || rec.cook?.name || 'Professional Chef';
                const cRating = rec.rating || rec.cook?.rating_avg || 4.9;
                const cExp = rec.experience_years || rec.cook?.experience || 8;
                const cScore = rec.match_score || rec.matchPercentage || 95;
                const reasons = rec.match_reasons || rec.explanations || ['Verified background', 'Matches cuisine preferences'];

                return (
                  <div
                    key={cId || rIdx}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">{cName}</h4>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                          <span className="font-bold text-amber-500">★ {cRating}</span>
                          <span>·</span>
                          <span>{cExp} yrs exp</span>
                          <span>·</span>
                          <span className="text-emerald-600 font-bold">Verified</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-black text-xs">
                          {cScore}% Match
                        </span>
                      </div>
                    </div>

                    {/* Explainable match reasons */}
                    <div className="text-[11px] text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="font-bold text-slate-800 dark:text-slate-200">Why matched: </span>
                      {reasons.slice(0, 3).join('; ')}
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        disabled={actionLoading || assignedCookId === cId}
                        onClick={() => handleProposeCook(cId)}
                        className="px-4 py-1.5 rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 hover:bg-emerald-600 dark:hover:bg-emerald-500 dark:hover:text-white font-bold text-xs transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {assignedCookId === cId ? 'Assigned' : 'Propose Cook'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
