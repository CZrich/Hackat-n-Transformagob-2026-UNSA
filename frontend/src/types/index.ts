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
  contact_name?: string;
  rubro?: string;
  es_verificada?: boolean;
  es_baneada?: boolean;
  rating_promedio?: number;
  total_votos?: number;
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
  postulantes?: string[];
  applications?: JobApplication[];
  rating_empresa?: number;
  matchScore?: number;
}

export interface Company {
  id: string;
  ruc: string;
  name: string;
  rubro: string;
  es_baneada: boolean;
  rating_promedio?: number;
  total_votos?: number;
}

export interface Application {
  id: string;
  jobId: string;
  userId: string;
  status: ApplicationStatus;
  created_at: string;
  job: Job & { company: Company };
  user?: User & { profile?: GraduateProfile };
}

export interface JobApplication {
  userId: string;
  status: ApplicationStatus;
  id: string;
  created_at: string;
  user?: User & { profile?: GraduateProfile };
}

export interface MatchDetail {
  matchPercentage: number;
  matchedSkills: string[];
  missingSkills: string[];
  extraSkills: string[];
  totalJobSkills: number;
  totalUserSkills: number;
}

export interface GraduateProfile {
  id: string;
  userId: string;
  carrera?: string;
  telefono?: string;
  skills?: string[];
  cv_name?: string;
  cv_url?: string;
  bio?: string;
  summary?: string;
  education?: string;
  experience?: string;
  certifications?: string;
  languages?: string;
  linkedin_url?: string;
  portfolio_url?: string;
}

