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
        <h2 className="text-xl font-bold text-gray-900">Gestión de Eventos y Novedades</h2>
        <Button onClick={() => setShowForm(true)} className="bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs px-4">
          <Plus className="w-4 h-4 mr-2 inline" /> Nuevo Evento
        </Button>
      </div>

      {showForm && (
        <Card className="border border-amber-200">
          <CardHeader className="bg-amber-50 py-3 border-b border-amber-100">
            <h3 className="font-bold text-amber-900">Crear Evento</h3>
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
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <Button type="button" variant="secondary" onClick={() => setShowForm(false)} className="rounded-xl text-xs px-4">Cancelar</Button>
                <Button type="submit" className="rounded-xl text-xs px-4 bg-amber-600 hover:bg-amber-700">Publicar Evento</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Cargando eventos...</p>
      ) : events.length === 0 ? (
        <div className="p-10 bg-gray-50 text-center rounded-xl border border-gray-200">
          <CalendarIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No hay eventos publicados</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((ev) => (
            <Card key={ev.id} className="border border-gray-200">
              <CardContent className="p-5 flex flex-col h-full">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">{ev.type}</span>
                  <button onClick={() => handleDelete(ev.id)} className="text-gray-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <h4 className="font-bold text-gray-900 mb-1 leading-tight">{ev.title}</h4>
                <p className="text-xs text-gray-600 mb-4 line-clamp-2 flex-grow">{ev.description}</p>
                
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
