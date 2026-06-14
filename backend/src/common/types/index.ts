export type UserRole = 'EGRESADO' | 'EMPLEADOR' | 'ADMIN';

export type JobStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SPAM' | 'CLOSED';

export type ApplicationStatus = 'PENDING' | 'REVIEWED' | 'ACCEPTED' | 'REJECTED' | 'CV_REVIEWED' | 'IN_PROCESS' | 'FINALIST' | 'PROCESS_FINISHED';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  created_at?: string;
  carrera?: string;
  telefono?: string;
  ruc?: string;
  rubro?: string;
  direccion?: string;
  horario?: string;
  contacto_telefono?: string;
  contacto_email?: string;
  es_verificada?: boolean;
  es_baneada?: boolean;
  rating_promedio?: number;
  total_votos?: number;
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
