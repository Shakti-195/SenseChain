import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Palette, Check, Sun, Moon, Monitor, Sparkles, RefreshCw,
  Eye, Layers, Type, Sliders, Volume2, VolumeX,
  Database, Shield, Activity, Zap,
} from 'lucide-react';
import { useTheme, THEMES } from '../context/ThemeContext';
import { soundManager } from '../utils/soundManager';

const FONT_OPTIONS = [
  { id: 'inter',         name: 'Inter',         desc: 'Modern sans-serif — default',   family: 'Inter, system-ui, sans-serif' },
  { id: 'space-grotesk', name: 'Space Grotesk',  desc: 'Geometric, techy feel',         family: "'Space Grotesk', system-ui, sans-serif" },
  { id: 'dm-sans',       name: 'DM Sans',        desc: 'Clean rounded strokes',          family: "'DM Sans', system-ui, sans-serif" },
  { id: 'jetbrains',     name: 'JetBrains Mono', desc: 'Terminal mono — hacker style',   family: "'JetBrains Mono', monospace" },
];

const DENSITY_OPTIONS = [
  { id: 'compact',  name: 'Compact',  desc: 'Maximum info density', icon: '▪▪▪' },
  { id: 'normal',   name: 'Normal',   desc: 'Balanced layout',      icon: '▪ ▪ ▪' },
  { id: 'relaxed',  name: 'Relaxed',  desc: 'Spacious & airy',      icon: '▪  ▪  ▪' },
];

const UISettings = () => {
  const { themeId, currentTheme, selectTheme } = useTheme();

  const [isDark, setIsDark]     = useState(() => document.documentElement.classList.contains('dark'));
  const [activeFont, setActiveFont] = useState(() => localStorage.getItem('sc-font') || 'inter');
  const [density, setDensity]   = useState(() => localStorage.getItem('sc-density') || 'normal');
  const [saved, setSaved]       = useState(false);
  const [soundOn, setSoundOn]   = useState(() => soundManager.isEnabled());

  // Watch dark class
  useEffect(() => {
    const obs = new MutationObserver(() =>
      setIsDark(document.documentElement.classList.contains('dark'))
    );
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  // Apply font
  useEffect(() => {
    const fontMap = {
      'inter':         "'Inter', system-ui, sans-serif",
      'space-grotesk': "'Space Grotesk', system-ui, sans-serif",
      'dm-sans':       "'DM Sans', system-ui, sans-serif",
      'jetbrains':     "'JetBrains Mono', monospace",
    };
    document.documentElement.style.setProperty('--font-ui', fontMap[activeFont] || fontMap['inter']);
    document.body.style.fontFamily = fontMap[activeFont] || fontMap['inter'];
  }, [activeFont]);

  // Apply density
  useEffect(() => {
    const map = { compact: '16px', normal: '24px', relaxed: '32px' };
    document.documentElement.style.setProperty('--page-padding', map[density] || '24px');
  }, [density]);

  const setDarkMode = (dark) => {
    if (dark) { document.documentElement.classList.add('dark'); localStorage.setItem('sc-theme', 'dark'); }
    else       { document.documentElement.classList.remove('dark'); localStorage.setItem('sc-theme', 'light'); }
    setIsDark(dark);
  };

  const handleSave = () => {
    localStorage.setItem('sc-font', activeFont);
    localStorage.setItem('sc-density', density);
    setSaved(true);
    soundManager.notification?.();
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    selectTheme(THEMES.find(t => t.id === 'red-black'));
    setActiveFont('inter');
    setDensity('normal');
    localStorage.removeItem('sc-font');
    localStorage.removeItem('sc-density');
  };

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    soundManager.setEnabled(next);
    if (next) soundManager.notification?.();
  };

  const p  = currentTheme.hex.primary;
  const pd = currentTheme.hex.primaryDark;
  const g  = currentTheme.hex.glow;

  return (
    <div className="page-wrapper space-y-8 custom-scrollbar">

      {/* ── HEADER ── */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest chip-red">
              <Palette size={9} /> UI Customization
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight" style={{ fontFamily: 'Space Grotesk' }}>
            Appearance <span style={{ color: p }}>Settings</span>
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
            Customize your SenseChain interface — theme, fonts, density
          </p>
        </div>
        <div className="flex items-center gap-2">
          <motion.button onClick={toggleSound} whileTap={{ scale: 0.93 }}
            title={soundOn ? 'Mute sound effects' : 'Enable sound effects'}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
              soundOn
                ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/25 text-emerald-600 dark:text-emerald-400'
                : 'border-stone-200 dark:border-white/8 text-stone-400 hover:border-stone-400'
            }`}>
            {soundOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
            {soundOn ? 'Sound On' : 'Sound Off'}
          </motion.button>
          <button onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-white/8 hover:border-stone-400 transition-all">
            <RefreshCw size={14} /> Reset
          </button>
          <motion.button onClick={handleSave} whileTap={{ scale: 0.96 }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all shadow-lg"
            style={{ background: saved ? '#10b981' : `linear-gradient(135deg, ${p}, ${pd})`, boxShadow: `0 4px 14px ${g}` }}>
            {saved ? <><Check size={14} />Saved!</> : <><Sparkles size={14} />Apply Theme</>}
          </motion.button>
        </div>
      </motion.div>

      {/* ── COLOR THEMES ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="glass-card rounded-[22px] p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl" style={{ backgroundColor: g, color: p }}>
            <Palette size={18} />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-base" style={{ fontFamily: 'Space Grotesk' }}>Color Theme</h2>
            <p className="text-xs text-stone-400">Global palette — affects every UI element instantly</p>
          </div>
          <span className="text-[10px] font-bold px-3 py-1 rounded-full border"
            style={{ background: g, color: p, borderColor: `color-mix(in srgb, ${p} 25%, transparent)` }}>
            {currentTheme.name}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {THEMES.map((theme) => {
            const isActive = themeId === theme.id;
            return (
              <motion.button
                key={theme.id}
                onClick={() => selectTheme(theme)}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.97 }}
                className="relative p-4 rounded-2xl border-2 text-left transition-all overflow-hidden"
                style={{
                  borderColor: isActive ? theme.hex.primary : undefined,
                  background: isActive ? `${theme.hex.glow}` : undefined,
                  boxShadow: isActive ? `0 4px 20px ${theme.hex.glow}` : undefined,
                }}>
                {/* Ambient glow when active */}
                {isActive && (
                  <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none"
                    style={{ backgroundColor: theme.hex.primary, opacity: 0.25 }} />
                )}

                {/* Color swatch bar */}
                <div className="flex items-center gap-1 mb-3 h-7">
                  {theme.preview.map((color, i) => (
                    <div key={i}
                      className={`h-full rounded-lg transition-all ${i === 0 ? 'flex-1' : i === 1 ? 'w-8' : 'w-6'}`}
                      style={{ backgroundColor: color }} />
                  ))}
                </div>

                <div className="flex items-start justify-between gap-2 relative z-10">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm leading-tight truncate" style={{ fontFamily: 'Space Grotesk' }}>
                      {theme.name}
                    </p>
                    <p className="text-[9px] text-stone-400 mt-0.5 leading-snug line-clamp-2">{theme.desc}</p>
                  </div>
                  {isActive ? (
                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{ backgroundColor: theme.hex.primary }}>
                      <Check size={11} className="text-white" />
                    </div>
                  ) : (
                    <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full shrink-0 mt-0.5 border border-stone-200 dark:border-white/10 text-stone-400">
                      {theme.tag}
                    </span>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Active palette strip */}
        <div className="mt-6 p-3 rounded-xl border border-stone-100 dark:border-white/5 bg-stone-50 dark:bg-white/2">
          <div className="flex items-center gap-3">
            <span className="text-[9px] text-stone-400 uppercase tracking-widest font-bold whitespace-nowrap">Active palette</span>
            <div className="flex flex-1 gap-1 h-4">
              {[p, pd, currentTheme.hex.primaryDeep, currentTheme.hex.accent].map((c, i) => (
                <div key={i} className="flex-1 rounded-full transition-all duration-500" style={{ backgroundColor: c }} />
              ))}
            </div>
            <span className="text-[9px] font-mono text-stone-400 ml-1">{p}</span>
          </div>
        </div>
      </motion.div>

      {/* ── DISPLAY MODE ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="glass-card rounded-[22px] p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl" style={{ backgroundColor: g, color: p }}>
            <Eye size={18} />
          </div>
          <div>
            <h2 className="font-bold text-base" style={{ fontFamily: 'Space Grotesk' }}>Display Mode</h2>
            <p className="text-xs text-stone-400">Light, dark, or follow system preference</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'light',  label: 'Light',  icon: <Sun size={22} />,     desc: 'Clean daytime view' },
            { id: 'dark',   label: 'Dark',   icon: <Moon size={22} />,    desc: 'Night operations mode' },
            { id: 'system', label: 'System', icon: <Monitor size={22} />, desc: 'Follow OS preference' },
          ].map(m => {
            const active = m.id === 'dark' ? isDark : m.id === 'light' ? !isDark : false;
            return (
              <button key={m.id}
                onClick={() => {
                  if (m.id === 'light') setDarkMode(false);
                  else if (m.id === 'dark') setDarkMode(true);
                  else { setDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches); localStorage.removeItem('sc-theme'); }
                }}
                className="flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all"
                style={{
                  borderColor: active ? p : undefined,
                  background: active ? g : undefined,
                  color: active ? p : undefined,
                }}>
                {m.icon}
                <span className="text-xs font-bold">{m.label}</span>
                <span className="text-[9px] text-stone-400 text-center leading-tight">{m.desc}</span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* ── FONT & DENSITY ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Font */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="glass-card rounded-[22px] p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 rounded-xl" style={{ backgroundColor: g, color: p }}><Type size={18} /></div>
            <div>
              <h2 className="font-bold text-sm" style={{ fontFamily: 'Space Grotesk' }}>Interface Font</h2>
              <p className="text-xs text-stone-400">Body text typeface</p>
            </div>
          </div>
          <div className="space-y-2">
            {FONT_OPTIONS.map(f => {
              const active = activeFont === f.id;
              return (
                <button key={f.id} onClick={() => setActiveFont(f.id)}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl border-2 transition-all"
                  style={{
                    borderColor: active ? p : undefined,
                    background:  active ? g : undefined,
                  }}>
                  <div className="text-left">
                    <p className="font-semibold text-sm" style={{ fontFamily: f.family }}>{f.name}</p>
                    <p className="text-[10px] text-stone-400">{f.desc}</p>
                  </div>
                  {active && <Check size={14} style={{ color: p }} className="shrink-0" />}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Density */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="glass-card rounded-[22px] p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 rounded-xl" style={{ backgroundColor: g, color: p }}><Layers size={18} /></div>
            <div>
              <h2 className="font-bold text-sm" style={{ fontFamily: 'Space Grotesk' }}>Layout Density</h2>
              <p className="text-xs text-stone-400">Spacing & padding preference</p>
            </div>
          </div>
          <div className="space-y-2">
            {DENSITY_OPTIONS.map(d => {
              const active = density === d.id;
              return (
                <button key={d.id} onClick={() => setDensity(d.id)}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl border-2 transition-all"
                  style={{
                    borderColor: active ? p : undefined,
                    background:  active ? g : undefined,
                  }}>
                  <div className="text-left">
                    <p className="font-semibold text-sm flex items-center gap-2">
                      {d.name}
                      <span className="font-mono text-[10px] text-stone-400 tracking-widest">{d.icon}</span>
                    </p>
                    <p className="text-[10px] text-stone-400">{d.desc}</p>
                  </div>
                  {active && <Check size={14} style={{ color: p }} className="shrink-0" />}
                </button>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* ── LIVE PREVIEW ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="glass-card rounded-[22px] p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl" style={{ backgroundColor: g, color: p }}>
            <Sliders size={18} />
          </div>
          <div>
            <h2 className="font-bold text-base" style={{ fontFamily: 'Space Grotesk' }}>Live Preview</h2>
            <p className="text-xs text-stone-400">
              All elements update instantly as you choose a theme above
            </p>
          </div>
          <span className="ml-auto text-[9px] font-mono px-2 py-1 rounded-lg border border-stone-200 dark:border-white/8 text-stone-400">
            {currentTheme.name}
          </span>
        </div>

        {/* Mini dashboard preview */}
        <div className="rounded-2xl border border-stone-100 dark:border-white/6 bg-stone-50 dark:bg-black/30 p-5 space-y-4 overflow-hidden relative">

          {/* ambient blob */}
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none"
            style={{ backgroundColor: p }} />

          {/* Stat cards row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 relative z-10">
            {[
              { label: 'Ledger Height', val: '42',    icon: <Database size={13} /> },
              { label: 'Node Health',   val: '100%',  icon: <Activity size={13} /> },
              { label: 'Security',      val: 'Secure',icon: <Shield size={13} /> },
              { label: 'Mining Speed',  val: '1.8s',  icon: <Zap size={13} /> },
            ].map((item, i) => (
              <div key={i} className="bg-white/70 dark:bg-white/5 rounded-xl p-3 border border-stone-100 dark:border-white/5">
                <div className="inline-flex p-1.5 rounded-lg mb-2"
                  style={{ backgroundColor: g, color: p }}>
                  {item.icon}
                </div>
                <p className="text-base font-bold font-mono" style={{ color: p }}>{item.val}</p>
                <p className="text-[9px] text-stone-400 uppercase tracking-wide mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>

          {/* Mini bar chart */}
          <div className="bg-white/70 dark:bg-white/5 rounded-xl p-4 border border-stone-100 dark:border-white/5 relative z-10">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Block Nonce Distribution</p>
              <span className="text-[9px] px-2 py-0.5 rounded-full font-bold"
                style={{ background: g, color: p }}>● Live</span>
            </div>
            <div className="flex items-end gap-1.5 h-14">
              {[55, 80, 40, 95, 65, 75, 50, 85, 60, 70, 45, 90].map((h, i) => (
                <div key={i} className="flex-1 rounded-t-sm transition-all duration-500"
                  style={{
                    height: `${h}%`,
                    backgroundColor: p,
                    opacity: i === 11 ? 1 : 0.35 + (i / 11) * 0.45,
                  }} />
              ))}
            </div>
            <div className="flex justify-between mt-1">
              {['#30','#31','#32','#33','#34','#35','#36','#37','#38','#39','#40','#41'].map(l => (
                <span key={l} className="text-[7px] text-stone-400 font-mono">{l}</span>
              ))}
            </div>
          </div>

          {/* Input + button row */}
          <div className="flex items-center gap-3 relative z-10">
            <div className="flex-1 h-9 rounded-xl border-2 flex items-center px-3 text-xs text-stone-400 font-mono bg-white/70 dark:bg-white/5 transition-all duration-500"
              style={{ borderColor: `color-mix(in srgb, ${p} 30%, transparent)` }}>
              Search blocks, hashes, nonces…
            </div>
            <button className="px-5 h-9 rounded-xl text-xs font-bold text-white whitespace-nowrap transition-all duration-500"
              style={{ background: `linear-gradient(135deg, ${p}, ${pd})`, boxShadow: `0 4px 12px ${g}` }}>
              Search
            </button>
            <button className="px-4 h-9 rounded-xl text-xs font-bold border-2 transition-all duration-500"
              style={{ borderColor: p, color: p }}>
              Export
            </button>
          </div>

          {/* Badge row */}
          <div className="flex flex-wrap items-center gap-2 relative z-10">
            <span className="px-2.5 py-1 rounded-full text-[9px] font-bold border"
              style={{ background: g, color: p, borderColor: `color-mix(in srgb, ${p} 25%, transparent)` }}>
              ● SHA-256 Verified
            </span>
            <span className="px-2.5 py-1 rounded-full text-[9px] font-bold border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
              ✓ Chain Intact
            </span>
            <span className="px-2.5 py-1 rounded-full text-[9px] font-bold border border-stone-200 dark:border-white/10 text-stone-400">
              3 Nodes Live
            </span>
            <span className="ml-auto text-[9px] font-mono text-stone-400"
              style={{ color: p }}>
              {p}
            </span>
          </div>
        </div>
      </motion.div>

      <p className="text-center text-[10px] text-stone-400 dark:text-stone-700 pb-4 uppercase tracking-widest">
        SenseChain Neural Infrastructure · UI Customization v5.0
      </p>
    </div>
  );
};

export default UISettings;
