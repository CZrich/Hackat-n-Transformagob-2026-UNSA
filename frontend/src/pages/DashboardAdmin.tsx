import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  AlertTriangle,
  Ban,
  RefreshCw,
  Building2,
  Star,
  ShieldCheck,
  Search,
  ThumbsDown,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

import { api } from '../services/api';
import type { User } from '../types';
import Button from '../components/ui/Button';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import DashboardAdminEvents from './DashboardAdminEvents';

export default function DashboardAdmin() {
  const [companies, setCompanies] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'VERIFIED' | 'UNVERIFIED' | 'BANNED' | 'LOW_RATING'>('ALL');
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const loadCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const list = await api.admin.listCompanies();
      const mapped = list.map((c: any) => ({
        id: c.id,
        name: c.name,
        role: 'EMPLEADOR' as const,
        rubro: c.rubro,
        ruc: c.ruc,
        es_verificada: c.es_verificada,
        es_baneada: c.es_baneada,
        email: c.user?.email || '',
        telefono: c.user?.telefono || '',
        contact_name: c.user?.name || '',
        rating_promedio: c.rating_promedio || 5.0,
      }));
      setCompanies(mapped);
    } catch (err) {
      console.error('API Error cargando empresas:', err);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  const handleVerifyToggle = async (companyId: string, currentStatus: boolean) => {
    try {
      await api.admin.verifyCompany(companyId, !currentStatus);
      toast.success(`Empresa ${!currentStatus ? 'VERIFICADA' : 'DESACTIVADA'} con éxito. Ofertas vinculadas actualizadas.`);
      loadCompanies();
    } catch (err) {
      console.error('API Error verificando empresa:', err);
      toast.error('Error al actualizar verificación.');
    }
  };

  const handleBanToggle = async (companyId: string, currentStatus: boolean) => {
    try {
      await api.admin.banCompany(companyId, !currentStatus);
      toast.success(`Empresa ${!currentStatus ? 'BANEADA y suspendida' : 'ACTIVADA'} con éxito.`);
      loadCompanies();
    } catch (err) {
      console.error('API Error baneando empresa:', err);
      toast.error('Error al actualizar ban.');
    }
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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType]);

  const totalPages = Math.ceil(filteredCompanies.length / itemsPerPage);
  const paginatedCompanies = filteredCompanies.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const [activeTab, setActiveTab] = useState<'empresas' | 'eventos'>('empresas');

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

      <div className="flex gap-6 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('empresas')}
          className={`pb-3 px-1 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'empresas' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Gestión de Empresas
        </button>
        <button
          onClick={() => setActiveTab('eventos')}
          className={`pb-3 px-1 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'eventos' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Gestión de Eventos
        </button>
      </div>

      {activeTab === 'eventos' ? (
        <DashboardAdminEvents />
      ) : (
        <>


      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Metric 1: Verified */}
        <Card className="rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all duration-200">
          <CardContent className="p-6 flex items-start gap-4">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-2xl font-bold text-slate-900 leading-none">{verifiedCount}</p>
              <p className="text-sm font-semibold text-slate-600">Empresas Verificadas</p>
              <p className="text-xs text-slate-500">Ofertas se auto-publican</p>
            </div>
          </CardContent>
        </Card>

        {/* Metric 2: Unverified */}
        <Card className="rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all duration-200">
          <CardContent className="p-6 flex items-start gap-4">
            <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
              <Building2 className="w-6 h-6" />
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-2xl font-bold text-slate-900 leading-none">{pendingVerification}</p>
              <p className="text-sm font-semibold text-slate-600">Por Verificar</p>
              <p className="text-xs text-slate-500">Requieren revisión de RUC</p>
            </div>
          </CardContent>
        </Card>

        {/* Metric 3: Low Ratings */}
        <Card className="rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all duration-200">
          <CardContent className="p-6 flex items-start gap-4">
            <div className={`p-3 rounded-xl ${lowRatingCount > 0 ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-400'}`}>
              <ThumbsDown className="w-6 h-6" />
            </div>
            <div className="flex-1 space-y-1">
              <p className={`text-2xl font-bold leading-none ${lowRatingCount > 0 ? 'text-red-600' : 'text-slate-900'}`}>{lowRatingCount}</p>
              <p className="text-sm font-semibold text-slate-600">Mal Calificadas (&lt; 3★)</p>
              <p className="text-xs text-slate-500">Monitoreo y posibles bans</p>
            </div>
          </CardContent>
        </Card>

        {/* Metric 4: Banned */}
        <Card className="rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all duration-200">
          <CardContent className="p-6 flex items-start gap-4">
            <div className="p-3 rounded-xl bg-slate-100 text-slate-600">
              <Ban className="w-6 h-6" />
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-2xl font-bold text-slate-900 leading-none">{bannedCount}</p>
              <p className="text-sm font-semibold text-slate-600">Empresas Baneadas</p>
              <p className="text-xs text-slate-500">Cuentas inactivas / suspendidas</p>
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
      <Card className="border border-slate-200 shadow-sm">
        {/* Toolbar & Filters */}
        <CardHeader className="bg-white border-b border-slate-100 px-6 py-5 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <Building2 className="w-5 h-5 text-slate-400" />
              <h2 className="text-lg font-bold text-slate-900">Directorio de Empresas Empleadoras</h2>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                {filteredCompanies.length} de {totalCompanies} Empresas
              </span>

              {/* View Toggle */}
              <div className="flex items-center gap-1 bg-slate-50 p-0.5 rounded-xl border border-slate-200 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    viewMode === 'table'
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200/50'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Vista de Tabla"
                >
                  <List className="w-4 h-4" />
                  <span className="hidden sm:inline text-[11px]">Tabla</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    viewMode === 'cards'
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200/50'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Vista de Tarjetas"
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span className="hidden sm:inline text-[11px]">Tarjetas</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por Razón Social, RUC o Correo..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 block w-full rounded-xl border border-slate-200 px-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-10 bg-white transition-all"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
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
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      filterType === type
                        ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
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
            <div className="space-y-6">
              {viewMode === 'table' ? (
                /* Table View */
                <div className="overflow-x-auto rounded-xl border border-slate-200/80 shadow-2xs">
                  <table className="w-full text-left border-collapse bg-white">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                        <th className="py-3 px-4">Empresa</th>
                        <th className="py-3 px-4">RUC</th>
                        <th className="py-3 px-4">Contacto</th>
                        <th className="py-3 px-4 text-center">Reputación</th>
                        <th className="py-3 px-4 text-center">Estado</th>
                        <th className="py-3 px-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {paginatedCompanies.map((company) => {
                        const verified = company.es_verificada || false;
                        const banned = company.es_baneada || false;
                        const avgRating = company.rating_promedio || 5.0;

                        return (
                          <tr
                            key={company.id}
                            className={`hover:bg-slate-50/50 transition-colors ${
                              banned ? 'bg-slate-50/30 opacity-75' : ''
                            }`}
                          >
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg border ${
                                  banned 
                                    ? 'bg-slate-100 border-slate-200 text-slate-400' 
                                    : 'bg-white border-slate-200 text-slate-700 shadow-2xs'
                                }`}>
                                  <Building2 className="w-4 h-4" />
                                </div>
                                <div>
                                  <span className="font-bold text-slate-900 block leading-tight">{company.name}</span>
                                  <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{company.rubro || 'Sin rubro'}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                              {company.ruc || 'No registrado'}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="space-y-0.5">
                                <span className="font-semibold text-slate-850 block leading-normal">{company.contact_name || 'No registrado'}</span>
                                <span className="text-slate-500 text-[10px] block font-mono">{company.email}</span>
                                {company.telefono && <span className="text-slate-400 text-[10px] block">{company.telefono}</span>}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <div className="inline-flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-250/30">
                                <Star className={`w-3.5 h-3.5 ${avgRating < 3 ? 'text-red-500 fill-current' : 'text-amber-500 fill-current'}`} />
                                <span className={`font-bold text-xs ${avgRating < 3 ? 'text-red-700' : 'text-slate-700'}`}>{avgRating.toFixed(1)}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              {banned ? (
                                <span className="inline-flex px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                  Baneada
                                </span>
                              ) : verified ? (
                                <span className="inline-flex px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-250/30">
                                  Verificada
                                </span>
                              ) : (
                                <span className="inline-flex px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-250/30">
                                  Pendiente
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  disabled={banned}
                                  onClick={() => handleVerifyToggle(company.id, verified)}
                                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all shadow-2xs border ${
                                    banned
                                      ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
                                      : verified
                                      ? 'bg-white text-slate-750 border-slate-200 hover:bg-slate-50 hover:border-slate-350'
                                      : 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800'
                                  }`}
                                >
                                  {verified ? 'Revocar' : 'Verificar'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleBanToggle(company.id, banned)}
                                  className={`p-1.5 rounded-lg text-[10px] font-bold border transition-all shadow-2xs ${
                                    banned
                                      ? 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                                      : 'bg-white text-red-650 border-slate-200 hover:border-red-200 hover:bg-red-50'
                                  }`}
                                  title={banned ? 'Desbanear' : 'Banear'}
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* Card View */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-fadeIn">
                  {paginatedCompanies.map((company) => {
                    const verified = company.es_verificada || false;
                    const banned = company.es_baneada || false;
                    const avgRating = company.rating_promedio || 5.0;

                    return (
                      <Card 
                        key={company.id} 
                        className={`border transition-all overflow-hidden relative shadow-sm hover:shadow-md ${
                          banned 
                            ? 'border-slate-200 bg-slate-50/50 opacity-75' 
                            : verified 
                            ? 'border-slate-200 bg-white' 
                            : 'border-amber-200 bg-amber-50/30'
                        }`}
                      >
                        {/* Status Ribbon top right */}
                        <div className="absolute top-4 right-4">
                          {banned ? (
                            <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                              Baneada
                            </span>
                          ) : verified ? (
                            <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              ✓ Verificada
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                              Sin Verificar
                            </span>
                          )}
                        </div>

                        <CardContent className="p-5 flex flex-col justify-between h-full space-y-5">
                          <div className="space-y-4">
                            <div className="flex items-start gap-3 pr-20">
                              <div className={`p-2.5 rounded-xl border ${
                                banned ? 'bg-slate-100 border-slate-200 text-slate-500' : verified ? 'bg-white border-slate-200 text-slate-700 shadow-sm' : 'bg-white border-amber-200 text-amber-600 shadow-sm'
                              }`}>
                                <Building2 className="w-5 h-5" />
                              </div>
                              <div>
                                <h3 className="font-bold text-slate-900 text-sm leading-tight">{company.name}</h3>
                                <p className="text-[10px] text-slate-500 font-medium uppercase mt-1 tracking-wider">{company.rubro || 'Rubro no especificado'}</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs border-t border-slate-100 pt-4">
                              <div>
                                <span className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider block mb-0.5">RUC</span>
                                <strong className="text-slate-700">{company.ruc || 'No registrado'}</strong>
                              </div>
                              <div>
                                <span className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider block mb-0.5">Contacto</span>
                                <strong className="text-slate-700 truncate block">{company.contact_name || 'No registrado'}</strong>
                              </div>
                              <div className="col-span-2">
                                <span className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider block mb-0.5">Correo Corporativo</span>
                                <strong className="text-slate-700">{company.email}</strong>
                              </div>
                              <div>
                                <span className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider block mb-0.5">Celular</span>
                                <strong className="text-slate-700">{company.telefono || 'No registrado'}</strong>
                              </div>
                              <div>
                                <span className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider block mb-0.5">Reputación</span>
                                <div className="flex items-center gap-1.5">
                                  <Star className={`w-3.5 h-3.5 ${avgRating < 3 ? 'text-red-500 fill-current' : 'text-amber-500 fill-current'}`} />
                                  <strong className={`font-bold ${avgRating < 3 ? 'text-red-700' : 'text-slate-700'}`}>{avgRating} / 5.0</strong>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Moderation Actions */}
                          <div className="flex gap-3 pt-4 border-t border-slate-100">
                            {/* Verify Button */}
                            <button
                              type="button"
                              disabled={banned}
                              onClick={() => handleVerifyToggle(company.id, verified)}
                              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                                banned 
                                  ? 'bg-slate-50 text-slate-400 border border-slate-200 cursor-not-allowed'
                                  : verified
                                  ? 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm'
                                  : 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm'
                              }`}
                            >
                              {verified ? 'Revocar Verificación' : 'Verificar RUC'}
                            </button>

                            {/* Ban Button */}
                            <button
                              type="button"
                              onClick={() => handleBanToggle(company.id, banned)}
                              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                                banned
                                  ? 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50 shadow-sm'
                                  : 'bg-white text-red-650 border-slate-200 hover:border-red-200 hover:bg-red-50 shadow-sm'
                              }`}
                            >
                              <Ban className="w-3.5 h-3.5" />
                              {banned ? 'Desbanear' : 'Banear Empresa'}
                            </button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-slate-100 gap-4">
                  <p className="text-xs font-medium text-slate-500">
                    Mostrando <span className="font-bold text-slate-700">{Math.min(filteredCompanies.length, (currentPage - 1) * itemsPerPage + 1)}</span> a{' '}
                    <span className="font-bold text-slate-700">{Math.min(filteredCompanies.length, currentPage * itemsPerPage)}</span> de{' '}
                    <span className="font-bold text-slate-700">{filteredCompanies.length}</span> empresas
                  </p>
                  <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      className="p-1.5 rounded-lg text-slate-650 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-600 disabled:cursor-not-allowed transition-all"
                      title="Página Anterior"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {Array.from({ length: totalPages }).map((_, idx) => {
                      const pageNum = idx + 1;
                      return (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-7.5 h-7.5 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${
                            currentPage === pageNum
                              ? 'bg-slate-900 text-white shadow-xs'
                              : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      className="p-1.5 rounded-lg text-slate-650 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-600 disabled:cursor-not-allowed transition-all"
                      title="Página Siguiente"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      </>
      )}
    </div>
  );
}
