/**
 * AGENMATICA - API Client
 * Centralized HTTP client for backend communication.
 */

import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Auth interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-logout on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ─── Auth ────────────────────────────────────────

export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

// ─── Bands ───────────────────────────────────────

export const bandsAPI = {
  list: () => api.get('/bands/'),
  getOverview: () => api.get('/bands/overview'),
  get: (id) => api.get(`/bands/${id}`),
  create: (data) => api.post('/bands/', data),
  update: (id, data) => api.put(`/bands/${id}`, data),
  getProfile: (id) => api.get(`/bands/${id}/profile`),
  getLearning: (id) => api.get(`/bands/${id}/learning`),
};

export const membersAPI = {
  list: (bandId) => api.get(`/bands/${bandId}/members`),
  create: (bandId, data) => api.post(`/bands/${bandId}/members/`, data),
  update: (id, data) => api.put(`/bands/members/${id}`, data),
};

// ─── Networks ────────────────────────────────────

export const networksAPI = {
  list: (bandId) => api.get('/networks/', { params: { band_id: bandId } }),
  connect: (platform, bandId, data = {}) =>
    api.post(`/networks/connect/${platform}?band_id=${bandId}`, data),
  disconnect: (networkId) => api.delete(`/networks/${networkId}`),
  scan: (networkId) => api.post(`/networks/${networkId}/scan`),
  status: (networkId) => api.get(`/networks/${networkId}/status`),
};

// ─── Posts ───────────────────────────────────────

export const postsAPI = {
  today: (bandId) => api.get('/posts/today', { params: { band_id: bandId } }),
  approve: (postId) => api.post(`/posts/${postId}/approve`),
  edit: (postId, data) => api.post(`/posts/${postId}/edit`, data),
  reject: (postId, data) => api.post(`/posts/${postId}/reject`, data),
  published: (bandId, limit = 20) =>
    api.get('/posts/published', { params: { band_id: bandId, limit } }),
};

// ─── Analytics ───────────────────────────────────

export const analyticsAPI = {
  overview: (bandId) => api.get('/analytics/overview', { params: { band_id: bandId } }),
  getAggregate: () => api.get('/analytics/aggregate'),
  platform: (platform, bandId) =>
    api.get(`/analytics/${platform}`, { params: { band_id: bandId } }),
};

export const campaignsAPI = {
  list: (bandId) => api.get('/campaigns/', { params: { band_id: bandId } }),
  get: (id) => api.get(`/campaigns/${id}`),
  create: (bandId, data) => api.post(`/campaigns/?band_id=${bandId}`, data),
  update: (id, data) => api.put(`/campaigns/${id}`, data),
};

export default api;
