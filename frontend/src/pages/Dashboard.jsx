import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  TrendingUp, 
  Zap, 
  CheckCircle, 
  MessageSquare, 
  ArrowUpRight,
  ShieldCheck,
  Music,
  BarChart3,
  Search,
  Activity
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { bandsAPI, analyticsAPI } from '../services/api';
import Layout from '../components/Layout';
import { useActiveProject } from '../context/ActiveProjectContext';

const StatCard = ({ icon, label, value, trend, colorClass }) => (
  <div className="surface-card p-6 group">
    <div className={`absolute -top-4 -right-4 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity ${colorClass}`}>
      {icon}
    </div>
    
    <span className="label-tech text-[var(--on-surface-variant)]">{label}</span>
    
    <div className="flex items-baseline gap-3 mt-4">
      <h2 className="text-3xl font-display font-black text-white leading-none">{value}</h2>
      {trend && (
        <span className="text-[var(--secondary)] text-[10px] font-mono font-black flex items-center gap-1">
          <TrendingUp size={10} /> +{trend}%
        </span>
      )}
    </div>
    
    <div className="mt-6 pt-4 border-t border-[var(--outline-variant)]">
      <p className="text-[8px] font-mono text-[var(--on-surface-variant)] font-black uppercase tracking-widest leading-none">Status: Active Signal</p>
    </div>
  </div>
);

const Dashboard = () => {
  const { activeBandId } = useActiveProject();
  const [band, setBand] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Mock chart data
  const chartData = [
    { day: 'Lun', val: 400 },
    { day: 'Mar', val: 300 },
    { day: 'Mié', val: 600 },
    { day: 'Jue', val: 800 },
    { day: 'Vie', val: 500 },
    { day: 'Sáb', val: 900 },
    { day: 'Dom', val: 700 },
  ];

  useEffect(() => {
    if (!activeBandId) {
      navigate('/projects');
      return;
    }
    loadData();
  }, [activeBandId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [bandRes, analyticsRes] = await Promise.all([
        bandsAPI.get(activeBandId),
        analyticsAPI.overview(activeBandId)
      ]);
      setBand(bandRes.data);
      setAnalytics(analyticsRes.data);
    } catch (err) {
      console.error("Error loading dashboard data", err);
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--surface)] flex items-center justify-center">
        <div className="w-16 h-1 w-full max-w-[200px] bg-white/5 relative overflow-hidden">
           <div className="absolute inset-y-0 bg-[var(--primary)] animate-[slide_1.5s_infinite]" style={{ width: '40%' }} />
        </div>
      </div>
    );
  }

  return (
    <Layout 
      title="Dashboard" 
      subtitle={`Ecosistema: ${band?.name}`}
    >
      <div className="max-w-7xl space-y-8">
        {/* Identity Header Card - Asymmetric Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-12">
          <div className="lg:col-span-3 surface-card-high flex flex-col md:flex-row items-center gap-10">
            <div className="w-40 h-40 bg-[var(--surface-dim)] p-2 rounded-sm border border-[var(--outline-variant)] flex items-center justify-center relative group">
              <div className="absolute inset-0 bg-gradient-to-tr from-[var(--primary)]/10 to-transparent opacity-50" />
              <Music className="text-[var(--primary)] relative z-10" size={48} />
              <div className="absolute bottom-2 left-2 right-2 flex justify-between px-2 text-[8px] font-mono text-[var(--on-surface-variant)] opacity-50">
                 <span>BAND ID: {String(band?.id || '').slice(0,8)}</span>
                 <span>V: 2.0</span>
              </div>
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <span className="label-tech text-[var(--primary)] mb-4">Signal Verified</span>
              <h1 className="text-6xl font-display font-black text-white leading-[0.85] mb-6">{band?.name}</h1>
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                 <div className="px-3 py-2 bg-black/40 rounded-sm border border-[var(--outline-variant)]">
                    <span className="label-tech text-gray-600 mb-1">ADN Confidence</span>
                    <p className="text-sm font-mono font-black text-white uppercase">{Math.round(band?.confidence_score * 100)}% Match</p>
                 </div>
                 <div className="px-3 py-2 bg-black/40 rounded-sm border border-[var(--outline-variant)]">
                    <span className="label-tech text-gray-600 mb-1">Posts Analizados</span>
                    <p className="text-sm font-mono font-black text-white uppercase">{analytics?.posts_published_week} Published</p>
                 </div>
              </div>
            </div>
          </div>

          <div className="surface-card flex flex-col items-center justify-center text-center group border-l-4 border-l-[var(--secondary)]">
             <Activity className="text-[var(--secondary)] mb-6 opacity-40 group-hover:opacity-100 transition-opacity" size={32} />
             <span className="label-tech">System Load</span>
             <h4 className="text-4xl font-display font-black text-[var(--tertiary)] leading-none mb-2">98.2</h4>
             <p className="text-[9px] font-mono text-gray-500 uppercase font-black tracking-widest">Processing Optimal</p>
          </div>
        </div>

        {/* Real Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard 
            icon={<Users size={24} />} 
            label="Total Audience" 
            value={(analytics?.total_followers || 0).toLocaleString()} 
            trend="12.5" 
            colorClass="text-[var(--primary)]" 
          />
          <StatCard 
            icon={<Zap size={24} />} 
            label="Engagement" 
            value={`${(analytics?.engagement_rate || 0).toFixed(1)}%`} 
            trend="4.2" 
            colorClass="text-[var(--secondary)]" 
          />
          <StatCard 
            icon={<CheckCircle size={24} />} 
            label="Approval ADN" 
            value={`${Math.round((analytics?.approval_rate || 0) * 100)}%`} 
            colorClass="text-[var(--primary)]" 
          />
          <StatCard 
            icon={<TrendingUp size={24} />} 
            label="Post Confidence" 
            value={`${Math.round((analytics?.confidence_score || 0) * 100)}%`} 
            colorClass="text-[var(--secondary)]" 
          />
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch pt-4">
          {/* Main Chart Card */}
          <div className="lg:col-span-2 surface-card p-0 flex flex-col">
             <div className="p-8 pb-4 flex items-center justify-between border-b border-[var(--outline-variant)] bg-[var(--surface-dim)]">
                <div className="flex items-center gap-3">
                   <Activity size={18} className="text-[var(--secondary)]" />
                   <h3 className="text-lg font-display font-black text-white uppercase">Weekly Signal Graph</h3>
                </div>
                <span className="text-[9px] font-mono font-black text-gray-600 uppercase tracking-widest italic">Source: Multi-Platform API</span>
             </div>
             
             <div className="p-8 h-80 w-full relative">
                <div className="absolute inset-0 bg-[var(--surface-dim)] opacity-40 pointer-events-none" />
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#cc97ff" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#cc97ff" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="10 10" stroke="#484849" vertical={false} opacity={0.1} />
                    <XAxis 
                      dataKey="day" 
                      stroke="#484849" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                      dy={10}
                    />
                    <YAxis hide />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0e0e0f', border: '1px solid #484849', borderRadius: '2px', fontSize: '10px' }}
                      itemStyle={{ color: '#cc97ff', fontWeight: '900', textTransform: 'uppercase' }}
                    />
                    <Area 
                      type="stepAfter" 
                      dataKey="val" 
                      stroke="#cc97ff" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorVal)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
             </div>

             <div className="mt-auto p-8 bg-[var(--surface-dim)] border-t border-[var(--outline-variant)] flex items-center justify-between">
                <div className="flex items-center gap-6">
                   <div className="flex flex-col">
                      <span className="label-tech text-gray-600 mb-0">Pendientes</span>
                      <p className="text-xl font-display font-black text-white leading-none">03</p>
                   </div>
                   <div className="w-px h-8 bg-[var(--outline-variant)]" />
                   <div className="flex flex-col">
                      <span className="label-tech text-gray-600 mb-0">Revisión IA</span>
                      <p className="text-xl font-display font-black text-white leading-none">72H</p>
                   </div>
                </div>
                <button 
                  onClick={() => navigate('/posts')}
                  className="btn-primary py-3 px-8 text-sm"
                >
                  Enter Post Lab <ArrowUpRight size={18} />
                </button>
             </div>
          </div>

          {/* Quick Access Sidebar */}
          <div className="flex flex-col gap-4">
             <button 
                onClick={() => navigate('/creative')}
                className="surface-card p-8 text-left hover:bg-[var(--surface-high)] border-l-2 border-l-transparent hover:border-l-[var(--primary)] text-left group flex-1"
             >
                <Zap size={28} className="text-[var(--primary)] mb-6 opacity-50 group-hover:opacity-100 transition-opacity" />
                <h3 className="text-xl font-display font-black text-white uppercase mb-2">Creative Lab</h3>
                <p className="text-[10px] text-[var(--on-surface-variant)] font-bold uppercase tracking-widest leading-relaxed">Configura el equipo y la identidad visual de la IA para {band?.name}.</p>
             </button>

             <button 
                onClick={() => navigate('/profile')}
                className="surface-card p-8 text-left hover:bg-[var(--surface-high)] border-l-2 border-l-transparent hover:border-l-[var(--secondary)] group flex-1"
             >
                <BarChart3 size={28} className="text-[var(--secondary)] mb-6 opacity-50 group-hover:opacity-100 transition-opacity" />
                <h3 className="text-xl font-display font-black text-white uppercase mb-2">DNA Profile</h3>
                <p className="text-[10px] text-[var(--on-surface-variant)] font-bold uppercase tracking-widest leading-relaxed">Ajusta la semántica y redes en el núcleo del ecosistema.</p>
             </button>

             <div className="surface-card p-8 opacity-40">
                <Search size={28} className="text-gray-600 mb-6" />
                <h3 className="text-xl font-display font-black text-gray-400 uppercase mb-2">Trends IA</h3>
                <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest leading-relaxed">Próximamente: Análisis de mercado en tiempo real.</p>
             </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
