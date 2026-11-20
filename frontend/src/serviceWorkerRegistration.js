/**
 * SocietyCook Enterprise Service Worker Registration
 * Handles registration, update detection, and offline coordination.
 */

import { trackEvent } from './services/analytics';

let registration = null;

export function registerServiceWorker(onUpdateCallback) {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        registration = reg;
        console.log('[PWA] Service Worker registered successfully with scope:', reg.scope);

        // Check for updates
        reg.addEventListener('updatefound', () => {
          const installingWorker = reg.installing;
          if (!installingWorker) return;

          installingWorker.addEventListener('statechange', () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // New content available
                console.log('[PWA] New version available! Awaiting user confirmation to reload.');
                trackEvent('app_update_available');
                if (onUpdateCallback) {
                  onUpdateCallback(reg);
                }
                window.dispatchEvent(new CustomEvent('societycook:sw-update', { detail: reg }));
              } else {
                console.log('[PWA] Content is cached for offline use.');
              }
            }
          });
        });
      })
      .catch((err) => {
        console.warn('[PWA] Service Worker registration failed:', err);
      });

    // Handle controller change (when skipWaiting takes effect)
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  });
}

export function applyServiceWorkerUpdate() {
  if (!registration || !registration.waiting) {
    window.location.reload();
    return;
  }
  registration.waiting.postMessage({ type: 'SKIP_WAITING' });
}

export function notifyServiceWorkerLogout() {
  if (navigator.serviceWorker && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_USER_DATA' });
  }
}

export function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((reg) => reg.unregister())
      .catch((err) => console.error('[PWA] Error unregistering service worker:', err));
  }
}

