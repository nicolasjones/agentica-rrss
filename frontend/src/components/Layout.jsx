import React, { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, 
  MessageSquare, 
  BarChart2, 
  User, 
  LogOut, 
  Layers,
  ChevronRight,
  Wand2,
  Activity,
  Brain,
  Terminal,
  Cpu
} from 'lucide-react';
import { useActiveProject } from '../context/ActiveProjectContext';
import { useHeader } from '../context/HeaderContext';
import StrategistAssistant from './StrategistAssistant';

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { clearProject, activeBandId } = useActiveProject();
  const { title, subtitle } = useHeader();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={18} /> },
    { name: 'Post Lab', path: '/planner', icon: <MessageSquare size={18} /> },
    { name: 'Creative Lab', path: '/creative', icon: <Wand2 size={18} /> },
    { name: 'Analytics', path: '/analytics', icon: <BarChart2 size={18} /> },
    { name: 'ADN Profile', path: '/profile', icon: <User size={18} /> },
  ];

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    clearProject();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-[var(--surface)] text-[var(--tertiary)] overflow-hidden font-body selection:bg-[var(--primary)] selection:text-black">
      
      {/* ── Sidebar (Izquierdo) ── */}
      <aside className="w-64 bg-[var(--surface-low)] flex flex-col fixed inset-y-0 border-r border-[#484849]/10 z-30">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-10 group cursor-pointer" onClick={() => navigate('/projects')}>
            <div className="w-10 h-10 rounded-sm bg-[var(--primary)] flex items-center justify-center font-black italic text-black shadow-[0_0_30px_rgba(204,151,255,0.3)] transition-all group-hover:scale-105">A</div>
            <span className="font-display font-black tracking-tighter text-2xl text-white group-hover:text-[var(--primary)] transition-colors">AGENMATICA</span>
          </div>

          <nav className="space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-sm transition-all text-left group border border-transparent ${
                  location.pathname === item.path 
                    ? 'bg-white/5 border-white/5 text-[var(--primary)] font-black' 
                    : 'text-gray-500 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className={`${location.pathname === item.path ? 'text-[var(--primary)]' : 'text-current opacity-70 group-hover:opacity-100 group-hover:text-[var(--primary)]'}`}>
                  {item.icon}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">{item.name}</span>
                {location.pathname === item.path && (
                  <div className="ml-auto w-1 h-3 bg-[var(--primary)] rounded-full animate-pulse" />
                )}
              </button>
            ))}
          </nav>

          {/* Assistant Trigger in Sidebar */}
          <div className="mt-8 pt-8 border-t border-[var(--outline-variant)]">
             <button
               onClick={() => setDrawerOpen(!drawerOpen)}
               className={`w-full flex items-center gap-3 px-4 py-4 rounded-sm border transition-all ${
                 drawerOpen 
                   ? 'bg-[var(--primary)]/10 border-[var(--primary)] shadow-[0_0_20px_rgba(204,151,255,0.1)] text-[var(--primary)]' 
                   : 'bg-black border-[var(--outline-variant)] text-gray-500 hover:border-[var(--primary)]/50 hover:text-white group'
               }`}
             >
               <Brain size={18} className={drawerOpen ? 'animate-pulse' : 'group-hover:text-[var(--primary)]'} />
               <div className="text-left">
                  <p className="text-[9px] font-black uppercase tracking-widest">Brain Mode</p>
                  <p className={`text-[8px] font-mono uppercase ${drawerOpen ? 'text-[var(--secondary)]' : 'text-gray-700'}`}>
                    {drawerOpen ? 'Active Signal' : 'Standby...'}
                  </p>
               </div>
             </button>
          </div>
        </div>

        <div className="mt-auto p-6 space-y-4">
          <div className="p-4 bg-[var(--surface-dim)] border border-[#484849]/10 rounded-sm">
             <div className="flex items-center gap-2 mb-2">
                <Activity size={12} className="text-[var(--secondary)]" />
                <span className="label-tech mb-0 text-[8px]">System Status</span>
             </div>
             <p className="text-[8px] font-mono text-[var(--secondary)] font-black uppercase tracking-widest leading-none">Signal Chain: Optimized</p>
          </div>

          <button
            onClick={() => navigate('/projects')}
            className="w-full flex items-center justify-between p-4 rounded-sm bg-black/40 hover:bg-white/5 transition-all group border border-[var(--outline-variant)]"
          >
            <div className="flex items-center gap-3">
              <Layers size={16} className="text-gray-500 group-hover:text-[var(--primary)]" />
              <div className="text-left">
                <p className="text-[8px] font-mono uppercase text-gray-600 mb-0 leading-none">Workspace</p>
                <p className="text-[9px] font-black uppercase tracking-tighter text-white mt-1">Change Node</p>
              </div>
            </div>
            <ChevronRight size={14} className="text-gray-700 group-hover:text-white" />
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-500/50 hover:text-red-400 hover:bg-red-500/5 transition-all font-black uppercase tracking-widest text-[9px] leading-none"
          >
            <LogOut size={14} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* ── Main Canvas ── */}
      <main className={`flex-1 ml-64 p-12 overflow-y-auto transition-all duration-500 ${drawerOpen ? 'mr-96' : 'mr-0'}`}>
        <header className="mb-16 animate-in fade-in slide-in-from-top-4 duration-700">
          {subtitle && (
            <div className="label-tech flex items-center gap-2 text-[var(--primary)] mb-2">
              <Cpu size={12} className="animate-pulse" />
              {subtitle}
            </div>
          )}
          <h1 className="text-5xl font-display font-black tracking-tighter text-white uppercase italic leading-none">{title}</h1>
        </header>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <Outlet />
        </div>
      </main>

      {/* ── Strategist Assistant Drawer (Derecho) ── */}
      <aside 
        className={`fixed top-0 right-0 h-full w-96 z-40 transition-transform duration-500 ease-out border-l border-[var(--outline-variant)] shadow-[-20px_0_50px_rgba(0,0,0,0.5)]
          ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <StrategistAssistant onClose={() => setDrawerOpen(false)} />
      </aside>
    </div>
  );
};

export default Layout;
