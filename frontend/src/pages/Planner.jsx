import React, { useState, useEffect, useCallback } from 'react';
import { Zap, Calendar, List, RefreshCw, Brain, Map, Check } from 'lucide-react';
import CalendarView from '../components/CalendarView';
import ConceptList from '../components/ConceptList';
import SignalFeed from '../components/SignalFeed';
import PlatformSelector from '../components/PlatformSelector';
import PostDetailModal from '../components/PostDetailModal';
import StrategicAnchorCreator from '../components/StrategicAnchorCreator';
import { useActiveProject } from '../context/ActiveProjectContext';
import { useHeader } from '../context/HeaderContext';
import { eventsAPI, plannerAPI } from '../services/api';

// ── Volume selector: items count to generate ──────────────────────────────────
const VOLUMES = [
  { key: 5, label: '5 posts' },
  { key: 10, label: '10 posts' },
  { key: 15, label: '15 posts' },
];

const Planner = () => {
  const { activeBandId } = useActiveProject();
  const { updateHeader } = useHeader();

  const [events, setEvents] = useState([]);
  const [batch, setBatch] = useState(null);
  const [view, setView] = useState('calendar');   // 'calendar' | 'list'
  const [hubMode, setHubMode] = useState('strategy');   // 'strategy' (MAPA) | 'production' (SEÑAL)
  const [volume, setVolume] = useState(5);
  const [generating, setGenerating] = useState(false);
  const [approving, setApproving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState(['instagram', 'facebook', 'tiktok', 'youtube']);
  const [generatingSignals, setGeneratingSignals] = useState(false);
  const [modalState, setModalState] = useState({ open: false, post: null, date: null });
  const [selectedDay, setSelectedDay] = useState(null);
  const [anchorModal, setAnchorModal] = useState({ open: false, date: null });

  useEffect(() => {
    updateHeader('Post Lab', 'Strategic Hub v3');
  }, []);

  // ── Data loaders ────────────────────────────────────────────────────────────
  const loadEvents = useCallback(async () => {
    if (!activeBandId) return;
    try {
      const res = await eventsAPI.list(activeBandId);
      setEvents(res.data);
    } catch (err) {
      console.error(err);
    }
  }, [activeBandId]);

  const loadLatestBatch = useCallback(async () => {
    if (!activeBandId) return;
    try {
      const res = await plannerAPI.listBatches(activeBandId);
      const proposed = res.data.find(b => b.status === 'proposed');
      if (proposed) setBatch(proposed);
    } catch (err) {
      console.error(err);
    }
  }, [activeBandId]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([loadEvents(), loadLatestBatch()]);
      setLoading(false);
    };
    init();
  }, [loadEvents, loadLatestBatch]);

  useEffect(() => {
    const handler = () => loadEvents();
    window.addEventListener('agenmatica:eventsCreated', handler);
    return () => window.removeEventListener('agenmatica:eventsCreated', handler);
  }, [loadEvents]);

  // ── Event handlers ──────────────────────────────────────────────────────────
  const handleCreateAnchor = async (fields) => {
    await eventsAPI.create(activeBandId, fields);
    await loadEvents();
  };

  const handleMoveEvent = async (eventId, newDate) => {
    setEvents(prev => prev.map(e => e.id === eventId ? { ...e, event_date: newDate } : e));
    eventsAPI.update(eventId, { event_date: newDate }).catch(() => loadEvents());
  };

  const handleMovePost = (postId, newDate) => {
    setBatch(b => b ? {
      ...b,
      posts: b.posts.map(p => p.id === postId ? { ...p, scheduled_date: newDate } : p),
    } : b);
    plannerAPI.updatePost(postId, activeBandId, { scheduled_date: newDate }).catch(() => { });
  };

  const handleGenerateSignals = async (batchId) => {
    setGeneratingSignals(true);
    setError(null);
    const approvedIds = batch?.posts?.filter(p => p.is_approved).map(p => p.id) || [];
    try {
      const res = await plannerAPI.generateSignals(batchId, activeBandId, approvedIds);
      setBatch(res.data);
      setHubMode('production');
    } catch (err) {
      setError('Error generando las señales. Intentá nuevamente.');
      console.error(err);
    } finally {
      setGeneratingSignals(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await plannerAPI.generate(activeBandId, volume);
      setBatch(res.data);
      setHubMode('strategy');
    } catch (err) {
      setError('Error generando el batch. Intenta nuevamente.');
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const handleApprovePost = (postId) => {
    setBatch(b => ({
      ...b,
      posts: b.posts.map(p => p.id === postId ? { ...p, is_approved: !p.is_approved } : p),
    }));
  };

  const handleRejectPost = (postId) => {
    plannerAPI.rejectConcept(postId, activeBandId).catch(() => { });
    setBatch(b => ({
      ...b,
      posts: b.posts.filter(p => p.id !== postId),
    }));
  };

  const handleRefinePost = async (postId, feedback) => {
    try {
      const res = await plannerAPI.refinePost(activeBandId, postId, feedback);
      setBatch(b => ({
        ...b,
        posts: b.posts.map(p => p.id === postId ? { ...p, ...res.data } : p),
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleApproveBatch = async (batchId) => {
    setApproving(true);
    try {
      await plannerAPI.approveBatch(batchId);
      setBatch(b => ({ ...b, status: 'accepted' }));
      await loadLatestBatch();
    } catch (err) {
      console.error(err);
    } finally {
      setApproving(false);
    }
  };

  const handleSavePost = async (postId, fields) => {
    try {
      if (postId == null) {
        const res = await plannerAPI.manualDraft(activeBandId, fields);
        setBatch(b => b ? { ...b, posts: [...(b.posts || []), res.data] } : b);
      } else {
        const res = await plannerAPI.updatePost(postId, activeBandId, fields);
        setBatch(b => b ? {
          ...b,
          posts: b.posts.map(p => p.id === postId ? { ...p, ...res.data } : p),
        } : b);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      await plannerAPI.deletePost(postId, activeBandId);
      setBatch(b => b ? { ...b, posts: b.posts.filter(p => p.id !== postId) } : b);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenModal = (post, date) => setModalState({ open: true, post: post || null, date: date || null });
  const handleCloseModal = () => setModalState({ open: false, post: null, date: null });
  const handleModalSave = (fields) => handleSavePost(modalState.post?.id || null, fields);

  // ── Cell click: MAPA opens anchor creator, SEÑAL filters by day ─────────────
  const handleCellClick = (dateKey) => {
    if (hubMode === 'strategy') {
      setAnchorModal({ open: true, date: dateKey });
    } else {
      const [y, m, d] = dateKey.split('-').map(Number);
      setSelectedDay(prev =>
        prev && prev.year === y && prev.month === m - 1 && prev.day === d
          ? null
          : { year: y, month: m - 1, day: d }
      );
    }
  };

  // ── Contextual generate button logic ─────────────────────────────────────────
  const approvedCount = batch?.posts?.filter(p => p.is_approved).length || 0;
  const totalCount = batch?.posts?.length || 0;
  const hasSignals = batch?.posts?.some(p => p.caption);

  const renderGenerateButton = () => {
    // Si estamos en PRODUCCIÓN (Pestaña Señal)
    if (hubMode === 'production') {
      // Caso 1: Ya hay señales generadas (listo para publicar)
      if (batch && hasSignals) {
        return (
          <button
            data-testid="generate-btn"
            onClick={() => handleApproveBatch(batch.id)}
            disabled={approvedCount === 0 || approving}
            className="btn-secondary py-2 px-6 text-xs flex items-center gap-2 disabled:opacity-50"
          >
            {approving
              ? <><RefreshCw size={12} className="animate-spin" /> Publicando...</>
              : <><Check size={12} /> Publicar ({approvedCount}/{totalCount})</>
            }
          </button>
        );
      }
      
      // Caso 2: Tenemos ideas pero no señales aún
      return (
        <button
          data-testid="generate-btn"
          onClick={() => batch ? handleGenerateSignals(batch.id) : null}
          disabled={approvedCount === 0 || generatingSignals || !batch}
          className="btn-secondary py-2 px-6 text-xs flex items-center gap-2 disabled:opacity-50"
        >
          {generatingSignals
            ? <><RefreshCw size={12} className="animate-spin" /> Generando señales...</>
            : <><Zap size={12} /> Generar Señales ({approvedCount})</>
          }
        </button>
      );
    }

    // Por defecto: Modo ESTRATEGIA (Pestaña Mapa)
    return (
      <button
        data-testid="generate-btn"
        onClick={handleGenerate}
        disabled={generating}
        className="btn-secondary py-2 px-6 text-xs flex items-center gap-2 disabled:opacity-50"
      >
        {generating
          ? <><RefreshCw size={12} className="animate-spin" /> Generando...</>
          : <><Brain size={12} /> {batch ? 'Re-Generar Ideas' : 'Generar Ideas'}</>
        }
      </button>
    );
  };

  if (loading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center p-12">
        <div className="w-full max-w-sm h-1 bg-white/5 relative overflow-hidden">
          <div className="absolute inset-y-0 bg-[var(--secondary)] animate-[slide_1.2s_infinite]" style={{ width: '40%' }} />
        </div>
      </div>
    );
  }

  const isSignalMode = hubMode === 'production';

  return (
    <div className="max-w-6xl space-y-8 pb-24">

      {/* ── Hub Controller ── */}
      <div data-testid="hub-controller" className="surface-card p-4 border-t-2 border-t-[var(--primary)]/40">
        <div className="flex flex-wrap items-center justify-between gap-4">

          {/* Left: Purpose + View switches */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* MAPA / SEÑAL */}
            <div className="flex border border-[var(--outline-variant)] overflow-hidden">
              <button
                data-testid="hub-mode-mapa"
                onClick={() => setHubMode('strategy')}
                className={`flex items-center gap-2 px-4 py-2 text-[9px] font-mono font-black uppercase tracking-widest transition-all
                  ${!isSignalMode ? 'bg-[var(--secondary)]/20 text-[var(--secondary)]' : 'text-gray-500 hover:text-gray-300'}`}
              >
                <Map size={11} /> Mapa
              </button>
              <button
                data-testid="hub-mode-senal"
                onClick={() => setHubMode('production')}
                className={`flex items-center gap-2 px-4 py-2 text-[9px] font-mono font-black uppercase tracking-widest transition-all
                  ${isSignalMode ? 'bg-[var(--primary)]/20 text-[var(--primary)]' : 'text-gray-500 hover:text-gray-300'}`}
              >
                <Zap size={11} /> Señal
              </button>
            </div>

            <div className="h-6 w-px bg-[var(--outline-variant)]" />

            {/* CAL / LISTA */}
            <div className="flex border border-[var(--outline-variant)] overflow-hidden">
              <button
                data-testid="view-calendar"
                onClick={() => setView('calendar')}
                className={`flex items-center gap-2 px-4 py-2 text-[9px] font-mono font-black uppercase tracking-widest transition-all
                  ${view === 'calendar' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
              >
                <Calendar size={11} /> Cal
              </button>
              <button
                data-testid="view-list"
                onClick={() => setView('list')}
                className={`flex items-center gap-2 px-4 py-2 text-[9px] font-mono font-black uppercase tracking-widest transition-all
                  ${view === 'list' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
              >
                <List size={11} /> Lista
              </button>
            </div>

            <span
              data-testid="hub-status-label"
              className={`hidden sm:inline text-[8px] font-mono font-black uppercase tracking-widest px-3 py-1.5 border ${isSignalMode
                  ? 'bg-[var(--primary)]/10 border-[var(--primary)]/30 text-[var(--primary)]'
                  : 'bg-[var(--secondary)]/10 border-[var(--secondary)]/30 text-[var(--secondary)]'
                }`}
            >
              {isSignalMode ? 'Señal — Curación' : 'Mapa — Ideación'}
            </span>
          </div>

          {/* Right: tools */}
          <div className="flex flex-wrap items-center gap-3">
            <PlatformSelector selected={selectedPlatforms} onChange={setSelectedPlatforms} />
            {/* Selector de Volumen (Solo en Mapa) */}
            {hubMode === 'strategy' && (
              <select
                data-testid="volume-selector"
                value={volume}
                onChange={e => setVolume(Number(e.target.value))}
                className="bg-[var(--surface-highest)] border border-[var(--outline-variant)] p-2 text-[9px] font-mono font-black text-white uppercase outline-none focus:border-[var(--secondary)]"
              >
                {VOLUMES.map(v => (
                  <option key={v.key} value={v.key}>{v.label}</option>
                ))}
              </select>
            )}

            {/* El Botón Dinámico Inyectado */}
            {hubMode === 'production' ? (
              <button
                data-testid="generate-btn"
                onClick={() => (batch && hasSignals) ? handleApproveBatch(batch.id) : (batch ? handleGenerateSignals(batch.id) : null)}
                disabled={approvedCount === 0 || generatingSignals || approving || !batch}
                className="btn-primary py-2 px-6 text-xs flex items-center gap-2 disabled:opacity-50"
              >
                {approving || generatingSignals
                  ? <><RefreshCw size={12} className="animate-spin" /> Procesando...</>
                  : hasSignals
                    ? <><Check size={12} /> Publicar ({approvedCount}/{totalCount})</>
                    : <><Zap size={12} /> Generar Señales ({approvedCount})</>
                }
              </button>
            ) : (
              <button
                data-testid="generate-btn"
                onClick={handleGenerate}
                disabled={generating}
                className="btn-secondary py-2 px-6 text-xs flex items-center gap-2 disabled:opacity-50"
              >
                {generating
                  ? <><RefreshCw size={12} className="animate-spin" /> Generando...</>
                  : <><Brain size={12} /> Generar Ideas</>
                }
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="surface-card p-4 border-l-2 border-l-red-500 text-red-400 text-xs font-mono">
          {error}
        </div>
      )}

      {/* ── Main Area: Full-Width Focus Mode ── */}
      <div className="space-y-6">

        {/* Calendar — MAPA click-anywhere anchors; SEÑAL click filters */}
        {view === 'calendar' && (
          <CalendarView
            events={events}
            posts={batch?.posts || []}
            mode={hubMode}
            onCellClick={handleCellClick}
            onPostClick={(post) => handleOpenModal(post, null)}
            onAddPost={isSignalMode ? (date) => handleOpenModal(null, date) : undefined}
            onMoveEvent={handleMoveEvent}
            onMovePost={handleMovePost}
          />
        )}

        {/* List MAPA → ConceptList with approval toggle */}
        {view === 'list' && !isSignalMode && (
          <ConceptList
            events={events}
            posts={batch?.posts || []}
            onToggleApprove={handleApprovePost}
            onRefinePost={handleRefinePost}
            onRejectPost={handleRejectPost}
          />
        )}

        {/* List SEÑAL → SignalFeed with edit-on-click */}
        {view === 'list' && isSignalMode && batch && (
          <SignalFeed
            batch={batch}
            selectedDay={selectedDay}
            onApprovePost={handleApprovePost}
            onRejectPost={handleRejectPost}
            onRefinePost={handleRefinePost}
            onEditPost={(post) => handleOpenModal(post, null)}
            onGenerateSignals={handleGenerateSignals}
            onApproveBatch={handleApproveBatch}
            approving={approving}
            generatingSignals={generatingSignals}
          />
        )}

        {view === 'list' && isSignalMode && !batch && (
          <div className="surface-card p-16 flex flex-col items-center justify-center text-center space-y-4">
            <Zap size={32} className="text-[var(--primary)] opacity-30" />
            <p className="text-[10px] font-mono font-black text-gray-600 uppercase tracking-widest leading-relaxed">
              Genera un batch en Modo Mapa para activar el Signal Feed
            </p>
          </div>
        )}
      </div>

      {/* ── Post Detail Modal ── */}
      {modalState.open && (
        <PostDetailModal
          post={modalState.post}
          initialDate={modalState.date}
          onSave={handleModalSave}
          onDelete={handleDeletePost}
          onClose={handleCloseModal}
        />
      )}

      {/* ── Strategic Anchor Creator ── */}
      {anchorModal.open && (
        <StrategicAnchorCreator
          initialDate={anchorModal.date}
          onSave={handleCreateAnchor}
          onClose={() => setAnchorModal({ open: false, date: null })}
        />
      )}
    </div>
  );
};

export default Planner;
