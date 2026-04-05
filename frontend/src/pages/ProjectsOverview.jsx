import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Layers,
  TrendingUp,
  ArrowRight,
  Music,
  Activity,
  User,
  Zap,
  LayoutGrid
} from 'lucide-react';
import { bandsAPI, analyticsAPI } from '../services/api';
import { useActiveProject } from '../context/ActiveProjectContext';

const ProjectCard = ({ project, onSelect }) => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const { data } = await analyticsAPI.overview(project.id);
        setStats(data);
      } catch (err) { console.error(err); }
    };
    loadStats();
  }, [project.id]);

  return (
    <div
      onClick={() => onSelect(project.id)}
      className="surface-card p-0 group cursor-pointer hover:bg-[var(--surface-high)] border-l-2 border-l-transparent hover:border-l-[var(--primary)] text-left flex flex-col h-full"
    >
      <div className="p-8 pb-4 flex items-center justify-between border-b border-[var(--outline-variant)] bg-[var(--surface-dim)]">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/5 rounded-sm">
            <Music size={14} className="text-[var(--primary)]" />
          </div>
          <span className="label-tech mb-0 text-white italic">ECOSYSTEM: {String(project.id).slice(0, 8)}</span>
        </div>
        <Activity size={12} className="text-[var(--secondary)] animate-pulse" />
      </div>

      <div className="p-8 flex-1">
        <h3 className="text-3xl font-display font-black text-white leading-none uppercase mb-6 group-hover:text-[var(--primary)] transition-colors">
          {project.name}
        </h3>

        <div className="space-y-4">
          <div className="flex justify-between items-end border-b border-[var(--outline-variant)] pb-2">
            <span className="label-tech text-gray-500 mb-0">Followers</span>
            <span className="text-lg font-mono font-black text-white">{(stats?.total_followers || 0).toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-end">
            <span className="label-tech text-gray-500 mb-0">Engagement Rate</span>
            <span className="text-lg font-mono font-black text-[var(--secondary)]">{(stats?.engagement_rate || 0).toFixed(1)}%</span>
          </div>
        </div>
      </div>

      <div className="p-6 bg-black/20 border-t border-[var(--outline-variant)] flex items-center justify-between group-hover:bg-[var(--primary)]/10 transition-all">
        <span className="text-[9px] font-mono font-black uppercase tracking-widest text-gray-500 group-hover:text-white">Enter Workspace</span>
        <ArrowRight size={14} className="text-gray-500 group-hover:translate-x-1 group-hover:text-white transition-all" />
      </div>
    </div>
  );
};

const ProjectsOverview = () => {
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBandName, setNewBandName] = useState('');
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();
  const { selectProject } = useActiveProject();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [{ data: bands }, { data: globalStats }] = await Promise.all([
        bandsAPI.list(),
        analyticsAPI.getAggregate()
      ]);
      setProjects(bands);
      setStats(globalStats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBand = async (e) => {
    e.preventDefault();
    if (!newBandName.trim()) return;
    setCreating(true);
    try {
      await bandsAPI.create({ name: newBandName, description: 'Nuevo Ecosistema' });
      const { data: updatedBands } = await bandsAPI.list();
      setProjects(updatedBands);
      setShowCreateModal(false);
      setNewBandName('');
    } catch (err) { console.error(err); }
    finally { setCreating(false); }
  };

  const handleSelectProject = (id) => {
    selectProject(id);
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--surface)] flex items-center justify-center p-12">
        <div className="w-full max-w-sm h-1 bg-white/5 relative overflow-hidden">
          <div className="absolute inset-y-0 bg-[var(--primary)] animate-[slide_1.5s_infinite]" style={{ width: '40%' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--surface)] text-[var(--tertiary)] flex flex-col font-body antialiased">
      {/* Background Noise Texture (Styled in main.css but explicit for safety) */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[9999]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />

      {/* Modal - Surface Container Highest */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl">
          <div className="bg-[var(--surface-high)] border border-[#484849]/30 rounded-sm p-12 max-w-lg w-full relative overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)]">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)]" />
            <span className="label-tech mb-4">Initialize Signal</span>
            <h2 className="text-4xl font-display font-black text-white tracking-tighter uppercase mb-2 leading-none italic">New Ecosystem</h2>
            <p className="text-gray-500 text-[10px] font-mono font-black uppercase tracking-widest mb-10">Deploy Identity into the Multiverse</p>

            <form onSubmit={handleCreateBand} className="space-y-8">
              <div className="bg-[var(--surface-highest)] p-6 border-b-2 border-transparent focus-within:border-[var(--primary)] transition-all">
                <label className="label-tech text-gray-500">Identity Name</label>
                <input
                  autoFocus
                  type="text"
                  value={newBandName}
                  onChange={(e) => setNewBandName(e.target.value)}
                  placeholder="Artista, Sello o Agencia"
                  className="w-full bg-transparent text-white border-none focus:ring-0 outline-none font-display font-black text-3xl placeholder:text-gray-900 uppercase tracking-tighter"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={creating || !newBandName.trim()}
                  className="btn-primary flex-1 py-5"
                >
                  {creating ? 'DEPLOYING...' : 'LAUNCH ECOSYSTEM'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-tertiary px-6"
                >
                  ABORT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-8 md:p-16 pt-24">
        <header className="flex flex-col lg:flex-row items-baseline justify-between gap-8 mb-24 relative">
          <div className="absolute -top-10 -left-10 text-[120px] font-display font-black text-white/[0.02] pointer-events-none select-none">AGENMATICA</div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 text-[var(--primary)] mb-4">
              <LayoutGrid size={24} />
              <span className="text-[11px] font-mono font-black uppercase tracking-[0.4em]">Workspace Master V2.0</span>
            </div>
            <h1 className="text-7xl md:text-8xl font-display font-black text-white leading-[0.8] tracking-tighter uppercase italic">
              MIS <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dim)]">ECOSISTEMAS</span>
            </h1>
          </div>

          <div className="relative z-10 lg:text-right">
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary group py-4 px-10"
            >
              <Plus size={24} className="group-hover:rotate-90 transition-transform duration-500" />
              <span className="text-xl">Nuevo Ecosistema</span>
            </button>
            <div className="mt-4 flex gap-4 lg:justify-end">
              <span className="text-[9px] font-mono font-black uppercase tracking-widest text-[#484849]">Multiverse Nodes: Active</span>
              <div className="w-2 h-2 rounded-full bg-[var(--secondary)] animate-pulse" />
            </div>
          </div>
        </header>

        {/* Global Signal Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-24">
          <div className="surface-card p-6 flex flex-col">
            <span className="label-tech">Aggregate Audience</span>
            <div className="flex items-baseline gap-3 mt-2">
              <h2 className="text-3xl font-display font-black text-white leading-none">{(stats?.total_followers || 0).toLocaleString()}</h2>
              <span className="text-[var(--secondary)] text-[10px] font-mono font-black">+12%</span>
            </div>
          </div>
          <div className="surface-card p-6 flex flex-col">
            <span className="label-tech">Active Signal Nodes</span>
            <div className="flex items-baseline gap-3 mt-2">
              <h2 className="text-3xl font-display font-black text-white leading-none">{stats?.project_count || '0'}</h2>
              <span className="text-gray-600 text-[10px] font-mono font-black tracking-widest uppercase">Ecos</span>
            </div>
          </div>
          <div className="surface-card p-6 flex flex-col border-b-2 border-b-[var(--primary)]">
            <span className="label-tech">Avg Confidence ADN</span>
            <div className="flex items-baseline gap-3 mt-2">
              <h2 className="text-3xl font-display font-black text-white leading-none">{Math.round((stats?.avg_confidence || 0) * 100)}%</h2>
            </div>
          </div>
          <div className="surface-card p-6 flex flex-col">
            <span className="label-tech">Total Engagement Hub</span>
            <div className="flex items-baseline gap-3 mt-2">
              <h2 className="text-3xl font-display font-black text-white leading-none">{(stats?.total_engagement || 0).toLocaleString()}</h2>
            </div>
          </div>
        </div>

        {/* Identity Grid Section */}
        <div className="flex items-center gap-4 mb-10">
          <div className="h-px bg-[var(--outline-variant)] flex-1 opacity-20" />
          <h2 className="text-xl font-display font-black text-white tracking-widest uppercase flex items-center gap-4">
            <Zap size={20} className="text-[var(--secondary)]" /> Directorio de Identidades
          </h2>
          <div className="h-px bg-[var(--outline-variant)] flex-1 opacity-20" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map(p => (
            <ProjectCard key={p.id} project={p} onSelect={handleSelectProject} />
          ))}

          {/* Add Project Card Placeholder */}
          <div
            onClick={() => setShowCreateModal(true)}
            className="border-2 border-dashed border-[var(--outline-variant)] p-8 flex flex-col items-center justify-center text-gray-700 hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all cursor-pointer group rounded-sm min-h-[300px]"
          >
            <div className="w-16 h-16 rounded-sm border border-current flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Plus size={32} />
            </div>
            <p className="font-display font-black text-xl uppercase tracking-tighter">Initialize New ADN</p>
            <p className="text-[10px] font-mono mt-2 tracking-widest opacity-40">Ready for Signal Injection</p>
          </div>
        </div>
      </main>

      <footer className="p-8 border-t border-[var(--outline-variant)] bg-[var(--surface-dim)] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse" />
          <span className="text-[9px] font-mono font-black text-gray-500 uppercase tracking-widest">Agenmatica Command Center x Obsidian System</span>
        </div>
        <div className="flex gap-8 text-[9px] font-mono font-black text-gray-600 uppercase tracking-widest border-l border-[#484849]/20 pl-8">
          <span className="hover:text-white cursor-pointer transition-colors">Documentation</span>
          <span className="hover:text-white cursor-pointer transition-colors">Internal Ops</span>
          <span className="text-[#484849] opacity-30 select-none">ALFA 2.0.4</span>
        </div>
      </footer>
    </div>
  );
};

export default ProjectsOverview;
