import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Cpu, ShieldCheck, Activity, Zap, Globe, Brain,
  Wifi, Terminal, Lock, Database, Server, Layers,
  Radio, CheckCircle, ArrowRight, Network, Code2,
  BookOpen, Map, LayoutDashboard, BarChart2, Settings,
  Shield, Link, Signal, Palette, MessageSquare,
  ChevronRight, Info, TrendingUp, AlertTriangle,
  Star, Sparkles, Clock, Rocket, CheckSquare,
  Eye, Search, SlidersHorizontal, Moon, Volume2,
  Newspaper, Plus, Play, Check, Droplets, Thermometer, Flame
} from 'lucide-react';

// ── Fade-in wrapper ────────────────────────────────────────────────────────
const Fade = ({ children, delay = 0, className = '' }) => (
  <motion.div
    initial={{ opacity: 0, y: 28 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6, delay }}
    className={className}
  >
    {children}
  </motion.div>
);

// ── Section label ──────────────────────────────────────────────────────────
const Label = ({ text }) => (
  <div className="flex items-center gap-2 mb-3">
    <div className="w-4 h-px" style={{ backgroundColor: 'var(--th-primary)' }} />
    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--th-primary)' }}>{text}</span>
  </div>
);

// ── Section heading ────────────────────────────────────────────────────────
const Heading = ({ children }) => (
  <h2 className="text-2xl md:text-3xl font-bold mb-2" style={{ fontFamily: 'Space Grotesk' }}>{children}</h2>
);

// ── Divider ────────────────────────────────────────────────────────────────
const Divider = () => <div className="border-t border-stone-100 dark:border-white/5 my-12" />;

// ── Page card used in "Platform Pages" section ─────────────────────────────
const PageCard = ({ icon, title, path, desc, steps, navigate }) => (
  <motion.div
    whileHover={{ y: -3 }}
    className="glass-card rounded-2xl p-5 flex flex-col gap-3 cursor-pointer group"
    onClick={() => navigate(path)}
  >
    <div className="flex items-center justify-between">
      <div className="p-2 rounded-xl" style={{ backgroundColor: 'var(--th-glow)', color: 'var(--th-primary)' }}>
        {icon}
      </div>
      <ChevronRight size={14} className="text-stone-400 group-hover:translate-x-1 transition-transform" style={{ color: 'var(--th-primary)' }} />
    </div>
    <div>
      <p className="font-bold text-sm" style={{ fontFamily: 'Space Grotesk' }}>{title}</p>
      <p className="text-[10px] font-mono text-stone-400 mb-1">{path}</p>
      <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">{desc}</p>
    </div>
    {steps && (
      <ul className="space-y-1 border-t border-stone-100 dark:border-white/5 pt-3">
        {steps.map((s, i) => (
          <li key={i} className="flex items-start gap-1.5 text-[10px] text-stone-400">
            <CheckCircle size={10} className="mt-0.5 shrink-0" style={{ color: 'var(--th-primary)' }} />
            {s}
          </li>
        ))}
      </ul>
    )}
  </motion.div>
);

// ── Mascot image paths ─────────────────────────────────────────────────────
const MASCOT_IMAGES = {
  villager: '/mascots/villager.png',
  bheem: '/mascots/bheem.png',
  wizard: '/mascots/wizard.png',
  robot: '/mascots/robot.png',
  mechanic: '/mascots/mechanic.png',
  explorer: '/mascots/explorer.png',
};

// ── Welcome Guide speech bubble component with mascot images ─────────────────
const WelcomeGuide = ({ mascot, title, text }) => {
  const p  = 'var(--th-primary)';

  const floatAnim = (mascot === 'bheem' || mascot === 'robot') ? { y: [0, -4, 0] } : {};
  const floatTrans = (mascot === 'bheem' || mascot === 'robot') ? { repeat: Infinity, duration: 1.8, ease: "easeInOut" } : {};

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className="flex items-start gap-4 p-5 rounded-[22px] border border-[var(--th-primary)]/20 dark:border-[var(--th-primary)]/10 bg-[var(--th-glow)]/40 dark:bg-white/1 relative overflow-hidden group shadow-sm transition-all duration-300 hover:border-[var(--th-primary)]/30 mb-6"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--th-primary)]/2 to-transparent pointer-events-none" />

      {/* Avatar Container — now uses a real image */}
      <motion.div
        animate={floatAnim}
        transition={floatTrans}
        className="w-14 h-14 rounded-full shrink-0 transition-transform duration-300 group-hover:scale-105 overflow-hidden border-2 border-[var(--th-primary)]/20 bg-[var(--th-glow)] dark:bg-white/4"
      >
        <img
          src={MASCOT_IMAGES[mascot]}
          alt={`${mascot} mascot`}
          className="w-full h-full object-cover"
          draggable={false}
        />
      </motion.div>

      {/* Title & Speech Bubble */}
      <div className="flex-1 min-w-0 relative">
        <p className="text-[10px] font-black uppercase tracking-widest mb-1.5 flex items-center gap-1.5" style={{ color: p }}>
          <Sparkles size={9} className="animate-pulse" />
          {title}
        </p>

        <div className="relative bg-stone-50 dark:bg-stone-900/60 border border-stone-200/50 dark:border-white/5 rounded-2xl p-4 text-xs italic text-stone-600 dark:text-stone-300 leading-relaxed shadow-sm">
          {/* Arrow */}
          <div className="absolute top-4 -left-1.5 w-3 h-3 bg-stone-50 dark:bg-stone-900/60 border-l border-b border-stone-200/50 dark:border-white/5 rotate-45" style={{ backgroundColor: 'inherit' }} />
          
          <span className="font-mono text-xs mr-1" style={{ color: p }}>"</span>
          {text}
          <span className="font-mono text-xs ml-1" style={{ color: p }}>"</span>
        </div>
      </div>
    </motion.div>
  );
};

// ── Animated Tech SVG Graphics ──────────────────────────────────────────────
const SensorAnimation = () => (
  <div className="w-full h-44 flex items-center justify-center bg-stone-900/40 dark:bg-black/40 rounded-2xl border border-stone-200 dark:border-white/5 relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent pointer-events-none" />
    <svg viewBox="0 0 200 100" className="w-48 h-24">
      <rect x="20" y="35" width="30" height="30" rx="4" fill="var(--th-primary)" opacity="0.8" />
      <rect x="25" y="40" width="20" height="20" rx="2" fill="#1c1917" />
      <circle cx="35" cy="50" r="4" fill="var(--th-primary)" />
      <motion.circle cx="35" cy="50" r="10" fill="none" stroke="var(--th-primary)" strokeWidth="1.5"
        animate={{ scale: [1, 2.5], opacity: [1, 0] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }} />
      <motion.circle cx="35" cy="50" r="10" fill="none" stroke="var(--th-primary)" strokeWidth="1.5"
        animate={{ scale: [1, 2.5], opacity: [1, 0] }}
        transition={{ repeat: Infinity, duration: 1.5, delay: 0.75, ease: "easeOut" }} />
      <rect x="150" y="35" width="30" height="30" rx="4" fill="#3b82f6" opacity="0.8" />
      <rect x="155" y="40" width="20" height="20" rx="2" fill="#1c1917" />
      <polygon points="165,55 170,45 175,55" fill="#3b82f6" />
      <motion.circle cx="35" cy="50" r="3" fill="#60a5fa"
        animate={{ cx: [35, 165], cy: [50, 50], opacity: [1, 1, 0] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }} />
      <motion.circle cx="35" cy="50" r="3" fill="#60a5fa"
        animate={{ cx: [35, 165], cy: [50, 50], opacity: [1, 1, 0] }}
        transition={{ repeat: Infinity, duration: 2, delay: 1, ease: "easeInOut" }} />
    </svg>
  </div>
);

const MiningAnimation = () => (
  <div className="w-full h-44 flex items-center justify-center bg-stone-900/40 dark:bg-black/40 rounded-2xl border border-stone-200 dark:border-white/5 relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent pointer-events-none" />
    <svg viewBox="0 0 200 100" className="w-48 h-24">
      <motion.g transform="translate(100, 50)"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 5, ease: "linear" }}>
        <circle cx="0" cy="0" r="22" fill="none" stroke="var(--th-primary)" strokeWidth="2" strokeDasharray="6, 4" />
        <circle cx="0" cy="0" r="14" fill="none" stroke="var(--th-primary)" strokeWidth="1" />
      </motion.g>
      <rect x="75" y="25" width="50" height="50" rx="6" fill="none" stroke="var(--th-primary)" strokeWidth="2" />
      <rect x="80" y="30" width="40" height="40" rx="4" fill="var(--th-primary)" opacity="0.1" />
      <motion.text x="100" y="54" textAnchor="middle" fill="var(--th-primary)" fontSize="8" fontFamily="monospace" fontWeight="bold"
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ repeat: Infinity, duration: 1 }}>
        HASHING
      </motion.text>
      <motion.text x="100" y="64" textAnchor="middle" fill="#22c55e" fontSize="6" fontFamily="monospace"
        animate={{ opacity: [0, 1, 0] }}
        transition={{ repeat: Infinity, duration: 1.5, delay: 0.5 }}>
        NONCE FOUND!
      </motion.text>
    </svg>
  </div>
);

const LinkingAnimation = () => (
  <div className="w-full h-44 flex items-center justify-center bg-stone-900/40 dark:bg-black/40 rounded-2xl border border-stone-200 dark:border-white/5 relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-transparent pointer-events-none" />
    <svg viewBox="0 0 200 100" className="w-48 h-24">
      <rect x="30" y="30" width="40" height="40" rx="6" fill="none" stroke="var(--th-primary)" strokeWidth="2" />
      <text x="50" y="53" textAnchor="middle" fill="var(--th-primary)" fontSize="8" fontFamily="monospace" fontWeight="bold">BLOCK N</text>
      <rect x="130" y="30" width="40" height="40" rx="6" fill="none" stroke="var(--th-primary)" strokeWidth="2" />
      <text x="150" y="53" textAnchor="middle" fill="var(--th-primary)" fontSize="8" fontFamily="monospace" fontWeight="bold">BLOCK N+1</text>
      <motion.g 
        animate={{ strokeDashoffset: [0, -20] }}
        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
        stroke="var(--th-primary)" strokeWidth="2" fill="none" strokeDasharray="5, 3"
      >
        <path d="M 70 50 L 130 50" />
      </motion.g>
      <motion.circle cx="100" cy="50" r="6" fill="#1c1917" stroke="var(--th-primary)" strokeWidth="2"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }} />
      <path d="M 98 48 L 102 48 L 102 52 L 98 52 Z" fill="var(--th-primary)" />
    </svg>
  </div>
);

const AIAnimation = () => (
  <div className="w-full h-44 flex items-center justify-center bg-stone-900/40 dark:bg-black/40 rounded-2xl border border-stone-200 dark:border-white/5 relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent pointer-events-none" />
    <svg viewBox="0 0 200 100" className="w-48 h-24">
      <rect x="20" y="35" width="30" height="30" rx="4" fill="none" stroke="#4b5563" strokeWidth="1.5" />
      <rect x="85" y="35" width="30" height="30" rx="4" fill="none" stroke="#4b5563" strokeWidth="1.5" />
      <rect x="150" y="35" width="30" height="30" rx="4" fill="none" stroke="#4b5563" strokeWidth="1.5" />
      <line x1="50" y1="50" x2="85" y2="50" stroke="#4b5563" strokeWidth="1.5" />
      <line x1="115" y1="50" x2="150" y2="50" stroke="#4b5563" strokeWidth="1.5" />
      <motion.line x1="10" y1="20" x2="10" y2="80" stroke="#10b981" strokeWidth="2" opacity="0.7"
        animate={{ x: [10, 190, 10] }}
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }} />
      <motion.polygon points="10,20 10,80 0,80 0,20" fill="url(#scanGrad)" opacity="0.3"
        animate={{ x: [10, 190, 10] }}
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }} />
      <defs>
        <linearGradient id="scanGrad" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>
      <motion.g 
        animate={{ scale: [0.8, 1, 0.8], opacity: [0.5, 1, 0.5] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
      >
        <circle cx="35" cy="50" r="8" fill="#10b981" opacity="0.2" />
        <circle cx="35" cy="50" r="4" fill="#10b981" />
        <circle cx="100" cy="50" r="8" fill="#10b981" opacity="0.2" />
        <circle cx="100" cy="50" r="4" fill="#10b981" />
        <circle cx="165" cy="50" r="8" fill="#10b981" opacity="0.2" />
        <circle cx="165" cy="50" r="4" fill="#10b981" />
      </motion.g>
    </svg>
  </div>
);

// ── Hero Background Network Mesh ──────────────────────────────────────────
const HeroMesh = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--th-primary)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
        </defs>
        
        {/* Animated paths */}
        <motion.path
          d="M 100 100 L 300 150 L 500 100 L 700 200 L 900 150"
          fill="none"
          stroke="var(--th-primary)"
          strokeWidth="1.5"
          strokeDasharray="10, 5"
          animate={{ strokeDashoffset: [0, -30] }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
        />
        <motion.path
          d="M 150 300 L 350 250 L 550 320 L 750 280 L 950 350"
          fill="none"
          stroke="var(--th-primary)"
          strokeWidth="1"
          strokeDasharray="6, 8"
          animate={{ strokeDashoffset: [0, 20] }}
          transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
        />

        {/* Nodes */}
        {[
          { cx: 100, cy: 100, r: 6 },
          { cx: 300, cy: 150, r: 4 },
          { cx: 500, cy: 100, r: 8 },
          { cx: 700, cy: 200, r: 5 },
          { cx: 900, cy: 150, r: 7 },
          { cx: 150, cy: 300, r: 5 },
          { cx: 350, cy: 250, r: 6 },
          { cx: 550, cy: 320, r: 4 },
          { cx: 750, cy: 280, r: 8 },
          { cx: 950, cy: 350, r: 5 },
        ].map((node, i) => (
          <g key={i}>
            <circle cx={node.cx} cy={node.cy} r={node.r + 6} fill="url(#glow)" />
            <motion.circle
              cx={node.cx}
              cy={node.cy}
              r={node.r}
              fill="var(--th-primary)"
              animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ repeat: Infinity, duration: 2 + (i % 3), ease: "easeInOut" }}
            />
          </g>
        ))}
      </svg>
    </div>
  );
};

// ── Interactive Pipeline Visualizer ────────────────────────────────────────
const InteractivePipeline = () => {
  const [activeStep, setActiveStep] = useState(0);
  const steps = [
    { 
      icon: <Radio size={20} />, 
      title: 'Sensor Capture', 
      desc: 'IoT hardware (ESP32/WiFi/BT) streams temperature & humidity in real-time.',
      fullDesc: 'Raw data is collected from edge devices (like ESP32 chips equipped with DHT22 sensors). These devices continuously gather environmental telemetry and transmit it securely using WebSockets to ensure real-time transmission latency of under 100ms.'
    },
    { 
      icon: <Code2 size={20} />, 
      title: 'Block Mining', 
      desc: 'Each data packet is sealed with PoW: the server finds a valid SHA-256 hash.',
      fullDesc: 'The incoming telemetry packet is passed to our backend mining pool. The consensus engine initiates a Proof-of-Work algorithm, searching for a cryptographic nonce that satisfies the required target difficulty (e.g., leading zeros in the SHA-256 hash).'
    },
    { 
      icon: <Lock size={20} />, 
      title: 'Chain Linking', 
      desc: 'Every block stores the previous block\'s hash, making tampering detectable.',
      fullDesc: 'Once mined, the block is cryptographically linked to the head of the chain. Each block header stores the SHA-256 hash value of the previous block, creating an immutable back-linked ledger. If any block is modified retroactively, the link is broken instantly.'
    },
    { 
      icon: <ShieldCheck size={20} />, 
      title: 'AI Verification', 
      desc: 'The security engine validates every hash link and raises alerts.',
      fullDesc: 'The AI Neural Core audits the database. It recalculates the hash linkage of the complete chain in real time. If a cryptographic severance is detected, the audit engine triggers an alarm, sounds audio alerts, and locks down the interface.'
    },
  ];

  return (
    <div className="glass-card rounded-[24px] p-6 md:p-8 space-y-8 relative overflow-hidden">
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
        {steps.map((step, idx) => (
          <div
            key={idx}
            className={`flex-1 w-full flex flex-col items-center text-center p-5 rounded-2xl border transition-all duration-300 relative cursor-pointer ${
              activeStep === idx 
                ? 'bg-[var(--th-glow)] border-[var(--th-primary)] scale-[1.03] shadow-lg shadow-[var(--th-glow)]/30' 
                : 'bg-white/40 dark:bg-white/2 border-stone-200 dark:border-white/5 hover:border-stone-300 dark:hover:border-white/10'
            }`}
            onMouseEnter={() => setActiveStep(idx)}
          >
            {/* Step number badge */}
            <div 
              className="absolute -top-3 w-6 h-6 rounded-full text-white text-[10px] font-black flex items-center justify-center transition-colors"
              style={{ backgroundColor: activeStep === idx ? 'var(--th-primary)' : '#78716c' }}
            >
              {idx + 1}
            </div>

            <div 
              className="p-3.5 rounded-xl mb-4 transition-transform duration-500"
              style={{ 
                background: activeStep === idx ? 'rgba(255,255,255,0.8)' : 'var(--th-glow)', 
                color: 'var(--th-primary)',
                transform: activeStep === idx ? 'scale(1.1) rotate(5deg)' : 'none'
              }}
            >
              {step.icon}
            </div>
            
            <p className="font-bold text-sm mb-2" style={{ fontFamily: 'Space Grotesk' }}>{step.title}</p>
            <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">{step.desc}</p>
          </div>
        ))}
      </div>

      {/* Animated Graphic showing the active step */}
      <div className="space-y-4">
        {activeStep === 0 && <SensorAnimation />}
        {activeStep === 1 && <MiningAnimation />}
        {activeStep === 2 && <LinkingAnimation />}
        {activeStep === 3 && <AIAnimation />}
        
        <div className="glass-card rounded-2xl p-5 border border-[var(--th-primary)]/20 bg-stone-50 dark:bg-white/4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--th-primary)]/5 rounded-full blur-xl pointer-events-none" />
          <h4 className="text-sm font-bold text-stone-800 dark:text-stone-100 flex items-center gap-2 mb-1" style={{ fontFamily: 'Space Grotesk' }}>
            <span className="flex items-center justify-center w-5 h-5 rounded-lg text-[10px] font-black text-white" style={{ backgroundColor: 'var(--th-primary)' }}>
              {activeStep + 1}
            </span>
            {steps[activeStep].title} Detailed Overview
          </h4>
          <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
            {steps[activeStep].fullDesc}
          </p>
        </div>
      </div>

      {/* Decorative pipeline line below with moving pulse */}
      <div className="relative h-2 w-full bg-stone-200 dark:bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className="absolute h-full bg-gradient-to-r from-[var(--th-primary)] to-rose-500 rounded-full"
          initial={{ width: '25%' }}
          animate={{ width: `${(activeStep + 1) * 25}%` }}
          transition={{ type: 'spring', stiffness: 100, damping: 15 }}
        />
        <motion.div
          className="absolute h-full w-12 bg-white/50 blur-sm"
          animate={{ x: ['-50px', '1400px'] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
        />
      </div>
    </div>
  );
};

// ── Interactive Stepper with 5 Onboarding Simulators ──────────────────────
const OnboardingStepper = ({ navigate }) => {
  const [activeStep, setActiveStep] = useState(0);
  
  // Step 3 (Telemetry) Mock States:
  const [telemetryPoints, setTelemetryPoints] = useState([22, 23, 22.5, 24, 23.8, 25, 24.5, 23.5, 24.2]);
  useEffect(() => {
    if (activeStep !== 2) return;
    const interval = setInterval(() => {
      setTelemetryPoints(prev => {
        const nextVal = Math.max(18, Math.min(42, prev[prev.length - 1] + (Math.random() - 0.5) * 3));
        return [...prev.slice(1), parseFloat(nextVal.toFixed(1))];
      });
    }, 1500);
    return () => clearInterval(interval);
  }, [activeStep]);

  // Step 4 (Breach) Mock States:
  const [isBreached, setIsBreached] = useState(false);

  // Step 5 (Difficulty) Mock States:
  const [difficulty, setDifficulty] = useState(3);

  const steps = [
    {
      step: 1,
      title: 'Create Your Account',
      desc: 'Register secure role-based access. Check email for an OTP to activate your credentials.',
      action: 'Go to Login', path: '/login',
    },
    {
      step: 2,
      title: 'Pair Your First Node',
      desc: 'Uplink IoT nodes via WiFi/BT. Automated Discovery discovers and links ESP32 sensor hardware.',
      action: 'Uplink Terminal', path: '/provisioning',
    },
    {
      step: 3,
      title: 'Watch Blocks Mine Live',
      desc: 'Watch blocks mine live! Telemetry updates dynamically with the SHA-256 PoW consensus miner.',
      action: 'Dashboard', path: '/',
    },
    {
      step: 4,
      title: 'Test Breach Detection',
      desc: 'Inject virtual breach to test forensic SHA-256 chain validation. Recalculates and flags link severances.',
      action: 'Security', path: '/security',
    },
    {
      step: 5,
      title: 'Explore Difficulty Settings',
      desc: 'Set Proof-of-Work difficulty target. High difficulty requires heavier processing to seal blocks.',
      action: 'Node Settings', path: '/node-settings',
    }
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-stretch">
      {/* Steps Menu List */}
      <div className="flex-1 space-y-3">
        {steps.map((item, idx) => (
          <div
            key={idx}
            onClick={() => setActiveStep(idx)}
            className={`glass-card rounded-2xl p-4 flex items-start gap-4 cursor-pointer transition-all duration-300 border ${
              activeStep === idx 
                ? 'bg-[var(--th-glow)] border-[var(--th-primary)] shadow-md' 
                : 'bg-white/40 dark:bg-white/2 border-stone-200 dark:border-white/5 hover:border-stone-300 dark:hover:border-white/10'
            }`}
          >
            <div 
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-black shrink-0 transition-colors"
              style={{ backgroundColor: activeStep === idx ? 'var(--th-primary)' : '#78716c' }}
            >
              {item.step}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center gap-2 mb-1">
                <p className="font-bold text-xs" style={{ fontFamily: 'Space Grotesk' }}>{item.title}</p>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(item.path);
                  }}
                  className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[9px] font-bold text-white shrink-0 hover:opacity-85 transition-opacity"
                  style={{ backgroundColor: 'var(--th-primary)' }}
                >
                  {item.action} <ArrowRight size={8} className="ml-1" />
                </button>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Simulator Card */}
      <div className="flex-1 min-h-[340px] glass-card rounded-[24px] p-6 relative overflow-hidden flex flex-col justify-between border border-stone-200 dark:border-white/5 bg-stone-950 dark:bg-black/90 text-white shadow-xl">
        <div className="absolute inset-0 pointer-events-none opacity-10">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[var(--th-primary)] rounded-full blur-3xl" />
        </div>

        {/* Simulator Content */}
        <div className="relative z-10 flex-1 flex flex-col justify-between space-y-6">
          <div className="flex justify-between items-center border-b border-white/10 pb-3 gap-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-white/5 border border-white/10 rounded-xl text-[var(--th-primary)]">
                {activeStep === 0 && <Settings size={16} />}
                {activeStep === 1 && <Wifi size={16} />}
                {activeStep === 2 && <Activity size={16} />}
                {activeStep === 3 && <Shield size={16} />}
                {activeStep === 4 && <SlidersHorizontal size={16} />}
              </div>
              <div className="text-left font-mono">
                <span className="text-[9px] text-[var(--th-primary)] uppercase font-bold block">
                  Interactive Simulator // Step {activeStep + 1}
                </span>
                <span className="text-[10px] text-stone-300 leading-tight block">
                  {activeStep === 0 && 'Mock OTP account registration keys'}
                  {activeStep === 1 && 'Scanning wireless device pairing signals'}
                  {activeStep === 2 && 'Mined blocks ledger data streams'}
                  {activeStep === 3 && 'Inject mock attack payload test'}
                  {activeStep === 4 && 'Adjust Proof-of-Work difficulty target'}
                </span>
              </div>
            </div>
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
              <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" /> Sandbox Console
            </span>
          </div>

          <div className="flex-1 flex items-center justify-center min-h-[180px]">
            {/* Step 1 Simulator */}
            {activeStep === 0 && (
              <div className="w-full max-w-xs space-y-4">
                <div className="glass-panel border border-white/10 rounded-2xl p-4 bg-white/5 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-stone-400 uppercase tracking-wider font-mono">OTP Verification</span>
                    <span className="text-[9px] bg-emerald-500/20 border border-emerald-500/35 text-emerald-400 px-2 py-0.5 rounded font-black">VALIDATED</span>
                  </div>
                  <div className="flex justify-center gap-2 font-mono">
                    {[5, 9, 3, 1].map((n, i) => (
                      <div key={i} className="w-9 h-11 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center font-bold text-base text-[var(--th-primary)]">
                        {n}
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-stone-400 text-center font-mono">Token: admin_session_jwt_2026</p>
                </div>
              </div>
            )}

            {/* Step 2 Simulator */}
            {activeStep === 1 && (
              <div className="relative w-40 h-40 flex items-center justify-center">
                {/* Discovery radar scan */}
                <div className="absolute inset-0 rounded-full border border-[var(--th-primary)]/20 animate-ping opacity-30" />
                <div className="absolute inset-4 rounded-full border border-[var(--th-primary)]/30 animate-pulse opacity-45" />
                <div className="absolute inset-10 rounded-full border border-[var(--th-primary)]/50" />
                <div className="absolute w-2 h-2 rounded-full bg-[var(--th-primary)]" />
                
                {/* Node Found Flag */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute -top-1 right-2 bg-stone-900 border border-[var(--th-primary)]/40 p-2 rounded-lg text-[9px] font-mono shadow-xl space-y-1"
                >
                  <p className="font-bold text-[var(--th-primary)]">ESP32_NODE_9A</p>
                  <p className="text-stone-400">RSSI: -58 dBm</p>
                  <span className="text-emerald-400 font-bold uppercase tracking-wider">● Live Mined</span>
                </motion.div>
              </div>
            )}

            {/* Step 3 Simulator */}
            {activeStep === 2 && (
              <div className="w-full space-y-3">
                <div className="h-28 w-full bg-white/5 border border-white/10 rounded-xl p-3 flex items-end justify-between relative overflow-hidden">
                  {/* Draw mock telemetry lines using inline SVG */}
                  <svg className="absolute inset-0 w-full h-full p-2" viewBox="0 0 100 30" preserveAspectRatio="none">
                    <polyline
                      fill="none"
                      stroke="var(--th-primary)"
                      strokeWidth="1.5"
                      points={telemetryPoints.map((val, i) => `${(i / (telemetryPoints.length - 1)) * 100},${30 - (val - 15) * 1.2}`).join(' ')}
                    />
                    {telemetryPoints.map((val, i) => (
                      <circle
                        key={i}
                        cx={(i / (telemetryPoints.length - 1)) * 100}
                        cy={30 - (val - 15) * 1.2}
                        r="1.5"
                        fill="var(--th-primary)"
                      />
                    ))}
                  </svg>
                  <span className="absolute top-2 right-2 text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded">
                    Temp: {telemetryPoints[telemetryPoints.length - 1]}°C
                  </span>
                </div>
                <p className="text-[10px] text-stone-400 text-center font-mono">Live WebSocket Streaming Block Telemetry</p>
              </div>
            )}

            {/* Step 4 Simulator */}
            {activeStep === 3 && (
              <div className="w-full space-y-4">
                <div className="flex justify-center gap-3">
                  {[
                    { id: 1, hash: 'a12b', status: 'secure' },
                    { id: 2, hash: isBreached ? 'err_9' : '9cd4', status: isBreached ? 'corrupt' : 'secure' },
                    { id: 3, hash: isBreached ? 'err_a' : 'ff80', status: isBreached ? 'corrupt' : 'secure' }
                  ].map((block) => (
                    <div 
                      key={block.id}
                      className={`w-20 p-2 rounded-xl border text-center transition-all duration-500 font-mono text-[9px] ${
                        block.status === 'corrupt'
                          ? 'bg-red-950/40 border-red-500 text-red-400 shadow-md shadow-red-500/20'
                          : 'bg-emerald-950/40 border-emerald-500 text-emerald-400'
                      }`}
                    >
                      <p className="font-bold">Block #{block.id}</p>
                      <p className="text-[7px] opacity-70 mt-1">Hash: {block.hash}</p>
                      <p className="text-[7px] font-bold uppercase mt-1">
                        {block.status === 'corrupt' ? '✗ Corrupt' : '✓ OK'}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="flex justify-center">
                  <button
                    onClick={() => setIsBreached(!isBreached)}
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                      isBreached
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-red-600 hover:bg-red-700 text-white'
                    }`}
                  >
                    {isBreached ? 'Repair Chain' : 'Inject Virtual Breach'}
                  </button>
                </div>
              </div>
            )}

            {/* Step 5 Simulator */}
            {activeStep === 4 && (
              <div className="w-full space-y-5">
                <div className="flex items-center justify-between gap-6 bg-white/5 p-4 rounded-xl border border-white/10">
                  {/* Dynamic hashing spinner */}
                  <div className="w-12 h-12 flex items-center justify-center shrink-0">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ 
                        repeat: Infinity, 
                        duration: difficulty === 1 ? 0.3 : difficulty === 2 ? 0.6 : difficulty === 3 ? 1.2 : difficulty === 4 ? 2.5 : difficulty === 5 ? 5 : 10, 
                        ease: 'linear' 
                      }}
                      className="w-10 h-10 border-2 border-t-transparent rounded-full"
                      style={{ borderColor: 'var(--th-primary)', borderTopColor: 'transparent' }}
                    />
                  </div>
                  <div className="flex-1 font-mono text-left">
                    <p className="text-[10px] text-stone-400">Target Zeros: {difficulty}</p>
                    <p className="text-[11px] font-bold text-stone-200">
                      Difficulty: {difficulty <= 2 ? 'Fast Mining' : difficulty <= 4 ? 'Balanced PoW' : 'Heavy Cryptographic Shield'}
                    </p>
                  </div>
                </div>
                
                {/* Difficulty Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[9px] text-stone-400 font-mono">
                    <span>1 (Easy)</span>
                    <span>6 (Heavy)</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="6"
                    value={difficulty}
                    onChange={(e) => setDifficulty(parseInt(e.target.value))}
                    className="w-full accent-[var(--th-primary)] h-1 bg-white/10 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Interactive Tech Stack Isometric Layers ───────────────────────────────
const TechStackLayers = () => {
  const [activeLayer, setActiveLayer] = useState(0);
  const layers = [
    {
      name: 'Client Layer (Frontend)',
      sub: 'Single Page App Portal',
      tech: ['React 18 + Vite', 'Tailwind CSS v4', 'Framer Motion', 'Recharts', 'Lucide Icons'],
      details: 'High-performance React application rendered using Vite. Handles real-time telemetry rendering via WebSocket connections, styling customization via a dynamic token theme compiler, and animated UI state transitions.',
      color: 'from-blue-500/20 to-indigo-500/20 border-blue-500/30'
    },
    {
      name: 'API & Gateway Layer',
      sub: 'Asynchronous Services',
      tech: ['Python FastAPI', 'WebSocket Engine', 'Uvicorn ASGI', 'JWT Security Provider'],
      details: 'FastAPI asynchronous backend. Operates a WebSocket gateway that broadcasts live mined block data to all connected browser clients concurrently, and manages account JWT validations.',
      color: 'from-red-500/20 to-orange-500/20 border-red-500/30'
    },
    {
      name: 'Consensus & Mining Engine',
      sub: 'Proof-of-Work Validator',
      tech: ['SHA-256 Proof-of-Work', 'Python Mining Worker', 'Ethers/Crypto Primitives'],
      details: 'The core ledger logic. Executes Proof-of-Work mining loops for incoming telemetry. Requires block hashes to fit a custom leading-zero difficulty, and performs retroactive SHA-256 validation checks.',
      color: 'from-violet-500/20 to-fuchsia-500/20 border-violet-500/30'
    },
    {
      name: 'Database & Persistent Storage',
      sub: 'Immutable Ledger Store',
      tech: ['MongoDB Atlas', 'Async Database Drivers', 'Node Schema Registries'],
      details: 'Persistent storage using MongoDB. Houses the complete chronological blockchain ledger, verified device registers, and forensic operation logs. Uses async motor drivers to maximize ingestion throughput.',
      color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30'
    },
    {
      name: 'Edge IoT Hardware',
      sub: 'Telemetry Broadcast Nodes',
      tech: ['ESP32 Microcontroller', 'DHT22 Temp/Humidity Sensor', 'WiFi & Bluetooth LE stack'],
      details: 'Edge sensor hardware. Reads physical temperature and humidity from a DHT22 sensor and streams encrypted payload packets directly to the central backend. Features auto-pairing and local logging.',
      color: 'from-pink-500/20 to-rose-500/20 border-pink-500/30'
    }
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start">
      {/* 3D Stack Visualization */}
      <div className="w-full lg:w-[280px] flex flex-col items-center py-6">
        <div className="relative w-64 h-72 flex flex-col-reverse justify-between">
          {layers.map((layer, idx) => {
            const isActive = activeLayer === idx;
            // Isometric skew effect
            const skewStyle = {
              transform: `perspective(500px) rotateX(45deg) rotateZ(-15deg) translateY(${isActive ? '-20px' : '0px'}) translateZ(${idx * 20}px)`,
              zIndex: idx + 10,
            };
            return (
              <motion.div
                key={idx}
                onClick={() => setActiveLayer(idx)}
                style={skewStyle}
                className={`w-full h-12 rounded-xl border bg-gradient-to-r ${layer.color} cursor-pointer transition-all duration-300 flex items-center justify-between px-4 text-xs font-bold shadow-md absolute`}
                style={{
                  ...skewStyle,
                  bottom: `${idx * 45}px`,
                  boxShadow: isActive ? '0 10px 25px rgba(220,38,38,0.25)' : 'none',
                  borderWidth: isActive ? '2px' : '1px'
                }}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-[var(--th-primary)] animate-pulse' : 'bg-stone-400'}`} />
                  <span className={isActive ? 'text-white' : 'text-stone-400'}>{layer.name.split(' ')[0]} Layer</span>
                </div>
                <ChevronRight size={12} className={isActive ? 'text-white' : 'text-stone-400'} />
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Layer Description Pane */}
      <div className="flex-1 w-full glass-card rounded-[24px] p-6 min-h-[220px] flex flex-col justify-between border border-stone-200 dark:border-white/5 relative overflow-hidden bg-white/60 dark:bg-white/2">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--th-primary)]/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="space-y-4">
          <div>
            <h4 className="text-base font-bold text-stone-800 dark:text-stone-100" style={{ fontFamily: 'Space Grotesk' }}>
              {layers[activeLayer].name}
            </h4>
            <p className="text-xs text-[var(--th-primary)] font-bold tracking-wide font-mono mt-0.5">
              {layers[activeLayer].sub}
            </p>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
            {layers[activeLayer].details}
          </p>
        </div>

        <div className="pt-4 border-t border-stone-100 dark:border-white/5 mt-4">
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">Technologies Used</p>
          <div className="flex flex-wrap gap-1.5">
            {layers[activeLayer].tech.map(t => (
              <span key={t} className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[var(--th-glow)] text-[var(--th-primary)] border border-[var(--th-primary)]/10">
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── News & Updates Feed Component ──────────────────────────────────────────
const NewsUpdatesFeed = () => {
  const updates = [
    {
      version: 'v5.0.0',
      date: 'May 2026',
      title: 'Neural Core AI & Live Audio Alerts',
      badge: 'Major Update',
      desc: 'Our biggest release yet introduces continuous SHA-256 blockchain auditing, an automated audio alarm triggered on integrity breach, and custom neural telemetry grids.',
      highlights: ['Automated audio breach alerts', 'Forensic block check engine', 'Live sensor telemetry streams']
    },
    {
      version: 'v4.2.0',
      date: 'April 2026',
      title: 'Adaptive Multi-Theme Engine',
      badge: 'Feature Update',
      desc: 'Allows users to dynamically customize their dashboard visual layout. Remaps CSS tokens on the fly, providing 10 curated color themes and a typography selector.',
      highlights: ['10 color palettes (Ocean, Rose Gold, Toxic, etc.)', 'Full Dark / Light / System toggles', 'Dynamic Tailwind color mappings']
    },
    {
      version: 'v3.5.0',
      date: 'March 2026',
      title: 'Uplink Provisioning Terminal',
      badge: 'Hardware Release',
      desc: 'Integrated automated device discovery. ESP32 microcontrollers can now pair directly with the server via local WiFi configuration in the Uplink Terminal.',
      highlights: ['WiFi credential pairing', 'Bluetooth LE discovery tests', 'Live simulation fallback mode']
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-5">
        {updates.map((up, idx) => (
          <div key={idx} className="glass-card rounded-2xl p-5 border border-stone-200 dark:border-white/5 hover:border-[var(--th-primary)]/20 transition-all duration-300 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 translate-x-4 -translate-y-4 w-20 h-20 bg-[var(--th-primary)]/5 rounded-full blur-xl pointer-events-none" />
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-[var(--th-glow)] text-[var(--th-primary)] border border-[var(--th-primary)]/10">
                  {up.version}
                </span>
                <span className="text-[10px] text-stone-400 font-mono">{up.date}</span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-stone-800 dark:text-stone-100" style={{ fontFamily: 'Space Grotesk' }}>
                  {up.title}
                </h4>
                <p className="text-[9px] font-bold uppercase tracking-wider text-rose-500/80 mt-0.5">{up.badge}</p>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                {up.desc}
              </p>
            </div>

            <ul className="space-y-1 mt-4 pt-3 border-t border-stone-100 dark:border-white/5">
              {up.highlights.map((h, i) => (
                <li key={i} className="flex items-center gap-1.5 text-[10px] text-stone-400">
                  <CheckCircle size={10} className="shrink-0" style={{ color: 'var(--th-primary)' }} />
                  {h}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Main About Component ───────────────────────────────────────────────────
const About = () => {
  const navigate = useNavigate();
  const p  = 'var(--th-primary)';
  const pd = 'var(--th-primary-dark)';
  const g  = 'var(--th-glow)';

  return (
    <div className="page-wrapper space-y-0 custom-scrollbar relative">

      {/* ── HERO ── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-16 relative overflow-hidden"
      >
        <HeroMesh />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border mb-5 text-[10px] font-bold uppercase tracking-widest"
            style={{ borderColor: 'color-mix(in srgb, var(--th-primary) 25%, transparent)', background: g, color: p }}>
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: 'var(--th-primary)' }} />
            Platform Documentation · v5.0
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4" style={{ fontFamily: 'Space Grotesk' }}>
            SenseChain<br />
            <span style={{ color: p }}>Neural Infrastructure</span>
          </h1>
          <p className="max-w-2xl mx-auto text-sm text-stone-500 dark:text-stone-400 leading-relaxed mb-8">
            A tamper-proof IoT blockchain platform that seals real-time sensor telemetry into an immutable SHA-256 ledger,
            monitored continuously by an AI security engine.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {['SHA-256 PoW', 'Real-time WebSocket', 'AI Monitoring', 'ESP32 Compatible', 'MongoDB Backend'].map(t => (
              <span key={t} className="px-3 py-1 rounded-full text-[10px] font-bold border border-stone-200 dark:border-white/10 text-stone-500 dark:text-stone-400 bg-white/40 dark:bg-white/2">
                {t}
              </span>
            ))}
          </div>

          <div className="max-w-2xl mx-auto mt-10 text-left">
            <WelcomeGuide
              mascot="villager"
              title="THE VILLAGER EXPLAINS:"
              text="Welcome, Chief! Think of our sensor nodes as Elixir Collectors. They gather raw drop measurements (temp/humidity) from the air and pipe them directly to our village shop!"
            />
          </div>
        </div>
      </motion.div>

      <Divider />

      {/* ── HOW IT WORKS (Interactive visualizer) ── */}
      <Fade className="space-y-8">
        <div>
          <Label text="Architecture" />
          <Heading>How SenseChain Works</Heading>
          <p className="text-sm text-stone-500 dark:text-stone-400 max-w-xl mb-4">
            Our data pipeline transforms raw IoT telemetry into a cryptographically sealed, AI-validated ledger index. Hover over any stage below to inspect the details.
          </p>
          <WelcomeGuide
            mascot="bheem"
            title="CHHOTA BHEEM EXPLAINS:"
            text="Bheem here! Let's see how our laddu power... oops, sensor telemetry gets mined and linked into blocks!"
          />
        </div>

        <InteractivePipeline />
      </Fade>

      <Divider />

      {/* ── GETTING STARTED GUIDE (Interactive Stepper) ── */}
      <Fade className="space-y-8">
        <div>
          <Label text="Getting Started" />
          <Heading>New to SenseChain?</Heading>
          <p className="text-sm text-stone-500 dark:text-stone-400 max-w-xl mb-4">
            Step through this guide and play with the simulators on the right to understand platform features in under 5 minutes.
          </p>
          <WelcomeGuide
            mascot="wizard"
            title="THE APPRENTICE WIZARD EXPLAINS:"
            text="Greetings, Apprentice! Follow these 5 steps to master the SenseChain portals. I will guide your journey."
          />
        </div>

        <OnboardingStepper navigate={navigate} />
      </Fade>

      <Divider />

      {/* ── LATEST NEWS & SYSTEM UPDATES ── */}
      <Fade className="space-y-8">
        <div>
          <Label text="Latest News" />
          <Heading>What's New in SenseChain</Heading>
          <p className="text-sm text-stone-500 dark:text-stone-400 max-w-xl mb-4">
            Stay up to date with the latest features, releases, and platform updates.
          </p>
          <WelcomeGuide
            mascot="robot"
            title="THE NEURAL BOT (NEWS REPORTER) EXPLAINS:"
            text="Beep boop! Broadcasting the latest v5.0 upgrades and engineering roadmaps directly to your visor!"
          />
        </div>

        <NewsUpdatesFeed />
      </Fade>

      <Divider />

      {/* ── PLATFORM INTRODUCTION (Pillars) ── */}
      <Fade className="space-y-8">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <Label text="What is SenseChain" />
            <Heading>An Industrial-Grade IoT Blockchain Platform</Heading>
            <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed mb-5">
              SenseChain is a full-stack, production-grade platform that bridges physical IoT hardware with
              cryptographic immutability. It was designed for environments where data authenticity is
              mission-critical — from industrial sensor networks to cold-chain pharmaceutical monitoring.
            </p>
            <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed mb-6">
              At its core, SenseChain runs a custom SHA-256 Proof-of-Work miner on the backend.
              Every telemetry packet received from a paired ESP32 node is sealed into a block
              with a cryptographic nonce, then linked to the preceding block's hash — creating an
              append-only ledger that cannot be silently altered. Any tampering is detected within
              milliseconds and surfaced across every dashboard simultaneously.
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                'Tamper-evident by design',
                'Real-time WebSocket sync',
                'AI-powered breach detection',
                'Multi-theme adaptive UI',
                'Role-based access control',
                'ESP32 hardware compatible',
              ].map(t => (
                <span key={t} className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border border-stone-200 dark:border-white/8 text-stone-500 dark:text-stone-400 bg-white/40 dark:bg-white/2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--th-primary)' }} />
                  {t}
                </span>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'SHA-256 PoW', value: '100%', sub: 'Tamper-proof ledger', icon: <Lock size={16} /> },
              { label: 'Detection SLA', value: '< 1s', sub: 'Breach alert latency', icon: <ShieldCheck size={16} /> },
              { label: 'Data Points', value: '24/7', sub: 'Continuous streaming', icon: <Activity size={16} /> },
              { label: 'Theme System', value: '10+', sub: 'Color palettes live', icon: <Palette size={16} /> },
              { label: 'AI Queries', value: 'Unlimited', sub: 'Sense Brain sessions', icon: <Brain size={16} /> },
              { label: 'Node Support', value: 'Multi', sub: 'WiFi + Bluetooth', icon: <Wifi size={16} /> },
            ].map((s, i) => (
              <motion.div 
                key={i} 
                whileHover={{ y: -4, scale: 1.02 }}
                className="glass-card rounded-2xl p-4 border border-stone-200 dark:border-white/5 hover:border-[var(--th-primary)]/30 transition-all duration-300"
              >
                <div className="p-1.5 rounded-lg inline-flex mb-3" style={{ background: 'var(--th-glow)', color: 'var(--th-primary)' }}>{s.icon}</div>
                <p className="text-xl font-bold font-mono" style={{ color: 'var(--th-primary)' }}>{s.value}</p>
                <p className="text-[10px] font-bold text-stone-600 dark:text-stone-300 mt-0.5">{s.label}</p>
                <p className="text-[9px] text-stone-400 mt-0.5">{s.sub}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Fade>

      <Divider />

      {/* ── INTERACTIVE TECH STACK LAYERS ── */}
      <Fade className="space-y-8">
        <div>
          <Label text="Technology Stack" />
          <Heading>What Powers SenseChain</Heading>
          <p className="text-sm text-stone-500 dark:text-stone-400 max-w-xl mb-4">
            Select any structural layer in the 3D visual stack below to view its specific modules, frameworks, and deployment details.
          </p>
          <WelcomeGuide
            mascot="mechanic"
            title="THE CYBER MECHANIC EXPLAINS:"
            text="Hey engineer! Let's lift the hood and inspect the mechanical layers powering the SenseChain engine!"
          />
        </div>

        <TechStackLayers />
      </Fade>

      <Divider />

      {/* ── ALL PAGES REFERENCE ── */}
      <Fade className="space-y-8">
        <div>
          <Label text="Platform Pages" />
          <Heading>Every Page, Explained</Heading>
          <p className="text-sm text-stone-500 dark:text-stone-400 max-w-xl mb-4">
            Click any portal card to navigate directly to that page of the SenseChain interface.
          </p>
          <WelcomeGuide
            mascot="explorer"
            title="THE CARTOGRAPHER (EXPLORER) EXPLAINS:"
            text="Ahoy! Here is your map to navigate every portal and control room in the SenseChain kingdom!"
          />
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <PageCard navigate={navigate} icon={<LayoutDashboard size={16} />} title="Dashboard" path="/"
            desc="Mission control for the entire SenseChain platform. Displays live telemetry, blockchain ledger, AI analysis, connected node cards, and the thermal heatmap."
            steps={['View all mined blocks in the Verified Ledger table', 'Monitor temperature & humidity streams on the chart', 'Click a stat card to get more details', 'Repair chain from the breach banner when an alert fires']} />
          <PageCard navigate={navigate} icon={<Terminal size={16} />} title="Uplink Terminal" path="/provisioning"
            desc="Pair and manage IoT hardware nodes. Supports WiFi (SSID/password) and Bluetooth device discovery. Manages node lifecycle from handshake to live mining."
            steps={['Enter WiFi credentials and click Pair Node', 'Watch the node status cycle: Connecting → Handshaking → Live', 'Simulate sensor data if no physical hardware is available', 'Remove nodes or force-reconnect from the node card']} />
          <PageCard navigate={navigate} icon={<BarChart2 size={16} />} title="Analytics" path="/analytics"
            desc="Deep-dive into per-block nonce distributions, thermal and humidity streams, node performance tables, and the full Block Broadcast Log."
            steps={['Bar chart: nonce iterations per mined block (last 15)', 'Area chart: live temperature and humidity over time', 'Node performance table: blocks mined, avg temp, signal, battery', 'Block log: every broadcast event with confirmation status']} />
          <PageCard navigate={navigate} icon={<Shield size={16} />} title="Security Terminal" path="/security"
            desc="Forensic integrity monitoring hub. Validates every SHA-256 hash link, shows per-block status, and lets you inject/repair virtual blockchain attacks."
            steps={['Green rows = verified; red rows = corrupted', 'Inject Virtual Breach to simulate a cryptographic attack', 'Repair Chain restores hash links and clears the alert', 'Breach events show the exact corrupted block index']} />
          <PageCard navigate={navigate} icon={<Settings size={16} />} title="Node Settings" path="/node-settings"
            desc="Configure the consensus engine. Adjust Proof-of-Work difficulty (1–6 leading zeros), view node hardware summary, and reset the blockchain ledger."
            steps={['Slider controls difficulty: 1–2 fast, 3–4 balanced, 5–6 heavy', 'Save commits the config to localStorage and backend', 'Registered Hardware lists all paired nodes with telemetry', 'Reset Ledger permanently purges all on-chain blocks']} />
          <PageCard navigate={navigate} icon={<Palette size={16} />} title="UI Settings" path="/ui-settings"
            desc="Customize the visual experience. Switch between 10 curated color themes, toggle dark/light mode, change interface font, and adjust layout density."
            steps={['10 themes: Red×Black, Ocean Blue, Forest Dark, Purple Noir…', 'Dark/Light/System display mode toggle', 'Font options: Inter, Space Grotesk, DM Sans, JetBrains Mono', 'Live preview updates instantly as you change settings']} />
          <PageCard navigate={navigate} icon={<MessageSquare size={16} />} title="AI Assistant" path="/"
            desc="The Sense Brain AI panel (bottom-right). Ask blockchain questions, search the web for real-time data, or get explanations of any platform metric."
            steps={['Click the brain icon in the bottom-right corner', 'Type any question about your blockchain or IoT data', 'Use the Globe button for real-time Google deep search', 'Conversation history is preserved per session']} />
          <PageCard navigate={navigate} icon={<Info size={16} />} title="About" path="/about"
            desc="This page. Platform documentation, getting-started guide, architecture overview, page reference, and contact information."
            steps={['Architecture: 4-step block lifecycle', 'Getting Started: step-by-step onboarding guide', 'Platform Pages: every section documented', 'Roadmap: upcoming features and timelines']} />
        </div>
      </Fade>

      <Divider />

      {/* ── ROADMAP vs DEVELOPMENT STATUS ── */}
      <Fade className="space-y-8">
        <div>
          <Label text="Development Status" />
          <Heading>Ongoing &amp; Upcoming Roadmap</Heading>
          <p className="text-sm text-stone-500 dark:text-stone-400 max-w-xl">
            Features currently in active engineering vs. planned milestones on the product roadmap.
          </p>
        </div>
        <div className="grid lg:grid-cols-2 gap-6">

          {/* ONGOING */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Ongoing — In Active Development</span>
            </div>
            {[
              { title: 'Multi-node P2P Consensus', prog: 40, desc: 'Distributed hash agreement across geographically separated nodes. Fork detection and resolution algorithm being tested.' },
              { title: 'Predictive AI Anomaly Engine', prog: 25, desc: 'LSTM model training on sensor time-series data to forecast hardware failures 48 hours before they occur.' },
              { title: 'Forensic PDF Export', prog: 60, desc: 'Government-grade audit reports with per-block SHA-256 signatures, classification headers, and chain-of-custody certificates.' },
              { title: 'Advanced Theme Engine v2', prog: 75, desc: 'Custom color picker, gradient builder, and per-component opacity tuning on top of the existing 10-palette system.' },
              { title: 'WebSocket Cluster Scaling', prog: 30, desc: 'Horizontal scaling support for the FastAPI WebSocket server using Redis pub/sub for multi-process fan-out.' },
            ].map((item, i) => (
              <div key={i} className="glass-card rounded-xl p-4 border border-stone-200 dark:border-white/5">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-semibold text-xs">{item.title}</p>
                  <span className="text-[10px] font-bold text-emerald-500">{item.prog}%</span>
                </div>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 mb-2 leading-relaxed">{item.desc}</p>
                <div className="h-1 rounded-full bg-stone-100 dark:bg-white/6 overflow-hidden">
                  <motion.div className="h-full rounded-full bg-emerald-500"
                    initial={{ width: 0 }} whileInView={{ width: `${item.prog}%` }}
                    viewport={{ once: true }} transition={{ duration: 0.8, delay: i * 0.1 }} />
                </div>
              </div>
            ))}
          </div>

          {/* UPCOMING */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--th-primary)' }} />
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--th-primary)' }}>Upcoming — Planned Roadmap</span>
            </div>
            {[
              { q: 'Q3 2026', title: 'Mobile App — iOS & Android', desc: 'Native mobile experience with biometric authentication, push breach notifications, and offline block browsing.' },
              { q: 'Q3 2026', title: 'Sense Brain v12 — Voice Mode', desc: 'Full voice input and spoken responses in the AI assistant. Trigger deep searches and blockchain queries hands-free.' },
              { q: 'Q4 2026', title: 'OTA Firmware Manager', desc: 'Push firmware updates to ESP32 nodes directly from the Uplink Terminal. Staged rollouts with rollback support.' },
              { q: 'Q4 2026', title: 'Public REST API & Webhooks', desc: 'Developer-facing API gateway with API keys, rate limiting, webhook subscriptions for breach and block events.' },
              { q: 'Q1 2027', title: 'Enterprise SSO & Audit Logs', desc: 'SAML/OIDC single sign-on for enterprise deployments, with immutable operator audit trails stored on-chain.' },
            ].map((item, i) => (
              <div key={i} className="glass-card rounded-xl p-4 flex items-start gap-4 border border-stone-200 dark:border-white/5">
                <span className="text-[9px] font-bold uppercase tracking-widest shrink-0 mt-0.5 w-14"
                  style={{ color: 'var(--th-primary)' }}>{item.q}</span>
                <div className="flex-1">
                  <p className="font-semibold text-xs mb-1">{item.title}</p>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">{item.desc}</p>
                </div>
                <Rocket size={13} className="shrink-0 mt-0.5 text-stone-300 dark:text-stone-600" />
              </div>
            ))}
          </div>
        </div>
      </Fade>

      <Divider />

      {/* ── CONTACT CTA ── */}
      <Fade>
        <div className="glass-card rounded-[28px] p-10 md:p-14 text-center relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-15"
              style={{ backgroundColor: 'var(--th-primary)' }} />
            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full blur-3xl opacity-10"
              style={{ backgroundColor: 'var(--th-primary)' }} />
          </div>
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-2xl mx-auto mb-5 flex items-center justify-center"
              style={{ background: g, color: p }}>
              <MessageSquare size={20} />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-2" style={{ fontFamily: 'Space Grotesk' }}>
              Questions or Enterprise Support?
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400 mb-7 max-w-md mx-auto leading-relaxed">
              Technical questions, partnership inquiries, or integration support — our engineering team responds within 12 hours.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.a whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                href="mailto:thakurshaktisingh195@gmail.com"
                className="flex items-center gap-2 px-7 py-3 rounded-2xl text-sm font-bold text-white transition-all cursor-pointer"
                style={{ background: `linear-gradient(135deg, ${p}, ${pd})`, boxShadow: `0 4px 20px var(--th-glow)` }}>
                Send Direct Mail
                <ArrowRight size={14} />
              </motion.a>
              <div className="text-center sm:text-left">
                <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Response SLA</div>
                <div className="text-sm font-bold text-stone-800 dark:text-stone-200">Under 12 Hours</div>
              </div>
            </div>
          </div>
        </div>
      </Fade>

      <p className="text-center text-[10px] text-stone-400 dark:text-stone-700 pt-8 pb-4 uppercase tracking-widest">
        SenseChain Neural Infrastructure Division · 2026 · All Rights Reserved
      </p>
    </div>
  );
};

export default About;