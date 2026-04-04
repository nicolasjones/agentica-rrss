import React, { useState, useEffect, useCallback } from 'react';
import { Zap, Calendar, List, RefreshCw, Brain, MessageSquare, Map } from 'lucide-react';
import Layout from '../components/Layout';
import CalendarView from '../components/CalendarView';
import EventList from '../components/EventList';
import BatchReview from '../components/BatchReview';
import PlatformSelector from '../components/PlatformSelector';
import StrategistAssistant from '../components/StrategistAssistant';
import { useActiveProject } from '../context/ActiveProjectContext';
import { eventsAPI, plannerAPI } from '../services/api';

const TIMEFRAMES = [
  { key: 'weekly',   label: '7 días' },
  { key: 'biweekly', label: '14 días' },
  { key: 'monthly',  label: '30 días' },
];

const Planner = () => {
  const { activeBandId } = useActiveProject();

  const [events, setEvents] = useState([]);
  const [batch, setBatch] = useState(null);
  const [view, setView] = useState('calendar'); // calendar | list
  const [timeframe, setTimeframe] = useState('weekly');
  const [generating, setGenerating] = useState(false);
  const [approving, setApproving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState(['instagram', 'facebook', 'tiktok', 'youtube']);
  const [showAssistant, setShowAssistant] = useState(false);
  const [batchMode, setBatchMode] = useState('strategy'); // 'strategy' | 'production'
  const [generatingSignals, setGeneratingSignals] = useState(false);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--surface)] flex items-center justify-center p-12">
        <div className="w-full max-w-sm h-1 bg-white/5 relative overflow-hidden">
          <div className="absolute inset-y-0 bg-[var(--secondary)] animate-[slide_1.2s_infinite]" style={{ width: '40%' }} />
        </div>
      </div>
    );
  }

  return (
    <Layout title="Strategic Planner" subtitle="Agencia de Contenido Autónoma">
      <div className="max-w-6xl space-y-8 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">

        {/* ── Control Bar ── */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* View toggle */}
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

          {/* Mode toggle MAPA / SEÑAL */}
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

          {/* Platform selector + Timeframe + Assistant + Generate */}
          <div className="flex flex-wrap items-center gap-3">
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
              onClick={() => setShowAssistant(v => !v)}
              className={`flex items-center gap-2 px-4 py-2 text-[9px] font-mono font-black uppercase tracking-widest border transition-all
                ${showAssistant
                  ? 'border-[var(--secondary)]/60 bg-[var(--secondary)]/10 text-[var(--secondary)]'
                  : 'border-[var(--outline-variant)] text-gray-500 hover:text-gray-300'}`}
            >
              <MessageSquare size={12} /> Asistente
            </button>

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

        {/* ── Main Grid ── */}
        <div className={`grid grid-cols-1 gap-8 ${showAssistant ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>

          {/* Left: Calendar / Event List */}
          <div className="lg:col-span-1 space-y-6">
            {view === 'calendar' && (
              <CalendarView
                events={events}
                posts={batch?.posts || []}
                mode={batchMode}
              />
            )}
            <EventList
              events={events}
              onAdd={handleAddEvent}
              onDelete={handleDeleteEvent}
            />
          </div>

          {/* Center: Batch Review */}
          <div className={showAssistant ? 'lg:col-span-2' : 'lg:col-span-2'}>
            {batch ? (
              <BatchReview
                batch={batch}
                mode={batchMode}
                onApprovePost={handleApprovePost}
                onRejectPost={handleRejectPost}
                onRefinePost={handleRefinePost}
                onGenerateSignals={handleGenerateSignals}
                onApproveBatch={handleApproveBatch}
                approving={approving}
                generatingSignals={generatingSignals}
              />
            ) : (
              <div className="surface-card p-12 flex flex-col items-center justify-center text-center space-y-4 h-full min-h-[300px]">
                <Zap size={40} className="text-[var(--secondary)] opacity-40" />
                <p className="text-[10px] font-mono font-black text-gray-600 uppercase tracking-widest max-w-xs">
                  Agrega eventos y presiona "Generar Batch" para que el Strategist Agent proponga un plan de contenido.
                </p>
              </div>
            )}
          </div>

          {/* Right: Strategist Assistant (conditional) */}
          {showAssistant && (
            <div className="lg:col-span-1 animate-in fade-in slide-in-from-right-4 duration-300">
              <StrategistAssistant
                bandId={activeBandId}
                onEventsCreated={loadEvents}
              />
            </div>
          )}
        </div>

      </div>
    </Layout>
  );
};

export default Planner;
