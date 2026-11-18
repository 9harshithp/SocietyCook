import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Users,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export function ScheduleCalendarPage() {
  const { activeSocietyId } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(new Date().toISOString().slice(0, 10));

  const loadSessions = async () => {
    try {
      setLoading(true);
      const data = await api.getSessions({ societyId: activeSocietyId });
      setSessions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, [activeSocietyId]);

  const timeSlots = [
    { slot: '07:00 – 07:45', type: 'Breakfast', cook: 'Chef Ramesh Kumar', flat: 'Tower A · Flat 101', status: 'COMPLETED' },
    { slot: '08:00 – 08:45', type: 'Breakfast', cook: 'Chef Ramesh Kumar', flat: 'Tower A · Flat 204', status: 'IN_PROGRESS' },
    { slot: '12:30 – 01:15', type: 'Lunch', cook: 'Chef Ramesh Kumar', flat: 'Tower A · Flat 302', status: 'SCHEDULED' },
    { slot: '01:30 – 02:15', type: 'Lunch', cook: 'Chef Ramesh Kumar', flat: 'Tower A · Flat 401', status: 'SCHEDULED' },
    { slot: '07:30 – 08:15', type: 'Dinner', cook: 'Chef Ramesh Kumar', flat: 'Tower A · Flat 102', status: 'SCHEDULED' },
    { slot: '08:30 – 09:15', type: 'Dinner', cook: 'Chef Ramesh Kumar', flat: 'Tower A · Flat 505', status: 'SCHEDULED' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-bold mb-2">
          <CalendarIcon className="w-3.5 h-3.5" />
          Optimized Route Scheduling
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
          Tower Route Calendar
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1 max-w-xl">
          Visual schedule showing non-overlapping 45-minute cooking windows with 15-minute inter-flat elevator transitions.
        </p>
      </div>

      {/* Date Bar */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-extrabold text-slate-900 dark:text-white">
            Schedule for Today: {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold">
          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            Tower A Cluster
          </span>
        </div>
      </div>

      {/* Timeline Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <span className="text-xs font-extrabold uppercase text-slate-400">Time Window & Route</span>
          <span className="text-xs font-extrabold uppercase text-slate-400">Status</span>
        </div>

        <div className="space-y-4">
          {timeSlots.map((item, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                item.status === 'IN_PROGRESS'
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-xs font-bold shadow-xs">
                  <Clock className="w-4 h-4 text-emerald-600 mb-0.5" />
                  <span className="text-[10px] text-slate-500">{item.type}</span>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">{item.flat}</h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {item.slot}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Assigned: <span className="font-semibold text-slate-800 dark:text-slate-200">{item.cook}</span> (Dedicated Kitchen Service)
                  </p>
                </div>
              </div>

              <div>
                <span
                  className={`px-3 py-1 rounded-full text-[10px] font-extrabold ${
                    item.status === 'COMPLETED'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : item.status === 'IN_PROGRESS'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 animate-pulse'
                      : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                  }`}
                >
                  {item.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Zero Travel Gaps: Cook remains within the same residential complex</span>
          </div>
        </div>
      </div>
    </div>
  );
}
