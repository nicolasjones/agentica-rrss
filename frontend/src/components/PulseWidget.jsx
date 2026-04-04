/**
 * PulseWidget — ADN Telemetry bar for the Strategic Planner header.
 * Displays: confidence score gauge, regional sync status, active pattern nodes.
 * Design: minimal, monospace, dark-glass aesthetic matching the Planner.
 */

import React from 'react';
import { Activity, Globe, Cpu } from 'lucide-react';

const ConfidenceBar = ({ score }) => {
  const pct = Math.round((score || 0) * 100);
  const color =
    pct >= 70 ? 'bg-[var(--secondary)]' :
    pct >= 40 ? 'bg-yellow-500' :
    'bg-red-500/70';

  return (
    <div className="flex items-center gap-2">
      <Activity size={10} className="text-gray-500 shrink-0" />
      <div className="flex items-center gap-1.5">
        <div className="w-20 h-1 bg-white/5 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${color}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-[9px] font-mono font-black tabular-nums" style={{
          color: pct >= 70 ? 'var(--secondary)' : pct >= 40 ? '#eab308' : '#f87171'
        }}>
          {pct}%
        </span>
      </div>
      <span className="text-[8px] font-mono text-gray-600 uppercase tracking-widest hidden sm:block">
        Confianza ADN
      </span>
    </div>
  );
};

const RegionalSync = ({ active }) => (
  <div className="flex items-center gap-1.5">
    <Globe size={10} className={active ? 'text-[var(--secondary)]' : 'text-gray-600'} />
    <span className={`text-[8px] font-mono uppercase tracking-widest ${active ? 'text-[var(--secondary)]' : 'text-gray-600'}`}>
      {active ? 'Slang ✓' : 'Slang —'}
    </span>
  </div>
);

const PatternNodes = ({ nodes }) => {
  if (!nodes || nodes.length === 0) {
    return (
      <div className="flex items-center gap-1.5 text-gray-700">
        <Cpu size={10} />
        <span className="text-[8px] font-mono uppercase tracking-widest">Sin patrones</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <Cpu size={10} className="text-gray-500 shrink-0" />
      <div className="flex items-center gap-1 flex-wrap">
        {nodes.slice(0, 3).map((n, i) => (
          <span
            key={i}
            className="px-1.5 py-0.5 text-[7px] font-mono uppercase tracking-wider bg-white/5 border border-white/10 text-gray-400 rounded-sm"
            title={n.name}
          >
            {n.name.length > 18 ? n.name.slice(0, 18) + '…' : n.name}
          </span>
        ))}
        {nodes.length > 3 && (
          <span className="text-[7px] font-mono text-gray-600">+{nodes.length - 3}</span>
        )}
      </div>
    </div>
  );
};

const PulseWidget = ({ pulse, loading }) => {
  if (loading) {
    return (
      <div className="flex items-center gap-4 px-4 py-2 border border-white/5 bg-white/2 rounded-sm animate-pulse">
        <div className="w-32 h-2 bg-white/5 rounded" />
        <div className="w-16 h-2 bg-white/5 rounded" />
      </div>
    );
  }

  if (!pulse) return null;

  return (
    <div className="flex flex-wrap items-center gap-4 px-4 py-2 border border-white/5 bg-black/20 rounded-sm">
      <ConfidenceBar score={pulse.confidence_score} />
      <div className="w-px h-3 bg-white/10 hidden sm:block" />
      <RegionalSync active={pulse.regional_sync} />
      <div className="w-px h-3 bg-white/10 hidden md:block" />
      <PatternNodes nodes={pulse.active_nodes} />
    </div>
  );
};

export default PulseWidget;
