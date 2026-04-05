import React, { useState, useRef, useEffect } from 'react';
import { X, Star, MapPin, Music, Megaphone, HelpCircle, Check, Anchor } from 'lucide-react';

const EVENT_TYPES = [
  { key: 'gig',          label: 'Gig / Show',    Icon: Star,       color: 'text-[var(--primary)]  border-[var(--primary)]/40  bg-[var(--primary)]/10' },
  { key: 'launch',       label: 'Lanzamiento',   Icon: MapPin,     color: 'text-[var(--secondary)] border-[var(--secondary)]/40 bg-[var(--secondary)]/10' },
  { key: 'bts',          label: 'BTS',           Icon: Music,      color: 'text-yellow-400 border-yellow-500/40 bg-yellow-500/10' },
  { key: 'announcement', label: 'Anuncio',        Icon: Megaphone,  color: 'text-blue-400 border-blue-500/40 bg-blue-500/10' },
  { key: 'other',        label: 'Otro',           Icon: HelpCircle, color: 'text-gray-400 border-gray-600/40 bg-gray-800/20' },
];

const RELEVANCE = [
  { key: 'high',   label: 'Alta',   dot: 'bg-red-400' },
  { key: 'medium', label: 'Media',  dot: 'bg-yellow-400' },
  { key: 'low',    label: 'Baja',   dot: 'bg-gray-500' },
];

const today = () => new Date().toISOString().slice(0, 10);

const StrategicAnchorCreator = ({ initialDate, onSave, onClose }) => {
  const [fields, setFields] = useState({
    title:       '',
    description: '',
    category:    'gig',
    event_date:  initialDate || today(),
    relevance:   'high',
  });
  const [saving, setSaving] = useState(false);
  const overlayRef = useRef(null);
  const titleRef = useRef(null);

  useEffect(() => {
    titleRef.current?.focus();
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const set = (key) => (e) => setFields(f => ({ ...f, [key]: e.target.value }));

  const handleSave = async () => {
    if (!fields.title.trim()) return;
    setSaving(true);
    try {
      await onSave(fields);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const selectedType = EVENT_TYPES.find(t => t.key === fields.category);

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
    >
      <div className="bg-[var(--surface-low)] border border-[var(--outline-variant)] w-full max-w-lg">

        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--outline-variant)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Anchor size={14} className="text-[var(--secondary)]" />
            <div>
              <h3 className="text-sm font-display font-black text-white uppercase italic tracking-widest">Ancla Estratégica</h3>
              <p className="text-[9px] font-mono text-gray-600 uppercase tracking-widest">Nuevo evento del ecosistema</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-white transition-colors p-1">
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">

          {/* Event type selector */}
          <div>
            <label className="text-[9px] font-mono font-black text-gray-600 uppercase tracking-widest mb-3 block">
              Tipo de Evento
            </label>
            <div className="grid grid-cols-5 gap-2">
              {EVENT_TYPES.map(({ key, label, Icon, color }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFields(f => ({ ...f, category: key }))}
                  className={`flex flex-col items-center gap-2 p-3 border transition-all text-center ${
                    fields.category === key ? color : 'border-[var(--outline-variant)] text-gray-600 hover:text-gray-400'
                  }`}
                >
                  <Icon size={16} />
                  <span className="text-[7px] font-mono font-black uppercase tracking-widest leading-none">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-[9px] font-mono font-black text-gray-600 uppercase tracking-widest mb-2 block">
              Título *
            </label>
            <input
              ref={titleRef}
              type="text"
              value={fields.title}
              onChange={set('title')}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
              placeholder="Nombre del evento..."
              className="w-full bg-[var(--surface-highest)] border border-[var(--outline-variant)] focus:border-[var(--secondary)] px-4 py-3 text-sm font-mono font-black text-white outline-none transition-colors placeholder:text-gray-700"
            />
          </div>

          {/* Date + Relevance row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[9px] font-mono font-black text-gray-600 uppercase tracking-widest mb-2 block">
                Fecha
              </label>
              <input
                type="date"
                value={fields.event_date}
                onChange={set('event_date')}
                className="w-full bg-[var(--surface-highest)] border border-[var(--outline-variant)] focus:border-[var(--secondary)] px-3 py-2 text-[11px] font-mono text-white outline-none transition-colors"
              />
            </div>
            <div>
              <label className="text-[9px] font-mono font-black text-gray-600 uppercase tracking-widest mb-2 block">
                Relevancia
              </label>
              <div className="flex gap-1">
                {RELEVANCE.map(({ key, label, dot }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFields(f => ({ ...f, relevance: key }))}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[8px] font-mono font-black uppercase border transition-all ${
                      fields.relevance === key
                        ? 'border-white/30 bg-white/10 text-white'
                        : 'border-[var(--outline-variant)] text-gray-600 hover:text-gray-400'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-[9px] font-mono font-black text-gray-600 uppercase tracking-widest mb-2 block">
              Descripción <span className="text-gray-700">(opcional)</span>
            </label>
            <textarea
              rows={2}
              value={fields.description}
              onChange={set('description')}
              placeholder="Contexto del evento para la IA..."
              className="w-full bg-[var(--surface-highest)] border border-[var(--outline-variant)] focus:border-[var(--secondary)] px-3 py-2 text-[11px] font-mono text-white outline-none transition-colors resize-none placeholder:text-gray-700"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex items-center justify-between gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 border text-[8px] font-mono font-black uppercase tracking-widest ${selectedType?.color}`}>
            {selectedType && <selectedType.Icon size={10} />}
            {selectedType?.label}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="text-[9px] font-mono font-black uppercase text-gray-600 hover:text-white px-4 py-2 border border-[var(--outline-variant)] transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !fields.title.trim()}
              className="btn-secondary py-2 px-6 text-xs flex items-center gap-2 disabled:opacity-40"
            >
              {saving ? 'Guardando...' : <><Check size={12} /> Anclar Evento</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StrategicAnchorCreator;
