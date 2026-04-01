import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check,
  X,
  Edit3,
  AlertCircle,
  Clock,
  Send,
  Sparkles,
  Search,
  MessageSquare,
  Activity
} from 'lucide-react';
import { postsAPI } from '../services/api';
import Layout from '../components/Layout';
import { useActiveProject } from '../context/ActiveProjectContext';

const PostCard = ({ post, onApprove, onEdit, onReject }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [editedText, setEditedText] = useState(post.caption);
  const [rejectReason, setRejectReason] = useState('');

  const handleSaveEdit = () => {
    onEdit(post.id, editedText);
    setIsEditing(false);
  };

  const handleSaveReject = () => {
    onReject(post.id, rejectReason);
    setIsRejecting(false);
  };

  return (
    <div className="surface-card flex flex-col p-0 group border-b border-b-[var(--outline-variant)]">
      <div className="p-8 pb-4 flex items-center justify-between border-b border-[var(--outline-variant)] bg-[var(--surface-dim)]">
         <div className="flex items-center gap-3">
            <div className="p-1 px-3 bg-white/5 rounded-sm border border-[var(--outline-variant)]">
               <span className="label-tech mb-0 text-white italic">POST ID: {String(post.id).slice(0, 8)}</span>
            </div>
            <span className="label-tech mb-0 text-gray-500 font-black tracking-widest uppercase">{new Date(post.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} HRS</span>
         </div>
         <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-[var(--primary)] animate-pulse" />
            <span className="text-[8px] font-mono font-black text-[var(--primary)] uppercase tracking-widest">IA Generativa activa</span>
         </div>
      </div>

      <div className="p-10 flex-1">
        {isEditing ? (
          <div className="space-y-6">
            <textarea
              className="w-full bg-[var(--surface-dim)] border border-[var(--primary)]/30 rounded-sm p-8 text-xl font-body text-white outline-none min-h-[200px] shadow-[inset_0_0_40px_rgba(0,0,0,0.5)] leading-relaxed"
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
            />
            <div className="flex gap-4">
              <button onClick={handleSaveEdit} className="btn-primary py-3 px-8 text-sm">GUARDAR CAMBIOS</button>
              <button onClick={() => setIsEditing(false)} className="btn-tertiary">CANCELAR</button>
            </div>
          </div>
        ) : isRejecting ? (
          <div className="space-y-6">
            <label className="label-tech">Motivo del Rechazo (Feedback IA)</label>
            <textarea
              className="w-full bg-black/40 border border-red-500/30 rounded-sm p-6 text-white outline-none min-h-[100px]"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Ej: Demasiado formal, el tono no encaja..."
            />
            <div className="flex gap-4">
              <button onClick={handleSaveReject} className="btn-secondary py-3 px-8 text-sm bg-red-500 text-white border-none">CONFIRMAR RECHAZO</button>
              <button onClick={() => setIsRejecting(false)} className="btn-tertiary">CANCELAR</button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-2xl font-body leading-relaxed text-gray-200 mb-8 whitespace-pre-wrap">{post.caption}</p>
            <div className="flex flex-wrap gap-4 pt-4 mb-4">
              {post.hashtags?.map((tag, i) => (
                <span key={i} className="text-[var(--primary)] text-[11px] font-mono font-black border-b border-[var(--primary)]/20 pb-1 italic opacity-80">#{tag.replace('#', '')}</span>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="p-8 bg-[var(--surface-dim)] border-t border-[var(--outline-variant)] flex items-center justify-between">
         <div className="flex gap-8">
            <div className="flex flex-col">
               <span className="label-tech text-gray-600 mb-0">Ecosistema Destino</span>
               <p className="text-sm font-display font-black text-white italic">INSTAGRAM / TWITTER</p>
            </div>
            <div className="flex flex-col">
               <span className="label-tech text-gray-600 mb-0">Confianza IA</span>
               <p className="text-sm font-mono font-black text-[var(--secondary)]">88% MATCH</p>
            </div>
         </div>

         {!isEditing && !isRejecting && post.status === 'pending' && (
           <div className="flex gap-3">
              <button 
                onClick={() => onApprove(post.id)}
                className="btn-primary py-3 px-10 text-xs border-2 border-transparent hover:border-[var(--secondary)] transition-all flex items-center gap-3"
              >
                APROBAR <Send size={16} />
              </button>
              <button 
                onClick={() => setIsEditing(true)}
                className="btn-tertiary px-6 hover:text-white"
              >
                <Edit3 size={16} />
              </button>
              <button 
                onClick={() => setIsRejecting(true)}
                className="btn-tertiary px-4 border-red-500/10 text-red-500/50 hover:bg-red-500/10 hover:text-red-400"
              >
                <X size={16} />
              </button>
           </div>
         )}
      </div>
    </div>
  );
};

const Posts = () => {
  const [posts, setPosts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const { activeBandId } = useActiveProject();
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
      const { data } = await postsAPI.today(activeBandId);
      setPosts(data.posts);
      setSummary({
        bandName: data.band_name,
        date: data.date,
        approvalRate: data.approval_rate_current
      });
    } catch (err) {
      console.error("Error loading posts", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await postsAPI.approve(id);
      loadData();
    } catch (err) { console.error(err); }
  };

  const handleEdit = async (id, text) => {
    try {
      await postsAPI.edit(id, { edited_caption: text });
      loadData();
    } catch (err) { console.error(err); }
  };

  const handleReject = async (id, reason) => {
    try {
      await postsAPI.reject(id, { reason });
      loadData();
    } catch (err) { console.error(err); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--surface)] flex items-center justify-center">
        <div className="w-16 h-1 w-full max-w-[200px] bg-white/5 relative overflow-hidden">
           <div className="absolute inset-y-0 bg-[var(--primary)] animate-[slide_1.2s_infinite]" style={{ width: '40%' }} />
        </div>
      </div>
    );
  }

  return (
    <Layout 
      title="Post Lab" 
      subtitle={`Ecosistema Activo: ${summary?.bandName}`}
    >
      <div className="max-w-5xl space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Header Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <div className="surface-card p-8 flex items-center justify-between">
              <div>
                 <p className="label-tech text-gray-500">Status ADN Global</p>
                 <h2 className="text-3xl font-display font-black text-white">{Math.round(summary?.approvalRate * 100)}%</h2>
              </div>
              <Activity size={24} className="text-[var(--secondary)] opacity-50" />
           </div>
           
           <div className="surface-card p-8 flex items-center justify-between border-t-2 border-t-[var(--primary)]">
              <div>
                 <p className="label-tech text-gray-500">Next Cycle Refresh</p>
                 <h2 className="text-3xl font-display font-black text-white italic">08:00 HRS</h2>
              </div>
              <Clock size={24} className="text-[var(--primary)] opacity-50" />
           </div>

           <div className="surface-card p-8 flex items-center justify-between border-t-2 border-t-[var(--secondary)] bg-gradient-to-br from-[#12121a] to-black">
              <div>
                 <p className="label-tech text-gray-500">Agent Focus</p>
                 <h2 className="text-lg font-display font-black text-[var(--secondary)] italic leading-none">HIGH FREQUENCY</h2>
              </div>
              <Sparkles size={24} className="text-[var(--secondary)] opacity-100" />
           </div>
        </div>

        {/* Content Section */}
        <div className="relative">
           <div className="flex items-center gap-6 mb-10">
              <h3 className="text-2xl font-display font-black text-white tracking-widest uppercase">
                <MessageSquare size={20} className="inline mr-3 text-[var(--primary)]" />
                Borradores Generativos Today
              </h3>
              <div className="h-px bg-[var(--outline-variant)] flex-1 opacity-20" />
           </div>

           {posts.length === 0 ? (
             <div className="bg-[var(--surface-dim)] border border-dashed border-[var(--outline-variant)] p-32 text-center rounded-sm">
               <div className="w-20 h-20 bg-white/5 rounded-sm flex items-center justify-center mx-auto mb-10 border border-[#484849]/10">
                 <AlertCircle size={40} className="text-gray-800" />
               </div>
               <h3 className="text-2xl font-display font-black mb-4 uppercase tracking-tighter">No hay señales entrantes</h3>
               <p className="text-gray-600 max-w-sm mx-auto font-mono text-xs font-black uppercase tracking-widest leading-relaxed">
                 Tus agentes están sincronizando con el ADN del ecosistema. Los nuevos borradores se inyectarán en el próximo ciclo.
               </p>
             </div>
           ) : (
             <div className="grid grid-cols-1 gap-12">
               {posts.map(post => (
                 <PostCard 
                   key={post.id} 
                   post={post} 
                   onApprove={handleApprove}
                   onEdit={handleEdit}
                   onReject={handleReject}
                 />
               ))}
             </div>
           )}
        </div>

        {/* Footer Guidance */}
        <div className="p-12 border-2 border-dashed border-[var(--outline-variant)] text-center opacity-50">
           <p className="text-[10px] font-mono font-black text-gray-500 uppercase tracking-widest leading-relaxed">
             Cada aprobación alimenta el procesador biométrico. <br />
             El sistema aprende de tus ediciones para optimizar la coherencia en futuras generaciones.
           </p>
        </div>
      </div>
    </Layout>
  );
};

export default Posts;
