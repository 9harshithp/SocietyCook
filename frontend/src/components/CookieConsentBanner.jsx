import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, X } from 'lucide-react';
import { getConsentStatus, setConsentStatus } from '../services/analytics';

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show banner if consent hasn't been set yet
    const status = getConsentStatus();
    if (status === 'pending') {
      // Delay slightly so it doesn't distract during initial paint or block FCP/LCP
      const timer = setTimeout(() => {
        setVisible(true);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    setConsentStatus('granted');
    setVisible(false);
  };

  const handleDecline = () => {
    setConsentStatus('denied');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Privacy & Analytics Preferences"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 p-4 sm:p-5 rounded-2xl bg-white/95 dark:bg-[#14231D]/95 backdrop-blur-md border border-[#E6DFD3] dark:border-white/10 shadow-2xl transition-all animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-[#153D32]/10 dark:bg-white/10 text-[#153D32] dark:text-[#E9A15B] flex items-center justify-center shrink-0 mt-0.5">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div className="flex-1 text-left">
          <p role="heading" aria-level="2" className="text-xs font-bold text-[#153D32] dark:text-white mb-1">
            Privacy & Analytics Preferences
          </p>
          <p className="text-[11px] text-[#42524A] dark:text-slate-300 leading-relaxed font-medium mb-3">
            We use privacy-friendly analytics to measure service performance and tower coordination reliability. We strictly prohibit tracking of personal contact details, passwords, flat numbers, or financial credentials.{' '}
            <Link to="/privacy" className="text-[#153D32] dark:text-[#E9A15B] underline hover:no-underline font-semibold">
              Read Policy
            </Link>
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAccept}
              className="flex-1 px-3.5 py-2 rounded-xl bg-[#153D32] hover:bg-[#1E5244] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              Accept Analytics
            </button>
            <button
              type="button"
              onClick={handleDecline}
              className="flex-1 px-3.5 py-2 rounded-xl bg-transparent hover:bg-black/5 dark:hover:bg-white/5 border border-[#E6DFD3] dark:border-white/10 text-[#202A25] dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
            >
              Decline
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDecline}
          aria-label="Dismiss cookie notice"
          className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

