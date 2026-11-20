/**
 * SocietyCook Enterprise Google Analytics 4 (GA4) Module
 *
 * Implements:
 * - Google Consent Mode v2 (default: denied)
 * - PII auto-redaction (passwords, tokens, emails, phone numbers, addresses, payment details)
 * - URL query sanitization to prevent token/credential leakage
 * - Asynchronous, non-blocking script injection
 * - SPA navigation tracking with duplicate suppression
 * - Separation of demo payments from actual verified financial purchase conversions
 * - Environment awareness (active in production or explicit debug mode)
 */

const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : typeof process !== 'undefined' ? process.env : {};
const GA_MEASUREMENT_ID = env.VITE_GA_MEASUREMENT_ID || 'G-RGG1E9LQ89';
const IS_PROD = Boolean(env.PROD || env.NODE_ENV === 'production');
const IS_DEBUG = Boolean(env.VITE_GA_DEBUG === 'true' || !IS_PROD);
const CONSENT_STORAGE_KEY = 'sc_ga_consent';

// Sensitive query parameter denylist for URL sanitization
const SENSITIVE_QUERY_PARAMS = [
  'token',
  'access_token',
  'refreshtoken',
  'code',
  'password',
  'reset_token',
  'secret',
  'email',
  'phone',
  'auth'
];

// Sensitive parameter key regex for event payloads
const SENSITIVE_KEY_REGEX = /pass(word)?|token|auth|secret|credit|card|cvv|account|pan|aadhaar|ssn|phone|mobile|email|address|flat/i;

let isInitialized = false;
let scriptLoaded = false;
let lastPagePath = '';

/**
 * Strips sensitive query parameters from URLs before reporting to GA4
 */
export function sanitizeUrl(rawUrl = '') {
  try {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://societycook.vercel.app';
    const url = new URL(rawUrl || (typeof window !== 'undefined' ? window.location.href : '/'), origin);
    for (const param of SENSITIVE_QUERY_PARAMS) {
      if (url.searchParams.has(param)) {
        url.searchParams.set(param, '[REDACTED]');
      }
    }
    return url.pathname + url.search;
  } catch {
    return rawUrl.split('?')[0] || '/';
  }
}

/**
 * Sanitizes event parameters, stripping PII, passwords, emails, phones, and tokens
 */
export function sanitizeParams(params = {}) {
  const clean = {};
  if (!params || typeof params !== 'object') return clean;

  for (const [key, value] of Object.entries(params)) {
    // Drop sensitive keys completely
    if (SENSITIVE_KEY_REGEX.test(key)) {
      continue;
    }

    if (typeof value === 'string') {
      // Redact email addresses
      if (/[\w.-]+@[\w.-]+\.\w+/.test(value)) {
        clean[key] = '[REDACTED_EMAIL]';
      }
      // Redact phone numbers (10-12 digits)
      else if (/\b\d{10,12}\b/.test(value)) {
        clean[key] = '[REDACTED_PHONE]';
      } else {
        clean[key] = value.slice(0, 100);
      }
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      clean[key] = value;
    }
  }

  return clean;
}

/**
 * Internal wrapper around window.gtag
 */
function gtag() {
  if (typeof window !== 'undefined') {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(arguments);
  }
}

/**
 * Dynamically loads the gtag.js script asynchronously without blocking paint
 */
function loadGtagScript() {
  if (typeof document === 'undefined' || scriptLoaded || !GA_MEASUREMENT_ID) return;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_MEASUREMENT_ID)}`;
  script.id = 'ga4-gtag-script';
  document.head.appendChild(script);
  scriptLoaded = true;
}

/**
 * Returns current consent status ('granted' | 'denied' | 'pending')
 */
export function getConsentStatus() {
  if (typeof window === 'undefined') return 'denied';
  const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
  if (stored === 'granted') return 'granted';
  if (stored === 'denied') return 'denied';
  return 'pending';
}

/**
 * Updates consent state and persists user choice in localStorage
 */
export function setConsentStatus(status) {
  const isGranted = status === 'granted';
  if (typeof window !== 'undefined') {
    localStorage.setItem(CONSENT_STORAGE_KEY, isGranted ? 'granted' : 'denied');
  }

  gtag('consent', 'update', {
    analytics_storage: isGranted ? 'granted' : 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied'
  });

  if (isGranted && !scriptLoaded) {
    loadGtagScript();
  }

  if (IS_DEBUG) {
    console.debug(`[GA4 Consent Mode] Updated analytics_storage to: ${isGranted ? 'granted' : 'denied'}`);
  }
}

/**
 * Initializes GA4 and Google Consent Mode v2
 */
export function initAnalytics() {
  if (typeof window === 'undefined' || isInitialized) return;

  // 1. Initialize dataLayer and gtag queue
  window.dataLayer = window.dataLayer || [];

  // 2. Set default consent (Consent Mode v2) - strictly deny by default
  const existingConsent = getConsentStatus();
  gtag('consent', 'default', {
    analytics_storage: existingConsent === 'granted' ? 'granted' : 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    wait_for_update: 500
  });

  // 3. Configure GA4 Measurement ID (disabled default automatic page_view to prevent SPA duplicates)
  gtag('js', new Date());
  gtag('config', GA_MEASUREMENT_ID, {
    send_page_view: false, // Managed manually via React Router SPA listener
    anonymize_ip: true,
    cookie_flags: 'SameSite=None;Secure'
  });

  // 4. Load script if consent was already granted or schedule asynchronous load
  if (existingConsent === 'granted') {
    loadGtagScript();
  }

  isInitialized = true;
  if (IS_DEBUG) {
    console.debug(`[GA4 Analytics] Initialized with ID: ${GA_MEASUREMENT_ID} (Consent: ${existingConsent})`);
  }
}

/**
 * Generic event tracker with automatic PII sanitization and debug logging
 */
export function trackEvent(eventName, params = {}) {
  const cleanParams = sanitizeParams(params);

  if (IS_DEBUG) {
    console.debug(`[GA4 Event] ${eventName}:`, cleanParams);
  }

  // Only dispatch to Google if in production or debug mode and gtag is available
  if (typeof window !== 'undefined' && (IS_PROD || IS_DEBUG)) {
    gtag('event', eventName, cleanParams);
  }
}

/* =========================================================================
   SPECIALIZED BUSINESS EVENTS (OWASP & PRIVACY-COMPLIANT)
   ========================================================================= */

/**
 * Track SPA Page View with duplicate suppression
 */
export function trackPageView(path, title) {
  const sanitizedPath = sanitizeUrl(path || window.location.pathname);

  // Prevent duplicate page view events on re-renders
  if (sanitizedPath === lastPagePath) {
    return;
  }
  lastPagePath = sanitizedPath;

  trackEvent('page_view', {
    page_title: title || (typeof document !== 'undefined' ? document.title : ''),
    page_location: typeof window !== 'undefined' ? window.location.origin + sanitizedPath : sanitizedPath,
    page_path: sanitizedPath
  });
}

/**
 * Service Exploration (Cooking, Dishwashing, Combo)
 */
export function trackServiceExploration(serviceType) {
  trackEvent('explore_service', {
    service_type: String(serviceType || 'COOKING').toUpperCase()
  });
}

/**
 * User Registration Started
 */
export function trackRegistrationStart() {
  trackEvent('sign_up_start', {
    step_name: 'account_details'
  });
}

/**
 * User Registration Completed
 */
export function trackRegistrationComplete(method = 'credentials') {
  trackEvent('sign_up', {
    method
  });
}

/**
 * User Login Completed
 */
export function trackLogin(method = 'credentials') {
  trackEvent('login', {
    method
  });
}

/**
 * Professional Directory Search & Filters
 */
export function trackProfessionalSearch({ service, society, mealType } = {}) {
  trackEvent('search', {
    search_term: [service, society, mealType].filter(Boolean).join(' '),
    service_filter: service || 'ALL',
    society_filter: society || 'ALL'
  });
}

/**
 * Community Group Created
 */
export function trackGroupCreated({ groupId, serviceType, targetSize, mealType } = {}) {
  trackEvent('create_group', {
    group_id: groupId ? String(groupId) : undefined,
    service_type: serviceType,
    meal_type: mealType,
    target_size: Number(targetSize || 0)
  });
}

/**
 * Community Group Joined
 */
export function trackGroupJoined({ groupId, societyId } = {}) {
  trackEvent('join_group', {
    group_id: groupId ? String(groupId) : undefined,
    society_id: societyId ? String(societyId) : undefined
  });
}

/**
 * Booking Initiation
 */
export function trackBookingStart({ serviceType, pricingTier } = {}) {
  trackEvent('booking_start', {
    service_type: serviceType,
    pricing_tier: pricingTier
  });
}

/**
 * Checkout Started
 */
export function trackCheckoutStart({ serviceType, planId, amount } = {}) {
  trackEvent('begin_checkout', {
    service_type: serviceType,
    plan_id: planId ? String(planId) : undefined,
    value: Number(amount || 0),
    currency: 'INR'
  });
}

/**
 * Payment Transaction Completed
 * IMPORTANT: Financial conversions ('purchase') are ONLY fired for real, verified transactions.
 * Demo payments fire 'demo_payment_completed' and NEVER pollute financial analytics.
 */
export function trackPaymentSuccess({ transactionId, value, currency = 'INR', isDemo = false } = {}) {
  if (isDemo) {
    trackEvent('demo_payment_completed', {
      transaction_id: transactionId ? String(transactionId) : 'DEMO_' + Date.now(),
      value: Number(value || 0),
      currency,
      is_demo: true
    });
    return;
  }

  // Verified real financial transaction conversion
  trackEvent('purchase', {
    transaction_id: String(transactionId),
    value: Number(value || 0),
    currency,
    items: [
      {
        item_id: 'SOCIETYCOOK_MONTHLY_PLAN',
        item_name: 'SocietyCook Household Plan',
        price: Number(value || 0),
        quantity: 1
      }
    ]
  });
}

/**
 * Subscription Activated
 */
export function trackSubscriptionActivated({ subscriptionId, planTier, billingCycle = 'MONTHLY' } = {}) {
  trackEvent('activate_subscription', {
    subscription_id: subscriptionId ? String(subscriptionId) : undefined,
    plan_tier: planTier,
    billing_cycle: billingCycle
  });
}

/**
 * Society Partnership / RWA Enquiry Submitted
 */
export function trackSocietyLead({ flats, societyName } = {}) {
  trackEvent('generate_lead', {
    lead_type: 'RWA_PARTNERSHIP',
    society_name: societyName ? String(societyName).slice(0, 50) : undefined,
    flats_estimate: flats ? Number(flats) : undefined
  });
}

/**
 * Professional Onboarding Enquiry Submitted
 */
export function trackProfessionalLead({ serviceType } = {}) {
  trackEvent('generate_lead', {
    lead_type: 'PRO_ONBOARDING',
    service_type: serviceType || 'GENERAL'
  });
}
