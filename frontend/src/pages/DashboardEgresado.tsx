import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Briefcase,
  DollarSign,
  MapPin,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  GraduationCap,
  Plus,
  Send,
  Building,
  Check,
  Clock,
  FileCheck,
  X,
  FileText,
  Upload,
  Star,
  User as UserIcon,
  ThumbsUp,
  Linkedin,
  Globe,
  Loader,
  RefreshCw,
  Link as LinkIcon,
  ChevronRight,
  Bot,
  Mic,
  Cpu,
  Bell,
  MessageCircle
} from 'lucide-react';

import { useJobs } from '../hooks/useJobs';
import { api } from '../services/api';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { CARRERAS } from '../config';
import type { User as UserType, Job, Application, MatchDetail, GraduateProfile } from '../types';

interface DashboardEgresadoProps {
  user: UserType;
}

const STATUS_LABELS: Record<string, { label: string; color: string; icon: any }> = {
  PENDING: { label: 'Postulado', color: 'bg-amber-50 text-amber-800 border-amber-200', icon: Clock },
  REVIEWED: { label: 'CV Revisado', color: 'bg-blue-50 text-blue-800 border-blue-200', icon: FileText },
  CV_REVIEWED: { label: 'CV Revisado', color: 'bg-purple-50 text-purple-800 border-purple-200', icon: FileCheck },
  IN_PROCESS: { label: 'En Proceso', color: 'bg-cyan-50 text-cyan-800 border-cyan-200', icon: RefreshCw },
  FINALIST: { label: 'Finalista', color: 'bg-indigo-50 text-indigo-800 border-indigo-200', icon: ThumbsUp },
  ACCEPTED: { label: 'Ganaste', color: 'bg-green-50 text-green-800 border-green-200', icon: CheckCircle2 },
  REJECTED: { label: 'Rechazado', color: 'bg-red-50 text-red-800 border-red-200', icon: X },
  PROCESS_FINISHED: { label: 'Proceso Finalizado', color: 'bg-gray-100 text-gray-700 border-gray-300', icon: Check },
};

export default function DashboardEgresado({ user }: DashboardEgresadoProps) {
  const { matchedQuery, myApplicationsQuery, applyJob } = useJobs();
  const { data: jobs = [], isLoading: loading, error } = matchedQuery;
  const { data: applications = [], isLoading: loadingApps } = myApplicationsQuery;

  const [activeTab, setActiveTab] = useState<'FEED' | 'APPLICATIONS' | 'PROFILE'>('FEED');
  const [, setGraduateProfile] = useState<GraduateProfile | null>(null);
  const [myRatings, setMyRatings] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventForModal, setSelectedEventForModal] = useState<any | null>(null);

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    carrera: '',
    telefono: '',
    skills: [] as string[],
    cv_name: '',
    cv_url: '',
    bio: '',
    linkedin_url: '',
    portfolio_url: '',
    education: '',
    work_experience: '',
    certifications: '',
    languages: '',
  });

  const [newSkill, setNewSkill] = useState('');
  const [selectedJobForModal, setSelectedJobForModal] = useState<Job | null>(null);
  const [selectedJobForInterview, setSelectedJobForInterview] = useState<Job | null>(null);
  const [interviewStep, setInterviewStep] = useState(0); // 0: loading, 1: chat
  const [chatMessages, setChatMessages] = useState<{sender: 'ai'|'user', text: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isAiTyping]);

  const [appliedJobs, setAppliedJobs] = useState<string[]>([]);
  const [viewedJobs, setViewedJobs] = useState<string[]>([]);
  const [whatsappNotifs, setWhatsappNotifs] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [matchDetail, setMatchDetail] = useState<MatchDetail | null>(null);
  const [loadingMatchDetail, setLoadingMatchDetail] = useState(false);
  const [ratingScore, setRatingScore] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const [gp, ratings, evts] = await Promise.all([
          api.graduateProfile.get(),
          api.ratings.getMyRatings().catch(() => []),
          api.events.list().catch(() => []),
        ]);
        if (gp) {
          setGraduateProfile(gp);
          setProfileForm({
            name: user.name,
            email: user.email,
            carrera: gp.carrera || '',
            telefono: gp.telefono ? gp.telefono.replace(/^\+51/, '') : '',
            skills: gp.skills || [],
            cv_name: gp.cv_name || '',
            cv_url: gp.cv_url || '',
            bio: gp.bio || '',
            linkedin_url: gp.linkedin_url || '',
            portfolio_url: gp.portfolio_url || '',
            education: gp.education || '',
            work_experience: gp.experience || '',
            certifications: gp.certifications || '',
            languages: gp.languages || '',
          });
        }
        setMyRatings(ratings);
        setEvents(evts);
        console.log('GP loaded from API:', gp);
      } catch (err) {
        console.error('Error loading graduate profile, using login data:', err);
        setProfileForm(prev => ({
          ...prev,
          carrera: user.carrera || prev.carrera || '',
          telefono: user.telefono || prev.telefono || '',
        }));
      }
    };
    fetchProfile();
  }, [user]);

  useEffect(() => {
    if (user.id && jobs.length > 0) {
      const alreadyApplied = jobs.filter(j =>
        j.applications?.some(app => app.userId === user.id)
      ).map(j => j.id);
      setAppliedJobs(alreadyApplied);
    }
  }, [jobs, user.id]);

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    const tag = newSkill.trim();
    if (tag && !profileForm.skills.includes(tag)) {
      setProfileForm(prev => ({ ...prev, skills: [...prev.skills, tag] }));
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setProfileForm(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skillToRemove)
    }));
  };

  const handleCvChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        showFeedback('El archivo excede el límite de 2MB');
        return;
      }
      if (file.type !== 'application/pdf') {
        showFeedback('Solo se aceptan archivos PDF');
        return;
      }
      try {
        showFeedback('Subiendo CV...');
        const result = await api.auth.uploadCv(file);

        setProfileForm(prev => ({
          ...prev,
          cv_name: file.name,
          cv_url: result.cv_url || '#'
        }));

        showFeedback('¡CV subido con éxito!');
      } catch (error: any) {
        showFeedback(error.message || 'Error al subir el CV');
      }
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.carrera) {
      showFeedback('Por favor, selecciona tu Escuela Profesional.');
      return;
    }
    if (!/^\d{9}$/.test(profileForm.telefono.trim())) {
      showFeedback('El número de celular debe contener exactamente 9 dígitos.');
      return;
    }

    setSavingProfile(true);
    try {
      const payload: Record<string, any> = {
        carrera: profileForm.carrera,
        telefono: profileForm.telefono.trim(),
        skills: profileForm.skills,
      };
      for (const [key, value] of Object.entries({
        cv_name: profileForm.cv_name,
        cv_url: profileForm.cv_url,
        bio: profileForm.bio,
        education: profileForm.education,
        experience: profileForm.work_experience,
        certifications: profileForm.certifications,
        languages: profileForm.languages,
        linkedin_url: profileForm.linkedin_url,
        portfolio_url: profileForm.portfolio_url,
      })) {
        if (value) payload[key] = value.trim();
      }

      await api.graduateProfile.update(payload as any);

      const updated = await api.graduateProfile.get();
      if (updated) {
        setProfileForm(prev => ({
          ...prev,
          carrera: updated.carrera || prev.carrera,
          telefono: updated.telefono ? updated.telefono.replace(/^\+51/, '') : prev.telefono,
          skills: updated.skills || prev.skills,
          cv_name: updated.cv_name || prev.cv_name,
          cv_url: updated.cv_url || prev.cv_url,
          bio: updated.bio || prev.bio,
          linkedin_url: updated.linkedin_url || prev.linkedin_url,
          portfolio_url: updated.portfolio_url || prev.portfolio_url,
          education: updated.education || prev.education,
          work_experience: updated.experience || prev.work_experience,
          certifications: updated.certifications || prev.certifications,
          languages: updated.languages || prev.languages,
        }));
      }

      showFeedback('¡Perfil guardado y sincronizado con éxito!');
    } catch (error: any) {
      showFeedback(error.message || 'Error al guardar el perfil');
    } finally {
      setSavingProfile(false);
    }
  };

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const calculateMatch = (job: Job) => {
    const jobTags = job.competencias || [];
    if (jobTags.length === 0) return 70;
    const matchingTags = jobTags.filter(tag =>
      profileForm.skills.some(skill => skill.toLowerCase() === tag.toLowerCase())
    );
    return Math.round((matchingTags.length / jobTags.length) * 100);
  };

  const handleApplyClick = (job: Job) => {
    setSelectedJobForModal(job);
    setMatchDetail(null);
    const existingRating = myRatings.find(r => r.companyId === job.company_id);
    setRatingScore(existingRating?.score || 0);
    setRatingComment(existingRating?.comment || '');
    loadMatchDetail(job.id);
  };

  const hasRatedCompany = (companyId: string) => {
    return myRatings.some(r => r.companyId === companyId);
  };

  const loadMatchDetail = async (jobId: string) => {
    setLoadingMatchDetail(true);
    try {
      const detail = await api.jobs.getMatchDetail(jobId);
      setMatchDetail(detail);
    } catch {
      // fallback: calculate locally
      const job = jobs.find(j => j.id === jobId);
      if (job) {
        const jobTags = job.competencias || [];
        const userSkills = profileForm.skills.map(s => s.toLowerCase());
        const matched = jobTags.filter(t => userSkills.includes(t.toLowerCase()));
        const missing = jobTags.filter(t => !userSkills.includes(t.toLowerCase()));
        setMatchDetail({
          matchPercentage: jobTags.length > 0 ? Math.round((matched.length / jobTags.length) * 100) : 100,
          matchedSkills: matched,
          missingSkills: missing,
          extraSkills: userSkills.filter(s => !jobTags.some(jt => jt.toLowerCase() === s)),
          totalJobSkills: jobTags.length,
          totalUserSkills: userSkills.length,
        });
      }
    } finally {
      setLoadingMatchDetail(false);
    }
  };

  const confirmApply = async () => {
    if (selectedJobForModal) {
      try {
        await applyJob(selectedJobForModal.id);
        setAppliedJobs(prev => [...prev, selectedJobForModal.id]);
        showFeedback('¡Postulación enviada exitosamente!');
        setSelectedJobForModal(null);

      } catch (err: any) {
        showFeedback(err.message || 'Error al postular a la oferta');
      }
    }
  };

  const handleRateCompany = async () => {
    if (!selectedJobForModal || ratingScore === 0) {
      showFeedback('Selecciona una puntuación de 1 a 5 estrellas');
      return;
    }
    setSubmittingRating(true);
    try {
      await api.ratings.rateCompany(
        selectedJobForModal.company_id,
        ratingScore,
        ratingComment || undefined
      );
      setMyRatings(prev => {
        const existing = prev.findIndex(r => r.companyId === selectedJobForModal.company_id);
        const newRating = { companyId: selectedJobForModal.company_id, score: ratingScore, comment: ratingComment };
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = newRating;
          return updated;
        }
        return [...prev, newRating];
      });
      showFeedback(`¡Calificaste a la empresa con ${ratingScore} ★!`);
    } catch (err: any) {
      showFeedback(err.message || 'Error al calificar');
    } finally {
      setSubmittingRating(false);
    }
  };

  const needsRating = (app: Application) => {
    return app.status === 'PROCESS_FINISHED' || app.status === 'ACCEPTED';
  };

  return (
    <div className="space-y-8 font-sans max-w-6xl mx-auto">
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-800 font-black text-xl shadow-inner">
            {user.name.charAt(0)}{user.name.split(' ')[1]?.charAt(0) || ''}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">{user.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-150">
                Egresado UNSA
              </span>
            </div>
            <p className="text-sm text-gray-500 font-medium mt-0.5">{user.email}</p>
            <p className="text-xs text-red-800 font-bold mt-1 flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5" />
              {profileForm.carrera || 'Asigna tu carrera profesional'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
          <div className="text-center md:text-left">
            <span className="text-2xl font-black text-gray-900">{jobs.length}</span>
            <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-wider">Ofertas</span>
          </div>
          <div className="text-center md:text-left">
            <span className="text-2xl font-black text-green-700">{appliedJobs.length}</span>
            <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-wider">Postulaciones</span>
          </div>
          <div className="text-center md:text-left">
            <span className="text-2xl font-black text-purple-700">{applications.filter(a => a.status === 'ACCEPTED').length}</span>
            <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-wider">Ganadas</span>
          </div>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm font-semibold flex items-center gap-2 animate-fadeIn shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-red-700 flex-shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      <div className="border-b border-gray-250 flex justify-between items-end">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('FEED')}
            className={`pb-3 text-sm font-extrabold border-b-2 transition-all ${
              activeTab === 'FEED'
                ? 'border-red-700 text-red-800'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Convocatorias
          </button>
          <button
            onClick={() => setActiveTab('APPLICATIONS')}
            className={`pb-3 text-sm font-extrabold border-b-2 transition-all ${
              activeTab === 'APPLICATIONS'
                ? 'border-red-700 text-red-800'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Mis Postulaciones
            {applications.length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-[10px] bg-red-100 text-red-800 rounded-full">
                {applications.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('PROFILE')}
            className={`pb-3 text-sm font-extrabold border-b-2 transition-all ${
              activeTab === 'PROFILE'
                ? 'border-red-700 text-red-800'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Mi Perfil & CV
          </button>
        </div>
        
        <div className="pb-3 flex items-center pr-2">
          <div className="relative cursor-pointer hover:bg-gray-100 p-1.5 rounded-full transition-colors" title="Notificaciones">
            <Bell className="w-5 h-5 text-gray-600" />
            {jobs.filter(j => !viewedJobs.includes(j.id)).length > 0 && (
              <span className="absolute 0 top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-bold text-white shadow-xs animate-bounce">
                {jobs.filter(j => !viewedJobs.includes(j.id)).length}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* TAB: FEED */}
      {activeTab === 'FEED' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <Card className="border border-gray-200 shadow-xs bg-gray-50/25">
              <CardHeader className="border-b border-gray-150 py-3.5 px-5 bg-white">
                <h3 className="font-extrabold text-sm text-gray-900 flex items-center gap-1.5">
                  <UserIcon className="w-4 h-4 text-red-850" /> Mi Resumen
                </h3>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black text-gray-400 block uppercase tracking-wider">Habilidades:</span>
                  <div className="flex flex-wrap gap-1">
                    {profileForm.skills.map(s => (
                      <span key={s} className="bg-white border border-gray-200 text-gray-800 text-[10px] font-bold px-2 py-0.5 rounded-lg shadow-3xs">
                        {s}
                      </span>
                    ))}
                    {profileForm.skills.length === 0 && <span className="text-xs text-gray-400">Sin habilidades registradas</span>}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-black text-gray-400 block uppercase tracking-wider">CV:</span>
                  <div className="flex items-center gap-2 p-2 bg-white rounded-xl border border-gray-150 text-xs text-gray-700 font-semibold shadow-3xs">
                    <FileText className="w-4 h-4 text-red-700 flex-shrink-0" />
                    {profileForm.cv_url ? (
                      <a href={profileForm.cv_url} target="_blank" rel="noopener noreferrer" className="truncate flex-1 text-blue-700 underline hover:text-blue-900">{profileForm.cv_name}</a>
                    ) : (
                      <span className="truncate flex-1">{profileForm.cv_name || 'No subido'}</span>
                    )}
                  </div>
                </div>

                <div className="text-[10px] text-gray-400 border-t border-gray-150 pt-3 flex items-start gap-1 leading-normal">
                  <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <span>Las ofertas se filtran según tu carrera y habilidades registradas.</span>
                </div>
              </CardContent>
            </Card>

            {appliedJobs.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-gray-500" /> Postulaciones Recientes
                </h3>
                <div className="space-y-2">
                  {jobs.filter(j => appliedJobs.includes(j.id)).slice(0, 3).map(job => {
                    const app = applications.find(a => a.jobId === job.id);
                    const statusInfo = app ? STATUS_LABELS[app.status] : STATUS_LABELS.PENDING;
                    const StatusIcon = statusInfo.icon;
                    return (
                      <div key={job.id} className="p-3.5 bg-white border border-gray-250 rounded-xl flex items-center justify-between gap-4 shadow-3xs hover:border-gray-300 transition-colors">
                        <div className="truncate">
                          <h4 className="text-xs font-extrabold text-gray-950 truncate">{job.title}</h4>
                          <p className="text-[10px] text-gray-450 font-semibold truncate">{job.company_name}</p>
                        </div>
                        <span className={`flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${statusInfo.color}`}>
                          <StatusIcon className="w-3 h-3" /> {statusInfo.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Events Section */}
            {events.length > 0 && (
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-black text-amber-600 uppercase tracking-widest flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-amber-500" /> Eventos & Novedades
                </h3>
                <div className="space-y-2">
                  {events.slice(0, 4).map(event => (
                    <div 
                      key={event.id} 
                      onClick={() => setSelectedEventForModal(event)}
                      className="p-3.5 bg-amber-50/40 border border-amber-100 rounded-xl flex items-center justify-between gap-4 shadow-3xs cursor-pointer hover:border-amber-300 hover:bg-amber-50/80 transition-colors"
                    >
                      <div className="truncate">
                        <h4 className="text-xs font-extrabold text-amber-950 truncate">{event.title}</h4>
                        <p className="text-[10px] text-amber-700 font-semibold truncate">{new Date(event.date).toLocaleDateString('es-PE')} • {event.type}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-2 space-y-6 animate-fadeIn">
            {loading && (
              <div className="flex items-center justify-center py-16 bg-white border border-gray-200 rounded-2xl">
                <div className="animate-spin h-8 w-8 border-4 border-red-800 border-t-transparent rounded-full" />
              </div>
            )}

            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-650" />
                <span className="font-semibold">{error.message}</span>
              </div>
            )}

            {!loading && !error && jobs.length === 0 && (
              <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl">
                <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="font-bold text-gray-700 text-base">No hay convocatorias disponibles</p>
                <p className="text-xs text-gray-400 mt-1">
                  No se registran ofertas para <strong className="text-gray-600 font-bold">{profileForm.carrera || user.carrera}</strong>.
                </p>
              </div>
            )}

            {!loading && !error && jobs.length > 0 && (
              <div className="space-y-4">
                {jobs.map((job) => {
                  const matchScore = calculateMatch(job);
                  let matchBadgeStyle = 'bg-red-50 text-red-800 border-red-100';
                  if (matchScore >= 80) matchBadgeStyle = 'bg-green-50 text-green-800 border-green-200';
                  else if (matchScore >= 50) matchBadgeStyle = 'bg-amber-50 text-amber-800 border-amber-200';

                  return (
                    <Card key={job.id} className="hover:shadow-md transition-shadow border border-gray-200 bg-white">
                      <CardContent className="p-5 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-lg font-extrabold text-gray-900 tracking-tight">{job.title}</h3>
                              {!viewedJobs.includes(job.id) && (
                                <span className="px-2 py-0.5 rounded-md text-[9px] font-black bg-indigo-100 text-indigo-700 border border-indigo-200 shadow-3xs uppercase tracking-widest">
                                  Nuevo
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500 font-semibold">
                              <span className="flex items-center gap-1">
                                <Building className="w-3.5 h-3.5 text-gray-400" /> {job.company_name}
                              </span>
                            </div>
                          </div>

                          <div className={`px-2.5 py-1 rounded-full text-xs font-bold border ${matchBadgeStyle} self-start flex items-center gap-1 shadow-2xs`}>
                            <Sparkles className="w-3 h-3" />
                            <span>Match {matchScore}%</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-gray-400 font-medium">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-gray-300" /> {job.lugar || 'Arequipa'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-gray-300" /> Cierre: {job.fecha_fin ? new Date(job.fecha_fin).toLocaleDateString('es-PE') : 'No registrado'}
                          </span>
                          {job.vacantes && (
                            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md text-[10px] font-bold border border-gray-200">
                              {job.vacantes} vacante{job.vacantes !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>

                        {/* Match Detail: Skill comparison */}
                        {job.competencias && job.competencias.length > 0 && (
                          <div className="space-y-1.5">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                              Comparativa de Competencias
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {job.competencias.map(tag => {
                                const matchesStudent = profileForm.skills.some(
                                  skill => skill.toLowerCase() === tag.toLowerCase()
                                );
                                return (
                                  <span
                                    key={tag}
                                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[9px] font-bold border ${
                                      matchesStudent
                                        ? 'bg-green-50 border-green-200 text-green-800'
                                        : 'bg-red-50 border-red-200 text-red-800'
                                    }`}
                                  >
                                    {matchesStudent ? (
                                      <Check className="w-2.5 h-2.5" />
                                    ) : (
                                      <X className="w-2.5 h-2.5" />
                                    )}
                                    {tag}
                                  </span>
                                );
                              })}
                            </div>
                            <div className="flex gap-3 text-[10px] text-gray-500">
                              <span className="flex items-center gap-1">
                                <Check className="w-3 h-3 text-green-600" />
                                Coinciden: {job.competencias.filter(t => profileForm.skills.some(s => s.toLowerCase() === t.toLowerCase())).length}
                              </span>
                              <span className="flex items-center gap-1">
                                <X className="w-3 h-3 text-red-600" />
                                Faltan: {job.competencias.filter(t => !profileForm.skills.some(s => s.toLowerCase() === t.toLowerCase())).length}
                              </span>
                            </div>
                          </div>
                        )}

                        <p className="text-xs text-gray-600 bg-gray-55 p-3 rounded-xl border border-gray-150 leading-relaxed line-clamp-2">
                          <strong className="text-[10px] text-gray-700 block mb-0.5">Requisitos:</strong>
                          {job.requisitos}
                        </p>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-gray-100">
                          <div className="bg-green-55 border border-green-200/60 rounded-xl px-4 py-1.5 flex items-center gap-1.5">
                            <DollarSign className="w-4 h-4 text-green-700" />
                            <div>
                              <span className="text-[9px] text-green-600 font-bold block uppercase tracking-wider leading-none">Salario</span>
                              <span className="text-sm font-extrabold text-green-800 leading-none">
                                S/ {job.salario_min.toLocaleString('es-PE')} - S/ {job.salario_max.toLocaleString('es-PE')}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedJobForModal(job);
                                if (!viewedJobs.includes(job.id)) {
                                  setViewedJobs(prev => [...prev, job.id]);
                                }
                              }}
                              className="text-xs font-extrabold text-red-800 hover:text-red-900 flex items-center gap-1 transition-colors bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg border border-red-100 shadow-3xs"
                            >
                              Ver Detalles <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                            <Button
                              onClick={() => handleApplyClick(job)}
                              className="bg-red-800 hover:bg-red-950 text-white rounded-xl px-5 py-2 font-bold text-xs shadow-sm flex items-center gap-1.5"
                            >
                              <Send className="w-3.5 h-3.5" />
                              Postular
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: APPLICATIONS */}
      {activeTab === 'APPLICATIONS' && (
        <div className="space-y-4 animate-fadeIn">
          {loadingApps ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin h-8 w-8 border-4 border-red-800 border-t-transparent rounded-full" />
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl">
              <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="font-bold text-gray-700 text-base">No tienes postulaciones</p>
              <p className="text-xs text-gray-400 mt-1">Postula a ofertas desde la pestaña Convocatorias.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {applications.map((app) => {
                const statusInfo = STATUS_LABELS[app.status] || STATUS_LABELS.PENDING;
                const StatusIcon = statusInfo.icon;
                const job = app.job;

                return (
                  <Card key={app.id} className="border border-gray-200 bg-white hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-extrabold text-gray-900 text-base">{job.title}</h3>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${statusInfo.color}`}>
                              <StatusIcon className="w-3 h-3" /> {statusInfo.label}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 font-medium">
                            <span className="flex items-center gap-1">
                              <Building className="w-3 h-3 text-gray-400" /> {job.company_name || job.company?.name}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-gray-400" /> {job.lugar || 'Arequipa'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-gray-400" /> {new Date(app.created_at).toLocaleDateString('es-PE')}
                            </span>
                            {(job as any).company?.contacto_email && (
                              <span className="flex items-center gap-1 text-blue-700 font-semibold">
                                Contacto: {(job as any).company.contacto_email}
                              </span>
                            )}
                          </div>
                          {job.competencias && job.competencias.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {job.competencias.map(skill => {
                                const hasSkill = profileForm.skills.some(s => s.toLowerCase() === skill.toLowerCase());
                                return (
                                  <span key={skill} className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${
                                    hasSkill ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-400'
                                  }`}>
                                    {skill}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <span className="text-xs font-black text-green-700">
                            S/ {job.salario_min.toLocaleString('es-PE')} - S/ {job.salario_max.toLocaleString('es-PE')}
                          </span>
                          {needsRating(app) && (
                            hasRatedCompany(job.company_id) ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg border border-green-200 bg-green-50 text-green-800">
                                <CheckCircle2 className="w-3 h-3" /> Calificado
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  const found = jobs.find(j => j.id === job.id);
                                  if (found) {
                                    setSelectedJobForModal(found);
                                    loadMatchDetail(found.id);
                                  }
                                }}
                                className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 transition-colors"
                              >
                                <Star className="w-3 h-3" /> Calificar Empresa
                              </button>
                            )
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedJobForInterview(job);
                              setInterviewStep(0);
                              setChatMessages([{
                                sender: 'ai',
                                text: `¡Hola, ${profileForm.name.split(' ')[0] || 'Candidato'}! Soy la IA Reclutadora. He revisado tu perfil y noté tu interés en la vacante de **${job.title}** para **${job.company_name}**.\n\nSegún la vacante, buscan a alguien que cumpla con los siguientes requisitos: "${job.requisitos?.substring(0, 80)}...".\n\nPara comenzar, cuéntame: ¿Qué experiencia previa tienes que te ayude a cumplir con este perfil y cómo aportarías valor a la empresa?`
                              }]);
                              setChatInput('');
                              setTimeout(() => setInterviewStep(1), 2500);
                            }}
                            className="inline-flex items-center gap-1.5 text-[10px] font-extrabold px-3 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 transition-all shadow-3xs"
                          >
                            <Bot className="w-3.5 h-3.5" /> Simular Entrevista
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB: PROFILE */}
      {activeTab === 'PROFILE' && (
        <Card className="border border-gray-200 shadow-md animate-fadeIn">
          <CardHeader className="bg-gradient-to-r from-red-50 to-white border-b border-gray-100 py-4 px-6">
            <h2 className="text-lg font-bold text-gray-900">Perfil Profesional Completo</h2>
            <p className="text-[10px] text-gray-500 mt-0.5">Completa todos los campos. El CV se usará para llenar tus datos automáticamente.</p>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre Completo</label>
                  <input type="text" value={profileForm.name} disabled className="block w-full rounded-xl border border-gray-200 bg-gray-50 text-gray-500 px-3 py-2 text-xs shadow-sm h-10 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Correo</label>
                  <input type="text" value={profileForm.email} disabled className="block w-full rounded-xl border border-gray-200 bg-gray-50 text-gray-500 px-3 py-2 text-xs shadow-sm h-10 cursor-not-allowed" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Escuela Profesional</label>
                  <select
                    value={profileForm.carrera}
                    onChange={e => setProfileForm(prev => ({ ...prev, carrera: e.target.value }))}
                    className="block w-full rounded-xl border border-gray-300 px-3 py-2 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white h-10 font-medium"
                  >
                    <option value="">Selecciona tu carrera</option>
                    {CARRERAS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <Input
                  label="Celular"
                  name="telefono"
                  placeholder="999888777"
                  maxLength={9}
                  value={profileForm.telefono}
                  onChange={e => setProfileForm(prev => ({ ...prev, telefono: e.target.value }))}
                  className="bg-white rounded-xl"
                />
              </div>

              <div className="border-t border-gray-150 pt-5 space-y-4">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Redes y Portafolio</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Input
                    label="LinkedIn URL"
                    name="linkedin_url"
                    placeholder="https://linkedin.com/in/tu-perfil"
                    value={profileForm.linkedin_url}
                    onChange={e => setProfileForm(prev => ({ ...prev, linkedin_url: e.target.value }))}
                    className="bg-white rounded-xl"
                    icon={<Linkedin className="w-4 h-4 text-blue-600" />}
                  />
                  <Input
                    label="Portafolio / Web Personal"
                    name="portfolio_url"
                    placeholder="https://tu-portafolio.com"
                    value={profileForm.portfolio_url}
                    onChange={e => setProfileForm(prev => ({ ...prev, portfolio_url: e.target.value }))}
                    className="bg-white rounded-xl"
                    icon={<Globe className="w-4 h-4 text-gray-500" />}
                  />
                </div>
              </div>

              <div className="border-t border-gray-150 pt-5 space-y-4">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Formación y Experiencia</h3>
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-gray-700">Educación (Títulos, Instituciones, Años)</label>
                  <textarea
                    rows={3}
                    placeholder="Ej: Universidad Nacional de San Agustín - Ingeniería de Sistemas (2019-2024)"
                    value={profileForm.education}
                    onChange={e => setProfileForm(prev => ({ ...prev, education: e.target.value }))}
                    className="block w-full rounded-xl border border-gray-300 px-3 py-2.5 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white resize-y"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-gray-700">Experiencia Laboral</label>
                  <textarea
                    rows={3}
                    placeholder="Ej: Practicante en Tech Solutions (2024) - Soporte en desarrollo de aplicaciones web"
                    value={profileForm.work_experience}
                    onChange={e => setProfileForm(prev => ({ ...prev, work_experience: e.target.value }))}
                    className="block w-full rounded-xl border border-gray-300 px-3 py-2.5 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white resize-y"
                  />
                </div>
              </div>

              <div className="border-t border-gray-150 pt-5 space-y-4">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Certificaciones e Idiomas</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-gray-700">Certificaciones</label>
                    <textarea
                      rows={3}
                      placeholder="Ej: AWS Cloud Practitioner, Scrum Master, Excel Avanzado"
                      value={profileForm.certifications}
                      onChange={e => setProfileForm(prev => ({ ...prev, certifications: e.target.value }))}
                      className="block w-full rounded-xl border border-gray-300 px-3 py-2.5 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white resize-y"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-gray-700">Idiomas</label>
                    <textarea
                      rows={3}
                      placeholder="Ej: Inglés Avanzado (B2), Portugués Básico"
                      value={profileForm.languages}
                      onChange={e => setProfileForm(prev => ({ ...prev, languages: e.target.value }))}
                      className="block w-full rounded-xl border border-gray-300 px-3 py-2.5 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white resize-y"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2 border-t border-gray-150 pt-5">
                <label className="block text-sm font-semibold text-gray-750">Resumen Profesional</label>
                <textarea
                  rows={4}
                  placeholder="Escribe un breve resumen de tu perfil profesional..."
                  value={profileForm.bio}
                  onChange={e => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                  className="block w-full rounded-xl border border-gray-300 px-3 py-2.5 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white resize-y"
                />
              </div>

              <div className="space-y-2 border-t border-gray-150 pt-5">
                <label className="block text-sm font-semibold text-gray-750">
                  Currículum Vitae (PDF)
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 border border-dashed border-gray-300 rounded-xl bg-gray-50/50">
                  <div className="p-3 bg-red-50 rounded-xl text-red-800">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div className="flex-1 text-center sm:text-left space-y-0.5">
                    {profileForm.cv_name ? (
                      <>
                        {profileForm.cv_url ? (
                          <a href={profileForm.cv_url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-blue-700 underline hover:text-blue-900 truncate block">{profileForm.cv_name}</a>
                        ) : (
                          <p className="text-xs font-bold text-gray-900 truncate">{profileForm.cv_name}</p>
                        )}
                        <p className="text-[10px] text-green-700 font-semibold">CV activo y visible para empleadores.</p>
                      </>
                    ) : (
                      <>
                        <p className="text-xs font-bold text-gray-700">No has subido CV</p>
                        <p className="text-[10px] text-gray-400">Sube tu CV en PDF. Los datos se cargarán automáticamente a tu perfil.</p>
                      </>
                    )}
                  </div>
                  <div className="relative">
                    <input type="file" id="cv-upload-input" accept=".pdf" onChange={handleCvChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    <button type="button" className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 font-bold border border-gray-250 rounded-xl text-xs shadow-xs">
                      <Upload className="w-3.5 h-3.5" />
                      {profileForm.cv_name ? 'Reemplazar' : 'Subir PDF'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-3 border-t border-gray-150 pt-5">
                <label className="block text-sm font-semibold text-gray-750">Competencias / Habilidades</label>
                <div className="flex flex-wrap gap-1.5 p-3.5 border border-gray-300 rounded-xl bg-white min-h-16 items-center">
                  {profileForm.skills.map(skill => (
                    <span key={skill} className="inline-flex items-center gap-1.5 bg-red-50 border border-red-100 text-red-800 text-xs font-semibold px-2.5 py-1 rounded-lg">
                      {skill}
                      <button type="button" onClick={() => handleRemoveSkill(skill)} className="text-red-600 hover:text-red-800 font-bold">&times;</button>
                    </span>
                  ))}
                  {profileForm.skills.length === 0 && (
                    <p className="text-xs text-gray-400 italic">Agrega tus habilidades técnicas y profesionales.</p>
                  )}
                </div>
                <div className="flex gap-2 max-w-md">
                  <input type="text" placeholder="Ej: NestJS, Python, AutoCAD..." value={newSkill} onChange={(e) => setNewSkill(e.target.value)} className="flex-1 rounded-xl border border-gray-300 px-3 py-1.5 text-xs shadow-sm focus:outline-none h-9 bg-white" />
                  <Button type="button" onClick={handleAddSkill} className="bg-red-800 hover:bg-red-900 text-white rounded-xl text-xs py-1.5 px-4 h-9">
                    <Plus className="w-3.5 h-3.5 mr-0.5" /> Agregar
                  </Button>
                </div>
              </div>

              {/* Preferencias de Notificacion */}
              <div className="pt-6 mt-6 border-t border-gray-150">
                <h3 className="text-sm font-black text-gray-900 mb-3 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-gray-500" /> Preferencias de Notificación
                </h3>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center justify-between shadow-3xs transition-all hover:border-green-300 hover:shadow-sm">
                  <div className="space-y-1 max-w-[80%]">
                    <p className="text-xs font-extrabold text-gray-800 flex items-center gap-1.5">
                      <MessageCircle className="w-4 h-4 text-green-600" />
                      Alertas por WhatsApp
                    </p>
                    <p className="text-[10px] text-gray-500 font-medium leading-relaxed">
                      Recibe un mensaje inmediato en tu celular cuando una vacante haga un match mayor al 80% con tu perfil. (Demostración simulada).
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input type="checkbox" className="sr-only peer" checked={whatsappNotifs} onChange={(e) => setWhatsappNotifs(e.target.checked)} />
                    <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500 shadow-inner"></div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end pt-5 border-t border-gray-150 mt-6">
                <Button type="submit" loading={savingProfile} className="bg-red-800 hover:bg-red-950 text-white rounded-xl font-bold px-6 py-2.5 text-xs shadow-md">
                  Guardar Perfil Completo
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* DETAIL MODAL */}
      {selectedJobForModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn overflow-y-auto">
          <Card className="w-full max-w-2xl shadow-2xl border border-red-100 overflow-hidden bg-white rounded-2xl my-8">
            <CardHeader className="bg-gradient-to-r from-red-50 to-white border-b border-red-100 py-4 px-6 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-red-800" />
                <h3 className="text-lg font-extrabold text-gray-900 truncate">Detalle de Convocatoria</h3>
              </div>
              <button onClick={() => setSelectedJobForModal(null)} className="text-gray-400 hover:text-gray-650 p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-black text-gray-950 tracking-tight">{selectedJobForModal.title}</h2>
                    <p className="text-xs text-gray-500 font-bold flex items-center gap-1.5 mt-0.5">
                      <Building className="w-4 h-4 text-gray-450" /> {selectedJobForModal.company_name}
                    </p>
                  </div>
                  <div className="px-3 py-1 rounded-full text-xs font-black bg-red-50 border border-red-100 text-red-800 flex items-center gap-1 shadow-3xs">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Match {calculateMatch(selectedJobForModal)}%</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs text-gray-600 font-semibold border-y border-gray-100 py-3">
                  <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-gray-400" /> {selectedJobForModal.lugar || 'No especificado'}</span>
                  <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-gray-400" /> Cierre: {selectedJobForModal.fecha_fin ? new Date(selectedJobForModal.fecha_fin).toLocaleDateString('es-PE') : 'N/R'}</span>
                  <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-gray-400" /> {selectedJobForModal.horario || 'N/R'}</span>
                </div>

                {(selectedJobForModal as any).company?.contacto_email || (selectedJobForModal as any).company?.contacto_telefono ? (
                  <div className="px-3 py-2 bg-blue-50/50 border border-blue-100 rounded-lg text-xs">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Contacto de la Empresa</p>
                    {(selectedJobForModal as any).company?.contacto_email && (
                      <p className="text-blue-800 font-semibold">Email: {(selectedJobForModal as any).company.contacto_email}</p>
                    )}
                    {(selectedJobForModal as any).company?.contacto_telefono && (
                      <p className="text-blue-800 font-semibold">Teléfono: {(selectedJobForModal as any).company.contacto_telefono}</p>
                    )}
                  </div>
                ) : selectedJobForModal.company_name && (
                  <div className="px-3 py-2 bg-gray-50 border border-gray-150 rounded-lg text-xs text-gray-600 italic">
                    Contacta a {selectedJobForModal.company_name} para más información.
                  </div>
                )}
              </div>

              {/* MATCH DETAIL SECTION */}
              <div className="p-4 bg-indigo-50/40 border border-indigo-200/60 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-gray-800 uppercase tracking-wide flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" /> Comparativa Detallada
                  </h4>
                  {loadingMatchDetail && <Loader className="w-4 h-4 text-gray-400 animate-spin" />}
                </div>

                {matchDetail && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            matchDetail.matchPercentage >= 80 ? 'bg-green-500' :
                            matchDetail.matchPercentage >= 50 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${matchDetail.matchPercentage}%` }}
                        />
                      </div>
                      <span className="text-xs font-black text-gray-700">{matchDetail.matchPercentage}%</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10px]">
                      <div>
                        <p className="font-bold text-green-700 mb-1 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Coinciden ({matchDetail.matchedSkills.length})
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {matchDetail.matchedSkills.map(s => (
                            <span key={s} className="bg-green-50 border border-green-200 text-green-800 px-1.5 py-0.5 rounded font-bold">{s}</span>
                          ))}
                          {matchDetail.matchedSkills.length === 0 && <span className="text-gray-400 italic">Ninguna</span>}
                        </div>
                      </div>
                      <div>
                        <p className="font-bold text-red-700 mb-1 flex items-center gap-1">
                          <X className="w-3 h-3" /> Faltan ({matchDetail.missingSkills.length})
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {matchDetail.missingSkills.map(s => (
                            <span key={s} className="bg-red-50 border border-red-200 text-red-800 px-1.5 py-0.5 rounded font-bold">{s}</span>
                          ))}
                          {matchDetail.missingSkills.length === 0 && <span className="text-gray-400 italic">Completas</span>}
                        </div>
                      </div>
                    </div>
                    {matchDetail.extraSkills.length > 0 && (
                      <div className="text-[10px]">
                        <p className="font-bold text-gray-600 mb-1">Habilidades adicionales tuyas ({matchDetail.extraSkills.length}):</p>
                        <div className="flex flex-wrap gap-1">
                          {matchDetail.extraSkills.map(s => (
                            <span key={s} className="bg-gray-100 border border-gray-200 text-gray-600 px-1.5 py-0.5 rounded font-bold">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {!loadingMatchDetail && !matchDetail && (
                  <p className="text-[10px] text-gray-500 italic">Cargando comparativa de habilidades...</p>
                )}
              </div>

              {/* RATING SECTION (shown for process-finished/accepted jobs) */}
              {appliedJobs.includes(selectedJobForModal.id) && (
                <div className="p-4 bg-amber-50/40 border border-amber-250/60 rounded-xl space-y-3">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-500 fill-current" />
                    <div>
                      <p className="text-xs font-black text-gray-900 uppercase tracking-wide">Califica a la Empresa</p>
                      <p className="text-[10px] text-gray-500">Tu opinión ayuda a mejorar la transparencia del proceso.</p>
                    </div>
                  </div>

                  {hasRatedCompany(selectedJobForModal.company_id) ? (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-xs font-bold text-green-800">Ya calificaste a esta empresa</p>
                        <p className="text-[10px] text-green-600">Calificación: {ratingScore} / 5 ★</p>
                        {ratingComment && <p className="text-[10px] text-green-600 italic">"{ratingComment}"</p>}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600 font-semibold">Tu calificación:</span>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map(num => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => setRatingScore(num)}
                              className={`transition-all ${ratingScore >= num ? 'text-amber-500 scale-110' : 'text-gray-300 hover:text-amber-400'}`}
                            >
                              <Star className={`w-6 h-6 ${ratingScore >= num ? 'fill-current' : ''}`} />
                            </button>
                          ))}
                        </div>
                        {ratingScore > 0 && <span className="text-xs font-bold text-amber-700">{ratingScore} / 5</span>}
                      </div>

                      <textarea
                        rows={2}
                        placeholder="Comentario opcional sobre el proceso de selección..."
                        value={ratingComment}
                        onChange={e => setRatingComment(e.target.value)}
                        className="block w-full rounded-xl border border-gray-300 px-3 py-2 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white resize-y"
                      />

                      <Button
                        onClick={handleRateCompany}
                        loading={submittingRating}
                        disabled={ratingScore === 0}
                        className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold px-4 py-2"
                      >
                        <Star className="w-3.5 h-3.5 mr-1" />
                        {hasRatedCompany(selectedJobForModal.company_id) ? 'Actualizar Calificación' : 'Enviar Calificación'}
                      </Button>
                    </>
                  )}
                </div>
              )}

              <div className="space-y-4 max-h-60 overflow-y-auto pr-1">
                {selectedJobForModal.description && (
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider">Descripción General</h4>
                    <p className="text-xs text-gray-650 bg-gray-50 p-3 rounded-xl border border-gray-150 leading-relaxed whitespace-pre-line">{selectedJobForModal.description}</p>
                  </div>
                )}
                {selectedJobForModal.perfil && (
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider">Perfil Solicitado</h4>
                    <p className="text-xs text-gray-650 bg-gray-50 p-3 rounded-xl border border-gray-150 leading-relaxed whitespace-pre-line">{selectedJobForModal.perfil}</p>
                  </div>
                )}
                {selectedJobForModal.requisitos && (
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider">Requisitos Específicos</h4>
                    <p className="text-xs text-gray-650 bg-gray-50 p-3 rounded-xl border border-gray-150 leading-relaxed whitespace-pre-line">{selectedJobForModal.requisitos}</p>
                  </div>
                )}
                {selectedJobForModal.funciones && (
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider">Funciones</h4>
                    <p className="text-xs text-gray-650 bg-gray-50 p-3 rounded-xl border border-gray-150 leading-relaxed whitespace-pre-line">{selectedJobForModal.funciones}</p>
                  </div>
                )}
                {selectedJobForModal.informacion_adicional && (
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider">Información Adicional</h4>
                    <p className="text-xs text-gray-650 bg-gray-50 p-3 rounded-xl border border-gray-150 leading-relaxed">{selectedJobForModal.informacion_adicional}</p>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-gray-100">
                <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2 flex items-center gap-1.5 self-start sm:self-auto">
                  <DollarSign className="w-4 h-4 text-green-700" />
                  <div>
                    <span className="text-[9px] text-green-600 font-bold block uppercase tracking-wider leading-none">Salario</span>
                    <span className="text-base font-extrabold text-green-800 leading-none">
                      S/ {selectedJobForModal.salario_min.toLocaleString('es-PE')} - S/ {selectedJobForModal.salario_max.toLocaleString('es-PE')}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 self-stretch sm:self-auto">
                  <Button variant="secondary" onClick={() => setSelectedJobForModal(null)} className="rounded-xl px-4 py-2 text-xs">Cerrar</Button>
                  {appliedJobs.includes(selectedJobForModal.id) ? (
                    <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-105 text-gray-500 border border-gray-200 rounded-xl text-xs font-bold shadow-3xs">
                      <CheckCircle2 className="w-4 h-4 text-green-600" /> Postulado
                    </span>
                  ) : (
                    <Button onClick={confirmApply} className="bg-red-800 hover:bg-red-900 text-white rounded-xl px-5 py-2 text-xs font-bold shadow-md flex items-center gap-1.5">
                      <Send className="w-3.5 h-3.5" /> Enviar Postulación
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* EVENT MODAL */}
      {selectedEventForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg transform bg-white rounded-2xl shadow-2xl overflow-hidden transition-all flex flex-col max-h-[90vh]">
            <div className="bg-gradient-to-r from-amber-50 to-white border-b border-amber-100 p-5 flex justify-between items-start gap-4">
              <div>
                <span className="text-[10px] font-black text-amber-800 bg-amber-100 px-2 py-1 rounded-full uppercase tracking-wider mb-2 inline-block">
                  {selectedEventForModal.type}
                </span>
                <h3 className="text-xl font-extrabold text-gray-900 leading-tight">
                  {selectedEventForModal.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedEventForModal(null)}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto custom-scrollbar space-y-4">
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                {selectedEventForModal.description}
              </p>
              
              <div className="bg-gray-50 border border-gray-150 rounded-xl p-4 space-y-3 mt-4">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <strong>Fecha:</strong> {new Date(selectedEventForModal.date).toLocaleDateString('es-PE')}
                </div>
                {selectedEventForModal.location && (
                  <div className="flex items-start gap-2 text-sm text-gray-700">
                    <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    <span><strong>Lugar:</strong> {selectedEventForModal.location}</span>
                  </div>
                )}
                {selectedEventForModal.link && (
                  <div className="flex items-center gap-2 text-sm text-blue-700 font-semibold pt-1">
                    <LinkIcon className="w-4 h-4" />
                    <a href={selectedEventForModal.link} target="_blank" rel="noreferrer" className="hover:underline">
                      Ver enlace del evento
                    </a>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-100 flex justify-end">
              <Button onClick={() => setSelectedEventForModal(null)} className="rounded-xl px-5 py-2 text-xs font-bold">
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* AI INTERVIEW MOCK MODAL */}
      {selectedJobForInterview && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-4xl transform bg-white rounded-3xl shadow-2xl overflow-hidden transition-all flex flex-col h-[90vh] max-h-[900px] border border-red-100">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-900 to-red-800 p-5 flex justify-between items-center text-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-xs border border-white/30">
                  <Bot className="w-5 h-5 text-red-50" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                    Simulador IA de Entrevista
                    <span className="bg-red-500 text-[9px] px-2 py-0.5 rounded-full uppercase tracking-widest font-bold">Beta</span>
                  </h3>
                  <p className="text-xs text-red-100 font-medium opacity-90 truncate max-w-[250px] sm:max-w-md">
                    Entrenando para: {selectedJobForInterview.title} en {selectedJobForInterview.company_name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedJobForInterview(null)}
                className="p-2 text-red-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {interviewStep === 0 ? (
              /* Loading / Preparation Step */
              <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50 space-y-6">
                <div className="relative">
                  <div className="absolute inset-0 border-4 border-red-200 rounded-full animate-ping opacity-50"></div>
                  <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center border-4 border-red-100 relative z-10 shadow-lg">
                    <Cpu className="w-10 h-10 text-red-800 animate-pulse" />
                  </div>
                </div>
                <div className="text-center space-y-3 max-w-xs">
                  <h4 className="text-lg font-black text-gray-800">Preparando tu simulacro...</h4>
                  <div className="space-y-2 pt-2">
                    <p className="text-xs text-gray-500 flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" /> Analizando tu Perfil
                    </p>
                    <p className="text-xs text-gray-500 flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" /> Procesando requerimientos
                    </p>
                    <p className="text-xs text-gray-500 flex items-center justify-center gap-2 opacity-70 animate-pulse">
                      <Loader className="w-4 h-4 text-red-800 animate-spin" /> Configurando Agente IA...
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* Chat Interface */
              <div className="flex-1 flex flex-col bg-slate-50 h-full overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                  <div className="text-center">
                    <span className="bg-white text-gray-400 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-gray-200">
                      Entrevista Iniciada
                    </span>
                  </div>
                  
                  {chatMessages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-4 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-md ${msg.sender === 'ai' ? 'bg-white border border-gray-200' : 'bg-red-800'}`}>
                        {msg.sender === 'ai' ? <Bot className="w-4 h-4 text-red-800" /> : <UserIcon className="w-4 h-4 text-white" />}
                      </div>
                      <div className={`p-4 rounded-2xl shadow-sm ${
                        msg.sender === 'ai' 
                          ? 'bg-white border border-gray-200 rounded-tl-sm text-gray-800' 
                          : 'bg-red-800 border border-red-700 rounded-tr-sm text-white'
                      }`}>
                        <p className="text-sm leading-relaxed font-medium whitespace-pre-wrap">
                          {msg.text}
                        </p>
                      </div>
                    </div>
                  ))}

                  {isAiTyping && (
                    <div className="flex gap-4 max-w-[85%]">
                      <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 shadow-md">
                        <Bot className="w-4 h-4 text-red-800 animate-pulse" />
                      </div>
                      <div className="bg-white border border-gray-200 p-4 rounded-2xl rounded-tl-sm shadow-sm flex gap-1.5 items-center">
                        <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                        <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                        <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
                
                {/* Input Area */}
                <div className="p-4 bg-white border-t border-gray-200 shrink-0">
                  <div className="flex items-end gap-3 max-w-4xl mx-auto relative">
                    <button className="p-3.5 bg-gray-100 text-gray-500 hover:bg-gray-200 rounded-full transition-colors shrink-0 shadow-sm border border-gray-200">
                      <Mic className="w-5 h-5" />
                    </button>
                    <div className="flex-1 relative">
                      <textarea
                        rows={2}
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            if (chatInput.trim() && !isAiTyping) {
                              const newMsgs = [...chatMessages, { sender: 'user' as const, text: chatInput.trim() }];
                              setChatMessages(newMsgs);
                              setChatInput('');
                              setIsAiTyping(true);
                              
                              // Fake AI Response logic
                              setTimeout(() => {
                                setIsAiTyping(false);
                                let aiReply = '';
                                if (newMsgs.length === 2) {
                                  aiReply = `¡Muy interesante! Hablando de los requisitos técnicos, veo que la empresa pide bastante proactividad e iniciativa. ¿Puedes describirme un proyecto o situación pasada donde hayas tenido que tomar la iniciativa para resolver un problema complejo?`;
                                } else if (newMsgs.length === 4) {
                                  aiReply = `Perfecto. Eso demuestra tu capacidad de resolución. Ahora un poco de habilidades blandas: ¿Cómo manejas las situaciones bajo mucha presión o cuando los plazos de entrega son muy ajustados?`;
                                } else if (newMsgs.length === 6) {
                                  aiReply = `Excelente respuesta. Por último, ¿por qué te gustaría trabajar en ${selectedJobForInterview.company_name} y qué valor distintivo sientes que agregarías al equipo desde el primer día?`;
                                } else {
                                  aiReply = `¡Excelente, ${profileForm.name.split(' ')[0]}! Has completado esta simulación de entrevista con éxito.\n\nRecuerda: en una entrevista real, tu capacidad para estructurar respuestas concretas usando el método STAR (Situación, Tarea, Acción, Resultado) es vital. ¡Sigue practicando y mucho éxito en tus postulaciones reales!`;
                                }
                                setChatMessages([...newMsgs, { sender: 'ai', text: aiReply }]);
                              }, 2000);
                            }
                          }
                        }}
                        placeholder="Escribe tu respuesta y presiona Enter..."
                        className="w-full bg-slate-50 border border-gray-200 text-gray-900 rounded-2xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-red-800 focus:border-transparent resize-none custom-scrollbar"
                      />
                      <button className="absolute right-2 bottom-2 p-2 bg-red-800 text-white rounded-xl hover:bg-red-900 transition-colors shadow-md" onClick={() => {
                          if (chatInput.trim() && !isAiTyping) {
                            const newMsgs = [...chatMessages, { sender: 'user' as const, text: chatInput.trim() }];
                            setChatMessages(newMsgs);
                            setChatInput('');
                            setIsAiTyping(true);
                            setTimeout(() => {
                              setIsAiTyping(false);
                              let aiReply = '';
                              if (newMsgs.length === 2) {
                                aiReply = `¡Muy interesante! Hablando de los requisitos técnicos, veo que la empresa pide bastante proactividad e iniciativa. ¿Puedes describirme un proyecto o situación pasada donde hayas tenido que tomar la iniciativa para resolver un problema complejo?`;
                              } else if (newMsgs.length === 4) {
                                aiReply = `Perfecto. Eso demuestra tu capacidad de resolución. Ahora un poco de habilidades blandas: ¿Cómo manejas las situaciones bajo mucha presión o cuando los plazos de entrega son muy ajustados?`;
                              } else if (newMsgs.length === 6) {
                                aiReply = `Excelente respuesta. Por último, ¿por qué te gustaría trabajar en ${selectedJobForInterview.company_name} y qué valor distintivo sientes que agregarías al equipo desde el primer día?`;
                              } else {
                                aiReply = `¡Excelente, ${profileForm.name.split(' ')[0]}! Has completado esta simulación de entrevista con éxito.\n\nRecuerda: en una entrevista real, tu capacidad para estructurar respuestas concretas usando el método STAR (Situación, Tarea, Acción, Resultado) es vital. ¡Sigue practicando y mucho éxito en tus postulaciones reales!`;
                              }
                              setChatMessages([...newMsgs, { sender: 'ai', text: aiReply }]);
                            }, 2000);
                          }
                      }}>
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-center text-[10px] text-gray-400 mt-3 font-medium">
                    Simulador en fase Beta. Las respuestas son autogeneradas para demostración de capacidades.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
