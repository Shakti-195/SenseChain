import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Cpu, ShieldCheck, Activity, Zap, Globe, Brain,
  Wifi, Terminal, Lock, Database, Server, Layers,
  Radio, CheckCircle, ArrowRight, Network, Code2,
  BookOpen, Map, LayoutDashboard, BarChart2, Settings,
  Shield, Link, Signal, Palette, MessageSquare,
  ChevronRight, Info, TrendingUp, AlertTriangle,
  Star, Sparkles, Clock, Rocket, CheckSquare, Cpu as CpuIcon,
  Eye, Search, SlidersHorizontal, Moon, Volume2,
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

// ── Main ───────────────────────────────────────────────────────────────────
const About = () => {
  const navigate = useNavigate();
  const p  = 'var(--th-primary)';
  const pd = 'var(--th-primary-dark)';
  const g  = 'var(--th-glow)';

  return (
    <div className="page-wrapper space-y-0 custom-scrollbar">

      {/* ── HERO ── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12 relative overflow-hidden"
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-48 rounded-full blur-3xl opacity-20"
            style={{ backgroundColor: 'var(--th-primary)' }} />
        </div>
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
              <span key={t} className="px-3 py-1 rounded-full text-[10px] font-bold border border-stone-200 dark:border-white/10 text-stone-500 dark:text-stone-400">
                {t}
              </span>
            ))}
          </div>
        </div>
      </motion.div>

      <Divider />

      {/* ── HOW IT WORKS ── */}
      <Fade className="space-y-8">
        <div>
          <Label text="Architecture" />
          <Heading>How SenseChain Works</Heading>
          <p className="text-sm text-stone-500 dark:text-stone-400 max-w-xl">
            Four deterministic stages transform raw IoT sensor data into a cryptographically sealed, verifiable blockchain record.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-4 relative">
          {/* connector */}
          <div className="absolute top-10 left-[12%] right-[12%] h-px hidden md:block"
            style={{ background: `linear-gradient(90deg, transparent, ${p}, transparent)`, opacity: 0.25 }} />
          {[
            { n: '01', icon: <Radio size={18} />, title: 'Sensor Capture', desc: 'IoT hardware (ESP32/WiFi/BT) streams temperature, humidity, and device telemetry in real time via WebSocket.' },
            { n: '02', icon: <Code2 size={18} />, title: 'Block Mining', desc: 'Each data packet is sealed with Proof-of-Work: the server finds a nonce such that SHA-256(data+nonce) starts with the required zeros.' },
            { n: '03', icon: <Lock size={18} />, title: 'Chain Linking', desc: 'Every new block stores the previous block\'s hash, making retroactive tampering cryptographically detectable.' },
            { n: '04', icon: <ShieldCheck size={18} />, title: 'AI Verification', desc: 'The security engine re-validates every hash link continuously and triggers a breach alert on any mismatch.' },
          ].map((item, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.12 }}
              className="glass-card rounded-2xl p-5 flex flex-col items-center text-center relative">
              <div className="absolute -top-3 -right-3 w-6 h-6 rounded-full text-white text-[9px] font-black flex items-center justify-center"
                style={{ backgroundColor: p }}>{item.n}</div>
              <div className="p-3 rounded-xl mb-4" style={{ background: g, color: p }}>{item.icon}</div>
              <p className="font-bold text-sm mb-2" style={{ fontFamily: 'Space Grotesk' }}>{item.title}</p>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </Fade>

      <Divider />

      {/* ── GETTING STARTED GUIDE ── */}
      <Fade className="space-y-8">
        <div>
          <Label text="Getting Started" />
          <Heading>New to SenseChain?</Heading>
          <p className="text-sm text-stone-500 dark:text-stone-400 max-w-xl">
            Follow this step-by-step guide to go from first login to a fully live blockchain simulation in under 5 minutes.
          </p>
        </div>

        <div className="space-y-3">
          {[
            {
              step: 1, title: 'Create Your Account',
              desc: 'Navigate to the Login page and register. Role-based access control is enforced — admin accounts have full node management rights.',
              action: 'Go to Login', path: '/login',
              detail: 'After registering, check your email for an OTP verification code. Enter it on the verification screen to activate your account.',
            },
            {
              step: 2, title: 'Pair Your First Node',
              desc: 'Go to the Uplink Terminal. Enter your device\'s WiFi SSID/password or pair via Bluetooth. The platform auto-discovers ESP32 hardware.',
              action: 'Uplink Terminal', path: '/provisioning',
              detail: 'Once paired, your node appears in the Registered Hardware list. It will start streaming telemetry and the simulation engine activates.',
            },
            {
              step: 3, title: 'Watch Blocks Mine Live',
              desc: 'The Dashboard streams incoming sensor data in real time. Each data packet is automatically mined into a block using SHA-256 Proof-of-Work.',
              action: 'Dashboard', path: '/',
              detail: 'You can see the nonce count, block hash, temperature, and humidity update with every new block. The ledger table fills from the bottom up.',
            },
            {
              step: 4, title: 'Test Breach Detection',
              desc: 'On the Security Terminal, inject a virtual attack to see how the system responds — chain breaks, all blocks highlight red, and the AI raises an alert.',
              action: 'Security', path: '/security',
              detail: 'Click "Inject Virtual Breach" to corrupt a block. Watch the Dashboard turn red. Use "Repair Chain" to restore integrity and clear the alert.',
            },
            {
              step: 5, title: 'Explore Analytics & Settings',
              desc: 'Review per-node performance, nonce distributions, and thermal streams on the Analytics page. Adjust mining difficulty in Node Settings.',
              action: 'Analytics', path: '/analytics',
              detail: 'Higher difficulty (5–6 zeros) means more compute per block but stronger tamper resistance. Lower difficulty (1–2 zeros) mines faster.',
            },
          ].map((item, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              className="glass-card rounded-2xl p-5">
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-black shrink-0"
                  style={{ backgroundColor: p }}>
                  {item.step}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-4 mb-1">
                    <p className="font-bold text-sm" style={{ fontFamily: 'Space Grotesk' }}>{item.title}</p>
                    <button onClick={() => navigate(item.path)}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-bold text-white shrink-0 transition-all hover:opacity-80"
                      style={{ backgroundColor: p }}>
                      {item.action} <ArrowRight size={10} />
                    </button>
                  </div>
                  <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed mb-2">{item.desc}</p>
                  <div className="p-3 rounded-xl text-xs text-stone-500 dark:text-stone-400 leading-relaxed border border-stone-100 dark:border-white/5 bg-stone-50 dark:bg-white/2">
                    <Info size={11} className="inline mr-1.5 mb-0.5" style={{ color: p }} />
                    {item.detail}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Fade>

      <Divider />

      {/* ── ALL PAGES REFERENCE ── */}
      <Fade className="space-y-8">
        <div>
          <Label text="Platform Pages" />
          <Heading>Every Page, Explained</Heading>
          <p className="text-sm text-stone-500 dark:text-stone-400 max-w-xl">
            Click any card to navigate directly to that section of the platform.
          </p>
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

      {/* ── PLATFORM INTRODUCTION ── */}
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
                <span key={t} className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border border-stone-200 dark:border-white/8 text-stone-500 dark:text-stone-400">
                  <div className="w-1 h-1 rounded-full" style={{ backgroundColor: 'var(--th-primary)' }} />
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
              <div key={i} className="glass-card rounded-2xl p-4">
                <div className="p-1.5 rounded-lg inline-flex mb-3" style={{ background: 'var(--th-glow)', color: 'var(--th-primary)' }}>{s.icon}</div>
                <p className="text-xl font-bold font-mono" style={{ color: 'var(--th-primary)' }}>{s.value}</p>
                <p className="text-[10px] font-bold text-stone-600 dark:text-stone-300 mt-0.5">{s.label}</p>
                <p className="text-[9px] text-stone-400 mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </Fade>

      <Divider />

      {/* ── LIVE FEATURES ── */}
      <Fade className="space-y-8">
        <div>
          <Label text="Shipped Features" />
          <Heading>What's Live Right Now</Heading>
          <p className="text-sm text-stone-500 dark:text-stone-400 max-w-2xl">
            Every feature below is fully operational in the current production build.
            No placeholders, no coming-soon gating — these are live, tested capabilities.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              icon: <Brain size={18} />,
              title: 'Sense Brain AI Assistant',
              badge: 'AI · v11',
              desc: 'An integrated LLM-powered chat panel accessible from any page. Supports natural-language blockchain queries, on-platform metric explanations, and real-time Google deep search via a dedicated Globe button.',
              points: ['Natural language Q&A about your blockchain', 'Google Deep Search for live internet data', 'Persistent conversation history per session', 'Voice-ready architecture (roadmap)'],
            },
            {
              icon: <Palette size={18} />,
              title: 'Multi-Theme Design System',
              badge: 'UI · 10 Themes',
              desc: 'A fully dynamic theme engine that remaps every CSS variable on the fly — including Tailwind color ramps. Every component, icon, chart, and badge updates instantly with zero page reload.',
              points: ['10 curated palettes: Red×Black, Ocean Blue, Forest Dark, Purple Noir, Amber×Steel, Minimal Mono, Neon Cyan, Rose Gold, Toxic Lime, Arctic Steel', 'Dark / Light / System mode support', 'Font selector: Inter, Space Grotesk, DM Sans, JetBrains Mono', 'Layout density: Compact / Normal / Relaxed'],
            },
            {
              icon: <ShieldCheck size={18} />,
              title: 'Forensic Security Terminal',
              badge: 'Security',
              desc: 'A full-featured cryptographic audit console that validates every SHA-256 hash link in the chain. Supports virtual breach injection for security testing and one-click chain repair.',
              points: ['Per-block hash validation with visual status', 'Virtual breach injection at any block index', 'Repair Chain restores all hash links instantly', 'Breach cascades across Dashboard, Analytics, NodeSettings'],
            },
            {
              icon: <Terminal size={18} />,
              title: 'Uplink Terminal & Node Pairing',
              badge: 'Hardware',
              desc: 'Manages the full lifecycle of IoT hardware nodes — from initial handshake to live block mining. Supports both WiFi credential pairing and Bluetooth device discovery.',
              points: ['WiFi SSID/password pairing for ESP32 devices', 'Bluetooth auto-discovery mode', 'Simulation engine for hardware-free demo', 'Per-node telemetry: temp, humidity, battery, RSSI'],
            },
            {
              icon: <BarChart2 size={18} />,
              title: 'Live Analytics Engine',
              badge: 'Analytics',
              desc: 'Real-time charting of nonce distributions, thermal streams, and humidity trends. Per-node performance leaderboard and a full chronological block broadcast log.',
              points: ['Nonce distribution bar chart (last 15 blocks)', 'Temperature + humidity area chart per block', 'Node performance table with 7 telemetry columns', 'Block broadcast log with cryptographic confirmation'],
            },
            {
              icon: <Database size={18} />,
              title: 'SHA-256 Proof-of-Work Ledger',
              badge: 'Blockchain',
              desc: 'A custom-built Python PoW miner that seals each sensor reading into a block by finding a nonce satisfying the configured difficulty target. Configurable from 1 to 6 leading zeros.',
              points: ['Difficulty 1–6 configurable from Node Settings', 'Each block stores: index, data, nonce, hash, prevHash, timestamp', 'MongoDB Atlas persistence for on-chain blocks', 'Hash re-validation on every chain read'],
            },
            {
              icon: <Eye size={18} />,
              title: 'Dashboard Command Center',
              badge: 'Monitoring',
              desc: 'The main hub showing live telemetry, blockchain ledger, AI inference panel, heatmap, and connected node cards — all updating via WebSocket without polling.',
              points: ['4 live stat cards with click-to-detail modals', 'Thermal heatmap: last 50 temperature readings', 'Telemetry area chart with breach corruption overlay', 'Full ledger table with hash copy and search'],
            },
            {
              icon: <Lock size={18} />,
              title: 'JWT Authentication System',
              badge: 'Auth',
              desc: 'Secure JWT-based authentication with on-screen OTP verification. Full account lifecycle: signup, login, OTP verify, forgot password, and password reset — all within a consistent design system.',
              points: ['Email + OTP two-step signup verification', 'JWT access token management', 'Forgot password + 3-step OTP reset flow', 'Persistent session via AuthContext'],
            },
            {
              icon: <Volume2 size={18} />,
              title: 'Adaptive Sound Engine',
              badge: 'UX',
              desc: 'A Web Audio API sound manager that plays context-aware tones on platform lifecycle events — block confirmation, breach alert, node pairing, and save confirmation.',
              points: ['Breach alert: urgent multi-tone pattern', 'Block confirmed: soft synthetic chime', 'Node paired: upward sweep tone', 'Global on/off toggle in UI Settings'],
            },
          ].map((f, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.06 }}
              whileHover={{ y: -3 }}
              className="glass-card rounded-2xl p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className="p-2.5 rounded-xl" style={{ background: 'var(--th-glow)', color: 'var(--th-primary)' }}>{f.icon}</div>
                <span className="text-[9px] font-black px-2.5 py-1 rounded-full border uppercase tracking-widest"
                  style={{ background: 'var(--th-glow)', color: 'var(--th-primary)', borderColor: 'color-mix(in srgb, var(--th-primary) 20%, transparent)' }}>
                  {f.badge}
                </span>
              </div>
              <div>
                <p className="font-bold text-sm mb-1" style={{ fontFamily: 'Space Grotesk' }}>{f.title}</p>
                <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">{f.desc}</p>
              </div>
              <ul className="space-y-1 border-t border-stone-100 dark:border-white/5 pt-3 mt-auto">
                {f.points.map((pt, j) => (
                  <li key={j} className="flex items-start gap-1.5 text-[10px] text-stone-400">
                    <CheckCircle size={10} className="mt-0.5 shrink-0" style={{ color: 'var(--th-primary)' }} />
                    {pt}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </Fade>

      <Divider />

      {/* ── ONGOING vs UPCOMING ── */}
      <Fade className="space-y-8">
        <div>
          <Label text="Development Status" />
          <Heading>Ongoing &amp; Upcoming</Heading>
          <p className="text-sm text-stone-500 dark:text-stone-400 max-w-xl">
            Features currently in active development vs. those on the product roadmap.
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
              <div key={i} className="glass-card rounded-xl p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-semibold text-sm">{item.title}</p>
                  <span className="text-[10px] font-bold text-emerald-500">{item.prog}%</span>
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400 mb-2">{item.desc}</p>
                <div className="h-1.5 rounded-full bg-stone-100 dark:bg-white/6 overflow-hidden">
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
              <div key={i} className="glass-card rounded-xl p-4 flex items-start gap-4">
                <span className="text-[9px] font-bold uppercase tracking-widest shrink-0 mt-0.5 w-14"
                  style={{ color: 'var(--th-primary)' }}>{item.q}</span>
                <div className="flex-1">
                  <p className="font-semibold text-sm mb-1">{item.title}</p>
                  <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">{item.desc}</p>
                </div>
                <Rocket size={13} className="shrink-0 mt-0.5 text-stone-300 dark:text-stone-600" />
              </div>
            ))}
          </div>
        </div>
      </Fade>

      <Divider />

      {/* ── CORE CAPABILITIES ── */}
      <Fade className="space-y-8">
        <div>
          <Label text="Core Technology" />
          <Heading>Built on Three Pillars</Heading>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { icon: <Database size={20} />, title: 'Blockchain Core', stat: '100%', statL: 'Tamper-proof',
              desc: 'SHA-256 Proof-of-Work ledger. Every sensor reading is cryptographically sealed and linked to the previous block\'s hash — retroactive alteration is impossible.' },
            { icon: <ShieldCheck size={20} />, title: 'Security Engine', stat: '< 1s', statL: 'Detection time',
              desc: 'Real-time hash verification detects unauthorized data modification in under a second. Breach events cascade to every page simultaneously.' },
            { icon: <Activity size={20} />, title: 'Live Monitoring', stat: '24 / 7', statL: 'Continuous',
              desc: 'WebSocket-powered dashboards with sub-second data sync. Temperature, humidity, battery, signal, and block rate tracked per node.' },
          ].map((c, i) => (
            <div key={i} className="glass-card rounded-2xl p-6">
              <div className="p-2.5 rounded-xl inline-flex mb-5" style={{ background: g, color: p }}>{c.icon}</div>
              <p className="font-bold text-base mb-2" style={{ fontFamily: 'Space Grotesk' }}>{c.title}</p>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed mb-5">{c.desc}</p>
              <div className="flex items-baseline gap-2 border-t border-stone-100 dark:border-white/5 pt-4">
                <span className="text-2xl font-bold" style={{ color: p, fontFamily: 'Space Grotesk' }}>{c.stat}</span>
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">{c.statL}</span>
              </div>
            </div>
          ))}
        </div>
      </Fade>

      <Divider />

      {/* ── TECH STACK ── */}
      <Fade className="space-y-6">
        <div>
          <Label text="Technology Stack" />
          <Heading>What Powers SenseChain</Heading>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { layer: 'Frontend', icon: <Layers size={16} />, items: ['React 18 + Vite', 'Tailwind CSS v4', 'Framer Motion', 'Recharts', 'Lucide Icons'] },
            { layer: 'Backend', icon: <Server size={16} />, items: ['Python FastAPI', 'WebSocket server', 'SHA-256 PoW miner', 'REST endpoints', 'Uvicorn ASGI'] },
            { layer: 'Database', icon: <Database size={16} />, items: ['MongoDB Atlas', 'Block document store', 'Node registry', 'Async motor driver'] },
            { layer: 'Hardware', icon: <Radio size={16} />, items: ['ESP32 WiFi/BT', 'DHT22 sensor', 'MQTT / WebSocket', 'Auto-discovery', 'OTA firmware'] },
          ].map((s, i) => (
            <div key={i} className="glass-card rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 rounded-lg" style={{ background: g, color: p }}>{s.icon}</div>
                <p className="font-bold text-sm" style={{ fontFamily: 'Space Grotesk' }}>{s.layer}</p>
              </div>
              <ul className="space-y-1.5">
                {s.items.map(item => (
                  <li key={item} className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
                    <div className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: p }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Fade>

      <Divider />

      {/* ── ROADMAP ── */}
      <Fade className="space-y-6">
        <div>
          <Label text="Roadmap" />
          <Heading>What's Coming Next</Heading>
        </div>
        <div className="space-y-3">
          {[
            { q: 'Q3 2026', title: 'Multi-node Distributed Blockchain', desc: 'P2P consensus across geographically distributed blockchain nodes with automatic fork resolution.', prog: 40 },
            { q: 'Q3 2026', title: 'Mobile App — iOS & Android', desc: 'Native mobile experience with biometric auth, push breach notifications, and remote node management.', prog: 20 },
            { q: 'Q4 2026', title: 'Predictive AI Anomaly Engine', desc: 'Neural network trained on sensor patterns to predict hardware failures 48 hours in advance.', prog: 10 },
            { q: 'Q1 2027', title: 'Public REST API & Developer SDK', desc: 'Webhook support and third-party integration library for enterprise deployments.', prog: 5 },
          ].map((item, i) => (
            <motion.div key={i} whileHover={{ x: 4 }} className="glass-card rounded-2xl p-5">
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-bold uppercase tracking-widest w-16 shrink-0" style={{ color: p }}>{item.q}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold text-sm">{item.title}</p>
                    <span className="text-[10px] font-bold text-stone-400">{item.prog}%</span>
                  </div>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mb-2">{item.desc}</p>
                  <div className="h-1 rounded-full bg-stone-100 dark:bg-white/6 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${item.prog}%`, background: `linear-gradient(90deg, ${p}, var(--th-accent, ${p}))` }} />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
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
                className="flex items-center gap-2 px-7 py-3 rounded-2xl text-sm font-bold text-white transition-all"
                style={{ background: `linear-gradient(135deg, ${p}, ${pd})`, boxShadow: `0 4px 20px var(--th-glow)` }}>
                Send Direct Mail
                <ArrowRight size={14} />
              </motion.a>
              <div className="text-center">
                <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Response SLA</div>
                <div className="text-sm font-bold">Under 12 Hours</div>
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