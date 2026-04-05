import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

/**
 * HelpTooltip: Componente de asistencia contextual Agenmatica.
 * Muestra un icono de información (i) y revela un mensaje explicativo al hover.
 */
const HelpTooltip = ({ message, position = 'top' }) => {
  const [show, setShow] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  };

  return (
    <div className="relative inline-flex items-center ml-2 group"
         onMouseEnter={() => setShow(true)}
         onMouseLeave={() => setShow(false)}>
      <HelpCircle 
        size={14} 
        className="text-gray-600 hover:text-[var(--primary)] transition-colors cursor-help" 
      />
      
      {show && (
        <div className={`absolute ${positionClasses[position]} z-[100] w-48 p-3 bg-[var(--surface-high)] border border-[var(--outline-variant)] shadow-2xl rounded-sm pointer-events-none`}>
          <div className="text-[10px] font-mono text-gray-300 leading-relaxed uppercase tracking-tighter">
            <span className="text-[var(--primary)] font-black block mb-1">IA Insights:</span>
            {message}
          </div>
          {/* Arrow */}
          <div className={`absolute w-2 h-2 bg-[var(--surface-high)] border-r border-b border-[var(--outline-variant)] rotate-45 
            ${position === 'top' ? '-bottom-1 left-1/2 -translate-x-1/2' : ''}
            ${position === 'bottom' ? '-top-1 left-1/2 -translate-x-1/2' : ''}
          `} />
        </div>
      )}
    </div>
  );
};

export default HelpTooltip;
