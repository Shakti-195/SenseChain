import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// ── THEME BOOTSTRAP — runs synchronously before React renders ────────────────
// Prevents flash of unstyled content on hard reload.
(function () {
  // 1. Dark/light mode class
  const mode = localStorage.getItem('sc-theme');
  if (mode === 'dark' || (!mode && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  // 2. Theme color variables — mirrors ThemeContext THEMES registry
  const BOOT_THEMES = {
    'red-black':   { p:'#dc2626', pd:'#991b1b', a:'#f87171', g:'rgba(220,38,38,0.15)', gm:'rgba(220,38,38,0.10)', gs:'rgba(180,10,10,0.06)', s:'#090909', sl:'#f5f5f5', tw:['oklch(0.971 0.013 17.38)','oklch(0.936 0.032 17.717)','oklch(0.885 0.062 18.334)','oklch(0.808 0.114 19.571)','oklch(0.704 0.191 22.216)','oklch(0.637 0.237 25.331)','oklch(0.577 0.245 27.325)','oklch(0.505 0.213 27.518)','oklch(0.444 0.177 26.127)','oklch(0.396 0.141 25.723)','oklch(0.258 0.092 26.042)']},
    'ocean-blue':  { p:'#2563eb', pd:'#1d4ed8', a:'#60a5fa', g:'rgba(37,99,235,0.15)',  gm:'rgba(37,99,235,0.12)',  gs:'rgba(10,30,120,0.08)',  s:'#020617', sl:'#f0f4ff', tw:['oklch(0.97 0.014 254.604)','oklch(0.932 0.032 255.585)','oklch(0.882 0.059 254.128)','oklch(0.809 0.105 251.813)','oklch(0.707 0.165 254.624)','oklch(0.623 0.214 259.815)','oklch(0.546 0.245 262.881)','oklch(0.488 0.243 264.376)','oklch(0.424 0.199 265.638)','oklch(0.379 0.146 265.522)','oklch(0.282 0.091 267.935)']},
    'forest-dark': { p:'#059669', pd:'#047857', a:'#34d399', g:'rgba(5,150,105,0.15)',   gm:'rgba(5,150,105,0.10)',   gs:'rgba(4,60,42,0.07)',    s:'#0a0a0a', sl:'#f0faf6', tw:['oklch(0.979 0.021 166.113)','oklch(0.95 0.052 163.051)','oklch(0.905 0.093 164.15)','oklch(0.845 0.143 164.978)','oklch(0.765 0.177 163.223)','oklch(0.696 0.17 162.48)','oklch(0.596 0.145 163.225)','oklch(0.508 0.118 165.612)','oklch(0.432 0.095 166.913)','oklch(0.378 0.077 168.94)','oklch(0.262 0.051 172.552)']},
    'purple-noir': { p:'#7c3aed', pd:'#6d28d9', a:'#a78bfa', g:'rgba(124,58,237,0.15)', gm:'rgba(124,58,237,0.12)', gs:'rgba(60,10,120,0.07)',  s:'#0d0d0d', sl:'#f5f3ff', tw:['oklch(0.969 0.016 293.756)','oklch(0.943 0.029 294.588)','oklch(0.894 0.057 293.283)','oklch(0.811 0.111 293.571)','oklch(0.702 0.183 293.541)','oklch(0.606 0.25 292.717)','oklch(0.541 0.281 293.009)','oklch(0.491 0.27 292.581)','oklch(0.432 0.232 292.759)','oklch(0.38 0.189 293.745)','oklch(0.274 0.128 293.806)']},
    'amber-steel': { p:'#d97706', pd:'#b45309', a:'#fbbf24', g:'rgba(217,119,6,0.15)',   gm:'rgba(217,119,6,0.10)',   gs:'rgba(120,60,5,0.06)',   s:'#1c1917', sl:'#fffbf0', tw:['oklch(0.987 0.022 95.277)','oklch(0.962 0.059 95.617)','oklch(0.924 0.12 95.746)','oklch(0.879 0.169 91.605)','oklch(0.828 0.189 84.429)','oklch(0.769 0.188 70.08)','oklch(0.666 0.179 58.318)','oklch(0.555 0.163 48.998)','oklch(0.473 0.137 46.201)','oklch(0.414 0.112 45.904)','oklch(0.279 0.077 45.635)']},
    'mono-white':  { p:'#374151', pd:'#1f2937', a:'#9ca3af', g:'rgba(55,65,81,0.10)',    gm:'rgba(55,65,81,0.08)',    gs:'rgba(30,40,55,0.05)',   s:'#111827', sl:'#f9fafb', tw:['oklch(0.985 0.002 247.839)','oklch(0.967 0.003 264.542)','oklch(0.928 0.006 264.531)','oklch(0.872 0.01 258.338)','oklch(0.707 0.022 261.325)','oklch(0.551 0.018 264.364)','oklch(0.446 0.03 256.802)','oklch(0.373 0.034 259.733)','oklch(0.278 0.033 256.848)','oklch(0.21 0.034 264.665)','oklch(0.13 0.028 261.692)']},
  };

  const id = localStorage.getItem('sc-theme-id') || 'red-black';
  const t = BOOT_THEMES[id] || BOOT_THEMES['red-black'];
  const r = document.documentElement;

  // Custom vars
  r.style.setProperty('--th-primary',       t.p);
  r.style.setProperty('--th-primary-dark',  t.pd);
  r.style.setProperty('--th-accent',        t.a);
  r.style.setProperty('--th-glow',          t.g);
  r.style.setProperty('--th-surface',       t.s);
  r.style.setProperty('--th-surface-light', t.sl);
  r.style.setProperty('--th-root-glow-1',   t.gm);
  r.style.setProperty('--th-root-glow-2',   t.gs);

  // Remap Tailwind red + rose ramp
  const shades = ['50','100','200','300','400','500','600','700','800','900','950'];
  shades.forEach((s, i) => {
    r.style.setProperty(`--color-red-${s}`,  t.tw[i]);
    r.style.setProperty(`--color-rose-${s}`, t.tw[i]);
  });

  r.setAttribute('data-theme', id);
})();
// ─────────────────────────────────────────────────────────────────────────────

createRoot(document.getElementById('root')).render(
    <App />
)