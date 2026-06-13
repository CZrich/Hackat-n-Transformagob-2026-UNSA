import { useState, useEffect } from 'react';
import {
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  DollarSign,
} from 'lucide-react';
import { jobFormSchema, type JobFormData } from '../schemas';
import { CARRERAS } from '../config';
import { useJobs } from '../hooks/useJobs';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import type { User, Job } from '../types';

interface DashboardEmpleadorProps {
  user: User;
}

function statusBadge(status: Job['status']) {
  const styles: Record<string, string> = {
    PENDING: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    APPROVED: 'bg-green-50 text-green-700 border-green-200',
    REJECTED: 'bg-red-50 text-red-700 border-red-200',
    SPAM: 'bg-gray-50 text-gray-700 border-gray-200',
  };
  const labels: Record<string, string> = {
    PENDING: 'Pendiente',
    APPROVED: 'Aprobado',
    REJECTED: 'Rechazado',
    SPAM: 'Spam',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || styles.PENDING}`}>
      {labels[status] || status}
    </span>
  );
}

export default function DashboardEmpleador({ user }: DashboardEmpleadorProps) {
  const { jobs, loading, error, fetchMyHistory, createJob } = useJobs();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<JobFormData>({
    ruc: '',
    title: '',
    description: '',
    carrera_destino: '' as JobFormData['carrera_destino'],
    salario_min: 0,
    salario_max: 0,
    requisitos: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchMyHistory();
  }, [fetchMyHistory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    const result = jobFormSchema.safeParse(formData);
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
      });
      setShowForm(false);
      setFormData({
        ruc: '',
        title: '',
        description: '',
        carrera_destino: '' as JobFormData['carrera_destino'],
        salario_min: 0,
        salario_max: 0,
        requisitos: '',
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
      [name]: name === 'salario_min' || name === 'salario_max' ? Number(value) : value,
    }));
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Panel Empleador</h1>
          <p className="text-sm text-gray-500 mt-1">Gestiona tus ofertas laborales</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4" />
          {showForm ? 'Cancelar' : 'Nueva oferta'}
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {showForm && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Publicar nueva oferta</h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="RUC de la empresa"
                  name="ruc"
                  maxLength={11}
                  placeholder="12345678901"
                  value={formData.ruc}
                  onChange={handleChange}
                  error={formErrors.ruc}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Carrera destino
                  </label>
                  <select
                    name="carrera_destino"
                    value={formData.carrera_destino}
                    onChange={handleChange}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-unsa-500 focus:border-unsa-500"
                  >
                    <option value="">Seleccione una carrera</option>
                    {CARRERAS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  {formErrors.carrera_destino && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.carrera_destino}</p>
                  )}
                </div>
              </div>

              <Input
                label="Título del puesto"
                name="title"
                placeholder="Ej: Desarrollador Full Stack"
                value={formData.title}
                onChange={handleChange}
                error={formErrors.title}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción (opcional)
                </label>
                <textarea
                  name="description"
                  rows={3}
                  value={formData.description || ''}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-unsa-500 focus:border-unsa-500"
                  placeholder="Describe la oferta..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Salario mínimo (S/)"
                  name="salario_min"
                  type="number"
                  min={0}
                  placeholder="1500"
                  value={formData.salario_min || ''}
                  onChange={handleChange}
                  error={formErrors.salario_min}
                />
                <Input
                  label="Salario máximo (S/)"
                  name="salario_max"
                  type="number"
                  min={0}
                  placeholder="3000"
                  value={formData.salario_max || ''}
                  onChange={handleChange}
                  error={formErrors.salario_max}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Requisitos
                </label>
                <textarea
                  name="requisitos"
                  rows={3}
                  value={formData.requisitos}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-unsa-500 focus:border-unsa-500"
                  placeholder="Ej: Experiencia en React, 2 años en Node.js..."
                />
                {formErrors.requisitos && (
                  <p className="mt-1 text-xs text-red-600">{formErrors.requisitos}</p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="secondary" type="button" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
                <Button type="submit" loading={submitting}>
                  Publicar oferta
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-gray-800">Historial de ofertas</h2>
        <p className="text-sm text-gray-500 mb-3">
          {jobs.length} oferta{jobs.length !== 1 ? 's' : ''} publicada{jobs.length !== 1 ? 's' : ''}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-unsa-600 border-t-transparent rounded-full" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Plus className="w-10 h-10 mx-auto mb-2" />
          <p className="font-medium">Aún no has publicado ofertas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <Card key={job.id}>
              <CardContent>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{job.title}</h3>
                      {statusBadge(job.status)}
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        S/ {job.salario_min.toLocaleString()} - S/{' '}
                        {job.salario_max.toLocaleString()}
                      </span>
                      <span>{job.carrera_destino}</span>
                      <span>{new Date(job.creado_en).toLocaleDateString('es-PE')}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
