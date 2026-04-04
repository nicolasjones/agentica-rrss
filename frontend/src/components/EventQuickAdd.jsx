import React, { useState } from 'react';
import { Send, Loader, Check } from 'lucide-react';
import { eventsAPI } from '../services/api';

const EventQuickAdd = ({ bandId, bandName, onEventsCreated }) => {
  const [text, setText] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [detectedCount, setDetectedCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async () => {
    const msg = text.trim();
    if (!msg || status === 'loading') return;

    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await eventsAPI.interpret(msg, bandName, bandId);
      const events = res.data?.events || [];
      setDetectedCount(events.length);
      setStatus('success');
      setText('');
      onEventsCreated?.();
      setTimeout(() => setStatus('idle'), 2500);
    } catch (err) {
      setErrorMsg('Error al interpretar. Intentá de nuevo.');
      setStatus('error');
      setTimeout(() => setStatus('idle'), 2500);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={status === 'loading'}
          placeholder="Ej: Tocamos el 15 de mayo en Niceto..."
          className="bg-[var(--surface-highest)] border border-[var(--outline-variant)] focus:border-[var(--secondary)] px-3 py-2 text-[10px] font-mono text-white outline-none transition-colors rounded-sm w-64 disabled:opacity-50"
        />
        <button
          onClick={handleSubmit}
          disabled={status === 'loading' || !text.trim()}
          className="flex items-center gap-1.5 px-3 py-2 text-[9px] font-mono font-black uppercase tracking-widest border border-[var(--outline-variant)] text-gray-500 hover:text-white hover:border-[var(--secondary)]/40 transition-all disabled:opacity-40 rounded-sm"
        >
          {status === 'loading'
            ? <Loader size={12} className="animate-spin" />
            : <Send size={12} />
          }
        </button>
      </div>

      {status === 'loading' && (
        <span className="text-[9px] font-mono text-[var(--secondary)] animate-pulse">
          Interpretando...
        </span>
      )}

      {status === 'success' && (
        <span className="text-[9px] font-mono text-green-400 flex items-center gap-1">
          <Check size={10} /> {detectedCount} evento{detectedCount !== 1 ? 's' : ''} detectado{detectedCount !== 1 ? 's' : ''}
        </span>
      )}

      {status === 'error' && (
        <span className="text-[9px] font-mono text-red-400">{errorMsg}</span>
      )}
    </div>
  );
};

export default EventQuickAdd;
