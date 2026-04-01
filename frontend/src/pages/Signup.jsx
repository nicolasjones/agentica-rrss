import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Music, ArrowRight, ShieldCheck, Activity } from 'lucide-react';
import { authAPI } from '../services/api';

const Signup = () => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authAPI.signup(formData);
      // After signup, let's login automatically
      const { data } = await authAPI.login({
        email: formData.email,
        password: formData.password
      });
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      navigate('/projects');
    } catch (err) {
      setError(err.response?.data?.detail || 'Error en el registro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--surface)] flex items-center justify-center p-6 relative overflow-hidden font-body">
      {/* Background Noise Texture */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[9999]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />
      
      {/* Gradient Glows */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[var(--primary)]/10 blur-[120px] rounded-full -mr-80 -mt-80" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[var(--secondary)]/5 blur-[120px] rounded-full -ml-64 -mb-64" />

      <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center mb-16">
          <div className="w-20 h-20 bg-[var(--surface-high)] border border-[var(--outline-variant)] rounded-sm flex items-center justify-center mx-auto mb-8 shadow-inner group overflow-hidden relative">
            <div className="absolute inset-x-0 bottom-0 h-1 bg-[var(--primary)] animate-pulse" />
            <Music className="text-[var(--primary)] relative z-10" size={40} />
          </div>
          <h1 className="text-5xl font-display font-black text-white tracking-tighter uppercase mb-4 leading-none italic">NUEVA <span className="text-[var(--primary)]">IDENTIDAD</span></h1>
          <p className="label-tech text-gray-500">Initialize Ecosystem Deployment</p>
        </div>

        <div className="surface-card-high p-10 border-t-2 border-t-[var(--secondary)] relative">
          <div className="absolute top-2 right-4 flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-[var(--secondary)] animate-pulse" />
             <span className="text-[8px] font-mono font-black text-[var(--secondary)] uppercase tracking-widest italic">Signal Ready</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3">
              <label className="label-tech ml-1">Alias / Brand ID</label>
              <div className="bg-[var(--surface-highest)] p-4 border-b border-transparent focus-within:border-[var(--secondary)] transition-all flex items-center gap-4">
                <User size={20} className="text-gray-700" />
                <input
                  type="text"
                  placeholder="Manager o Artista"
                  required
                  className="w-full bg-transparent text-white border-none focus:ring-0 outline-none font-bold placeholder:text-gray-900 uppercase text-xs tracking-widest"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="label-tech ml-1">E-mail Hub</label>
              <div className="bg-[var(--surface-highest)] p-4 border-b border-transparent focus-within:border-[var(--secondary)] transition-all flex items-center gap-4">
                <Mail size={20} className="text-gray-700" />
                <input
                  type="email"
                  placeholder="name@domain.com"
                  required
                  className="w-full bg-transparent text-white border-none focus:ring-0 outline-none font-bold placeholder:text-gray-900 uppercase text-xs tracking-widest"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="label-tech ml-1">Security Key Password</label>
              <div className="bg-[var(--surface-highest)] p-4 border-b border-transparent focus-within:border-[var(--secondary)] transition-all flex items-center gap-4">
                <Lock size={20} className="text-gray-700" />
                <input
                  type="password"
                  placeholder="••••••••"
                  required
                  className="w-full bg-transparent text-white border-none focus:ring-0 outline-none font-bold placeholder:text-gray-900"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border-l border-red-500/30 text-red-500 p-4 rounded-sm text-[10px] font-mono font-black flex items-center gap-3 uppercase tracking-widest italic animate-bounce">
                <ShieldCheck size={16} /> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-secondary w-full py-5 group"
            >
              {loading ? 'DEPLOYING IDENTITY...' : (
                <>
                  INITIALIZE ACCOUNT <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="text-center mt-12 space-y-4">
           <p className="label-tech text-gray-700">Ya eres parte del Ecosistema?</p>
           <Link to="/login" className="text-sm font-display font-black text-white hover:text-[var(--primary)] transition-colors uppercase tracking-widest italic border-b border-transparent hover:border-white">
             AUTENTICAR SIGNAL NODE
           </Link>
        </div>
      </div>

      <footer className="absolute bottom-8 left-0 right-0 text-center">
         <div className="flex items-center justify-center gap-4 mb-2">
            {[1,2,3].map(i => <div key={i} className="w-12 h-px bg-white/5" />)}
            <Activity size={14} className="text-gray-800" />
            {[1,2,3].map(i => <div key={i} className="w-12 h-px bg-white/5" />)}
         </div>
         <p className="text-[8px] font-mono font-black text-gray-700 uppercase tracking-[0.4em]">Agenmatica Command Center x Obsidian System</p>
      </footer>
    </div>
  );
};

export default Signup;
