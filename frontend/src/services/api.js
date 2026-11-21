import axios from 'axios';
import { trackLatency, captureException } from './monitoring';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 4000, // 4-second timeout to prevent connection hangs during cold starts or crawling
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor: attach bearer token and start timestamp for latency tracking
apiClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('sc_access_token') || sessionStorage.getItem('sc_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.metadata = { startTime: Date.now() };
  return config;
});

// Helper to determine operation name from URL and method
function getOperationName(url, method) {
  const u = String(url || '');
  const m = String(method || '').toUpperCase();
  if (u.includes('/auth/login')) return 'Auth:Login';
  if (u.includes('/bookings') && m === 'POST') return 'Booking:Create';
  if (u.includes('/bookings') && u.includes('/cancel')) return 'Booking:Cancel';
  return null;
}

// Response interceptor: extract response body and track operation latencies
apiClient.interceptors.response.use(
  (response) => {
    const duration = response.config?.metadata?.startTime
      ? Date.now() - response.config.metadata.startTime
      : null;

    const operation = getOperationName(response.config?.url, response.config?.method);
    if (operation && duration !== null) {
      trackLatency(operation, duration, {
        status: response.status,
        method: response.config?.method
      });
    }

    return response.data;
  },
  (error) => {
    const duration = error.config?.metadata?.startTime
      ? Date.now() - error.config.metadata.startTime
      : null;

    const operation = getOperationName(error.config?.url, error.config?.method);
    if (operation && duration !== null) {
      trackLatency(operation, duration, {
        status: error.response?.status || 'NETWORK_ERROR',
        method: error.config?.method,
        hasError: true
      });
    }

    // Capture elevated 5xx errors to monitoring
    if (error.response?.status >= 500) {
      captureException(error, {
        url: error.config?.url,
        status: error.response?.status
      });
    }

    const message = error.response?.data?.message || error.message || 'Request failed';
    return Promise.reject(new Error(message));
  }
);

export const api = {
  // Auth
  login: (data) => apiClient.post('/auth/login', data),
  register: (data) => apiClient.post('/auth/register', data),
  getMe: () => apiClient.get('/auth/me'),
  logout: (refreshToken) => apiClient.post('/auth/logout', { refreshToken }),

  // Societies
  getSocieties: () => apiClient.get('/societies'),
  getSociety: (id) => apiClient.get(`/societies/${id}`),

  // Services & Categories (V3 Extension)
  getServices: () => apiClient.get('/services'),

  // Cooks & Household Professionals
  getCooks: (societyId, serviceType) =>
    apiClient.get('/cooks', { params: { society_id: societyId, service_type: serviceType } }),
  getCook: (id) => apiClient.get(`/cooks/${id}`),
  updateCookProfile: (data) => apiClient.post('/cooks/profile', data),

  // Groups (Core Community Hiring)
  getGroups: (societyId, status, serviceType) =>
    apiClient.get(`/groups`, { params: { societyId: societyId || 1, status, service_type: serviceType } }),
  getGroup: (id) => apiClient.get(`/groups/${id}`),
  createGroup: (data) => apiClient.post('/groups', data),
  joinGroup: (id, data) => apiClient.post(`/groups/${id}/join`, data),
  getGroupRecommendations: (id) => apiClient.get(`/groups/${id}/recommendations`),
  proposeCookForGroup: (id, cookId) => apiClient.post(`/groups/${id}/propose-cook`, { cookId }),
  activateGroup: (id) => apiClient.post(`/groups/${id}/activate`),

  // Pricing
  calculatePricing: (data) => apiClient.post('/pricing/calculate', data),
  getPricingTiers: (meal, service) =>
    apiClient.get(`/pricing/tiers`, { params: { meal: meal || 'DINNER', service: service || 'COOKING' } }),

  // Bookings & Payments
  getBookings: () => apiClient.get('/bookings'),
  getInvoices: () => apiClient.get('/invoices'),
  createBooking: (data) => apiClient.post('/bookings', data),
  cancelBooking: (bookingId) => apiClient.patch(`/bookings/${bookingId}/cancel`),
  payDemo: (bookingId) => apiClient.post(`/bookings/${bookingId}/pay-demo`),

  // Sessions & Attendance
  getSessions: (params) => apiClient.get('/sessions', { params }),
  updateAttendance: (sessionId, action, otp) =>
    apiClient.post(`/sessions/${sessionId}/attendance`, { action, otp }),
  disputeSession: (sessionId, reason) =>
    apiClient.post(`/sessions/${sessionId}/dispute`, { reason }),

  // Leaves & Replacements
  getLeaves: () => apiClient.get('/leaves'),
  applyLeave: (data) => apiClient.post('/leaves', data),
  approveLeave: (id) => apiClient.post(`/leaves/${id}/approve`),
  getReplacements: () => apiClient.get('/replacements'),

  // Reviews & Notifications
  submitReview: (data) => apiClient.post('/reviews', data),
  getNotifications: () => apiClient.get('/notifications'),
  markNotificationsRead: () => apiClient.post('/notifications/mark-read'),

  // Analytics
  getResidentAnalytics: () => apiClient.get('/analytics/resident'),
  getCookAnalytics: () => apiClient.get('/analytics/cook'),
  getSocietyAnalytics: (id) => apiClient.get(`/analytics/society/${id}`),
  getAdminAnalytics: () => apiClient.get('/analytics/admin'),
  toggleCookVerification: (cookId, verified) =>
    apiClient.post(`/admin/cooks/${cookId}/verify`, { verified })
};

export const money = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
export const day = (d) => String(d || '').slice(0, 10);
