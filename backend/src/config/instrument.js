import { initBackendMonitoring } from './monitoring.js';

// Top-level module execution guarantees Sentry initializes before any application framework imports
initBackendMonitoring();

