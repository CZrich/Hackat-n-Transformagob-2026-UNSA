import { useEffect } from 'react';
import { Briefcase, DollarSign, MapPin, Calendar, AlertCircle } from 'lucide-react';
import { useJobs } from '../hooks/useJobs';
import Card, { CardContent } from '../components/ui/Card';
import type { User } from '../types';

interface DashboardEgresadoProps {
  user: User;
}

export default function DashboardEgresado({ user }: DashboardEgresadoProps) {
  const { jobs, loading, error, fetchMatched } = useJobs();

  useEffect(() => {
    fetchMatched();
  }, [fetchMatched]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ofertas laborales</h1>
        <p className="text-sm text-gray-500 mt-1">
          Ofertas filtradas para <strong>{user.carrera || 'tu carrera'}</strong>
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin h-8 w-8 border-4 border-unsa-600 border-t-transparent rounded-full" />
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {!loading && !error && jobs.length === 0 && (
        <div className="text-center py-16">
          <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No hay ofertas disponibles</p>
          <p className="text-sm text-gray-400 mt-1">
            Aún no hay ofertas publicadas para tu carrera
          </p>
        </div>
      )}

      <div className="grid gap-4">
        {jobs.map((job) => (
          <Card key={job.id} className="hover:border-unsa-200 transition-colors">
            <CardContent>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                    <p className="text-sm text-gray-500">{job.company_name || 'Empresa'}</p>
                  </div>

                  <div className="flex flex-wrap gap-3 text-sm">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-unsa-50 text-unsa-700 text-xs font-medium">
                      <MapPin className="w-3.5 h-3.5" />
                      {job.carrera_destino}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(job.creado_en).toLocaleDateString('es-PE')}
                    </span>
                  </div>

                  <div className="text-sm text-gray-600">
                    <strong className="text-gray-800">Requisitos:</strong>
                    <p className="mt-0.5 whitespace-pre-line">{job.requisitos}</p>
                  </div>
                </div>

                <div className="flex-shrink-0 text-left sm:text-right">
                  <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-50 border border-green-200">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <span className="text-lg font-bold text-green-700">
                      S/ {job.salario_min.toLocaleString('es-PE')}
                      {job.salario_max > job.salario_min &&
                        ` - S/ ${job.salario_max.toLocaleString('es-PE')}`}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
