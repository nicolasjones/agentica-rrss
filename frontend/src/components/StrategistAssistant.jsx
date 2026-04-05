import React, { useState, useEffect, useRef } from 'react';
import { Send, Brain, Sparkles, Terminal, Activity, X } from 'lucide-react';
import { useActiveProject } from '../context/ActiveProjectContext';

/**
 * StrategistAssistant: El cerebro omnipresente de Agenmatica.
 * Gestiona el chat con la IA y lanza señales rápidas al sistema.
 */
const StrategistAssistant = ({ onClose }) => {
  const { activeBandId } = useActiveProject();
  const [messages, setMessages] = useState([
    { id: 1, role: 'ai', content: 'Protocolo de asistencia activado. ¿Qué estrategia desplegamos hoy?' },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typing]);

  const handleSend = (e) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { id: Date.now(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setTyping(true);

    // Mock AI Response - En el futuro se conecta a un stream de LangGraph
    setTimeout(() => {
      setTyping(false);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'ai',
        content: `Analizando señal estratégica de ${input}... Recomiendo optimizar el volumen en el Calendario Mensual para maximizar el Match Rate.`
      }]);
    }, 1500);
  };

  return (
    <div className="h-full flex flex-col bg-[var(--surface-high)] border-l border-[var(--outline-variant)] shadow-2xl relative">
      {/* Header */}
      <div className="p-6 border-b border-[var(--outline-variant)] bg-[var(--surface-highest)] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-sm bg-[var(--primary)]/20 border border-[var(--primary)]/40 flex items-center justify-center animate-pulse">
            <Brain size={16} className="text-[var(--primary)]" />
          </div>
          <div>
            <h3 className="text-[11px] font-mono font-black text-white uppercase tracking-[0.2em]">Strategist Agent</h3>
            <span className="text-[8px] font-mono text-[var(--secondary)] font-black uppercase tracking-widest flex items-center gap-1.5 leading-none">
              <span className="w-1 h-1 rounded-full bg-[var(--secondary)]" /> Online / Ecosistema: {activeBandId ? activeBandId.slice(0, 8) : 'NONE'}
            </span>
          </div>
        </div>
        <button onClick={onClose} className="text-gray-600 hover:text-white transition-colors">
          <X size={18} />
        </button>
      </div>

      {/* Messages - Terminal Style */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]"
      >
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-sm border ${
              msg.role === 'user' 
                ? 'bg-white/5 border-white/10 text-white' 
                : 'bg-[var(--primary)]/5 border-[var(--primary)]/20 text-[var(--primary)]/90 shadow-[0_0_20px_rgba(204,151,255,0.05)]'
            }`}>
              <div className="flex items-center gap-2 mb-2 opacity-50 group">
                {msg.role === 'ai' ? <Sparkles size={10} /> : <Terminal size={10} />}
                <span className="text-[8px] font-mono font-black uppercase tracking-widest">{msg.role === 'ai' ? 'Agent Insight' : 'Command'}</span>
              </div>
              <p className="text-[10px] font-mono leading-relaxed tracking-tight whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex justify-start">
            <div className="p-4 bg-[var(--primary)]/5 border border-[var(--primary)]/20 animate-pulse rounded-sm">
                <span className="text-[8px] font-mono font-black text-[var(--primary)] uppercase tracking-widest">Analizando Señal...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-6 border-t border-[var(--outline-variant)] bg-[var(--surface-highest)]">
        <form onSubmit={handleSend} className="relative group">
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="INJECT STRATEGY COMMAND..."
            className="w-full bg-black border border-[var(--outline-variant)] hover:border-[var(--primary)]/40 focus:border-[var(--primary)] transition-all p-4 pr-12 text-[10px] font-mono font-black text-white uppercase placeholder:text-gray-700 outline-none rounded-sm"
          />
          <button 
            type="submit"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-700 hover:text-[var(--primary)] transition-colors group-hover:text-gray-500"
          >
            <Send size={18} />
          </button>
        </form>
        <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-4 text-[7px] font-mono text-gray-700 uppercase font-black tracking-widest">
                <div className="flex items-center gap-1.5"><Activity size={8} className="text-[var(--secondary)]" /> Pulse Input: Active</div>
                <div className="flex items-center gap-1.5"><Sparkles size={8} className="text-[var(--primary)]" /> Context: Global</div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default StrategistAssistant;
