import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Camera, 
  Cpu, 
  Sparkles, 
  Plus, 
  Clock, 
  Eye,
  Settings,
  Image as ImageIcon,
  X,
  ChevronRight,
  Activity,
  Zap
} from 'lucide-react';
import { useActiveProject } from '../context/ActiveProjectContext';
import { bandsAPI, membersAPI } from '../services/api';
import { useHeader } from '../context/HeaderContext';

const MemberCard = ({ name, role, status, progress }) => (
  <div className="surface-card flex flex-col p-0 group">
    <div className="p-6 pb-4 border-b border-[var(--outline-variant)] bg-[var(--surface-dim)] flex items-center justify-between">
       <span className="label-tech mb-0 text-white italic">MODEL UNIT: {name.split(' ')[0]}</span>
       <div className={`w-2 h-2 rounded-full ${status === 'Ready' ? 'bg-[var(--secondary)]' : 'bg-[var(--primary)] animate-pulse'}`} />
    </div>

    <div className="p-8 flex items-center gap-6">
      <div className="w-20 h-20 rounded-sm bg-black border border-[var(--outline-variant)] flex items-center justify-center text-gray-800 relative group-hover:border-[var(--primary)]/50 transition-all">
        <div className="absolute inset-0 bg-gradient-to-tr from-[var(--primary)]/5 to-transparent" />
        <Camera size={28} className="relative z-10" />
      </div>
      <div>
        <h4 className="text-2xl font-display font-black text-white uppercase tracking-tight leading-none mb-2">{name}</h4>
        <p className="text-[10px] text-[var(--on-surface-variant)] uppercase font-black tracking-widest">{role}</p>
      </div>
    </div>
    
    <div className="px-8 pb-8 space-y-5">
      <div className="flex justify-between items-center text-[9px] font-mono font-black uppercase tracking-[0.2em] italic text-gray-500">
        <span>Training Efficiency</span>
        <span className={status === 'Ready' ? 'text-[var(--secondary)]' : 'text-[var(--primary)]'}>
          {status === 'Ready' ? 'SYNCHED' : 'INITIALIZING'}
        </span>
      </div>
      
      <div className="w-full bg-black h-1 rounded-sm overflow-hidden flex">
        <div 
          className={`h-full transition-all duration-1000 ${status === 'Ready' ? 'bg-[var(--secondary)]' : 'bg-[var(--primary)]'}`}
          style={{ width: `${progress}%` }}
        />
        <div className="h-full bg-white opacity-5 flex-1" />
      </div>
    </div>

    <div className="mt-auto p-4 bg-white/5 border-t border-[var(--outline-variant)] text-center group-hover:bg-[var(--primary)]/10 transition-colors cursor-pointer">
       <button className="text-[11px] font-display font-black uppercase tracking-[0.2em] text-white/50 group-hover:text-white transition-colors">
          View Mesh Diagnostics
       </button>
    </div>
  </div>
);

const CreativeLab = () => {
  const { activeBandId } = useActiveProject();
  const { updateHeader } = useHeader();
  const [band, setBand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [members, setMembers] = useState([]);
  const [newMember, setNewMember] = useState({ name: '', role: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (activeBandId) loadData();
  }, [activeBandId]);

  useEffect(() => {
    if (band?.name) updateHeader('Creative Lab', `Ecosistema: ${band.name}`);
  }, [band?.name]);

  const loadData = async () => {
    try {
      const [bandRes, membersRes] = await Promise.all([
        bandsAPI.get(activeBandId),
        membersAPI.list(activeBandId)
      ]);
      setBand(bandRes.data);
      setMembers(membersRes.data.map(m => ({
        ...m,
        status: m.is_active ? 'Ready' : 'Training',
        progress: m.is_active ? 100 : 45
      })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async () => {
    if (!newMember.name || !newMember.role) return;
    setSaving(true);
    try {
      await membersAPI.create(activeBandId, {
        name: newMember.name,
        role: newMember.role,
        is_active: true
      });
      loadData();
      setShowAddModal(false);
      setNewMember({ name: '', role: '' });
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
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
    <div className="max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-1000 space-y-12">
        {/* Obsidian Hero Area - Asymmetric Header */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 surface-card p-12 flex flex-col md:flex-row items-center gap-12 border-t-4 border-t-[var(--primary)] bg-gradient-to-tr from-[var(--surface-dim)] to-black">
             <div className="w-56 h-56 bg-black p-2 border border-[var(--outline-variant)] flex items-center justify-center relative shadow-[0_0_50px_rgba(204,151,255,0.1)]">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/10 via-transparent to-[var(--secondary)]/10" />
                <Sparkles size={80} className="text-[var(--primary)] animate-pulse" />
                <div className="absolute -bottom-1 left-2 flex gap-1">
                   {[1,2,3,4].map(i => <div key={i} className="w-4 h-1 bg-[var(--primary)]" />)}
                </div>
             </div>
             
             <div className="flex-1 text-center md:text-left">
               <span className="label-tech text-[var(--primary)] mb-6">ID System Controller</span>
               <h3 className="text-5xl font-display font-black text-white italic tracking-tighter mb-4 leading-none">DIRECTOR DE <br/> IDENTIDAD</h3>
               <p className="text-gray-500 font-mono text-[10px] uppercase font-black tracking-widest leading-relaxed mb-8 max-w-lg">
                 Configura la arquitectura visual del ecosistema. Entrena modelos biométricos únicos para cada integrante de {band?.name} para asegurar la precisión del ADN visual en el Post Lab.
               </p>
               <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                  <div className="px-5 py-3 bg-[var(--surface-high)] border border-[#484849]/30 rounded-sm">
                    <p className="label-tech text-gray-600 mb-1">Processing Node</p>
                    <p className="text-xs font-mono font-black text-white uppercase italic">GPU-04: Active</p>
                  </div>
                  <div className="px-5 py-3 bg-[var(--surface-high)] border border-[#484849]/30 rounded-sm">
                    <p className="label-tech text-gray-600 mb-1">Architecture</p>
                    <p className="text-xs font-mono font-black text-[var(--primary)] uppercase italic">V. 2.0.4 Alpha</p>
                  </div>
               </div>
             </div>
          </div>

          <div className="surface-card flex flex-col justify-center items-center text-center p-12 border-r-4 border-r-[var(--secondary)] group">
             <div className="p-6 bg-black border border-[var(--outline-variant)] flex items-center justify-center mb-8 shadow-inner group-hover:border-[var(--secondary)]/50 transition-all">
                <ImageIcon size={48} className="text-gray-800" />
             </div>
             <h4 className="text-3xl font-display font-black text-white leading-none mb-2">RAW GLITCH <br/> DNA</h4>
             <p className="text-[9px] font-mono font-black text-gray-500 uppercase tracking-widest mb-10 italic">Core Processing Active</p>
             <button className="btn-secondary w-full py-4 text-xs font-black tracking-widest uppercase">
                Modify Style
             </button>
          </div>
        </div>

        {/* Members Grid Section */}
        <div className="pt-8">
           <div className="flex items-center gap-6 mb-12">
              <h3 className="text-2xl font-display font-black text-white tracking-widest uppercase italic">
                <Users size={24} className="inline mr-4 text-[var(--primary)]" /> Integrantes de Ecosistema
              </h3>
              <div className="h-px bg-[var(--outline-variant)] flex-1 opacity-20" />
              <button 
                onClick={() => setShowAddModal(true)}
                className="btn-tertiary px-8 py-4 border-[#484849]/30 group hover:border-[var(--primary)] hover:text-white"
              >
                <Plus size={20} className="group-hover:rotate-90 transition-all" /> New Unit
              </button>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
             {members.map(m => (
               <MemberCard key={m.id || m.name} {...m} />
             ))}
             
             {/* Add Member Card Placeholder */}
             <div 
                onClick={() => setShowAddModal(true)}
                className="border-2 border-dashed border-[var(--outline-variant)] p-12 flex flex-col items-center justify-center text-gray-800 hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all cursor-pointer group min-h-[350px] rounded-sm"
             >
                <div className="w-20 h-20 border border-current flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                  <Plus size={40} />
                </div>
                <p className="font-display font-black text-2xl uppercase tracking-tighter">Entrenar Nuevo</p>
                <p className="text-xs font-mono mt-2 tracking-widest opacity-40 uppercase">Awaiting Mesh Input</p>
             </div>
           </div>
        </div>

        {/* Technical Logs Footer */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-12 border-t border-[var(--outline-variant)] opacity-80">
           <div className="surface-card p-10 bg-black">
              <div className="flex items-center gap-4 mb-8">
                 <Activity size={24} className="text-[var(--secondary)]" />
                 <h3 className="text-xl font-display font-black text-white italic uppercase tracking-tighter">Render Fila V2.0</h3>
              </div>
              <div className="space-y-4">
                 {members.filter(m => !m.is_active).length > 0 ? (
                   members.filter(m => !m.is_active).map(m => (
                     <div key={m.id} className="flex flex-col p-6 bg-[var(--surface-dim)] border border-[var(--outline-variant)] group">
                        <div className="flex justify-between items-center mb-4">
                           <span className="text-[10px] font-mono font-black text-white tracking-widest uppercase">Process Initialized: {m.name}</span>
                           <span className="text-[8px] font-mono font-black text-[var(--secondary)] uppercase tracking-widest italic animate-pulse">Running</span>
                        </div>
                        <div className="w-full h-1 bg-[var(--surface-highest)] relative overflow-hidden">
                           <div className="absolute inset-y-0 left-0 bg-[var(--primary)] animate-[slide_2s_infinite]" style={{ width: '30%' }} />
                        </div>
                     </div>
                   ))
                 ) : (
                   <p className="text-[10px] font-mono font-black text-gray-600 uppercase tracking-widest py-10 text-center border-2 border-dashed border-[var(--outline-variant)]">No active training nodes in cycle.</p>
                 )}
              </div>
           </div>

           <div className="flex flex-col justify-center p-12">
              <Zap size={40} className="text-[var(--primary)] mb-8 opacity-40" />
              <h4 className="text-2xl font-display font-black text-white italic uppercase mb-4 leading-none">Biometric Neural <br/> Sync Active</h4>
              <p className="text-gray-600 font-mono text-[10px] uppercase font-black tracking-[0.2em] leading-relaxed">
                 La IA aprende de las correcciones manuales realizadas en el Post Lab. Al aprobar contenido en el Lab, el modelo visual se refina dinámicamente mediante redes adversarias generativas.
              </p>
              <div className="mt-10 flex gap-6">
                 {[1,2,3].map(i => <div key={i} className="w-12 h-1 bg-white/5" />)}
              </div>
           </div>
        </div>

        {/* Modal - Surface Container Highest */}
        {showAddModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl">
            <div className="bg-[var(--surface-high)] border border-[#484849]/30 rounded-sm p-16 max-w-lg w-full relative overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)]">
              <div className="absolute top-0 right-0 p-10 opacity-5">
                 <Cpu size={120} className="text-white" />
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="absolute top-8 right-8 text-gray-600 hover:text-white transition-colors"
                title="CLOSE"
              >
                <X size={32} />
              </button>
              
              <span className="label-tech text-[var(--primary)] mb-4">Deploy Unit</span>
              <h3 className="text-4xl font-display font-black text-white uppercase italic tracking-tighter mb-12 italic leading-none">Nuevo <br/> Integrante</h3>
              
              <div className="space-y-10">
                 <div className="group border-l-2 border-l-transparent focus-within:border-l-[var(--primary)] transition-all">
                   <label className="label-tech ml-4 text-gray-600">Nombre Completo</label>
                   <input 
                     type="text" 
                     value={newMember.name}
                     onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                     placeholder="Unit Identity ID"
                     className="w-full bg-transparent p-4 text-3xl font-display font-black text-white outline-none placeholder:text-gray-900 uppercase"
                   />
                 </div>
                 
                 <div className="group border-l-2 border-l-transparent focus-within:border-l-[var(--secondary)] transition-all">
                   <label className="label-tech ml-4 text-gray-600">Rol en el Ecosistema</label>
                   <input 
                     type="text" 
                     value={newMember.role}
                     onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                     placeholder="Functional Assignment"
                     className="w-full bg-transparent p-4 text-3xl font-display font-black text-white outline-none placeholder:text-gray-900 uppercase"
                   />
                 </div>

                 <div className="pt-8 flex flex-col gap-4">
                    <button 
                      onClick={handleAddMember}
                      disabled={saving || !newMember.name || !newMember.role}
                      className="btn-primary py-5 text-xl relative group overflow-hidden"
                    >
                      <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                      <Sparkles size={24} /> {saving ? 'SYNCING...' : 'INITIALIZE SYNC'}
                    </button>
                    <button onClick={() => setShowAddModal(false)} className="btn-tertiary border-none opacity-40 hover:opacity-100 py-2">CANCEL SIGNAL</button>
                 </div>
              </div>
            </div>
          </div>
        )}
      </div>
  );
};

export default CreativeLab;
