import React, { useState, useEffect, useCallback } from 'react';
import {
  Music,
  Globe,
  ShieldCheck,
  Zap,
  Linkedin,
  Twitter,
  Instagram,
  Plus,
  Brain,
  Search,
  ArrowUpRight,
  LogOut,
  Edit3,
  Lock,
  RefreshCw,
  Check,
  X,
  Users,
  MapPin,
  Clock,
  ToggleLeft,
  ToggleRight,
  Facebook,
  Youtube
} from 'lucide-react';
import { bandsAPI, networksAPI } from '../services/api';
import { useActiveProject } from '../context/ActiveProjectContext';
import { useHeader } from '../context/HeaderContext';
import HelpTooltip from '../components/HelpTooltip';
import DualRangeSlider from '../components/DualRangeSlider';
import PlatformConnectModal from '../components/PlatformConnectModal';
import { GEO, COUNTRIES } from '../constants/GeoData';

// ─── Constants ────────────────────────────────────────
const TONE_OPTIONS = ['Sarcástico', 'Energético', 'Crudo', 'Poético', 'Provocador', 'Íntimo', 'Épico', 'Oscuro', 'Visceral', 'Anti-corporativo'];
const VALUES_OPTIONS = ['Autenticidad', 'DIY', 'Comunidad', 'Libertad', 'Resistencia', 'Arte sobre Dinero', 'Lo Local', 'Experimentación', 'Inclusión', 'Rawness'];
const ROLE_OPTIONS = ['Cantante', 'Banda', 'Productor', 'DJ', 'Sello Discográfico', 'Manager', 'Colectivo', 'Agencia'];
const GENRE_OPTIONS = ['Rock Alternativo', 'Post-Punk', 'Indie Rock', 'Metal', 'Electronic', 'Hip-Hop', 'Jazz', 'Folk', 'Pop', 'R&B', 'Reggaeton', 'Cumbia', 'Cumbia Digital', 'Shoegaze', 'Ambient'];

const ALL_PLATFORMS = [
  { key: 'instagram', label: 'Instagram', Icon: Instagram, color: 'text-pink-400' },
  { key: 'twitter', label: 'Twitter / X', Icon: Twitter, color: 'text-blue-400' },
  { key: 'facebook', label: 'Facebook', Icon: Facebook, color: 'text-blue-600' },
  { key: 'youtube', label: 'YouTube', Icon: Youtube, color: 'text-red-500' },
  { key: 'tiktok', label: 'TikTok', Icon: Music, color: 'text-white' },
  { key: 'linkedin', label: 'LinkedIn', Icon: Linkedin, color: 'text-blue-400' },
];

const MAX_TAGS = 3;
const MAX_GENRES = 10;

// ─── Sub-components ───────────────────────────────────

const TagSelector = ({ label, options, selected = [], onChange, isEditing, help }) => {
  const [customInput, setCustomInput] = useState('');
  const toggle = (tag) => {
    if (!isEditing) return;
    if (selected.includes(tag)) {
      onChange(selected.filter(t => t !== tag));
    } else {
      if (selected.length >= MAX_TAGS) return;
      onChange([...selected, tag]);
    }
  };
  const addCustom = (e) => {
    if (e.key === 'Enter' && customInput.trim()) {
      e.preventDefault();
      if (selected.length < MAX_TAGS && !selected.includes(customInput.trim())) {
        onChange([...selected, customInput.trim()]);
      }
      setCustomInput('');
    }
  };
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <span className="text-[10px] font-mono font-black text-gray-600 uppercase tracking-widest">{label}</span>
          {help && <HelpTooltip message={help} />}
        </div>
        <span className={`text-[10px] font-mono font-black tracking-widest ${selected.length >= MAX_TAGS ? 'text-[var(--secondary)]' : 'text-gray-700'}`}>
          {selected.length}/{MAX_TAGS}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {selected.map(tag => (
          <span
            key={tag}
            onClick={() => toggle(tag)}
            className={`inline-flex items-center gap-2 px-3 py-1.5 text-[9px] font-mono font-black uppercase tracking-wider rounded-sm border transition-all ${isEditing
                ? 'bg-[var(--primary)]/20 border-[var(--primary)]/50 text-[var(--primary)] cursor-pointer hover:bg-red-500/20 hover:border-red-500/50 hover:text-red-400'
                : 'bg-[var(--primary)]/10 border-[var(--primary)]/20 text-[var(--primary)]/70'
              }`}
          >
            {isEditing && <X size={10} />}
            {tag}
          </span>
        ))}
        {isEditing && options.filter(o => !selected.includes(o)).map(option => (
          <button
            key={option}
            type="button"
            onClick={() => toggle(option)}
            disabled={selected.length >= MAX_TAGS}
            className="px-3 py-1.5 text-[9px] font-mono font-black uppercase border border-[var(--outline-variant)] text-gray-600 hover:border-[var(--primary)]/40 hover:text-[var(--primary)] disabled:opacity-30 disabled:cursor-not-allowed"
          >
            + {option}
          </button>
        ))}
      </div>
      {isEditing && (
        <div className="flex items-center gap-3 mt-2 border-b border-[var(--outline-variant)] pb-2 focus-within:border-[var(--primary)]">
          <span className="text-[9px] font-mono text-gray-700 uppercase tracking-widest">Custom +</span>
          <input
            type="text"
            value={customInput}
            onChange={e => setCustomInput(e.target.value)}
            onKeyDown={addCustom}
            placeholder="Escribe y pulsa Enter..."
            disabled={selected.length >= MAX_TAGS}
            className="bg-transparent text-white text-[10px] font-mono outline-none w-full placeholder:text-gray-800"
          />
        </div>
      )}
    </div>
  );
};

const NetworkCard = ({ network, onConnect, onScan, onDisconnect }) => {
  const isConnected = !!network.connected;
  const [confirming, setConfirming] = useState(false);
  const Platform = ALL_PLATFORMS.find(p => p.key === network.platform?.toLowerCase()) || { Icon: Globe, color: 'text-gray-500' };
  const { Icon, color } = Platform;

  return (
    <div className={`surface-card p-0 flex flex-col ${isConnected ? 'border-l-2 border-l-[var(--secondary)]' : 'border-l-2 border-l-transparent'}`}>
      <div className="p-4 flex items-center justify-between border-b border-[var(--outline-variant)] bg-[var(--surface-dim)]">
        <span className={`text-[9px] font-mono font-black uppercase tracking-[0.2em] ${color}`}>{network.platform}</span>
        {isConnected && <div className="w-1.5 h-1.5 rounded-full bg-[var(--secondary)] animate-pulse" />}
      </div>
      <div className="p-6 flex items-center gap-4">
        <div className={`w-12 h-12 border flex items-center justify-center ${isConnected ? 'bg-[var(--secondary)]/10 border-[var(--secondary)]/30 text-[var(--secondary)]' : 'bg-white/5 border-[var(--outline-variant)] text-gray-700'}`}>
          <Icon size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-display font-black text-white uppercase italic">{network.platform}</h4>
          <p className="text-[9px] font-mono text-gray-600 uppercase tracking-widest truncate">
            {isConnected ? `@${network.handle || 'connected'}` : 'Offline Node'}
          </p>
        </div>
      </div>
      <div className="mt-auto border-t border-[var(--outline-variant)]">
        {isConnected ? (
          confirming ? (
            <div className="p-3 bg-red-950/20 flex items-center justify-between gap-2">
              <span className="text-[8px] font-mono text-red-400 font-bold uppercase">¿Disconnect?</span>
              <div className="flex gap-1">
                <button onClick={() => onDisconnect(network.id)} className="px-2 py-1 bg-red-500/20 text-red-400 border border-red-500/30 text-[8px] font-mono font-black uppercase">SÍ</button>
                <button onClick={() => setConfirming(false)} className="px-2 py-1 border border-[var(--outline-variant)] text-gray-500 text-[8px] font-mono font-black uppercase">NO</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setConfirming(true)} className="w-full p-3 text-[9px] font-mono font-black text-red-500/60 hover:text-red-400 hover:bg-red-500/10 transition-all uppercase tracking-widest">
              Remove Signal Node →
            </button>
          )
        ) : (
          <button onClick={() => onConnect(network.platform?.toLowerCase())} className="w-full p-3 text-[9px] font-mono font-black text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-all uppercase tracking-widest">
            Authenticate Node →
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────

const Profile = () => {
  const { activeBandId } = useActiveProject();
  const { updateHeader } = useHeader();
  const [band, setBand] = useState(null);
  const [networks, setNetworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('identity');
  const [showConnectModal, setShowConnectModal] = useState(false);

  const loadData = useCallback(async () => {
    if (!activeBandId) return;
    try {
      setLoading(true);
      const [bandRes, netRes] = await Promise.all([
        bandsAPI.get(activeBandId),
        networksAPI.list(activeBandId),
      ]);
      setBand(bandRes.data);
      setNetworks(netRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeBandId]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (band?.name) updateHeader('ADN Profile', `Ecosistema: ${band.name}`);
  }, [band?.name]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const { name, genre, role, audience_age_min, audience_age_max, audience_country, audience_province, use_regional_slang, tone_keywords, values_keywords, auto_publish, posts_per_day } = band;
      const genreArr = Array.isArray(genre) ? genre : (genre ? genre.split(',').map(s => s.trim()).filter(Boolean) : []);
      await bandsAPI.update(activeBandId, {
        name, genre: genreArr.join(', '), role,
        audience_age_min, audience_age_max,
        audience_country, audience_province, use_regional_slang,
        tone_keywords, values_keywords, auto_publish, posts_per_day,
      });
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleConnect = async (platform) => {
    try {
      await networksAPI.connect(platform, activeBandId, { handle: `${band.name.replace(/\s+/g, '').toLowerCase()}_official` });
      await loadData();
    } catch (err) { console.error(err); }
  };

  const handleDisconnect = async (networkId) => {
    try { await networksAPI.disconnect(networkId); await loadData(); }
    catch (err) { console.error(err); }
  };

  if (loading) return (
    <div className="min-h-[500px] flex items-center justify-center">
      <div className="w-48 h-1 bg-white/5 relative overflow-hidden">
        <div className="absolute inset-y-0 bg-[var(--primary)] animate-[slide_1.5s_infinite]" style={{ width: '40%' }} />
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl space-y-8 pb-20">

      {/* ── Header Card ── */}
      <div className="surface-card p-8 flex items-center justify-between border-t-2 border-t-[var(--primary)]">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-black border border-[var(--outline-variant)]">
            <Brain size={32} className="text-[var(--primary)]" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-black text-gray-700 uppercase tracking-widest">Protocolo de Identidad</span>
            <h2 className="text-3xl font-display font-black text-white italic truncate">{band?.name}</h2>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-mono font-black text-gray-700 uppercase tracking-widest">IA Match Score</span>
          <div className="flex items-center gap-3 justify-end mt-1">
            <span className="text-3xl font-display font-black text-[var(--secondary)] italic">{Math.round((band?.confidence_score || 0) * 100)}%</span>
          </div>
        </div>
      </div>

      {/* ── Tabs Navigation ── */}
      <div className="flex items-center gap-2 border-b border-[var(--outline-variant)]">
        {[
          { id: 'identity', label: 'Identidad Artística', icon: <Users size={14} /> },
          { id: 'engine', label: 'Motor de IA', icon: <Zap size={14} /> },
          { id: 'networks', label: 'Nodos de Señal', icon: <Globe size={14} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-4 text-[10px] font-mono font-black uppercase tracking-widest transition-all relative
                ${activeTab === tab.id ? 'text-white' : 'text-gray-600 hover:text-gray-400'}`}
          >
            {tab.icon} {tab.label}
            {activeTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--primary)]" />}
          </button>
        ))}

        <div className="ml-auto pb-2 flex gap-3">
          {isEditing ? (
            <>
              <button onClick={() => { setIsEditing(false); loadData(); }} className="text-[10px] font-mono font-black uppercase text-gray-700 hover:text-white px-4">Cancelar</button>
              <button onClick={handleSubmit} disabled={saving} className="btn-primary py-2 px-6 text-xs">{saving ? 'Guardando...' : 'Guardar ADN'}</button>
            </>
          ) : (
            <button onClick={() => setIsEditing(true)} className="btn-secondary py-2 px-6 text-xs flex items-center gap-2">
              <Edit3 size={12} /> Editar ADN
            </button>
          )}
        </div>
      </div>

      {/* ── Tab Content ── */}
      <div className="">

        {/* 1. IDENTITY TAB */}
        {activeTab === 'identity' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="surface-card p-8 bg-gradient-to-tr from-[var(--surface-dim)] to-[var(--surface)]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <label className="text-[10px] font-mono font-black text-gray-600 uppercase tracking-widest flex items-center gap-2">
                      <Brain size={12} /> Rol en la Entidad
                    </label>
                    {isEditing ? (
                      <select
                        value={band?.role || ''}
                        onChange={e => setBand({ ...band, role: e.target.value })}
                        className="w-full bg-[var(--surface-highest)] p-3 text-sm font-mono font-black text-white uppercase border border-[var(--outline-variant)] focus:border-[var(--secondary)] outline-none"
                      >
                        <option value="">Seleccionar...</option>
                        {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    ) : (
                      <p className="text-xl font-display font-black text-white uppercase italic">{band?.role || '—'}</p>
                    )}
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-mono font-black text-gray-600 uppercase tracking-widest flex items-center gap-2">
                      <MapPin size={12} /> Territorio Mainstream
                      <HelpTooltip text="País y región que define los modismos, trends y canales prioritarios." />
                    </label>
                    {isEditing ? (
                      <div className="space-y-2">
                        <select
                          value={band?.audience_country || ''}
                          onChange={e => setBand({ ...band, audience_country: e.target.value, audience_province: '' })}
                          className="w-full bg-[var(--surface-highest)] p-2 text-[11px] font-mono font-black text-white uppercase border border-[var(--outline-variant)] focus:border-[var(--primary)] outline-none"
                        >
                          <option value="">País...</option>
                          {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <select
                          value={band?.audience_province || ''}
                          onChange={e => setBand({ ...band, audience_province: e.target.value })}
                          disabled={!band?.audience_country}
                          className="w-full bg-[var(--surface-highest)] p-2 text-[11px] font-mono font-black text-white uppercase border border-[var(--outline-variant)] focus:border-[var(--primary)] outline-none disabled:opacity-30"
                        >
                          <option value="">Provincia / Estado...</option>
                          {(GEO[band?.audience_country] || []).map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[9px] font-mono text-gray-600 uppercase tracking-widest">Regional Slang</span>
                          <button
                            type="button"
                            onClick={() => setBand({ ...band, use_regional_slang: !band.use_regional_slang })}
                            className={`text-[8px] font-mono font-black uppercase px-3 py-1 border transition-all ${band?.use_regional_slang ? 'border-[var(--secondary)]/50 bg-[var(--secondary)]/10 text-[var(--secondary)]' : 'border-[var(--outline-variant)] text-gray-600'}`}
                          >
                            {band?.use_regional_slang ? 'Active' : 'Inactive'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xl font-display font-black text-white uppercase italic">
                          {band?.audience_country || '—'}{band?.audience_province ? ` / ${band.audience_province}` : ''}
                        </p>
                        <span className={`text-[8px] font-mono font-black uppercase mt-1 inline-block px-2 py-0.5 ${band?.use_regional_slang ? 'text-[var(--secondary)] bg-[var(--secondary)]/10' : 'text-gray-700'}`}>
                          Regional Slang: {band?.use_regional_slang ? 'Active' : 'Off'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="surface-card p-8">
                <span className="text-[10px] font-mono font-black text-gray-600 uppercase tracking-widest mb-6 block">Géneros Musicales</span>
                <div className="flex flex-wrap gap-2">
                  {GENRE_OPTIONS.map(genre => {
                    const isSelected = (Array.isArray(band?.genre) ? band.genre : (band?.genre || '').split(', ')).includes(genre);
                    return (
                      <button
                        key={genre}
                        onClick={() => {
                          if (!isEditing) return;
                          const current = Array.isArray(band.genre) ? band.genre : (band.genre || '').split(', ').filter(Boolean);
                          const next = isSelected ? current.filter(g => g !== genre) : [...current, genre].slice(0, MAX_GENRES);
                          setBand({ ...band, genre: next });
                        }}
                        disabled={!isEditing && !isSelected}
                        className={`px-3 py-1.5 text-[9px] font-mono font-black uppercase tracking-widest border transition-all
                            ${isSelected
                            ? 'bg-[var(--secondary)]/20 border-[var(--secondary)]/50 text-[var(--secondary)]'
                            : 'border-[var(--outline-variant)] text-gray-700 hover:text-gray-400 opacity-60'}
                            ${!isEditing && !isSelected ? 'hidden' : ''}`}
                      >
                        {genre}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="surface-card p-8 bg-black border border-[var(--outline-variant)]">
                <Users size={24} className="text-[var(--primary)] mb-4" />
                <p className="text-[10px] font-mono font-black text-gray-600 uppercase tracking-widest mb-4">Rango de Edad Target</p>
                <DualRangeSlider
                  value={[band?.audience_age_min || 18, band?.audience_age_max || 35]}
                  onChange={([min, max]) => setBand({ ...band, audience_age_min: min, audience_age_max: max })}
                  disabled={!isEditing}
                />
                <p className="text-[8px] font-mono text-gray-700 uppercase mt-4">IA utiliza esto para calibrar modismos y canales.</p>
              </div>
            </div>
          </div>
        )}

        {/* 2. ENGINE TAB */}
        {activeTab === 'engine' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="surface-card p-8 border-l-2 border-l-[var(--primary)]">
              <TagSelector
                label="Tono de Voz (Contextual)"
                help="Define la actitud de la IA al redactar. Elige hasta 3 para dar personalidad única."
                options={TONE_OPTIONS}
                selected={band?.tone_keywords || []}
                onChange={val => setBand({ ...band, tone_keywords: val })}
                isEditing={isEditing}
              />
            </div>
            <div className="surface-card p-8 border-l-2 border-l-[var(--secondary)]">
              <TagSelector
                label="Valores & Estética Core"
                help="Estos conceptos guían el propósito y la visualidad de las señales generadas."
                options={VALUES_OPTIONS}
                selected={band?.values_keywords || []}
                onChange={val => setBand({ ...band, values_keywords: val })}
                isEditing={isEditing}
              />
            </div>

            <div className="md:col-span-2 surface-card p-8 bg-black">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="flex items-center justify-between p-6 border border-[var(--outline-variant)] bg-white/5">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-mono font-black text-white uppercase tracking-widest">Auto-Publicar Signals</h4>
                      <HelpTooltip message="Si se activa, los posts aprobados se inyectarán en las redes automáticamente según tu horario." />
                    </div>
                    <p className="text-[9px] font-mono text-gray-600 uppercase mt-1">Requiere aprobación manual de batch</p>
                  </div>
                  <button
                    onClick={() => isEditing && setBand({ ...band, auto_publish: !band.auto_publish })}
                    className={`transition-all ${!isEditing ? 'opacity-30' : ''}`}
                  >
                    {band?.auto_publish ? <ToggleRight size={40} className="text-[var(--secondary)]" /> : <ToggleLeft size={40} className="text-gray-700" />}
                  </button>
                </div>

                <div className="p-6 border border-[var(--outline-variant)] bg-white/5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-mono font-black text-white uppercase tracking-widest">Carga Semántica Diaria</h4>
                      <HelpTooltip message="Define cuántas propuestas estratégicas generará el Agente cada 24 horas." />
                    </div>
                    <span className="text-2xl font-display font-black text-[var(--primary)] italic">{band?.posts_per_day || 5}</span>
                  </div>
                  <input
                    type="range" min="1" max="10"
                    value={band?.posts_per_day || 5}
                    onChange={e => isEditing && setBand({ ...band, posts_per_day: parseInt(e.target.value) })}
                    disabled={!isEditing}
                    className="w-full accent-[var(--primary)] opacity-80 cursor-pointer"
                  />
                  <p className="text-[8px] font-mono text-gray-700 uppercase">Cantidad de posts/señales propuestas por el agente cada 24hs.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. NETWORKS TAB */}
        {activeTab === 'networks' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between px-2">
              <div>
                <h3 className="text-lg font-display font-black text-white italic uppercase tracking-widest">Active Signal Nodes</h3>
                <p className="text-[9px] font-mono text-gray-600 uppercase tracking-widest">Puntos de inyección de contenido autenticados</p>
              </div>
              <div className="p-3 border border-[var(--primary)]/30 bg-[var(--primary)]/5 text-[var(--primary)] text-[9px] font-mono font-black uppercase">
                AES-256 Cloud Encrypted Connectivity
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {networks.length === 0 ? (
                <div className="lg:col-span-3 border-2 border-dashed border-[var(--outline-variant)] p-20 flex flex-col items-center justify-center text-gray-700">
                  <Globe size={40} className="mb-4 opacity-20" />
                  <p className="text-xs font-mono font-black uppercase tracking-widest">Sin nodos activos</p>
                </div>
              ) : (
                networks.map(net => (
                  <NetworkCard
                    key={net.id}
                    network={{ ...net, connected: net.is_active }}
                    onConnect={handleConnect}
                    onDisconnect={handleDisconnect}
                  />
                ))
              )}
              {/* Add new node placeholder */}
              <div
                onClick={() => setShowConnectModal(true)}
                className="surface-card border-dashed border-2 border-[var(--outline-variant)] flex flex-col items-center justify-center p-8 opacity-40 hover:opacity-100 hover:border-[var(--primary)] transition-all cursor-pointer"
              >
                <Plus size={24} className="mb-2" />
                <span className="text-[9px] font-mono font-black uppercase tracking-widest">Deploy New Node</span>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ── Footer ── */}
      <div className="pt-12 border-t border-[var(--outline-variant)] flex flex-col md:flex-row items-center justify-between gap-6 opacity-60">
        <div className="flex items-center gap-4">
          <ShieldCheck size={20} className="text-[var(--secondary)]" />
          <p className="text-[9px] font-mono text-gray-700 uppercase tracking-widest max-w-sm">Tus datos de ADN se inyectan en el modelo de lenguaje de forma privada y segura.</p>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-[8px] font-mono text-gray-800 uppercase tracking-widest">Engine: v2.4 Universal</span>
          <span className="text-[8px] font-mono text-gray-800 uppercase tracking-widest">Synced: {new Date().toISOString().split('T')[0]}</span>
        </div>
      </div>

      {showConnectModal && (
        <PlatformConnectModal
          onConnect={handleConnect}
          onClose={() => setShowConnectModal(false)}
          connectedKeys={networks.map(n => n.platform?.toLowerCase())}
        />
      )}
    </div>
  );
};

export default Profile;
