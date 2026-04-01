import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  MessageSquare, 
  BarChart2, 
  User, 
  LogOut, 
  Layers,
  ChevronRight,
  Wand2,
  Activity
} from 'lucide-react';
import { useActiveProject } from '../context/ActiveProjectContext';

const Layout = ({ children, title, subtitle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { clearProject } = useActiveProject();

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={18} /> },
    { name: 'Post Lab', path: '/posts', icon: <MessageSquare size={18} /> },
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
    <div className="flex min-h-screen bg-[var(--surface)] text-[var(--tertiary)] overflow-hidden font-body">
      {/* Sidebar - Surface Container Low */}
      <aside className="w-64 bg-[var(--surface-low)] flex flex-col fixed inset-y-0 border-r border-[#484849]/10">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-sm bg-[var(--primary)] flex items-center justify-center font-black italic text-[var(--on-primary)] shadow-[0_0_20px_rgba(204,151,255,0.2)]">A</div>
            <span className="font-display font-black tracking-tighter text-2xl text-white">AGENMATICA</span>
          </div>

          <nav className="space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-sm transition-all text-left group ${
                  location.pathname === item.path 
                    ? 'bg-[var(--surface-high)] text-[var(--primary)] font-black' 
                    : 'text-[var(--on-surface-variant)] hover:text-white hover:bg-white/5'
                }`}
              >
                <span className={location.pathname === item.path ? 'text-[var(--primary)]' : 'text-current opacity-70'}>
                  {item.icon}
                </span>
                <span className="text-[11px] font-black uppercase tracking-widest">{item.name}</span>
                {location.pathname === item.path && (
                   <div className="ml-auto w-1 h-3 bg-[var(--primary)] rounded-full" />
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-6 space-y-4">
          <div className="p-4 bg-[var(--surface-dim)] border border-[#484849]/10 rounded-sm mb-4">
             <div className="flex items-center gap-2 mb-2">
                <Activity size={12} className="text-[var(--secondary)]" />
                <span className="label-tech mb-0">System Status</span>
             </div>
             <p className="text-[9px] font-mono text-[var(--secondary)] font-black uppercase tracking-tighter">Signal Chain: Optimized</p>
          </div>

          <button
            onClick={() => navigate('/projects')}
            className="w-full flex items-center justify-between p-4 rounded-sm bg-white/5 hover:bg-white/10 transition-all group border border-transparent hover:border-[var(--outline-variant)]"
          >
            <div className="flex items-center gap-3">
              <Layers size={16} className="text-[var(--primary)]" />
              <div className="text-left">
                <p className="label-tech mb-0 text-[8px]">Workspace</p>
                <p className="text-[10px] font-black uppercase tracking-tighter text-white">Cambiar Ecosistema</p>
              </div>
            </div>
            <ChevronRight size={14} className="text-gray-600 group-hover:text-white" />
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-sm text-red-500/70 hover:text-red-400 hover:bg-red-500/5 transition-all font-black uppercase tracking-widest text-[10px]"
          >
            <LogOut size={16} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-12 overflow-y-auto">
        <header className="mb-16">
          {subtitle && (
            <div className="label-tech flex items-center gap-2 text-[var(--primary)]">
              <span className="w-1.5 h-1.5 bg-[var(--primary)] animate-pulse" />
              {subtitle}
            </div>
          )}
          <h1 className="text-5xl font-display font-black tracking-tighter text-white uppercase leading-none">{title}</h1>
        </header>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
