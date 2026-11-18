import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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
  Utensils
} from 'lucide-react';

export function LandingPage() {
  const [households, setHouseholds] = useState(5);
  const [mealType, setMealType] = useState('DINNER');
  const [openFaq, setOpenFaq] = useState(null);

  // Group pricing calculation
  const getPricing = (hh, meal) => {
    let base = 5000;
    if (meal === 'BREAKFAST') base = 3500;
    if (meal === 'LUNCH') base = 4800;
    if (meal === 'MULTIPLE') base = 8500;

    const discountPerHh = [0, 0, 300, 500, 800, 1000, 1200, 1400, 1600][hh] || 1000;
    const groupPrice = base - discountPerHh;
    const savingsPercent = Math.round((discountPerHh / base) * 100);
    const cookCompensation = Math.max(16000, groupPrice * hh * 0.85);

    return { base, groupPrice, discountPerHh, savingsPercent, cookCompensation };
  };

  const { base, groupPrice, savingsPercent, cookCompensation } = getPricing(households, mealType);

  const faqs = [
    {
      q: 'How is SocietyCook different from ChefKart, COOX, or Cookzy?',
      a: 'Traditional platforms treat cook hiring as isolated, expensive individual bookings with ₹15,000+ brokerage or high hourly commissions. SocietyCook aggregates demand within the exact same society tower: 4–5 neighbours share a cook\'s route. You get fresh home cooking in your own kitchen at up to 35% lower monthly cost, while cooks earn 2.5x more with zero travel between appointments.'
    },
    {
      q: 'Do we eat shared food or is it cooked individually in my kitchen?',
      a: 'Every household receives individual cooking services in their own private kitchen! The cook prepares meals tailored to your specific dietary preferences, spice levels, and family size during your dedicated recurring 45-minute cooking window.'
    },
    {
      q: 'What happens if our assigned cook takes a leave or falls ill?',
      a: 'SocietyCook guarantees 100% service continuity. Our automated backup allocation engine assigns a verified, society-cleared standby cook who already has gate clearance and knows the tower schedule. No scramble, no missed meals.'
    },
    {
      q: 'How does OTP-based attendance verification work?',
      a: 'When your cook arrives at your flat, they request your 4-digit daily session OTP displayed on your resident dashboard. Checking in and checking out with the OTP ensures transparent billing, eliminates absenteeism disputes, and triggers instant attendance logs.'
    },
    {
      q: 'Can I create a new cook-hiring group for my specific tower?',
      a: 'Yes! Any resident can create a group with custom meal times, cuisine preferences, and budget. Once your group reaches the threshold of 4 or 5 participating flats, our system matches the highest-rated available cook and generates optimized schedule slots.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.15),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.12),rgba(0,0,0,0))]" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold mb-6 animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            Hyperlocal Community Cook Hiring Platform
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight max-w-4xl mx-auto leading-[1.1] mb-6">
            Hire together.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-green-500 to-teal-600">
              Save together.
            </span>{' '}
            Eat better.
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-10 font-medium">
            Connect with neighbours in your apartment society to collectively hire top-rated professional cooks.
            Enjoy customized daily home-cooked meals in your own kitchen at group discount rates.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <Link
              to="/app"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-transform hover:-translate-y-0.5"
            >
              Explore Society Groups
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-emerald-500 text-slate-800 dark:text-slate-200 font-bold text-sm shadow-xs transition-colors"
            >
              Sign Up Free
            </Link>
          </div>

          {/* Social Proof Stats */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto pt-10 border-t border-slate-200 dark:border-slate-800 text-left">
            <div>
              <p className="text-3xl font-black text-slate-900 dark:text-white">35%+</p>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Monthly Resident Savings</p>
            </div>
            <div>
              <p className="text-3xl font-black text-emerald-600">₹24,000</p>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Avg Cook Earnings / Society</p>
            </div>
            <div>
              <p className="text-3xl font-black text-slate-900 dark:text-white">100%</p>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Verified Background & ID</p>
            </div>
            <div>
              <p className="text-3xl font-black text-emerald-600">0 min</p>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Cook Transit Between Flats</p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Group Pricing Engine Simulator */}
      <section className="py-16 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Dynamic Pricing Engine
            </span>
            <h2 className="text-2xl sm:text-3xl font-black mt-1">See How Much You Save Together</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto mt-2">
              The more flats that join in your tower, the lower your monthly subscription price.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-6">
                <div>
                  <label className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    <span>Participating Households in Tower</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white font-extrabold text-xs">
                      {households} Households
                    </span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="8"
                    value={households}
                    onChange={(e) => setHouseholds(Number(e.target.value))}
                    className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                  <div className="flex justify-between text-[11px] font-semibold text-slate-400 mt-1">
                    <span>1 (Solo)</span>
                    <span>3 Flats</span>
                    <span>5 (Optimal)</span>
                    <span>8 Flats</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Select Meal Service
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'BREAKFAST', label: 'Breakfast' },
                      { id: 'DINNER', label: 'Dinner' },
                      { id: 'MULTIPLE', label: 'Both' }
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setMealType(m.id)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                          mealType === m.id
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-500'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Fair Living Wage Guaranteed for Cook
                  </div>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1">
                    Cook receives <span className="font-extrabold">₹{cookCompensation.toLocaleString('en-IN')}/mo</span> for this cluster, with zero bus travel and guaranteed monthly direct bank payouts.
                  </p>
                </div>
              </div>

              {/* Price Calculation Card */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md text-center">
                <span className="text-xs font-bold uppercase text-slate-400">Monthly Cost Per Flat</span>
                <div className="flex items-baseline justify-center gap-3 my-3">
                  <span className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white">
                    ₹{groupPrice.toLocaleString('en-IN')}
                  </span>
                  {households > 1 && (
                    <span className="text-lg line-through text-slate-400">
                      ₹{base.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-extrabold mb-4">
                  <TrendingUp className="w-3.5 h-3.5" />
                  You Save {savingsPercent}% (₹{(base - groupPrice).toLocaleString('en-IN')}/mo)
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2 text-xs text-left">
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>Dedicated Daily Slot</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">45 Mins</span>
                  </div>
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>Transit Buffer</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">15 Mins (Same Tower)</span>
                  </div>
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>Backup Cook Guarantee</span>
                    <span className="font-bold text-emerald-600">Included Free</span>
                  </div>
                </div>

                <Link
                  to="/app"
                  className="mt-6 w-full block py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-transform active:scale-95"
                >
                  Join or Create a Group
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Frictionless Process
          </span>
          <h2 className="text-3xl font-black mt-1">How SocietyCook Works in 4 Steps</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            {
              step: '01',
              title: 'Discover or Create Group',
              desc: 'Browse active cooking clubs in your apartment tower or create a new one with your preferred meal timing and cuisine.'
            },
            {
              step: '02',
              title: 'Reach 4–5 Flats Threshold',
              desc: 'Invite your neighbours with a WhatsApp link. Once the minimum threshold is met, maximum group discount unlocks.'
            },
            {
              step: '03',
              title: 'Smart Cook Matching',
              desc: 'Our 7-factor recommendation algorithm matches the best verified cook and generates a non-overlapping route schedule.'
            },
            {
              step: '04',
              title: 'Daily Fresh Home Meals',
              desc: 'Cook visits your kitchen at your booked slot. Verify attendance with secure 4-digit OTP. Backup cook on stand-by.'
            }
          ].map((item) => (
            <div
              key={item.step}
              className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 relative hover:shadow-lg transition-shadow"
            >
              <span className="text-4xl font-black text-emerald-600/20 dark:text-emerald-400/20 mb-3 block">
                {item.step}
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">{item.title}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison Table: SocietyCook vs Traditional */}
      <section className="py-16 bg-slate-100 dark:bg-slate-900/60 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-black">
              Why SocietyCook Outperforms Traditional Cook Agencies
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold uppercase">
                <tr>
                  <th className="p-4">Feature Comparison</th>
                  <th className="p-4 text-emerald-600 dark:text-emerald-400">SocietyCook</th>
                  <th className="p-4 text-slate-400">Traditional Agency (ChefKart, etc.)</th>
                  <th className="p-4 text-slate-400">Informal Maid / Cook</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                <tr>
                  <td className="p-4 font-bold">Monthly Household Cost</td>
                  <td className="p-4 font-bold text-emerald-600">₹4,000 – ₹4,500 (Group Discount)</td>
                  <td className="p-4 text-slate-500">₹7,000 – ₹10,000 + Upfront Fee</td>
                  <td className="p-4 text-slate-500">₹4,500 – ₹5,500 (Unregulated)</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold">Guaranteed Backup on Leave</td>
                  <td className="p-4 font-bold text-emerald-600">Automated Dispatch in &lt;1 Hr</td>
                  <td className="p-4 text-slate-500">24–48 hr wait or no replacement</td>
                  <td className="p-4 text-slate-500">Zero backup; cook takes sudden leaves</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold">Cook Travel & Punctuality</td>
                  <td className="p-4 font-bold text-emerald-600">0 km travel (Consecutive Flats in Tower)</td>
                  <td className="p-4 text-slate-500">High city commute delays</td>
                  <td className="p-4 text-slate-500">Frequently late due to other societies</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold">Attendance & Billing Safety</td>
                  <td className="p-4 font-bold text-emerald-600">Daily 4-Digit Session OTP</td>
                  <td className="p-4 text-slate-500">Monthly manual log</td>
                  <td className="p-4 text-slate-500">Paper diary / frequent disputes</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold">Society Security Clearance</td>
                  <td className="p-4 font-bold text-emerald-600">RWA Gate Pass + Background Check</td>
                  <td className="p-4 text-slate-500">Varies</td>
                  <td className="p-4 text-slate-500">Often unverified</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Got Questions?
          </span>
          <h2 className="text-3xl font-black mt-1">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full p-4 text-left font-bold text-sm text-slate-900 dark:text-white flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform ${
                    openFaq === idx ? 'rotate-180 text-emerald-600' : ''
                  }`}
                />
              </button>
              {openFaq === idx && (
                <div className="p-4 pt-0 text-xs text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA Footer Banner */}
      <section className="py-16 bg-gradient-to-r from-emerald-600 to-teal-700 text-white text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-black mb-4">Start Cooking Smarter in Your Society Today</h2>
          <p className="text-emerald-100 text-sm max-w-xl mx-auto mb-8 font-medium">
            Join hundreds of families enjoying delicious, customized home-cooked meals every single day.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/app"
              className="px-8 py-3.5 rounded-2xl bg-white text-emerald-800 font-bold text-sm hover:bg-slate-100 shadow-lg transition-transform hover:-translate-y-0.5"
            >
              Launch SocietyCook App
            </Link>
            <a
              href="http://localhost:5000/api/v1/docs"
              target="_blank"
              rel="noreferrer"
              className="px-6 py-3.5 rounded-2xl bg-emerald-800/50 hover:bg-emerald-800 text-white font-bold text-sm border border-emerald-500/50"
            >
              Interactive API Docs
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-slate-900 text-slate-400 text-xs text-center border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ChefHat className="w-4 h-4 text-emerald-500" />
            <span className="font-bold text-white">SocietyCook v2.0</span>
            <span>— Hyperlocal Cook Sharing & Workforce Management</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <a href="http://localhost:5000/api/v1/docs" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Swagger API</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
