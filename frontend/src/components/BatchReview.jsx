import React, { useState } from 'react';
import { Check, X, RefreshCw, ChevronDown, ChevronUp, Instagram, Facebook, Youtube, Music, Zap } from 'lucide-react';

const PLATFORM_ICONS = {
  instagram: Instagram,
  facebook: Facebook,
  youtube: Youtube,
  tiktok: Music,
};

const PLATFORM_COLORS = {
  instagram: 'text-pink-400 border-pink-500/30 bg-pink-500/10',
  facebook: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
  youtube: 'text-red-400 border-red-500/30 bg-red-500/10',
  tiktok: 'text-white border-white/20 bg-white/5',
};

// ── ConceptCard (modo strategy) ──────────────────────────────────────────────
const ConceptCard = ({ post, onApprove, onReject }) => {
  const PlatformIcon = PLATFORM_ICONS[post.platform?.toLowerCase()] || Music;
  const colorCls = PLATFORM_COLORS[post.platform?.toLowerCase()] || 'text-gray-400 border-gray-600 bg-gray-800';

  return (
    <div className={`surface-card p-0 transition-all ${post.is_approved ? 'border-l-2 border-l-[var(--secondary)]' : ''}`}>
      {/* Platform header */}
      <div className={`px-4 py-2 flex items-center justify-between border-b border-[var(--outline-variant)] ${colorCls}`}>
        <div className="flex items-center gap-2">
          <PlatformIcon size={12} />
          <span className="text-[9px] font-mono font-black uppercase tracking-widest">{post.platform}</span>
        </div>
        {post.scheduled_date && (
          <span className="text-[8px] font-mono text-gray-500">{post.scheduled_date}</span>
        )}
      </div>

      {/* Concept content */}
      <div className="p-4">
        {post.concept_title && (
          <p className="text-sm font-mono text-white font-bold leading-snug">
            {post.concept_title}
          </p>
        )}
        {post.narrative_goal && (
          <p className="text-xs font-mono text-gray-400 leading-relaxed mt-1">
            {post.narrative_goal}
          </p>
        )}
      </div>

      {/* Actions: solo Aprobar y Rechazar */}
      <div className="border-t border-[var(--outline-variant)] flex">
        <button
          onClick={() => onApprove(post.id)}
          className={`flex-1 py-2.5 text-[9px] font-mono font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5
            ${post.is_approved
              ? 'bg-[var(--secondary)]/20 text-[var(--secondary)]'
              : 'text-gray-600 hover:text-[var(--secondary)] hover:bg-[var(--secondary)]/10'
            }`}
        >
          <Check size={10} /> {post.is_approved ? 'Aprobado' : 'Aprobar'}
        </button>
        <div className="w-px bg-[var(--outline-variant)]" />
        <button
          onClick={() => onReject(post.id)}
          className="flex-1 py-2.5 text-[9px] font-mono font-black uppercase tracking-widest text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all flex items-center justify-center gap-1.5"
        >
          <X size={10} /> Rechazar
        </button>
      </div>
    </div>
  );
};

// ── SignalCard (modo production) ─────────────────────────────────────────────
const SignalCard = ({ post, onApprove, onReject, onRefine }) => {
  const [showRefine, setShowRefine] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [refining, setRefining] = useState(false);

  const PlatformIcon = PLATFORM_ICONS[post.platform?.toLowerCase()] || Music;
  const colorCls = PLATFORM_COLORS[post.platform?.toLowerCase()] || 'text-gray-400 border-gray-600 bg-gray-800';

  const handleRefine = async () => {
    if (!feedback.trim()) return;
    setRefining(true);
    await onRefine(post.id, feedback);
    setFeedback('');
    setShowRefine(false);
    setRefining(false);
  };

  return (
    <div className={`surface-card p-0 transition-all ${post.is_approved ? 'border-l-2 border-l-[var(--secondary)]' : ''}`}>
      {/* Platform header */}
      <div className={`px-4 py-2 flex items-center justify-between border-b border-[var(--outline-variant)] ${colorCls}`}>
        <div className="flex items-center gap-2">
          <PlatformIcon size={12} />
          <span className="text-[9px] font-mono font-black uppercase tracking-widest">{post.platform}</span>
        </div>
        {post.scheduled_date && (
          <span className="text-[8px] font-mono text-gray-500">{post.scheduled_date}</span>
        )}
      </div>

      {/* Caption */}
      <div className="p-4">
        {post.concept_title && (
          <p className="text-[9px] text-gray-600 font-mono uppercase tracking-widest mb-1">
            {post.concept_title}
          </p>
        )}
        {post.caption ? (
          <p className="text-sm font-mono text-gray-300 leading-relaxed whitespace-pre-line">{post.caption}</p>
        ) : (
          <p className="text-xs font-mono text-gray-600 italic">Señal pendiente de generación...</p>
        )}
        {post.hashtags?.length > 0 && (
          <p className="text-[10px] font-mono text-[var(--primary)]/70 mt-2 leading-relaxed">
            {post.hashtags.join(' ')}
          </p>
        )}
      </div>

      {/* Refine panel */}
      {showRefine && (
        <div className="px-4 pb-4 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <input
            type="text"
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            placeholder="Ej: Hacelo más épico, menos corporativo..."
            className="w-full bg-[var(--surface-highest)] border border-[var(--outline-variant)] focus:border-[var(--secondary)] p-2 text-xs font-mono text-white outline-none rounded-sm transition-colors"
            onKeyDown={e => e.key === 'Enter' && handleRefine()}
          />
          <div className="flex gap-2">
            <button
              onClick={handleRefine}
              disabled={refining || !feedback.trim()}
              className="flex-1 text-[9px] font-mono font-black uppercase py-1.5 bg-[var(--secondary)]/20 text-[var(--secondary)] border border-[var(--secondary)]/40 hover:bg-[var(--secondary)]/30 transition-all disabled:opacity-40"
            >
              {refining ? <RefreshCw size={10} className="animate-spin mx-auto" /> : 'Refinar →'}
            </button>
            <button onClick={() => setShowRefine(false)} className="px-3 text-gray-600 hover:text-white border border-[var(--outline-variant)] transition-colors">
              <X size={10} />
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="border-t border-[var(--outline-variant)] flex">
        <button
          onClick={() => onApprove(post.id)}
          className={`flex-1 py-2.5 text-[9px] font-mono font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5
            ${post.is_approved
              ? 'bg-[var(--secondary)]/20 text-[var(--secondary)]'
              : 'text-gray-600 hover:text-[var(--secondary)] hover:bg-[var(--secondary)]/10'
            }`}
        >
          <Check size={10} /> {post.is_approved ? 'Aprobado' : 'Aprobar'}
        </button>
        <div className="w-px bg-[var(--outline-variant)]" />
        <button
          onClick={() => setShowRefine(v => !v)}
          className="flex-1 py-2.5 text-[9px] font-mono font-black uppercase tracking-widest text-gray-600 hover:text-[var(--secondary)] hover:bg-[var(--secondary)]/10 transition-all flex items-center justify-center gap-1.5"
        >
          <RefreshCw size={10} /> Refinar
        </button>
        <div className="w-px bg-[var(--outline-variant)]" />
        <button
          onClick={() => onReject(post.id)}
          className="flex-1 py-2.5 text-[9px] font-mono font-black uppercase tracking-widest text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all flex items-center justify-center gap-1.5"
        >
          <X size={10} /> Rechazar
        </button>
      </div>
    </div>
  );
};

// ── BatchReview ──────────────────────────────────────────────────────────────
const BatchReview = ({
  batch,
  mode = 'strategy',
  selectedDay = null,
  onApprovePost,
  onRejectPost,
  onRefinePost,
  onGenerateSignals,
  onApproveBatch,
  approving,
  generatingSignals,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  if (!batch) return null;

  const allPosts = batch.posts ?? [];

  const visiblePosts = selectedDay
    ? allPosts.filter(p => {
        if (!p.scheduled_date) return false;
        const d = new Date(p.scheduled_date + 'T00:00:00');
        return (
          d.getFullYear() === selectedDay.year &&
          d.getMonth() === selectedDay.month &&
          d.getDate() === selectedDay.day
        );
      })
    : allPosts;

  const filteredBatch = { ...batch, posts: visiblePosts };

  const approved = allPosts.filter(p => p.is_approved).length;
  const total = allPosts.length;

  const isStrategy = mode === 'strategy';

  return (
    <div className="space-y-4">
      {/* Batch header */}
      <div className="surface-card p-5 border-l-2 border-l-[var(--secondary)] flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="label-tech mb-0 text-[var(--secondary)]">Batch Propuesto</span>
            {/* Mode badge */}
            {isStrategy ? (
              <span className="text-[8px] font-mono font-black uppercase tracking-widest px-2 py-0.5 bg-[var(--secondary)]/10 text-[var(--secondary)] border border-[var(--secondary)]/30">
                MAPA
              </span>
            ) : (
              <span className="text-[8px] font-mono font-black uppercase tracking-widest px-2 py-0.5 bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/30">
                SEÑAL
              </span>
            )}
          </div>
          <p className="text-xs font-mono text-gray-400 uppercase">
            {batch.timeframe} · {total} posts · {approved}/{total} aprobados
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCollapsed(v => !v)}
            className="text-gray-600 hover:text-white transition-colors"
          >
            {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>

          {/* Footer action button */}
          {isStrategy ? (
            <button
              onClick={() => onGenerateSignals(batch.id)}
              disabled={approved === 0 || generatingSignals}
              className="btn-secondary py-2 px-6 text-xs disabled:opacity-40 flex items-center gap-2"
            >
              {generatingSignals
                ? <><RefreshCw size={12} className="animate-spin" /> Generando señales...</>
                : <><Zap size={12} /> Generar Señales ({approved})</>
              }
            </button>
          ) : (
            <button
              onClick={() => onApproveBatch(batch.id)}
              disabled={approved === 0 || approving}
              className="btn-secondary py-2 px-6 text-xs disabled:opacity-40"
            >
              {approving ? 'Publicando...' : `Publicar Batch (${approved}/${total})`}
            </button>
          )}
        </div>
      </div>

      {/* Posts grid */}
      {!collapsed && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
          {selectedDay && (
            <div className="col-span-full text-[8px] font-mono font-black text-[var(--secondary)] uppercase tracking-widest px-1 pb-1">
              Filtrando: {selectedDay.year}-{String(selectedDay.month + 1).padStart(2, '0')}-{String(selectedDay.day).padStart(2, '0')} · {visiblePosts.length} posts
            </div>
          )}
          {filteredBatch.posts?.map(post =>
            isStrategy ? (
              <ConceptCard
                key={post.id}
                post={post}
                onApprove={onApprovePost}
                onReject={onRejectPost}
              />
            ) : (
              <SignalCard
                key={post.id}
                post={post}
                onApprove={onApprovePost}
                onReject={onRejectPost}
                onRefine={onRefinePost}
              />
            )
          )}
        </div>
      )}
    </div>
  );
};

export default BatchReview;
