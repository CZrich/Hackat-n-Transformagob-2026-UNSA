import type { Job, User } from '../types';

const INITIAL_USERS: User[] = [
  {
    id: 'egresado_juan',
    name: 'Juan Pérez',
    email: 'juan.perez@unsa.edu.pe',
    role: 'EGRESADO',
    carrera: 'Ingeniería de Sistemas',
    skills: ['NestJS', 'TypeScript', 'Kotlin', 'React', 'Node.js'],
    telefono: '958473621',
    cv_name: 'CV_JuanPerez_Sistemas.pdf',
    cv_url: '#'
  },
  {
    id: 'egresado_maria',
    name: 'María Alarcón',
    email: 'maria.alarcon@unsa.edu.pe',
    role: 'EGRESADO',
    carrera: 'Contabilidad',
    skills: ['Auditoría', 'NIIF', 'Tributación', 'Excel Avanzado'],
    telefono: '947582910',
    cv_name: 'CV_MariaAlarcon_Contabilidad.pdf',
    cv_url: '#'
  },
  {
    id: 'egresado_carlos',
    name: 'Carlos Mendoza',
    email: 'carlos.mendoza@unsa.edu.pe',
    role: 'EGRESADO',
    carrera: 'Ingeniería Civil',
    skills: ['AutoCAD', 'Costos y Presupuestos', 'Gestión de Obras', 'MS Project'],
    telefono: '938475829',
    cv_name: 'CV_CarlosMendoza_Civil.pdf',
    cv_url: '#'
  },
  {
    id: 'empleador_tech',
    email: 'reclutamiento@techsolutions.com',
    name: 'Tech Solutions SAC',
    role: 'EMPLEADOR',
    telefono: '987654321',
    ruc: '20123456789',
    contact_name: 'Carlos Mendoza',
    rubro: 'Tecnología',
    es_verificada: true,
    es_baneada: false,
    rating_promedio: 4.8,
    total_votos: 12
  },
  {
    id: 'company_consulting',
    email: 'contacto@auditoresasociados.pe',
    name: 'Consultores & Auditores Asociados',
    role: 'EMPLEADOR',
    telefono: '945678123',
    ruc: '20876543210',
    contact_name: 'María Alarcón',
    rubro: 'Contabilidad y Auditoría',
    es_verificada: true,
    es_baneada: false,
    rating_promedio: 4.2,
    total_votos: 8
  },
  {
    id: 'company_constructora',
    email: 'contacto@constructoraarequipa.pe',
    name: 'Constructora Arequipa S.A.',
    role: 'EMPLEADOR',
    telefono: '932145678',
    ruc: '20555444332',
    contact_name: 'Juan Pérez',
    rubro: 'Construcción Civil',
    es_verificada: true,
    es_baneada: false,
    rating_promedio: 3.9,
    total_votos: 5
  },
  {
    id: 'company_spam_scam',
    email: 'ganafacil@gmail.com',
    name: 'Inversiones Rápido Fácil',
    role: 'EMPLEADOR',
    telefono: '912345678',
    ruc: '20444333221',
    contact_name: 'Estafador Rápido',
    rubro: 'Finanzas e Inversiones',
    es_verificada: false,
    es_baneada: false,
    rating_promedio: 1.5,
    total_votos: 15
  },
  {
    id: 'company_erkof',
    email: 'contacto@erkof.pe',
    name: 'ERKOF SAC',
    role: 'EMPLEADOR',
    telefono: '944077887',
    ruc: '20601234567',
    contact_name: 'Administración ERKOF',
    rubro: 'Construcción e Ingeniería',
    es_verificada: false,
    es_baneada: false,
    rating_promedio: 3.5,
    total_votos: 2
  }
];

const INITIAL_JOBS: Job[] = [
  {
    id: 'job_1',
    title: 'Desarrollador Backend NestJS / TypeScript',
    description: 'Buscamos un desarrollador backend para integrar microservicios y APIs utilizando NestJS. Trabajo 100% remoto.',
    company_id: 'empleador_tech',
    company_name: 'Tech Solutions SAC',
    carrera_destino: 'Ingeniería de Sistemas',
    salario_min: 3500,
    salario_max: 5500,
    requisitos: 'Experiencia previa con NestJS, TypeScript, PostgreSQL y Docker.',
    status: 'APPROVED',
    creado_en: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
    competencias: ['NestJS', 'TypeScript', 'PostgreSQL', 'Docker'],
    vacantes: 2,
    fecha_inicio: '2026-06-11',
    fecha_cierre: '2026-06-25',
    lugar: 'Calle Ambrosio Vucetich 130, Parque Industrial de Arequipa, Perú',
    funciones: '1. Integrar microservicios y APIs REST\n2. Optimizar consultas de base de datos\n3. Desplegar servicios en Docker',
    informacion_adicional: 'Certificación a nombre de la empresa y apoyo de movilidad.',
    horario: 'Lunes a Viernes de 8:00 AM a 5:00 PM',
    postulantes: ['egresado_juan'],
    rating_empresa: 4.8
  },
  {
    id: 'job_2',
    title: 'Analista de Sistemas / Cloud Engineer',
    description: 'Diseño de arquitectura en la nube e implementación de CI/CD para la plataforma de la Bolsa de Trabajo.',
    company_id: 'empleador_tech',
    company_name: 'Tech Solutions SAC',
    carrera_destino: 'Ingeniería de Sistemas',
    salario_min: 4000,
    salario_max: 6000,
    requisitos: 'Conocimiento en AWS, Docker, Kubernetes y scripting en Python/Shell.',
    status: 'APPROVED',
    creado_en: new Date(Date.now() - 3600000 * 48).toISOString(), // 2 days ago
    competencias: ['AWS', 'Docker', 'Kubernetes', 'TypeScript', 'React'],
    vacantes: 1,
    fecha_inicio: '2026-06-10',
    fecha_cierre: '2026-06-24',
    lugar: 'Av. Metropolitana 234, Yanahuara, Arequipa',
    funciones: '1. Mantener infraestructura en AWS\n2. Automatizar pipelines de CI/CD\n3. Monitorear salud de clústeres de Kubernetes',
    horario: 'Lunes a Viernes, horario flexible',
    postulantes: [],
    rating_empresa: 4.8
  },
  {
    id: 'job_3',
    title: 'Asistente de Auditoría Financiera',
    description: 'Apoyo en la auditoría externa de estados financieros para importantes clientes del sector financiero.',
    company_id: 'company_consulting',
    company_name: 'Consultores & Auditores Asociados',
    carrera_destino: 'Contabilidad',
    salario_min: 2200,
    salario_max: 3200,
    requisitos: 'Conocimientos sólidos en NIIF (Normas Internacionales de Información Financiera), Excel avanzado.',
    status: 'APPROVED',
    creado_en: new Date(Date.now() - 3600000 * 12).toISOString(), // 12 hours ago
    competencias: ['Auditoría', 'NIIF', 'Excel Avanzado', 'Tributación'],
    vacantes: 3,
    fecha_inicio: '2026-06-12',
    fecha_cierre: '2026-06-20',
    lugar: 'Calle San Francisco 120, Cercado de Arequipa',
    funciones: '1. Revisar balances contables\n2. Analizar estados de ganancias y pérdidas\n3. Elaborar informes de auditoría interna',
    postulantes: ['egresado_maria'],
    rating_empresa: 4.2
  },
  {
    id: 'job_4',
    title: 'Residente de Obra Edificación UNSA',
    description: 'Supervisión y control de avances en obra civil para pabellones del área de ingenierías.',
    company_id: 'company_constructora',
    company_name: 'Constructora Arequipa S.A.',
    carrera_destino: 'Ingeniería Civil',
    salario_min: 3000,
    salario_max: 4500,
    requisitos: 'Dominio de AutoCAD, MS Project, costos y presupuestos y gestión de obras públicas.',
    status: 'APPROVED',
    creado_en: new Date(Date.now() - 3600000 * 72).toISOString(), // 3 days ago
    competencias: ['AutoCAD', 'Costos y Presupuestos', 'Gestión de Obras', 'MS Project'],
    vacantes: 2,
    fecha_inicio: '2026-06-08',
    fecha_cierre: '2026-06-22',
    lugar: 'Área de Ingenierías UNSA, Av. Independencia, Arequipa',
    funciones: '1. Supervisar el vaciado de concreto y acabados\n2. Controlar la bitácora de obra\n3. Coordinar con contratistas y proveedores',
    postulantes: [],
    rating_empresa: 3.9
  },
  {
    id: 'job_5',
    title: 'Desarrollador Android Kotlin Junior',
    description: 'Implementación de nuevas pantallas y flujo de usuarios en la app móvil institucional.',
    company_id: 'empleador_tech',
    company_name: 'Tech Solutions SAC',
    carrera_destino: 'Ingeniería de Sistemas',
    salario_min: 2500,
    salario_max: 3500,
    requisitos: 'Desarrollo nativo Android en Kotlin. Patrón MVVM, Jetpack Compose.',
    status: 'APPROVED', // tech solutions is verified, so its jobs are automatically approved
    creado_en: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
    competencias: ['Kotlin', 'Android', 'MVVM', 'Jetpack Compose'],
    vacantes: 1,
    fecha_inicio: '2026-06-13',
    fecha_cierre: '2026-06-30',
    lugar: 'Calle Ambrosio Vucetich 130, Parque Industrial de Arequipa, Perú',
    funciones: '1. Diseñar vistas reactivas en Compose\n2. Conectar APIs mediante Retrofit\n3. Realizar pruebas unitarias básicas',
    postulantes: [],
    rating_empresa: 4.8
  },
  {
    id: 'job_6',
    title: 'Analista de Costos e Impuestos',
    description: 'Elaboración de declaraciones juradas mensuales y anuales, revisión de costos y balances generales.',
    company_id: 'company_consulting',
    company_name: 'Consultores & Auditores Asociados',
    carrera_destino: 'Contabilidad',
    salario_min: 2800,
    salario_max: 3800,
    requisitos: 'Bachiller en Contabilidad con experiencia en tributación fiscal, PDT e IGV/Renta.',
    status: 'APPROVED',
    creado_en: new Date(Date.now() - 3600000 * 4).toISOString(), // 4 hours ago
    competencias: ['Tributación', 'Excel Avanzado', 'PDT', 'Declaraciones'],
    vacantes: 1,
    fecha_inicio: '2026-06-12',
    fecha_cierre: '2026-06-29',
    lugar: 'Calle San Francisco 120, Cercado de Arequipa',
    funciones: '1. Liquidar impuestos mensuales (IGV, Renta)\n2. Revisar comprobantes de pago\n3. Apoyar en auditorías fiscales',
    postulantes: [],
    rating_empresa: 4.2
  },
  {
    id: 'job_7',
    title: 'PRACTICANTE PREPROFESIONAL ING. INDUSTRIAL',
    description: 'ERKOF SAC requiere practicante para apoyo administrativo y logístico en el rubro de construcción.',
    company_id: 'company_erkof',
    company_name: 'ERKOF SAC',
    carrera_destino: 'Ingeniería Industrial',
    salario_min: 1200,
    salario_max: 1800,
    requisitos: 'Estudiante o egresado de Ingeniería Industrial o Administración. Manejo de Microsoft Office y ganas de aprender.',
    status: 'PENDING', // Erkof is not verified yet, so it is pending!
    creado_en: new Date(Date.now() - 3600000 * 1).toISOString(),
    competencias: ['Microsoft Office', 'Logística', 'Gestión de Proyectos'],
    vacantes: 2,
    fecha_inicio: '2026-06-11',
    fecha_cierre: '2026-06-13',
    lugar: 'Calle Ambrosio Vucetich 130, Parque Industrial de Arequipa, Perú',
    funciones: '1. Control de documentación administrativa\n2. Apoyo en gestión de personal y logística\n3. Soporte en cotizaciones y compras de proyectos',
    informacion_adicional: 'Experiencia en proyectos del sector construcción e ingeniería. Certificado de prácticas.',
    horario: 'Edificio Vucetich, horario a convenir',
    postulantes: [],
    rating_empresa: 3.5
  },
  {
    id: 'job_8',
    title: '¡GANA DINERO FÁCIL DESDE TU CELULAR!',
    description: 'Trabaja 1 hora al día desde tu celular haciendo clicks y ganando comisiones diarias.',
    company_id: 'company_spam_scam',
    company_name: 'Inversiones Rápido Fácil',
    carrera_destino: 'Administración',
    salario_min: 9000,
    salario_max: 15000,
    requisitos: 'Tener celular con internet, inversión mínima de ingreso S/ 100.',
    status: 'PENDING', // Spam scam is not verified
    creado_en: new Date(Date.now() - 3600000 * 0.5).toISOString(),
    competencias: ['Celular', 'Inversión', 'Dinero Fácil'],
    vacantes: 99,
    fecha_inicio: '2026-06-13',
    fecha_cierre: '2026-06-14',
    lugar: 'Remoto virtual',
    funciones: '1. Dar likes y compartir publicaciones engañosas',
    postulantes: [],
    rating_empresa: 1.5
  }
];

export function initializeMockDb() {
  if (!localStorage.getItem('mock_jobs')) {
    localStorage.setItem('mock_jobs', JSON.stringify(INITIAL_JOBS));
  }
  if (!localStorage.getItem('mock_registered_users')) {
    localStorage.setItem('mock_registered_users', JSON.stringify(INITIAL_USERS));
  } else {
    try {
      const existing = JSON.parse(localStorage.getItem('mock_registered_users') || '[]');
      const updated = [...existing];
      INITIAL_USERS.forEach(u => {
        if (!existing.some((ex: any) => ex.id === u.id || ex.email.toLowerCase() === u.email.toLowerCase())) {
          updated.push(u);
        }
      });
      localStorage.setItem('mock_registered_users', JSON.stringify(updated));
    } catch {}
  }
}

export function getJobsFromLocal(): Job[] {
  initializeMockDb();
  const raw = localStorage.getItem('mock_jobs');
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return INITIAL_JOBS;
  }
}

export function saveJobsToLocal(jobs: Job[]) {
  localStorage.setItem('mock_jobs', JSON.stringify(jobs));
}

export function getMatchedJobsLocal(carrera: string, _userSkills: string[] = []): Job[] {
  const jobs = getJobsFromLocal();
  
  // Also cross-reference if the company of this job is banned or not verified
  const usersRaw = localStorage.getItem('mock_registered_users') || '[]';
  let verifiedCompanies: string[] = [];
  try {
    const users = JSON.parse(usersRaw) as User[];
    verifiedCompanies = users
      .filter(u => u.role === 'EMPLEADOR' && u.es_verificada && !u.es_baneada)
      .map(u => u.id);
  } catch {}

  // Filter by carrera, APPROVED, and active verified company
  return jobs.filter(
    (job) => 
      job.status === 'APPROVED' && 
      job.carrera_destino.toLowerCase() === carrera.toLowerCase() &&
      (verifiedCompanies.includes(job.company_id) || job.company_id === 'empleador_tech' || job.company_id === 'company_consulting' || job.company_id === 'company_constructora')
  );
}

export function getPendingJobsLocal(): Job[] {
  const jobs = getJobsFromLocal();
  return jobs.filter((job) => job.status === 'PENDING');
}

export function getMyJobsLocal(companyId: string): Job[] {
  const jobs = getJobsFromLocal();
  return jobs.filter((job) => job.company_id === companyId);
}

export function createJobLocal(data: Partial<Job>, currentUser: User): Job {
  const jobs = getJobsFromLocal();
  
  // Find current user's verification status
  const usersRaw = localStorage.getItem('mock_registered_users') || '[]';
  let isVerified = false;
  let rating = 5.0;
  try {
    const users = JSON.parse(usersRaw) as User[];
    const dbUser = users.find(u => u.id === currentUser.id);
    if (dbUser) {
      isVerified = dbUser.es_verificada || false;
      rating = dbUser.rating_promedio || 5.0;
    }
  } catch {}

  const newJob: Job = {
    id: `job_${Date.now()}`,
    title: data.title || 'Puesto vacante',
    description: data.description || '',
    company_id: currentUser.id || 'company_tech_solutions',
    company_name: currentUser.name || 'Tech Solutions SAC',
    carrera_destino: data.carrera_destino || 'Ingeniería de Sistemas',
    salario_min: Number(data.salario_min) || 0,
    salario_max: Number(data.salario_max) || 0,
    requisitos: data.requisitos || '',
    status: isVerified ? 'APPROVED' : 'PENDING', // Auto-approved if verified!
    creado_en: new Date().toISOString(),
    competencias: data.competencias || [],
    vacantes: Number(data.vacantes) || 1,
    fecha_inicio: data.fecha_inicio || '',
    fecha_cierre: data.fecha_cierre || '',
    lugar: data.lugar || '',
    funciones: data.funciones || '',
    informacion_adicional: data.informacion_adicional || '',
    horario: data.horario || '',
    postulantes: [],
    rating_empresa: rating
  };
  
  const updatedJobs = [newJob, ...jobs];
  saveJobsToLocal(updatedJobs);
  return newJob;
}

export function updateJobStatusLocal(id: string, status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SPAM'): Job {
  const jobs = getJobsFromLocal();
  let updatedJob: Job | null = null;
  
  const updatedJobs = jobs.map((job) => {
    if (job.id === id) {
      updatedJob = { ...job, status };
      return updatedJob;
    }
    return job;
  });
  
  if (!updatedJob) {
    throw new Error('Oferta laboral no encontrada');
  }
  
  saveJobsToLocal(updatedJobs);
  return updatedJob;
}

// ----------------------------------------------------
// NEW HELPER FUNCTIONS FOR COMPANiES AND APPLICANTS
// ----------------------------------------------------

export function getCompaniesLocal(): User[] {
  initializeMockDb();
  const raw = localStorage.getItem('mock_registered_users') || '[]';
  try {
    const list = JSON.parse(raw) as User[];
    return list.filter(u => u.role === 'EMPLEADOR');
  } catch {
    return INITIAL_USERS.filter(u => u.role === 'EMPLEADOR');
  }
}

export function getEgresadosLocal(): User[] {
  initializeMockDb();
  const raw = localStorage.getItem('mock_registered_users') || '[]';
  try {
    const list = JSON.parse(raw) as User[];
    return list.filter(u => u.role === 'EGRESADO');
  } catch {
    return INITIAL_USERS.filter(u => u.role === 'EGRESADO');
  }
}

export function updateCompanyVerificationLocal(companyId: string, isVerified: boolean): User {
  const raw = localStorage.getItem('mock_registered_users') || '[]';
  let updatedUser: User | null = null;
  try {
    const list = JSON.parse(raw) as User[];
    const updatedList = list.map(u => {
      if (u.id === companyId) {
        updatedUser = { ...u, es_verificada: isVerified };
        return updatedUser;
      }
      return u;
    });
    localStorage.setItem('mock_registered_users', JSON.stringify(updatedList));
  } catch {}

  if (!updatedUser) {
    throw new Error('Empresa no encontrada');
  }

  // If company is verified, automatically approve all its pending jobs!
  if (isVerified) {
    const jobs = getJobsFromLocal();
    const updatedJobs = jobs.map(j => {
      if (j.company_id === companyId && j.status === 'PENDING') {
        return { ...j, status: 'APPROVED' as const };
      }
      return j;
    });
    saveJobsToLocal(updatedJobs);
  }

  return updatedUser;
}

export function updateCompanyBanLocal(companyId: string, isBanned: boolean): User {
  const raw = localStorage.getItem('mock_registered_users') || '[]';
  let updatedUser: User | null = null;
  try {
    const list = JSON.parse(raw) as User[];
    const updatedList = list.map(u => {
      if (u.id === companyId) {
        updatedUser = { ...u, es_baneada: isBanned };
        return updatedUser;
      }
      return u;
    });
    localStorage.setItem('mock_registered_users', JSON.stringify(updatedList));
  } catch {}

  if (!updatedUser) {
    throw new Error('Empresa no encontrada');
  }

  // If banned, set its approved jobs back to pending/spam/rejected or suspended
  if (isBanned) {
    const jobs = getJobsFromLocal();
    const updatedJobs = jobs.map(j => {
      if (j.company_id === companyId && j.status === 'APPROVED') {
        return { ...j, status: 'REJECTED' as const }; // Suspend jobs
      }
      return j;
    });
    saveJobsToLocal(updatedJobs);
  } else {
    // If unbanned and verified, re-approve its jobs
    const jobs = getJobsFromLocal();
    const isVerified = (updatedUser as User).es_verificada || false;
    if (isVerified) {
      const updatedJobs = jobs.map(j => {
        if (j.company_id === companyId && j.status === 'REJECTED') {
          return { ...j, status: 'APPROVED' as const };
        }
        return j;
      });
      saveJobsToLocal(updatedJobs);
    }
  }

  return updatedUser;
}

export function applyToJobLocal(jobId: string, egresadoId: string): Job {
  const jobs = getJobsFromLocal();
  let updatedJob: Job | null = null;
  
  const updatedJobs = jobs.map(j => {
    if (j.id === jobId) {
      const list = j.postulantes || [];
      if (!list.includes(egresadoId)) {
        updatedJob = { ...j, postulantes: [...list, egresadoId] };
        return updatedJob;
      }
      updatedJob = j;
      return j;
    }
    return j;
  });

  if (!updatedJob) {
    throw new Error('Convocatoria no encontrada');
  }

  saveJobsToLocal(updatedJobs);
  return updatedJob;
}

export function updateEgresadoProfileLocal(egresadoId: string, data: Partial<User>): User {
  const raw = localStorage.getItem('mock_registered_users') || '[]';
  let updatedUser: User | null = null;
  try {
    const list = JSON.parse(raw) as User[];
    const updatedList = list.map(u => {
      if (u.id === egresadoId) {
        updatedUser = { ...u, ...data };
        return updatedUser;
      }
      return u;
    });
    localStorage.setItem('mock_registered_users', JSON.stringify(updatedList));
    localStorage.setItem('user', JSON.stringify(updatedUser)); // sync current session user
  } catch {}

  if (!updatedUser) {
    throw new Error('Egresado no encontrado');
  }

  return updatedUser;
}

export function rateCompanyLocal(companyId: string, rating: number) {
  const raw = localStorage.getItem('mock_registered_users') || '[]';
  try {
    const list = JSON.parse(raw) as User[];
    const updatedList = list.map(u => {
      if (u.id === companyId && u.role === 'EMPLEADOR') {
        const total = (u.total_votos || 0) + 1;
        const currentAvg = u.rating_promedio || 5.0;
        const nextAvg = parseFloat(((currentAvg * (total - 1) + rating) / total).toFixed(1));
        return { ...u, rating_promedio: nextAvg, total_votos: total };
      }
      return u;
    });
    localStorage.setItem('mock_registered_users', JSON.stringify(updatedList));
    
    // Also update all jobs associated with this company to reflect the new rating
    const jobs = getJobsFromLocal();
    const updatedCompany = updatedList.find(u => u.id === companyId);
    if (updatedCompany) {
      const updatedJobs = jobs.map(j => {
        if (j.company_id === companyId) {
          return { ...j, rating_empresa: updatedCompany.rating_promedio };
        }
        return j;
      });
      saveJobsToLocal(updatedJobs);
    }
  } catch {}
}
