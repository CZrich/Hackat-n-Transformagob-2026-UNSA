import { useState, useEffect } from 'react';
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
  User as UserIcon
} from 'lucide-react';

import { useJobs } from '../hooks/useJobs';
import { api } from '../services/api';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { CARRERAS } from '../config';
import type { User as UserType, Job } from '../types';

interface DashboardEgresadoProps {
  user: UserType;
}

export default function DashboardEgresado({ user }: DashboardEgresadoProps) {
  const { matchedQuery, applyJob } = useJobs();
  const { data: jobs = [], isLoading: loading, error } = matchedQuery;
  
  // Dashboard Tabs
  const [activeTab, setActiveTab] = useState<'FEED' | 'PROFILE'>('FEED');

  // Student Profile fields
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    carrera: user?.carrera || '',
    telefono: user?.telefono ? user.telefono.replace(/^\+51/, '') : '',
    skills: user?.skills || [],
    cv_name: user?.cv_name || '',
    cv_url: user?.cv_url || '',
    bio: user?.bio || ''
  });
  
  const [newSkill, setNewSkill] = useState('');

  // Modal detailed job view
  const [selectedJobForModal, setSelectedJobForModal] = useState<Job | null>(null);

  // Local application records
  const [appliedJobs, setAppliedJobs] = useState<string[]>([]);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Sync state and fetch jobs when user context changes (e.g. simulation swap)
  useEffect(() => {
    setProfileForm({
      name: user.name,
      email: user.email,
      carrera: user.carrera || '',
      telefono: user.telefono ? user.telefono.replace(/^\+51/, '') : '',
      skills: user.skills || [],
      cv_name: user.cv_name || '',
      cv_url: user.cv_url || '',
      bio: user.bio || ''
    });
  }, [user]);

  // Sync applied jobs separately if jobs loads after user
  useEffect(() => {
    if (user.id && jobs.length > 0) {
      const alreadyApplied = jobs.filter(j => 
        j.postulantes?.includes(user.id) || 
        j.applications?.some(app => app.userId === user.id)
      ).map(j => j.id);
      setAppliedJobs(alreadyApplied);
    }
  }, [jobs, user.id]);

  // Handle adding a skill tag
  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    const tag = newSkill.trim();
    if (tag && !profileForm.skills.includes(tag)) {
      setProfileForm(prev => ({
        ...prev,
        skills: [...prev.skills, tag]
      }));
      setNewSkill('');
    }
  };

  // Handle removing a skill tag
  const handleRemoveSkill = (skillToRemove: string) => {
    setProfileForm(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skillToRemove)
    }));
  };

  // Handle CV file select and upload
  const handleCvChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      try {
        showFeedback('Subiendo CV...');
        const updatedUserBackend = await api.auth.uploadCv(file);
        
        const updatedUser = { 
          ...user, 
          ...updatedUserBackend
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        setProfileForm(prev => ({
          ...prev,
          cv_name: file.name,
          cv_url: updatedUserBackend.cv_url || '#'
        }));
        
        showFeedback('¡CV subido con éxito!');
        setTimeout(() => {
          window.location.reload();
        }, 1000);
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

    try {
      const updateData = {
        carrera: profileForm.carrera,
        telefono: profileForm.telefono.trim(),
        skills: profileForm.skills,
        bio: profileForm.bio.trim()
      };
      
      const updatedUserBackend = await api.auth.updateProfile(updateData);
      
      const updatedUser = { 
        ...user, 
        ...updatedUserBackend
      };
      
      localStorage.setItem('user', JSON.stringify(updatedUser));
      showFeedback('¡Perfil guardado y sincronizado con éxito!');
      
      // Force match refresh by reloading to update global user state
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      showFeedback(error.message || 'Error al guardar el perfil');
    }
  };

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // Calculate Match Percentage
  const calculateMatch = (job: Job) => {
    const jobTags = job.competencias || [];
    if (jobTags.length === 0) return 70; // default matches career

    const matchingTags = jobTags.filter(tag => 
      profileForm.skills.some(skill => skill.toLowerCase() === tag.toLowerCase())
    );
    return Math.round((matchingTags.length / jobTags.length) * 100);
  };

  const handleApplyClick = (job: Job) => {
    setSelectedJobForModal(job);
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

  const handleRateCompany = (companyId: string, rating: number) => {
    try {
      // rateCompanyLocal(companyId, rating);
      showFeedback(`Has calificado a la empresa con ${rating}★`);
      if (selectedJobForModal && selectedJobForModal.company_id === companyId) {
        // Update modal rating state
        setSelectedJobForModal(prev => prev ? { ...prev, rating_empresa: rating } : null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 font-sans max-w-6xl mx-auto">
      {/* 1. Header Section */}
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

        {/* Sync Indicator Stats */}
        <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
          <div className="text-center md:text-left">
            <span className="text-2xl font-black text-gray-900">{jobs.length}</span>
            <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-wider">Ofertas Aprobadas</span>
          </div>
          <div className="text-center md:text-left">
            <span className="text-2xl font-black text-green-700">{appliedJobs.length}</span>
            <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-wider">Mis Postulaciones</span>
          </div>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm font-semibold flex items-center gap-2 animate-fadeIn shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-red-700 flex-shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Tabs Switcher */}
      <div className="border-b border-gray-250 flex gap-4">
        <button
          onClick={() => setActiveTab('FEED')}
          className={`pb-3 text-sm font-extrabold border-b-2 transition-all ${
            activeTab === 'FEED'
              ? 'border-red-700 text-red-800'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Convocatorias Recomendadas
        </button>
        <button
          onClick={() => setActiveTab('PROFILE')}
          className={`pb-3 text-sm font-extrabold border-b-2 transition-all ${
            activeTab === 'PROFILE'
              ? 'border-red-700 text-red-800'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Mi Perfil Profesional & CV
        </button>
      </div>

      {/* TAB CONTENT: FEED */}
      {activeTab === 'FEED' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Active profile preview summary */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border border-gray-200 shadow-xs bg-gray-50/25">
              <CardHeader className="border-b border-gray-150 py-3.5 px-5 bg-white">
                <h3 className="font-extrabold text-sm text-gray-900 flex items-center gap-1.5">
                  <UserIcon className="w-4 h-4 text-red-850" /> Mi Resumen Profesional
                </h3>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black text-gray-400 block uppercase tracking-wider">Habilidades registradas:</span>
                  <div className="flex flex-wrap gap-1">
                    {profileForm.skills.map(s => (
                      <span key={s} className="bg-white border border-gray-200 text-gray-800 text-[10px] font-bold px-2 py-0.5 rounded-lg shadow-3xs">
                        {s}
                      </span>
                    ))}
                    {profileForm.skills.length === 0 && <span className="text-xs text-gray-400">Sin habilidades</span>}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-black text-gray-400 block uppercase tracking-wider">Curriculum Vitae:</span>
                  <div className="flex items-center gap-2 p-2 bg-white rounded-xl border border-gray-150 text-xs text-gray-700 font-semibold shadow-3xs">
                    <FileText className="w-4 h-4 text-red-700 flex-shrink-0" />
                    <span className="truncate flex-1">{profileForm.cv_name || 'Ningún archivo de CV subido'}</span>
                  </div>
                </div>

                <div className="text-[10px] text-gray-400 border-t border-gray-150 pt-3 flex items-start gap-1 leading-normal">
                  <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <span>El feed de convocatorias se actualiza dinámicamente cuando agregas habilidades o cambias tu CV.</span>
                </div>
              </CardContent>
            </Card>

            {/* Applications List */}
            {appliedJobs.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-gray-500" /> Postulaciones Recientes
                </h3>
                <div className="space-y-2">
                  {jobs.filter(j => appliedJobs.includes(j.id)).map(job => (
                    <div key={job.id} className="p-3.5 bg-white border border-gray-250 rounded-xl flex items-center justify-between gap-4 shadow-3xs hover:border-gray-300 transition-colors">
                      <div className="truncate">
                        <h4 className="text-xs font-extrabold text-gray-950 truncate">{job.title}</h4>
                        <p className="text-[10px] text-gray-450 font-semibold truncate">{job.company_name}</p>
                      </div>
                      <span className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[9px] font-bold border border-amber-200/50">
                        <Clock className="w-3 h-3" /> En Proceso
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Matched Jobs Feed */}
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
                  No se registran ofertas vigentes aprobadas para la carrera de <strong className="text-gray-600 font-bold">{profileForm.carrera || user.carrera}</strong>.
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

                  const companyRating = job.rating_empresa || 5.0;

                  return (
                    <Card key={job.id} className="hover:shadow-md transition-shadow border border-gray-200 bg-white">
                      <CardContent className="p-5 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="space-y-1">
                            <h3 className="text-lg font-extrabold text-gray-900 tracking-tight">{job.title}</h3>
                            
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500 font-semibold">
                              <span className="flex items-center gap-1">
                                <Building className="w-3.5 h-3.5 text-gray-400" />
                                {job.company_name}
                              </span>
                              <span>|</span>
                              <div className="flex items-center gap-0.5 text-amber-600">
                                <Star className="w-3.5 h-3.5 fill-current text-amber-500" />
                                <span>{companyRating} / 5.0</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Match Tag */}
                          <div className={`px-2.5 py-1 rounded-full text-xs font-bold border ${matchBadgeStyle} self-start flex items-center gap-1 shadow-2xs`}>
                            <Sparkles className="w-3 h-3" />
                            <span>Match del {matchScore}%</span>
                          </div>
                        </div>

                        {/* Meta lines */}
                        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-gray-400 font-medium">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-gray-300" /> {job.lugar || 'Arequipa'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-gray-300" /> Cierre: {job.fecha_cierre ? new Date(job.fecha_cierre + 'T23:59:59').toLocaleDateString('es-PE') : 'No registrado'}
                          </span>
                          {job.vacantes && (
                            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md text-[10px] font-bold border border-gray-200">
                              {job.vacantes} vacante{job.vacantes !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>

                        {/* Competencies requirements */}
                        {job.competencias && job.competencias.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
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
                                      : 'bg-gray-50 border-gray-200 text-gray-400'
                                  }`}
                                >
                                  {matchesStudent ? <Check className="w-2.5 h-2.5" /> : null}
                                  {tag}
                                </span>
                              );
                            })}
                          </div>
                        )}

                        {/* Requisitos Preview */}
                        <p className="text-xs text-gray-600 bg-gray-55 p-3 rounded-xl border border-gray-150 leading-relaxed line-clamp-2">
                          <strong className="text-[10px] text-gray-700 block mb-0.5">Requisitos del perfil:</strong>
                          {job.requisitos}
                        </p>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-gray-100">
                          {/* Salary */}
                          <div className="bg-green-55 border border-green-200/60 rounded-xl px-4 py-1.5 flex items-center gap-1.5">
                            <DollarSign className="w-4 h-4 text-green-700" />
                            <div>
                              <span className="text-[9px] text-green-600 font-bold block uppercase tracking-wider leading-none">Salario Vinculante</span>
                              <span className="text-sm font-extrabold text-green-800 leading-none">
                                S/ {job.salario_min.toLocaleString('es-PE')} - S/ {job.salario_max.toLocaleString('es-PE')}
                              </span>
                            </div>
                          </div>

                          <Button
                            onClick={() => handleApplyClick(job)}
                            className="bg-red-800 hover:bg-red-950 text-white rounded-xl px-5 py-2 font-bold text-xs shadow-sm flex items-center gap-1.5"
                          >
                            <Send className="w-3.5 h-3.5" />
                            Ver Detalles & Postular
                          </Button>
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

      {/* TAB CONTENT: PROFILE EDITOR */}
      {activeTab === 'PROFILE' && (
        <Card className="border border-gray-200 shadow-md animate-fadeIn">
          <CardHeader className="bg-gradient-to-r from-red-50 to-white border-b border-gray-100 py-4 px-6">
            <h2 className="text-lg font-bold text-gray-900">Configuración de Perfil Académico y CV</h2>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    value={profileForm.name}
                    disabled
                    className="block w-full rounded-xl border border-gray-200 bg-gray-50 text-gray-500 px-3 py-2 text-xs shadow-sm h-10 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Correo Institucional (Fijo)</label>
                  <input
                    type="text"
                    value={profileForm.email}
                    disabled
                    className="block w-full rounded-xl border border-gray-200 bg-gray-50 text-gray-500 px-3 py-2 text-xs shadow-sm h-10 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Escuela Profesional (Carrera)</label>
                  <select
                    name="carrera"
                    value={profileForm.carrera}
                    onChange={e => setProfileForm(prev => ({ ...prev, carrera: e.target.value }))}
                    className="block w-full rounded-xl border border-gray-300 px-3 py-2 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors bg-white h-10 font-medium"
                  >
                    <option value="">Selecciona tu carrera profesional</option>
                    {CARRERAS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <Input
                  label="Celular de Contacto"
                  name="telefono"
                  placeholder="Ej: 999888777"
                  maxLength={9}
                  value={profileForm.telefono}
                  onChange={e => setProfileForm(prev => ({ ...prev, telefono: e.target.value }))}
                  className="bg-white rounded-xl"
                />
              </div>

              {/* Bio / Sobre mi Section */}
              <div className="space-y-2 border-t border-gray-150 pt-5">
                <label className="block text-sm font-semibold text-gray-750">
                  Resumen Profesional (Sobre Mí)
                </label>
                <textarea
                  name="bio"
                  rows={4}
                  placeholder="Escribe un breve resumen de tu perfil profesional, objetivos y experiencia (Al estilo Computrabajo/LinkedIn)..."
                  value={profileForm.bio}
                  onChange={e => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                  className="block w-full rounded-xl border border-gray-300 px-3 py-2.5 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors bg-white resize-y"
                />
              </div>

              {/* CV Uploader Section */}
              <div className="space-y-2 border-t border-gray-150 pt-5">
                <label className="block text-sm font-semibold text-gray-750">
                  Currículum Vitae (CV en formato PDF)
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 border border-dashed border-gray-300 rounded-xl bg-gray-50/50">
                  <div className="p-3 bg-red-50 rounded-xl text-red-800">
                    <FileText className="w-8 h-8" />
                  </div>
                  
                  <div className="flex-1 text-center sm:text-left space-y-0.5">
                    {profileForm.cv_name ? (
                      <>
                        <p className="text-xs font-bold text-gray-900 truncate">{profileForm.cv_name}</p>
                        <p className="text-[10px] text-green-700 font-semibold">✓ Currículum activo y visible para empleadores.</p>
                      </>
                    ) : (
                      <>
                        <p className="text-xs font-bold text-gray-700">No has subido ningún documento</p>
                        <p className="text-[10px] text-gray-400">Sube un archivo PDF para habilitar la postulación rápida.</p>
                      </>
                    )}
                  </div>

                  <div className="relative">
                    <input
                      type="file"
                      id="cv-upload-input"
                      accept=".pdf"
                      onChange={handleCvChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 font-bold border border-gray-250 rounded-xl text-xs shadow-xs"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      {profileForm.cv_name ? 'Reemplazar' : 'Subir PDF'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Skills Tag Management */}
              <div className="space-y-3 border-t border-gray-150 pt-5">
                <label className="block text-sm font-semibold text-gray-750">
                  Competencias Técnicas / Habilidades
                </label>
                
                <div className="flex flex-wrap gap-1.5 p-3.5 border border-gray-300 rounded-xl bg-white min-h-16 items-center">
                  {profileForm.skills.map(skill => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1.5 bg-red-50 border border-red-100 text-red-800 text-xs font-semibold px-2.5 py-1 rounded-lg"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="text-red-600 hover:text-red-800 font-bold focus:outline-none"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                  {profileForm.skills.length === 0 && (
                    <p className="text-xs text-gray-400 italic">No has agregado tags profesionales. Escríbelos abajo para habilitarlos.</p>
                  )}
                </div>

                <div className="flex gap-2 max-w-md">
                  <input
                    type="text"
                    placeholder="Escribe habilidad (Ej: NestJS, Python) y pulsa agregar..."
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    className="flex-1 rounded-xl border border-gray-300 px-3 py-1.5 text-xs shadow-sm focus:outline-none h-9 bg-white"
                  />
                  <Button
                    type="button"
                    onClick={handleAddSkill}
                    className="bg-red-800 hover:bg-red-900 text-white rounded-xl text-xs py-1.5 px-4 h-9"
                  >
                    <Plus className="w-3.5 h-3.5 mr-0.5" /> Agregar
                  </Button>
                </div>
              </div>

              <div className="flex justify-end pt-5 border-t border-gray-150">
                <Button
                  type="submit"
                  className="bg-red-800 hover:bg-red-950 text-white rounded-xl font-bold px-6 py-2.5 text-xs shadow-md"
                >
                  Guardar Perfil Académico
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* DETAILED JOB DESCRIPTION & EVALUATION MODAL */}
      {selectedJobForModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn overflow-y-auto">
          <Card className="w-full max-w-2xl shadow-2xl border border-red-100 overflow-hidden bg-white rounded-2xl my-8">
            <CardHeader className="bg-gradient-to-r from-red-50 to-white border-b border-red-100 py-4 px-6 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-red-800" />
                <h3 className="text-lg font-extrabold text-gray-900 truncate">Detalles de Convocatoria</h3>
              </div>
              <button 
                onClick={() => setSelectedJobForModal(null)}
                className="text-gray-400 hover:text-gray-650 p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              
              {/* Job Main Header */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-black text-gray-950 tracking-tight">{selectedJobForModal.title}</h2>
                    <p className="text-xs text-gray-500 font-bold flex items-center gap-1.5 mt-0.5">
                      <Building className="w-4 h-4 text-gray-450" /> {selectedJobForModal.company_name}
                    </p>
                  </div>
                  
                  {/* Match percentage pill */}
                  <div className="px-3 py-1 rounded-full text-xs font-black bg-red-50 border border-red-100 text-red-800 flex items-center gap-1 shadow-3xs">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-bounce" />
                    <span>Match del {calculateMatch(selectedJobForModal)}%</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs text-gray-600 font-semibold border-y border-gray-100 py-3">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-gray-400" /> {selectedJobForModal.lugar || 'Lugar no especificado'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-gray-400" /> Cierre: {selectedJobForModal.fecha_cierre ? new Date(selectedJobForModal.fecha_cierre + 'T23:59:59').toLocaleDateString('es-PE') : 'No registrado'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-gray-400" /> {selectedJobForModal.horario || 'No registrado'}
                  </span>
                </div>
              </div>

              {/* COMPANY RATING BLOCK */}
              <div className="p-4 bg-amber-50/40 border border-amber-250/60 rounded-xl space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-500 fill-current" />
                    <div>
                      <p className="text-xs font-black text-gray-900 uppercase tracking-wide leading-none">Evaluación del Empleador</p>
                      <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Calificación promedio otorgada por egresados de la UNSA.</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <strong className="text-lg font-black text-amber-700">{selectedJobForModal.rating_empresa || 5.0} / 5.0</strong>
                  </div>
                </div>

                {/* Rating warning if low */}
                {(selectedJobForModal.rating_empresa || 5.0) < 3.0 ? (
                  <div className="p-2 bg-red-50 border border-red-150 text-[10px] text-red-800 rounded-lg flex items-start gap-1.5 leading-normal">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-650" />
                    <span>**Atención:** Este empleador tiene una calificación menor a 3★. ODEEG recomienda revisar detenidamente los términos y condiciones antes de enviar su postulación.</span>
                  </div>
                ) : (
                  <p className="text-[10px] text-gray-400 italic font-medium leading-normal">
                    * Tu retroalimentación ayuda a ODEEG a mantener el directorio de empresas libre de opacidad o malas prácticas.
                  </p>
                )}

                {/* Star rating picker for demo purposes */}
                <div className="flex items-center gap-2 pt-1 border-t border-gray-200/50">
                  <span className="text-[10px] text-gray-500 font-semibold">¿Has trabajado aquí? Califícala:</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => handleRateCompany(selectedJobForModal.company_id, num)}
                        className="text-gray-350 hover:text-amber-500 transition-colors"
                      >
                        <Star className="w-4 h-4 fill-current hover:scale-110" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Detailed Descriptions (Requisitos, Funciones, Adicionales) */}
              <div className="space-y-4 max-h-60 overflow-y-auto pr-1">
                {selectedJobForModal.requisitos && (
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider">Requisitos de Convocatoria</h4>
                    <p className="text-xs text-gray-650 bg-gray-50 p-3 rounded-xl border border-gray-150 leading-relaxed whitespace-pre-line">
                      {selectedJobForModal.requisitos}
                    </p>
                  </div>
                )}

                {selectedJobForModal.funciones && (
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider">Funciones y Responsabilidades</h4>
                    <p className="text-xs text-gray-650 bg-gray-50 p-3 rounded-xl border border-gray-150 leading-relaxed whitespace-pre-line">
                      {selectedJobForModal.funciones}
                    </p>
                  </div>
                )}

                {selectedJobForModal.informacion_adicional && (
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider">Beneficios e Información Adicional</h4>
                    <p className="text-xs text-gray-655 bg-gray-50 p-3 rounded-xl border border-gray-150 leading-relaxed">
                      {selectedJobForModal.informacion_adicional}
                    </p>
                  </div>
                )}
              </div>

              {/* Salary and Action footer */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-gray-100">
                <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2 flex items-center gap-1.5 self-start sm:self-auto">
                  <DollarSign className="w-4 h-4 text-green-700" />
                  <div>
                    <span className="text-[9px] text-green-600 font-bold block uppercase tracking-wider leading-none">Salario Vinculante</span>
                    <span className="text-base font-extrabold text-green-800 leading-none">
                      S/ {selectedJobForModal.salario_min.toLocaleString('es-PE')} - S/ {selectedJobForModal.salario_max.toLocaleString('es-PE')}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 self-stretch sm:self-auto">
                  <Button 
                    variant="secondary" 
                    onClick={() => setSelectedJobForModal(null)} 
                    className="rounded-xl px-4 py-2 text-xs"
                  >
                    Cerrar
                  </Button>
                  
                  {appliedJobs.includes(selectedJobForModal.id) ? (
                    <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-105 text-gray-500 border border-gray-200 rounded-xl text-xs font-bold shadow-3xs">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      Postulado
                    </span>
                  ) : (
                    <Button 
                      onClick={confirmApply} 
                      className="bg-red-800 hover:bg-red-900 text-white rounded-xl px-5 py-2 text-xs font-bold shadow-md flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Enviar Mi Postulación
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
