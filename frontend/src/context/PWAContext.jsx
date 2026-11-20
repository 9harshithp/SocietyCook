import React, { createContext, useContext, useState, useEffect } from 'react';
import { trackEvent } from '../services/analytics';
import { applyServiceWorkerUpdate } from '../serviceWorkerRegistration';

const PWAContext = createContext(null);

const DISMISSAL_KEY = 'sc_pwa_install_dismissed';
const COOLDOWN_DAYS = 7;

export function PWAProvider({ children }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  // Check if standalone (already installed)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true ||
        document.referrer.includes('android-app://');
      setIsStandalone(Boolean(isStandaloneMode));
    };

    checkStandalone();

    // Check iOS Safari
    const ua = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(ua) && !window.MSStream;
    const isSafari = /safari/.test(ua) && !/chrome|crios|fxios|android/.test(ua);
    setIsIOS(Boolean(isIOSDevice && isSafari));

    // Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);

      // Check dismissal cooldown
      const dismissedTime = localStorage.getItem(DISMISSAL_KEY);
      const isWithinCooldown =
        dismissedTime && Date.now() - Number(dismissedTime) < COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

      // Coordinate with cookie banner: check if cookie consent is already decided
      const hasCookieConsent = Boolean(localStorage.getItem('sc_ga_consent'));

      if (!isWithinCooldown) {
        // Delay slightly for smooth entrance
        const delay = hasCookieConsent ? 2000 : 5000;
        const timer = setTimeout(() => {
          setShowInstallBanner(true);
          trackEvent('install_app_banner_view');
        }, delay);
        return () => clearTimeout(timer);
      }
    };

    // Listen for appinstalled
    const handleAppInstalled = () => {
      console.log('[PWA] SocietyCook successfully installed!');
      setDeferredPrompt(null);
      setIsInstallable(false);
      setShowInstallBanner(false);
      setIsStandalone(true);
      trackEvent('app_installed');
    };

    // Listen for Service Worker update
    const handleSWUpdate = () => {
      setUpdateAvailable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('societycook:sw-update', handleSWUpdate);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('societycook:sw-update', handleSWUpdate);
    };
  }, []);

  const promptInstall = async () => {
    trackEvent('install_app_clicked');

    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          console.log('[PWA] User accepted installation prompt');
          trackEvent('install_app_prompt_accepted');
          setShowInstallBanner(false);
        } else {
          console.log('[PWA] User dismissed installation prompt');
          trackEvent('install_app_prompt_dismissed');
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.error('[PWA] Prompt installation error:', err);
      }
    } else if (isIOS) {
      setShowIOSInstructions(true);
    }
  };

  const dismissBanner = () => {
    setShowInstallBanner(false);
    localStorage.setItem(DISMISSAL_KEY, String(Date.now()));
    trackEvent('install_app_prompt_dismissed');
  };

  const applyUpdate = () => {
    applyServiceWorkerUpdate();
  };

  return (
    <PWAContext.Provider
      value={{
        isInstallable: isInstallable || (isIOS && !isStandalone),
        isStandalone,
        isIOS,
        showInstallBanner: showInstallBanner && !isStandalone,
        showIOSInstructions,
        setShowIOSInstructions,
        updateAvailable,
        promptInstall,
        dismissBanner,
        applyUpdate
      }}
    >
      {children}
    </PWAContext.Provider>
  );
}

export function usePWA() {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error('usePWA must be used within a PWAProvider');
  }
  return context;
}

