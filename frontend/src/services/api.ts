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
  },
};
