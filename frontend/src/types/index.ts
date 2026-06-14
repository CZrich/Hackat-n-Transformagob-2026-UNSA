export type UserRole = 'EGRESADO' | 'EMPLEADOR' | 'ADMIN';

export type JobStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SPAM';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  carrera?: string;
  telefono?: string;
  skills?: string[];
  ruc?: string;
  contact_name?: string;
  rubro?: string;
  es_verificada?: boolean;
  es_baneada?: boolean;
  rating_promedio?: number;
  total_votos?: number;
  cv_url?: string;
  cv_name?: string;
  bio?: string;
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
  competencias?: string[];
  vacantes?: number;
  fecha_inicio?: string;
  fecha_cierre?: string;
  lugar?: string;
  funciones?: string;
  informacion_adicional?: string;
  horario?: string;
  postulantes?: string[]; // deprecated
  applications?: { userId: string; status: string; user?: User }[];
  rating_empresa?: number;
}

export interface Company {
  id: string;
  ruc: string;
  name: string;
  rubro: string;
  es_baneada: boolean;
}

