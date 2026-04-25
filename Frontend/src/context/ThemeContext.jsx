import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

// ── THEME REGISTRY ──────────────────────────────────────────────────────────
// Each theme maps its brand colors to Tailwind v4 CSS variable names.
// Tailwind v4 stores all color utilities as CSS vars (--color-red-600, etc.),
// so overriding them here makes every Tailwind utility in every component
// automatically adopt the new palette.
export const THEMES = [
  {
    id: 'red-black',
    name: 'Red × Black',
    desc: 'Bold crimson & obsidian — the default SenseChain palette',
    tag: 'DEFAULT',
    preview: ['#dc2626', '#7f1d1d', '#111111'],
    // raw hex values used for custom CSS vars
    hex: {
      primary:      '#dc2626',
      primaryDark:  '#991b1b',
      primaryDeep:  '#7f1d1d',
      accent:       '#f87171',
      glow:         'rgba(220,38,38,0.15)',
      glowMd:       'rgba(220,38,38,0.10)',
      glowSm:       'rgba(180,10,10,0.06)',
      surfaceDark:  '#090909',
      surfaceLight: '#f5f5f5',
      cardDark:     '#141414',
    },
    // Tailwind v4 OKLCH values for the primary color ramp
    // These override --color-red-* so ALL text-red-*, bg-red-* utilities change
    tw: {
      '50':  'oklch(0.971 0.013 17.38)',
      '100': 'oklch(0.936 0.032 17.717)',
      '200': 'oklch(0.885 0.062 18.334)',
      '300': 'oklch(0.808 0.114 19.571)',
      '400': 'oklch(0.704 0.191 22.216)',
      '500': 'oklch(0.637 0.237 25.331)',
      '600': 'oklch(0.577 0.245 27.325)',
      '700': 'oklch(0.505 0.213 27.518)',
      '800': 'oklch(0.444 0.177 26.127)',
      '900': 'oklch(0.396 0.141 25.723)',
      '950': 'oklch(0.258 0.092 26.042)',
    },
  },
  {
    id: 'ocean-blue',
    name: 'Ocean Blue',
    desc: 'Deep navy & electric cyan — precision engineering aesthetics',
    tag: 'COOL',
    preview: ['#2563eb', '#1e40af', '#0f172a'],
    hex: {
      primary:      '#2563eb',
      primaryDark:  '#1d4ed8',
      primaryDeep:  '#1e3a8a',
      accent:       '#60a5fa',
      glow:         'rgba(37,99,235,0.15)',
      glowMd:       'rgba(37,99,235,0.12)',
      glowSm:       'rgba(10,30,120,0.08)',
      surfaceDark:  '#020617',
      surfaceLight: '#f0f4ff',
      cardDark:     '#0c1429',
    },
    tw: {
      '50':  'oklch(0.97 0.014 254.604)',
      '100': 'oklch(0.932 0.032 255.585)',
      '200': 'oklch(0.882 0.059 254.128)',
      '300': 'oklch(0.809 0.105 251.813)',
      '400': 'oklch(0.707 0.165 254.624)',
      '500': 'oklch(0.623 0.214 259.815)',
      '600': 'oklch(0.546 0.245 262.881)',
      '700': 'oklch(0.488 0.243 264.376)',
      '800': 'oklch(0.424 0.199 265.638)',
      '900': 'oklch(0.379 0.146 265.522)',
      '950': 'oklch(0.282 0.091 267.935)',
    },
  },
  {
    id: 'forest-dark',
    name: 'Forest Dark',
    desc: 'Deep emerald & obsidian — for night-time blockchain monitoring',
    tag: 'DARK',
    preview: ['#059669', '#065f46', '#0a0a0a'],
    hex: {
      primary:      '#059669',
      primaryDark:  '#047857',
      primaryDeep:  '#064e3b',
      accent:       '#34d399',
      glow:         'rgba(5,150,105,0.15)',
      glowMd:       'rgba(5,150,105,0.10)',
      glowSm:       'rgba(4,60,42,0.07)',
      surfaceDark:  '#0a0a0a',
      surfaceLight: '#f0faf6',
      cardDark:     '#0e1f1b',
    },
    tw: {
      '50':  'oklch(0.979 0.021 166.113)',
      '100': 'oklch(0.95 0.052 163.051)',
      '200': 'oklch(0.905 0.093 164.15)',
      '300': 'oklch(0.845 0.143 164.978)',
      '400': 'oklch(0.765 0.177 163.223)',
      '500': 'oklch(0.696 0.17 162.48)',
      '600': 'oklch(0.596 0.145 163.225)',
      '700': 'oklch(0.508 0.118 165.612)',
      '800': 'oklch(0.432 0.095 166.913)',
      '900': 'oklch(0.378 0.077 168.94)',
      '950': 'oklch(0.262 0.051 172.552)',
    },
  },
  {
    id: 'purple-noir',
    name: 'Purple Noir',
    desc: 'Violet & onyx — cinematic cyberpunk aesthetic for the bold',
    tag: 'NOIR',
    preview: ['#7c3aed', '#4c1d95', '#0d0d0d'],
    hex: {
      primary:      '#7c3aed',
      primaryDark:  '#6d28d9',
      primaryDeep:  '#4c1d95',
      accent:       '#a78bfa',
      glow:         'rgba(124,58,237,0.15)',
      glowMd:       'rgba(124,58,237,0.12)',
      glowSm:       'rgba(60,10,120,0.07)',
      surfaceDark:  '#0d0d0d',
      surfaceLight: '#f5f3ff',
      cardDark:     '#160f20',
    },
    tw: {
      '50':  'oklch(0.969 0.016 293.756)',
      '100': 'oklch(0.943 0.029 294.588)',
      '200': 'oklch(0.894 0.057 293.283)',
      '300': 'oklch(0.811 0.111 293.571)',
      '400': 'oklch(0.702 0.183 293.541)',
      '500': 'oklch(0.606 0.25 292.717)',
      '600': 'oklch(0.541 0.281 293.009)',
      '700': 'oklch(0.491 0.27 292.581)',
      '800': 'oklch(0.432 0.232 292.759)',
      '900': 'oklch(0.38 0.189 293.745)',
      '950': 'oklch(0.274 0.128 293.806)',
    },
  },
  {
    id: 'amber-steel',
    name: 'Amber × Steel',
    desc: 'Industrial amber & slate — rugged blockchain infrastructure feel',
    tag: 'WARM',
    preview: ['#d97706', '#92400e', '#1c1917'],
    hex: {
      primary:      '#d97706',
      primaryDark:  '#b45309',
      primaryDeep:  '#78350f',
      accent:       '#fbbf24',
      glow:         'rgba(217,119,6,0.15)',
      glowMd:       'rgba(217,119,6,0.10)',
      glowSm:       'rgba(120,60,5,0.06)',
      surfaceDark:  '#1c1917',
      surfaceLight: '#fffbf0',
      cardDark:     '#201c18',
    },
    tw: {
      '50':  'oklch(0.987 0.022 95.277)',
      '100': 'oklch(0.962 0.059 95.617)',
      '200': 'oklch(0.924 0.12 95.746)',
      '300': 'oklch(0.879 0.169 91.605)',
      '400': 'oklch(0.828 0.189 84.429)',
      '500': 'oklch(0.769 0.188 70.08)',
      '600': 'oklch(0.666 0.179 58.318)',
      '700': 'oklch(0.555 0.163 48.998)',
      '800': 'oklch(0.473 0.137 46.201)',
      '900': 'oklch(0.414 0.112 45.904)',
      '950': 'oklch(0.279 0.077 45.635)',
    },
  },
  {
    id: 'mono-white',
    name: 'Minimal Mono',
    desc: 'Clean grayscale — distraction-free professional interface',
    tag: 'CLEAN',
    preview: ['#374151', '#111827', '#f9fafb'],
    hex: {
      primary:      '#374151',
      primaryDark:  '#1f2937',
      primaryDeep:  '#111827',
      accent:       '#9ca3af',
      glow:         'rgba(55,65,81,0.10)',
      glowMd:       'rgba(55,65,81,0.08)',
      glowSm:       'rgba(30,40,55,0.05)',
      surfaceDark:  '#111827',
      surfaceLight: '#f9fafb',
      cardDark:     '#1f2937',
    },
    tw: {
      '50':  'oklch(0.985 0.002 247.839)',
      '100': 'oklch(0.967 0.003 264.542)',
      '200': 'oklch(0.928 0.006 264.531)',
      '300': 'oklch(0.872 0.01 258.338)',
      '400': 'oklch(0.707 0.022 261.325)',
      '500': 'oklch(0.551 0.018 264.364)',
      '600': 'oklch(0.446 0.03 256.802)',
      '700': 'oklch(0.373 0.034 259.733)',
      '800': 'oklch(0.278 0.033 256.848)',
      '900': 'oklch(0.21 0.034 264.665)',
      '950': 'oklch(0.13 0.028 261.692)',
    },
  },
  {
    id: 'neon-cyan',
    name: 'Neon Cyan',
    desc: 'Electric teal & dark slate — hacker terminal aesthetic',
    tag: 'CYBER',
    preview: ['#06b6d4', '#0e7490', '#020c10'],
    hex: {
      primary:      '#06b6d4',
      primaryDark:  '#0891b2',
      primaryDeep:  '#0e7490',
      accent:       '#67e8f9',
      glow:         'rgba(6,182,212,0.18)',
      glowMd:       'rgba(6,182,212,0.12)',
      glowSm:       'rgba(6,120,150,0.07)',
      surfaceDark:  '#020c10',
      surfaceLight: '#ecfeff',
      cardDark:     '#061a20',
    },
    tw: {
      '50':  'oklch(0.984 0.019 200.873)',
      '100': 'oklch(0.956 0.045 203.388)',
      '200': 'oklch(0.917 0.08  205.032)',
      '300': 'oklch(0.865 0.127 207.078)',
      '400': 'oklch(0.789 0.154 211.53)',
      '500': 'oklch(0.715 0.143 215.221)',
      '600': 'oklch(0.609 0.126 221.723)',
      '700': 'oklch(0.52  0.105 223.128)',
      '800': 'oklch(0.45  0.085 224.283)',
      '900': 'oklch(0.398 0.07  227.392)',
      '950': 'oklch(0.302 0.056 229.695)',
    },
  },
  {
    id: 'rose-gold',
    name: 'Rose Gold',
    desc: 'Warm blush & champagne — elegant luxury blockchain UI',
    tag: 'LUXE',
    preview: ['#e11d74', '#9d174d', '#1a0a10'],
    hex: {
      primary:      '#e11d74',
      primaryDark:  '#be185d',
      primaryDeep:  '#9d174d',
      accent:       '#f472b6',
      glow:         'rgba(225,29,116,0.15)',
      glowMd:       'rgba(225,29,116,0.10)',
      glowSm:       'rgba(150,10,70,0.06)',
      surfaceDark:  '#1a0a10',
      surfaceLight: '#fff0f6',
      cardDark:     '#240d18',
    },
    tw: {
      '50':  'oklch(0.971 0.014 343.198)',
      '100': 'oklch(0.948 0.028 342.258)',
      '200': 'oklch(0.899 0.061 343.231)',
      '300': 'oklch(0.823 0.12  346.018)',
      '400': 'oklch(0.718 0.202 349.761)',
      '500': 'oklch(0.656 0.241 354.308)',
      '600': 'oklch(0.592 0.249 0.584)',
      '700': 'oklch(0.525 0.223 3.958)',
      '800': 'oklch(0.459 0.187 3.815)',
      '900': 'oklch(0.408 0.153 2.432)',
      '950': 'oklch(0.284 0.109 3.907)',
    },
  },
  {
    id: 'toxic-lime',
    name: 'Toxic Lime',
    desc: 'Electric chartreuse & void — biohazard data stream feel',
    tag: 'ACID',
    preview: ['#65a30d', '#3f6212', '#050c00'],
    hex: {
      primary:      '#65a30d',
      primaryDark:  '#4d7c0f',
      primaryDeep:  '#3f6212',
      accent:       '#a3e635',
      glow:         'rgba(101,163,13,0.18)',
      glowMd:       'rgba(101,163,13,0.12)',
      glowSm:       'rgba(60,100,5,0.07)',
      surfaceDark:  '#050c00',
      surfaceLight: '#f7fee7',
      cardDark:     '#0c1a02',
    },
    tw: {
      '50':  'oklch(0.986 0.031 120.757)',
      '100': 'oklch(0.967 0.067 122.328)',
      '200': 'oklch(0.938 0.127 124.321)',
      '300': 'oklch(0.897 0.196 126.665)',
      '400': 'oklch(0.841 0.238 128.85)',
      '500': 'oklch(0.768 0.233 130.85)',
      '600': 'oklch(0.648 0.2   131.684)',
      '700': 'oklch(0.532 0.157 131.589)',
      '800': 'oklch(0.452 0.124 132.899)',
      '900': 'oklch(0.392 0.095 134.258)',
      '950': 'oklch(0.274 0.063 136.259)',
    },
  },
  {
    id: 'arctic-steel',
    name: 'Arctic Steel',
    desc: 'Icy indigo & silver — ultra-clean enterprise command center',
    tag: 'ICE',
    preview: ['#4f46e5', '#3730a3', '#0a0b1a'],
    hex: {
      primary:      '#4f46e5',
      primaryDark:  '#4338ca',
      primaryDeep:  '#3730a3',
      accent:       '#818cf8',
      glow:         'rgba(79,70,229,0.15)',
      glowMd:       'rgba(79,70,229,0.10)',
      glowSm:       'rgba(50,40,160,0.07)',
      surfaceDark:  '#0a0b1a',
      surfaceLight: '#eef2ff',
      cardDark:     '#10122a',
    },
    tw: {
      '50':  'oklch(0.962 0.018 272.314)',
      '100': 'oklch(0.93  0.034 272.788)',
      '200': 'oklch(0.87  0.065 274.039)',
      '300': 'oklch(0.785 0.115 274.713)',
      '400': 'oklch(0.673 0.182 276.935)',
      '500': 'oklch(0.585 0.233 277.117)',
      '600': 'oklch(0.511 0.262 276.966)',
      '700': 'oklch(0.457 0.24  277.023)',
      '800': 'oklch(0.398 0.195 277.366)',
      '900': 'oklch(0.359 0.144 278.697)',
      '950': 'oklch(0.257 0.09  281.288)',
    },
  },
];

// ── CONTEXT ──────────────────────────────────────────────────────────────────
const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [themeId, setThemeId] = useState(
    () => localStorage.getItem('sc-theme-id') || 'red-black'
  );

  // Apply all CSS variables for a given theme object
  const applyThemeVars = useCallback((theme) => {
    const root = document.documentElement;
    const { hex, tw } = theme;

    // ── 1. Custom brand vars (used by index.css non-Tailwind rules) ──
    root.style.setProperty('--th-primary',       hex.primary);
    root.style.setProperty('--th-primary-dark',  hex.primaryDark);
    root.style.setProperty('--th-accent',        hex.accent);
    root.style.setProperty('--th-glow',          hex.glow);
    root.style.setProperty('--th-surface',       hex.surfaceDark);
    root.style.setProperty('--th-surface-light', hex.surfaceLight);
    root.style.setProperty('--th-root-glow-1',   hex.glowMd);
    root.style.setProperty('--th-root-glow-2',   hex.glowSm);

    // ── 2. Override Tailwind v4 red color ramp ──
    // Tailwind v4 utilities (text-red-600, bg-red-600, etc.) use these CSS vars.
    // By remapping them, ALL components in the app pick up the new theme color
    // without any JSX changes.
    root.style.setProperty('--color-red-50',  tw['50']);
    root.style.setProperty('--color-red-100', tw['100']);
    root.style.setProperty('--color-red-200', tw['200']);
    root.style.setProperty('--color-red-300', tw['300']);
    root.style.setProperty('--color-red-400', tw['400']);
    root.style.setProperty('--color-red-500', tw['500']);
    root.style.setProperty('--color-red-600', tw['600']);
    root.style.setProperty('--color-red-700', tw['700']);
    root.style.setProperty('--color-red-800', tw['800']);
    root.style.setProperty('--color-red-900', tw['900']);
    root.style.setProperty('--color-red-950', tw['950']);

    // Also remap rose-* (another commonly used ramp that maps to the brand color)
    root.style.setProperty('--color-rose-50',  tw['50']);
    root.style.setProperty('--color-rose-100', tw['100']);
    root.style.setProperty('--color-rose-200', tw['200']);
    root.style.setProperty('--color-rose-300', tw['300']);
    root.style.setProperty('--color-rose-400', tw['400']);
    root.style.setProperty('--color-rose-500', tw['500']);
    root.style.setProperty('--color-rose-600', tw['600']);
    root.style.setProperty('--color-rose-700', tw['700']);
    root.style.setProperty('--color-rose-800', tw['800']);
    root.style.setProperty('--color-rose-900', tw['900']);
    root.style.setProperty('--color-rose-950', tw['950']);

    // ── 3. data-theme attribute for CSS selector hooks ──
    root.setAttribute('data-theme', theme.id);

    // ── 4. Persist ──
    localStorage.setItem('sc-theme-id', theme.id);
  }, []);

  // Apply on mount
  useEffect(() => {
    const theme = THEMES.find(t => t.id === themeId) || THEMES[0];
    applyThemeVars(theme);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const selectTheme = useCallback((theme) => {
    setThemeId(theme.id);
    applyThemeVars(theme);
  }, [applyThemeVars]);

  const currentTheme = THEMES.find(t => t.id === themeId) || THEMES[0];

  return (
    <ThemeContext.Provider value={{ themeId, currentTheme, selectTheme, THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
