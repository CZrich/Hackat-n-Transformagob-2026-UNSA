import { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle,
  Ban,
  RefreshCw,
  Building2,
  Star,
  ShieldCheck,
  Search,
  ThumbsDown
} from 'lucide-react';
import { 
  getCompaniesLocal, 
  updateCompanyVerificationLocal, 
  updateCompanyBanLocal 
} from '../services/mockDb';
import type { User } from '../types';
import Button from '../components/ui/Button';
import Card, { CardContent, CardHeader } from '../components/ui/Card';

export default function DashboardAdmin() {
  const [companies, setCompanies] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'VERIFIED' | 'UNVERIFIED' | 'BANNED' | 'LOW_RATING'>('ALL');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const loadCompanies = useCallback(() => {
    setLoading(true);
    try {
      const list = getCompaniesLocal();
      setCompanies(list);
    } catch (err) {
      console.error('Error cargando empresas:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  const handleVerifyToggle = (companyId: string, currentStatus: boolean) => {
    try {
      updateCompanyVerificationLocal(companyId, !currentStatus);
      showTemporaryMessage(`Empresa ${!currentStatus ? 'VERIFICADA' : 'DESACTIVADA'} con éxito. Ofertas vinculadas actualizadas.`, 'success');
      loadCompanies();
    } catch {
      showTemporaryMessage('Error al actualizar verificación.', 'error');
    }
  };

  const handleBanToggle = (companyId: string, currentStatus: boolean) => {
    try {
      updateCompanyBanLocal(companyId, !currentStatus);
      showTemporaryMessage(`Empresa ${!currentStatus ? 'BANEADA y suspendida' : 'ACTIVADA'} con éxito.`, 'success');
      loadCompanies();
    } catch {
      showTemporaryMessage('Error al actualizar ban.', 'error');
    }
  };

  const showTemporaryMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  // Metrics calculation
  const totalCompanies = companies.length;
  const verifiedCount = companies.filter(c => c.es_verificada && !c.es_baneada).length;
  const pendingVerification = companies.filter(c => !c.es_verificada && !c.es_baneada).length;
  const bannedCount = companies.filter(c => c.es_baneada).length;
  const lowRatingCount = companies.filter(c => (c.rating_promedio || 5.0) < 3.0).length;

  // Filter and search logic
  const filteredCompanies = companies.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (c.ruc || '').includes(searchTerm) || 
      (c.email || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    switch (filterType) {
      case 'VERIFIED':
        return c.es_verificada && !c.es_baneada;
      case 'UNVERIFIED':
        return !c.es_verificada && !c.es_baneada;
      case 'BANNED':
        return !!c.es_baneada;
      case 'LOW_RATING':
        return (c.rating_promedio || 5.0) < 3.0;
      default:
        return true;
    }
  });

  return (
    <div className="space-y-8 font-sans max-w-6xl mx-auto">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Consola Administrativa ODEEG</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gestión y verificación de cuentas de empleadores y monitoreo de reputación laboral de la UNSA.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-auto">
          <Button
            size="sm"
            variant="secondary"
            onClick={loadCompanies}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Sincronizar Empresas
          </Button>
        </div>
      </div>

      {message && (
        <div className={`flex items-center gap-2.5 p-4 rounded-xl text-sm border font-semibold animate-fadeIn ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {message.type === 'success' ? <ShieldCheck className="w-5 h-5 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1: Verified */}
        <Card className="border border-green-100 bg-green-50/20 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-full filter blur-xl"></div>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-100 text-green-700">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-3xl font-black text-green-800">{verifiedCount}</p>
              <p className="text-xs font-bold text-gray-600">Empresas Verificadas</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Ofertas se auto-publican</p>
            </div>
          </CardContent>
        </Card>

        {/* Metric 2: Unverified */}
        <Card className="border border-amber-100 bg-amber-50/20 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full filter blur-xl"></div>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-100 text-amber-700">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-3xl font-black text-amber-800">{pendingVerification}</p>
              <p className="text-xs font-bold text-gray-600">Por Verificar</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Requieren revisión de RUC</p>
            </div>
          </CardContent>
        </Card>

        {/* Metric 3: Low Ratings */}
        <Card className={`border shadow-sm ${lowRatingCount > 0 ? 'border-red-200 bg-red-50/20 animate-pulse' : 'border-gray-150 bg-white'}`}>
          <CardContent className="p-5 flex items-center gap-4">
            <div className={`p-3 rounded-xl ${lowRatingCount > 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-400'}`}>
              <ThumbsDown className="w-6 h-6" />
            </div>
            <div>
              <p className="text-3xl font-black text-red-900">{lowRatingCount}</p>
              <p className="text-xs font-bold text-gray-600">Mal Calificadas (&lt; 3★)</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Monitoreo y posibles bans</p>
            </div>
          </CardContent>
        </Card>

        {/* Metric 4: Banned */}
        <Card className="border border-gray-150 bg-white shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-slate-100 text-slate-700">
              <Ban className="w-6 h-6" />
            </div>
            <div>
              <p className="text-3xl font-black text-slate-900">{bannedCount}</p>
              <p className="text-xs font-bold text-gray-600">Empresas Baneadas</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Cuentas inactivas / suspendidas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Poorly Rated Companies Alert Panel */}
      {lowRatingCount > 0 && (
        <Card className="border border-red-200 bg-red-50/20 shadow-md">
          <CardHeader className="bg-red-100/40 border-b border-red-200 py-3 px-6 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-700" />
            <h2 className="text-sm font-bold text-red-900">Alerta de Seguridad: Empresas con Baja Calificación</h2>
          </CardHeader>
          <CardContent className="p-5 space-y-3">
            <p className="text-xs text-red-800 leading-relaxed">
              Las siguientes empresas han recibido una calificación promedio menor a **3.0 estrellas** por parte de los egresados postulación. Revise sus datos y determine si es necesario suspender sus cuentas para evitar malas prácticas de opacidad o reclutamientos fraudulentos.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {companies.filter(c => (c.rating_promedio || 5.0) < 3.0).map(company => (
                <div key={company.id} className="bg-white p-3.5 rounded-xl border border-red-150 flex justify-between items-center shadow-xs">
                  <div>
                    <h4 className="text-xs font-extrabold text-gray-950">{company.name}</h4>
                    <p className="text-[10px] text-gray-500">RUC: {company.ruc} | Rubro: {company.rubro}</p>
                    <div className="flex items-center gap-1 mt-1 text-red-700">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span className="text-xs font-bold">{company.rating_promedio} / 5.0</span>
                      <span className="text-[9px] text-gray-400 font-medium">({company.total_votos || 0} votos)</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleBanToggle(company.id, company.es_baneada || false)}
                    className="bg-red-800 hover:bg-red-950 text-white rounded-lg text-[10px] py-1 px-3.5 font-bold flex items-center gap-1"
                  >
                    <Ban className="w-3.5 h-3.5" /> Banear
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Companies Moderation Queue */}
      <Card className="border border-gray-150 shadow-md">
        {/* Toolbar & Filters */}
        <CardHeader className="bg-gray-50/50 border-b border-gray-100 px-6 py-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-red-800" />
              <h2 className="text-lg font-bold text-gray-900">Directorio de Empresas Empleadoras</h2>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
              {filteredCompanies.length} de {totalCompanies} Empresas
            </span>
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por Razón Social, RUC o Correo..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 block w-full rounded-xl border border-gray-300 px-3.5 py-2 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 h-9 bg-white"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-1 bg-gray-100/80 p-1 rounded-xl">
              {(['ALL', 'VERIFIED', 'UNVERIFIED', 'BANNED', 'LOW_RATING'] as const).map((type) => {
                const labels: Record<string, string> = {
                  ALL: 'Todas',
                  VERIFIED: 'Verificadas',
                  UNVERIFIED: 'Pendientes',
                  BANNED: 'Baneadas',
                  LOW_RATING: 'Baja Reputación'
                };
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFilterType(type)}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                      filterType === type
                        ? 'bg-white text-red-950 shadow-3xs'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    {labels[type]}
                  </button>
                );
              })}
            </div>
          </div>
        </CardHeader>

        {/* Company List Content */}
        <CardContent className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin h-8 w-8 border-4 border-red-800 border-t-transparent rounded-full" />
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="font-bold text-gray-700 text-base">No se encontraron empresas</p>
              <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
                No hay registros que coincidan con la búsqueda o filtro seleccionado.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fadeIn">
              {filteredCompanies.map((company) => {
                const verified = company.es_verificada || false;
                const banned = company.es_baneada || false;
                const avgRating = company.rating_promedio || 5.0;

                return (
                  <Card 
                    key={company.id} 
                    className={`border transition-all overflow-hidden relative shadow-xs hover:shadow-md ${
                      banned 
                        ? 'border-gray-200 bg-gray-50/50 opacity-70' 
                        : verified 
                        ? 'border-green-150 bg-green-50/5' 
                        : 'border-amber-150 bg-amber-50/5'
                    }`}
                  >
                    {/* Status Ribbon top right */}
                    <div className="absolute top-4 right-4">
                      {banned ? (
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-gray-200 text-gray-700 border border-gray-300">
                          Baneada
                        </span>
                      ) : verified ? (
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-green-100 text-green-700 border border-green-200">
                          ✓ Verificada
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-amber-100 text-amber-700 border border-amber-200 animate-pulse">
                          Sin Verificar
                        </span>
                      )}
                    </div>

                    <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-2">
                          <div className={`p-2 rounded-lg ${
                            banned ? 'bg-gray-200 text-gray-600' : verified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            <Building2 className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-extrabold text-gray-900 text-sm">{company.name}</h3>
                            <p className="text-[10px] text-gray-500 font-semibold uppercase">{company.rubro || 'Rubro no especificado'}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs border-t border-gray-100 pt-2.5">
                          <div>
                            <span className="text-gray-400 text-[10px] block">RUC Comercial</span>
                            <strong className="text-gray-700 font-semibold">{company.ruc || 'No registrado'}</strong>
                          </div>
                          <div>
                            <span className="text-gray-400 text-[10px] block">Contacto</span>
                            <strong className="text-gray-700 font-semibold">{company.contact_name || 'No registrado'}</strong>
                          </div>
                          <div className="mt-1.5 col-span-2">
                            <span className="text-gray-400 text-[10px] block">Correo Registrado</span>
                            <strong className="text-gray-700 font-medium">{company.email}</strong>
                          </div>
                          <div className="mt-1.5">
                            <span className="text-gray-400 text-[10px] block">Celular</span>
                            <strong className="text-gray-700 font-semibold">{company.telefono || 'No registrado'}</strong>
                          </div>
                          <div className="mt-1.5">
                            <span className="text-gray-400 text-[10px] block">Calificación Egresados</span>
                            <div className="flex items-center gap-1 text-amber-600">
                              <Star className={`w-3.5 h-3.5 ${avgRating < 3 ? 'text-red-600 fill-current' : 'text-amber-500 fill-current'}`} />
                              <strong className={`font-bold ${avgRating < 3 ? 'text-red-700' : 'text-gray-700'}`}>{avgRating} / 5.0</strong>
                              <span className="text-[9px] text-gray-400 font-medium">({company.total_votos || 0})</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Moderation Actions */}
                      <div className="flex gap-2 pt-2 border-t border-gray-100">
                        {/* Verify Button */}
                        <button
                          type="button"
                          disabled={banned}
                          onClick={() => handleVerifyToggle(company.id, verified)}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold border transition-colors ${
                            banned 
                              ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                              : verified
                              ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                              : 'bg-green-700 text-white border-transparent hover:bg-green-800'
                          }`}
                        >
                          {verified ? 'Desverificar' : 'Verificar RUC'}
                        </button>

                        {/* Ban Button */}
                        <button
                          type="button"
                          onClick={() => handleBanToggle(company.id, banned)}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold border transition-colors ${
                            banned
                              ? 'bg-white text-green-700 border-green-200 hover:bg-green-50'
                              : 'bg-white text-red-700 border-red-200 hover:bg-red-50'
                          }`}
                        >
                          <Ban className="w-3.5 h-3.5" />
                          {banned ? 'Desbanear' : 'Banear'}
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
