import { useState } from 'react';
import { X, Facebook, Instagram, Youtube, Music, Check, RefreshCw } from 'lucide-react';

const PLATFORMS = [
  { key: 'instagram', label: 'Instagram', Icon: Instagram, color: 'text-pink-400', border: 'border-pink-500/40', bg: 'bg-pink-500/10' },
  { key: 'facebook',  label: 'Facebook',  Icon: Facebook,  color: 'text-blue-400',  border: 'border-blue-500/40',  bg: 'bg-blue-500/10' },
  { key: 'youtube',   label: 'YouTube',   Icon: Youtube,   color: 'text-red-400',   border: 'border-red-500/40',   bg: 'bg-red-500/10' },
  { key: 'tiktok',    label: 'TikTok',    Icon: Music,     color: 'text-white',     border: 'border-white/20',     bg: 'bg-white/5' },
];

const PlatformConnectModal = ({ onConnect, onClose, connectedKeys = [] }) => {
  const [selected, setSelected] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [done, setDone] = useState(false);

  const handleConnect = async () => {
    if (!selected) return;
    setConnecting(true);
    await new Promise(r => setTimeout(r, 900));
    await onConnect(selected);
    setConnecting(false);
    setDone(true);
    setTimeout(onClose, 800);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[var(--surface-low)] border border-[var(--outline-variant)] w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--outline-variant)] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-display font-black text-white uppercase italic tracking-widest">Deploy Signal Node</h3>
            <p className="text-[9px] font-mono text-gray-600 uppercase tracking-widest mt-0.5">Selecciona la plataforma a autenticar</p>
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-white transition-colors p-1">
            <X size={14} />
          </button>
        </div>

        {/* Platform grid */}
        <div className="p-6 grid grid-cols-2 gap-4">
          {PLATFORMS.map(({ key, label, Icon, color, border, bg }) => {
            const isConnected = connectedKeys.includes(key);
            const isSelected  = selected === key;
            return (
              <button
                key={key}
                onClick={() => !isConnected && setSelected(key)}
                disabled={isConnected}
                className={`relative p-6 flex flex-col items-center gap-3 border-2 transition-all duration-200
                  ${isConnected
                    ? `${bg} ${border} opacity-40 cursor-not-allowed`
                    : isSelected
                      ? `${bg} ${border} shadow-[0_0_20px_var(--primary)/20] scale-[1.02]`
                      : `border-[var(--outline-variant)] hover:${border} hover:${bg}`
                  }`}
              >
                {isConnected && (
                  <div className="absolute top-2 right-2">
                    <Check size={10} className="text-[var(--secondary)]" />
                  </div>
                )}
                <Icon size={32} className={isSelected ? color : isConnected ? color : 'text-gray-600'} />
                <span className={`text-[9px] font-mono font-black uppercase tracking-widest ${isSelected ? 'text-white' : 'text-gray-500'}`}>
                  {label}
                </span>
                {isSelected && (
                  <div className="absolute inset-0 border-2 border-[var(--primary)] animate-pulse pointer-events-none" />
                )}
              </button>
            );
          })}
        </div>

        {/* Action */}
        <div className="px-6 pb-6">
          <button
            onClick={handleConnect}
            disabled={!selected || connecting || done}
            className="w-full btn-primary py-3 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {done
              ? <><Check size={14} /> Nodo autenticado</>
              : connecting
                ? <><RefreshCw size={14} className="animate-spin" /> Conectando...</>
                : 'Autenticar Nodo →'
            }
          </button>
          <p className="text-[8px] font-mono text-gray-700 uppercase text-center mt-3 tracking-widest">
            Simulación Mock · OAuth real en v3.0
          </p>
        </div>
      </div>
    </div>
  );
};

export default PlatformConnectModal;
