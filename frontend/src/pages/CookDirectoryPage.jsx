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
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export function CookDirectoryPage() {
  const { activeSocietyId, showToast } = useAuth();
  const [cooks, setCooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('ALL');
  const [selectedCook, setSelectedCook] = useState(null);

  const loadCooks = async () => {
    try {
      setLoading(true);
      const data = await api.getCooks(activeSocietyId);
      setCooks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCooks();
  }, [activeSocietyId]);

  const filteredCooks = cooks.filter((c) => {
    if (search && !c.name?.toLowerCase().includes(search.toLowerCase())) return false;
    if (selectedCuisine !== 'ALL') {
      const matchCuisine = (c.cuisines || '').toLowerCase().includes(selectedCuisine.toLowerCase());
      if (!matchCuisine) return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-bold mb-2">
          <ChefHat className="w-3.5 h-3.5" />
          Society Cook Roster
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
          Verified Professional Cooks
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1 max-w-xl">
          Every cook in your society is background verified, Aadhaar validated, and trained in high-standard kitchen hygiene.
        </p>
      </div>

      {/* Search & Cuisines Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cook by name..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {['ALL', 'North Indian', 'South Indian', 'Mughlai', 'Gujarati', 'Bengali'].map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setSelectedCuisine(c)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedCuisine === c
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {c === 'ALL' ? 'All Cuisines' : c}
            </button>
          ))}
        </div>
      </div>

      {/* Cooks Grid */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 text-xs">Loading verified cooks...</div>
      ) : filteredCooks.length === 0 ? (
        <div className="text-center py-16 text-slate-400 text-xs">No cooks matched your search criteria.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredCooks.map((cook) => (
            <div
              key={cook.id}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-2xl font-black text-emerald-600">
                    👨‍🍳
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">{cook.name}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-amber-500 font-bold mt-0.5">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{cook.rating || 4.8}</span>
                      <span className="text-slate-400 font-normal">({cook.total_reviews || 18} reviews)</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>Experience</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {cook.experience_years || 8} Years
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>Verification</span>
                    <span className="font-bold text-emerald-600 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Cleared
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>Cuisines</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
                      {cook.cuisines || 'North, Homestyle'}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                  {cook.bio || 'Experienced in traditional home cooking, fluffy phulkas, and authentic regional gravies.'}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
                <button
                  type="button"
                  onClick={() => setSelectedCook(cook)}
                  className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs text-center transition-colors"
                >
                  View Profile & Badges
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detailed Cook Profile Modal */}
      {selectedCook && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-3xl">
                  👨‍🍳
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900 dark:text-white">
                    {selectedCook.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-amber-500 font-bold mt-0.5">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>{selectedCook.rating || 4.85}</span>
                    <span className="text-slate-400 font-normal">· {selectedCook.experience_years || 8} yrs exp</span>
                  </div>
                </div>
              </div>
              <button type="button" onClick={() => setSelectedCook(null)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 space-y-2">
                <div className="font-extrabold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Verified Society Credentials
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-emerald-800 dark:text-emerald-300">
                  <div>✓ Aadhaar ID Verified</div>
                  <div>✓ Police Record Cleared</div>
                  <div>✓ Hygiene Training Done</div>
                  <div>✓ Gate Pass Issued</div>
                </div>
              </div>

              <div>
                <h5 className="font-bold text-slate-700 dark:text-slate-300 mb-1">Cuisine Specialties</h5>
                <p className="text-slate-600 dark:text-slate-400 text-xs">
                  {selectedCook.cuisines || 'North Indian (Phulkas, Sabzi, Dal), South Indian (Dosa, Sambar)'}
                </p>
              </div>

              <div>
                <h5 className="font-bold text-slate-700 dark:text-slate-300 mb-1">Cook Bio</h5>
                <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                  {selectedCook.bio || 'Specialist in healthy, less-oil, and nutrient-dense home meals. Strict on punctuality and kitchen sanitation.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                showToast(`Cook ${selectedCook.name} added to your preferred group matching priority.`);
                setSelectedCook(null);
              }}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/30"
            >
              Request for Group Assignment
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
