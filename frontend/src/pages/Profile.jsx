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
  AlertTriangle,
  Users,
  MapPin,
  Clock,
  ToggleLeft,
  ToggleRight,
  ChevronDown
} from 'lucide-react';
import { bandsAPI, networksAPI } from '../services/api';
import Layout from '../components/Layout';
import { useActiveProject } from '../context/ActiveProjectContext';

// ─── Constants ────────────────────────────────────────
const TONE_OPTIONS = ['Sarcástico', 'Energético', 'Crudo', 'Poético', 'Provocador', 'Íntimo', 'Épico', 'Oscuro', 'Visceral', 'Anti-corporativo'];
const VALUES_OPTIONS = ['Autenticidad', 'DIY', 'Comunidad', 'Libertad', 'Resistencia', 'Arte sobre Dinero', 'Lo Local', 'Experimentación', 'Inclusión', 'Rawness'];
const ROLE_OPTIONS = ['Cantante', 'Banda', 'Productor', 'DJ', 'Sello Discográfico', 'Manager', 'Colectivo', 'Agencia'];
const GENRE_OPTIONS = ['Rock Alternativo', 'Post-Punk', 'Indie Rock', 'Metal', 'Electronic', 'Hip-Hop', 'Jazz', 'Folk', 'Pop', 'R&B', 'Reggaeton', 'Cumbia', 'Cumbia Digital', 'Shoegaze', 'Ambient'];
const ALL_PLATFORMS = [
  { key: 'instagram', label: 'Instagram', Icon: Instagram },
  { key: 'twitter', label: 'Twitter / X', Icon: Twitter },
  { key: 'linkedin', label: 'LinkedIn', Icon: Linkedin },
  { key: 'tiktok', label: 'TikTok', Icon: Music },
  { key: 'spotify', label: 'Spotify', Icon: Music },
  { key: 'facebook', label: 'Facebook', Icon: Globe },
];

const MAX_TAGS = 3;
const MAX_GENRES = 10;

// ─── TagSelector ─────────────────────────────────────
const TagSelector = ({ label, options, selected = [], onChange, isEditing }) => {
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
        <span className="label-tech mb-0">{label}</span>
        <span className={`text-[10px] font-mono font-black tracking-widest ${selected.length >= MAX_TAGS ? 'text-[var(--secondary)]' : 'text-gray-600'}`}>
          {selected.length}/{MAX_TAGS}
        </span>
      </div>

      {/* Active tags */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map(tag => (
            <span
              key={tag}
              onClick={() => toggle(tag)}
              className={`inline-flex items-center gap-2 px-3 py-1.5 text-[10px] font-mono font-black uppercase tracking-wider rounded-sm border ${
                isEditing
                  ? 'bg-[var(--primary)]/20 border-[var(--primary)]/50 text-[var(--primary)] cursor-pointer hover:bg-red-500/20 hover:border-red-500/50 hover:text-red-400'
                  : 'bg-[var(--primary)]/10 border-[var(--primary)]/30 text-[var(--primary)] cursor-default'
              } transition-all`}
            >
              {isEditing && <X size={10} />}
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Options grid (only when editing) */}
      {isEditing && (
        <>
          <div className="flex flex-wrap gap-2">
            {options.filter(o => !selected.includes(o)).map(option => (
              <button
                key={option}
                type="button"
                onClick={() => toggle(option)}
                disabled={selected.length >= MAX_TAGS}
                className={`px-3 py-1.5 text-[10px] font-mono font-black uppercase tracking-wider rounded-sm border transition-all
                  ${selected.length >= MAX_TAGS
                    ? 'border-[var(--outline-variant)] text-gray-700 cursor-not-allowed opacity-40'
                    : 'border-[var(--outline-variant)] text-gray-500 hover:border-[var(--primary)]/50 hover:text-[var(--primary)] cursor-pointer'
                  }`}
              >
                + {option}
              </button>
            ))}
          </div>
          {/* Custom tag input */}
          <div className="flex items-center gap-3 mt-2 border-b border-[var(--outline-variant)] pb-2 focus-within:border-[var(--secondary)]">
            <span className="text-[10px] font-mono text-gray-600 uppercase tracking-widest whitespace-nowrap">Custom +</span>
            <input
              type="text"
              value={customInput}
              onChange={e => setCustomInput(e.target.value)}
              onKeyDown={addCustom}
              placeholder="Escribe y pulsa Enter..."
              disabled={selected.length >= MAX_TAGS}
              className="bg-transparent text-white text-xs font-mono outline-none w-full placeholder:text-gray-800 disabled:cursor-not-allowed"
            />
          </div>
        </>
      )}
    </div>
  );
};

// ─── GenreSelector ────────────────────────────────────
const GenreSelector = ({ selected = [], onChange, isEditing }) => {
  const toggle = (genre) => {
    if (!isEditing) return;
    if (selected.includes(genre)) {
      onChange(selected.filter(g => g !== genre));
    } else {
      if (selected.length >= MAX_GENRES) return;
      onChange([...selected, genre]);
    }
  };

  // Parse from string if needed
  const selectedArr = typeof selected === 'string' ? selected.split(',').map(s => s.trim()).filter(Boolean) : (selected || []);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="label-tech mb-0">Géneros Musicales</span>
        <span className={`text-[10px] font-mono font-black tracking-widest ${selectedArr.length >= MAX_GENRES ? 'text-[var(--secondary)]' : 'text-gray-600'}`}>
          {selectedArr.length}/{MAX_GENRES}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {GENRE_OPTIONS.map(genre => {
          const isOn = selectedArr.includes(genre);
          return (
            <button
              key={genre}
              type="button"
              onClick={() => {
                if (!isEditing) return;
                const next = isOn ? selectedArr.filter(g => g !== genre) : [...selectedArr, genre];
                onChange(next);
              }}
              disabled={isEditing && !isOn && selectedArr.length >= MAX_GENRES}
              className={`px-3 py-1.5 text-[10px] font-mono font-black uppercase tracking-wider rounded-sm border transition-all
                ${isOn
                  ? 'bg-[var(--secondary)]/20 border-[var(--secondary)]/60 text-[var(--secondary)]'
                  : isEditing
                    ? 'border-[var(--outline-variant)] text-gray-500 hover:border-[var(--secondary)]/40 hover:text-[var(--secondary)] cursor-pointer'
                    : 'border-[var(--outline-variant)] text-gray-700 cursor-default'
                } ${isEditing && !isOn && selectedArr.length >= MAX_GENRES ? 'opacity-30 cursor-not-allowed' : ''}`}
            >
              {isOn && isEditing ? <span className="inline-flex items-center gap-1"><Check size={8} /> {genre}</span> : genre}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ─── NetworkCard ──────────────────────────────────────
const NetworkCard = ({ network, onConnect, onScan, onDisconnect }) => {
  const isConnected = !!network.connected;
  const [scanning, setScanning] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const PlatformInfo = ALL_PLATFORMS.find(p => p.key === network.platform?.toLowerCase()) || { Icon: Globe };
  const { Icon } = PlatformInfo;

  const handleScan = async () => {
    setScanning(true);
    await onScan(network.id);
    setScanning(false);
  };

  return (
    <div className={`surface-card p-0 flex flex-col ${isConnected ? 'border-l-2 border-l-[var(--secondary)]' : 'border-l-2 border-l-transparent'}`}>
      {/* Header */}
      <div className="p-5 pb-3 border-b border-[var(--outline-variant)] bg-[var(--surface-dim)] flex items-center justify-between">
        <span className="label-tech mb-0 text-white italic">PORT: {network.platform?.toUpperCase()}</span>
        {isConnected && <div className="w-1.5 h-1.5 rounded-full bg-[var(--secondary)] animate-pulse" />}
      </div>

      {/* Body */}
      <div className="p-6 flex items-center gap-5">
        <div className={`w-14 h-14 rounded-sm border flex items-center justify-center flex-shrink-0 ${isConnected ? 'bg-[var(--secondary)]/10 border-[var(--secondary)]/30 text-[var(--secondary)]' : 'bg-white/5 border-[var(--outline-variant)] text-gray-700'}`}>
          <Icon size={24} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-lg font-display font-black text-white leading-none uppercase mb-1">{network.platform}</h4>
          {isConnected ? (
            <>
              <p className="text-[9px] font-mono font-black text-gray-500 uppercase tracking-widest truncate">
                @{network.handle || network.username || 'connected'}
              </p>
              {network.followers_count > 0 && (
                <p className="text-[9px] font-mono text-[var(--secondary)] mt-0.5">
                  {network.followers_count.toLocaleString()} followers
                </p>
              )}
            </>
          ) : (
            <p className="text-[9px] font-mono font-black text-gray-600 uppercase tracking-widest">Ready for Signal</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-auto border-t border-[var(--outline-variant)]">
        {isConnected ? (
          confirming ? (
            <div className="p-4 bg-red-950/30 flex items-center justify-between gap-3">
              <span className="text-[9px] font-mono font-black text-red-400 uppercase tracking-widest">¿Confirmar Hard-Reset?</span>
              <div className="flex gap-2">
                <button onClick={() => onDisconnect(network.id)} className="text-[8px] font-mono font-black uppercase px-3 py-1.5 bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/40 transition-all">
                  SÍ
                </button>
                <button onClick={() => setConfirming(false)} className="text-[8px] font-mono font-black uppercase px-3 py-1.5 border border-[var(--outline-variant)] text-gray-500 hover:text-white transition-all">
                  NO
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 flex gap-2">
              <button
                onClick={handleScan}
                disabled={scanning}
                className="flex-1 flex items-center justify-center gap-2 text-[9px] font-mono font-black uppercase tracking-widest text-[var(--primary)] border border-[var(--primary)]/20 py-2 hover:bg-[var(--primary)]/10 transition-all disabled:opacity-50"
              >
                <RefreshCw size={10} className={scanning ? 'animate-spin' : ''} />
                {scanning ? 'Scanning...' : 'Scan'}
              </button>
              <button
                onClick={() => setConfirming(true)}
                className="px-4 flex items-center justify-center text-[9px] font-mono font-black uppercase tracking-widest text-red-500/60 border border-red-500/20 py-2 hover:bg-red-500/10 hover:text-red-400 transition-all"
              >
                <LogOut size={10} />
              </button>
            </div>
          )
        ) : (
          <button
            onClick={() => onConnect(network.platform?.toLowerCase())}
            className="w-full p-4 text-[9px] font-mono font-black uppercase tracking-widest text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-all text-center"
          >
            Authenticate Node →
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Main Profile ─────────────────────────────────────
const Profile = () => {
  const { activeBandId } = useActiveProject();
  const [band, setBand] = useState(null);
  const [networks, setNetworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { name, genre, role, audience_age_range, audience_location, tone_keywords, values_keywords, auto_publish, posts_per_day } = band;
      // genre stored as array, send as comma-separated or array per backend
      const genreArr = Array.isArray(genre) ? genre : (genre ? genre.split(',').map(s => s.trim()).filter(Boolean) : []);
      await bandsAPI.update(activeBandId, {
        name, genre: genreArr.join(', '), audience_age_range, audience_location,
        tone_keywords, values_keywords, auto_publish, posts_per_day,
      });
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleConnect = async (platform) => {
    try {
      await networksAPI.connect(platform, activeBandId, { handle: `${band.name.replace(/\s+/g, '').toLowerCase()}_official` });
      setShowConnectModal(false);
      await loadData();
    } catch (err) { console.error(err); }
  };

  const handleScan = async (networkId) => {
    try { await networksAPI.scan(networkId); await loadData(); }
    catch (err) { console.error(err); }
  };

  const handleDisconnect = async (networkId) => {
    try { await networksAPI.disconnect(networkId); await loadData(); }
    catch (err) { console.error(err); }
  };

  const connectedPlatforms = new Set(networks.filter(n => n.is_active).map(n => n.platform?.toLowerCase()));
  const availablePlatforms = ALL_PLATFORMS.filter(p => !connectedPlatforms.has(p.key));

  // Helpers for stored genre (might be string or array)
  const genreArray = band
    ? (Array.isArray(band.genre) ? band.genre : (band.genre ? band.genre.split(',').map(s => s.trim()).filter(Boolean) : []))
    : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--surface)] flex items-center justify-center p-12">
        <div className="w-full max-w-sm h-1 bg-white/5 relative overflow-hidden">
          <div className="absolute inset-y-0 bg-[var(--primary)] animate-[slide_1.2s_infinite]" style={{ width: '40%' }} />
        </div>
      </div>
    );
  }

  return (
    <Layout title="ADN Profile" subtitle={`Ecosistema: ${band?.name}`}>
      <div className="max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-12 pb-24">

        {/* ── Edit Mode Header ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {isEditing ? (
              <span className="flex items-center gap-2 text-[10px] font-mono font-black text-[var(--secondary)] uppercase tracking-widest">
                <Edit3 size={12} className="animate-pulse" /> Modo Edición Activo
              </span>
            ) : (
              <span className="flex items-center gap-2 text-[10px] font-mono font-black text-gray-600 uppercase tracking-widest">
                <Lock size={12} /> ADN Protegido - Solo Lectura
              </span>
            )}
          </div>
          <div className="flex gap-3">
            {isEditing ? (
              <>
                <button type="button" onClick={() => { setIsEditing(false); loadData(); }} className="btn-tertiary py-2 px-6 text-xs">
                  Cancelar
                </button>
                <button form="adn-form" type="submit" disabled={saving} className="btn-primary py-2 px-8 text-sm">
                  {saving ? 'SAVING...' : (saveSuccess ? <><Check size={14} /> SAVED</> : <>GUARDAR ADN <ArrowUpRight size={14} /></>)}
                </button>
              </>
            ) : (
              <button type="button" onClick={() => setIsEditing(true)} className="btn-primary py-2 px-8 text-sm">
                <Edit3 size={14} /> EDITAR ADN
              </button>
            )}
          </div>
        </div>

        <form id="adn-form" onSubmit={handleSubmit} className="space-y-8">

          {/* ── IA Score + Identity Header ── */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* IA Match Card */}
            <div className="lg:col-span-1 surface-card p-8 flex flex-col justify-center items-center text-center border-t-4 border-t-[var(--primary)]">
              <div className="p-5 bg-black border border-[var(--outline-variant)] mb-5 shadow-inner">
                <Brain size={40} className="text-[var(--primary)]" />
              </div>
              <span className="label-tech text-gray-600 mb-1">IA Match Rate</span>
              <h2 className="text-5xl font-display font-black text-white italic">{Math.round((band?.confidence_score || 0) * 100)}%</h2>
              <div className="w-full h-1 bg-white/5 mt-4 relative overflow-hidden">
                <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] transition-all duration-1000" style={{ width: `${Math.round((band?.confidence_score || 0) * 100)}%` }} />
              </div>
              <p className="text-[9px] font-mono font-black text-[var(--secondary)] uppercase tracking-[0.2em] mt-3">Precision Synced</p>
            </div>

            {/* Core Identity Fields */}
            <div className="lg:col-span-3 surface-card p-10 bg-gradient-to-tr from-[var(--surface-dim)] to-black">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Entity Name */}
                <div className={`border-l-2 transition-all ${isEditing ? 'border-l-[var(--primary)]' : 'border-l-transparent'}`}>
                  <label className="label-tech ml-4">Nombre de la Entidad</label>
                  <input
                    type="text"
                    value={band?.name || ''}
                    onChange={e => setBand({ ...band, name: e.target.value })}
                    disabled={!isEditing}
                    className="w-full bg-transparent p-4 text-2xl font-display font-black text-white outline-none uppercase italic disabled:opacity-70"
                  />
                </div>

                {/* Role */}
                <div className={`border-l-2 transition-all ${isEditing ? 'border-l-[var(--secondary)]' : 'border-l-transparent'}`}>
                  <label className="label-tech ml-4">Tipo de Entidad</label>
                  {isEditing ? (
                    <select
                      value={band?.role || ''}
                      onChange={e => setBand({ ...band, role: e.target.value })}
                      className="w-full bg-[var(--surface-highest)] ml-4 mt-2 p-3 text-white font-mono font-black text-sm outline-none border border-[var(--outline-variant)] focus:border-[var(--secondary)] uppercase rounded-sm appearance-none"
                    >
                      <option value="">Seleccionar Rol...</option>
                      {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  ) : (
                    <p className="p-4 ml-4 text-xl font-display font-black text-gray-400 uppercase italic">
                      {band?.role || '—'}
                    </p>
                  )}
                </div>

                {/* Audience Age */}
                <div className={`border-l-2 transition-all ${isEditing ? 'border-l-[var(--primary)]' : 'border-l-transparent'}`}>
                  <label className="label-tech ml-4 flex items-center gap-2"><Users size={10} /> Rango de Edad Audiencia</label>
                  <input
                    type="text"
                    value={band?.audience_age_range || ''}
                    onChange={e => setBand({ ...band, audience_age_range: e.target.value })}
                    disabled={!isEditing}
                    placeholder="ej: 18-30"
                    className="w-full bg-transparent p-4 ml-4 text-xl font-mono font-black text-white outline-none disabled:opacity-70 placeholder:text-gray-800"
                  />
                </div>

                {/* Audience Location */}
                <div className={`border-l-2 transition-all ${isEditing ? 'border-l-[var(--primary)]' : 'border-l-transparent'}`}>
                  <label className="label-tech ml-4 flex items-center gap-2"><MapPin size={10} /> Ubicación Audiencia</label>
                  <input
                    type="text"
                    value={band?.audience_location || ''}
                    onChange={e => setBand({ ...band, audience_location: e.target.value })}
                    disabled={!isEditing}
                    placeholder="ej: CABA, Argentina"
                    className="w-full bg-transparent p-4 ml-4 text-xl font-mono font-black text-white outline-none disabled:opacity-70 placeholder:text-gray-800"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── Genres ── */}
          <div className="surface-card p-8">
            <GenreSelector
              selected={genreArray}
              onChange={val => setBand({ ...band, genre: val })}
              isEditing={isEditing}
            />
          </div>

          {/* ── ADN Tags: Tono & Valores ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="surface-card p-8 border-t-2 border-t-[var(--primary)]">
              <div className="flex items-center gap-3 mb-6">
                <Zap size={16} className="text-[var(--primary)]" />
                <h3 className="text-sm font-display font-black text-white uppercase tracking-widest leading-none">Tono de Voz</h3>
              </div>
              <TagSelector
                label="Selecciona hasta 3 etiquetas de Tono"
                options={TONE_OPTIONS}
                selected={band?.tone_keywords || []}
                onChange={val => setBand({ ...band, tone_keywords: val })}
                isEditing={isEditing}
              />
            </div>

            <div className="surface-card p-8 border-t-2 border-t-[var(--secondary)]">
              <div className="flex items-center gap-3 mb-6">
                <ShieldCheck size={16} className="text-[var(--secondary)]" />
                <h3 className="text-sm font-display font-black text-white uppercase tracking-widest leading-none">Valores Core</h3>
              </div>
              <TagSelector
                label="Selecciona hasta 3 etiquetas de Valores"
                options={VALUES_OPTIONS}
                selected={band?.values_keywords || []}
                onChange={val => setBand({ ...band, values_keywords: val })}
                isEditing={isEditing}
              />
            </div>
          </div>

          {/* ── IA Config: Auto-publish & Posts/day ── */}
          <div className="surface-card p-8 border-l-4 border-l-[var(--primary)] bg-black">
            <div className="flex items-center gap-3 mb-6">
              <Brain size={16} className="text-[var(--primary)]" />
              <h3 className="text-sm font-display font-black text-white uppercase tracking-widest">Motor de IA — Config</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Auto-publish toggle */}
              <div className="flex items-center justify-between p-4 bg-white/5 border border-[var(--outline-variant)]">
                <div>
                  <p className="label-tech mb-0.5">Auto-Publicar</p>
                  <p className="text-[9px] font-mono text-gray-600">Publicar posts aprobados automáticamente</p>
                </div>
                <button
                  type="button"
                  onClick={() => isEditing && setBand({ ...band, auto_publish: !band?.auto_publish })}
                  disabled={!isEditing}
                  className={`transition-colors ${!isEditing ? 'opacity-50 cursor-default' : 'cursor-pointer'}`}
                >
                  {band?.auto_publish
                    ? <ToggleRight size={36} className="text-[var(--secondary)]" />
                    : <ToggleLeft size={36} className="text-gray-600" />
                  }
                </button>
              </div>

              {/* Posts per day */}
              <div className="p-4 bg-white/5 border border-[var(--outline-variant)]">
                <label className="label-tech flex items-center gap-2">
                  <Clock size={10} /> Posts por Día
                </label>
                <div className="flex items-center gap-4 mt-3">
                  {isEditing ? (
                    <>
                      <input
                        type="range" min="1" max="10"
                        value={band?.posts_per_day || 5}
                        onChange={e => setBand({ ...band, posts_per_day: parseInt(e.target.value) })}
                        className="flex-1 accent-[var(--primary)]"
                      />
                      <span className="text-2xl font-display font-black text-white w-8 text-center">{band?.posts_per_day || 5}</span>
                    </>
                  ) : (
                    <span className="text-3xl font-display font-black text-white">{band?.posts_per_day || 5}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* ── Signal Chain Networks ── */}
        <div className="space-y-8 pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Globe size={20} className="text-[var(--primary)]" />
              <h3 className="text-xl font-display font-black text-white tracking-widest uppercase italic">Signal Chain Nodes</h3>
            </div>
            {availablePlatforms.length > 0 && (
              <button onClick={() => setShowConnectModal(true)} className="btn-secondary py-2 px-6 text-xs">
                <Plus size={14} /> Conectar Red
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {networks.length === 0 ? (
              <div
                onClick={() => setShowConnectModal(true)}
                className="border-2 border-dashed border-[var(--outline-variant)] p-12 flex flex-col items-center justify-center text-gray-700 hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all cursor-pointer group lg:col-span-3 min-h-[200px]"
              >
                <div className="w-12 h-12 border border-current flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><Plus size={24} /></div>
                <p className="font-display font-black text-lg uppercase tracking-widest">Conectar Primera Red</p>
              </div>
            ) : (
              networks.map(net => (
                <NetworkCard
                  key={net.id}
                  network={{ ...net, connected: net.is_active }}
                  onConnect={handleConnect}
                  onScan={handleScan}
                  onDisconnect={handleDisconnect}
                />
              ))
            )}
          </div>
        </div>

        {/* ── Privacy Footer ── */}
        <div className="surface-card p-8 bg-black border-l-4 border-l-[var(--secondary)] flex flex-col md:flex-row items-center gap-8">
          <div className="p-5 bg-white/5 border border-[var(--outline-variant)]">
            <ShieldCheck size={40} className="text-[var(--secondary)]" />
          </div>
          <div className="flex-1">
            <h4 className="text-xl font-display font-black text-white italic uppercase mb-1">Protocolo de Privacidad Semántica</h4>
            <p className="text-[10px] font-mono font-black text-gray-500 uppercase tracking-widest leading-relaxed max-w-2xl">
              Tus datos de ADN se procesan mediante un modelo local privado. Las credenciales de red están encriptadas bajo arquitectura AES-256 e inyectadas solo en el momento de la publicación del Signal.
            </p>
          </div>
        </div>
      </div>

      {/* ── Connect Modal ── */}
      {showConnectModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl">
          <div className="bg-[var(--surface-high)] border border-[#484849]/30 rounded-sm p-10 max-w-lg w-full relative shadow-[0_0_80px_rgba(0,0,0,0.8)]">
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)]" />
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="label-tech mb-1">Autenticar Nodo</span>
                <h2 className="text-3xl font-display font-black text-white uppercase italic leading-none">Nueva Red</h2>
              </div>
              <button onClick={() => setShowConnectModal(false)} className="text-gray-600 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              {availablePlatforms.map(({ key, label, Icon }) => (
                <button
                  key={key}
                  onClick={() => handleConnect(key)}
                  className="w-full flex items-center gap-5 p-5 border border-[var(--outline-variant)] hover:border-[var(--primary)]/50 hover:bg-[var(--primary)]/5 transition-all group text-left"
                >
                  <div className="p-2 bg-white/5 border border-[var(--outline-variant)] group-hover:border-[var(--primary)]/30">
                    <Icon size={18} className="text-gray-500 group-hover:text-[var(--primary)]" />
                  </div>
                  <div>
                    <p className="text-sm font-mono font-black text-white uppercase tracking-widest">{label}</p>
                    <p className="text-[9px] font-mono text-gray-600 mt-0.5">OAuth 2.0 · Secure Connection</p>
                  </div>
                  <ArrowUpRight size={14} className="ml-auto text-gray-700 group-hover:text-[var(--primary)] transition-colors" />
                </button>
              ))}
            </div>

            {connectedPlatforms.size > 0 && (
              <p className="mt-6 text-[9px] font-mono text-gray-700 text-center uppercase tracking-widest">
                {connectedPlatforms.size} plataforma(s) ya conectada(s) — no disponibles
              </p>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Profile;
