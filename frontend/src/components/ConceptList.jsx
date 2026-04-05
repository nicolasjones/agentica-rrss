import React, { useState } from 'react';
import { Calendar, MapPin, Music, Megaphone, Star, HelpCircle, Instagram, Facebook, Youtube, Check, RefreshCw, X } from 'lucide-react';

const CATEGORY_ICONS = {
  gig:          Star,
  launch:       MapPin,
  bts:          Music,
  announcement: Megaphone,
  other:        HelpCircle,
};

const CATEGORY_COLORS = {
  gig:          'text-[var(--primary)] border-[var(--primary)]/40 bg-[var(--primary)]/10',
  launch:       'text-[var(--secondary)] border-[var(--secondary)]/40 bg-[var(--secondary)]/10',
  bts:          'text-yellow-400 border-yellow-500/40 bg-yellow-500/10',
  announcement: 'text-blue-400 border-blue-500/40 bg-blue-500/10',
  other:        'text-gray-400 border-gray-600/40 bg-gray-800/20',
};

const PLATFORM_ICONS = {
  instagram: Instagram,
  facebook:  Facebook,
  youtube:   Youtube,
  tiktok:    Music,
};

const PLATFORM_COLORS = {
  instagram: 'text-pink-400',
  facebook:  'text-blue-400',
  youtube:   'text-red-400',
  tiktok:    'text-white',
};

// ── ConceptRow ────────────────────────────────────────────────────────────────
const ConceptRow = ({ post, platformColor, PlatformIcon, onToggleApprove, onRefinePost, onRejectPost }) => {
  const [showRefine, setShowRefine] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [refining, setRefining] = useState(false);
  const isApproved = !!post.is_approved;

  const handleRefine = async () => {
    if (!feedback.trim()) return;
    setRefining(true);
    await onRefinePost?.(post.id, feedback);
    setFeedback('');
    setShowRefine(false);
    setRefining(false);
  };

  return (
    <div data-testid="concept-row" className={`group surface-card p-0 flex transition-all ${isApproved ? 'border-l-2 border-l-[var(--secondary)] opacity-100' : 'opacity-75 hover:opacity-100'}`}>
      <div className="flex-shrink-0 w-12 flex items-center justify-center border-r border-[var(--outline-variant)] bg-[var(--surface-dim)]">
        <PlatformIcon size={14} className={platformColor} />
      </div>
      <div className="flex-1 p-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[8px] font-mono font-black uppercase tracking-widest px-2 py-0.5 border ${
              isApproved
                ? 'border-[var(--secondary)]/40 bg-[var(--secondary)]/10 text-[var(--secondary)]'
                : 'border-[var(--outline-variant)] text-gray-600'
            }`}>
              {isApproved ? 'Accepted' : 'Draft'}
            </span>
            {post.platform && (
              <span className={`text-[8px] font-mono font-black uppercase tracking-widest ${platformColor}`}>
                {post.platform}
              </span>
            )}
          </div>
          {/* Action buttons — visible on hover */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onToggleApprove && (
              <button
                data-testid="approve-btn"
                onClick={() => onToggleApprove(post.id)}
                title={isApproved ? 'Desaprobar' : 'Aprobar'}
                className={`p-1.5 border transition-all ${isApproved
                  ? 'border-[var(--secondary)]/40 bg-[var(--secondary)]/10 text-[var(--secondary)] hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/40'
                  : 'border-[var(--outline-variant)] text-gray-600 hover:border-[var(--secondary)]/50 hover:text-[var(--secondary)]'}`}
              >
                <Check size={11} />
              </button>
            )}
            {onRefinePost && (
              <button
                onClick={() => setShowRefine(v => !v)}
                title="Refinar"
                className={`p-1.5 border transition-all ${showRefine
                  ? 'border-[var(--primary)]/40 bg-[var(--primary)]/10 text-[var(--primary)]'
                  : 'border-[var(--outline-variant)] text-gray-600 hover:border-[var(--primary)]/40 hover:text-[var(--primary)]'}`}
              >
                <RefreshCw size={11} />
              </button>
            )}
            {onRejectPost && (
              <button
                onClick={() => onRejectPost(post.id)}
                title="Eliminar"
                className="p-1.5 border border-[var(--outline-variant)] text-gray-600 hover:border-red-500/40 hover:text-red-400 transition-all"
              >
                <X size={11} />
              </button>
            )}
          </div>
        </div>

        {post.concept_title ? (
          <p className="text-sm font-mono font-bold text-gray-300">{post.concept_title}</p>
        ) : (
          <p className="text-sm font-mono text-gray-600 italic">Sin título</p>
        )}
        {post.narrative_goal && (
          <p className="text-xs font-mono text-gray-600 mt-0.5 leading-relaxed">{post.narrative_goal}</p>
        )}

        {/* Inline refine panel */}
        {showRefine && (
          <div className="mt-3 space-y-2">
            <input
              type="text"
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              placeholder="Ej: Enfocalo en el lanzamiento del álbum..."
              className="w-full bg-[var(--surface-highest)] border border-[var(--outline-variant)] focus:border-[var(--secondary)] px-3 py-1.5 text-xs font-mono text-white outline-none transition-colors"
              onKeyDown={e => e.key === 'Enter' && handleRefine()}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleRefine}
                disabled={refining || !feedback.trim()}
                className="flex-1 text-[8px] font-mono font-black uppercase py-1.5 bg-[var(--secondary)]/20 text-[var(--secondary)] border border-[var(--secondary)]/40 hover:bg-[var(--secondary)]/30 disabled:opacity-40 flex items-center justify-center transition-all"
              >
                {refining ? <RefreshCw size={10} className="animate-spin" /> : 'Refinar →'}
              </button>
              <button onClick={() => setShowRefine(false)} className="px-3 border border-[var(--outline-variant)] text-gray-600 hover:text-white transition-colors">
                <X size={10} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ── ConceptList ───────────────────────────────────────────────────────────────
const ConceptList = ({ events = [], posts = [], onToggleApprove, onRefinePost, onRejectPost }) => {
  // Merge events and concepts into a unified chronological timeline
  const items = [
    ...events.map(ev => ({ type: 'event',   date: ev.event_date,      data: ev })),
    ...posts.map(p  => ({ type: 'concept',  date: p.scheduled_date,   data: p  })),
  ].sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return a.date.localeCompare(b.date);
  });

  if (items.length === 0) {
    return (
      <div className="surface-card p-20 flex flex-col items-center justify-center text-center space-y-4">
        <Calendar size={32} className="text-gray-700" />
        <p className="text-[10px] font-mono font-black text-gray-600 uppercase tracking-widest">
          Sin eventos ni conceptos en el ecosistema
        </p>
        <p className="text-[9px] font-mono text-gray-700 uppercase tracking-widest">
          Agrega eventos para comenzar la planificación
        </p>
      </div>
    );
  }

  // Group items by date
  const grouped = {};
  items.forEach(item => {
    const key = item.date || 'sin-fecha';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(item);
  });

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([date, dateItems]) => (
        <div key={date}>
          {/* Date header */}
          <div className="flex items-center gap-3 mb-3">
            <span className="text-[9px] font-mono font-black text-gray-500 uppercase tracking-widest">
              {date === 'sin-fecha' ? 'Sin fecha asignada' : date}
            </span>
            <div className="flex-1 h-px bg-[var(--outline-variant)]" />
            <span className="text-[8px] font-mono text-gray-700">{dateItems.length} ítem{dateItems.length !== 1 ? 's' : ''}</span>
          </div>

          <div className="space-y-2">
            {dateItems.map((item, idx) => {
              if (item.type === 'event') {
                const ev = item.data;
                const colorCls = CATEGORY_COLORS[ev.category] || CATEGORY_COLORS.other;
                const Icon = CATEGORY_ICONS[ev.category] || CATEGORY_ICONS.other;

                return (
                  <div key={`ev-${ev.id}`} className="surface-card p-0 flex transition-all hover:brightness-110">
                    <div className={`flex-shrink-0 w-12 flex items-center justify-center border-r border-[var(--outline-variant)] ${colorCls}`}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[8px] font-mono font-black uppercase tracking-widest px-2 py-0.5 border ${colorCls}`}>
                          {ev.category || 'event'}
                        </span>
                        <span className="text-[8px] font-mono font-black text-gray-700 uppercase tracking-widest px-2 py-0.5 border border-[var(--outline-variant)]">
                          Ecosistema
                        </span>
                      </div>
                      <p className="text-sm font-display font-black text-white uppercase italic">{ev.title}</p>
                      {ev.description && (
                        <p className="text-xs font-mono text-gray-500 mt-1 leading-relaxed">{ev.description}</p>
                      )}
                    </div>
                  </div>
                );
              }

              // Concept (post draft in strategy mode)
              const post = item.data;
              const PlatformIcon = PLATFORM_ICONS[post.platform?.toLowerCase()] || Music;
              const platformColor = PLATFORM_COLORS[post.platform?.toLowerCase()] || 'text-gray-600';

              return (
                <ConceptRow
                  key={`post-${post.id}`}
                  post={post}
                  platformColor={platformColor}
                  PlatformIcon={PlatformIcon}
                  onToggleApprove={onToggleApprove}
                  onRefinePost={onRefinePost}
                  onRejectPost={onRejectPost}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ConceptList;
