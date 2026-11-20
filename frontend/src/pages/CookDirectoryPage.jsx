import React, { useState, useEffect } from 'react';
import {
  ChefHat,
  Search,
  Star,
  ShieldCheck,
  Award,
  Clock,
  MapPin,
  CheckCircle2,
  Filter,
  X,
  Droplets,
  Layers,
  UtensilsCrossed,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export function CookDirectoryPage() {
  const { activeSocietyId, showToast } = useAuth();
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [serviceTypeFilter, setServiceTypeFilter] = useState('ALL'); // ALL | COOK | DISHWASHER | MULTI_SKILLED
  const [selectedCuisine, setSelectedCuisine] = useState('ALL');
  const [selectedPro, setSelectedPro] = useState(null);

  const loadProfessionals = async () => {
    try {
      setLoading(true);
      const data = await api.getCooks(activeSocietyId);
      setProfessionals(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfessionals();
  }, [activeSocietyId]);

  const filteredList = professionals.filter((p) => {
    if (search && !p.name?.toLowerCase().includes(search.toLowerCase())) return false;
    
    // Service filter
    if (serviceTypeFilter !== 'ALL') {
      const type = p.professional_type || 'COOK';
      if (serviceTypeFilter === 'COOK' && type !== 'COOK' && type !== 'MULTI_SKILLED') return false;
      if (serviceTypeFilter === 'DISHWASHER' && type !== 'DISHWASHER' && type !== 'MULTI_SKILLED') return false;
      if (serviceTypeFilter === 'MULTI_SKILLED' && type !== 'MULTI_SKILLED') return false;
    }

    // Cuisine filter
    if (selectedCuisine !== 'ALL') {
      const matchCuisine = (p.cuisines || '').toLowerCase().includes(selectedCuisine.toLowerCase());
      if (!matchCuisine) return false;
    }

    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#153D32]/10 dark:bg-white/10 text-[#153D32] dark:text-[#E9A15B] text-xs font-bold mb-2">
          <ChefHat className="w-3.5 h-3.5" />
          Society Professional Staff
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-black text-[#153D32] dark:text-white">
          Verified Cooks & Utensil Care Specialists
        </h1>
        <p className="text-[#64746B] dark:text-slate-400 text-xs sm:text-sm mt-1 max-w-xl">
          Every professional in your society roster is background verified, police cleared, hygiene certified, and holds active society gate authorization.
        </p>
      </div>

      {/* Service Type Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: 'ALL', label: 'All Professionals', icon: Sparkles },
          { id: 'COOK', label: 'Home Cooks', icon: UtensilsCrossed },
          { id: 'DISHWASHER', label: 'Utensil Care Specialists', icon: Droplets },
          { id: 'MULTI_SKILLED', label: 'Multi-Skilled (Cook + Wash)', icon: Layers }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = serviceTypeFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setServiceTypeFilter(tab.id)}
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

      {/* Search & Cuisines Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-[#DDE9D8] dark:border-white/10 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search professional by name..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#DDE9D8] dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#153D32]"
          />
        </div>

        {serviceTypeFilter !== 'DISHWASHER' && (
          <div className="flex flex-wrap items-center gap-2">
            {['ALL', 'North Indian', 'South Indian', 'Mughlai', 'Gujarati', 'Bengali'].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setSelectedCuisine(c)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedCuisine === c
                    ? 'bg-[#153D32] text-white'
                    : 'bg-[#FBF7EF] dark:bg-slate-800 text-[#64746B] dark:text-slate-300 hover:bg-[#DDE9D8]/40'
                }`}
              >
                {c === 'ALL' ? 'All Cuisines' : c}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Professionals Grid */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 text-xs">Loading verified professionals...</div>
      ) : filteredList.length === 0 ? (
        <div className="text-center py-16 text-slate-400 text-xs">No professionals matched your search criteria.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredList.map((pro) => {
            const isDishwasher = pro.professional_type === 'DISHWASHER';
            const isMulti = pro.professional_type === 'MULTI_SKILLED';

            return (
              <div
                key={pro.id}
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-[#DDE9D8] dark:border-white/10 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow group"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#153D32] to-[#1E5747] text-[#E9A15B] flex items-center justify-center text-lg font-bold border border-[#E9A15B]/30 shadow-xs">
                        {pro.name?.[0] || 'P'}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm text-[#202A25] dark:text-white truncate max-w-[130px]">
                          {pro.name}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-amber-500 font-bold mt-0.5">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>{pro.rating || 4.8}</span>
                          <span className="text-slate-400 font-normal">({pro.total_reviews || 22})</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Role Badge */}
                  <div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      isMulti ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300' :
                      isDishwasher ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                      'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}>
                      {isMulti ? <Layers className="w-3 h-3" /> : isDishwasher ? <Droplets className="w-3 h-3" /> : <ChefHat className="w-3 h-3" />}
                      {isMulti ? 'Multi-Skilled (Cook + Wash)' : isDishwasher ? 'Utensil Care Specialist' : 'Home Cook'}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-[#64746B] dark:text-slate-400">
                      <span>Experience</span>
                      <span className="font-bold text-[#202A25] dark:text-slate-200">
                        {pro.experience_years || 6} Years
                      </span>
                    </div>
                    <div className="flex justify-between text-[#64746B] dark:text-slate-400">
                      <span>Verification</span>
                      <span className="font-bold text-[#153D32] dark:text-emerald-400 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" /> Police Cleared
                      </span>
                    </div>

                    {!isDishwasher && (
                      <div className="flex justify-between text-[#64746B] dark:text-slate-400">
                        <span>Cuisines</span>
                        <span className="font-bold text-[#202A25] dark:text-slate-200 truncate max-w-[120px]">
                          {pro.cuisines || 'North, Homestyle'}
                        </span>
                      </div>
                    )}

                    {(isDishwasher || isMulti) && (
                      <div className="flex justify-between text-[#64746B] dark:text-slate-400">
                        <span>Utensil Tier</span>
                        <span className="font-bold text-[#964208] dark:text-[#E9A15B]">
                          {pro.utensil_capacity_tier || 'HEAVY'} Load
                        </span>
                      </div>
                    )}
                  </div>

                  <p className="text-[11px] text-[#64746B] dark:text-slate-400 line-clamp-2">
                    {pro.bio || (isDishwasher ? 'Specializes in heavy kadhais, pressure cookers, and meticulous sink counter hygiene.' : 'Experienced in traditional home cooking, fluffy phulkas, and healthy regional meals.')}
                  </p>
                </div>

                <div className="pt-4 border-t border-[#DDE9D8]/80 dark:border-white/10 mt-6">
                  <button
                    type="button"
                    onClick={() => setSelectedPro(pro)}
                    className="w-full py-2.5 rounded-xl bg-[#FBF7EF] hover:bg-[#DDE9D8]/40 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#202A25] dark:text-slate-200 font-bold text-xs text-center transition-colors cursor-pointer"
                  >
                    View Profile & Badges
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detailed Profile Modal */}
      {selectedPro && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-[#DDE9D8] dark:border-white/10 shadow-2xl space-y-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#153D32] to-[#1E5747] text-[#E9A15B] flex items-center justify-center text-xl font-bold border border-[#E9A15B]/30">
                  {selectedPro.name?.[0] || 'P'}
                </div>
                <div>
                  <h3 className="font-black text-lg text-[#202A25] dark:text-white">
                    {selectedPro.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-amber-500 font-bold mt-0.5">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>{selectedPro.rating || 4.85}</span>
                    <span className="text-slate-400 font-normal">· {selectedPro.experience_years || 6} yrs exp</span>
                  </div>
                </div>
              </div>
              <button type="button" onClick={() => setSelectedPro(null)} className="cursor-pointer">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#153D32]/10 dark:bg-white/5 rounded-2xl border border-[#153D32]/20 dark:border-white/10 space-y-2">
                <div className="font-extrabold text-[#153D32] dark:text-[#E9A15B] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#153D32] dark:text-[#E9A15B]" />
                  Verified Society Credentials
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-[#202A25] dark:text-slate-300">
                  <div>✓ Government ID Verified</div>
                  <div>✓ Police Record Cleared</div>
                  <div>✓ Hygiene Training Done</div>
                  <div>✓ Society RFID Pass Active</div>
                </div>
              </div>

              <div>
                <h5 className="font-bold text-[#202A25] dark:text-slate-200 mb-1">Services Offered</h5>
                <p className="text-[#64746B] dark:text-slate-400 text-xs">
                  {selectedPro.services_offered || (selectedPro.professional_type === 'DISHWASHER' ? 'Utensil Washing, Sink Sanitization, Counter Clean' : 'Homestyle Cooking, Menu Planning, Utensil Care')}
                </p>
              </div>

              <div>
                <h5 className="font-bold text-[#202A25] dark:text-slate-200 mb-1">Professional Bio</h5>
                <p className="text-[#64746B] dark:text-slate-400 text-xs leading-relaxed">
                  {selectedPro.bio || 'Meticulous, punctual, and reliable domestic specialist trusted by multiple households in this complex.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                showToast(`Professional ${selectedPro.name} requested for your tower group assignment.`);
                setSelectedPro(null);
              }}
              className="w-full py-3 rounded-xl bg-[#153D32] hover:bg-[#1E5747] text-white font-bold text-xs shadow-md shadow-[#153D32]/20 cursor-pointer"
            >
              Request for Group Assignment
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
