import React, { useState, useEffect, useCallback } from 'react';
import { Zap, Calendar, List, RefreshCw, Brain, Map } from 'lucide-react';
import CalendarView from '../components/CalendarView';
import EventList from '../components/EventList';
import BatchReview from '../components/BatchReview';
import PlatformSelector from '../components/PlatformSelector';
import PulseWidget from '../components/PulseWidget';
import PostDetailModal from '../components/PostDetailModal';
import EventQuickAdd from '../components/EventQuickAdd';
import { useActiveProject } from '../context/ActiveProjectContext';
import { useHeader } from '../context/HeaderContext';
import { eventsAPI, plannerAPI } from '../services/api';

const TIMEFRAMES = [
  { key: 'weekly',   label: '7 días' },
  { key: 'biweekly', label: '14 días' },
  { key: 'monthly',  label: '30 días' },
];

const Planner = () => {
  const { activeBandId } = useActiveProject();
  const { updateHeader } = useHeader();

  const [events, setEvents] = useState([]);
  const [batch, setBatch] = useState(null);
  const [view, setView] = useState('calendar');
  const [timeframe, setTimeframe] = useState('weekly');
  const [generating, setGenerating] = useState(false);
  const [approving, setApproving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState(['instagram', 'facebook', 'tiktok', 'youtube']);
  const [batchMode, setBatchMode] = useState('strategy');
  const [generatingSignals, setGeneratingSignals] = useState(false);
  const [pulse, setPulse] = useState(null);
  const [pulseLoading, setPulseLoading] = useState(false);
  const [modalState, setModalState] = useState({ open: false, post: null, date: null });
  const [selectedDay, setSelectedDay] = useState(null);

  const bandName = batch?.band?.name || '';

  useEffect(() => {
    updateHeader('Temporal Canvas', 'Planificador Estratégico');
  }, []);

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

  const loadPulse = useCallback(async () => {
    if (!activeBandId) return;
    setPulseLoading(true);
    try {
      const res = await plannerAPI.pulse(activeBandId);
      setPulse(res.data);
    } catch (err) {
      console.error('Pulse fetch failed', err);
    } finally {
      setPulseLoading(false);
    }
  }, [activeBandId]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([loadEvents(), loadLatestBatch(), loadPulse()]);
      setLoading(false);
    };
    init();
  }, [loadEvents, loadLatestBatch, loadPulse]);

  useEffect(() => {
    const handler = () => loadEvents();
    window.addEventListener('agenmatica:eventsCreated', handler);
    return () => window.removeEventListener('agenmatica:eventsCreated', handler);
  }, [loadEvents]);

  const handleAddEvent = async (form) => {
    try {
      await eventsAPI.create(activeBandId, form);
      await loadEvents();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      await eventsAPI.delete(eventId);
      await loadEvents();
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateSignals = async (batchId) => {
    setGeneratingSignals(true);
    setError(null);
    try {
      const res = await plannerAPI.generateSignals(batchId, activeBandId);
      setBatch(res.data);
      setBatchMode('production');
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
      const res = await plannerAPI.generate(activeBandId, timeframe);
      setBatch(res.data);
      setBatchMode('strategy');
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
    plannerAPI.rejectConcept(postId, activeBandId).catch(() => {});
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

  const handleOpenModal = (post, date) => {
    setModalState({ open: true, post: post || null, date: date || null });
  };

  const handleCloseModal = () => {
    setModalState({ open: false, post: null, date: null });
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

  const handleModalSave = (fields) => {
    const postId = modalState.post?.id || null;
    handleSavePost(postId, fields);
  };

  const handleModalDelete = (postId) => {
    handleDeletePost(postId);
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

  return (
    <div className="max-w-6xl space-y-8 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* ── Pulse Telemetry ── */}
      <PulseWidget pulse={pulse} loading={pulseLoading} />

      {/* ── Control Bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex border border-[var(--outline-variant)] rounded-sm overflow-hidden">
          <button
            onClick={() => setView('calendar')}
            className={`flex items-center gap-2 px-4 py-2 text-[9px] font-mono font-black uppercase tracking-widest transition-all
              ${view === 'calendar' ? 'bg-[var(--secondary)]/20 text-[var(--secondary)]' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <Calendar size={12} /> Calendario
          </button>
          <button
            onClick={() => setView('list')}
            className={`flex items-center gap-2 px-4 py-2 text-[9px] font-mono font-black uppercase tracking-widest transition-all
              ${view === 'list' ? 'bg-[var(--secondary)]/20 text-[var(--secondary)]' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <List size={12} /> Lista
          </button>
        </div>

        {batch && (
          <div className="flex border border-[var(--outline-variant)] rounded-sm overflow-hidden">
            <button
              onClick={() => setBatchMode('strategy')}
              className={`flex items-center gap-2 px-4 py-2 text-[9px] font-mono font-black uppercase tracking-widest transition-all
                ${batchMode === 'strategy' ? 'bg-[var(--secondary)]/20 text-[var(--secondary)]' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <Map size={12} /> Mapa
            </button>
            <button
              onClick={() => setBatchMode('production')}
              className={`flex items-center gap-2 px-4 py-2 text-[9px] font-mono font-black uppercase tracking-widest transition-all
                ${batchMode === 'production' ? 'bg-[var(--primary)]/20 text-[var(--primary)]' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <Zap size={12} /> Señal
            </button>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <EventQuickAdd
            bandId={activeBandId}
            bandName={bandName}
            onEventsCreated={loadEvents}
          />
          <PlatformSelector selected={selectedPlatforms} onChange={setSelectedPlatforms} />
          <select
            value={timeframe}
            onChange={e => setTimeframe(e.target.value)}
            className="bg-[var(--surface-highest)] border border-[var(--outline-variant)] p-2 text-[9px] font-mono font-black text-white uppercase outline-none focus:border-[var(--secondary)] rounded-sm"
          >
            {TIMEFRAMES.map(t => (
              <option key={t.key} value={t.key}>{t.label}</option>
            ))}
          </select>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="btn-secondary py-2 px-6 text-xs flex items-center gap-2 disabled:opacity-50"
          >
            {generating
              ? <><RefreshCw size={12} className="animate-spin" /> Generando...</>
              : <><Brain size={12} /> Generar Batch</>
            }
          </button>
        </div>
      </div>

      {error && (
        <div className="surface-card p-4 border-l-2 border-l-red-500 text-red-400 text-xs font-mono">
          {error}
        </div>
      )}

      {/* ── Main Grid: Big Calendar + Sidebar ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-6">
          {view === 'calendar' && (
            <CalendarView
              events={events}
              posts={batch?.posts || []}
              mode={batchMode}
              onDayClick={(day) => setSelectedDay(prev =>
                prev && prev.year === day.year && prev.month === day.month && prev.day === day.day
                  ? null : day
              )}
              onPostClick={(post) => handleOpenModal(post, null)}
              onAddPost={(date) => handleOpenModal(null, date)}
            />
          )}
          {view === 'list' && (
            <EventList
              events={events}
              onAdd={handleAddEvent}
              onDelete={handleDeleteEvent}
            />
          )}
        </div>

        <div className="lg:col-span-1 space-y-6">
          {batch ? (
            <BatchReview
              batch={batch}
              mode={batchMode}
              selectedDay={selectedDay}
              onApprovePost={handleApprovePost}
              onRejectPost={handleRejectPost}
              onRefinePost={handleRefinePost}
              onGenerateSignals={handleGenerateSignals}
              onApproveBatch={handleApproveBatch}
              approving={approving}
              generatingSignals={generatingSignals}
            />
          ) : (
            <div className="surface-card p-8 flex flex-col items-center justify-center text-center space-y-4 min-h-[300px]">
              <Zap size={32} className="text-[var(--secondary)] opacity-40" />
              <p className="text-[10px] font-mono font-black text-gray-600 uppercase tracking-widest leading-relaxed">
                Agrega eventos y "Generar Batch" para que el Strategist Agent proponga un plan.
              </p>
            </div>
          )}
        </div>
      </div>

      {modalState.open && (
        <PostDetailModal
          post={modalState.post}
          initialDate={modalState.date}
          onSave={handleModalSave}
          onDelete={handleModalDelete}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default Planner;
