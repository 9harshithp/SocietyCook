import React from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';
import App from './App';
import { initMonitoring } from './services/monitoring';
import { EnterpriseErrorBoundary } from './components/EnterpriseErrorBoundary';

// Initialize Sentry error monitoring & performance tracking
initMonitoring();

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
