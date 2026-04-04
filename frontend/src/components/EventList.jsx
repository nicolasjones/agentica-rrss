import React, { useState } from 'react';
import { Calendar, Trash2, Plus, Clock, Tag } from 'lucide-react';

const EventList = ({ events = [], onAdd, onDelete }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({ title: '', event_date: '', type: 'release' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title || !form.event_date) return;
    onAdd(form);
    setForm({ title: '', event_date: '', type: 'release' });
    setIsAdding(false);
  };

  return (
    <div className="surface-card p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-display font-black text-white uppercase tracking-widest flex items-center gap-2">
          <Calendar size={16} className="text-[var(--secondary)]" /> Eventos Próximos
        </h3>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="text-[10px] font-mono font-black uppercase text-[var(--secondary)] hover:text-white transition-colors"
        >
          {isAdding ? 'Cancelar' : '+ Agregar'}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="border border-[var(--outline-variant)] p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="space-y-1">
            <label className="text-[9px] font-mono font-black text-gray-600 uppercase">Título del Evento</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full bg-[var(--surface-highest)] border border-[var(--outline-variant)] p-2 text-xs text-white outline-none focus:border-[var(--secondary)]"
              placeholder="ej: Lanzamiento Single 'Ruido'"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[9px] font-mono font-black text-gray-600 uppercase">Fecha</label>
              <input
                type="date"
                value={form.event_date}
                onChange={e => setForm({ ...form, event_date: e.target.value })}
                className="w-full bg-[var(--surface-highest)] border border-[var(--outline-variant)] p-2 text-xs text-white outline-none focus:border-[var(--secondary)]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-mono font-black text-gray-600 uppercase">Tipo</label>
              <select
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value })}
                className="w-full bg-[var(--surface-highest)] border border-[var(--outline-variant)] p-2 text-xs text-white outline-none focus:border-[var(--secondary)]"
              >
                <option value="release">Lanzamiento</option>
                <option value="show">Show / Gira</option>
                <option value="shooting">Shooting / Media</option>
                <option value="other">Otro</option>
              </select>
            </div>
          </div>
          <button type="submit" className="w-full py-2 bg-[var(--secondary)] text-black text-[10px] font-mono font-black uppercase tracking-widest hover:bg-white transition-colors">
            Registrar Evento
          </button>
        </form>
      )}

      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
        {events.length === 0 ? (
          <p className="text-[10px] font-mono text-gray-700 uppercase italic">No hay eventos registrados</p>
        ) : (
          events.map(event => (
            <div key={event.id} className="flex items-center justify-between p-3 border border-[var(--outline-variant)] hover:bg-white/5 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="p-2 border border-[var(--outline-variant)] text-gray-600 group-hover:text-[var(--secondary)]">
                  {event.type === 'release' ? <Tag size={12} /> : <Clock size={12} />}
                </div>
                <div>
                  <h4 className="text-[11px] font-mono font-bold text-white leading-none">{event.title}</h4>
                  <p className="text-[9px] font-mono text-gray-500 mt-1 uppercase">{event.event_date}</p>
                </div>
              </div>
              <button
                onClick={() => onDelete(event.id)}
                className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default EventList;
