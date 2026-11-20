import React from 'react';
import { RefreshCw, Sparkles, X } from 'lucide-react';
import { usePWA } from '../context/PWAContext';

export function UpdateNotificationBanner() {
  const { updateAvailable, applyUpdate } = usePWA();
  const [dismissed, setDismissed] = React.useState(false);

  if (!updateAvailable || dismissed) {
    return null;
  }

  return (
    <aside
      role="status"
      aria-live="polite"
      className="fixed top-20 right-4 sm:right-6 z-50 max-w-sm w-[calc(100%-2rem)] sm:w-auto bg-white dark:bg-[#15221C] text-[#202A25] dark:text-white rounded-2xl p-3.5 border border-emerald-600/30 dark:border-[#E9A15B]/30 shadow-2xl shadow-black/20 animate-in fade-in slide-in-from-top-3 flex items-center justify-between gap-3 text-xs"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-[#153D32] dark:text-[#E9A15B] flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="font-extrabold text-xs text-[#153D32] dark:text-[#E9A15B]">Update Available</div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
            A newer SocietyCook version is ready.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={applyUpdate}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#153D32] dark:bg-[#E9A15B] text-white dark:text-[#153D32] font-bold text-[11px] hover:opacity-90 active:scale-95 transition-all cursor-pointer shrink-0"
        >
          <RefreshCw className="w-3 h-3 stroke-[2.5]" />
          <span>Refresh</span>
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss update alert"
          className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
}

