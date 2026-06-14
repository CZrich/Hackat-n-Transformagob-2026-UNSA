import { useState, useEffect } from 'react';
import { api } from '../services/api';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Plus, Trash2, Calendar as CalendarIcon, MapPin, Link as LinkIcon } from 'lucide-react';

const EVENT_TYPES = ['FERIA', 'CURSO', 'BECA', 'CONVOCATORIA', 'OTRO'];

export default function DashboardAdminEvents() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

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
      loadEvents();
    } catch (err) {
      alert('Error al crear evento');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar evento?')) return;
    try {
      await api.events.delete(id);
      loadEvents();
    } catch (err) {
      alert('Error al eliminar');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-900">Gestión de Eventos y Novedades</h2>
        <Button onClick={() => setShowForm(true)} className="bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs px-4 shadow-sm transition-all">
          <Plus className="w-4 h-4 mr-1.5 inline" /> Nuevo Evento
        </Button>
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
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm"
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                  >
                    {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">Descripción</label>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map((ev) => (
            <Card key={ev.id} className="border border-slate-200 shadow-sm hover:shadow-md transition-all bg-white rounded-2xl overflow-hidden">
              <CardContent className="p-5 flex flex-col h-full">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 uppercase tracking-wider">{ev.type}</span>
                  <button onClick={() => handleDelete(ev.id)} className="text-slate-400 hover:text-red-600 transition-colors p-1 hover:bg-red-50 rounded-md">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <h4 className="font-bold text-slate-900 mb-2 leading-tight text-sm">{ev.title}</h4>
                <p className="text-xs text-slate-500 mb-5 line-clamp-3 flex-grow leading-relaxed">{ev.description}</p>
                
                <div className="space-y-2 mt-auto text-xs text-gray-500">
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
    </div>
  );
}
