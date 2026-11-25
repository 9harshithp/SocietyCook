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
  AlertCircle,
  X,
  Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { trackCheckoutStart, trackPaymentSuccess, trackSubscriptionActivated } from '../services/analytics';

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function BillingPage() {
  const { user, showToast } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentConfig, setPaymentConfig] = useState({
    onlinePaymentsAvailable: false,
    keyId: null,
    currency: 'INR',
    isTestMode: false,
    demoAllowed: false
  });
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentBanner, setPaymentBanner] = useState(null);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [payingBookingId, setPayingBookingId] = useState(null);

  const loadBilling = async () => {
    try {
      setLoading(true);
      const [bookingsData, invoicesData, configData] = await Promise.all([
        api.getBookings().catch(() => []),
        api.getInvoices().catch(() => []),
        api.getPaymentConfig().catch(() => ({ onlinePaymentsAvailable: false, demoAllowed: false }))
      ]);
      setBookings(bookingsData || []);
      setInvoices(invoicesData || []);
      if (configData) {
        setPaymentConfig(configData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBilling();
  }, []);

  const handleInitiatePayment = async (bookingId) => {
    try {
      setProcessingPayment(true);
      setPayingBookingId(bookingId);

      // 1. If online payments are disabled, do not proceed
      if (!paymentConfig.onlinePaymentsAvailable && !paymentConfig.demoAllowed) {
        showToast('Online payments are temporarily unavailable pending gateway activation.', 'error');
        setProcessingPayment(false);
        return;
      }

      // 2. Create authoritative server-side order
      const order = await api.createPaymentOrder(bookingId);

      // Track checkout start
      trackCheckoutStart({
        serviceType: activeBooking?.service_type || 'COOKING',
        planId: bookingId,
        amount: order.amount
      });

      // 3. In local dev mode with mock/demo order
      if (order.isDemo && paymentConfig.demoAllowed && !import.meta.env.PROD) {
        setShowDemoModal(true);
        setProcessingPayment(false);
        return;
      }

      // 4. Load official Razorpay Checkout SDK
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        showToast('Failed to load secure Razorpay Checkout SDK. Please check your internet connection.', 'error');
        setProcessingPayment(false);
        return;
      }

      // 5. Open Razorpay Checkout modal
      const options = {
        key: order.keyId,
        amount: order.amountInPaise,
        currency: order.currency || 'INR',
        name: 'SocietyCook',
        description: `Community Cooking Subscription (Booking #${bookingId})`,
        order_id: order.orderId,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || ''
        },
        notes: {
          bookingId: String(bookingId),
          societyId: String(user?.society_id || 1)
        },
        theme: {
          color: '#059669' // emerald-600
        },
        handler: async function (response) {
          setPaymentBanner({ type: 'verifying', message: 'Verifying payment with payment gateway...' });
          try {
            // Authoritative server-side verification
            const verifyRes = await api.verifyPayment(bookingId, {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            });

            if (verifyRes.success || verifyRes.status === 'ACTIVE') {
              trackPaymentSuccess({
                transactionId: response.razorpay_payment_id,
                value: order.amount,
                currency: 'INR',
                isDemo: false
              });
              trackSubscriptionActivated({
                subscriptionId: bookingId,
                planTier: 'RESIDENTIAL_MONTHLY'
              });
              setPaymentBanner(null);
              showToast('Payment verified and confirmed! Your daily service is now active.', 'success');
              await loadBilling();
            } else {
              setPaymentBanner({ type: 'failed', message: 'Payment verification failed. Please contact support.' });
              showToast('Payment could not be verified by the server. Please contact support.', 'error');
            }
          } catch (err) {
            setPaymentBanner({ type: 'failed', message: `Verification failed: ${err.message}` });
            showToast(`Verification failed: ${err.message}`, 'error');
          } finally {
            setProcessingPayment(false);
          }
        },
        modal: {
          ondismiss: function () {
            setPaymentBanner({ type: 'cancelled', message: 'Payment window was closed before completion. You can retry payment anytime.' });
            setProcessingPayment(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (resp) {
        setPaymentBanner({
          type: 'failed',
          message: resp.error?.description || 'Transaction declined by bank. Please check your card or UPI app and retry.'
        });
        showToast(`Payment failed: ${resp.error?.description || 'Transaction declined by bank'}`, 'error');
        setProcessingPayment(false);
      });
      rzp.open();
    } catch (err) {
      setPaymentBanner({ type: 'failed', message: err.message });
      showToast(err.message, 'error');
      setProcessingPayment(false);
    }
  };

  const handlePayDemo = async (id) => {
    // Strictly prevent demo payment in production
    if (import.meta.env.PROD || !paymentConfig.demoAllowed) {
      showToast('Demo payment simulation is not permitted in production.', 'error');
      setShowDemoModal(false);
      return;
    }

    try {
      await api.payDemo(id);
      trackPaymentSuccess({
        transactionId: 'DEMO_' + id + '_' + Date.now(),
        value: activeBooking?.amount || 4000,
        currency: 'INR',
        isDemo: true
      });
      trackSubscriptionActivated({
        subscriptionId: id,
        planTier: 'RESIDENTIAL_MONTHLY'
      });
      showToast('Local demo payment confirmed! Subscription active.');
      setShowDemoModal(false);
      await loadBilling();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDownloadInvoice = (inv) => {
    const invNumber = inv.invoice_number || inv.id || 'INV-2026';
    const amount = inv.total_amount || inv.amount || 4000;
    const date = inv.issued_date ? new Date(inv.issued_date).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN');
    
    const content = `========================================================
SOCIETYCOOK - OFFICIAL TAX INVOICE & PAYMENT RECEIPT
========================================================
Invoice Number: ${invNumber}
Date of Issue:  ${date}
Resident:       ${inv.resident_name || user?.name || 'Rahul Sharma'}
Flat:           ${inv.resident_flat || user?.flat || 'A-101'}
Meal Service:   ${inv.meal_type || 'Dinner'} (${inv.slot_label || '08:30 PM'})
Society:        ${user?.society_name || 'Greenwood Residency'}
--------------------------------------------------------
Base Amount:    INR ${(amount).toLocaleString('en-IN')}.00
GST / Taxes:    INR 0.00 (Exempt under Composite Scheme)
--------------------------------------------------------
TOTAL PAID:     INR ${(amount).toLocaleString('en-IN')}.00
Payment Status: CONFIRMED & RECONCILED
Payment Mode:   Razorpay Secure Escrow / Settlement
========================================================
Thank you for hiring together and empowering local cooks!
SocietyCook Technologies Private Limited
========================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${invNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Downloaded receipt for ${invNumber}`);
  };

  const activeBooking = bookings[0];

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

      {/* Offline Payment Banner when Gateway is not active */}
      {!paymentConfig.onlinePaymentsAvailable && (
        <div className="p-4 sm:p-5 rounded-3xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700/60 flex items-start gap-3.5 text-amber-900 dark:text-amber-200">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-black text-sm">Online Payments Unavailable</h3>
            <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
              Online payments are temporarily unavailable pending payment gateway activation. Please check back later or contact customer support for assistance.
            </p>
          </div>
        </div>
      )}

      {/* Payment Interaction State Banner (Verifying / Failed / Cancelled) */}
      {paymentBanner && (
        <div className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs font-semibold ${
          paymentBanner.type === 'verifying'
            ? 'bg-sky-50 dark:bg-sky-950/60 border border-sky-300 dark:border-sky-700 text-sky-900 dark:text-sky-200'
            : paymentBanner.type === 'cancelled'
            ? 'bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200'
            : 'bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {paymentBanner.type === 'verifying' ? (
              <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{paymentBanner.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setPaymentBanner(null)}
            className="text-[11px] underline font-bold cursor-pointer hover:opacity-80 shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Test Mode Indicator Banner */}
      {paymentConfig.onlinePaymentsAvailable && paymentConfig.isTestMode && (
        <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/50 border border-sky-300 dark:border-sky-700/60 flex items-center justify-between text-sky-900 dark:text-sky-200 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span>
            <span>Razorpay Sandbox (Test Mode Active) — Simulated payment cards and UPI handles supported.</span>
          </div>
          <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-sky-200/60 dark:bg-sky-800/60 font-bold">TEST MODE</span>
        </div>
      )}

      {/* Subscription Status Card */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-3xl p-6 sm:p-8 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-white/20 text-white">
            {activeBooking?.status === 'ACTIVE' ? 'Active Community Plan' : 'Subscription Status'}
          </span>
          <h2 className="text-2xl sm:text-3xl font-black mt-2">
            {activeBooking ? `${activeBooking.cook_name || 'Chef'} · ${activeBooking.meal_type} (${activeBooking.slot_label})` : 'Sunrise Towers Dinner Club'}
          </h2>
          <div className="flex flex-wrap items-center gap-3 text-xs text-emerald-100 font-semibold mt-2">
            <span>₹{(activeBooking?.amount || activeBooking?.monthly_price || 4000).toLocaleString('en-IN')} / Month</span>
            <span>·</span>
            <span>
              Billing Renewal: {activeBooking?.end_date ? new Date(activeBooking.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '1st of next month'}
            </span>
            <span>·</span>
            <span className="font-bold text-white">
              Status: {activeBooking?.payment_status === 'SUCCESS' ? 'PAID & ACTIVE' : activeBooking?.status || 'ACTIVE'}
            </span>
          </div>
        </div>

        <div>
          {paymentConfig.onlinePaymentsAvailable ? (
            <button
              type="button"
              disabled={processingPayment}
              onClick={() => {
                const bId = activeBooking?.id || 1;
                handleInitiatePayment(bId);
              }}
              className="px-6 py-3 rounded-2xl bg-white text-emerald-800 font-bold text-xs hover:bg-slate-100 shadow-md transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
            >
              {processingPayment && <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />}
              {activeBooking?.payment_status === 'SUCCESS' ? 'Renew / Pay Advance' : 'Pay Now (Razorpay UPI / Card)'}
            </button>
          ) : (!import.meta.env.PROD && paymentConfig.demoAllowed) ? (
            <button
              type="button"
              disabled={processingPayment}
              onClick={() => {
                const bId = activeBooking?.id || 1;
                setPayingBookingId(bId);
                setShowDemoModal(true);
              }}
              className="px-6 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold text-xs shadow-md transition-transform active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              Pay Now (Dev Demo Simulation)
            </button>
          ) : (
            <button
              type="button"
              disabled
              title="Online payments are currently offline"
              className="px-6 py-3 rounded-2xl bg-white/30 text-white font-bold text-xs cursor-not-allowed opacity-75 shadow-none"
            >
              Online Payments Unavailable
            </button>
          )}
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
                <th className="p-3">Service & Date</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {(invoices.length > 0 ? invoices : [
                { id: 1, invoice_number: 'INV-2026-00003', issued_date: new Date().toISOString(), total_amount: 4000, meal_type: 'Dinner', slot_label: '08:30 PM' }
              ]).map((inv) => (
                <tr key={inv.id || inv.invoice_number}>
                  <td className="p-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                    {inv.invoice_number || `INV-2026-${String(inv.id).padStart(5, '0')}`}
                  </td>
                  <td className="p-3 text-slate-600 dark:text-slate-400">
                    {inv.meal_type ? `${inv.meal_type} (${inv.slot_label || 'Slot'})` : 'Monthly Cooking Subscription'} · {inv.issued_date ? new Date(inv.issued_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'November 2026'}
                  </td>
                  <td className="p-3 font-extrabold text-slate-900 dark:text-white">
                    ₹{(inv.total_amount || inv.amount || 4000).toLocaleString('en-IN')}
                  </td>
                  <td className="p-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      PAID
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleDownloadInvoice(inv)}
                      className="text-emerald-600 hover:text-emerald-700 font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" /> Receipt
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Local Dev Sandbox Modal (Strictly Restricted to Non-Production) */}
      {showDemoModal && !import.meta.env.PROD && paymentConfig.demoAllowed && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 text-center">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">Simulate Payment (Dev Sandbox)</h3>
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block text-left">Local Development Only</span>
              </div>
              <button
                type="button"
                aria-label="Close payment modal"
                onClick={() => setShowDemoModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 text-[11px] text-amber-800 dark:text-amber-300 text-left flex items-start gap-2">
              <span className="text-sm">⚠️</span>
              <p>
                <strong>DEMO TRANSACTION (DEV SANDBOX):</strong> This simulation modal is strictly restricted to local development environments. In production, payments are handled exclusively via Razorpay Checkout.
              </p>
            </div>

            <div className="p-5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="w-32 h-32 mx-auto bg-white p-2.5 rounded-xl border border-slate-300 shadow-xs flex flex-col items-center justify-center">
                <QrCode className="w-24 h-24 text-slate-900" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-semibold block">Simulated Demo QR Code</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white">₹4,200.00</span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">sandbox.demo.simulation@societycook</p>
            </div>

            <button
              type="button"
              onClick={() => handlePayDemo(payingBookingId)}
              className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/30 cursor-pointer"
            >
              Simulate Instant UPI Payment (Dev Sandbox)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
