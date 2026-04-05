import React, { useState } from 'react';
import { Check, X, RefreshCw, Zap, Instagram, Facebook, Youtube, Music } from 'lucide-react';

const PLATFORM_ICONS = {
  instagram: Instagram,
  facebook:  Facebook,
  youtube:   Youtube,
  tiktok:    Music,
};

const PLATFORM_COLORS = {
  instagram: 'text-pink-400 border-pink-500/40 bg-pink-500/10',
  facebook:  'text-blue-400 border-blue-500/40 bg-blue-500/10',
  youtube:   'text-red-400  border-red-500/40  bg-red-500/10',
  tiktok:    'text-white    border-white/20    bg-white/5',
};

// ── SignalRow ─────────────────────────────────────────────────────────────────
const SignalRow = ({ post, onApprove, onReject, onRefine, onEdit }) => {
  const [showRefine, setShowRefine] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [refining, setRefining] = useState(false);

  const PlatformIcon = PLATFORM_ICONS[post.platform?.toLowerCase()] || Music;
  const colorCls = PLATFORM_COLORS[post.platform?.toLowerCase()] || 'text-gray-400 border-gray-600/40 bg-gray-800/20';

  const handleRefine = async () => {
    if (!feedback.trim()) return;
    setRefining(true);
    await onRefine(post.id, feedback);
    setFeedback('');
    setShowRefine(false);
    setRefining(false);
  };

  return (
    <div
      data-testid="signal-row"
      className={`group surface-card p-0 transition-all cursor-pointer ${post.is_approved ? 'border-l-2 border-l-[var(--secondary)]' : 'border-l-2 border-l-transparent'}`}
      onClick={() => onEdit?.(post)}
    >
      <div className="flex">
        {/* Platform icon column */}
        <div className={`flex-shrink-0 w-14 flex items-center justify-center border-r border-[var(--outline-variant)] ${colorCls}`}>
          <PlatformIcon size={20} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 p-5">
          {/* Header row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className={`text-[9px] font-mono font-black uppercase tracking-widest flex-shrink-0 ${colorCls.split(' ')[0]}`}>
                {post.platform}
              </span>
              {post.scheduled_date && (
                <span className="text-[8px] font-mono text-gray-600 flex-shrink-0">{post.scheduled_date}</span>
              )}
              {post.concept_title && (
                <span className="text-[9px] font-mono text-gray-600 uppercase tracking-widest truncate">
                  · {post.concept_title}
                </span>
              )}
            </div>

            {/* Hover actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-4" onClick={e => e.stopPropagation()}>
              <button
                onClick={() => onApprove(post.id)}
                title="Aprobar"
                className={`p-2 border transition-all ${post.is_approved
                  ? 'border-[var(--secondary)]/50 bg-[var(--secondary)]/20 text-[var(--secondary)]'
                  : 'border-[var(--outline-variant)] text-gray-600 hover:border-[var(--secondary)]/50 hover:text-[var(--secondary)]'}`}
              >
                <Check size={12} />
              </button>
              <button
                onClick={() => setShowRefine(v => !v)}
                title="Refinar con IA"
                className={`p-2 border transition-all ${showRefine
                  ? 'border-[var(--primary)]/50 bg-[var(--primary)]/20 text-[var(--primary)]'
                  : 'border-[var(--outline-variant)] text-gray-600 hover:border-[var(--primary)]/50 hover:text-[var(--primary)]'}`}
              >
                <RefreshCw size={12} />
              </button>
              <button
                onClick={() => onReject(post.id)}
                title="Eliminar"
                className="p-2 border border-[var(--outline-variant)] text-gray-600 hover:border-red-500/50 hover:text-red-400 transition-all"
              >
                <X size={12} />
              </button>
            </div>
          </div>

          {/* Caption */}
          {post.caption ? (
            <p className="text-sm font-mono text-gray-300 leading-relaxed whitespace-pre-line">
              {post.caption}
            </p>
          ) : (
            <p className="text-xs font-mono text-gray-600 italic">Señal pendiente de generación...</p>
          )}

          {post.hashtags?.length > 0 && (
            <p className="text-[10px] font-mono text-[var(--primary)]/70 mt-3 leading-relaxed">
              {post.hashtags.join(' ')}
            </p>
          )}

          {/* Refine input */}
          {showRefine && (
            <div className="mt-4 space-y-2">
              <input
                type="text"
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                placeholder="Ej: Hacelo más épico, menos corporativo..."
                className="w-full bg-[var(--surface-highest)] border border-[var(--outline-variant)] focus:border-[var(--secondary)] p-2 text-xs font-mono text-white outline-none transition-colors"
                onKeyDown={e => e.key === 'Enter' && handleRefine()}
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={handleRefine}
                  disabled={refining || !feedback.trim()}
                  className="flex-1 text-[9px] font-mono font-black uppercase py-1.5 bg-[var(--secondary)]/20 text-[var(--secondary)] border border-[var(--secondary)]/40 hover:bg-[var(--secondary)]/30 transition-all disabled:opacity-40 flex items-center justify-center"
                >
                  {refining ? <RefreshCw size={10} className="animate-spin" /> : 'Refinar →'}
                </button>
                <button
                  onClick={() => setShowRefine(false)}
                  className="px-3 text-gray-600 hover:text-white border border-[var(--outline-variant)] transition-colors"
                >
                  <X size={10} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── SignalFeed ────────────────────────────────────────────────────────────────
const SignalFeed = ({
  batch,
  selectedDay = null,
  onApprovePost,
  onRejectPost,
  onRefinePost,
  onEditPost,
  onGenerateSignals,
  onApproveBatch,
  approving,
  generatingSignals,
}) => {
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

  const approved = allPosts.filter(p => p.is_approved).length;
  const total    = allPosts.length;
  const hasSignals = allPosts.some(p => p.caption);

  return (
    <div className="space-y-2">
      {/* Minimal status strip */}
      {selectedDay && (
        <div className="text-[8px] font-mono text-gray-600 uppercase tracking-widest px-1">
          Filtrando: {selectedDay.year}-{String(selectedDay.month + 1).padStart(2, '0')}-{String(selectedDay.day).padStart(2, '0')} · {visiblePosts.length} señales
        </div>
      )}

      {/* Signal rows */}
      <div className="space-y-2">
        {visiblePosts.length === 0 ? (
          <div className="surface-card p-16 flex items-center justify-center">
            <p className="text-[10px] font-mono font-black text-gray-700 uppercase tracking-widest">
              Sin señales en este rango
            </p>
          </div>
        ) : (
          visiblePosts.map(post => (
            <SignalRow
              key={post.id}
              post={post}
              onApprove={onApprovePost}
              onReject={onRejectPost}
              onRefine={onRefinePost}
              onEdit={onEditPost}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default SignalFeed;
