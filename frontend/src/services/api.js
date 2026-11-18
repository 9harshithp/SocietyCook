import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor: attach bearer token
apiClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('sc_access_token') || sessionStorage.getItem('sc_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: extract response body
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
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

  // Cooks
  getCooks: (societyId) => apiClient.get(`/cooks${societyId ? `?society_id=${societyId}` : ''}`),
  getCook: (id) => apiClient.get(`/cooks/${id}`),
  updateCookProfile: (data) => apiClient.post('/cooks/profile', data),

  // Groups (Core Community Hiring)
  getGroups: (societyId, status) =>
    apiClient.get(`/groups?societyId=${societyId || 1}${status ? `&status=${status}` : ''}`),
  getGroup: (id) => apiClient.get(`/groups/${id}`),
  createGroup: (data) => apiClient.post('/groups', data),
  joinGroup: (id, data) => apiClient.post(`/groups/${id}/join`, data),
  getGroupRecommendations: (id) => apiClient.get(`/groups/${id}/recommendations`),
  proposeCookForGroup: (id, cookId) => apiClient.post(`/groups/${id}/propose-cook`, { cookId }),
  activateGroup: (id) => apiClient.post(`/groups/${id}/activate`),

  // Pricing
  calculatePricing: (data) => apiClient.post('/pricing/calculate', data),
  getPricingTiers: (meal) => apiClient.get(`/pricing/tiers?meal=${meal || 'DINNER'}`),

  // Bookings & Payments
  getBookings: () => apiClient.get('/bookings'),
  createBooking: (data) => apiClient.post('/bookings', data),
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
