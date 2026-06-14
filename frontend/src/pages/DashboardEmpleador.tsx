import { useState } from 'react';
import {
  Plus,
  AlertCircle,
  DollarSign,
  Briefcase,
  Sparkles,
  Tag,
  Lock,
  Building2,
  Phone,
  User as UserIcon,
  Calendar,
  MapPin,
  Clock,
  FileText,
  Users,
  Check,
  ChevronDown,
  ChevronUp,
  Download,
  Trash2,
  XCircle,
  RefreshCw,
  Save,
  Settings
} from 'lucide-react';
import { jobFormSchema } from '../schemas';
import { CARRERAS } from '../config';
import { useJobs } from '../hooks/useJobs';
import { api } from '../services/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import type { User, Job, ApplicationStatus } from '../types';

interface DashboardEmpleadorProps {
  user: User;
}

const PRESET_SKILLS = [
  'TypeScript', 'React', 'Node.js', 'NestJS', 'Kotlin', 'Android',
  'PostgreSQL', 'Docker', 'AWS', 'Kubernetes', 'Microsoft Office',
  'Excel Avanzado', 'AutoCAD', 'Costos y Presupuestos', 'NIIF', 'Logística',
  'Tributación', 'Gestión de Obras'
];

function statusBadge(status: Job['status']) {
  const styles: Record<string, string> = {
    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
    APPROVED: 'bg-green-50 text-green-700 border-green-200',
    REJECTED: 'bg-red-50 text-red-700 border-red-200',
    SPAM: 'bg-slate-100 text-slate-700 border-slate-200',
  };
  const labels: Record<string, string> = {
    PENDING: 'Pendiente Verificación Empresa',
    APPROVED: 'Publicado',
    REJECTED: 'Suspendido',
    SPAM: 'Spam Detectado',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${styles[status] || styles.PENDING}`}>
      {labels[status] || status}
    </span>
  );
}

export default function DashboardEmpleador({ user }: DashboardEmpleadorProps) {
  const { historyQuery, createJob, updateEmployerJobStatus, deleteJob, updateApplicationStatus } = useJobs();
  const { data: jobs = [], isLoading: loading, error } = historyQuery;
  const [showForm, setShowForm] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const [expandedJobApplicants, setExpandedJobApplicants] = useState<Record<string, boolean>>({});

  // Check if profile is incomplete (e.g. registered via Google and has no corporate fields yet)
  const isProfileIncomplete = !user.ruc || !user.rubro || !user.telefono;

  // Complete profile state
  const [completeForm, setCompleteForm] = useState({
    company_name: user.name === 'Empresa por Completar' ? '' : user.name,
    ruc: user.ruc || '',
    contact_name: user.contact_name || '',
    rubro: user.rubro || '',
    telefono: user.telefono || ''
  });
  const [completeErrors, setCompleteErrors] = useState<Record<string, string>>({});
  const [savingProfile, setSavingProfile] = useState(false);

  // Initial job form values
  const [formData, setFormData] = useState({
    ruc: user.ruc || '',
    title: '',
    description: '',
    carrera_destino: '' as typeof CARRERAS[number] | '',
    salario_min: 1200,
    salario_max: 2500,
    requisitos: '',
    competencias: [] as string[],
    competenciasInput: '',
    vacantes: 1,
    fecha_inicio: new Date().toISOString().split('T')[0],
    fecha_cierre: new Date(Date.now() + 3600000 * 24 * 7).toISOString().split('T')[0], // 7 days later
    lugar: '',
    funciones: '',
    informacion_adicional: '',
    horario: 'Lunes a Viernes de 8:00 AM a 5:00 PM'
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [cvFeedback, setCvFeedback] = useState<string | null>(null);



  const handleCompleteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCompleteErrors({});
    const errors: Record<string, string> = {};

    if (!completeForm.company_name.trim()) errors.company_name = 'Razón Social requerida';
    if (!/^\d{11}$/.test(completeForm.ruc.trim())) errors.ruc = 'RUC debe tener 11 dígitos';
    if (!completeForm.contact_name.trim()) errors.contact_name = 'Nombre de contacto requerido';
    if (!completeForm.rubro.trim()) errors.rubro = 'Rubro comercial requerido';
    if (!/^\d{9}$/.test(completeForm.telefono.trim())) errors.telefono = 'Teléfono debe tener 9 dígitos';

    if (Object.keys(errors).length > 0) {
      setCompleteErrors(errors);
      return;
    }

    setSavingProfile(true);
    setTimeout(() => {
      const updatedUser: User = {
        ...user,
        name: completeForm.company_name.trim(),
        ruc: completeForm.ruc.trim(),
        contact_name: completeForm.contact_name.trim(),
        rubro: completeForm.rubro.trim(),
        telefono: completeForm.telefono.trim(),
        es_verificada: false, // Default to false till Admin verifies it
        es_baneada: false
      };

      // Update in mock registered list
      const localRaw = localStorage.getItem('mock_registered_users') || '[]';
      try {
        const localUsers = JSON.parse(localRaw);
        const updatedList = localUsers.map((u: any) => u.email.toLowerCase() === user.email.toLowerCase() ? updatedUser : u);
        localStorage.setItem('mock_registered_users', JSON.stringify(updatedList));
      } catch {}

      localStorage.setItem('user', JSON.stringify(updatedUser));
      setSavingProfile(false);
      window.location.reload();
    }, 1000);
  };

  const handleCompleteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCompleteForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAddCompetencia = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const tag = formData.competenciasInput.trim();
      if (tag && !formData.competencias.includes(tag)) {
        setFormData(prev => ({
          ...prev,
          competencias: [...prev.competencias, tag],
          competenciasInput: ''
        }));
        if (formErrors.competencias) {
          setFormErrors(prev => {
            const next = { ...prev };
            delete next.competencias;
            return next;
          });
        }
      }
    }
  };

  const handleAddPresetSkill = (skill: string) => {
    if (!formData.competencias.includes(skill)) {
      setFormData(prev => ({
        ...prev,
        competencias: [...prev.competencias, skill]
      }));
      if (formErrors.competencias) {
        setFormErrors(prev => {
          const next = { ...prev };
          delete next.competencias;
          return next;
        });
      }
    }
  };

  const handleRemoveCompetencia = (indexToRemove: number) => {
    setFormData(prev => ({
      ...prev,
      competencias: prev.competencias.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  // Check if salary is empty or zero
  const isSalaryEmpty = !formData.salario_min || !formData.salario_max || formData.salario_min <= 0 || formData.salario_max <= 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    // Validate using Zod schema
    const result = jobFormSchema.safeParse({
      ruc: formData.ruc,
      title: formData.title,
      description: formData.description,
      carrera_destino: formData.carrera_destino,
      salario_min: Number(formData.salario_min),
      salario_max: Number(formData.salario_max),
      requisitos: formData.requisitos,
      competencias: formData.competencias,
      vacantes: Number(formData.vacantes),
      fecha_inicio: formData.fecha_inicio,
      fecha_cierre: formData.fecha_cierre,
      lugar: formData.lugar,
      funciones: formData.funciones,
      informacion_adicional: formData.informacion_adicional,
      horario: formData.horario
    });

    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const path = err.path[0] as string;
        if (!errors[path]) errors[path] = err.message;
      });
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      await createJob({
        ...result.data,
        salario_min: Number(result.data.salario_min),
        salario_max: Number(result.data.salario_max),
        vacantes: Number(result.data.vacantes)
      });
      setShowForm(false);
      // Reset form
      setFormData({
        ruc: user.ruc || '',
        title: '',
        description: '',
        carrera_destino: '' as typeof CARRERAS[number] | '',
        salario_min: 1200,
        salario_max: 2500,
        requisitos: '',
        competencias: [],
        competenciasInput: '',
        vacantes: 1,
        fecha_inicio: new Date().toISOString().split('T')[0],
        fecha_cierre: new Date(Date.now() + 3600000 * 24 * 7).toISOString().split('T')[0],
        lugar: '',
        funciones: '',
        informacion_adicional: '',
        horario: 'Lunes a Viernes de 8:00 AM a 5:00 PM'
      });
    } catch {
      // error handled by hook
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'salario_min' || name === 'salario_max' || name === 'vacantes' ? (value === '' ? 0 : Number(value)) : value,
    }));
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const toggleApplicants = (jobId: string) => {
    setExpandedJobApplicants(prev => ({
      ...prev,
      [jobId]: !prev[jobId]
    }));
  };

  const handleDownloadCV = (cvUrl: string) => {
    if (cvUrl) window.open(cvUrl, '_blank', 'noopener,noreferrer');
  };

  const getMatchPercentage = (gradSkills: string[] = [], jobComps: string[] = []) => {
    if (!jobComps || jobComps.length === 0) return 100;
    const matches = gradSkills.filter(s => jobComps.some(jc => jc.toLowerCase() === s.toLowerCase())).length;
    return Math.round((matches / jobComps.length) * 100);
  };

  const [profileForm, setProfileForm] = useState({
    name: user?.company?.name || user?.name || '',
    ruc: user?.company?.ruc || '',
    rubro: user?.company?.rubro || '',
    direccion: user?.company?.direccion || '',
    horario: user?.company?.horario || '',
    telefono: user?.telefono || '',
  });
  const [savingCompanyProfile, setSavingCompanyProfile] = useState(false);

  const handleCompanyProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCompanyProfile(true);
    try {
      await api.auth.updateProfile({
        name: profileForm.name,
        ruc: profileForm.ruc,
        rubro: profileForm.rubro,
        direccion: profileForm.direccion,
        horario: profileForm.horario,
        telefono: profileForm.telefono,
      });
      // Reload to reflect changes
      window.location.reload();
    } catch (err: any) {
      alert(err.message || 'Error al guardar perfil');
    } finally {
      setSavingCompanyProfile(false);
    }
  };

  // 1. If profile is incomplete, render onboarding completion form
  if (isProfileIncomplete) {
    return (
      <div className="max-w-md mx-auto space-y-6 py-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Activa tu Cuenta</h2>
          <p className="text-xs text-gray-500">Iniciaste con Google, ahora necesitamos tus datos corporativos de la empresa.</p>
        </div>

        <Card className="border border-red-150 shadow-xl overflow-hidden animate-fadeIn bg-white">
          <CardHeader className="bg-gradient-to-r from-red-50 to-white border-b border-red-100 p-5 flex items-center gap-3">
            <Building2 className="w-5 h-5 text-red-800" />
            <div>
              <h2 className="text-sm font-bold text-gray-900">Registro de Datos Comerciales</h2>
              <p className="text-[9px] text-gray-400">Requerido para publicar ofertas laborales.</p>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleCompleteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Razón Social (Nombre de la Empresa)</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    name="company_name"
                    placeholder="Tech Solutions SAC"
                    value={completeForm.company_name}
                    onChange={handleCompleteChange}
                    className="pl-9 block w-full rounded-xl border border-gray-300 px-3 py-2 text-xs shadow-sm focus:outline-none h-10 bg-white"
                  />
                </div>
                {completeErrors.company_name && <p className="text-[10px] text-red-600 mt-0.5">{completeErrors.company_name}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">RUC (Registro Único de Contribuyente)</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    name="ruc"
                    placeholder="11 dígitos"
                    maxLength={11}
                    value={completeForm.ruc}
                    onChange={handleCompleteChange}
                    className="pl-9 block w-full rounded-xl border border-gray-300 px-3 py-2 text-xs shadow-sm focus:outline-none h-10 bg-white"
                  />
                </div>
                {completeErrors.ruc && <p className="text-[10px] text-red-600 mt-0.5">{completeErrors.ruc}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Persona de Contacto</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    name="contact_name"
                    placeholder="Nombre completo del reclutador"
                    value={completeForm.contact_name}
                    onChange={handleCompleteChange}
                    className="pl-9 block w-full rounded-xl border border-gray-300 px-3 py-2 text-xs shadow-sm focus:outline-none h-10 bg-white"
                  />
                </div>
                {completeErrors.contact_name && <p className="text-[10px] text-red-600 mt-0.5">{completeErrors.contact_name}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Rubro Comercial</label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    name="rubro"
                    placeholder="Ej: Telecomunicaciones, Finanzas"
                    value={completeForm.rubro}
                    onChange={handleCompleteChange}
                    className="pl-9 block w-full rounded-xl border border-gray-300 px-3 py-2 text-xs shadow-sm focus:outline-none h-10 bg-white"
                  />
                </div>
                {completeErrors.rubro && <p className="text-[10px] text-red-600 mt-0.5">{completeErrors.rubro}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Teléfono Corporativo</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    name="telefono"
                    placeholder="999888777"
                    maxLength={9}
                    value={completeForm.telefono}
                    onChange={handleCompleteChange}
                    className="pl-9 block w-full rounded-xl border border-gray-300 px-3 py-2 text-xs shadow-sm focus:outline-none h-10 bg-white"
                  />
                </div>
                {completeErrors.telefono && <p className="text-[10px] text-red-600 mt-0.5">{completeErrors.telefono}</p>}
              </div>

              <Button
                type="submit"
                loading={savingProfile}
                className="w-full bg-red-800 hover:bg-red-900 text-white font-bold py-2.5 rounded-xl shadow-xs text-xs mt-2 h-10"
              >
                Activar Cuenta Empresa
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 2. If profile is complete, render normal dashboard
  return (
    <div className="space-y-8 font-sans max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-red-900 to-amber-900 text-white rounded-2xl p-6 sm:p-8 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-amber-300">
            <Sparkles className="w-3.5 h-3.5" /> Portal Corporativo Conecta UNSA
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Panel de Control de Reclutamiento</h1>
          <p className="text-sm text-gray-250">
            Crea ofertas laborales estructuradas en base a competencias para reclutar egresados de la UNSA de manera transparente.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => {
              setShowForm(false);
              setShowProfile(!showProfile);
            }}
            className="bg-white/90 text-red-950 hover:bg-amber-100 font-bold shadow-md rounded-xl py-2.5 text-xs"
          >
            <Settings className="w-4 h-4 mr-1" />
            Mi Empresa
          </Button>
          <Button
            onClick={() => {
              setShowProfile(false);
              setShowForm(!showForm);
            }}
            className="bg-white text-red-950 hover:bg-amber-100 font-bold shadow-md rounded-xl py-2.5 text-xs"
          >
            <Plus className="w-4 h-4 mr-1" />
            {showForm ? 'Cerrar Formulario' : 'Nueva Convocatoria'}
          </Button>
        </div>
      </div>

      {cvFeedback && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-800 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <Download className="w-4 h-4 text-amber-400 animate-bounce" />
          <span>{cvFeedback}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm shadow-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
          <span className="font-medium">{error.message}</span>
        </div>
      )}

      {/* Creation Form */}
      {showForm && (
        <Card className="border border-red-100 shadow-xl overflow-hidden animate-fadeIn">
          <CardHeader className="bg-gradient-to-r from-red-50 to-white border-b border-red-100 py-4 px-6 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-red-800" />
              <h2 className="text-lg font-bold text-gray-900">Registrar Nueva Oferta Laboral</h2>
            </div>
            <span className="text-xs font-bold text-red-800 bg-red-100 px-2.5 py-1 rounded-full uppercase tracking-wider">
              {user.es_verificada ? 'Publicación Automática' : 'Pendiente Verificación RUC'}
            </span>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Info Box on Transparency */}
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl flex items-start gap-3 text-xs text-amber-900">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Política Anti-Opacidad Salarial de la UNSA</p>
                  <p className="leading-relaxed">
                    Es obligatorio declarar rangos salariales transparentes. Si su empresa no está verificada por ODEEG, la oferta permanecerá oculta hasta que el administrador certifique que la empresa es real.
                  </p>
                </div>
              </div>

              {/* SECTION: GENERAL DATA */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-150 pb-1.5">1. Datos Generales del Puesto</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <Input
                    label="RUC de la empresa"
                    name="ruc"
                    maxLength={11}
                    value={formData.ruc}
                    onChange={handleChange}
                    error={formErrors.ruc}
                    className="rounded-xl"
                    disabled={!!user.ruc}
                  />

                  <Input
                    label="Título del Puesto"
                    name="title"
                    placeholder="Ej: Practicante de Ingeniería Industrial"
                    value={formData.title}
                    onChange={handleChange}
                    error={formErrors.title}
                    className="rounded-xl col-span-1 md:col-span-2"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Escuela Profesional de Destino</label>
                    <select
                      name="carrera_destino"
                      value={formData.carrera_destino}
                      onChange={handleChange}
                      className="block w-full rounded-xl border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white h-10"
                    >
                      <option value="">Seleccione carrera</option>
                      {CARRERAS.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {formErrors.carrera_destino && <p className="mt-1 text-xs text-red-600">{formErrors.carrera_destino}</p>}
                  </div>

                  <Input
                    label="Número de Vacantes"
                    name="vacantes"
                    type="number"
                    min={1}
                    value={formData.vacantes}
                    onChange={handleChange}
                    error={formErrors.vacantes}
                    className="rounded-xl bg-white"
                  />

                  <Input
                    label="Lugar de Trabajo"
                    name="lugar"
                    placeholder="Ej: Parque Industrial Calle Ambrosio Vucetich 130"
                    value={formData.lugar}
                    onChange={handleChange}
                    error={formErrors.lugar}
                    className="rounded-xl bg-white"
                  />
                </div>
              </div>

              {/* SECTION: CONVOCATORY DATE & SALARY */}
              <div className="space-y-4 pt-2">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-150 pb-1.5">2. Fechas y Retribución</h3>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                  <Input
                    label="Fecha de Apertura"
                    name="fecha_inicio"
                    type="date"
                    value={formData.fecha_inicio}
                    onChange={handleChange}
                    error={formErrors.fecha_inicio}
                    className="rounded-xl bg-white"
                  />

                  <Input
                    label="Fecha de Cierre"
                    name="fecha_cierre"
                    type="date"
                    value={formData.fecha_cierre}
                    onChange={handleChange}
                    error={formErrors.fecha_cierre}
                    className="rounded-xl bg-white"
                  />

                  <Input
                    label="Salario Mínimo (S/)"
                    name="salario_min"
                    type="number"
                    min={0}
                    value={formData.salario_min || ''}
                    onChange={handleChange}
                    error={formErrors.salario_min}
                    className="rounded-xl bg-white"
                  />

                  <Input
                    label="Salario Máximo (S/)"
                    name="salario_max"
                    type="number"
                    min={0}
                    value={formData.salario_max || ''}
                    onChange={handleChange}
                    error={formErrors.salario_max}
                    className="rounded-xl bg-white"
                  />
                </div>
              </div>

              {/* SECTION: COMPETENCIES SELECTOR (LinkedIn style) */}
              <div className="space-y-4 pt-2">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-150 pb-1.5">3. Competencias Requeridas</h3>
                
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-gray-600">
                    Palabras clave del perfil (Ingresa y presiona Enter, o haz clic en las sugerencias populares)
                  </label>
                  
                  {/* Tags Tray */}
                  <div className="flex flex-wrap gap-2 p-2.5 min-h-12 border border-gray-300 rounded-xl bg-white focus-within:ring-2 focus-within:ring-red-500 focus-within:border-red-500 transition-colors items-center">
                    {formData.competencias.map((tag, idx) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-50 text-red-800 text-xs font-semibold border border-red-100"
                      >
                        <Tag className="w-3 h-3 text-red-700" />
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveCompetencia(idx)}
                          className="text-red-600 hover:text-red-800 font-bold focus:outline-none"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      name="competenciasInput"
                      placeholder="Agregar habilidad..."
                      value={formData.competenciasInput}
                      onChange={handleChange}
                      onKeyDown={handleAddCompetencia}
                      className="flex-1 outline-none text-xs bg-transparent border-0 focus:ring-0 min-w-40"
                    />
                  </div>
                  {formErrors.competencias && <p className="text-xs text-red-600 mt-1">{formErrors.competencias}</p>}

                  {/* Preset Pills */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 block uppercase">Sugeridos según Bolsa de Trabajo:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {PRESET_SKILLS.map(skill => {
                        const isAdded = formData.competencias.includes(skill);
                        return (
                          <button
                            key={skill}
                            type="button"
                            onClick={() => handleAddPresetSkill(skill)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all flex items-center gap-1 ${
                              isAdded 
                                ? 'bg-red-50 border-red-200 text-red-800' 
                                : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            {isAdded && <Check className="w-3 h-3 text-red-750" />}
                            {skill}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION: DETAILED CONVOCATORY BLOCKS */}
              <div className="space-y-4 pt-2">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-150 pb-1.5">4. Perfil y Funciones (Estructura de Convocatoria Real)</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Requisitos */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Requisitos del Perfil (Estudios, experiencia, herramientas)
                    </label>
                    <textarea
                      name="requisitos"
                      rows={4}
                      value={formData.requisitos}
                      onChange={handleChange}
                      className="block w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors h-28"
                      placeholder="Ej:&#10;- Estudiante de pregrado o egresado de Ing. Industrial.&#10;- Manejo intermedio de Microsoft Office.&#10;- Proactivo y responsable."
                    />
                    {formErrors.requisitos && <p className="mt-1 text-xs text-red-600">{formErrors.requisitos}</p>}
                  </div>

                  {/* Funciones */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Funciones Principales del Puesto
                    </label>
                    <textarea
                      name="funciones"
                      rows={4}
                      value={formData.funciones}
                      onChange={handleChange}
                      className="block w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors h-28"
                      placeholder="Ej:&#10;- Control de documentación administrativa.&#10;- Soporte en cotizaciones y compras.&#10;- Apoyo en gestión de personal."
                    />
                    {formErrors.funciones && <p className="mt-1 text-xs text-red-600">{formErrors.funciones}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Horario */}
                  <Input
                    label="Horario y Jornada de Trabajo"
                    name="horario"
                    placeholder="Ej: Lunes a Viernes, 8:00 AM - 5:00 PM (A convenir)"
                    value={formData.horario}
                    onChange={handleChange}
                    className="rounded-xl bg-white"
                  />

                  {/* Adicionales */}
                  <Input
                    label="Información Adicional (Beneficios, movilidad, etc.)"
                    name="informacion_adicional"
                    placeholder="Ej: Apoyo económico para pasajes, posibilidad de línea de carrera."
                    value={formData.informacion_adicional}
                    onChange={handleChange}
                    className="rounded-xl bg-white"
                  />
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-150">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-xl px-5 py-2 text-xs"
                >
                  Cancelar
                </Button>

                {isSalaryEmpty ? (
                  <button
                    type="button"
                    disabled
                    className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-gray-400 bg-gray-100 rounded-xl cursor-not-allowed border border-gray-200"
                  >
                    <Lock className="w-4 h-4" />
                    Ingresar Rango Salarial para Publicar
                  </button>
                ) : (
                  <Button
                    type="submit"
                    loading={submitting}
                    className="bg-red-800 hover:bg-red-900 text-white rounded-xl px-5 shadow-md py-2 text-xs"
                  >
                    Publicar Convocatoria
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Employer Profile Section */}
      {showProfile && (
        <Card className="border border-gray-200 shadow-md animate-fadeIn">
          <CardHeader className="bg-gradient-to-r from-amber-50 to-white border-b border-amber-100 py-4 px-6">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-amber-800" />
              <h2 className="text-lg font-bold text-gray-900">Perfil de la Empresa</h2>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleCompanyProfileSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input label="Razón Social" name="name" value={profileForm.name} onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))} className="bg-white rounded-xl" />
                <Input label="RUC" name="ruc" value={profileForm.ruc} onChange={e => setProfileForm(p => ({ ...p, ruc: e.target.value }))} className="bg-white rounded-xl" maxLength={11} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input label="Rubro Comercial" name="rubro" value={profileForm.rubro} onChange={e => setProfileForm(p => ({ ...p, rubro: e.target.value }))} className="bg-white rounded-xl" />
                <Input label="Teléfono" name="telefono" value={profileForm.telefono} onChange={e => setProfileForm(p => ({ ...p, telefono: e.target.value }))} className="bg-white rounded-xl" maxLength={9} />
              </div>
              <Input label="Dirección" name="direccion" value={profileForm.direccion} onChange={e => setProfileForm(p => ({ ...p, direccion: e.target.value }))} className="bg-white rounded-xl" />
              <Input label="Horario de Atención" name="horario" value={profileForm.horario} onChange={e => setProfileForm(p => ({ ...p, horario: e.target.value }))} className="bg-white rounded-xl" placeholder="Lunes a Viernes de 8:00 AM a 5:00 PM" />
              <div className="flex justify-end pt-3 border-t border-gray-150">
                <Button type="submit" loading={savingCompanyProfile} className="bg-amber-700 hover:bg-amber-900 text-white rounded-xl font-bold px-5 py-2.5 text-xs shadow-md">
                  <Save className="w-3.5 h-3.5 mr-1" /> Guardar Cambios
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* History Area */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Historial de ofertas publicadas</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Convocatorias de reclutamiento activas y postulantes asociados.
            </p>
          </div>
          <span className="px-3 py-1 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold border border-gray-200">
            {jobs.length} oferta{jobs.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin h-8 w-8 border-4 border-red-800 border-t-transparent rounded-full" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-16 bg-white border border-gray-150 rounded-2xl">
            <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="font-bold text-gray-700 text-base">Aún no has registrado convocatorias</p>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
              Presiona el botón &quot;Nueva Convocatoria&quot; arriba para redactar tu primera oferta laboral.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5">
            {jobs.map((job) => {
              const hasApplicants = job.applications && job.applications.length > 0;
              const isExpanded = !!expandedJobApplicants[job.id];

              return (
                <Card key={job.id} className="hover:shadow-md transition-shadow border border-gray-150 bg-white overflow-hidden">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-grow space-y-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-extrabold text-gray-900 text-lg">{job.title}</h3>
                          {statusBadge(job.status)}
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-650 text-[10px] font-bold rounded-md border border-gray-200">
                            {job.vacantes || 1} vacante{ (job.vacantes || 1) !== 1 ? 's' : '' }
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-gray-500 font-medium">
                          <span className="flex items-center gap-1 text-gray-600">
                            <MapPin className="w-3.5 h-3.5 text-gray-400" /> {job.lugar || 'Lugar no especificado'}
                          </span>
                          <span className="flex items-center gap-1 text-gray-600">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" /> Cierre: {job.fecha_cierre ? new Date(job.fecha_cierre + 'T23:59:59').toLocaleDateString('es-PE') : 'No definido'}
                          </span>
                          <span className="flex items-center gap-1 text-gray-600">
                            <Clock className="w-3.5 h-3.5 text-gray-400" /> {job.horario || 'Horario no registrado'}
                          </span>
                        </div>

                        {job.competencias && job.competencias.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {job.competencias.map((comp) => (
                              <span key={comp} className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200/50 text-amber-800 text-[9px] font-bold px-2 py-0.5 rounded-md">
                                <Tag className="w-2.5 h-2.5" />
                                {comp}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Salary Display */}
                      <div className="flex-shrink-0">
                        <div className="bg-green-50/60 border border-green-200/60 rounded-xl p-3 text-right">
                          <p className="text-[9px] text-green-700 font-bold uppercase tracking-wider mb-0.5 flex items-center justify-end gap-1">
                            <DollarSign className="w-3 h-3" /> Salario Transparente
                          </p>
                          <p className="text-base font-black text-green-800">
                            S/ {job.salario_min.toLocaleString('es-PE')} - S/ {job.salario_max.toLocaleString('es-PE')}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-gray-50/60 p-4 rounded-xl border border-gray-150">
                      <div>
                        <strong className="text-xs text-gray-800 block mb-1">Requisitos:</strong>
                        <p className="text-gray-650 leading-relaxed whitespace-pre-line">{job.requisitos}</p>
                      </div>
                      <div>
                        <strong className="text-xs text-gray-800 block mb-1">Funciones Principales:</strong>
                        <p className="text-gray-650 leading-relaxed whitespace-pre-line">{job.funciones || 'No especificadas'}</p>
                      </div>
                    </div>

                    {/* Job Management Actions */}
                    <div className="flex flex-wrap items-center justify-between pt-2 border-t border-gray-100 gap-2">
                      <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span>{job.applications?.length || 0} Egresado{(job.applications?.length || 0) !== 1 ? 's' : ''} postulando</span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Employer Job Status Management */}
                        {job.status === 'APPROVED' && (
                          <button
                            type="button"
                            onClick={async () => {
                              if (confirm('¿Dar por cerrada esta oferta? Los postulantes recibirán notificación.')) {
                                await updateEmployerJobStatus({ id: job.id, status: 'CLOSED' });
                              }
                            }}
                            className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 transition-colors"
                          >
                            <XCircle className="w-3 h-3" />
                            Cerrar Oferta
                          </button>
                        )}
                        {job.status === 'CLOSED' && (
                          <button
                            type="button"
                            onClick={async () => {
                              await updateEmployerJobStatus({ id: job.id, status: 'APPROVED' });
                            }}
                            className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg border border-green-200 bg-green-50 text-green-800 hover:bg-green-100 transition-colors"
                          >
                            <RefreshCw className="w-3 h-3" />
                            Reactivar
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={async () => {
                            if (confirm('¿Eliminar esta oferta permanentemente? También se eliminarán todas las postulaciones asociadas.')) {
                              await deleteJob(job.id);
                            }
                          }}
                          className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg border border-red-200 bg-red-50 text-red-800 hover:bg-red-100 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                          Eliminar
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleApplicants(job.id)}
                          className={`inline-flex items-center gap-1 text-xs font-bold transition-all px-3 py-1.5 rounded-lg border ${
                            isExpanded
                              ? 'bg-red-50 text-red-800 border-red-200'
                              : 'bg-white text-gray-700 border-gray-250 hover:bg-gray-55'
                          }`}
                        >
                          {isExpanded ? (
                            <>Ocultar Postulantes <ChevronUp className="w-4 h-4" /></>
                          ) : (
                            <>Ver Postulantes <ChevronDown className="w-4 h-4" /></>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Applicants Section */}
                    {isExpanded && (
                      <div className="border-t border-gray-100 pt-4 animate-fadeIn space-y-3.5 bg-gray-50/20 -mx-5 px-5 pb-2">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Lista de Postulantes por Competencias</h4>
                        
                        {!hasApplicants ? (
                          <div className="text-center py-6 text-xs text-gray-400 font-medium">
                            Aún no se han recibido postulaciones para esta convocatoria.
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {job.applications?.map(app => {
                              const applicantUser = app.user;
                              if (!applicantUser) return null;
                              const applicantProfile = (applicantUser as any).profile || {};
                              const appSkills = applicantProfile.skills || [];
                              const appCvName = applicantProfile.cv_name || '';
                              const appCvUrl = applicantProfile.cv_url || '';

                              const matchScore = getMatchPercentage(appSkills, job.competencias);

                              const statusLabels: Record<string, string> = {
                                PENDING: 'Pendiente',
                                REVIEWED: 'Revisado',
                                ACCEPTED: 'Aceptado',
                                REJECTED: 'Rechazado',
                                CV_REVIEWED: 'CV Revisado',
                                IN_PROCESS: 'En Proceso',
                                FINALIST: 'Finalista',
                                PROCESS_FINISHED: 'Proceso Finalizado',
                              };
                              const statusColors: Record<string, string> = {
                                PENDING: 'bg-amber-50 text-amber-800 border-amber-200',
                                REVIEWED: 'bg-blue-50 text-blue-800 border-blue-200',
                                ACCEPTED: 'bg-green-50 text-green-800 border-green-200',
                                REJECTED: 'bg-red-50 text-red-800 border-red-200',
                                CV_REVIEWED: 'bg-purple-50 text-purple-800 border-purple-200',
                                IN_PROCESS: 'bg-cyan-50 text-cyan-800 border-cyan-200',
                                FINALIST: 'bg-indigo-50 text-indigo-800 border-indigo-200',
                                PROCESS_FINISHED: 'bg-gray-100 text-gray-700 border-gray-300',
                              };

                              return (
                                <div 
                                  key={app.id || app.userId}
                                  className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-4 shadow-3xs"
                                >
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="space-y-2 flex-grow">
                                      <div className="flex flex-wrap items-center gap-2">
                                      <strong className="text-sm text-gray-950 font-bold">{applicantUser.name}</strong>
                                      <span className="text-[10px] bg-red-50 text-red-800 font-bold px-2 py-0.5 rounded-md border border-red-100">
                                        {applicantProfile.carrera || 'N/D'}
                                      </span>
                                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${statusColors[app.status] || statusColors.PENDING}`}>
                                        {statusLabels[app.status] || app.status}
                                      </span>
                                    </div>

                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 font-medium">
                                      <span>Teléfono: <strong className="text-gray-700 font-semibold">{applicantProfile.telefono || applicantUser.telefono}</strong></span>
                                      <span>Correo: <strong className="text-gray-700 font-semibold">{applicantUser.email}</strong></span>
                                    </div>

                                    {appSkills.length > 0 && (
                                      <div className="flex flex-wrap gap-1">
                                        {appSkills.map((skill: string) => {
                                            const matches = job.competencias?.some(jc => jc.toLowerCase() === skill.toLowerCase());
                                            return (
                                              <span 
                                                key={skill}
                                                className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${
                                                  matches 
                                                    ? 'bg-green-50 border-green-200 text-green-800'
                                                    : 'bg-gray-100 border-gray-200 text-gray-500'
                                                }`}
                                              >
                                                {skill}
                                              </span>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>

                                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 flex-shrink-0">
                                      {/* Match Gauge */}
                                      <div className="text-right">
                                        <span className="text-[9px] text-gray-400 font-black uppercase tracking-wider block">Match Habilidades</span>
                                        <span className={`text-base font-black ${
                                          matchScore >= 80 ? 'text-green-700' : matchScore >= 50 ? 'text-amber-700' : 'text-gray-600'
                                        }`}>{matchScore}% Match</span>
                                      </div>

                                      {/* Simulated CV Download */}
                                    {appCvName ? (
                                      <a
                                        href={appCvUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`inline-flex items-center gap-1.5 text-xs font-bold border px-3 py-1.5 rounded-lg transition-colors ${appCvUrl ? 'text-red-800 hover:text-red-950 border-red-250 bg-red-50/20' : 'text-gray-400 border-gray-200 bg-gray-50 pointer-events-none'}`}
                                      >
                                        <FileText className="w-3.5 h-3.5" />
                                        <span>Ver CV</span>
                                      </a>
                                    ) : (
                                      <span className="text-[10px] text-gray-400 italic">CV no subido</span>
                                    )}
                                    </div>
                                  </div>

                                  {/* Application Status Controls */}
                                  <div className="border-t border-gray-100 pt-3">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Actualizar Estado</p>
                                    <div className="flex flex-wrap gap-1.5">
                                      {(['PENDING', 'REVIEWED', 'CV_REVIEWED', 'IN_PROCESS', 'FINALIST', 'REJECTED', 'ACCEPTED', 'PROCESS_FINISHED'] as ApplicationStatus[]).map(status => {
                                        const isActive = app.status === status;
                                        const colorMap: Record<string, string> = {
                                          PENDING: isActive ? 'bg-amber-100 border-amber-300 text-amber-900' : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100',
                                          REVIEWED: isActive ? 'bg-blue-100 border-blue-300 text-blue-900' : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100',
                                          CV_REVIEWED: isActive ? 'bg-purple-100 border-purple-300 text-purple-900' : 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100',
                                          IN_PROCESS: isActive ? 'bg-cyan-100 border-cyan-300 text-cyan-900' : 'bg-cyan-50 border-cyan-200 text-cyan-700 hover:bg-cyan-100',
                                          FINALIST: isActive ? 'bg-indigo-100 border-indigo-300 text-indigo-900' : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100',
                                          REJECTED: isActive ? 'bg-red-100 border-red-300 text-red-900' : 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100',
                                          ACCEPTED: isActive ? 'bg-green-100 border-green-300 text-green-900' : 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100',
                                          PROCESS_FINISHED: isActive ? 'bg-gray-200 border-gray-400 text-gray-900' : 'bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200',
                                        };
                                        return (
                                          <button
                                            key={status}
                                            type="button"
                                            onClick={() => updateApplicationStatus({ applicationId: app.id, status })}
                                            className={`text-[9px] font-bold px-2 py-1 rounded-lg border transition-all ${colorMap[status] || ''} ${isActive ? 'ring-2 ring-offset-1' : ''}`}
                                          >
                                            {statusLabels[status] || status}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
