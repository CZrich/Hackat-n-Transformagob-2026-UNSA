import { useState, useEffect } from 'react';
import { api } from '../services/api';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { 
  Plus, 
  Trash2, 
  Calendar as CalendarIcon, 
  MapPin, 
  Link as LinkIcon, 
  LayoutGrid, 
  List, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';
import toast from 'react-hot-toast';

const EVENT_TYPES = ['FERIA', 'CURSO', 'BECA', 'CONVOCATORIA', 'OTRO'];

export default function DashboardAdminEvents() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'FERIA',
    date: new Date().toISOString().split('T')[0],
    location: '',
    link: '',
  });

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await api.events.list();
      setEvents(data);
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar eventos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [events.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.events.create(formData);
      setShowForm(false);
      setFormData({
        title: '',
        description: '',
        type: 'FERIA',
        date: new Date().toISOString().split('T')[0],
        location: '',
        link: '',
      });
      toast.success('Evento creado con éxito');
      loadEvents();
    } catch (err) {
      toast.error('Error al crear evento');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar evento?')) return;
    try {
      await api.events.delete(id);
      toast.success('Evento eliminado con éxito');
      loadEvents();
    } catch (err) {
      toast.error('Error al eliminar evento');
    }
  };

  const totalPages = Math.ceil(events.length / itemsPerPage);
  const paginatedEvents = events.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-slate-900">Gestión de Eventos y Novedades</h2>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
            {events.length} Eventos
          </span>
        </div>
        
        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-slate-150 p-0.5 rounded-xl border border-slate-200 shadow-2xs">
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

          <Button onClick={() => setShowForm(true)} className="bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs px-4 py-2 shadow-sm transition-all flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Nuevo Evento
          </Button>
        </div>
      </div>

      {showForm && (
        <Card className="border border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50/50 py-4 px-5 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm">Crear Evento</h3>
          </CardHeader>
          <CardContent className="p-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Título del Evento" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="rounded-xl" />
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">Tipo de Evento</label>
                  <select
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm h-10"
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                  >
                    {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-750 uppercase tracking-wide">Descripción</label>
                <textarea
                  required
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input label="Fecha" type="date" required value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="rounded-xl" />
                <Input label="Ubicación (opcional)" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} className="rounded-xl" />
                <Input label="Enlace (opcional)" type="url" value={formData.link} onChange={e => setFormData({ ...formData, link: e.target.value })} className="rounded-xl" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-2">
                <Button type="button" variant="secondary" onClick={() => setShowForm(false)} className="rounded-xl text-xs px-5 border-slate-200">Cancelar</Button>
                <Button type="submit" className="rounded-xl text-xs px-5 bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-all">Publicar Evento</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-6 w-6 border-4 border-slate-800 border-t-transparent rounded-full" />
        </div>
      ) : events.length === 0 ? (
        <div className="py-12 bg-white text-center rounded-2xl border border-slate-200 border-dashed">
          <CalendarIcon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium text-sm">No hay eventos publicados</p>
        </div>
      ) : (
        <div className="space-y-6">
          {viewMode === 'table' ? (
            /* Table View */
            <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
              <table className="w-full text-left border-collapse bg-white">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Evento</th>
                    <th className="py-3 px-4">Descripción</th>
                    <th className="py-3 px-4">Fecha</th>
                    <th className="py-3 px-4">Ubicación</th>
                    <th className="py-3 px-4">Enlace</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {paginatedEvents.map((ev) => (
                    <tr key={ev.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <span className="font-bold text-slate-900 block leading-tight">{ev.title}</span>
                          <span className="inline-flex px-2.5 py-0.5 rounded-md text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wider">{ev.type}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="text-slate-500 line-clamp-2 leading-relaxed">{ev.description}</p>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        {new Date(ev.date).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 truncate max-w-[120px]">
                        {ev.location || 'N/D'}
                      </td>
                      <td className="py-3.5 px-4">
                        {ev.link ? (
                          <a href={ev.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:underline">
                            <LinkIcon className="w-3 h-3" /> Ver
                          </a>
                        ) : (
                          <span className="text-slate-400">N/D</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDelete(ev.id)}
                          className="text-slate-400 hover:text-red-600 transition-colors p-1.5 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-200/30"
                          title="Eliminar Evento"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* Card View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {paginatedEvents.map((ev) => (
                <Card key={ev.id} className="border border-slate-200 shadow-sm hover:shadow-md transition-all bg-white rounded-2xl overflow-hidden">
                  <CardContent className="p-5 flex flex-col h-full justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 uppercase tracking-wider">{ev.type}</span>
                        <button onClick={() => handleDelete(ev.id)} className="text-slate-400 hover:text-red-600 transition-colors p-1 hover:bg-red-50 rounded-md">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <h4 className="font-bold text-slate-900 mb-2 leading-tight text-sm">{ev.title}</h4>
                      <p className="text-xs text-slate-500 mb-5 line-clamp-3 leading-relaxed">{ev.description}</p>
                    </div>
                    
                    <div className="space-y-2 mt-4 pt-3 border-t border-slate-100 text-xs text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <CalendarIcon className="w-3.5 h-3.5" />
                        <span>{new Date(ev.date).toLocaleDateString()}</span>
                      </div>
                      {ev.location && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5" />
                          <span className="truncate">{ev.location}</span>
                        </div>
                      )}
                      {ev.link && (
                        <div className="flex items-center gap-1.5 text-blue-600">
                          <LinkIcon className="w-3.5 h-3.5" />
                          <a href={ev.link} target="_blank" rel="noreferrer" className="truncate hover:underline">Ver enlace</a>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-slate-100 gap-4">
              <p className="text-xs font-medium text-slate-500">
                Mostrando <span className="font-bold text-slate-700">{Math.min(events.length, (currentPage - 1) * itemsPerPage + 1)}</span> a{' '}
                <span className="font-bold text-slate-700">{Math.min(events.length, currentPage * itemsPerPage)}</span> de{' '}
                <span className="font-bold text-slate-700">{events.length}</span> eventos
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
    </div>
  );
}
