import React from 'react';
import { Download, X, Share, PlusSquare, ChefHat } from 'lucide-react';
import { usePWA } from '../context/PWAContext';

export function InstallAppBanner() {
  const {
    showInstallBanner,
    promptInstall,
    dismissBanner,
    isIOS,
    showIOSInstructions,
    setShowIOSInstructions
  } = usePWA();

  if (!showInstallBanner && !showIOSInstructions) {
    return null;
  }

  return (
    <>
      {/* Floating Install Capsule */}
      {showInstallBanner && (
        <aside
          role="region"
          aria-label="Application Installation"
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-40 max-w-md w-[calc(100%-2rem)] sm:w-auto mx-auto pointer-events-auto transition-all duration-300 transform translate-y-0 opacity-100"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="bg-[#153D32] dark:bg-[#12231D] text-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 border border-[#E9A15B]/30 shadow-2xl shadow-black/40 flex items-center justify-between gap-3 sm:gap-4 backdrop-blur-md">
            {/* App Icon */}
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-[#1E5747] to-[#153D32] border border-[#E9A15B]/40 flex items-center justify-center text-[#E9A15B] shrink-0 shadow-md">
              <ChefHat className="w-6 h-6 text-[#E9A15B]" />
            </div>

            {/* Copy */}
            <div className="flex-1 min-w-0 pr-1 text-left">
              <h3 className="font-extrabold text-xs sm:text-sm text-white tracking-tight truncate">
                Install SocietyCook
              </h3>
              <p className="text-[11px] sm:text-xs text-emerald-100/80 font-medium truncate mt-0.5">
                Quick access. App-like experience.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={promptInstall}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-[#E9A15B] hover:bg-[#D88F4A] active:scale-95 text-[#153D32] font-black text-xs transition-all shadow-md cursor-pointer shrink-0"
              >
                <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Install</span>
              </button>

              <button
                type="button"
                onClick={dismissBanner}
                aria-label="Dismiss install banner"
                className="p-1.5 rounded-lg text-emerald-200/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* iOS Safari Installation Modal / Instruction Sheet */}
      {showIOSInstructions && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="ios-install-title"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-4"
        >
          <div className="max-w-sm w-full bg-[#153D32] text-white rounded-3xl p-6 border border-[#E9A15B]/40 shadow-2xl space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#E9A15B] text-[#153D32] flex items-center justify-center">
                  <ChefHat className="w-6 h-6" />
                </div>
                <div>
                  <h3 id="ios-install-title" className="font-extrabold text-sm text-white">Install on iPhone / iPad</h3>
                  <p className="text-[11px] text-emerald-200">Apple Safari Instructions</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSInstructions(false)}
                aria-label="Close instructions"
                className="p-1 rounded-lg text-emerald-200 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-emerald-100 bg-white/5 p-4 rounded-2xl border border-white/10">
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-[#E9A15B] text-[#153D32] font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  1
                </div>
                <p>
                  Tap the <strong className="text-white inline-flex items-center gap-1 mx-1"><Share className="w-3.5 h-3.5 inline text-[#E9A15B]" /> Share</strong> button in Safari's bottom toolbar.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-[#E9A15B] text-[#153D32] font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  2
                </div>
                <p>
                  Scroll down the share sheet and select <strong className="text-white inline-flex items-center gap-1 mx-1"><PlusSquare className="w-3.5 h-3.5 inline text-[#E9A15B]" /> Add to Home Screen</strong>.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-[#E9A15B] text-[#153D32] font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  3
                </div>
                <p>
                  Tap <strong className="text-[#E9A15B]">Add</strong> in the top-right corner to launch SocietyCook as a standalone app!
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSInstructions(false)}
              className="w-full py-2.5 rounded-xl bg-[#E9A15B] hover:bg-[#D88F4A] text-[#153D32] font-extrabold text-xs text-center transition-colors cursor-pointer"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
}

