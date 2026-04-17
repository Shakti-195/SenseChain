import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Palette, Check, Sun, Moon, Monitor, Sparkles, RefreshCw,
  Eye, Layers, Type, Sliders, ChevronRight,
} from 'lucide-react';

// ── THEME DEFINITIONS ──
const THEMES = [
  {
    id: 'red-black',
    name: 'Red × Black',
    desc: 'Bold crimson & obsidian — the default SenseChain palette',
    tag: 'DEFAULT',
    preview: ['#dc2626', '#7f1d1d', '#111111'],
    vars: {
      '--th-primary': '#dc2626',
      '--th-primary-dark': '#991b1b',
      '--th-accent': '#f87171',
      '--th-glow': 'rgba(220,38,38,0.15)',
      '--th-surface': '#090909',
    },
    css: {
      light: { bg: '#f5f5f5', card: '#ffffff', accent: '#dc2626' },
      dark: { bg: '#090909', card: '#141414', accent: '#ef4444' },
    }
  },
  {
    id: 'ocean-blue',
    name: 'Ocean Blue',
    desc: 'Deep navy & electric cyan — precision engineering aesthetics',
    tag: 'COOL',
    preview: ['#2563eb', '#1e40af', '#0f172a'],
    vars: {
      '--th-primary': '#2563eb',
      '--th-primary-dark': '#1d4ed8',
      '--th-accent': '#60a5fa',
      '--th-glow': 'rgba(37,99,235,0.15)',
      '--th-surface': '#020617',
    },
    css: {
      light: { bg: '#f0f4ff', card: '#ffffff', accent: '#2563eb' },
      dark: { bg: '#020617', card: '#0c1429', accent: '#3b82f6' },
    }
  },
  {
    id: 'forest-dark',
    name: 'Forest Dark',
    desc: 'Deep emerald & obsidian — for night-time blockchain monitoring',
    tag: 'DARK',
    preview: ['#059669', '#065f46', '#0a0a0a'],
    vars: {
      '--th-primary': '#059669',
      '--th-primary-dark': '#047857',
      '--th-accent': '#34d399',
      '--th-glow': 'rgba(5,150,105,0.15)',
      '--th-surface': '#0a0a0a',
    },
    css: {
      light: { bg: '#f0faf6', card: '#ffffff', accent: '#059669' },
      dark: { bg: '#071210', card: '#0e1f1b', accent: '#10b981' },
    }
  },
  {
    id: 'purple-noir',
    name: 'Purple Noir',
    desc: 'Violet & onyx — cinematic cyberpunk aesthetic for the bold',
    tag: 'NOIR',
    preview: ['#7c3aed', '#4c1d95', '#0d0d0d'],
    vars: {
      '--th-primary': '#7c3aed',
      '--th-primary-dark': '#6d28d9',
      '--th-accent': '#a78bfa',
      '--th-glow': 'rgba(124,58,237,0.15)',
      '--th-surface': '#0d0d0d',
    },
    css: {
      light: { bg: '#f5f3ff', card: '#ffffff', accent: '#7c3aed' },
      dark: { bg: '#0d0912', card: '#160f20', accent: '#8b5cf6' },
    }
  },
  {
    id: 'amber-steel',
    name: 'Amber × Steel',
    desc: 'Industrial amber & slate — rugged blockchain infrastructure feel',
    tag: 'WARM',
    preview: ['#d97706', '#92400e', '#1c1917'],
    vars: {
      '--th-primary': '#d97706',
      '--th-primary-dark': '#b45309',
      '--th-accent': '#fbbf24',
      '--th-glow': 'rgba(217,119,6,0.15)',
      '--th-surface': '#1c1917',
    },
    css: {
      light: { bg: '#fffbf0', card: '#ffffff', accent: '#d97706' },
      dark: { bg: '#1c1917', card: '#201c18', accent: '#f59e0b' },
    }
  },
  {
    id: 'mono-white',
    name: 'Minimal Mono',
    desc: 'Clean grayscale — distraction-free professional interface',
    tag: 'CLEAN',
    preview: ['#374151', '#111827', '#f9fafb'],
    vars: {
      '--th-primary': '#374151',
      '--th-primary-dark': '#1f2937',
      '--th-accent': '#6b7280',
      '--th-glow': 'rgba(55,65,81,0.10)',
      '--th-surface': '#1f2937',
    },
    css: {
      light: { bg: '#f9fafb', card: '#ffffff', accent: '#374151' },
      dark: { bg: '#111827', card: '#1f2937', accent: '#6b7280' },
    }
  },
];

const FONT_OPTIONS = [
  { id: 'inter', name: 'Inter', desc: 'Modern sans-serif — default', sample: 'SenseChain' },
  { id: 'space-grotesk', name: 'Space Grotesk', desc: 'Geometric, techy feel', sample: 'SenseChain' },
  { id: 'dm-sans', name: 'DM Sans', desc: 'Clean rounded strokes', sample: 'SenseChain' },
];

const DENSITY_OPTIONS = [
  { id: 'compact', name: 'Compact', desc: 'Maximum info density', icon: '▪▪▪' },
  { id: 'normal', name: 'Normal', desc: 'Balanced layout', icon: '▪ ▪ ▪' },
  { id: 'relaxed', name: 'Relaxed', desc: 'Spacious & airy', icon: '▪  ▪  ▪' },
];

// ── APPLY THEME FUNCTION ──
const applyTheme = (theme, isDark) => {
  const root = document.documentElement;
  // Inject CSS variables
  Object.entries(theme.vars).forEach(([key, val]) => root.style.setProperty(key, val));

  // Apply background colors via inline styles
  const mode = isDark ? theme.css.dark : theme.css.light;
  document.body.style.setProperty('--theme-bg', mode.bg);
  document.body.style.setProperty('--theme-card', mode.card);
  document.body.style.setProperty('--theme-accent', mode.accent);

  // Update the CSS custom properties for core styles
  root.style.setProperty('--color-brand-primary', theme.vars['--th-primary']);
  root.style.setProperty('--color-brand-glow', theme.vars['--th-glow']);

  localStorage.setItem('sc-theme-id', theme.id);
};

const UISettings = () => {
  const [activeTheme, setActiveTheme] = useState(() => localStorage.getItem('sc-theme-id') || 'red-black');
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  const [activeFont, setActiveFont] = useState(() => localStorage.getItem('sc-font') || 'inter');
  const [density, setDensity] = useState(() => localStorage.getItem('sc-density') || 'normal');
  const [saved, setSaved] = useState(false);

  // Sync dark mode
  useEffect(() => {
    const obs = new MutationObserver(() => setIsDark(document.documentElement.classList.contains('dark')));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  // Apply theme on select
  const handleSelectTheme = (theme) => {
    setActiveTheme(theme.id);
    applyTheme(theme, isDark);
  };

  // Save all settings
  const handleSave = () => {
    localStorage.setItem('sc-font', activeFont);
    localStorage.setItem('sc-density', density);
    const theme = THEMES.find(t => t.id === activeTheme);
    if (theme) applyTheme(theme, isDark);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    const def = THEMES.find(t => t.id === 'red-black');
    setActiveTheme('red-black');
    setActiveFont('inter');
    setDensity('normal');
    if (def) applyTheme(def, isDark);
    localStorage.removeItem('sc-font');
    localStorage.removeItem('sc-density');
    localStorage.removeItem('sc-theme-id');
  };

  const selectedTheme = THEMES.find(t => t.id === activeTheme) || THEMES[0];

  return (
    <div className="page-wrapper space-y-8 custom-scrollbar">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest chip-red">
              <Palette size={9} /> UI Customization
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight" style={{ fontFamily: 'Space Grotesk' }}>
            Appearance <span className="bg-gradient-to-r from-red-600 to-rose-500 bg-clip-text text-transparent">Settings</span>
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">Customize your SenseChain interface theme, fonts, and layout density</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-white/8 hover:border-red-400 hover:text-red-600 transition-all">
            <RefreshCw size={14} /> Reset
          </button>
          <motion.button onClick={handleSave} whileTap={{ scale: 0.96 }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg ${
              saved ? 'bg-emerald-500 text-white shadow-emerald-500/25' : 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/25'
            }`}>
            {saved ? <><Check size={14} />Saved!</> : <><Sparkles size={14} />Apply Theme</>}
          </motion.button>
        </div>
      </motion.div>

      {/* ── COLOR THEMES ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card rounded-[22px] p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-red-100 dark:bg-red-500/12 text-red-600 dark:text-red-400 rounded-xl"><Palette size={18} /></div>
          <div>
            <h2 className="font-bold text-base" style={{ fontFamily: 'Space Grotesk' }}>Color Theme</h2>
            <p className="text-xs text-stone-400">Global color palette for UI elements</p>
          </div>
          <div className="ml-auto">
            <span className="chip-red">{selectedTheme.name}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {THEMES.map((theme) => {
            const isActive = activeTheme === theme.id;
            return (
              <motion.button
                key={theme.id}
                onClick={() => handleSelectTheme(theme)}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className={`relative p-4 rounded-2xl border-2 text-left transition-all ${
                  isActive
                    ? 'border-red-500 bg-red-50/60 dark:bg-red-900/20 shadow-lg shadow-red-500/10'
                    : 'border-stone-100 dark:border-white/6 hover:border-stone-300 dark:hover:border-white/15'
                }`}
              >
                {/* Color swatch */}
                <div className="flex items-center gap-1.5 mb-3">
                  {theme.preview.map((color, i) => (
                    <div key={i} className={`h-6 rounded-full transition-all ${i === 0 ? 'flex-1' : i === 1 ? 'w-10' : 'w-8'}`}
                      style={{ backgroundColor: color }} />
                  ))}
                </div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-sm leading-tight" style={{ fontFamily: 'Space Grotesk' }}>{theme.name}</p>
                    <p className="text-[10px] text-stone-400 mt-0.5 leading-snug">{theme.desc}</p>
                  </div>
                  {isActive ? (
                    <div className="w-5 h-5 rounded-full bg-red-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Check size={11} className="text-white" />
                    </div>
                  ) : (
                    <span className="text-[8px] font-black text-stone-400 uppercase tracking-widest border border-stone-200 dark:border-white/10 px-2 py-0.5 rounded-full shrink-0 mt-0.5">
                      {theme.tag}
                    </span>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* ── DARK / LIGHT MODE ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-[22px] p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-stone-100 dark:bg-white/6 text-stone-600 dark:text-stone-400 rounded-xl"><Eye size={18} /></div>
          <div>
            <h2 className="font-bold text-base" style={{ fontFamily: 'Space Grotesk' }}>Display Mode</h2>
            <p className="text-xs text-stone-400">Light or dark appearance</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'light', label: 'Light', icon: <Sun size={20} />, desc: 'Clean daytime view' },
            { id: 'dark', label: 'Dark', icon: <Moon size={20} />, desc: 'Night operations mode' },
            { id: 'system', label: 'System', icon: <Monitor size={20} />, desc: 'Follow OS preference' },
          ].map(m => {
            const active = m.id === 'dark' ? isDark : m.id === 'light' ? !isDark : false;
            return (
              <button
                key={m.id}
                onClick={() => {
                  if (m.id === 'light') { document.documentElement.classList.remove('dark'); localStorage.setItem('sc-theme', 'light'); setIsDark(false); }
                  else if (m.id === 'dark') { document.documentElement.classList.add('dark'); localStorage.setItem('sc-theme', 'dark'); setIsDark(true); }
                  else {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    if (prefersDark) { document.documentElement.classList.add('dark'); setIsDark(true); }
                    else { document.documentElement.classList.remove('dark'); setIsDark(false); }
                    localStorage.removeItem('sc-theme');
                  }
                }}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                  active
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                    : 'border-stone-100 dark:border-white/6 text-stone-500 hover:border-stone-300 dark:hover:border-white/15'
                }`}
              >
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
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card rounded-[22px] p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-violet-100 dark:bg-violet-500/12 text-violet-600 dark:text-violet-400 rounded-xl"><Type size={18} /></div>
            <div>
              <h2 className="font-bold text-sm" style={{ fontFamily: 'Space Grotesk' }}>Interface Font</h2>
              <p className="text-xs text-stone-400">Body text typeface</p>
            </div>
          </div>
          <div className="space-y-2">
            {FONT_OPTIONS.map(f => (
              <button key={f.id} onClick={() => setActiveFont(f.id)}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                  activeFont === f.id
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/15'
                    : 'border-stone-100 dark:border-white/5 hover:border-stone-200 dark:hover:border-white/10'
                }`}>
                <div className="text-left">
                  <p className="font-semibold text-sm" style={{ fontFamily: f.id === 'space-grotesk' ? 'Space Grotesk' : f.id === 'dm-sans' ? 'DM Sans' : 'Inter' }}>{f.sample}</p>
                  <p className="text-[10px] text-stone-400">{f.desc}</p>
                </div>
                {activeFont === f.id && <Check size={14} className="text-red-600 dark:text-red-400 shrink-0" />}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Density */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-[22px] p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-blue-100 dark:bg-blue-500/12 text-blue-600 dark:text-blue-400 rounded-xl"><Layers size={18} /></div>
            <div>
              <h2 className="font-bold text-sm" style={{ fontFamily: 'Space Grotesk' }}>Layout Density</h2>
              <p className="text-xs text-stone-400">Spacing & padding preference</p>
            </div>
          </div>
          <div className="space-y-2">
            {DENSITY_OPTIONS.map(d => (
              <button key={d.id} onClick={() => setDensity(d.id)}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                  density === d.id
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/15'
                    : 'border-stone-100 dark:border-white/5 hover:border-stone-200 dark:hover:border-white/10'
                }`}>
                <div className="text-left">
                  <p className="font-semibold text-sm flex items-center gap-2">{d.name} <span className="font-mono text-[10px] text-stone-400 tracking-widest">{d.icon}</span></p>
                  <p className="text-[10px] text-stone-400">{d.desc}</p>
                </div>
                {density === d.id && <Check size={14} className="text-red-600 dark:text-red-400 shrink-0" />}
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── LIVE PREVIEW ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card rounded-[22px] p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-emerald-100 dark:bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 rounded-xl"><Sliders size={18} /></div>
          <div>
            <h2 className="font-bold text-base" style={{ fontFamily: 'Space Grotesk' }}>Live Preview</h2>
            <p className="text-xs text-stone-400">How your theme will look across components</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Preview Card */}
          {[
            { title: 'Ledger Height', val: '42', sub: 'BLOCKS', color: selectedTheme.preview[0] },
            { title: 'Node Stability', val: '100%', sub: 'HEALTH', color: '#10b981' },
            { title: 'Security Status', val: 'Secure', sub: 'SHA-256', color: selectedTheme.preview[1] },
          ].map((item, i) => (
            <div key={i} className="p-4 rounded-2xl border border-stone-100 dark:border-white/5 bg-stone-50 dark:bg-white/3">
              <div className="w-8 h-8 rounded-xl mb-3 flex items-center justify-center" style={{ backgroundColor: `${item.color}18` }}>
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              </div>
              <p className="text-2xl font-bold font-mono" style={{ color: item.color }}>{item.val}</p>
              <p className="text-xs font-semibold mt-1">{item.title}</p>
              <p className="text-[9px] text-stone-400 uppercase tracking-wide mt-0.5">{item.sub}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-3">
          <div className="h-10 flex-1 rounded-xl border border-stone-200 dark:border-white/8 flex items-center px-4 text-sm text-stone-400 font-mono">
            Search blocks, hashes...
          </div>
          <button className="px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg"
            style={{ background: `linear-gradient(135deg, ${selectedTheme.preview[0]}, ${selectedTheme.preview[1]})` }}>
            Apply
          </button>
        </div>
      </motion.div>

      <p className="text-center text-[10px] text-stone-400 dark:text-stone-700 pb-4 uppercase tracking-widest">
        SenseChain Neural Infrastructure · UI Customization v3.0
      </p>
    </div>
  );
};

export default UISettings;
