import React from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';
import App from './App';
import { initMonitoring } from './services/monitoring';
import { EnterpriseErrorBoundary } from './components/EnterpriseErrorBoundary';

// Initialize Sentry error monitoring & performance tracking
initMonitoring();

// Prevent search engine indexing on staging and non-production preview deployments
if (
  import.meta.env.VITE_IS_STAGING === 'true' ||
  (window.location.hostname.includes('staging') || window.location.hostname.includes('vercel.app')) &&
  window.location.hostname !== 'societycook.vercel.app'
) {
  const robotsMeta = document.querySelector('meta[name="robots"]');
  if (robotsMeta) {
    robotsMeta.setAttribute('content', 'noindex, nofollow, noarchive');
  }
}

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <EnterpriseErrorBoundary>
        <App />
      </EnterpriseErrorBoundary>
    </React.StrictMode>
  );
}
