import axios, { AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ─── Auth ──────────────────────────────────────────────────────────────────────

export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

// ─── Workspaces ───────────────────────────────────────────────────────────────

export const workspaceApi = {
  create: (data: { name: string }) => api.post('/workspaces', data),
  getAll: () => api.get('/workspaces'),
  getOne: (id: string) => api.get(`/workspaces/${id}`),
  update: (id: string, data: { name: string }) => api.put(`/workspaces/${id}`, data),
  join: (inviteCode: string) => api.post('/workspaces/join', { inviteCode }),
};

// ─── Boards ───────────────────────────────────────────────────────────────────

export const boardApi = {
  create: (data: {
    workspaceId: string;
    name: string;
    templateType?: string;
    customSections?: { name: string; color?: string }[];
  }) => api.post('/boards', data),
  getByWorkspace: (workspaceId: string) => api.get(`/boards/workspace/${workspaceId}`),
  getOne: (id: string) => api.get(`/boards/${id}`),
  update: (id: string, data: { name: string }) => api.put(`/boards/${id}`, data),
  delete: (id: string) => api.delete(`/boards/${id}`),
  duplicate: (id: string) => api.post(`/boards/${id}/duplicate`),
};

// ─── Sections ─────────────────────────────────────────────────────────────────

export const sectionApi = {
  create: (data: { boardId: string; name: string; color?: string }) =>
    api.post('/sections', data),
  update: (id: string, data: { name?: string; color?: string }) =>
    api.put(`/sections/${id}`, data),
  delete: (id: string) => api.delete(`/sections/${id}`),
  reorder: (data: { boardId: string; orderedIds: string[] }) =>
    api.put('/sections/reorder', data),
};

// ─── Cards ────────────────────────────────────────────────────────────────────

export const cardApi = {
  create: (data: { sectionId: string; content: string }) =>
    api.post('/cards', data),
  update: (id: string, data: { content: string }) =>
    api.put(`/cards/${id}`, data),
  delete: (id: string) => api.delete(`/cards/${id}`),
  move: (id: string, data: { sectionId: string; position: number }) =>
    api.put(`/cards/${id}/move`, data),
  reorder: (data: { sectionId: string; orderedIds: string[] }) =>
    api.put('/cards/reorder', data),
};

// ─── Votes ────────────────────────────────────────────────────────────────────

export const voteApi = {
  toggle: (cardId: string) => api.post('/votes/toggle', { cardId }),
};

// ─── Comments ─────────────────────────────────────────────────────────────────

export const commentApi = {
  create: (data: { cardId: string; content: string }) =>
    api.post('/comments', data),
  getByCard: (cardId: string) => api.get(`/comments/${cardId}`),
  delete: (id: string) => api.delete(`/comments/${id}`),
};
