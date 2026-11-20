import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChefHat,
  Users,
  ShieldCheck,
  Clock,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Building2,
  Percent,
  RefreshCw,
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
  HelpCircle,
  Coins,
  Navigation,
  HeartPulse,
  Send,
  X,
  Phone,
  Mail,
  Home
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

  // Dynamic pricing algorithm
  const calculatePricing = () => {
    let base = 5000;
    let discount = 1000;
    let proFloor = 18000;

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
    <div className="min-h-screen bg-[#FBF7EF] dark:bg-[#0D1613] text-[#202A25] dark:text-[#EDE8DF] font-sans transition-colors selection:bg-[#E9A15B]/30">
      
      {/* =========================================================================
          SECTION B: CINEMATIC EDITORIAL HERO
          ========================================================================= */}
      <section className="relative overflow-hidden pt-8 pb-16 sm:pt-12 sm:pb-24 lg:pt-16 lg:pb-28 border-b border-[#E6DFD3] dark:border-white/10">
        {/* Ambient warm gradient lighting */}
        <div className="absolute top-0 right-0 w-3/4 h-full opacity-20 dark:opacity-25 pointer-events-none bg-radial from-[#153D32] via-[#E9A15B]/20 to-transparent blur-3xl" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            
            {/* Left Content Column */}
            <div className="lg:col-span-7 text-left space-y-6">
              
              {/* Origin Kicker */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#153D32]/8 dark:bg-white/10 border border-[#153D32]/15 dark:border-white/15 text-[#153D32] dark:text-[#E9A15B] text-[11px] font-bold tracking-[0.18em] uppercase">
                <Sparkles className="w-3.5 h-3.5 text-[#E9A15B]" />
                Hyperlocal Household Service Network
              </div>

              {/* Editorial Display Heading */}
              <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-[4.25rem] font-bold text-[#153D32] dark:text-white leading-[1.08] tracking-tight">
                More living. <br />
                <span className="text-[#964208] dark:text-[#E9A15B] italic font-serif font-normal">Less chores.</span>
              </h1>

              {/* Sub-headline prose */}
              <p className="text-base sm:text-lg text-[#42524A] dark:text-slate-300 max-w-xl font-medium leading-relaxed">
                Transform daily home life with verified in-home cooking and utensil care specialists — shared seamlessly with neighbours in your apartment tower at up to 35% community savings.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                <a
                  href="#service-finder"
                  className="px-7 py-3.5 rounded-2xl bg-[#153D32] hover:bg-[#1E5244] text-white font-bold text-sm shadow-lg shadow-[#153D32]/20 inline-flex items-center justify-center gap-2.5 transition-all hover:-translate-y-0.5 cursor-pointer"
                >
                  <span>Find Services in Your Tower</span>
                  <ArrowRight className="w-4 h-4 text-[#E9A15B]" />
                </a>
                <a
                  href="#community-pricing"
                  className="px-7 py-3.5 rounded-2xl bg-white dark:bg-white/5 border border-[#E6DFD3] dark:border-white/10 hover:border-[#153D32]/40 text-[#202A25] dark:text-white font-bold text-sm shadow-xs transition-colors text-center cursor-pointer"
                >
                  Calculate Group Savings
                </a>
              </div>

              {/* Editorial Hairline Trust Indicators */}
              <div className="pt-4 border-t border-[#E6DFD3] dark:border-white/10 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs font-semibold text-[#42524A] dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#153D32] dark:text-[#E9A15B]" />
                  450+ Verified Society Staff
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#153D32] dark:text-[#E9A15B]" />
                  Zero Agency Brokerage
                </span>
                <span className="flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 text-[#153D32] dark:text-[#E9A15B]" />
                  Guaranteed Backup Cover
                </span>
              </div>
            </div>

            {/* Right Visual Image Frame */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-[#E6DFD3] dark:border-white/10 aspect-[4/5] max-w-md mx-auto group">
                <picture>
                  <source media="(max-width: 640px)" srcSet="/images/hero_kitchen_indian-mobile.webp" type="image/webp" />
                  <source srcSet="/images/hero_kitchen_indian.webp" type="image/webp" />
                  <img
                    src="/images/hero_kitchen_indian.jpg"
                    alt="Modern warm sun-drenched Indian apartment kitchen"
                    fetchPriority="high"
                    decoding="async"
                    width="800"
                    height="1000"
                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-700"
                  />
                </picture>
                
                {/* Gradient shading */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0E2922]/95 via-[#0E2922]/30 to-transparent" />
                
                {/* Top Badge: Anchored safely inside */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 dark:bg-[#153D32]/90 backdrop-blur-md text-[11px] font-extrabold text-[#153D32] dark:text-white shadow-sm border border-white/40">
                    <Building2 className="w-3.5 h-3.5 text-[#964208] dark:text-[#E9A15B]" />
                    Tower A Morning Schedule
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#E9A15B] text-[#153D32] text-[10px] font-black uppercase tracking-wider shadow-sm">
                    Live Cluster
                  </span>
                </div>

                {/* Bottom Plaque: Anchored inside with zero clipping */}
                <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-[#E9A15B] animate-pulse" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-white/90">
                      Coordinated In-Home Care
                    </span>
                  </div>
                  <h3 className="font-serif text-lg font-bold leading-snug">
                    Fresh homestyle cooking followed by sparkling dish sanitization.
                  </h3>
                  <div className="flex items-center justify-between text-xs text-white/80 mt-2 pt-2 border-t border-white/15">
                    <span>Greenwood Residency (Bellandur)</span>
                    <span className="font-bold text-[#E9A15B]">32% Saved</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Integrated Floating Service Finder Console */}
          <div id="service-finder" className="mt-12 bg-white dark:bg-[#14231D] rounded-3xl p-5 sm:p-7 shadow-xl border border-[#E6DFD3] dark:border-white/10">
            <div className="text-xs uppercase font-extrabold tracking-wider text-[#42524A] dark:text-slate-400 mb-4 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-[#153D32] dark:text-[#E9A15B]" />
              Check Live Specialist Availability in Your Society
            </div>

            <form onSubmit={handleFinderSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              {/* Field 1: Society Selection */}
              <div>
                <label className="block text-xs font-bold text-[#202A25] dark:text-slate-200 mb-1.5">
                  Apartment Complex
                </label>
                <div className="relative">
                  <select
                    value={finderSociety}
                    onChange={(e) => setFinderSociety(e.target.value)}
                    className="w-full h-12 pl-3.5 pr-8 rounded-xl bg-[#FBF7EF] dark:bg-white/5 border border-[#E6DFD3] dark:border-white/10 text-xs font-bold text-[#202A25] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#153D32] cursor-pointer"
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
                  Desired Household Service
                </label>
                <select
                  value={finderService}
                  onChange={(e) => setFinderService(e.target.value)}
                  className="w-full h-12 px-3.5 rounded-xl bg-[#FBF7EF] dark:bg-white/5 border border-[#E6DFD3] dark:border-white/10 text-xs font-bold text-[#202A25] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#153D32] cursor-pointer"
                >
                  <option value="COOKING" className="dark:bg-slate-900">Home Cooking (Tailored Meals)</option>
                  <option value="DISHWASHING" className="dark:bg-slate-900">Utensil Care & Dishwashing</option>
                  <option value="COMBO" className="dark:bg-slate-900">Complete Kitchen Care (Combo)</option>
                </select>
              </div>

              {/* Field 3: Schedule Window */}
              <div>
                <label className="block text-xs font-bold text-[#202A25] dark:text-slate-200 mb-1.5">
                  Daily Time Window
                </label>
                <select
                  value={finderSlot}
                  onChange={(e) => setFinderSlot(e.target.value)}
                  className="w-full h-12 px-3.5 rounded-xl bg-[#FBF7EF] dark:bg-white/5 border border-[#E6DFD3] dark:border-white/10 text-xs font-bold text-[#202A25] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#153D32] cursor-pointer"
                >
                  <option value="MORNING" className="dark:bg-slate-900">Morning (7:00 AM – 10:30 AM)</option>
                  <option value="EVENING" className="dark:bg-slate-900">Evening (6:30 PM – 9:30 PM)</option>
                  <option value="FULL_DAY" className="dark:bg-slate-900">Morning & Evening Routine</option>
                </select>
              </div>

              {/* Submit CTA */}
              <div>
                <button
                  type="submit"
                  className="w-full h-12 rounded-xl bg-[#153D32] hover:bg-[#1E5244] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-[#153D32]/20 transition-all active:scale-98 cursor-pointer"
                >
                  <span>Find Available Staff</span>
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
      <section className="py-12 bg-white dark:bg-[#121E19] border-b border-[#E6DFD3] dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
            
            <div className="space-y-2 p-3 rounded-2xl bg-[#FBF7EF] dark:bg-white/5 border border-[#E6DFD3]/80 dark:border-white/5">
              <div className="w-10 h-10 rounded-xl bg-[#153D32]/10 dark:bg-white/10 text-[#153D32] dark:text-[#E9A15B] flex items-center justify-center mx-auto">
                <Building2 className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-xs sm:text-sm text-[#202A25] dark:text-white">Society Clusters</h4>
              <p className="text-[11px] text-[#42524A] dark:text-slate-400 leading-tight">Same tower flats share route</p>
            </div>

            <div className="space-y-2 p-3 rounded-2xl bg-[#FBF7EF] dark:bg-white/5 border border-[#E6DFD3]/80 dark:border-white/5">
              <div className="w-10 h-10 rounded-xl bg-[#964208]/15 text-[#964208] dark:text-[#E9A15B] flex items-center justify-center mx-auto">
                <Percent className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-xs sm:text-sm text-[#202A25] dark:text-white">Up to 35% Savings</h4>
              <p className="text-[11px] text-[#42524A] dark:text-slate-400 leading-tight">Demand lowers household rate</p>
            </div>

            <div className="space-y-2 p-3 rounded-2xl bg-[#FBF7EF] dark:bg-white/5 border border-[#E6DFD3]/80 dark:border-white/5">
              <div className="w-10 h-10 rounded-xl bg-[#153D32]/10 dark:bg-white/10 text-[#153D32] dark:text-[#E9A15B] flex items-center justify-center mx-auto">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-xs sm:text-sm text-[#202A25] dark:text-white">100% Verified Staff</h4>
              <p className="text-[11px] text-[#42524A] dark:text-slate-400 leading-tight">Police clearance & trials</p>
            </div>

            <div className="space-y-2 p-3 rounded-2xl bg-[#FBF7EF] dark:bg-white/5 border border-[#E6DFD3]/80 dark:border-white/5">
              <div className="w-10 h-10 rounded-xl bg-[#964208]/15 text-[#964208] dark:text-[#E9A15B] flex items-center justify-center mx-auto">
                <Clock className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-xs sm:text-sm text-[#202A25] dark:text-white">Zero Commute Gaps</h4>
              <p className="text-[11px] text-[#42524A] dark:text-slate-400 leading-tight">Staff walks in minutes</p>
            </div>

            <div className="col-span-2 md:col-span-1 space-y-2 p-3 rounded-2xl bg-[#FBF7EF] dark:bg-white/5 border border-[#E6DFD3]/80 dark:border-white/5">
              <div className="w-10 h-10 rounded-xl bg-[#153D32]/10 dark:bg-white/10 text-[#153D32] dark:text-[#E9A15B] flex items-center justify-center mx-auto">
                <RefreshCw className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-xs sm:text-sm text-[#202A25] dark:text-white">Guaranteed Backup</h4>
              <p className="text-[11px] text-[#42524A] dark:text-slate-400 leading-tight">Pre-cleared standby coverage</p>
            </div>

          </div>
        </div>
      </section>


      {/* =========================================================================
          SECTION D: SIGNATURE SERVICE SHOWCASE (3 CATEGORIES)
          ========================================================================= */}
      <section id="services" className="py-20 lg:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#153D32]/10 dark:bg-white/10 text-[#153D32] dark:text-[#E9A15B] text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            COMPREHENSIVE RESIDENTIAL SERVICES
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[#153D32] dark:text-white tracking-tight">
            Our Signature Services
          </h2>
          <p className="text-sm sm:text-base text-[#42524A] dark:text-slate-300 mt-3 font-medium">
            Designed specifically for modern apartment residences. Choose tailored cooking, sparkling dish hygiene, or an integrated kitchen care plan.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Service Card 1: Home Cooking */}
          <div className="bg-white dark:bg-[#14231D] rounded-3xl overflow-hidden border border-[#E6DFD3] dark:border-white/10 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col group">
            <div className="relative aspect-[16/10] overflow-hidden">
              <picture>
                <source media="(max-width: 640px)" srcSet="/images/service_home_cooking-mobile.webp" type="image/webp" />
                <source srcSet="/images/service_home_cooking.webp" type="image/webp" />
                <img
                  src="/images/service_home_cooking.jpg"
                  alt="Homestyle Indian culinary preparation"
                  loading="lazy"
                  decoding="async"
                  width="600"
                  height="375"
                  className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-500"
                />
              </picture>
              <div className="absolute top-3.5 left-3.5 bg-[#153D32] text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md shadow-xs">
                Cuisine Craft
              </div>
            </div>
            
            <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <h3 className="font-serif text-xl font-bold text-[#153D32] dark:text-white">
                    Professional Home Cooking
                  </h3>
                  <span className="text-xs font-black text-[#964208] dark:text-[#E9A15B]">
                    From ₹2,800/mo
                  </span>
                </div>
                <p className="text-xs text-[#42524A] dark:text-slate-300 leading-relaxed font-medium">
                  Fresh, nutritious daily meals prepared exclusively in your kitchen. North Indian, South Indian, Jain, and customized dietary profiles.
                </p>

                <ul className="space-y-2 text-xs font-semibold text-[#202A25] dark:text-slate-200 pt-2">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#153D32] dark:text-[#E9A15B] shrink-0" />
                    Dedicated 45-minute cooking appointment
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#153D32] dark:text-[#E9A15B] shrink-0" />
                    Precise oil, spice, and salt balance
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#153D32] dark:text-[#E9A15B] shrink-0" />
                    Hot phulkas, dal, and fresh seasonal sabzis
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#153D32] dark:text-[#E9A15B] shrink-0" />
                    Verified in-kitchen tasting trial before start
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-[#E6DFD3] dark:border-white/10">
                <Link
                  to={user ? '/app/cooks' : '/register?service=COOKING'}
                  className="w-full py-3 rounded-xl bg-[#153D32]/8 hover:bg-[#153D32] text-[#153D32] hover:text-white dark:bg-white/10 dark:hover:bg-[#153D32] dark:text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <span>Explore Cooking Plans</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Service Card 2: Dishwashing */}
          <div className="bg-white dark:bg-[#14231D] rounded-3xl overflow-hidden border border-[#E6DFD3] dark:border-white/10 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col group">
            <div className="relative aspect-[16/10] overflow-hidden">
              <picture>
                <source media="(max-width: 640px)" srcSet="/images/service_dishwashing-mobile.webp" type="image/webp" />
                <source srcSet="/images/service_dishwashing.webp" type="image/webp" />
                <img
                  src="/images/service_dishwashing.jpg"
                  alt="Stainless steel cookware scrubbing and sink area care"
                  loading="lazy"
                  decoding="async"
                  width="600"
                  height="375"
                  className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-500"
                />
              </picture>
              <div className="absolute top-3.5 left-3.5 bg-[#964208] text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md shadow-xs">
                Hygiene Specialist
              </div>
            </div>
            
            <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <h3 className="font-serif text-xl font-bold text-[#153D32] dark:text-white">
                    Utensil Care & Dishwashing
                  </h3>
                  <span className="text-xs font-black text-[#964208] dark:text-[#E9A15B]">
                    From ₹1,500/mo
                  </span>
                </div>
                <p className="text-xs text-[#42524A] dark:text-slate-300 leading-relaxed font-medium">
                  Spotless dishwashing with thorough sink area sanitization, grease-free kadhais, and pressure cooker care.
                </p>

                <ul className="space-y-2 text-xs font-semibold text-[#202A25] dark:text-slate-200 pt-2">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#153D32] dark:text-[#E9A15B] shrink-0" />
                    Dedicated 30-minute washing window
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#153D32] dark:text-[#E9A15B] shrink-0" />
                    Deep scrub of heavy kadhais and cookers
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#153D32] dark:text-[#E9A15B] shrink-0" />
                    Complete sink rim wipe & counter sanitization
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#153D32] dark:text-[#E9A15B] shrink-0" />
                    Utensil tier matched to your household size
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-[#E6DFD3] dark:border-white/10">
                <Link
                  to={user ? '/app/cooks' : '/register?service=DISHWASHING'}
                  className="w-full py-3 rounded-xl bg-[#153D32]/8 hover:bg-[#153D32] text-[#153D32] hover:text-white dark:bg-white/10 dark:hover:bg-[#153D32] dark:text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <span>Explore Dishwashing Plans</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Service Card 3: Complete Combo */}
          <div className="bg-white dark:bg-[#14231D] rounded-3xl overflow-hidden border-2 border-[#153D32] dark:border-[#E9A15B] shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col group relative">
            <div className="absolute top-3.5 right-3.5 z-10 bg-[#E9A15B] text-[#153D32] text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-md">
              Most Popular
            </div>

            <div className="relative aspect-[16/10] overflow-hidden">
              <picture>
                <source media="(max-width: 640px)" srcSet="/images/service_combo_care-mobile.webp" type="image/webp" />
                <source srcSet="/images/service_combo_care.webp" type="image/webp" />
                <img
                  src="/images/service_combo_care.jpg"
                  alt="Synchronized meal prep and immaculate countertop"
                  loading="lazy"
                  decoding="async"
                  width="600"
                  height="375"
                  className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-500"
                />
              </picture>
              <div className="absolute top-3.5 left-3.5 bg-[#153D32] text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md shadow-xs">
                All-in-One Solution
              </div>
            </div>
            
            <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <h3 className="font-serif text-xl font-bold text-[#153D32] dark:text-white">
                    Complete Kitchen Care
                  </h3>
                  <span className="text-xs font-black text-[#964208] dark:text-[#E9A15B]">
                    From ₹4,600/mo
                  </span>
                </div>
                <p className="text-xs text-[#42524A] dark:text-slate-300 leading-relaxed font-medium">
                  The ultimate kitchen peace of mind. Cook prepares your meals, followed immediately by professional dish and counter sanitization.
                </p>

                <ul className="space-y-2 text-xs font-semibold text-[#202A25] dark:text-slate-200 pt-2">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#153D32] dark:text-[#E9A15B] shrink-0" />
                    Synchronized 75-minute back-to-back routine
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#153D32] dark:text-[#E9A15B] shrink-0" />
                    Never touch an unwashed vessel again
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#153D32] dark:text-[#E9A15B] shrink-0" />
                    Consolidated single monthly subscription
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#153D32] dark:text-[#E9A15B] shrink-0" />
                    Dual standby cover for both professionals
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-[#E6DFD3] dark:border-white/10">
                <Link
                  to={user ? '/app/groups' : '/register?service=COMBO'}
                  className="w-full py-3 rounded-xl bg-[#153D32] hover:bg-[#1E5244] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-[#153D32]/20 transition-colors cursor-pointer"
                >
                  <span>Explore Combo Plans</span>
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
      <section className="py-20 lg:py-28 bg-white dark:bg-[#121E19] border-y border-[#E6DFD3] dark:border-white/10 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Left Narrative */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#964208]/15 text-[#964208] dark:text-[#E9A15B] text-xs font-bold">
                <HeartHandshake className="w-3.5 h-3.5" />
                EVERYDAY COMFORT & TIME SAVINGS
              </div>

              <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[#153D32] dark:text-white leading-[1.15]">
                Spend your evenings on what actually matters.
              </h2>

              <p className="text-sm sm:text-base text-[#42524A] dark:text-slate-300 leading-relaxed font-medium">
                Between high-pressure professional work, child pickups, and urban traffic, the last thing you should face at the end of the day is chopping vegetables or facing a sink piled with heavy cookware.
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-[#FBF7EF] dark:bg-white/5 border border-[#E6DFD3] dark:border-white/10">
                  <div className="w-8 h-8 rounded-xl bg-[#153D32] text-[#E9A15B] flex items-center justify-center font-serif font-bold text-xs shrink-0">
                    01
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#202A25] dark:text-white">Fresh, warm food right on time</h4>
                    <p className="text-xs text-[#42524A] dark:text-slate-400 mt-1 leading-relaxed">
                      No greasy restaurant takeaways or cold delivery boxes. Nutritious home-cooked food tailored for your family.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-2xl bg-[#FBF7EF] dark:bg-white/5 border border-[#E6DFD3] dark:border-white/10">
                  <div className="w-8 h-8 rounded-xl bg-[#964208] text-white flex items-center justify-center font-serif font-bold text-xs shrink-0">
                    02
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#202A25] dark:text-white">Gleaming countertops and clean sink</h4>
                    <p className="text-xs text-[#42524A] dark:text-slate-400 mt-1 leading-relaxed">
                      Wake up to an empty, sanitized dish rack and spotless surfaces every morning. Clean peace of mind before your day begins.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Image */}
            <div className="lg:col-span-6">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-[#E6DFD3] dark:border-white/10 aspect-[4/3]">
                <picture>
                  <source media="(max-width: 640px)" srcSet="/images/lifestyle_family_meal-mobile.webp" type="image/webp" />
                  <source srcSet="/images/lifestyle_family_meal.webp" type="image/webp" />
                  <img
                    src="/images/lifestyle_family_meal.jpg"
                    alt="Indian family dining happily at home"
                    loading="lazy"
                    decoding="async"
                    width="600"
                    height="450"
                    className="w-full h-full object-cover"
                  />
                </picture>
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 text-white">
                  <p className="font-serif italic text-base sm:text-lg leading-snug">
                    "Since our 4 flats in Tower A formed a SocietyCook group, cooking and utensil washing run on auto-pilot. We save ₹3,000 every single month."
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
          SECTION F: COMMUNITY-FIRST DIFFERENTIATOR (TOWER VISUALIZER)
          ========================================================================= */}
      <section className="py-20 lg:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#153D32]/10 dark:bg-white/10 text-[#153D32] dark:text-[#E9A15B] text-xs font-bold mb-3">
            <Users className="w-3.5 h-3.5" />
            HYPERLOCAL DEMAND CONCENTRATION
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[#153D32] dark:text-white tracking-tight">
            Good neighbours. Better living.
          </h2>
          <p className="text-sm sm:text-base text-[#42524A] dark:text-slate-300 mt-3 font-medium">
            Traditional domestic hiring forces staff through hours of city traffic.
            In SocietyCook, verified specialists move seamlessly between flats in your own apartment tower.
          </p>
        </div>

        {/* Visual Tower Flowchart */}
        <div className="bg-white dark:bg-[#14231D] rounded-3xl p-6 sm:p-10 border border-[#E6DFD3] dark:border-white/10 shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Visual Tower Diagram */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E6DFD3] dark:border-white/10">
                <span className="font-bold text-sm text-[#153D32] dark:text-[#E9A15B] flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Tower A Morning Roster (Greenwood Residency)
                </span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                  Synchronized Cluster
                </span>
              </div>

              {/* Slot 1: Flat A-402 */}
              <div className="p-4 rounded-2xl bg-[#FBF7EF] dark:bg-white/5 border border-[#E6DFD3] dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#153D32] text-white flex items-center justify-center font-bold text-xs shrink-0">
                    402
                  </div>
                  <div>
                    <div className="font-bold text-xs sm:text-sm text-[#202A25] dark:text-white">Flat A-402 (Sharma Family)</div>
                    <div className="text-[11px] text-[#42524A] dark:text-slate-400">Breakfast & Lunch + Utensil Care</div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1.5 text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-[#153D32]/10 dark:bg-emerald-950 text-[#153D32] dark:text-emerald-300 font-bold whitespace-nowrap">
                    Cook: 07:30 – 08:15 AM
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-[#964208]/15 dark:bg-amber-950 text-[#964208] dark:text-[#E9A15B] font-bold whitespace-nowrap">
                    Wash: 08:15 – 08:45 AM
                  </span>
                </div>
              </div>

              {/* Elevator Transition */}
              <div className="flex items-center justify-center gap-2 text-[11px] font-bold text-[#42524A] dark:text-slate-400 py-1">
                <div className="h-4 w-px bg-[#E6DFD3] dark:bg-white/20" />
                <span>Zero road transit • 1-minute elevator ride</span>
                <div className="h-4 w-px bg-[#E6DFD3] dark:bg-white/20" />
              </div>

              {/* Slot 2: Flat A-501 */}
              <div className="p-4 rounded-2xl bg-[#FBF7EF] dark:bg-white/5 border border-[#E6DFD3] dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#153D32] text-white flex items-center justify-center font-bold text-xs shrink-0">
                    501
                  </div>
                  <div>
                    <div className="font-bold text-xs sm:text-sm text-[#202A25] dark:text-white">Flat A-501 (Iyer Residence)</div>
                    <div className="text-[11px] text-[#42524A] dark:text-slate-400">South Indian Routine + Full Kitchen Care</div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1.5 text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-[#153D32]/10 dark:bg-emerald-950 text-[#153D32] dark:text-emerald-300 font-bold whitespace-nowrap">
                    Cook: 08:15 – 09:00 AM
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-[#964208]/15 dark:bg-amber-950 text-[#964208] dark:text-[#E9A15B] font-bold whitespace-nowrap">
                    Wash: 09:00 – 09:30 AM
                  </span>
                </div>
              </div>

              {/* Elevator Transition */}
              <div className="flex items-center justify-center gap-2 text-[11px] font-bold text-[#42524A] dark:text-slate-400 py-1">
                <div className="h-4 w-px bg-[#E6DFD3] dark:bg-white/20" />
                <span>Zero road transit • 1-minute elevator ride</span>
                <div className="h-4 w-px bg-[#E6DFD3] dark:bg-white/20" />
              </div>

              {/* Slot 3: Flat A-603 */}
              <div className="p-4 rounded-2xl bg-[#FBF7EF] dark:bg-white/5 border border-[#E6DFD3] dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#153D32] text-white flex items-center justify-center font-bold text-xs shrink-0">
                    603
                  </div>
                  <div>
                    <div className="font-bold text-xs sm:text-sm text-[#202A25] dark:text-white">Flat A-603 (Verma Family)</div>
                    <div className="text-[11px] text-[#42524A] dark:text-slate-400">North Indian Homestyle Lunch Prep</div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1.5 text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-[#153D32]/10 dark:bg-emerald-950 text-[#153D32] dark:text-emerald-300 font-bold whitespace-nowrap">
                    Cook: 09:00 – 09:45 AM
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-[#964208]/15 dark:bg-amber-950 text-[#964208] dark:text-[#E9A15B] font-bold whitespace-nowrap">
                    Wash: 09:45 – 10:15 AM
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
                <p className="text-xs text-white/80 leading-relaxed font-medium">
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

              <div className="p-4 rounded-2xl bg-[#FBF7EF] dark:bg-white/5 border border-[#E6DFD3] dark:border-white/10 flex items-center gap-3">
                <ShieldCheck className="w-8 h-8 text-[#153D32] dark:text-[#E9A15B] shrink-0" />
                <div className="text-xs">
                  <span className="font-bold block text-[#202A25] dark:text-white">OTP-Verified Session Check-in</span>
                  <span className="text-[#42524A] dark:text-slate-400 font-medium">Zero disputes. You only pay for verified days.</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>


      {/* =========================================================================
          SECTION G: INTERACTIVE COMMUNITY PRICING CALCULATOR
          ========================================================================= */}
      <section id="community-pricing" className="py-20 lg:py-28 bg-white dark:bg-[#121E19] border-y border-[#E6DFD3] dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#153D32]/10 dark:bg-white/10 text-[#153D32] dark:text-[#E9A15B] text-xs font-bold mb-3">
              <Percent className="w-3.5 h-3.5" />
              TRANSPARENT VOLUME PRICING
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[#153D32] dark:text-white tracking-tight">
              Community Savings Calculator
            </h2>
            <p className="text-sm sm:text-base text-[#42524A] dark:text-slate-300 mt-3 font-medium">
              See exactly how much you and your neighbours save as your apartment group expands from 2 to 8 households.
            </p>
          </div>

          <div className="max-w-4xl mx-auto bg-[#FBF7EF] dark:bg-[#14231D] rounded-3xl p-6 sm:p-10 border border-[#E6DFD3] dark:border-white/10 shadow-xl">
            
            {/* Service Type Tabs */}
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-8 p-1.5 bg-white dark:bg-white/5 rounded-2xl border border-[#E6DFD3] dark:border-white/10">
              <button
                type="button"
                onClick={() => setCalcService('COOKING')}
                className={`py-2.5 px-2 sm:px-4 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  calcService === 'COOKING'
                    ? 'bg-[#153D32] text-white shadow-xs'
                    : 'text-[#42524A] dark:text-slate-300 hover:text-[#153D32]'
                }`}
              >
                <ChefHat className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Home Cooking</span>
              </button>

              <button
                type="button"
                onClick={() => setCalcService('DISHWASHING')}
                className={`py-2.5 px-2 sm:px-4 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  calcService === 'DISHWASHING'
                    ? 'bg-[#153D32] text-white shadow-xs'
                    : 'text-[#42524A] dark:text-slate-300 hover:text-[#153D32]'
                }`}
              >
                <Droplets className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Utensil Care</span>
              </button>

              <button
                type="button"
                onClick={() => setCalcService('COMBO')}
                className={`py-2.5 px-2 sm:px-4 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  calcService === 'COMBO'
                    ? 'bg-[#153D32] text-white shadow-xs'
                    : 'text-[#42524A] dark:text-slate-300 hover:text-[#153D32]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Complete Combo</span>
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
                    <span className="text-sm font-black text-[#153D32] dark:text-[#E9A15B] px-2.5 py-0.5 rounded-lg bg-white dark:bg-white/10 border border-[#E6DFD3] dark:border-white/10">
                      {calcHouseholds} Flats
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="8"
                    value={calcHouseholds}
                    onChange={(e) => setCalcHouseholds(Number(e.target.value))}
                    className="w-full accent-[#153D32] cursor-pointer h-2 bg-[#E6DFD3] dark:bg-slate-700 rounded-lg appearance-none"
                  />
                  <div className="flex justify-between text-[10px] text-[#42524A] dark:text-slate-400 font-bold mt-1.5">
                    <span>1 Flat (Solo)</span>
                    <span>4 Flats (Optimal)</span>
                    <span>8 Flats (Max Savings)</span>
                  </div>
                </div>

                {/* Sub-Option: Meal Type (for Cooking/Combo) */}
                {calcService !== 'DISHWASHING' && (
                  <div>
                    <label className="block text-xs font-bold text-[#202A25] dark:text-white mb-2">
                      Meal Schedule Window
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
                              : 'bg-white dark:bg-white/5 text-[#202A25] dark:text-slate-300 border-[#E6DFD3] dark:border-white/10'
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
                      Vessel & Cookware Volume Tier
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
                              : 'bg-white dark:bg-white/5 text-[#202A25] dark:text-slate-300 border-[#E6DFD3] dark:border-white/10'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Fair wage floor note */}
                <div className="p-3.5 rounded-2xl bg-white dark:bg-white/5 border border-[#E6DFD3] dark:border-white/10 text-xs text-[#42524A] dark:text-slate-400">
                  <strong className="text-[#202A25] dark:text-white flex items-center gap-1.5 mb-0.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#153D32] dark:text-[#E9A15B]" />
                    Guaranteed Fair Staff Compensation:
                  </strong>
                  Staff earns up to ₹{pricingResult.proPayout.toLocaleString('en-IN')}/mo in dedicated, concentrated blocks with zero transit downtime.
                </div>
              </div>

              {/* Output Display Card */}
              <div className="bg-white dark:bg-[#0E2922] rounded-3xl p-6 sm:p-8 border border-[#E6DFD3] dark:border-white/10 shadow-lg space-y-6">
                <div>
                  <span className="text-[10px] uppercase font-black tracking-wider text-[#42524A] dark:text-slate-400">
                    Your Household Rate
                  </span>
                  <div className="flex items-baseline gap-3 mt-1">
                    <span className="font-serif text-3xl sm:text-4xl font-extrabold text-[#153D32] dark:text-white">
                      ₹{pricingResult.groupPrice.toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs text-[#42524A] dark:text-slate-400 font-bold">/ month</span>
                    {pricingResult.savingsPercent > 0 && (
                      <span className="ml-auto text-xs font-black px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        {pricingResult.savingsPercent}% SAVED
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-[#E6DFD3] dark:border-white/10 text-xs">
                  <div className="flex justify-between text-[#42524A] dark:text-slate-400">
                    <span>Individual market rate:</span>
                    <span className="line-through font-bold">₹{pricingResult.individualPrice.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                    <span>Your monthly community savings:</span>
                    <span>-₹{pricingResult.savingsAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-[#202A25] dark:text-slate-200 font-bold pt-2 border-t border-dashed border-[#E6DFD3] dark:border-white/10">
                    <span>Total Group Billing ({calcHouseholds} flats):</span>
                    <span>₹{pricingResult.totalGroupBilling.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-[#964208] dark:text-[#E9A15B] font-bold">
                    <span>Guaranteed Staff Payout:</span>
                    <span>₹{pricingResult.proPayout.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <Link
                  to={user ? '/app/groups' : `/register?service=${calcService}`}
                  className="w-full py-3.5 rounded-2xl bg-[#153D32] hover:bg-[#1E5244] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-[#153D32]/20 transition-all hover:-translate-y-0.5 cursor-pointer"
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
      <section id="how-it-works" className="py-20 lg:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#153D32]/10 dark:bg-white/10 text-[#153D32] dark:text-[#E9A15B] text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            FRICTION-FREE ONBOARDING
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[#153D32] dark:text-white tracking-tight">
            A simpler everyday, in four steps.
          </h2>
          <p className="text-sm sm:text-base text-[#42524A] dark:text-slate-300 mt-3 font-medium">
            From discovering your society group to enjoying warm homestyle meals and a spotless kitchen.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Step 1 */}
          <div className="bg-white dark:bg-[#14231D] p-6 rounded-3xl border border-[#E6DFD3] dark:border-white/10 shadow-md group hover:-translate-y-1 transition-transform">
            <div className="font-serif text-3xl font-black text-[#964208] dark:text-[#E9A15B] mb-3">
              01
            </div>
            <h3 className="font-serif font-bold text-lg text-[#153D32] dark:text-white mb-2">
              Join or Form a Group
            </h3>
            <p className="text-xs text-[#42524A] dark:text-slate-300 leading-relaxed font-medium">
              Find an active group in your apartment tower or create a new one with your desired meal schedule and utensil load.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white dark:bg-[#14231D] p-6 rounded-3xl border border-[#E6DFD3] dark:border-white/10 shadow-md group hover:-translate-y-1 transition-transform">
            <div className="font-serif text-3xl font-black text-[#964208] dark:text-[#E9A15B] mb-3">
              02
            </div>
            <h3 className="font-serif font-bold text-lg text-[#153D32] dark:text-white mb-2">
              Match Top Verified Staff
            </h3>
            <p className="text-xs text-[#42524A] dark:text-slate-300 leading-relaxed font-medium">
              Once threshold is met, our algorithm matches top-rated cooks and dishwashers who already operate near your society.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white dark:bg-[#14231D] p-6 rounded-3xl border border-[#E6DFD3] dark:border-white/10 shadow-md group hover:-translate-y-1 transition-transform">
            <div className="font-serif text-3xl font-black text-[#964208] dark:text-[#E9A15B] mb-3">
              03
            </div>
            <h3 className="font-serif font-bold text-lg text-[#153D32] dark:text-white mb-2">
              OTP-Verified Visits
            </h3>
            <p className="text-xs text-[#42524A] dark:text-slate-300 leading-relaxed font-medium">
              Staff arrives at your exact scheduled window. Verify daily check-in with your 4-digit OTP. Zero disputes.
            </p>
          </div>

          {/* Step 4 */}
          <div className="bg-white dark:bg-[#14231D] p-6 rounded-3xl border border-[#E6DFD3] dark:border-white/10 shadow-md group hover:-translate-y-1 transition-transform">
            <div className="font-serif text-3xl font-black text-[#964208] dark:text-[#E9A15B] mb-3">
              04
            </div>
            <h3 className="font-serif font-bold text-lg text-[#153D32] dark:text-white mb-2">
              Guaranteed Backup
            </h3>
            <p className="text-xs text-[#42524A] dark:text-slate-300 leading-relaxed font-medium">
              When your assigned staff takes planned leaves, an automated standby professional covers the slot seamlessly.
            </p>
          </div>

        </div>
      </section>


      {/* =========================================================================
          SECTION I: INTERACTIVE HOUSEHOLD SCHEDULE PREVIEW (RESPONSIVE TABLE + CARDS)
          ========================================================================= */}
      <section className="py-20 lg:py-28 bg-white dark:bg-[#121E19] border-y border-[#E6DFD3] dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#153D32]/10 dark:bg-white/10 text-[#153D32] dark:text-[#E9A15B] text-xs font-bold mb-3">
              <Clock className="w-3.5 h-3.5" />
              PRECISION SCHEDULING
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#153D32] dark:text-white tracking-tight">
              Sample Daily Tower Routine
            </h2>
            <p className="text-sm text-[#42524A] dark:text-slate-300 mt-2 font-medium">
              See how a typical 4-flat cluster operates seamlessly in the morning and evening.
            </p>
          </div>

          <div className="max-w-4xl mx-auto bg-[#FBF7EF] dark:bg-[#14231D] rounded-3xl p-5 sm:p-8 border border-[#E6DFD3] dark:border-white/10 shadow-lg">
            
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              <button
                type="button"
                onClick={() => setScheduleTab('COMBO')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  scheduleTab === 'COMBO'
                    ? 'bg-[#153D32] text-white shadow-xs'
                    : 'bg-white dark:bg-white/5 text-[#202A25] dark:text-slate-300'
                }`}
              >
                Combined Care (Cooking + Washing)
              </button>
              <button
                type="button"
                onClick={() => setScheduleTab('COOKING')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  scheduleTab === 'COOKING'
                    ? 'bg-[#153D32] text-white shadow-xs'
                    : 'bg-white dark:bg-white/5 text-[#202A25] dark:text-slate-300'
                }`}
              >
                Cooking Only
              </button>
              <button
                type="button"
                onClick={() => setScheduleTab('DISHWASHING')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  scheduleTab === 'DISHWASHING'
                    ? 'bg-[#153D32] text-white shadow-xs'
                    : 'bg-white dark:bg-white/5 text-[#202A25] dark:text-slate-300'
                }`}
              >
                Utensil Care Only
              </button>
            </div>

            {/* Desktop Table View (>= sm) */}
            <div className="hidden sm:block space-y-3">
              <div className="grid grid-cols-12 text-[11px] font-extrabold uppercase text-[#42524A] dark:text-slate-400 px-4 pb-2 border-b border-[#E6DFD3] dark:border-white/10">
                <span className="col-span-3">Time Slot</span>
                <span className="col-span-3">Household</span>
                <span className="col-span-4">Dedicated Activity</span>
                <span className="col-span-2 text-right">Status</span>
              </div>

              {SCHEDULE_ITEMS.map((row, i) => (
                <div
                  key={i}
                  className="grid grid-cols-12 items-center p-3.5 rounded-2xl bg-white dark:bg-white/5 border border-[#E6DFD3] dark:border-white/10 text-xs font-medium"
                >
                  <span className="col-span-3 font-bold text-[#153D32] dark:text-[#E9A15B]">{row.time}</span>
                  <span className="col-span-3 font-bold text-[#202A25] dark:text-white">{row.flat}</span>
                  <span className="col-span-4 text-[#42524A] dark:text-slate-300">{row.task}</span>
                  <span className="col-span-2 text-right">
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

            {/* Mobile Card Stack View (< sm) */}
            <div className="sm:hidden space-y-3">
              {SCHEDULE_ITEMS.map((row, i) => (
                <div
                  key={i}
                  className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-[#E6DFD3] dark:border-white/10 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#153D32] dark:text-[#E9A15B]">{row.time}</span>
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      row.status === 'Completed' ? 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300' :
                      row.status === 'Active Now' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 animate-pulse' :
                      'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}>
                      {row.status}
                    </span>
                  </div>
                  <div className="font-bold text-[#202A25] dark:text-white text-sm">{row.flat}</div>
                  <div className="text-[#42524A] dark:text-slate-300 font-medium">{row.task}</div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>


      {/* =========================================================================
          SECTION J: MEET YOUR PROFESSIONALS
          ========================================================================= */}
      <section className="py-20 lg:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#153D32]/10 dark:bg-white/10 text-[#153D32] dark:text-[#E9A15B] text-xs font-bold mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              VERIFIED EXPERTISE
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#153D32] dark:text-white tracking-tight">
              Meet Top Society Professionals
            </h2>
            <p className="text-sm text-[#42524A] dark:text-slate-300 mt-2 font-medium">
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
              className="bg-white dark:bg-[#14231D] rounded-3xl p-5 border border-[#E6DFD3] dark:border-white/10 shadow-md flex flex-col justify-between space-y-4 hover:shadow-xl transition-shadow"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#153D32] to-[#1E5244] text-[#E9A15B] font-bold text-lg flex items-center justify-center border border-[#E9A15B]/30">
                    {pro.name?.[0] || 'P'}
                  </div>
                  <div className="flex items-center gap-1 bg-[#FBF7EF] dark:bg-white/5 px-2 py-1 rounded-lg text-xs font-bold text-[#964208] dark:text-[#E9A15B]">
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
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#964208] dark:text-[#E9A15B] block mt-0.5">
                    {pro.professional_type === 'MULTI_SKILLED' ? 'Multi-Skilled Cook & Utensil Care' :
                     pro.professional_type === 'DISHWASHER' ? 'Utensil Care Specialist' : 'Master Home Cook'}
                  </span>
                </div>

                <p className="text-xs text-[#42524A] dark:text-slate-300 mt-2 line-clamp-2 font-medium">
                  {pro.bio || 'Specializes in North Indian homestyle gravies, phulkas and meticulous kitchen hygiene.'}
                </p>

                <div className="flex flex-wrap gap-1 mt-3">
                  {(pro.specialties || ['North Indian', 'Healthy Diet']).slice(0, 2).map((s, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#FBF7EF] dark:bg-white/5 text-[#42524A] dark:text-slate-300 border border-[#E6DFD3] dark:border-white/5"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-[#E6DFD3] dark:border-white/10 flex items-center justify-between text-xs">
                <span className="text-[#42524A] dark:text-slate-400 font-medium">
                  {pro.experience_years || 5}+ yrs exp
                </span>
                <Link
                  to={user ? `/app/cooks` : `/register`}
                  className="font-bold text-[#153D32] dark:text-[#E9A15B] hover:underline cursor-pointer"
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
      <section id="for-professionals" className="py-20 lg:py-28 bg-white dark:bg-[#121E19] border-y border-[#E6DFD3] dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-5 space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#153D32]/10 dark:bg-white/10 text-[#153D32] dark:text-[#E9A15B] text-xs font-bold">
                <HeartHandshake className="w-3.5 h-3.5" />
                WORKFORCE DIGNITY & EMPOWERMENT
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#153D32] dark:text-white leading-tight">
                Better opportunities, closer to home.
              </h2>
              <p className="text-sm text-[#42524A] dark:text-slate-300 leading-relaxed font-medium">
                SocietyCook is committed to transforming informal domestic work into organized, well-compensated, dignified professions.
              </p>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div className="p-5 rounded-2xl bg-[#FBF7EF] dark:bg-[#14231D] border border-[#E6DFD3] dark:border-white/10">
                <div className="w-9 h-9 rounded-xl bg-[#153D32] text-[#E9A15B] flex items-center justify-center font-bold text-xs mb-3">
                  <Coins className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-sm text-[#202A25] dark:text-white">2.5x Higher Earnings</h4>
                <p className="text-xs text-[#42524A] dark:text-slate-400 mt-1 leading-relaxed font-medium">
                  Earn ₹20,000 to ₹35,000/mo by serving 4-6 clustered flats without unpaid travel downtime.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#FBF7EF] dark:bg-[#14231D] border border-[#E6DFD3] dark:border-white/10">
                <div className="w-9 h-9 rounded-xl bg-[#964208] text-white flex items-center justify-center font-bold text-xs mb-3">
                  <Navigation className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-sm text-[#202A25] dark:text-white">Zero Commute Expenses</h4>
                <p className="text-xs text-[#42524A] dark:text-slate-400 mt-1 leading-relaxed font-medium">
                  Work in one gated society. Save up to ₹3,500/mo on bus and auto fares.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#FBF7EF] dark:bg-[#14231D] border border-[#E6DFD3] dark:border-white/10">
                <div className="w-9 h-9 rounded-xl bg-[#153D32] text-[#E9A15B] flex items-center justify-center font-bold text-xs mb-3">
                  <Clock className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-sm text-[#202A25] dark:text-white">Predictable Fixed Hours</h4>
                <p className="text-xs text-[#42524A] dark:text-slate-400 mt-1 leading-relaxed font-medium">
                  Firm 45-minute cooking and 30-minute washing windows with punctuality bonuses.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#FBF7EF] dark:bg-[#14231D] border border-[#E6DFD3] dark:border-white/10">
                <div className="w-9 h-9 rounded-xl bg-[#964208] text-white flex items-center justify-center font-bold text-xs mb-3">
                  <HeartPulse className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-sm text-[#202A25] dark:text-white">Paid Leave & Medical Fund</h4>
                <p className="text-xs text-[#42524A] dark:text-slate-400 mt-1 leading-relaxed font-medium">
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
      <section id="for-societies" className="py-20 lg:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-[#153D32] to-[#1E5244] rounded-3xl p-8 sm:p-14 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute right-0 bottom-0 w-96 h-96 bg-[#E9A15B]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            <div className="lg:col-span-8 space-y-4">
              <span className="text-[10px] uppercase font-black tracking-wider text-[#E9A15B] px-3 py-1 rounded-full bg-white/10 inline-block">
                FOR RESIDENT WELFARE ASSOCIATIONS (RWA)
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">
                Partner Your Society with SocietyCook
              </h2>
              <p className="text-sm sm:text-base text-white/80 max-w-2xl leading-relaxed font-medium">
                Reduce daily external visitor foot traffic by 60%, streamline gate security through MyGate / NoBrokerHood sync, and give your residents reliable, verified cooking and dishwashing services.
              </p>
              <div className="flex flex-wrap gap-4 text-xs font-bold text-white/90 pt-2">
                <span>✓ Zero setup fees for societies</span>
                <span>✓ Real-time staff audit logs</span>
                <span>✓ Police verification dossier for every staff</span>
              </div>
            </div>

            <div className="lg:col-span-4 text-left lg:text-right">
              <button
                type="button"
                onClick={() => setShowRwaModal(true)}
                className="px-8 py-4 rounded-2xl bg-[#E9A15B] hover:bg-[#D48943] text-[#153D32] font-black text-xs uppercase tracking-wider shadow-lg transition-transform hover:scale-103 cursor-pointer"
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
      <section className="py-20 lg:py-28 bg-white dark:bg-[#121E19] border-y border-[#E6DFD3] dark:border-white/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
                  className="rounded-2xl border border-[#E6DFD3] dark:border-white/10 bg-[#FBF7EF] dark:bg-[#14231D] overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${index}`}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-[#202A25] dark:text-white cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-[#153D32] dark:text-[#E9A15B] transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div id={`faq-answer-${index}`} role="region" className="px-5 pb-5 pt-1 text-xs text-[#42524A] dark:text-slate-300 leading-relaxed border-t border-[#E6DFD3]/50 dark:border-white/5 font-medium animate-in fade-in">
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
      <section className="relative py-24 sm:py-32 overflow-hidden">
        <div className="absolute inset-0">
          <picture>
            <source media="(max-width: 640px)" srcSet="/images/conversion_banner_home-mobile.webp" type="image/webp" />
            <source srcSet="/images/conversion_banner_home.webp" type="image/webp" />
            <img
              src="/images/conversion_banner_home.jpg"
              alt="Warm modern residential living room"
              loading="lazy"
              decoding="async"
              width="1200"
              height="800"
              className="w-full h-full object-cover"
            />
          </picture>
          <div className="absolute inset-0 bg-gradient-to-r from-[#0E2922]/95 via-[#153D32]/90 to-[#1E5244]/85" />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center text-white space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 border border-white/20 text-[#E9A15B] text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            START WITH ZERO RISK
          </div>

          <h2 className="font-serif text-3xl sm:text-5xl md:text-6xl font-bold leading-tight">
            Ready to enjoy more living and less chores?
          </h2>

          <p className="text-sm sm:text-base text-white/85 max-w-xl mx-auto font-medium leading-relaxed">
            Join your apartment neighbours today. Lock in community-discounted pricing with verified cooks and dishwashing specialists.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#E9A15B] hover:bg-[#D48943] text-[#153D32] font-black text-xs uppercase tracking-wider shadow-xl transition-all hover:scale-103 cursor-pointer"
            >
              Get Started in Your Society
            </Link>
            <a
              href="#service-finder"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-colors cursor-pointer"
            >
              Browse Services
            </a>
          </div>
        </div>
      </section>


      {/* =========================================================================
          SECTION O: PREMIUM FOOTER
          ========================================================================= */}
      <footer className="bg-[#0E1714] text-[#EDE8DF] pt-16 pb-12 border-t border-white/10 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
          <div className="bg-white dark:bg-[#14231D] rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-[#E6DFD3] dark:border-white/10 shadow-2xl relative text-left">
            <button
              type="button"
              onClick={() => setShowRwaModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {rwaSuccess ? (
              <div className="text-center py-8 space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-xl font-bold text-[#153D32] dark:text-white">Demo Scheduled!</h3>
                <p className="text-xs text-[#42524A] dark:text-slate-300">
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
                <p className="text-xs text-[#42524A] dark:text-slate-300 mb-6">
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
                      className="w-full h-11 px-3.5 rounded-xl bg-[#FBF7EF] dark:bg-white/5 border border-[#E6DFD3] dark:border-white/10 text-xs focus:outline-none focus:ring-2 focus:ring-[#153D32]"
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
                        className="w-full h-11 px-3.5 rounded-xl bg-[#FBF7EF] dark:bg-white/5 border border-[#E6DFD3] dark:border-white/10 text-xs focus:outline-none focus:ring-2 focus:ring-[#153D32]"
                      />
                    </div>
                    <div>
                      <label className="block text-[#202A25] dark:text-white mb-1">Total Flats</label>
                      <input
                        type="text"
                        placeholder="e.g. 350"
                        value={rwaForm.flats}
                        onChange={(e) => setRwaForm({ ...rwaForm, flats: e.target.value })}
                        className="w-full h-11 px-3.5 rounded-xl bg-[#FBF7EF] dark:bg-white/5 border border-[#E6DFD3] dark:border-white/10 text-xs focus:outline-none focus:ring-2 focus:ring-[#153D32]"
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
                        className="w-full h-11 px-3.5 rounded-xl bg-[#FBF7EF] dark:bg-white/5 border border-[#E6DFD3] dark:border-white/10 text-xs focus:outline-none focus:ring-2 focus:ring-[#153D32]"
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
                        className="w-full h-11 px-3.5 rounded-xl bg-[#FBF7EF] dark:bg-white/5 border border-[#E6DFD3] dark:border-white/10 text-xs focus:outline-none focus:ring-2 focus:ring-[#153D32]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full h-12 rounded-xl bg-[#153D32] hover:bg-[#1E5244] text-white font-bold text-xs uppercase tracking-wider shadow-md transition-colors mt-2 cursor-pointer"
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

// Fallback professionals
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
    bio: 'Dedicated utensil care specialist. Ensures zero grease on heavy cookware and spotless sink hygiene.'
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

const SCHEDULE_ITEMS = [
  { time: '07:30 – 08:15 AM', flat: 'Flat B-201', task: 'Breakfast Prep (Poha, Upma & Chai)', status: 'Completed' },
  { time: '08:15 – 08:45 AM', flat: 'Flat B-201', task: 'Utensil Washing & Sink Sanitization', status: 'Active Now' },
  { time: '08:15 – 09:00 AM', flat: 'Flat B-304', task: 'Fresh Phulkas & Paneer Sabzi', status: 'Scheduled' },
  { time: '09:00 – 09:30 AM', flat: 'Flat B-304', task: 'Heavy Kadhais & Cooker Care', status: 'Upcoming' },
  { time: '09:00 – 09:45 AM', flat: 'Flat B-402', task: 'South Indian Meals & Sambhar', status: 'Upcoming' }
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
