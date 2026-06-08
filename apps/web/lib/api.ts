import axios from 'axios';
import { useAuthStore } from './store';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT from store
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefresh } = data.data.tokens;

        useAuthStore.getState().setTokens(accessToken, newRefresh);
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch (_e) {
        useAuthStore.getState().logout();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Typed API methods
export const authApi = {
  login: (email: string, password?: string) =>
    api.post('/auth/login', { email, password }).then((r) => r.data.data),
  me: () => api.get('/auth/me').then((r) => r.data.data),
};

export const projectsApi = {
  list: () => api.get('/projects').then((r) => r.data.data),
  get: (id: string) => api.get(`/projects/${id}`).then((r) => r.data.data),
  create: (body: { name: string; description?: string; phase?: string; bid_due_date?: string; location?: string; gcr_number?: string }) =>
    api.post('/projects', body).then((r) => r.data.data),
  update: (id: string, body: Record<string, unknown>) =>
    api.patch(`/projects/${id}`, body).then((r) => r.data.data),
  delete: (id: string) => api.delete(`/projects/${id}`),
};

export const sheetsApi = {
  list: (projectId: string) =>
    api.get(`/projects/${projectId}/sheets`).then((r) => r.data.data),
  getUrl: (sheetId: string) =>
    api.get(`/sheets/${sheetId}/url`).then((r) => r.data.data),
  upload: (projectId: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api
      .post(`/projects/${projectId}/sheets`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data.data);
  },
};

export const reviewsApi = {
  trigger: (sheetId: string) =>
    api.post(`/sheets/${sheetId}/review`).then((r) => r.data.data),
  get: (reviewId: string) =>
    api.get(`/reviews/${reviewId}`).then((r) => r.data.data),
  listForSheet: (sheetId: string) =>
    api.get(`/sheets/${sheetId}/reviews`).then((r) => r.data.data),
};

export const issuesApi = {
  list: (params?: { review_id?: string; severity?: string; status?: string }) =>
    api.get('/issues', { params }).then((r) => r.data),
  update: (id: string, body: { status?: string; assigned_to?: string | null }) =>
    api.patch(`/issues/${id}`, body).then((r) => r.data.data),
};
