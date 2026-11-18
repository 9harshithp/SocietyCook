import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  CheckCircle2,
  Download,
  ShieldCheck,
  TrendingUp,
  Clock,
  Sparkles,
  QrCode,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export function BillingPage() {
  const { user, showToast } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payingBookingId, setPayingBookingId] = useState(null);

  const loadBilling = async () => {
    try {
      setLoading(true);
      const data = await api.getBookings();
      setBookings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBilling();
  }, []);

  const handlePayDemo = async (id) => {
    try {
      await api.payDemo(id);
      showToast('Payment successful! Subscription active.');
      setShowPayModal(false);
      loadBilling();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDownloadInvoice = (invNum) => {
    showToast(`Downloading official GST invoice ${invNum}...`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-bold mb-2">
          <CreditCard className="w-3.5 h-3.5" />
          Transparent Subscription & Invoicing
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
          Billing & Subscriptions
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1 max-w-xl">
          Automated community billing with zero hidden brokerages. Direct payouts ensure fair living wages for verified cooks.
        </p>
      </div>

      {/* Subscription Status Card */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-3xl p-6 sm:p-8 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-white/20 text-white">
            Active Community Plan
          </span>
          <h2 className="text-2xl sm:text-3xl font-black mt-2">Sunrise Towers Dinner Club</h2>
          <div className="flex items-center gap-4 text-xs text-emerald-100 font-semibold mt-2">
            <span>₹4,200 / Month</span>
            <span>·</span>
            <span>Next billing: 1st of next month</span>
            <span>·</span>
            <span className="font-bold text-white">Savings: ₹800/mo</span>
          </div>
        </div>

        <div>
          <button
            type="button"
            onClick={() => {
              setPayingBookingId(bookings[0]?.id || 1);
              setShowPayModal(true);
            }}
            className="px-6 py-3 rounded-2xl bg-white text-emerald-800 font-bold text-xs hover:bg-slate-100 shadow-md transition-transform active:scale-95"
          >
            Pay Now (UPI / Card)
          </button>
        </div>
      </div>

      {/* Invoices List */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-base font-black text-slate-900 dark:text-white">Payment Invoices & Receipts</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-bold uppercase">
              <tr>
                <th className="p-3">Invoice Number</th>
                <th className="p-3">Billing Cycle</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {[
                { id: 'INV-2026-1101', cycle: 'November 2026', amount: '₹4,200', status: 'PAID' },
                { id: 'INV-2026-1001', cycle: 'October 2026', amount: '₹4,200', status: 'PAID' },
                { id: 'INV-2026-0901', cycle: 'September 2026', amount: '₹4,500', status: 'PAID' }
              ].map((inv) => (
                <tr key={inv.id}>
                  <td className="p-3 font-mono font-bold text-slate-800 dark:text-slate-200">{inv.id}</td>
                  <td className="p-3 text-slate-600 dark:text-slate-400">{inv.cycle}</td>
                  <td className="p-3 font-extrabold text-slate-900 dark:text-white">{inv.amount}</td>
                  <td className="p-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {inv.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleDownloadInvoice(inv.id)}
                      className="text-emerald-600 hover:text-emerald-700 font-bold inline-flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" /> PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Demo UPI Payment Modal */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 text-center">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 dark:text-white">Complete Monthly Payment</h3>
              <button type="button" onClick={() => setShowPayModal(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-6 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
              <div className="w-36 h-36 mx-auto bg-white p-3 rounded-xl border border-slate-300 shadow-xs flex flex-col items-center justify-center">
                <QrCode className="w-28 h-28 text-slate-900" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-semibold block">Scan with any UPI App</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white">₹4,200.00</span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">societycook.payments@icici</p>
            </div>

            <button
              type="button"
              onClick={() => handlePayDemo(payingBookingId)}
              className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/30"
            >
              Simulate Instant UPI Payment (Demo)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
