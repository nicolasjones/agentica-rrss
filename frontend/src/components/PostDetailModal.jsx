import React, { useState, useEffect, useRef } from 'react';
import { X, Trash2, Check } from 'lucide-react';

const PLATFORMS = ['instagram', 'tiktok', 'facebook', 'youtube'];

const PLATFORM_DOT = {
  instagram: 'bg-pink-400',
  facebook:  'bg-blue-400',
  youtube:   'bg-red-400',
  tiktok:    'bg-white/60',
};

const today = () => new Date().toISOString().slice(0, 10);

const PostDetailModal = ({ post, initialDate, onSave, onDelete, onClose }) => {
  const isCreate = post == null;

  const [fields, setFields] = useState({
    concept_title:  post?.concept_title  || '',
    narrative_goal: post?.narrative_goal || '',
    caption:        post?.caption        || '',
    scheduled_date: post?.scheduled_date || initialDate || today(),
    scheduled_time: post?.scheduled_time || '',
    platform:       post?.platform       || 'instagram',
    hashtags:       post?.hashtags       || '',
  });

  const overlayRef = useRef(null);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const set = (key) => (e) => setFields(f => ({ ...f, [key]: e.target.value }));

  const handleSave = () => {
    const delta = { ...fields };
    onSave(delta);
    onClose();
  };

  const handleApprove = () => {
    onSave({ is_approved: !post.is_approved });
    onClose();
  };

  const handleDelete = () => {
    onDelete(post.id);
    onClose();
  };

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
    >
      <div className="surface-card w-full max-w-[520px] flex flex-col gap-0 overflow-hidden">

        {/* Header */}
        <div className="flex items-start gap-3 p-5 border-b border-[var(--outline-variant)]">
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={fields.concept_title}
              onChange={set('concept_title')}
              placeholder="Título del concepto..."
              className="w-full bg-transparent text-white font-mono font-black text-sm outline-none placeholder:text-gray-600 border-b border-transparent focus:border-[var(--secondary)] transition-colors pb-1"
            />
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`text-[9px] font-mono font-black px-2 py-1 rounded-sm uppercase flex items-center gap-1.5 border border-[var(--outline-variant)] bg-[var(--surface-highest)]`}>
              <span className={`w-2 h-2 rounded-full ${PLATFORM_DOT[fields.platform] || 'bg-gray-400'}`} />
              {fields.platform}
            </span>
            <button
              onClick={onClose}
              className="p-1 text-gray-500 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 flex-1">
          <div>
            <label className="block text-[9px] font-mono font-black text-gray-500 uppercase tracking-widest mb-1.5">
              Objetivo Narrativo
            </label>
            <textarea
              rows={2}
              value={fields.narrative_goal}
              onChange={set('narrative_goal')}
              placeholder="Objetivo narrativo..."
              className="w-full bg-[var(--surface-highest)] border border-[var(--outline-variant)] focus:border-[var(--secondary)] px-3 py-2 text-[11px] font-mono text-white outline-none transition-colors resize-none rounded-sm"
            />
          </div>

          <div>
            <label className="block text-[9px] font-mono font-black text-gray-500 uppercase tracking-widest mb-1.5">
              Caption
            </label>
            <textarea
              rows={4}
              value={fields.caption}
              onChange={set('caption')}
              placeholder="Caption / texto..."
              className="w-full bg-[var(--surface-highest)] border border-[var(--outline-variant)] focus:border-[var(--secondary)] px-3 py-2 text-[11px] font-mono text-white outline-none transition-colors resize-y rounded-sm"
            />
          </div>

          <div>
            <label className="block text-[9px] font-mono font-black text-gray-500 uppercase tracking-widest mb-1.5">
              Hashtags
            </label>
            <input
              type="text"
              value={fields.hashtags}
              onChange={set('hashtags')}
              placeholder="#hashtag1 #hashtag2"
              className="w-full bg-[var(--surface-highest)] border border-[var(--outline-variant)] focus:border-[var(--secondary)] px-3 py-2 text-[11px] font-mono text-white outline-none transition-colors rounded-sm"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-[9px] font-mono font-black text-gray-500 uppercase tracking-widest mb-1.5">
                Fecha
              </label>
              <input
                type="date"
                value={fields.scheduled_date}
                onChange={set('scheduled_date')}
                className="w-full bg-[var(--surface-highest)] border border-[var(--outline-variant)] focus:border-[var(--secondary)] px-3 py-2 text-[11px] font-mono text-white outline-none transition-colors rounded-sm"
              />
            </div>
            <div className="w-32">
              <label className="block text-[9px] font-mono font-black text-gray-500 uppercase tracking-widest mb-1.5">
                Hora
              </label>
              <input
                type="time"
                value={fields.scheduled_time || ''}
                onChange={set('scheduled_time')}
                className="w-full bg-[var(--surface-highest)] border border-[var(--outline-variant)] focus:border-[var(--secondary)] px-3 py-2 text-[11px] font-mono text-white outline-none transition-colors rounded-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-[9px] font-mono font-black text-gray-500 uppercase tracking-widest mb-1.5">
              Plataforma
            </label>
            <div className="flex gap-2 flex-wrap">
              {PLATFORMS.map(p => (
                <button
                  key={p}
                  onClick={() => setFields(f => ({ ...f, platform: p }))}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-mono font-black uppercase tracking-widest border transition-all rounded-sm
                    ${fields.platform === p
                      ? 'border-[var(--secondary)]/60 bg-[var(--secondary)]/10 text-[var(--secondary)]'
                      : 'border-[var(--outline-variant)] text-gray-500 hover:text-gray-300'
                    }`}
                >
                  <span className={`w-2 h-2 rounded-full ${PLATFORM_DOT[p] || 'bg-gray-400'}`} />
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t border-[var(--outline-variant)]">
          <div>
            {!isCreate && (
              <button
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-3 py-2 text-[9px] font-mono font-black uppercase tracking-widest text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-all rounded-sm"
              >
                <Trash2 size={12} /> Eliminar
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="btn-secondary py-2 px-4 text-[9px]"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="btn-primary py-2 px-4 text-[9px] flex items-center gap-1.5"
            >
              <Check size={12} /> Guardar
            </button>
            {!isCreate && (
              <button
                onClick={handleApprove}
                className={`flex items-center gap-1.5 px-4 py-2 text-[9px] font-mono font-black uppercase tracking-widest border transition-all rounded-sm
                  ${post.is_approved
                    ? 'border-green-500/60 bg-green-500/10 text-green-400 hover:bg-green-500/20'
                    : 'border-[var(--outline-variant)] text-gray-500 hover:text-white hover:border-[var(--secondary)]/40'
                  }`}
              >
                <Check size={12} />
                {post.is_approved ? 'Aprobado' : 'Aprobar'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetailModal;
