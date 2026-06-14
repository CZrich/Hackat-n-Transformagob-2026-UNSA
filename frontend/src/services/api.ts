import { API_URL } from '../config';
import type { User, Job } from '../types';

type RequestOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
};

function getToken(): string | null {
  return localStorage.getItem('token');
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Error de conexión' }));
    throw new Error(error.message || `Error ${response.status}`);
  }

  return response.json();
}

export const api = {
  auth: {
    googleLogin: (token: string) =>
      request<{ user: User; token: string }>('/api/auth/google-login', {
        method: 'POST',
        body: { token },
      }),

    login: (email: string, password: string) =>
      request<{ user: User; token: string }>('/api/auth/login', {
        method: 'POST',
        body: { email, password },
      }),

    register: (data: {
      email: string;
      password: string;
      name: string;
      role: string;
      carrera?: string;
      telefono?: string;
      ruc?: string;
      contact_name?: string;
      rubro?: string;
    }) =>
      request<{ user: User; token: string }>('/api/auth/register', {
        method: 'POST',
        body: data,
      }),

    updateProfile: (data: Partial<User>) =>
      request<User>('/api/users/profile', {
        method: 'PUT',
        body: data,
      }),

    uploadCv: async (file: File) => {
      const token = getToken();
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${API_URL}/api/users/profile/cv`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData,
      });
      if (!response.ok) throw new Error('Error al subir el CV');
      return response.json();
    },
  },

  jobs: {
    create: (data: Record<string, unknown>) =>
      request<Job>('/api/jobs', { method: 'POST', body: data }),

    getMatched: () => request<Job[]>('/api/jobs/match'),

    getPending: () => request<Job[]>('/api/jobs/pending'),

    getMyHistory: () => request<Job[]>('/api/jobs/my'),

    updateStatus: (id: string, status: string) =>
      request<Job>(`/api/jobs/${id}/status`, {
        method: 'PATCH',
        body: { status },
      }),

    apply: (id: string) =>
      request<any>(`/api/jobs/${id}/apply`, {
        method: 'POST',
      }),
  },

  admin: {
    listCompanies: () => request<User[]>('/api/admin/companies'),
    verifyCompany: (id: string) =>
      request<any>(`/api/admin/companies/${id}/verify`, { method: 'PATCH' }),
    banCompany: (id: string, es_baneada: boolean) =>
      request<any>(`/api/admin/companies/${id}/ban`, {
        method: 'PATCH',
        body: { es_baneada },
      }),
  },
};
