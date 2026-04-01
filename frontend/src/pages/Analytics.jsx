import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Target, 
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Globe,
  Instagram,
  Twitter,
  Music,
  Clock,
  Activity
} from 'lucide-react';
import { analyticsAPI, bandsAPI } from '../services/api';
import Layout from '../components/Layout';
import { useActiveProject } from '../context/ActiveProjectContext';

const MetricCard = ({ icon, label, value, change, colorClass }) => (
  <div className="surface-card p-8 group border-b border-b-[var(--outline-variant)]">
    <div className={`p-3 bg-white/5 rounded-sm mb-6 w-fit ${colorClass}`}>
      {icon}
    </div>
    <p className="label-tech text-gray-500 mb-2">{label}</p>
    <div className="flex items-baseline gap-4">
      <h2 className="text-4xl font-display font-black text-white leading-none italic">{value}</h2>
      {change && (
        <span className="text-[var(--secondary)] text-[10px] font-mono font-black italic">
          <TrendingUp size={10} className="inline mr-1" /> {change}
        </span>
      )}
    </div>
  </div>
);

const PlatformIcon = ({ type }) => {
  const icons = {
    instagram: <Instagram size={20} />,
    twitter: <Twitter size={20} />,
    spotify: <Music size={20} />,
    tiktok: <Music size={20} />,
  };
  return icons[type.toLowerCase()] || <Globe size={20} />;
};

const Analytics = () => {
  const { activeBandId } = useActiveProject();
  const [analytics, setAnalytics] = useState(null);
  const [bandName, setBandName] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
      const [res, bandRes] = await Promise.all([
        analyticsAPI.overview(activeBandId),
        bandsAPI.get(activeBandId)
      ]);
      setAnalytics(res.data);
      setBandName(bandRes.data.name);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--surface)] flex items-center justify-center p-12">
        <div className="w-full max-w-sm h-1 bg-white/5 relative overflow-hidden">
           <div className="absolute inset-y-0 bg-[var(--primary)] animate-[slide_1.2s_infinite]" style={{ width: '40%' }} />
        </div>
      </div>
    );
  }

  const platforms = analytics?.platform_breakdown || [];

  return (
    <Layout 
      title="Analytics" 
      subtitle={`Ecosistema: ${bandName}`}
    >
      <div className="max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-12">
        {/* Main Hub Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MetricCard 
            icon={<Users size={20} />} 
            label="Ecosystem Audience" 
            value={(analytics?.total_followers || 0).toLocaleString()} 
            change={`+${analytics?.followers_growth_week || 0}`}
            colorClass="text-[var(--primary)]"
          />
          <MetricCard 
            icon={<TrendingUp size={20} />} 
            label="Engagement Rate" 
            value={`${analytics?.engagement_rate || 0}%`} 
            colorClass="text-[var(--secondary)]"
          />
          <MetricCard 
            icon={<MessageSquare size={20} />} 
            label="Posts Analizados" 
            value={analytics?.posts_published_week || 0} 
            colorClass="text-[var(--primary)]"
          />
          <MetricCard 
            icon={<Target size={20} />} 
            label="Signal Accuracy" 
            value={`${Math.round((analytics?.approval_rate || 0) * 100)}%`} 
            colorClass="text-[var(--secondary)]"
          />
        </div>

        {/* Content Breakdown Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Platforms List */}
          <div className="lg:col-span-2 space-y-10">
            <div className="flex items-center gap-6 mb-12">
               <h3 className="text-2xl font-display font-black text-white tracking-widest uppercase italic">
                 <BarChart3 size={24} className="inline mr-4 text-[var(--primary)]" /> Platform Breakout
               </h3>
               <div className="h-px bg-[var(--outline-variant)] flex-1 opacity-20" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {platforms.length > 0 ? platforms.map((p) => (
                <div key={p.platform} className="surface-card flex flex-col p-0 group">
                  <div className="p-6 pb-4 border-b border-[var(--outline-variant)] bg-[var(--surface-dim)] flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <PlatformIcon type={p.platform} />
                        <span className="label-tech mb-0 text-white italic">{p.platform} HUB</span>
                     </div>
                     <Activity size={12} className="text-[var(--secondary)] opacity-40 group-hover:opacity-100" />
                  </div>
                  
                  <div className="p-8 space-y-6">
                    <div className="flex justify-between items-end border-b border-[var(--outline-variant)] pb-3">
                      <span className="label-tech text-gray-500 mb-0">Followers</span>
                      <span className="text-2xl font-display font-black text-white italic">{p.followers.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-end border-b border-[var(--outline-variant)] pb-3">
                      <span className="label-tech text-gray-500 mb-0">Engagement</span>
                      <span className="text-2xl font-display font-black text-[var(--secondary)] italic">{p.engagement_rate}%</span>
                    </div>
                    <div className="flex justify-between items-center bg-black/40 p-3 rounded-sm">
                      <span className="label-tech text-gray-700 mb-0">Best Format</span>
                      <span className="text-[10px] font-mono font-black text-[var(--primary)] uppercase tracking-[0.2em]">{p.top_content_type.replace('_', ' ')}</span>
                    </div>
                  </div>
                  
                  <div className="mt-auto p-4 bg-white/5 border-t border-[var(--outline-variant)] text-center group-hover:bg-[var(--primary)]/10 cursor-pointer">
                     <button className="text-[9px] font-mono font-black uppercase tracking-[0.3em] text-gray-500 group-hover:text-white transition-colors">
                        Get Deep Dive Report
                     </button>
                  </div>
                </div>
              )) : (
                <div className="surface-card p-24 text-center col-span-2 border-2 border-dashed border-[var(--outline-variant)] opacity-40">
                  <Globe size={48} className="mx-auto mb-8 text-gray-800" />
                  <p className="text-[10px] font-mono font-black uppercase tracking-[0.4em] text-gray-600">No signals detected from external nodes</p>
                </div>
              )}
            </div>
          </div>

          {/* AI Insights Sidebar */}
          <div className="space-y-10">
            <div className="flex items-center gap-6 mb-12">
               <h3 className="text-2xl font-display font-black text-white tracking-widest uppercase italic">
                 <Zap size={24} className="inline mr-4 text-[var(--secondary)]" /> Agent Insights
               </h3>
               <div className="h-px bg-[var(--outline-variant)] flex-1 opacity-20" />
            </div>
            
            <div className="surface-card p-10 space-y-12 border-l-4 border-l-[var(--primary)] bg-gradient-to-br from-[var(--surface-dim)] to-black relative overflow-hidden">
               <div className="absolute -top-20 -right-20 w-60 h-60 bg-[var(--primary)]/5 blur-[80px] rounded-full" />
               
               <div className="relative z-10">
                 <div className="flex items-center gap-3 text-[var(--primary)] mb-4">
                   <Clock size={16} />
                   <span className="label-tech mb-0">Temporal Resonance</span>
                 </div>
                 <h4 className="text-xl font-display font-black text-white mb-2 leading-none uppercase italic">Friday 19:30 HRS</h4>
                 <p className="text-gray-500 font-mono text-[10px] uppercase font-black tracking-widest leading-relaxed">Punto de mayor receptividad de audiencia detectado por el kernel.</p>
               </div>

               <div className="h-px bg-[var(--outline-variant)] opacity-10" />

               <div className="relative z-10">
                 <div className="flex items-center gap-3 text-[var(--secondary)] mb-4">
                   <TrendingUp size={16} />
                   <span className="label-tech mb-0">Viral Potential Score</span>
                 </div>
                 <h4 className="text-xl font-display font-black text-white mb-2 leading-none uppercase italic">Ensayos / BTS</h4>
                 <p className="text-gray-500 font-mono text-[10px] uppercase font-black tracking-widest leading-relaxed">Los posts sobre ensayos generan un 3.5x más de engagement que el promedio.</p>
               </div>

               <div className="h-px bg-[var(--outline-variant)] opacity-10" />

               <div className="relative z-10">
                 <div className="flex items-center gap-3 text-[var(--primary)] mb-4">
                   <ShieldCheck size={16} />
                   <span className="label-tech mb-0">Identity Format</span>
                 </div>
                 <h4 className="text-xl font-display font-black text-white mb-2 leading-none uppercase italic">Original Reels</h4>
                 <p className="text-gray-500 font-mono text-[10px] uppercase font-black tracking-widest leading-relaxed">Los Reels con música original superan a los que usan audio de tendencia en tu nicho.</p>
               </div>
            </div>

            <div className="p-10 bg-white/5 border border-dashed border-[var(--outline-variant)] text-center">
               <span className="text-[9px] font-mono font-black text-gray-700 uppercase tracking-widest leading-relaxed">Data refresh cycle every 24H. <br/> Processing powered by Core Agent V2.</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Analytics;
