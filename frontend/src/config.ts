export const ALLOWED_DOMAIN = (import.meta as any).env.VITE_ALLOWED_DOMAIN || '@unsa.edu.pe';

export const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:3000';


export const CARRERAS = [
  'Ingeniería de Sistemas',
  'Ingeniería Civil',
  'Ingeniería Electrónica',
  'Ingeniería Mecánica',
  'Ingeniería Industrial',
  'Ingeniería Ambiental',
  'Administración',
  'Contabilidad',
  'Derecho',
  'Medicina',
  'Enfermería',
  'Psicología',
  'Educación',
  'Arquitectura',
  'Biología',
] as const;
