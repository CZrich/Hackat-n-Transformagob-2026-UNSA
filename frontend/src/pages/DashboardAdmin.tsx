import { useState, useEffect } from 'react';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Briefcase,
  FileText,
  Ban,
  DollarSign,
  UserCheck,
  Send,
  Upload,
} from 'lucide-react';
import { useJobs } from '../hooks/useJobs';
import { jobFormSchema } from '../schemas';
import { CARRERAS } from '../config';
import Button from '../components/ui/Button';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import type { Job } from '../types';

export default function DashboardAdmin() {
  const { jobs, loading, error, fetchPending, updateStatus, createJob } = useJobs();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [quickText, setQuickText] = useState('');
  const [parsedPreview, setParsedPreview] = useState<Record<string, string> | null>(null);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const handleStatusChange = async (id: string, status: string) => {
    setProcessingId(id);
    try {
      await updateStatus(id, status);
    } catch {
      // handled by hook
    } finally {
      setProcessingId(null);
    }
  };

  const handleQuickParse = () => {
    const lines = quickText.split('\n').filter(Boolean);
    const preview: Record<string, string> = {};

    lines.forEach((line) => {
      const lower = line.toLowerCase();
      if (lower.includes('puesto') || lower.includes('cargo') || lower.includes('título')) {
        preview.title = line.split(':')[1]?.trim() || line;
      } else if (lower.includes('empresa') || lower.includes('compañía') || lower.includes('razón social')) {
        preview.company = line.split(':')[1]?.trim() || line;
      } else if (lower.includes('carrera') || lower.includes('destino') || lower.includes('especialidad')) {
        preview.carrera_destino = line.split(':')[1]?.trim() || line;
      } else if (lower.includes('salario') || lower.includes('sueldo') || lower.includes('remuneración')) {
        preview.salario = line.split(':')[1]?.trim() || line;
      } else if (lower.includes('requisito') || lower.includes('perfil')) {
        preview.requisitos = line.split(':')[1]?.trim() || line;
      } else if (lower.includes('ruc')) {
        preview.ruc = line.split(':')[1]?.trim() || line;
      } else if (lower.includes('descripción') || lower.includes('funciones')) {
        preview.description = line.split(':')[1]?.trim() || line;
      }
    });

    setParsedPreview(Object.keys(preview).length > 0 ? preview : null);
  };

  const handlePublishParsed = async () => {
    if (!parsedPreview) return;
    setPublishing(true);
    try {
      const parsed = {
        ruc: parsedPreview.ruc || '12345678901',
        title: parsedPreview.title || 'Oferta desde carga rápida',
        description: parsedPreview.description || '',
        carrera_destino: parsedPreview.carrera_destino || CARRERAS[0],
        salario_min: parseInt(parsedPreview.salario?.split('-')[0]?.replace(/\D/g, '') || '1000'),
        salario_max: parseInt(parsedPreview.salario?.split('-')[1]?.replace(/\D/g, '') || '2000') || 2000,
        requisitos: parsedPreview.requisitos || 'Revisar perfil en el correo original',
      };
      await createJob(parsed);
      setQuickText('');
      setParsedPreview(null);
    } catch {
      // handled by hook
    } finally {
      setPublishing(false);
    }
  };

  const metrics = {
    pendientes: jobs.filter((j) => j.status === 'PENDING').length,
    aprobados: jobs.filter((j) => j.status === 'APPROVED').length,
    rechazados: jobs.filter((j) => j.status === 'REJECTED').length,
    spam: jobs.filter((j) => j.status === 'SPAM').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Panel Administrativo UDEG</h1>
        <p className="text-sm text-gray-500 mt-1">Moderación y gestión de ofertas laborales</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-50">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{metrics.pendientes}</p>
              <p className="text-xs text-gray-500">Pendientes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-50">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{metrics.aprobados}</p>
              <p className="text-xs text-gray-500">Aprobados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-50">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{metrics.rechazados}</p>
              <p className="text-xs text-gray-500">Rechazados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gray-50">
              <Ban className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{metrics.spam}</p>
              <p className="text-xs text-gray-500">Spam</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-unsa-600" />
            <h2 className="text-lg font-semibold">Carga rápida</h2>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pegar texto del correo recibido
            </label>
            <textarea
              rows={5}
              value={quickText}
              onChange={(e) => { setQuickText(e.target.value); setParsedPreview(null); }}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-unsa-500 focus:border-unsa-500"
              placeholder="Pega aquí el contenido del correo con la oferta laboral..."
            />
          </div>

          {quickText && (
            <div className="flex gap-2">
              <Button onClick={handleQuickParse} variant="secondary">
                <FileText className="w-4 h-4" />
                Analizar y prellenar
              </Button>
              {parsedPreview && (
                <Button onClick={handlePublishParsed} loading={publishing}>
                  <Send className="w-4 h-4" />
                  Publicar oferta
                </Button>
              )}
            </div>
          )}

          {parsedPreview && (
            <div className="p-4 bg-unsa-50 rounded-lg border border-unsa-200 space-y-2">
              <p className="text-xs font-semibold text-unsa-700 uppercase tracking-wider">
                Vista previa del parseo
              </p>
              {Object.entries(parsedPreview).map(([key, value]) => (
                <div key={key} className="text-sm">
                  <span className="font-medium text-gray-700 capitalize">{key}: </span>
                  <span className="text-gray-600">{value}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-unsa-600" />
            <h2 className="text-lg font-semibold">Bandeja de moderación</h2>
            <span className="ml-auto text-sm text-gray-400">
              {jobs.length} oferta{jobs.length !== 1 ? 's' : ''}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-unsa-600 border-t-transparent rounded-full" />
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <UserCheck className="w-10 h-10 mx-auto mb-2" />
              <p className="font-medium">No hay ofertas pendientes</p>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <Card key={job.id} className="border-l-4 border-l-unsa-400">
                  <CardContent>
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{job.title}</h3>
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
                            {job.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                          <span>{job.company_name || 'Sin empresa'}</span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            S/ {job.salario_min.toLocaleString()} - S/{' '}
                            {job.salario_max.toLocaleString()}
                          </span>
                          <span>{job.carrera_destino}</span>
                          <span>{new Date(job.creado_en).toLocaleDateString('es-PE')}</span>
                        </div>
                        <p className="text-sm text-gray-600">{job.requisitos}</p>
                      </div>

                      {job.status === 'PENDING' && (
                        <div className="flex sm:flex-col gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleStatusChange(job.id, 'APPROVED')}
                            loading={processingId === job.id}
                          >
                            <CheckCircle className="w-4 h-4" />
                            Aprobar
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleStatusChange(job.id, 'REJECTED')}
                            loading={processingId === job.id}
                          >
                            <XCircle className="w-4 h-4" />
                            Rechazar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleStatusChange(job.id, 'SPAM')}
                            loading={processingId === job.id}
                          >
                            <Ban className="w-4 h-4" />
                            Spam
                          </Button>
                        </div>
                      )}

                      {job.status !== 'PENDING' && (
                        <div className="text-sm text-gray-400 italic">
                          Moderado como {job.status.toLowerCase()}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
