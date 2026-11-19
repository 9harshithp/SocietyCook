import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChefHat,
  Users,
  ShieldCheck,
  TrendingUp,
  Clock,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Building2,
  DollarSign,
  HeartHandshake,
  CalendarCheck,
  ChevronDown,
  UtensilsCrossed,
  Droplets,
  Layers,
  Star,
  MapPin,
  Calendar,
  Shield,
  BadgeCheck,
  Check,
  Flame,
  Coffee,
  HelpCircle,
  PhoneCall,
  Send,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export function LandingPage() {
  const { user, societies } = useAuth();
  const navigate = useNavigate();

  // Service Finder state
  const [finderSociety, setFinderSociety] = useState('1');
  const [finderService, setFinderService] = useState('COOKING');
  const [finderSlot, setFinderSlot] = useState('MORNING');

  // Calculator state
  const [calcService, setCalcService] = useState('COOKING'); // COOKING | DISHWASHING | COMBO
  const [calcHouseholds, setCalcHouseholds] = useState(5);
  const [calcMealType, setCalcMealType] = useState('DINNER'); // BREAKFAST | DINNER | MULTIPLE
  const [calcUtensilLoad, setCalcUtensilLoad] = useState('STANDARD'); // LIGHT | STANDARD | HEAVY

  // Schedule Preview Tab
  const [scheduleTab, setScheduleTab] = useState('COMBO'); // COOKING | DISHWASHING | COMBO

  // Professionals state
  const [professionals, setProfessionals] = useState([]);

  // Accordion FAQ state
  const [openFaq, setOpenFaq] = useState(0);

  // Society Partnership Modal state
  const [showRwaModal, setShowRwaModal] = useState(false);
  const [rwaForm, setRwaForm] = useState({ name: '', society: '', flats: '250', phone: '', email: '' });
  const [rwaSuccess, setRwaSuccess] = useState(false);

  useEffect(() => {
    // Fetch live professionals from API with graceful fallback
    api.getCooks()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setProfessionals(data.slice(0, 4));
        } else {
          setProfessionals(DEFAULT_PROS);
        }
      })
      .catch(() => {
        setProfessionals(DEFAULT_PROS);
      });
  }, []);

  // Pricing calculations
  const calculatePricing = () => {
    let base = 5000;
    let discount = 1000;
    let proFloor = 16000;

    if (calcService === 'COOKING') {
      if (calcMealType === 'BREAKFAST') base = 3500;
      if (calcMealType === 'DINNER') base = 4800;
      if (calcMealType === 'MULTIPLE') base = 8500;
      const discounts = [0, 0, 300, 500, 800, 1000, 1200, 1400, 1600];
      discount = discounts[calcHouseholds] || 1000;
      proFloor = 18000;
    } else if (calcService === 'DISHWASHING') {
      base = 2200;
      const discounts = [0, 0, 150, 300, 450, 600, 700, 750, 800];
      discount = discounts[calcHouseholds] || 500;
      let loadMult = 1.0;
      if (calcUtensilLoad === 'LIGHT') loadMult = 0.9;
      if (calcUtensilLoad === 'HEAVY') loadMult = 1.25;
      base = Math.round(base * loadMult);
      discount = Math.round(discount * loadMult);
      proFloor = 10000;
    } else {
      // COMBO
      base = 6500;
      if (calcMealType === 'MULTIPLE') base = 10500;
      const discounts = [0, 0, 500, 800, 1200, 1600, 1900, 2100, 2300];
      discount = discounts[calcHouseholds] || 1500;
      proFloor = 28000;
    }

    const groupPrice = Math.max(1200, base - discount);
    const savingsPercent = Math.round((discount / base) * 100);
    const totalGroupBilling = groupPrice * calcHouseholds;
    const proPayout = Math.max(proFloor, Math.round(totalGroupBilling * 0.85));

    return {
      individualPrice: base,
      groupPrice,
      savingsAmount: discount,
      savingsPercent,
      totalGroupBilling,
      proPayout
    };
  };

  const pricingResult = calculatePricing();

  const handleFinderSubmit = (e) => {
    e.preventDefault();
    if (user) {
      navigate(`/app/cooks?service=${finderService}`);
    } else {
      navigate(`/register?service=${finderService}&society=${finderSociety}`);
    }
  };

  const handleRwaSubmit = (e) => {
    e.preventDefault();
    setRwaSuccess(true);
    setTimeout(() => {
      setShowRwaModal(false);
      setRwaSuccess(false);
      setRwaForm({ name: '', society: '', flats: '250', phone: '', email: '' });
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-[#FBF7EF] dark:bg-[#101A16] text-[#202A25] dark:text-[#EDE8DF] font-sans transition-colors selection:bg-[#E9A15B]/30">
      
      {/* =========================================================================
          SECTION B: CINEMATIC HERO SECTION
          ========================================================================= */}
      <section className="relative overflow-hidden pt-8 pb-16 md:pt-16 md:pb-24 border-b border-[#DDE9D8]/80 dark:border-white/5">
        {/* Background glow and subtle tint */}
        <div className="absolute top-0 right-0 w-3/5 h-full opacity-15 dark:opacity-20 pointer-events-none bg-radial from-[#153D32] to-transparent blur-3xl" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            
            {/* Left Content Column */}
            <div className="lg:col-span-7 text-left space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#153D32]/10 dark:bg-white/10 border border-[#153D32]/20 dark:border-white/15 text-[#153D32] dark:text-[#E9A15B] text-xs font-bold tracking-wide">
                <Sparkles className="w-3.5 h-3.5 text-[#E9A15B]" />
                EVERYDAY HOME CARE, REIMAGINED
              </div>

              <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-[4.1rem] font-bold text-[#153D32] dark:text-white leading-[1.08] tracking-tight">
                More living. <br />
                <span className="text-[#E9A15B] italic font-serif">Less chores.</span>
              </h1>

              <p className="text-base sm:text-lg text-[#64746B] dark:text-slate-300 max-w-xl font-medium leading-relaxed">
                Connect with neighbours in your residential apartment to collectively hire verified home cooks,
                dishwashing specialists, and complete kitchen care — scheduled seamlessly in your own home.
              </p>

              {/* Quick CTAs */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <a
                  href="#service-finder"
                  className="px-6 py-3.5 rounded-2xl bg-[#153D32] hover:bg-[#1E5747] text-white font-bold text-sm shadow-lg shadow-[#153D32]/25 inline-flex items-center gap-2 transition-all hover:-translate-y-0.5"
                >
                  Find Services Near You
                  <ArrowRight className="w-4 h-4 text-[#E9A15B]" />
                </a>
                <a
                  href="#community-pricing"
                  className="px-6 py-3.5 rounded-2xl bg-white dark:bg-white/5 border border-[#DDE9D8] dark:border-white/10 hover:border-[#153D32]/50 text-[#202A25] dark:text-white font-bold text-sm shadow-xs transition-colors"
                >
                  Calculate Community Savings
                </a>
              </div>

              {/* Trust Indicators */}
              <div className="pt-4 border-t border-[#DDE9D8]/80 dark:border-white/10 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs font-semibold text-[#64746B] dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#153D32] dark:text-[#E9A15B]" />
                  450+ Verified Society Staff
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#153D32] dark:text-[#E9A15B]" />
                  Zero Brokerage
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#153D32] dark:text-[#E9A15B]" />
                  Guaranteed Backup Cover
                </span>
              </div>
            </div>

            {/* Right Visual Image Card with Floating Badges */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white dark:border-white/10 aspect-[4/5] max-w-md mx-auto group">
                <img
                  src="/images/hero_kitchen_indian.jpg"
                  alt="Modern warm Indian kitchen with morning sunlight"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#153D32]/90 via-[#153D32]/20 to-transparent" />
                
                {/* Overlay Caption at Bottom */}
                <div className="absolute bottom-5 left-5 right-5 text-white">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-bold text-[#FBF7EF] mb-2 border border-white/20">
                    <Sparkles className="w-3 h-3 text-[#E9A15B]" />
                    Society-Exclusive Service
                  </div>
                  <h3 className="font-serif text-xl font-bold leading-snug">
                    Freshly cooked phulkas. Sparkling clean sink. Every single day.
                  </h3>
                  <p className="text-xs text-white/80 mt-1">
                    Neighbours in Greenwood Residency save 32% monthly.
                  </p>
                </div>
              </div>

              {/* Floating Stat Pill Top Left */}
              <div className="absolute -top-3 -left-3 sm:-left-6 bg-white dark:bg-[#182821] p-3 rounded-2xl shadow-xl border border-[#DDE9D8] dark:border-white/10 flex items-center gap-3 animate-bounce [animation-duration:4s]">
                <div className="w-10 h-10 rounded-xl bg-[#E9A15B]/20 flex items-center justify-center text-[#C47B35]">
                  <UtensilsCrossed className="w-5 h-5 text-[#C47B35]" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#202A25] dark:text-white">Fresh Homestyle Food</div>
                  <div className="text-[11px] text-[#64746B] dark:text-slate-400">Tailored to your spices & diet</div>
                </div>
              </div>

              {/* Floating Stat Pill Bottom Right */}
              <div className="absolute -bottom-3 -right-3 sm:-right-4 bg-white dark:bg-[#182821] p-3 rounded-2xl shadow-xl border border-[#DDE9D8] dark:border-white/10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#153D32]/10 flex items-center justify-center text-[#153D32] dark:text-emerald-400">
                  <Droplets className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#202A25] dark:text-white">Spotless Kitchen Care</div>
                  <div className="text-[11px] text-[#64746B] dark:text-slate-400">Utensils, sink & counters</div>
                </div>
              </div>
            </div>

          </div>

          {/* Integrated Functional Service Finder Bar */}
          <div id="service-finder" className="mt-12 bg-white dark:bg-[#182821] rounded-3xl p-4 sm:p-6 shadow-xl border border-[#DDE9D8] dark:border-white/10">
            <div className="text-xs uppercase font-extrabold tracking-wider text-[#64746B] dark:text-slate-400 mb-3 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-[#153D32] dark:text-[#E9A15B]" />
              Check Availability in Your Society
            </div>

            <form onSubmit={handleFinderSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-end">
              {/* Field 1: Society Selection */}
              <div>
                <label className="block text-xs font-bold text-[#202A25] dark:text-slate-200 mb-1.5">
                  Select Residential Society
                </label>
                <div className="relative">
                  <select
                    value={finderSociety}
                    onChange={(e) => setFinderSociety(e.target.value)}
                    className="w-full h-12 pl-3 pr-8 rounded-xl bg-[#FBF7EF] dark:bg-white/5 border border-[#DDE9D8] dark:border-white/10 text-xs font-bold text-[#202A25] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#153D32] cursor-pointer"
                  >
                    {societies.map((s) => (
                      <option key={s.id} value={s.id} className="dark:bg-slate-900 text-slate-900 dark:text-white">
                        {s.name} ({s.city})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Field 2: Service Category */}
              <div>
                <label className="block text-xs font-bold text-[#202A25] dark:text-slate-200 mb-1.5">
                  Required Service
                </label>
                <select
                  value={finderService}
                  onChange={(e) => setFinderService(e.target.value)}
                  className="w-full h-12 px-3 rounded-xl bg-[#FBF7EF] dark:bg-white/5 border border-[#DDE9D8] dark:border-white/10 text-xs font-bold text-[#202A25] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#153D32] cursor-pointer"
                >
                  <option value="COOKING" className="dark:bg-slate-900">Professional Home Cooking</option>
                  <option value="DISHWASHING" className="dark:bg-slate-900">Utensil Care & Dishwashing</option>
                  <option value="COMBO" className="dark:bg-slate-900">Complete Kitchen Care (Combo)</option>
                </select>
              </div>

              {/* Field 3: Schedule Window */}
              <div>
                <label className="block text-xs font-bold text-[#202A25] dark:text-slate-200 mb-1.5">
                  Preferred Time Window
                </label>
                <select
                  value={finderSlot}
                  onChange={(e) => setFinderSlot(e.target.value)}
                  className="w-full h-12 px-3 rounded-xl bg-[#FBF7EF] dark:bg-white/5 border border-[#DDE9D8] dark:border-white/10 text-xs font-bold text-[#202A25] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#153D32] cursor-pointer"
                >
                  <option value="MORNING" className="dark:bg-slate-900">Morning (7:00 AM – 10:30 AM)</option>
                  <option value="EVENING" className="dark:bg-slate-900">Evening (6:30 PM – 9:30 PM)</option>
                  <option value="FULL_DAY" className="dark:bg-slate-900">Both Morning & Evening</option>
                </select>
              </div>

              {/* Submit CTA */}
              <div>
                <button
                  type="submit"
                  className="w-full h-12 rounded-xl bg-[#153D32] hover:bg-[#1E5747] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-[#153D32]/20 transition-transform active:scale-95 cursor-pointer"
                >
                  <span>Find Available Professionals</span>
                  <ArrowRight className="w-4 h-4 text-[#E9A15B]" />
                </button>
              </div>
            </form>
          </div>

        </div>
      </section>


      {/* =========================================================================
          SECTION C: TRUST AND VALUE PROPOSITION STRIP
          ========================================================================= */}
      <section className="py-10 bg-white dark:bg-[#14231D] border-b border-[#DDE9D8]/80 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
            
            <div className="space-y-1.5 p-2">
              <div className="w-10 h-10 rounded-2xl bg-[#153D32]/10 dark:bg-white/10 text-[#153D32] dark:text-[#E9A15B] flex items-center justify-center mx-auto mb-2">
                <Building2 className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-xs sm:text-sm text-[#202A25] dark:text-white">Society Clusters</h4>
              <p className="text-[11px] text-[#64746B] dark:text-slate-400">Neighbours in the same tower share service routes</p>
            </div>

            <div className="space-y-1.5 p-2">
              <div className="w-10 h-10 rounded-2xl bg-[#E9A15B]/15 text-[#C47B35] dark:text-[#E9A15B] flex items-center justify-center mx-auto mb-2">
                <DollarSign className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-xs sm:text-sm text-[#202A25] dark:text-white">Up to 35% Savings</h4>
              <p className="text-[11px] text-[#64746B] dark:text-slate-400">Concentrated demand lowers individual cost</p>
            </div>

            <div className="space-y-1.5 p-2">
              <div className="w-10 h-10 rounded-2xl bg-[#153D32]/10 dark:bg-white/10 text-[#153D32] dark:text-[#E9A15B] flex items-center justify-center mx-auto mb-2">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-xs sm:text-sm text-[#202A25] dark:text-white">100% Verified Staff</h4>
              <p className="text-[11px] text-[#64746B] dark:text-slate-400">Govt ID, police clearance & hygiene trials</p>
            </div>

            <div className="space-y-1.5 p-2">
              <div className="w-10 h-10 rounded-2xl bg-[#E9A15B]/15 text-[#C47B35] dark:text-[#E9A15B] flex items-center justify-center mx-auto mb-2">
                <Clock className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-xs sm:text-sm text-[#202A25] dark:text-white">Zero Commute Gaps</h4>
              <p className="text-[11px] text-[#64746B] dark:text-slate-400">Staff walks between flats in minutes</p>
            </div>

            <div className="col-span-2 md:col-span-1 space-y-1.5 p-2">
              <div className="w-10 h-10 rounded-2xl bg-[#153D32]/10 dark:bg-white/10 text-[#153D32] dark:text-[#E9A15B] flex items-center justify-center mx-auto mb-2">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-xs sm:text-sm text-[#202A25] dark:text-white">Guaranteed Backup</h4>
              <p className="text-[11px] text-[#64746B] dark:text-slate-400">Pre-cleared replacement if primary staff is on leave</p>
            </div>

          </div>
        </div>
      </section>


      {/* =========================================================================
          SECTION D: SIGNATURE SERVICE SHOWCASE (3 CATEGORIES)
          ========================================================================= */}
      <section id="services" className="py-20 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#153D32]/10 dark:bg-white/10 text-[#153D32] dark:text-[#E9A15B] text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            COMPREHENSIVE KITCHEN HYGIENE & CUISINE
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[#153D32] dark:text-white tracking-tight">
            Our Signature Services
          </h2>
          <p className="text-sm sm:text-base text-[#64746B] dark:text-slate-300 mt-3 font-medium">
            Designed specifically for modern apartment households. Choose individual specializations or enjoy a fully managed kitchen routine.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Service Card 1: Home Cooking */}
          <div className="bg-white dark:bg-[#182821] rounded-3xl overflow-hidden border border-[#DDE9D8] dark:border-white/10 shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col group">
            <div className="relative aspect-[16/10] overflow-hidden">
              <img
                src="/images/service_home_cooking.jpg"
                alt="Fresh authentic homestyle Indian cooking"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-3 left-3 bg-[#153D32] text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm">
                Cuisine Care
              </div>
            </div>
            
            <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-xl font-bold text-[#153D32] dark:text-white">
                    Professional Home Cooking
                  </h3>
                  <span className="text-xs font-extrabold text-[#C47B35] dark:text-[#E9A15B]">
                    From ₹2,800/mo
                  </span>
                </div>
                <p className="text-xs text-[#64746B] dark:text-slate-300 leading-relaxed">
                  Daily customized meals cooked fresh in your kitchen. North Indian, South Indian, Jain, Continental & diet-specific routines.
                </p>

                <ul className="space-y-2 text-xs font-semibold text-[#202A25] dark:text-slate-200 pt-2">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#153D32] dark:text-[#E9A15B] shrink-0" />
                    Dedicated 45-minute cooking slot
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#153D32] dark:text-[#E9A15B] shrink-0" />
                    Custom oil, salt and spice balance
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#153D32] dark:text-[#E9A15B] shrink-0" />
                    Hot phulkas, dal & seasonal sabzis
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#153D32] dark:text-[#E9A15B] shrink-0" />
                    Verified kitchen trial before start
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-[#DDE9D8]/80 dark:border-white/10">
                <Link
                  to={user ? '/app/cooks' : '/register?service=COOKING'}
                  className="w-full py-3 rounded-xl bg-[#153D32]/10 hover:bg-[#153D32] text-[#153D32] hover:text-white dark:bg-white/10 dark:hover:bg-[#153D32] dark:text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  Explore Cooking Plans
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Service Card 2: Dishwashing */}
          <div className="bg-white dark:bg-[#182821] rounded-3xl overflow-hidden border border-[#DDE9D8] dark:border-white/10 shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col group">
            <div className="relative aspect-[16/10] overflow-hidden">
              <img
                src="/images/service_dishwashing.jpg"
                alt="Spotless clean sink and stainless steel cookware"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-3 left-3 bg-[#C47B35] text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm">
                Hygiene Care
              </div>
            </div>
            
            <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-xl font-bold text-[#153D32] dark:text-white">
                    Utensil Care & Dishwashing
                  </h3>
                  <span className="text-xs font-extrabold text-[#C47B35] dark:text-[#E9A15B]">
                    From ₹1,500/mo
                  </span>
                </div>
                <p className="text-xs text-[#64746B] dark:text-slate-300 leading-relaxed">
                  Punctual, sparkling dishwashing with complete sink area sanitization and grease-free kadhais.
                </p>

                <ul className="space-y-2 text-xs font-semibold text-[#202A25] dark:text-slate-200 pt-2">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#153D32] dark:text-[#E9A15B] shrink-0" />
                    Dedicated 30-minute washing window
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#153D32] dark:text-[#E9A15B] shrink-0" />
                    Pressure cooker & heavy kadhai scrubbing
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#153D32] dark:text-[#E9A15B] shrink-0" />
                    Sink rim wipe & counter wipe-down
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#153D32] dark:text-[#E9A15B] shrink-0" />
                    Utensil tier matching your family size
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-[#DDE9D8]/80 dark:border-white/10">
                <Link
                  to={user ? '/app/cooks' : '/register?service=DISHWASHING'}
                  className="w-full py-3 rounded-xl bg-[#153D32]/10 hover:bg-[#153D32] text-[#153D32] hover:text-white dark:bg-white/10 dark:hover:bg-[#153D32] dark:text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  Explore Dishwashing Plans
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Service Card 3: Complete Combo (Popular) */}
          <div className="bg-white dark:bg-[#182821] rounded-3xl overflow-hidden border-2 border-[#153D32] dark:border-[#E9A15B] shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col group relative">
            <div className="absolute top-3 right-3 z-10 bg-[#E9A15B] text-[#153D32] text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-md">
              MOST POPULAR
            </div>

            <div className="relative aspect-[16/10] overflow-hidden">
              <img
                src="/images/service_combo_care.jpg"
                alt="Complete kitchen care with organized meal prep and sparkling clean kitchen island"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-3 left-3 bg-[#153D32] text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm">
                Full Solution
              </div>
            </div>
            
            <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-xl font-bold text-[#153D32] dark:text-white">
                    Complete Kitchen Care
                  </h3>
                  <span className="text-xs font-extrabold text-[#C47B35] dark:text-[#E9A15B]">
                    From ₹4,600/mo
                  </span>
                </div>
                <p className="text-xs text-[#64746B] dark:text-slate-300 leading-relaxed">
                  The ultimate stress-free kitchen experience. Tailored meal preparation immediately followed by spotless utensil washing.
                </p>

                <ul className="space-y-2 text-xs font-semibold text-[#202A25] dark:text-slate-200 pt-2">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#153D32] dark:text-[#E9A15B] shrink-0" />
                    Synchronized 75-min back-to-back routine
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#153D32] dark:text-[#E9A15B] shrink-0" />
                    Never touch a greasy kadhai again
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#153D32] dark:text-[#E9A15B] shrink-0" />
                    Consolidated single monthly subscription
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#153D32] dark:text-[#E9A15B] shrink-0" />
                    Dual backup cover for both professionals
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-[#DDE9D8]/80 dark:border-white/10">
                <Link
                  to={user ? '/app/groups' : '/register?service=COMBO'}
                  className="w-full py-3 rounded-xl bg-[#153D32] hover:bg-[#1E5747] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-[#153D32]/20 transition-colors"
                >
                  Explore Combo Plans
                  <ArrowRight className="w-3.5 h-3.5 text-[#E9A15B]" />
                </Link>
              </div>
            </div>
          </div>

        </div>
      </section>


      {/* =========================================================================
          SECTION E: LIFESTYLE STORYTELLING SECTION
          ========================================================================= */}
      <section className="py-20 bg-white dark:bg-[#14231D] border-y border-[#DDE9D8]/80 dark:border-white/5 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Narrative */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E9A15B]/15 text-[#C47B35] dark:text-[#E9A15B] text-xs font-bold">
                <HeartHandshake className="w-3.5 h-3.5" />
                LIFE WITHOUT KITCHEN FATIGUE
              </div>

              <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[#153D32] dark:text-white leading-[1.15]">
                Spend your evenings on what actually matters.
              </h2>

              <p className="text-sm sm:text-base text-[#64746B] dark:text-slate-300 leading-relaxed font-medium">
                Between high-pressure work schedules, school pickups and daily commutes, the last thing you should face at 8:00 PM is chopping vegetables or staring at a sink stacked with greasy vessels.
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-[#FBF7EF] dark:bg-white/5 border border-[#DDE9D8] dark:border-white/10">
                  <div className="w-8 h-8 rounded-xl bg-[#153D32] text-[#E9A15B] flex items-center justify-center font-serif font-bold text-sm shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#202A25] dark:text-white">Fresh, warm food right on time</h4>
                    <p className="text-xs text-[#64746B] dark:text-slate-400 mt-0.5">
                      No cold restaurant deliveries or microwaved pre-packaged meals. Wholesome nutrition tailored for your children and parents.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-2xl bg-[#FBF7EF] dark:bg-white/5 border border-[#DDE9D8] dark:border-white/10">
                  <div className="w-8 h-8 rounded-xl bg-[#E9A15B] text-[#153D32] flex items-center justify-center font-serif font-bold text-sm shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#202A25] dark:text-white">Gleaming countertops and clean sink</h4>
                    <p className="text-xs text-[#64746B] dark:text-slate-400 mt-0.5">
                      Wake up to an empty, spotless dish rack and clean counters every morning. Peace of mind before your first cup of coffee.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Image */}
            <div className="lg:col-span-6">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-[#FBF7EF] dark:border-white/10 aspect-[4/3]">
                <img
                  src="/images/lifestyle_family_meal.jpg"
                  alt="Modern Indian family happily dining together at home"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 text-white">
                  <p className="font-serif italic text-base sm:text-lg">
                    "Since our 4 flats in Tower 2 formed a SocietyCook group, cooking and dishes run on auto-pilot. We save ₹3,000 every single month."
                  </p>
                  <p className="text-xs font-bold text-[#E9A15B] mt-2">
                    — Priyadarshini & Amit, Residents at Greenwood Residency
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>


      {/* =========================================================================
          SECTION F: COMMUNITY-FIRST DIFFERENTIATOR (INTERACTIVE VISUALIZER)
          ========================================================================= */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#153D32]/10 dark:bg-white/10 text-[#153D32] dark:text-[#E9A15B] text-xs font-bold mb-3">
            <Users className="w-3.5 h-3.5" />
            THE HYPERLOCAL CLUSTER ADVANTAGE
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[#153D32] dark:text-white tracking-tight">
            Good neighbours. Better living.
          </h2>
          <p className="text-sm sm:text-base text-[#64746B] dark:text-slate-300 mt-3 font-medium">
            Traditional cook hiring means 1 cook travels across 4 different neighbourhoods in Bengaluru traffic.
            In SocietyCook, verified professionals move seamlessly between flats in your own tower.
          </p>
        </div>

        {/* Visual Tower Flowchart / Graphic */}
        <div className="bg-white dark:bg-[#182821] rounded-3xl p-6 sm:p-10 border border-[#DDE9D8] dark:border-white/10 shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Visual Tower Diagram */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#DDE9D8] dark:border-white/10">
                <span className="font-bold text-sm text-[#153D32] dark:text-[#E9A15B] flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Tower A Morning Roster (Greenwood Residency)
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                  Active & Synchronized
                </span>
              </div>

              {/* Slot 1: Flat A-402 */}
              <div className="p-4 rounded-2xl bg-[#FBF7EF] dark:bg-white/5 border border-[#DDE9D8] dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#153D32] text-white flex items-center justify-center font-bold text-xs">
                    402
                  </div>
                  <div>
                    <div className="font-bold text-xs sm:text-sm text-[#202A25] dark:text-white">Flat A-402 (Sharma Family)</div>
                    <div className="text-[11px] text-[#64746B] dark:text-slate-400">Breakfast & Lunch + Utensil Care</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-[#153D32]/10 dark:bg-emerald-950 text-[#153D32] dark:text-emerald-300 font-bold">
                    🍳 Cook: 7:30 – 8:15 AM
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-[#E9A15B]/20 dark:bg-amber-950 text-[#C47B35] dark:text-[#E9A15B] font-bold">
                    🫧 Wash: 8:15 – 8:45 AM
                  </span>
                </div>
              </div>

              {/* Seamless Transition Indicator */}
              <div className="flex items-center justify-center gap-2 text-[11px] font-bold text-[#64746B] dark:text-slate-400 py-1">
                <div className="h-4 w-0.5 bg-[#DDE9D8] dark:bg-white/20" />
                <span>Zero travel gap • 1-minute elevator ride</span>
                <div className="h-4 w-0.5 bg-[#DDE9D8] dark:bg-white/20" />
              </div>

              {/* Slot 2: Flat A-501 */}
              <div className="p-4 rounded-2xl bg-[#FBF7EF] dark:bg-white/5 border border-[#DDE9D8] dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#153D32] text-white flex items-center justify-center font-bold text-xs">
                    501
                  </div>
                  <div>
                    <div className="font-bold text-xs sm:text-sm text-[#202A25] dark:text-white">Flat A-501 (Iyer Residence)</div>
                    <div className="text-[11px] text-[#64746B] dark:text-slate-400">South Indian Routine + Full Kitchen Care</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-[#153D32]/10 dark:bg-emerald-950 text-[#153D32] dark:text-emerald-300 font-bold">
                    🍳 Cook: 8:15 – 9:00 AM
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-[#E9A15B]/20 dark:bg-amber-950 text-[#C47B35] dark:text-[#E9A15B] font-bold">
                    🫧 Wash: 9:00 – 9:30 AM
                  </span>
                </div>
              </div>

              {/* Seamless Transition Indicator */}
              <div className="flex items-center justify-center gap-2 text-[11px] font-bold text-[#64746B] dark:text-slate-400 py-1">
                <div className="h-4 w-0.5 bg-[#DDE9D8] dark:bg-white/20" />
                <span>Zero travel gap • 1-minute elevator ride</span>
                <div className="h-4 w-0.5 bg-[#DDE9D8] dark:bg-white/20" />
              </div>

              {/* Slot 3: Flat A-603 */}
              <div className="p-4 rounded-2xl bg-[#FBF7EF] dark:bg-white/5 border border-[#DDE9D8] dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#153D32] text-white flex items-center justify-center font-bold text-xs">
                    603
                  </div>
                  <div>
                    <div className="font-bold text-xs sm:text-sm text-[#202A25] dark:text-white">Flat A-603 (Verma Family)</div>
                    <div className="text-[11px] text-[#64746B] dark:text-slate-400">North Indian Homestyle Lunch Prep</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-[#153D32]/10 dark:bg-emerald-950 text-[#153D32] dark:text-emerald-300 font-bold">
                    🍳 Cook: 9:00 – 9:45 AM
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-[#E9A15B]/20 dark:bg-amber-950 text-[#C47B35] dark:text-[#E9A15B] font-bold">
                    🫧 Wash: 9:45 – 10:15 AM
                  </span>
                </div>
              </div>
            </div>

            {/* Right Summary Cards */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-6 rounded-3xl bg-[#153D32] text-white space-y-4">
                <span className="text-[10px] uppercase font-black tracking-wider text-[#E9A15B]">
                  WHY THIS WORKS
                </span>
                <h3 className="font-serif text-2xl font-bold leading-tight">
                  Win-Win For Residents and Staff Alike
                </h3>
                <p className="text-xs text-white/80 leading-relaxed">
                  By clustering adjacent apartments into coordinated schedules, the cook and dishwasher spend 100% of their time working and earning, instead of wasting 3 hours daily in traffic.
                </p>
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/15">
                  <div>
                    <div className="text-2xl font-serif font-black text-[#E9A15B]">35%</div>
                    <div className="text-[11px] text-white/70">Resident Monthly Savings</div>
                  </div>
                  <div>
                    <div className="text-2xl font-serif font-black text-[#E9A15B]">2.5x</div>
                    <div className="text-[11px] text-white/70">Higher Monthly Staff Earnings</div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#FBF7EF] dark:bg-white/5 border border-[#DDE9D8] dark:border-white/10 flex items-center gap-3">
                <ShieldCheck className="w-8 h-8 text-[#153D32] dark:text-[#E9A15B] shrink-0" />
                <div className="text-xs">
                  <span className="font-bold block text-[#202A25] dark:text-white">OTP-Verified Session Check-in</span>
                  <span className="text-[#64746B] dark:text-slate-400">Zero disputes. You only pay for verified days.</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>


      {/* =========================================================================
          SECTION G: INTERACTIVE COMMUNITY PRICING CALCULATOR
          ========================================================================= */}
      <section id="community-pricing" className="py-20 bg-white dark:bg-[#14231D] border-y border-[#DDE9D8]/80 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#153D32]/10 dark:bg-white/10 text-[#153D32] dark:text-[#E9A15B] text-xs font-bold mb-3">
              <DollarSign className="w-3.5 h-3.5" />
              TRANSPARENT VOLUME PRICING
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[#153D32] dark:text-white tracking-tight">
              Community Savings Calculator
            </h2>
            <p className="text-sm sm:text-base text-[#64746B] dark:text-slate-300 mt-3 font-medium">
              See exactly how much you and your neighbours save as your tower group grows from 2 to 8 households.
            </p>
          </div>

          <div className="max-w-4xl mx-auto bg-[#FBF7EF] dark:bg-[#182821] rounded-3xl p-6 sm:p-10 border border-[#DDE9D8] dark:border-white/10 shadow-xl">
            
            {/* Service Type Tabs */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-8 p-1.5 bg-white dark:bg-white/5 rounded-2xl border border-[#DDE9D8] dark:border-white/10">
              <button
                type="button"
                onClick={() => setCalcService('COOKING')}
                className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  calcService === 'COOKING'
                    ? 'bg-[#153D32] text-white shadow-xs'
                    : 'text-[#64746B] dark:text-slate-300 hover:text-[#153D32]'
                }`}
              >
                🍳 Home Cooking
              </button>
              <button
                type="button"
                onClick={() => setCalcService('DISHWASHING')}
                className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  calcService === 'DISHWASHING'
                    ? 'bg-[#153D32] text-white shadow-xs'
                    : 'text-[#64746B] dark:text-slate-300 hover:text-[#153D32]'
                }`}
              >
                🫧 Utensil Care
              </button>
              <button
                type="button"
                onClick={() => setCalcService('COMBO')}
                className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  calcService === 'COMBO'
                    ? 'bg-[#153D32] text-white shadow-xs'
                    : 'text-[#64746B] dark:text-slate-300 hover:text-[#153D32]'
                }`}
              >
                ✨ Complete Combo Care
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              
              {/* Controls Column */}
              <div className="space-y-6">
                
                {/* Household Slider */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-[#202A25] dark:text-white">
                      Participating Households in Tower
                    </label>
                    <span className="text-sm font-black text-[#153D32] dark:text-[#E9A15B] px-2.5 py-0.5 rounded-lg bg-white dark:bg-white/10 border border-[#DDE9D8] dark:border-white/10">
                      {calcHouseholds} Flats
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="8"
                    value={calcHouseholds}
                    onChange={(e) => setCalcHouseholds(Number(e.target.value))}
                    className="w-full accent-[#153D32] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-[#64746B] dark:text-slate-400 font-bold mt-1">
                    <span>1 Flat (Solo)</span>
                    <span>4 Flats (Optimal)</span>
                    <span>8 Flats (Max Savings)</span>
                  </div>
                </div>

                {/* Sub-Option: Meal Type (for Cooking/Combo) */}
                {calcService !== 'DISHWASHING' && (
                  <div>
                    <label className="block text-xs font-bold text-[#202A25] dark:text-white mb-2">
                      Meal Schedule
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {['BREAKFAST', 'DINNER', 'MULTIPLE'].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setCalcMealType(m)}
                          className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            calcMealType === m
                              ? 'bg-[#153D32] text-white border-[#153D32]'
                              : 'bg-white dark:bg-white/5 text-[#202A25] dark:text-slate-300 border-[#DDE9D8] dark:border-white/10'
                          }`}
                        >
                          {m === 'MULTIPLE' ? 'Both Meals' : m.charAt(0) + m.slice(1).toLowerCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sub-Option: Utensil Load (for Dishwashing) */}
                {calcService === 'DISHWASHING' && (
                  <div>
                    <label className="block text-xs font-bold text-[#202A25] dark:text-white mb-2">
                      Vessel & Sink Load Tier
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'LIGHT', label: 'Light (1-2 ppl)' },
                        { id: 'STANDARD', label: 'Standard (3-4 ppl)' },
                        { id: 'HEAVY', label: 'Heavy (5+ ppl)' }
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setCalcUtensilLoad(t.id)}
                          className={`py-2 px-1 text-center rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                            calcUtensilLoad === t.id
                              ? 'bg-[#153D32] text-white border-[#153D32]'
                              : 'bg-white dark:bg-white/5 text-[#202A25] dark:text-slate-300 border-[#DDE9D8] dark:border-white/10'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Informational note */}
                <div className="p-3.5 rounded-2xl bg-white dark:bg-white/5 border border-[#DDE9D8] dark:border-white/10 text-xs text-[#64746B] dark:text-slate-400">
                  💡 <strong className="text-[#202A25] dark:text-white">Fair Wage Floor:</strong> In SocietyCook, staff compensation is legally safeguarded. Staff earns up to ₹{pricingResult.proPayout.toLocaleString()}/mo with dedicated fixed schedules.
                </div>
              </div>

              {/* Output Display Card */}
              <div className="bg-white dark:bg-[#101A16] rounded-3xl p-6 sm:p-8 border border-[#DDE9D8] dark:border-white/10 shadow-lg space-y-6">
                <div>
                  <span className="text-[10px] uppercase font-black tracking-wider text-[#64746B] dark:text-slate-400">
                    Your Household Rate
                  </span>
                  <div className="flex items-baseline gap-3 mt-1">
                    <span className="font-serif text-3xl sm:text-4xl font-extrabold text-[#153D32] dark:text-white">
                      ₹{pricingResult.groupPrice.toLocaleString()}
                    </span>
                    <span className="text-xs text-[#64746B] dark:text-slate-400 font-bold">/ month</span>
                    {pricingResult.savingsPercent > 0 && (
                      <span className="ml-auto text-xs font-black px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        {pricingResult.savingsPercent}% SAVED
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-[#DDE9D8]/80 dark:border-white/10 text-xs">
                  <div className="flex justify-between text-[#64746B] dark:text-slate-400">
                    <span>Individual market rate:</span>
                    <span className="line-through font-bold">₹{pricingResult.individualPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                    <span>Your monthly community savings:</span>
                    <span>-₹{pricingResult.savingsAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[#202A25] dark:text-slate-200 font-bold pt-2 border-t border-dashed border-[#DDE9D8] dark:border-white/10">
                    <span>Total Group Billing ({calcHouseholds} flats):</span>
                    <span>₹{pricingResult.totalGroupBilling.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[#C47B35] dark:text-[#E9A15B] font-bold">
                    <span>Guaranteed Staff Payout:</span>
                    <span>₹{pricingResult.proPayout.toLocaleString()}</span>
                  </div>
                </div>

                <Link
                  to={user ? '/app/groups' : `/register?service=${calcService}`}
                  className="w-full py-3.5 rounded-2xl bg-[#153D32] hover:bg-[#1E5747] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-[#153D32]/20 transition-all hover:-translate-y-0.5"
                >
                  <span>Lock In This Rate</span>
                  <ArrowRight className="w-4 h-4 text-[#E9A15B]" />
                </Link>
              </div>

            </div>

          </div>
        </div>
      </section>


      {/* =========================================================================
          SECTION H: HOW IT WORKS IN 4 STEPS
          ========================================================================= */}
      <section id="how-it-works" className="py-20 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#153D32]/10 dark:bg-white/10 text-[#153D32] dark:text-[#E9A15B] text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            FRICTION-FREE ONBOARDING
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[#153D32] dark:text-white tracking-tight">
            A simpler everyday, in four steps.
          </h2>
          <p className="text-sm sm:text-base text-[#64746B] dark:text-slate-300 mt-3 font-medium">
            From discovering your society group to enjoying warm homestyle meals and a spotless kitchen.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
          
          {/* Step 1 */}
          <div className="bg-white dark:bg-[#182821] p-6 rounded-3xl border border-[#DDE9D8] dark:border-white/10 shadow-md relative group hover:-translate-y-1 transition-transform">
            <div className="w-12 h-12 rounded-2xl bg-[#153D32] text-[#E9A15B] flex items-center justify-center font-serif font-black text-lg mb-4 shadow-md">
              01
            </div>
            <h3 className="font-serif font-bold text-lg text-[#153D32] dark:text-white mb-2">
              Join or Form a Group
            </h3>
            <p className="text-xs text-[#64746B] dark:text-slate-300 leading-relaxed">
              Find an active group in your apartment tower or create a new one with your desired meal schedule and utensil load.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white dark:bg-[#182821] p-6 rounded-3xl border border-[#DDE9D8] dark:border-white/10 shadow-md relative group hover:-translate-y-1 transition-transform">
            <div className="w-12 h-12 rounded-2xl bg-[#153D32] text-[#E9A15B] flex items-center justify-center font-serif font-black text-lg mb-4 shadow-md">
              02
            </div>
            <h3 className="font-serif font-bold text-lg text-[#153D32] dark:text-white mb-2">
              Match Top Verified Staff
            </h3>
            <p className="text-xs text-[#64746B] dark:text-slate-300 leading-relaxed">
              Once threshold is met, our algorithm matches top-rated cooks and dishwashers who already operate near your society.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white dark:bg-[#182821] p-6 rounded-3xl border border-[#DDE9D8] dark:border-white/10 shadow-md relative group hover:-translate-y-1 transition-transform">
            <div className="w-12 h-12 rounded-2xl bg-[#153D32] text-[#E9A15B] flex items-center justify-center font-serif font-black text-lg mb-4 shadow-md">
              03
            </div>
            <h3 className="font-serif font-bold text-lg text-[#153D32] dark:text-white mb-2">
              OTP-Verified Visits
            </h3>
            <p className="text-xs text-[#64746B] dark:text-slate-300 leading-relaxed">
              Staff arrives at your exact scheduled window. Verify daily check-in with your 4-digit OTP. Zero disputes.
            </p>
          </div>

          {/* Step 4 */}
          <div className="bg-white dark:bg-[#182821] p-6 rounded-3xl border border-[#DDE9D8] dark:border-white/10 shadow-md relative group hover:-translate-y-1 transition-transform">
            <div className="w-12 h-12 rounded-2xl bg-[#E9A15B] text-[#153D32] flex items-center justify-center font-serif font-black text-lg mb-4 shadow-md">
              04
            </div>
            <h3 className="font-serif font-bold text-lg text-[#153D32] dark:text-white mb-2">
              Guaranteed Backup
            </h3>
            <p className="text-xs text-[#64746B] dark:text-slate-300 leading-relaxed">
              When your assigned staff takes planned leaves, an automated standby professional covers the slot seamlessly.
            </p>
          </div>

        </div>
      </section>


      {/* =========================================================================
          SECTION I: INTERACTIVE HOUSEHOLD SCHEDULE PREVIEW
          ========================================================================= */}
      <section className="py-20 bg-white dark:bg-[#14231D] border-y border-[#DDE9D8]/80 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#153D32]/10 dark:bg-white/10 text-[#153D32] dark:text-[#E9A15B] text-xs font-bold mb-3">
              <Clock className="w-3.5 h-3.5" />
              PRECISION SCHEDULING
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#153D32] dark:text-white tracking-tight">
              Sample Daily Tower Routine
            </h2>
            <p className="text-sm text-[#64746B] dark:text-slate-300 mt-2 font-medium">
              See how a typical 4-flat cluster operates seamlessly in the morning and evening.
            </p>
          </div>

          <div className="max-w-4xl mx-auto bg-[#FBF7EF] dark:bg-[#182821] rounded-3xl p-6 sm:p-8 border border-[#DDE9D8] dark:border-white/10 shadow-lg">
            
            <div className="flex justify-center gap-2 mb-6">
              <button
                type="button"
                onClick={() => setScheduleTab('COMBO')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  scheduleTab === 'COMBO'
                    ? 'bg-[#153D32] text-white'
                    : 'bg-white dark:bg-white/5 text-[#202A25] dark:text-slate-300'
                }`}
              >
                Combined Care (Cooking + Washing)
              </button>
              <button
                type="button"
                onClick={() => setScheduleTab('COOKING')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  scheduleTab === 'COOKING'
                    ? 'bg-[#153D32] text-white'
                    : 'bg-white dark:bg-white/5 text-[#202A25] dark:text-slate-300'
                }`}
              >
                Cooking Only
              </button>
              <button
                type="button"
                onClick={() => setScheduleTab('DISHWASHING')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  scheduleTab === 'DISHWASHING'
                    ? 'bg-[#153D32] text-white'
                    : 'bg-white dark:bg-white/5 text-[#202A25] dark:text-slate-300'
                }`}
              >
                Utensil Care Only
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-12 text-[11px] font-extrabold uppercase text-[#64746B] dark:text-slate-400 px-4 pb-2 border-b border-[#DDE9D8] dark:border-white/10">
                <span className="col-span-3">Time Slot</span>
                <span className="col-span-3">Household</span>
                <span className="col-span-3">Professional Activity</span>
                <span className="col-span-3 text-right">Status</span>
              </div>

              {[
                { time: '07:30 – 08:15 AM', flat: 'Flat B-201', task: '🍳 Breakfast Prep (Poha & Chai)', status: 'Completed' },
                { time: '08:15 – 08:45 AM', flat: 'Flat B-201', task: '🫧 Utensil Washing & Sink Wipe', status: 'Active Now' },
                { time: '08:15 – 09:00 AM', flat: 'Flat B-304', task: '🍳 Fresh Phulkas & Paneer Sabzi', status: 'Scheduled' },
                { time: '09:00 – 09:30 AM', flat: 'Flat B-304', task: '🫧 Heavy Kadhais & Cooker Care', status: 'Upcoming' },
                { time: '09:00 – 09:45 AM', flat: 'Flat B-402', task: '🍳 South Indian Meals & Sambhar', status: 'Upcoming' }
              ].map((row, i) => (
                <div
                  key={i}
                  className="grid grid-cols-12 items-center p-3.5 rounded-2xl bg-white dark:bg-white/5 border border-[#DDE9D8] dark:border-white/10 text-xs font-medium"
                >
                  <span className="col-span-3 font-bold text-[#153D32] dark:text-[#E9A15B]">{row.time}</span>
                  <span className="col-span-3 font-bold text-[#202A25] dark:text-white">{row.flat}</span>
                  <span className="col-span-3 text-[#64746B] dark:text-slate-300">{row.task}</span>
                  <span className="col-span-3 text-right">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      row.status === 'Completed' ? 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300' :
                      row.status === 'Active Now' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 animate-pulse' :
                      'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}>
                      {row.status}
                    </span>
                  </span>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>


      {/* =========================================================================
          SECTION J: MEET YOUR PROFESSIONALS
          ========================================================================= */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#153D32]/10 dark:bg-white/10 text-[#153D32] dark:text-[#E9A15B] text-xs font-bold mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              VERIFIED EXPERTISE
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#153D32] dark:text-white tracking-tight">
              Meet Top Society Professionals
            </h2>
            <p className="text-sm text-[#64746B] dark:text-slate-300 mt-2 font-medium">
              Vetted through police verification, food safety checks, and practical kitchen trials.
            </p>
          </div>
          <Link
            to={user ? '/app/cooks' : '/register'}
            className="mt-4 md:mt-0 inline-flex items-center gap-2 text-xs font-bold text-[#153D32] dark:text-[#E9A15B] hover:underline"
          >
            <span>View All Society Staff</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {professionals.map((pro) => (
            <div
              key={pro.id}
              className="bg-white dark:bg-[#182821] rounded-3xl p-5 border border-[#DDE9D8] dark:border-white/10 shadow-md flex flex-col justify-between space-y-4 hover:shadow-xl transition-shadow"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#153D32] to-[#1E5747] text-[#E9A15B] font-bold text-lg flex items-center justify-center border border-[#E9A15B]/30">
                    {pro.name?.[0] || 'P'}
                  </div>
                  <div className="flex items-center gap-1 bg-[#FBF7EF] dark:bg-white/5 px-2 py-1 rounded-lg text-xs font-bold text-[#C47B35] dark:text-[#E9A15B]">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>{pro.rating || 4.9}</span>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-sm text-[#202A25] dark:text-white truncate">
                      {pro.name}
                    </h3>
                    <BadgeCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#C47B35] dark:text-[#E9A15B] block mt-0.5">
                    {pro.professional_type === 'MULTI_SKILLED' ? 'Multi-Skilled Cook & Utensil Care' :
                     pro.professional_type === 'DISHWASHER' ? 'Utensil Care Specialist' : 'Master Home Cook'}
                  </span>
                </div>

                <p className="text-xs text-[#64746B] dark:text-slate-300 mt-2 line-clamp-2">
                  {pro.bio || 'Specializes in North Indian homestyle gravies, phulkas and meticulous kitchen hygiene.'}
                </p>

                <div className="flex flex-wrap gap-1 mt-3">
                  {(pro.specialties || ['North Indian', 'Healthy Diet']).slice(0, 2).map((s, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#FBF7EF] dark:bg-white/5 text-[#64746B] dark:text-slate-300 border border-[#DDE9D8]/60 dark:border-white/5"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-[#DDE9D8]/80 dark:border-white/10 flex items-center justify-between text-xs">
                <span className="text-[#64746B] dark:text-slate-400 font-medium">
                  {pro.experience_years || 5}+ yrs exp
                </span>
                <Link
                  to={user ? `/app/cooks` : `/register`}
                  className="font-bold text-[#153D32] dark:text-[#E9A15B] hover:underline"
                >
                  View Profile
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>


      {/* =========================================================================
          SECTION K: BENEFITS FOR PROFESSIONALS
          ========================================================================= */}
      <section id="for-professionals" className="py-20 bg-white dark:bg-[#14231D] border-y border-[#DDE9D8]/80 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-5 space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#153D32]/10 dark:bg-white/10 text-[#153D32] dark:text-[#E9A15B] text-xs font-bold">
                <HeartHandshake className="w-3.5 h-3.5" />
                WORKFORCE DIGNITY & EMPOWERMENT
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#153D32] dark:text-white leading-tight">
                Better opportunities, closer to home.
              </h2>
              <p className="text-sm text-[#64746B] dark:text-slate-300 leading-relaxed font-medium">
                SocietyCook is committed to transforming informal domestic work into organized, well-compensated, dignified professions.
              </p>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div className="p-5 rounded-2xl bg-[#FBF7EF] dark:bg-[#182821] border border-[#DDE9D8] dark:border-white/10">
                <div className="w-8 h-8 rounded-xl bg-[#153D32] text-white flex items-center justify-center font-bold text-xs mb-3">
                  ₹
                </div>
                <h4 className="font-bold text-sm text-[#202A25] dark:text-white">2.5x Higher Earnings</h4>
                <p className="text-xs text-[#64746B] dark:text-slate-400 mt-1 leading-relaxed">
                  Earn ₹20,000 to ₹35,000/mo by serving 4-6 clustered flats without unpaid travel downtime.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#FBF7EF] dark:bg-[#182821] border border-[#DDE9D8] dark:border-white/10">
                <div className="w-8 h-8 rounded-xl bg-[#E9A15B] text-[#153D32] flex items-center justify-center font-bold text-xs mb-3">
                  📍
                </div>
                <h4 className="font-bold text-sm text-[#202A25] dark:text-white">Zero Commute Expenses</h4>
                <p className="text-xs text-[#64746B] dark:text-slate-400 mt-1 leading-relaxed">
                  Work in one gated society. Save up to ₹3,500/mo on bus and auto fares.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#FBF7EF] dark:bg-[#182821] border border-[#DDE9D8] dark:border-white/10">
                <div className="w-8 h-8 rounded-xl bg-[#153D32] text-white flex items-center justify-center font-bold text-xs mb-3">
                  ⏰
                </div>
                <h4 className="font-bold text-sm text-[#202A25] dark:text-white">Predictable Fixed Hours</h4>
                <p className="text-xs text-[#64746B] dark:text-slate-400 mt-1 leading-relaxed">
                  Firm 45-minute cooking and 30-minute washing windows with punctuality bonuses.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#FBF7EF] dark:bg-[#182821] border border-[#DDE9D8] dark:border-white/10">
                <div className="w-8 h-8 rounded-xl bg-[#E9A15B] text-[#153D32] flex items-center justify-center font-bold text-xs mb-3">
                  🏥
                </div>
                <h4 className="font-bold text-sm text-[#202A25] dark:text-white">Paid Leave & Medical Fund</h4>
                <p className="text-xs text-[#64746B] dark:text-slate-400 mt-1 leading-relaxed">
                  Guaranteed backup covers your leaves without resident complaints or salary cuts.
                </p>
              </div>

            </div>

          </div>
        </div>
      </section>


      {/* =========================================================================
          SECTION L: RESIDENTIAL SOCIETY PARTNERSHIPS (RWA / FACILITY MANAGEMENT)
          ========================================================================= */}
      <section id="for-societies" className="py-20 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-gradient-to-br from-[#153D32] to-[#1E5747] rounded-3xl p-8 sm:p-14 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute right-0 bottom-0 w-96 h-96 bg-[#E9A15B]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            <div className="lg:col-span-8 space-y-4">
              <span className="text-[10px] uppercase font-black tracking-wider text-[#E9A15B] px-3 py-1 rounded-full bg-white/10 inline-block">
                FOR RESIDENT WELFARE ASSOCIATIONS (RWA)
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">
                Partner Your Society with SocietyCook
              </h2>
              <p className="text-sm sm:text-base text-white/80 max-w-2xl leading-relaxed">
                Reduce daily external visitor foot traffic by 60%, streamline gate security through MyGate / NoBrokerHood sync, and give your residents reliable, verified cooking and dishwashing services.
              </p>
              <div className="flex flex-wrap gap-4 text-xs font-bold text-white/90 pt-2">
                <span>✓ Zero setup fees for societies</span>
                <span>✓ Real-time staff audit logs</span>
                <span>✓ Police verification dossier for every cook</span>
              </div>
            </div>

            <div className="lg:col-span-4 text-left lg:text-right">
              <button
                type="button"
                onClick={() => setShowRwaModal(true)}
                className="px-8 py-4 rounded-2xl bg-[#E9A15B] hover:bg-[#D8904A] text-[#153D32] font-black text-xs uppercase tracking-wider shadow-lg transition-transform hover:scale-105 cursor-pointer"
              >
                Schedule a Society Demo
              </button>
            </div>
          </div>
        </div>
      </section>


      {/* =========================================================================
          SECTION M: FREQUENTLY ASKED QUESTIONS
          ========================================================================= */}
      <section className="py-20 bg-white dark:bg-[#14231D] border-y border-[#DDE9D8]/80 dark:border-white/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#153D32]/10 dark:bg-white/10 text-[#153D32] dark:text-[#E9A15B] text-xs font-bold mb-3">
              <HelpCircle className="w-3.5 h-3.5" />
              GOT QUESTIONS?
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#153D32] dark:text-white tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="rounded-2xl border border-[#DDE9D8] dark:border-white/10 bg-[#FBF7EF] dark:bg-[#182821] overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-[#202A25] dark:text-white cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-[#153D32] dark:text-[#E9A15B] transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs text-[#64746B] dark:text-slate-300 leading-relaxed border-t border-[#DDE9D8]/40 dark:border-white/5 animate-in fade-in">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>


      {/* =========================================================================
          SECTION N: FINAL CONVERSION BANNER
          ========================================================================= */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/images/conversion_banner_home.jpg"
            alt="Serene and beautiful modern home"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#153D32]/95 via-[#153D32]/90 to-[#1E5747]/85" />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 text-center text-white space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[#E9A15B] text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            START WITH ZERO RISK
          </div>

          <h2 className="font-serif text-3xl sm:text-5xl md:text-6xl font-bold leading-tight">
            Ready to enjoy more living and less chores?
          </h2>

          <p className="text-sm sm:text-base text-white/80 max-w-xl mx-auto font-medium">
            Join your apartment neighbours today. Lock in community-discounted pricing with verified cooks and dishwashing specialists.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#E9A15B] hover:bg-[#D8904A] text-[#153D32] font-black text-xs uppercase tracking-wider shadow-xl transition-all hover:scale-105"
            >
              Get Started in Your Society
            </Link>
            <a
              href="#service-finder"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-colors"
            >
              Browse Services
            </a>
          </div>
        </div>
      </section>


      {/* =========================================================================
          SECTION O: PREMIUM FOOTER
          ========================================================================= */}
      <footer className="bg-[#121E19] text-[#EDE8DF] pt-16 pb-12 border-t border-white/10 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-white/10">
            
            {/* Brand column */}
            <div className="md:col-span-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#153D32] flex items-center justify-center text-[#E9A15B] border border-[#E9A15B]/30">
                  <ChefHat className="w-5 h-5 text-[#E9A15B]" />
                </div>
                <span className="font-serif font-black text-lg text-white">SocietyCook</span>
              </div>
              <p className="text-[#A4B5AC] text-xs leading-relaxed max-w-sm">
                Hyperlocal community household services platform. Connecting residential apartment complexes with verified cooks and kitchen care professionals.
              </p>
              <div className="text-[11px] text-[#A4B5AC]">
                Primary Tagline: <strong className="text-white">More living. Less chores.</strong>
              </div>
            </div>

            {/* Service Links */}
            <div className="md:col-span-2 space-y-3">
              <div className="font-bold text-white uppercase tracking-wider text-[11px]">Services</div>
              <ul className="space-y-2 text-[#A4B5AC]">
                <li><a href="#services" className="hover:text-white transition-colors">Home Cooking</a></li>
                <li><a href="#services" className="hover:text-white transition-colors">Utensil Care & Dishwashing</a></li>
                <li><a href="#services" className="hover:text-white transition-colors">Complete Kitchen Care</a></li>
                <li><a href="#community-pricing" className="hover:text-white transition-colors">Group Pricing</a></li>
              </ul>
            </div>

            {/* Covered Societies */}
            <div className="md:col-span-3 space-y-3">
              <div className="font-bold text-white uppercase tracking-wider text-[11px]">Active Societies</div>
              <ul className="space-y-2 text-[#A4B5AC]">
                <li>Greenwood Residency, Bellandur</li>
                <li>Palm Meadows, Whitefield</li>
                <li>Silver Oak Enclave, HSR Layout</li>
                <li>Prestige Tech Vista, Kadubeesanahalli</li>
              </ul>
            </div>

            {/* Contact & Legal */}
            <div className="md:col-span-3 space-y-3">
              <div className="font-bold text-white uppercase tracking-wider text-[11px]">Support & Contact</div>
              <p className="text-[#A4B5AC]">
                Have a question or want to onboard your society?
              </p>
              <div className="text-[#E9A15B] font-bold">
                support@societycook.in
              </div>
              <div className="text-[11px] text-[#A4B5AC] pt-2">
                Bengaluru, Karnataka, India
              </div>
            </div>

          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#A4B5AC] gap-4">
            <div>
              © {new Date().getFullYear()} SocietyCook Technologies Pvt. Ltd. All rights reserved.
            </div>
            <div className="flex items-center gap-6">
              <a href="#how-it-works" className="hover:text-white">How It Works</a>
              <a href="#community-pricing" className="hover:text-white">Pricing</a>
              <a href="#for-societies" className="hover:text-white">RWA Partnerships</a>
            </div>
          </div>
        </div>
      </footer>


      {/* =========================================================================
          RWA SOCIETY DEMO MODAL DIALOG
          ========================================================================= */}
      {showRwaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#182821] rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-[#DDE9D8] dark:border-white/10 shadow-2xl relative text-left">
            <button
              type="button"
              onClick={() => setShowRwaModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            {rwaSuccess ? (
              <div className="text-center py-8 space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-xl font-bold text-[#153D32] dark:text-white">Demo Scheduled!</h3>
                <p className="text-xs text-[#64746B] dark:text-slate-300">
                  Our Community Manager will connect with you within 2 hours to coordinate the trial in your apartment complex.
                </p>
              </div>
            ) : (
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#153D32]/10 text-[#153D32] dark:text-[#E9A15B] text-xs font-bold mb-2">
                  <Building2 className="w-3.5 h-3.5" />
                  RWA PARTNERSHIP
                </div>
                <h3 className="font-serif text-2xl font-bold text-[#153D32] dark:text-white mb-2">
                  Schedule Society Demo
                </h3>
                <p className="text-xs text-[#64746B] dark:text-slate-300 mb-6">
                  Experience a 2-day zero-cost trial of coordinated cooking and dishwashing in your apartment tower.
                </p>

                <form onSubmit={handleRwaSubmit} className="space-y-4 text-xs font-semibold">
                  <div>
                    <label className="block text-[#202A25] dark:text-white mb-1">Your Name</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Ramesh Iyer"
                      value={rwaForm.name}
                      onChange={(e) => setRwaForm({ ...rwaForm, name: e.target.value })}
                      className="w-full h-11 px-3.5 rounded-xl bg-[#FBF7EF] dark:bg-white/5 border border-[#DDE9D8] dark:border-white/10 text-xs focus:outline-none focus:ring-2 focus:ring-[#153D32]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[#202A25] dark:text-white mb-1">Society Name</label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. Sobha Iris"
                        value={rwaForm.society}
                        onChange={(e) => setRwaForm({ ...rwaForm, society: e.target.value })}
                        className="w-full h-11 px-3.5 rounded-xl bg-[#FBF7EF] dark:bg-white/5 border border-[#DDE9D8] dark:border-white/10 text-xs focus:outline-none focus:ring-2 focus:ring-[#153D32]"
                      />
                    </div>
                    <div>
                      <label className="block text-[#202A25] dark:text-white mb-1">Total Flats</label>
                      <input
                        type="text"
                        placeholder="e.g. 350"
                        value={rwaForm.flats}
                        onChange={(e) => setRwaForm({ ...rwaForm, flats: e.target.value })}
                        className="w-full h-11 px-3.5 rounded-xl bg-[#FBF7EF] dark:bg-white/5 border border-[#DDE9D8] dark:border-white/10 text-xs focus:outline-none focus:ring-2 focus:ring-[#153D32]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[#202A25] dark:text-white mb-1">Phone Number</label>
                      <input
                        required
                        type="tel"
                        placeholder="e.g. 9876543210"
                        value={rwaForm.phone}
                        onChange={(e) => setRwaForm({ ...rwaForm, phone: e.target.value })}
                        className="w-full h-11 px-3.5 rounded-xl bg-[#FBF7EF] dark:bg-white/5 border border-[#DDE9D8] dark:border-white/10 text-xs focus:outline-none focus:ring-2 focus:ring-[#153D32]"
                      />
                    </div>
                    <div>
                      <label className="block text-[#202A25] dark:text-white mb-1">Email</label>
                      <input
                        required
                        type="email"
                        placeholder="e.g. rwa@sobhairis.com"
                        value={rwaForm.email}
                        onChange={(e) => setRwaForm({ ...rwaForm, email: e.target.value })}
                        className="w-full h-11 px-3.5 rounded-xl bg-[#FBF7EF] dark:bg-white/5 border border-[#DDE9D8] dark:border-white/10 text-xs focus:outline-none focus:ring-2 focus:ring-[#153D32]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full h-12 rounded-xl bg-[#153D32] hover:bg-[#1E5747] text-white font-bold text-xs uppercase tracking-wider shadow-md transition-colors mt-2"
                  >
                    Confirm Demo Request
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

// Fallback top professionals for immediate display
const DEFAULT_PROS = [
  {
    id: 1,
    name: 'Ramesh Kumar',
    rating: 4.9,
    professional_type: 'MULTI_SKILLED',
    experience_years: 7,
    specialties: ['North Indian', 'Homestyle Phulkas', 'Kitchen Care'],
    bio: '7 years preparing hygienic homestyle meals and pristine kitchen hygiene across Bellandur societies.'
  },
  {
    id: 2,
    name: 'Sunita Devi',
    rating: 4.85,
    professional_type: 'DISHWASHER',
    experience_years: 5,
    specialties: ['Pressure Cookers', 'Sanitization', 'Deep Scour'],
    bio: 'Dedicated utensil care specialist. Ensures zero oil grease on heavy kadhais and spotless sink counters.'
  },
  {
    id: 3,
    name: 'Lakshmi Narayan',
    rating: 4.95,
    professional_type: 'COOK',
    experience_years: 8,
    specialties: ['South Indian', 'Millet Dosa', 'Sattvic Food'],
    bio: 'Authentic South Indian culinary specialist with master skills in dosas, idlis, and preservative-free sambhar.'
  },
  {
    id: 4,
    name: 'Geeta Bai',
    rating: 4.88,
    professional_type: 'MULTI_SKILLED',
    experience_years: 6,
    specialties: ['Gujarati', 'Jain Cooking', 'Pristine Cleanliness'],
    bio: 'Expert in pure vegetarian and Jain cooking followed by immaculate counter and sink sanitization.'
  }
];

const FAQS = [
  {
    q: 'How does SocietyCook differ from traditional domestic hiring or generic platforms?',
    a: 'Traditional domestic hiring involves expensive individual search, unannounced leaves, and high brokerage fees. Generic platforms send gig workers randomly from 15 km away. SocietyCook clusters demand inside the exact same apartment complex: 4 to 5 neighbours share routes. You receive individualized services in your kitchen at 30-35% lower monthly costs, while professionals get high stable incomes with zero travel downtime.'
  },
  {
    q: 'Do households share food or receive individual cooking in their private kitchens?',
    a: 'Every household receives private, individualized cooking services directly inside their own kitchen! Your assigned cook prepares meals exclusively for your family tailored to your spice, salt, oil, and dietary requirements during your dedicated 45-minute recurring time slot.'
  },
  {
    q: 'How does the Complete Kitchen Care (Combo) plan work between two professionals?',
    a: 'Under the Combo plan, your cooking and dishwashing appointments are synchronized. For instance, the cook arrives at 7:30 AM to prepare breakfast and pack lunch, and at 8:15 AM our utensil care specialist arrives to wash all cooking vessels, pressure cookers, and breakfast plates while wiping down the sink and countertops.'
  },
  {
    q: 'What happens when our primary cook or dishwasher takes a leave?',
    a: 'SocietyCook provides automated backup allocation. Our system automatically assigns a pre-cleared standby professional who already holds apartment gate clearance and knows the building layout. You receive an instant dashboard notification with the backup staff details.'
  },
  {
    q: 'How does daily attendance verification work?',
    a: 'Each morning, your resident dashboard displays a unique 4-digit daily session OTP. When the professional arrives at your flat, they enter this OTP on their app to check in and check out. This guarantees 100% transparent attendance records and ensures you only pay for completed sessions.'
  },
  {
    q: 'Can our society\'s RWA integrate SocietyCook with MyGate or NoBrokerHood?',
    a: 'Yes. SocietyCook provides seamless gate clearance integration. All verified professionals have pre-registered digital IDs, police verification dossiers, and assigned visitor badges, reducing random outside foot traffic by over 60%.'
  }
];
