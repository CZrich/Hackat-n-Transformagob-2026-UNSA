export type UserRole = 'EGRESADO' | 'EMPLEADOR' | 'ADMIN';

export type JobStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SPAM';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  carrera?: string;
  telefono?: string;
  created_at?: string;
  ruc?: string;
  rubro?: string;
  es_verificada?: boolean;
  es_baneada?: boolean;
  contact_name?: string;
}

export interface Job {
  id: string;
  title: string;
  description?: string;
  company_id: string;
  company_name?: string;
  carrera_destino: string;
  salario_min: number;
  salario_max: number;
  requisitos: string;
  status: JobStatus;
  creado_en: string;
}

export interface Company {
  id: string;
  ruc: string;
  name: string;
  rubro: string;
  es_baneada: boolean;
}
