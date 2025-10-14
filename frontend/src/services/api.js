import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/api/auth/login', { email, password }),
  register: (name, email, password) => api.post('/api/auth/register', { name, email, password }),
  getProfile: () => api.get('/api/auth/me'),
};

// Raffle Draw API
export const raffleAPI = {
  // Get all raffle draws for user
  getRaffleDraws: (params = {}) => api.get('/api/raffle-draws', { params }),
  
  // Get specific raffle draw
  getRaffleDraw: (id) => api.get(`/api/raffle-draws/${id}`),
  
  // Create raffle draw
  createRaffleDraw: (data) => api.post('/api/raffle-draws', data),
  
  // Update raffle draw
  updateRaffleDraw: (id, data) => api.put(`/api/raffle-draws/${id}`, data),
  
  // Delete raffle draw
  deleteRaffleDraw: (id) => api.delete(`/api/raffle-draws/${id}`),
  
  // Add prize to raffle draw
  addPrize: (raffleId, data) => api.post(`/api/raffle-draws/${raffleId}/prizes`, data),
  
  // Add participant to raffle draw
  addParticipant: (raffleId, data) => api.post(`/api/raffle-draws/${raffleId}/participants`, data),
  
  // Conduct raffle draw (all at once)
  conductDraw: (id, mode = 'all') => api.post(`/api/raffle-draws/${id}/draw?mode=${mode}`),
  
  // Get draw status
  getDrawStatus: (id) => api.get(`/api/raffle-draws/${id}/draw-status`),
  
  // Draw winner for specific prize
  drawPrize: (raffleId, prizeId) => api.post(`/api/raffle-draws/${raffleId}/draw-prize/${prizeId}`),
  
  // Reset draw
  resetDraw: (id) => api.post(`/api/raffle-draws/${id}/reset-draw`),
};

// Admin API
export const adminAPI = {
  // Get all raffle draws (admin view)
  getAllRaffleDraws: (params = {}) => api.get('/api/admin/raffle-draws', { params }),
  
  // Get all users
  getAllUsers: (params = {}) => api.get('/api/admin/users', { params }),
  
  // Update user role
  updateUserRole: (userId, role) => api.put(`/api/admin/users/${userId}/role`, { role }),
};

export default api;
