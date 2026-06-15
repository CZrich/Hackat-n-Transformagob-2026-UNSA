import { API_URL } from '../config';
import type { User, Job, Application, MatchDetail, GraduateProfile } from '../types';

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

function mapBackendUser(u: any): User {
  if (!u) return u;
  const p = u.profile;
  const c = u.company;
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    created_at: u.created_at,
    carrera: p?.carrera ?? u.carrera,
    telefono: p?.telefono ?? u.telefono,
    company: c,
    profile: p,
    ...(c && {
      ruc: c.ruc ?? u.ruc,
      rubro: c.rubro ?? u.rubro,
      direccion: c.direccion ?? u.direccion,
      horario: c.horario ?? u.horario,
      contacto_telefono: c.contacto_telefono ?? u.contacto_telefono ?? c.telefono ?? u.telefono,
      contacto_email: c.contacto_email ?? u.contacto_email ?? u.email,
      es_verificada: c.es_verificada ?? u.es_verificada,
      es_baneada: c.es_baneada ?? u.es_baneada,
      rating_promedio: c.rating_promedio ?? u.rating_promedio,
      total_votos: c.total_votos ?? u.total_votos,
      contact_name: c.contact_name ?? u.contact_name ?? u.name,
    }),
  } as User;
}

export const api = {
  auth: {
    googleLogin: (token: string) =>
      request<{ user: any; token: string }>('/api/auth/google-login', {
        method: 'POST',
        body: { token },
      }).then(res => ({ ...res, user: mapBackendUser(res.user) })),

    login: (email: string, password: string) =>
      request<{ user: any; token: string }>('/api/auth/login', {
        method: 'POST',
        body: { email, password },
      }).then(res => ({ ...res, user: mapBackendUser(res.user) })),

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
      request<{ user: any; token: string }>('/api/auth/register', {
        method: 'POST',
        body: data,
      }).then(res => ({ ...res, user: mapBackendUser(res.user) })),

    getProfile: () =>
      request<any>('/api/users/profile').then(mapBackendUser),

    updateProfile: (data: Partial<User>) =>
      request<any>('/api/users/profile', {
        method: 'PUT',
        body: data,
      }).then(mapBackendUser),

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

    getMyApplications: () => request<Application[]>('/api/jobs/my-applications'),

    getPending: () => request<Job[]>('/api/jobs/pending'),

    getMyHistory: () => request<Job[]>('/api/jobs/my'),

    updateStatus: (id: string, status: string) =>
      request<Job>(`/api/jobs/${id}/status`, {
        method: 'PATCH',
        body: { status },
      }),

    updateEmployerJobStatus: (id: string, status: string) =>
      request<Job>(`/api/jobs/${id}/employer-status`, {
        method: 'PATCH',
        body: { status },
      }),

    deleteJob: (id: string) =>
      request<any>(`/api/jobs/${id}`, { method: 'DELETE' }),

    apply: (id: string) =>
      request<any>(`/api/jobs/${id}/apply`, {
        method: 'POST',
      }),

    updateApplicationStatus: (applicationId: string, status: string) =>
      request<any>(`/api/jobs/applications/${applicationId}/status`, {
        method: 'PATCH',
        body: { status },
      }),

    getMatchDetail: (id: string) =>
      request<MatchDetail>(`/api/jobs/${id}/match-detail`),
  },

  ratings: {
    rateCompany: (companyId: string, score: number, comment?: string) =>
      request<any>('/api/ratings', {
        method: 'POST',
        body: { companyId, score, comment },
      }),

    getCompanyRating: (companyId: string) =>
      request<any>(`/api/ratings/company/${companyId}`),

    getMyRatings: () => request<any[]>('/api/ratings/my'),
  },

  graduateProfile: {
    update: (data: Partial<GraduateProfile>) =>
      request<GraduateProfile>('/api/users/graduate-profile', {
        method: 'PUT',
        body: data,
      }),

    get: () => request<GraduateProfile>('/api/users/graduate-profile'),
  },

  admin: {
    listCompanies: () => request<User[]>('/api/admin/companies'),
    verifyCompany: (id: string, es_verificada: boolean) =>
      request<any>(`/api/admin/companies/${id}/verify`, {
        method: 'PATCH',
        body: { es_verificada },
      }),
    banCompany: (id: string, es_baneada: boolean) =>
      request<any>(`/api/admin/companies/${id}/ban`, {
        method: 'PATCH',
        body: { es_baneada },
      }),
  },

  events: {
    list: () => request<any[]>('/api/events'),
    create: (data: any) =>
      request<any>('/api/events', {
        method: 'POST',
        body: data,
      }),
    delete: (id: string) =>
      request<any>(`/api/events/${id}`, { method: 'DELETE' }),
  },
};
