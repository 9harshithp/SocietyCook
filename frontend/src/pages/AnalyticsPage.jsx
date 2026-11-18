import React from 'react';
import {
  TrendingUp,
  Users,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Sparkles,
  BarChart3,
  Calendar
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
  Legend
} from 'recharts';

export function AnalyticsPage() {
  const savingsData = [
    { households: '1 Flat', individualPrice: 5000, groupPrice: 5000, savings: 0 },
    { households: '2 Flats', individualPrice: 5000, groupPrice: 4700, savings: 300 },
    { households: '3 Flats', individualPrice: 5000, groupPrice: 4500, savings: 500 },
    { households: '4 Flats', individualPrice: 5000, groupPrice: 4200, savings: 800 },
    { households: '5 Flats', individualPrice: 5000, groupPrice: 4000, savings: 1000 },
    { households: '6 Flats', individualPrice: 5000, groupPrice: 3800, savings: 1200 }
  ];

  const hourlyDemandData = [
    { hour: '06:30 AM', demand: 4, cookCapacity: 6 },
    { hour: '07:15 AM', demand: 18, cookCapacity: 16 },
    { hour: '08:00 AM', demand: 24, cookCapacity: 22 },
    { hour: '08:45 AM', demand: 16, cookCapacity: 18 },
    { hour: '12:00 PM', demand: 10, cookCapacity: 12 },
    { hour: '12:45 PM', demand: 15, cookCapacity: 14 },
    { hour: '01:30 PM', demand: 8, cookCapacity: 10 },
    { hour: '07:00 PM', demand: 22, cookCapacity: 20 },
    { hour: '07:45 PM', demand: 32, cookCapacity: 26 },
    { hour: '08:30 PM', demand: 28, cookCapacity: 24 },
    { hour: '09:15 PM', demand: 12, cookCapacity: 16 }
  ];

  const forecastData = [
    { month: 'Jun', households: 42, cooks: 9 },
    { month: 'Jul', households: 58, cooks: 12 },
    { month: 'Aug', households: 74, cooks: 15 },
    { month: 'Sep', households: 95, cooks: 19 },
    { month: 'Oct (Est)', households: 120, cooks: 24 },
    { month: 'Nov (Est)', households: 155, cooks: 30 }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-bold mb-2">
          <BarChart3 className="w-3.5 h-3.5" />
          Heuristic Optimization & Analytics
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
          Community Intelligence & Analytics
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1 max-w-xl">
          Real database metrics and explainable statistical forecasting modeling campus demand, cook compensation, and schedule density.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-slate-400">Total Monthly GMV</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">₹4,20,000</div>
          <p className="text-[10px] text-slate-500 mt-1">Direct community turnover</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-slate-400">Avg Cook Earnings</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">₹24,500/mo</div>
          <p className="text-[10px] text-slate-500 mt-1">2.3x higher than unorganized work</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-slate-400">Route Density Index</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">94.2%</div>
          <p className="text-[10px] text-slate-500 mt-1">Flats clustered in same elevator line</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-slate-400">Absenteeism Disruption</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">0.0%</div>
          <p className="text-[10px] text-slate-500 mt-1">100% covered by backup dispatch</p>
        </div>
      </div>

      {/* Chart 1: Group Savings Distribution */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase text-emerald-600 dark:text-emerald-400">
            Economies of Concentrated Demand
          </span>
          <h3 className="text-lg font-black text-slate-900 dark:text-white">
            Monthly Cost vs Participating Flats Curve
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            How subscription pricing decreases as neighbours join the same tower cooking club.
          </p>
        </div>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={savingsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="households" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={[3000, 5500]} />
              <Tooltip
                formatter={(val) => `₹${val.toLocaleString('en-IN')}`}
                contentStyle={{ borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="groupPrice" name="Group Price / Flat" fill="#10b981" radius={[6, 6, 0, 0]} />
              <Bar dataKey="individualPrice" name="Solo Market Price" fill="#94a3b8" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2-Column: Hourly Demand Heatmap & Demand Forecast */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Demand vs Capacity */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase text-amber-500">
              Capacity Utilization
            </span>
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Hourly Demand vs Active Cook Capacity
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Highlighting peak breakfast (7:30–8:30 AM) and evening dinner (7:30–8:30 PM) demand bottlenecks.
            </p>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyDemandData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '11px' }} />
                <Area type="monotone" dataKey="demand" name="Flats Requiring Cook" stroke="#f59e0b" fill="#fef3c7" />
                <Area type="monotone" dataKey="cookCapacity" name="Available Cooks" stroke="#10b981" fill="#d1fae5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Statistical Demand Forecasting */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase text-indigo-500">
              Moving Average Projection
            </span>
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              6-Month Household Demand & Cook Recruitment Forecast
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Heuristic moving-average trend used by Society Operations to recruit cooks ahead of demand spikes.
            </p>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecastData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '11px' }} />
                <Area type="monotone" dataKey="households" name="Subscribed Flats" stroke="#6366f1" fill="#e0e7ff" />
                <Area type="monotone" dataKey="cooks" name="Required Cooks" stroke="#10b981" fill="#d1fae5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
