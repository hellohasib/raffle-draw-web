import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://121.200.60.82:5001';

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
      // Only redirect to login if we're not already on the login page
      // This prevents page refresh when login fails
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (username, password) => api.post('/api/auth/login', { username, password }),
  register: (username, email, password, firstName, lastName, organization) => api.post('/api/auth/register', { 
    username, 
    email, 
    password, 
    firstName, 
    lastName, 
    organization,
    role: 'user' 
  }),
  getProfile: () => api.get('/api/auth/profile'),
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
  // Update prize
  updatePrize: (raffleId, prizeId, data) => api.put(`/api/raffle-draws/${raffleId}/prizes/${prizeId}`, data),
  // Delete prize
  deletePrize: (raffleId, prizeId) => api.delete(`/api/raffle-draws/${raffleId}/prizes/${prizeId}`),
  
  // Add participant to raffle draw
  addParticipant: (raffleId, data) => api.post(`/api/raffle-draws/${raffleId}/participants`, data),
  // Update participant details
  updateParticipant: (raffleId, participantId, data) => api.put(`/api/raffle-draws/${raffleId}/participants/${participantId}`, data),
  // Delete participant
  deleteParticipant: (raffleId, participantId) => api.delete(`/api/raffle-draws/${raffleId}/participants/${participantId}`),
  
  // Conduct raffle draw (all at once)
  conductDraw: (id, mode = 'all') => api.post(`/api/raffle-draws/${id}/draw?mode=${mode}`),
  
  // Get draw status
  getDrawStatus: (id) => api.get(`/api/raffle-draws/${id}/draw-status`),
  
  // Draw winner for specific prize
  drawPrize: (raffleId, prizeId) => api.post(`/api/raffle-draws/${raffleId}/draw-prize/${prizeId}`),
  
  // Reset draw
  resetDraw: (id) => api.post(`/api/raffle-draws/${id}/reset-draw`),
  
  // Redraw winner for specific prize (clear and allow redraw)
  redrawPrize: (raffleId, prizeId) => api.post(`/api/raffle-draws/${raffleId}/prizes/${prizeId}/redraw`),
  
  // Mark raffle draw as closed
  markAsClosed: (id) => api.post(`/api/raffle-draws/${id}/mark-closed`),
  
  // Download winners list
  downloadWinners: (id, format = 'csv') => api.get(`/api/raffle-draws/${id}/winners/download?format=${format}`, {
    responseType: format === 'csv' ? 'blob' : 'json'
  }),

  // Upload participants from file
  uploadParticipants: (raffleId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/api/uploads/participants/${raffleId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// Admin API
export const adminAPI = {
  // Get all raffle draws (admin view)
  getAllRaffleDraws: (params = {}) => api.get('/api/admin/raffle-draws', { params }),
  
  // Get all users
  getAllUsers: (params = {}) => api.get('/api/admin/users', { params }),
  
  // Update user role
  updateUserRole: (userId, role) => api.put(`/api/admin/users/${userId}/role`, { role }),
  
  // Update raffle draw status
  updateRaffleDrawStatus: (raffleId, status) => api.put(`/api/admin/raffle-draws/${raffleId}/status`, { status }),
};

export default api;
