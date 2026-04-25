import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Activity, ShieldCheck, ShieldAlert, Search, Database, Globe, ChevronRight,
  Cpu, Sparkles, Thermometer, Droplets, Flame, Info, Copy, Check,
  Zap, Heart, AlertTriangle, Wifi, Bluetooth, Radio, Signal,
  Terminal, Lock, X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBreach } from '../context/BreachContext';

// ── TIMEZONE HELPERS ──
const LOCAL_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;

const fmtTime = (ts) => {
  if (!ts && ts !== 0) return '--:--:--';
  try {
    const ms = Number(ts) < 1e12 ? Number(ts) * 1000 : Number(ts);
    return new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false, timeZone: LOCAL_TZ,
    }).format(new Date(ms));
  } catch { return '--:--:--'; }
};

const fmtDate = (ts) => {
  if (!ts) return '';
  try {
    const ms = Number(ts) < 1e12 ? Number(ts) * 1000 : Number(ts);
    return new Intl.DateTimeFormat('en-GB', { month: 'short', day: 'numeric', timeZone: LOCAL_TZ }).format(new Date(ms));
  } catch { return ''; }
};

// ── SIGNAL STRENGTH BARS ──
const SignalBars = ({ rssi }) => {
  const dbm = parseInt(rssi) || -70;
  const strength = dbm > -50 ? 4 : dbm > -60 ? 3 : dbm > -70 ? 2 : 1;
  return (
    <div className="flex items-end gap-0.5 h-3">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className={`w-1 rounded-sm transition-all ${i <= strength ? 'bg-emerald-400' : 'bg-white/15'}`}
          style={{ height: `${i * 25}%` }} />
      ))}
    </div>
  );
};

// ── NODE STATUS BADGE ──
const NodeStatus = ({ status }) => {
  const cfg = {
    Connecting:  { color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20', dot: 'bg-yellow-400' },
    Handshaking: { color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',   dot: 'bg-amber-400 animate-pulse' },
    Syncing:     { color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',       dot: 'bg-blue-400 animate-pulse' },
    Live:        { color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', dot: 'bg-emerald-400 animate-pulse' },
  }[status] || { color: 'text-stone-400 bg-stone-500/10 border-stone-500/20', dot: 'bg-stone-400' };
  return (
    <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wide ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {status}
    </span>
  );
};

const Dashboard = ({
  chain = [],
  integrity = true,
  lastUpdated = '',
  connError = null,
  chainHeight = 0,
  refreshData = null,
}) => {
  const navigate = useNavigate();
  const {
    virtualBreach, breachedBlock,
    pairedNodes, virtualBlocks, nodeSimLogs,
    isSimulating, simBlockCount,
  } = useBreach();

  const [searchTerm, setSearchTerm]   = useState('');
  const [copiedHash, setCopiedHash]   = useState(null);
  const [activeModal, setActiveModal] = useState(null);

  const isBreached = !integrity || virtualBreach;

  // ── NORMALIZE REAL CHAIN ──
  const normalizedChain = useMemo(() => {
    if (!chain?.length) return [];
    const allZero = chain.every(b => b.index === 0);
    return allZero ? chain.map((b, i) => ({ ...b, index: i })) : chain;
  }, [chain]);

  // ── LEDGER: only show virtualBlocks from paired nodes (no static backend data) ──
  // When no nodes are paired, the ledger is empty (no phantom #0 block).
  const mergedChain = useMemo(() => virtualBlocks, [virtualBlocks]);

  // ── AI ANALYSIS ──
  const aiAnalysis = useMemo(() => {
    if (isBreached)
      return { status: 'Anomaly Detected', message: 'Emergency: Blockchain integrity compromise detected. Forensic lockdown active.', score: 30, anomalies: [{ type: 'CRITICAL', msg: 'Cryptographic Breach' }] };
    if (!mergedChain || mergedChain.length < 2)
      return { status: 'Initializing', message: isSimulating ? 'Neural nodes online. Gathering telemetry...' : 'Awaiting blockchain data...', score: 100, anomalies: [] };
    const parse = (b) => { let d = b?.data; if (typeof d === 'string') { try { d = JSON.parse(d); } catch { d = {}; } } return d || {}; };
    const lastBlocks = mergedChain.slice(-5);
    const latest   = parse(lastBlocks[lastBlocks.length - 1]);
    const previous = parse(lastBlocks[lastBlocks.length - 2]);
    let score = 100, anomalies = [], message = 'All systems operating within nominal parameters.';
    const tempChange = Math.abs((latest.temperature || 0) - (previous.temperature || 0));
    if (tempChange > (previous.temperature || 0) * 0.1) {
      anomalies.push({ type: 'WARNING', msg: 'Thermal Spike' }); score -= 15;
      message = 'Temperature fluctuation detected. Possible environmental anomaly.';
    }
    if (integrity && anomalies.length === 0)
      message = latest.temperature > previous.temperature
        ? `Blockchain growing. Upward thermal trend from ${pairedNodes.filter(n => n.status === 'Live').length} live node(s).`
        : 'Network pulse is stable. Data throughput optimized.';
    return { status: anomalies.length > 0 ? 'Anomaly Detected' : 'Stable', message, score: Math.max(score, 0), anomalies };
  }, [mergedChain, isBreached, integrity, isSimulating, pairedNodes]);

  // ── CHART DATA (last 30 virtual blocks only, no static fallback) ──
  const telemetryData = useMemo(() => {
    const src = virtualBlocks.filter(b => typeof b.index === 'number').slice(-30);
    if (src.length === 0) return [];
    const data = src.map(b => {
      let d = b.data;
      if (typeof d === 'string') { try { d = JSON.parse(d); } catch { d = {}; } }
      d = d || {};
      return {
        label: `#${b.index}`,
        temp: Number((d.temperature ?? b._temp ?? 22).toFixed(1)),
        humidity: Number((d.humidity ?? b._hum ?? 50).toFixed(1)),
        nodeId: b._nodeId || 'chain',
      };
    });
    if (data.length === 1) data.push({ ...data[0], label: `#${src[0].index + 1}` });
    return data;
  }, [mergedChain]);

  // ── BREACH: inject corrupted/erratic chart data ──
  // When breached, real values are replaced with random spikes to visualise data corruption
  const corruptedChartData = useMemo(() => {
    if (!isBreached) return telemetryData;
    const base = telemetryData.length > 0
      ? telemetryData
      : Array.from({ length: 18 }, (_, i) => ({ label: `#${i}`, temp: 22, humidity: 55, nodeId: 'chain' }));
    return base.map((pt, i) => ({
      ...pt,
      temp:     parseFloat((85 + Math.sin(i * 1.7) * 12 + Math.random() * 8).toFixed(1)),
      humidity: parseFloat((8  + Math.cos(i * 2.1) * 6  + Math.random() * 5).toFixed(1)),
    }));
  }, [isBreached, telemetryData]);

  // ── HEATMAP DATA (last 50 temp readings mapped to color cells) ──
  const heatmapCells = useMemo(() => {
    const blocks = mergedChain.slice(-50);
    return blocks.map(b => {
      let d = b.data;
      if (typeof d === 'string') { try { d = JSON.parse(d); } catch { d = {}; } }
      d = d || {};
      const temp = d.temperature ?? b._temp ?? 24;
      // Normalize 18–42°C to 0–1
      const norm = Math.max(0, Math.min(1, (temp - 18) / 24));
      return { temp, norm, nodeId: b._nodeId || 'chain', index: b.index };
    });
  }, [virtualBlocks]);

  // ── FILTERED LEDGER (only virtual blocks from paired nodes) ──
  const filteredChain = useMemo(() => {
    if (!virtualBlocks.length) return [];
    const s = searchTerm.toLowerCase();
    return virtualBlocks.filter(b =>
      String(b.index).includes(s) ||
      b.hash?.toLowerCase().includes(s) ||
      String(b.nonce || '').includes(s) ||
      fmtTime(b.timestamp).includes(s)
    );
  }, [virtualBlocks, searchTerm]);

  const handleCopy = useCallback((hash) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  }, []);

  const lastTemp = telemetryData[telemetryData.length - 1]?.temp ?? '--';
  const lastHum  = telemetryData[telemetryData.length - 1]?.humidity ?? '--';
  const liveNodes = pairedNodes.filter(n => n.status === 'Live');

  return (
    <div className="page-wrapper space-y-6 custom-scrollbar">

      {/* ── CRITICAL BREACH BANNER ── */}
      <AnimatePresence>
        {isBreached && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.98 }}
            className="flex items-center gap-4 px-6 py-4 rounded-2xl bg-red-600 text-white shadow-2xl shadow-red-600/40 border border-red-500 breach-glow"
          >
            <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 0.8 }}>
              <AlertTriangle size={22} fill="currentColor" />
            </motion.div>
            <div className="flex-1">
              <p className="font-bold text-sm tracking-wide">⚡ CRITICAL SECURITY ALERT — Blockchain Integrity Compromised</p>
              <p className="text-[11px] text-red-200 mt-0.5">
                {virtualBreach
                  ? `Virtual attack injected at Block #${breachedBlock ?? '?'}. SHA-256 hash chain severed. Navigate to Security Terminal to repair.`
                  : 'Real chain integrity breach detected. Navigate to Security Terminal to repair.'}
              </p>
            </div>
            {/* Navigate ONLY — no repair here */}
            <button
              onClick={() => navigate('/security')}
              className="shrink-0 px-4 py-2 bg-white/15 hover:bg-white/25 rounded-xl text-xs font-bold uppercase tracking-wide transition-all border border-white/20"
            >
              Security Terminal →
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── PAGE HEADER ── */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest chip-red">
              <Sparkles size={9} /> Live Terminal
            </span>
            {isSimulating && (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {liveNodes.length} Node{liveNodes.length !== 1 ? 's' : ''} Live
              </span>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight" style={{ fontFamily: 'Space Grotesk' }}>
            Network <span className="bg-gradient-to-r from-red-600 to-rose-500 bg-clip-text text-transparent">Overview</span>
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
            Real-time blockchain telemetry · <span className="font-mono text-xs text-red-400">{LOCAL_TZ}</span>
          </p>
        </div>
        {/* Connection status — show 'Simulation Mode' not 'Backend Offline' when no real HW */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border ${
          isSimulating
            ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400'
            : connError
            ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400'
            : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${
            isSimulating ? 'bg-emerald-500 animate-pulse' :
            connError ? 'bg-amber-500 animate-pulse' :
            'bg-emerald-500 animate-pulse'
          }`} />
          {isSimulating
            ? `Simulation Mode · ${liveNodes.length} node${liveNodes.length !== 1 ? 's' : ''} live`
            : connError
            ? 'Awaiting Backend'
            : 'Synchronized'
          }
        </div>
      </motion.div>

      {/* ── STAT CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Ledger Height"
          value={chainHeight + simBlockCount} suffix="blocks" icon={<Database size={17} />} color="theme"
          onClick={() => setActiveModal({ title: 'Ledger Height', val: chainHeight + simBlockCount, desc: 'Total depth of the current cryptographic blockchain including virtual simulation blocks.' })} />
        <StatCard title="Node Stability" value={`${aiAnalysis.score}%`} suffix="health" icon={<Heart size={17} />}
          color={isBreached ? 'danger' : 'theme'} pulse={aiAnalysis.score < 80 || isBreached}
          onClick={() => setActiveModal({ title: 'Node Stability', val: `${aiAnalysis.score}%`, desc: 'Based on cryptographic linkage consistency and data throughput.' })} />
        <StatCard
          title="Security Status"
          value={isBreached ? 'CRITICAL' : 'Secure'}
          suffix={isBreached ? '⚡ ALERT' : 'SHA-256 OK'}
          icon={isBreached ? <ShieldAlert size={17} /> : <ShieldCheck size={17} />}
          color={isBreached ? 'danger' : 'theme'}
          pulse={isBreached}
          onClick={() => isBreached ? navigate('/security') : setActiveModal({ title: 'Security', val: 'Secure', desc: 'Real-time SHA-256 hash linkage monitoring.' })}
        />
        <StatCard title="Active Nodes" value={liveNodes.length || '—'}
          suffix={liveNodes.length > 0 ? `${liveNodes.length} mining` : 'none paired'}
          icon={<Signal size={17} />} color="theme"
          onClick={() => setActiveModal({
            title: 'Active Nodes',
            val: liveNodes.length || 0,
            desc: liveNodes.length > 0
              ? `${liveNodes.length} hardware node${liveNodes.length !== 1 ? 's' : ''} currently live on the SenseChain mesh: ${liveNodes.map(n => n.id).join(', ')}.`
              : 'No hardware nodes are currently paired. Go to Uplink Terminal to pair a WiFi or Bluetooth device.'
          })} />
      </div>

      {/* ── CONNECTED HARDWARE NODES PANEL ── */}
      <motion.div className="glass-card rounded-[22px] p-6 md:p-8 relative overflow-hidden" whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-56 h-56 bg-emerald-500/4 dark:bg-emerald-500/6 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between gap-5 relative z-10 mb-5">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl transition-all duration-500 ${liveNodes.length > 0 ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-500/15 text-red-600 dark:text-red-400'}`}>
              <Terminal size={22} />
            </div>
            <div>
              <h3 className="text-base font-bold" style={{ fontFamily: 'Space Grotesk' }}>
                Connected Hardware Nodes
                {liveNodes.length > 0 && (
                  <span className="ml-2 text-[9px] font-bold text-emerald-500 bg-emerald-500/12 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-widest animate-pulse">
                    ● LIVE · {simBlockCount} blocks mined
                  </span>
                )}
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {pairedNodes.length === 0
                  ? 'No nodes paired · Go to Uplink Terminal to pair hardware'
                  : `${pairedNodes.length} node(s) · ${liveNodes.length} live · ${simBlockCount} virtual blocks generated`}
              </p>
            </div>
          </div>
          {pairedNodes.length === 0 && (
            <button onClick={() => navigate('/provisioning')}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-red-600/20 transition-all">
              <Signal size={14} /> Pair Nodes →
            </button>
          )}
        </div>

        {pairedNodes.length === 0 ? (
          <div className="py-10 text-center border-2 border-dashed border-stone-100 dark:border-white/5 rounded-2xl">
            <Wifi size={32} className="mx-auto mb-3 text-stone-300 dark:text-stone-700" />
            <p className="text-sm font-semibold text-stone-400">No hardware nodes connected</p>
            <p className="text-xs text-stone-400 mt-1">Pair IoT devices in the <button onClick={() => navigate('/provisioning')} className="text-red-500 underline">Uplink Terminal</button> to start live simulation</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pairedNodes.map(node => (
              <motion.div key={node.id} layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`rounded-2xl p-4 border transition-all duration-500 ${
                  isBreached
                    ? 'bg-red-50/50 dark:bg-red-900/15 border-red-200 dark:border-red-700/30'
                    : node.status === 'Live'
                    ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-700/30'
                    : 'bg-stone-50 dark:bg-white/3 border-stone-200 dark:border-white/5'
                }`}>
                {/* Node header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${node.type === 'WiFi' ? 'bg-blue-100 dark:bg-blue-500/10 text-blue-500' : 'bg-violet-100 dark:bg-violet-500/10 text-violet-500'}`}>
                      {node.type === 'WiFi' ? <Wifi size={12} /> : <Bluetooth size={12} />}
                    </div>
                    <p className="text-xs font-bold font-mono truncate max-w-[130px]">{node.id}</p>
                  </div>
                  <NodeStatus status={isBreached && node.status === 'Live' ? 'Live' : node.status} />
                </div>

                {/* Sensor readings */}
                {node.status === 'Live' && (
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-white/40 dark:bg-white/4 rounded-xl p-2 text-center">
                      <p className="text-[8px] text-stone-400 uppercase tracking-wide flex items-center justify-center gap-1">
                        <Thermometer size={8} /> Temp
                      </p>
                      <p className={`text-sm font-bold font-mono ${isBreached ? 'text-red-500' : 'text-red-600 dark:text-red-400'}`}>
                        {isBreached ? '99.9' : node.lastTemp?.toFixed(1)}°C
                      </p>
                    </div>
                    <div className="bg-white/40 dark:bg-white/4 rounded-xl p-2 text-center">
                      <p className="text-[8px] text-stone-400 uppercase tracking-wide flex items-center justify-center gap-1">
                        <Droplets size={8} /> Hum
                      </p>
                      <p className="text-sm font-bold font-mono text-sky-600 dark:text-sky-400">
                        {node.lastHum?.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                )}

                {/* Node meta */}
                <div className="flex items-center justify-between text-[9px] text-stone-400 font-mono">
                  <div className="flex items-center gap-1.5">
                    <SignalBars rssi={node.rssi} />
                    <span>{node.rssi}</span>
                  </div>
                  {node.status === 'Live' && (
                    <span className="text-emerald-500 font-bold">{node.blocksMined} blocks</span>
                  )}
                  {node.status !== 'Live' && (
                    <span className="text-yellow-500 animate-pulse">{node.status}...</span>
                  )}
                </div>

                {/* Mining animation bar */}
                {node.status === 'Live' && !isBreached && (
                  <div className="mt-2 w-full bg-white/5 rounded-full overflow-hidden h-0.5">
                    <motion.div
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ repeat: Infinity, duration: 1.8, ease: 'linear' }}
                      className="h-full w-1/2 bg-gradient-to-r from-transparent via-emerald-400 to-transparent"
                    />
                  </div>
                )}
                {isBreached && node.status === 'Live' && (
                  <div className="mt-2 w-full bg-red-500/20 rounded-full overflow-hidden h-0.5">
                    <motion.div
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ repeat: Infinity, duration: 0.6, ease: 'linear' }}
                      className="h-full w-1/2 bg-gradient-to-r from-transparent via-red-400 to-transparent"
                    />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* ── CHART + AI PANEL ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Telemetry Chart */}
        <div className={`lg:col-span-2 glass-card rounded-[22px] p-6 md:p-8 flex flex-col transition-all duration-700 ${
          isBreached ? 'border border-red-500/30 shadow-lg shadow-red-900/20' : ''
        }`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl transition-all duration-500 ${
                isBreached ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-red-100 dark:bg-red-500/12 text-red-600 dark:text-red-400'
              }`}>
                <Activity size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2" style={{ fontFamily: 'Space Grotesk' }}>
                  Telemetry Stream
                  {isBreached && (
                    <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 0.5 }}
                      className="text-[9px] font-black text-red-500 bg-red-500/10 border border-red-500/30 px-2 py-0.5 rounded-full uppercase tracking-widest">
                      ⚡ CORRUPTED
                    </motion.span>
                  )}
                </h3>
                <p className="text-[10px] text-stone-400">
                  {isBreached
                    ? 'SHA-256 hash chain severed · Data integrity compromised'
                    : liveNodes.length > 0
                    ? `${liveNodes.length} node${liveNodes.length !== 1 ? 's' : ''} broadcasting live · ${telemetryData.length} data points`
                    : 'Awaiting paired node data'
                  }
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <LegendDot color="rose" label={isBreached ? 'CORRUPT' : 'Temp'} value={isBreached ? '99.9°C' : `${lastTemp}°C`} breach={isBreached} />
              <LegendDot color="sky"  label={isBreached ? 'SIGNAL' : 'Humidity'} value={isBreached ? '0.0%' : `${lastHum}%`} />
            </div>
          </div>

          {/* Per-node legend chips */}
          {liveNodes.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {liveNodes.map((node, i) => {
                const nodeColors = isBreached
                  ? ['#ef4444','#dc2626','#b91c1c','#991b1b','#7f1d1d']
                  : ['#ef4444','#8b5cf6','#06b6d4','#f59e0b','#10b981'];
                const c = nodeColors[i % nodeColors.length];
                return (
                  <div key={node.id} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-mono font-bold transition-all ${
                    isBreached ? 'border-red-500/30 bg-red-500/8' : 'border-white/8 bg-white/4'
                  }`}>
                    <span className={`w-2 h-2 rounded-full shrink-0 ${isBreached ? 'animate-ping' : ''}`} style={{ backgroundColor: c }} />
                    <span className={isBreached ? 'text-red-400' : 'text-stone-300'}>{isBreached ? 'CORRUPTED' : node.id}</span>
                    <span className="text-stone-500">· {isBreached ? '99.9' : node.lastTemp?.toFixed(1)}°C</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Chart or empty state */}
          {telemetryData.length === 0 && !isBreached ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12 border-2 border-dashed border-stone-100 dark:border-white/5 rounded-2xl">
              <Activity size={28} className="text-stone-300 dark:text-stone-700 mb-3" />
              <p className="text-sm font-medium text-stone-400">No telemetry data yet</p>
              <p className="text-xs text-stone-400 mt-1">Pair a node in the Uplink Terminal to start streaming</p>
            </div>
          ) : (
            <div className="h-64 sm:h-[260px] w-full relative">
              {/* ── BREACH OVERLAY ── */}
              <AnimatePresence>
                {isBreached && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-10 rounded-xl overflow-hidden pointer-events-none"
                  >
                    {/* Red tint background */}
                    <div className="absolute inset-0 bg-red-900/20" />
                    {/* Scanline sweep */}
                    <motion.div
                      animate={{ y: ['-100%', '200%'] }}
                      transition={{ repeat: Infinity, duration: 1.8, ease: 'linear' }}
                      className="absolute left-0 right-0 h-8 bg-gradient-to-b from-transparent via-red-500/25 to-transparent"
                    />
                    {/* Glitch horizontal lines */}
                    {[20, 45, 68, 85].map(pct => (
                      <motion.div key={pct}
                        animate={{ opacity: [0, 1, 0], scaleX: [0.3, 1, 0.6] }}
                        transition={{ repeat: Infinity, duration: 0.4 + pct * 0.007, delay: pct * 0.01 }}
                        className="absolute left-0 right-0 h-px bg-red-400/50"
                        style={{ top: `${pct}%` }}
                      />
                    ))}
                    {/* Corrupted watermark */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                      <motion.p
                        animate={{ opacity: [1, 0.2, 1], x: [-2, 2, -1, 0] }}
                        transition={{ repeat: Infinity, duration: 0.3 }}
                        className="text-red-500 font-black text-base uppercase tracking-[0.3em] drop-shadow-lg"
                        style={{ fontFamily: 'JetBrains Mono, monospace', textShadow: '0 0 20px #ef4444' }}
                      >
                        ⚡ SIGNAL CORRUPTED
                      </motion.p>
                      <p className="text-red-400/70 text-[9px] font-mono uppercase tracking-widest">SHA-256 INTEGRITY BREACH · BLOCK HASH CHAIN SEVERED</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Actual chart (uses corrupted data when breached) */}
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={corruptedChartData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gTemp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#ef4444" stopOpacity={isBreached ? 0.55 : 0.2} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gHum" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={isBreached ? '#dc2626' : '#0ea5e9'} stopOpacity={isBreached ? 0.3 : 0.2} />
                      <stop offset="95%" stopColor={isBreached ? '#dc2626' : '#0ea5e9'} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="5 5" vertical={false} strokeOpacity={isBreached ? 0.03 : 0.05} />
                  <XAxis dataKey="label" tick={{ fontSize: 9, fontFamily: 'JetBrains Mono', fill: isBreached ? '#ef4444' : '#9ca3af' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 9, fontFamily: 'JetBrains Mono', fill: isBreached ? '#ef4444' : '#9ca3af' }} tickLine={false} axisLine={false} domain={isBreached ? [0, 110] : ['dataMin - 3', 'dataMax + 3']} />
                  <Tooltip content={<ChartTooltip liveNodes={liveNodes} isBreached={isBreached} />} />
                  <Area type={isBreached ? 'basis' : 'monotone'} dataKey="temp"
                    stroke="#dc2626" strokeWidth={isBreached ? 2 : 2}
                    fill="url(#gTemp)" isAnimationActive={false} name="Temperature"
                    dot={false} activeDot={{ r: 4, fill: '#ef4444' }} />
                  <Area type={isBreached ? 'basis' : 'monotone'} dataKey="humidity"
                    stroke={isBreached ? '#ef4444' : '#0ea5e9'} strokeWidth={isBreached ? 1.5 : 2}
                    strokeDasharray={isBreached ? '4 2' : '0'}
                    fill="url(#gHum)" isAnimationActive={false} name="Humidity"
                    dot={false} activeDot={{ r: 4, fill: isBreached ? '#ef4444' : '#0ea5e9' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* AI Sidebar */}
        <div className="glass-card rounded-[22px] p-6 relative overflow-hidden flex flex-col justify-between bg-stone-950 dark:bg-black/85">
          <div className="absolute inset-0 pointer-events-none">
            <div className={`absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl transition-all duration-1000 ${isBreached ? 'bg-red-600/15' : 'bg-red-600/8'}`} />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-rose-600/6 rounded-full blur-2xl" />
          </div>
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/6 border border-white/10 rounded-xl text-red-400"><Cpu size={18} /></div>
              <div>
                <p className="text-[9px] font-bold text-red-400 uppercase tracking-widest">Neural Core</p>
                <p className="text-sm font-bold text-white" style={{ fontFamily: 'Space Grotesk' }}>AI Analysis</p>
              </div>
            </div>

            {/* Heatmap Grid */}
            <div className={`border rounded-xl p-4 relative overflow-hidden transition-all duration-700 ${
              isBreached ? 'bg-red-900/20 border-red-500/25' : 'bg-white/4 border-white/6'
            }`}>
              {/* Breach scanline on heatmap */}
              {isBreached && (
                <motion.div
                  animate={{ y: ['-100%', '200%'] }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                  className="absolute left-0 right-0 h-4 bg-gradient-to-b from-transparent via-red-400/20 to-transparent pointer-events-none z-10"
                />
              )}
              <div className="flex justify-between items-center text-[9px] font-semibold text-stone-600 mb-3 uppercase tracking-wide">
                <span className={isBreached ? 'text-red-400' : ''}>
                  {isBreached ? '⚡ CORRUPTED HEATMAP' : 'Thermal Heatmap'}
                </span>
                <div className={`flex items-center gap-1.5 ${isBreached ? 'text-red-400' : 'text-red-400'}`}>
                  <Flame size={11} className={isBreached ? 'animate-bounce' : ''} />
                  <span className="animate-pulse">{isBreached ? 'BREACH' : 'Live'}</span>
                </div>
              </div>
              <div className="grid grid-cols-10 gap-0.5">
                {(heatmapCells.length > 0 ? heatmapCells.slice(-40) : Array.from({ length: 40 }, (_, i) => ({ norm: i % 2 === 0 ? 0.3 : 0.4, temp: 24 }))).map((cell, i) => {
                  const r = Math.round(cell.norm * 239); const g = Math.round((1 - cell.norm) * 180);
                  // When breached: ALL cells go red with varying intensity
                  const bg = isBreached
                    ? `rgb(${200 + Math.round(Math.sin(i * 0.8) * 39)}, ${Math.round(20 + Math.random() * 30)}, ${Math.round(20 + Math.random() * 20)})`
                    : `rgb(${r},${g},80)`;
                  return (
                    <div key={i} title={isBreached ? '99.9°C — CORRUPTED' : `${cell.temp?.toFixed(1)}°C`}
                      className={`h-2 rounded-sm transition-all duration-500 ${isBreached ? 'animate-pulse' : ''}`}
                      style={{ backgroundColor: bg, opacity: isBreached ? 0.7 + Math.sin(i) * 0.3 : 0.6 + cell.norm * 0.4 }} />
                  );
                })}
              </div>
              <div className="flex justify-between mt-2 text-[8px] text-stone-600">
                {isBreached
                  ? <span className="text-red-400 font-bold w-full text-center">HASH INTEGRITY COMPROMISED — ALL READINGS FORGED</span>
                  : <><span>18°C</span><span className="text-stone-500">Cool → Hot</span><span>42°C</span></>}
              </div>
            </div>

            {/* AI Message */}
            <div className={`border rounded-xl p-4 transition-all duration-700 ${isBreached ? 'bg-red-600/10 border-red-500/20' : 'bg-red-600/6 border-red-500/12'}`}>
              <div className="flex items-center gap-2 text-[9px] font-bold text-red-400 uppercase tracking-widest mb-2">
                <div className={`w-1.5 h-1.5 rounded-full ${aiAnalysis.status === 'Stable' ? 'bg-emerald-500' : 'bg-red-500 animate-ping'}`} />
                AI Inference
              </div>
              <p className="text-sm font-medium text-stone-200 leading-relaxed">&ldquo;{aiAnalysis.message}&rdquo;</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="relative z-10 pt-4 mt-4 border-t border-white/6">
            <div className="flex justify-between text-[9px] font-bold text-stone-600 mb-2 uppercase tracking-wide">
              <span>Node Throughput</span>
              <span className="text-red-400">{aiAnalysis.score}%</span>
            </div>
            <div className="w-full h-1.5 bg-white/6 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${aiAnalysis.score}%` }}
                className={`h-full rounded-full transition-all ${isBreached ? 'bg-gradient-to-r from-red-700 to-red-500' : 'bg-gradient-to-r from-red-600 to-rose-500'}`} />
            </div>
          </div>
        </div>
      </div>

      {/* ── VERIFIED LEDGER ── */}
      <div className="glass-card rounded-[22px] overflow-hidden">
        <div className="p-6 md:p-8 border-b border-stone-100 dark:border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl transition-all ${isBreached ? 'bg-red-100 dark:bg-red-500/12 text-red-600 dark:text-red-400' : ''}`}
              style={!isBreached ? { backgroundColor: 'var(--th-glow)', color: 'var(--th-primary)' } : undefined}>
              <Globe size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold" style={{ fontFamily: 'Space Grotesk' }}>
                Verified Ledger
                {isBreached && <span className="ml-2 text-[9px] text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20 animate-pulse">⚡ COMPROMISED</span>}
                {isSimulating && !isBreached && <span className="ml-2 text-[9px] text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">+Virtual</span>}
              </h3>
              <p className="text-[10px] text-stone-400">Forensic SHA-256 linkage stream · {filteredChain.length} blocks · <span className="font-mono">{LOCAL_TZ}</span></p>
            </div>
          </div>
          <div className="relative w-full md:w-64">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
            <input type="text" placeholder="Search block, hash, nonce..." value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)} className="glass-input pl-10 text-sm py-2.5" />
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left min-w-[600px]">
            <thead>
              <tr className="border-b border-stone-100 dark:border-white/5">
                {['Index', 'Proof (Nonce)', 'SHA-256 Hash', 'Timestamp'].map((h, i) => (
                  <th key={h} className={`px-6 py-3 text-[9px] font-bold text-stone-400 uppercase tracking-widest ${i === 3 ? 'text-right' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50 dark:divide-white/3">
              {filteredChain.slice().reverse().map((block, rowIdx) => {
                // When breached → EVERY block in the ledger is corrupted
                const isCorrupted = isBreached;
                return (
                  <motion.tr layout key={block.hash || `r-${block.index}-${rowIdx}`}
                    className={`group transition-colors ${
                      isCorrupted
                        ? 'bg-red-50/60 dark:bg-red-900/15'
                        : 'hover:bg-stone-50 dark:hover:bg-white/3'
                    }`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-base font-bold font-mono ${isCorrupted ? 'text-red-500' : 'text-red-600 dark:text-red-400'}`}>
                          #{block.index}
                        </span>
                        {isCorrupted && (
                          <span className="text-[8px] font-bold text-red-500 bg-red-500/10 border border-red-500/30 px-1.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse">CORRUPTED</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border font-mono ${
                        isCorrupted
                          ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-700/30'
                          : 'bg-stone-100 dark:bg-white/6 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-white/10'
                      }`}>
                        {isCorrupted ? '⚠ FORGED' : (block.nonce ?? '0')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-mono px-3 py-1.5 rounded-lg border truncate max-w-[240px] block transition-all ${
                          isCorrupted
                            ? 'text-red-400 line-through opacity-50 bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-700/30'
                            : 'text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-white/5 border-stone-100 dark:border-white/6'
                        }`}>
                          {isCorrupted ? 'HASH_CORRUPTED_' + block.hash?.slice(2, 10).toUpperCase() + '...' : block.hash}
                        </span>
                        {!isCorrupted && (
                          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                            onClick={() => handleCopy(block.hash)}
                            className="p-1.5 rounded-lg bg-white dark:bg-white/6 border border-stone-200 dark:border-white/8 text-stone-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                            {copiedHash === block.hash ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                          </motion.button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-sm font-mono font-semibold tabular-nums">{fmtTime(block.timestamp)}</p>
                      <p className="text-[9px] text-stone-400 font-mono mt-0.5">{fmtDate(block.timestamp)}</p>
                      <p className={`text-[9px] font-bold uppercase tracking-wide mt-0.5 ${
                        isCorrupted ? 'text-red-500' : 'text-emerald-500'
                      }`}>
                        {isCorrupted
                          ? '✗ Corrupted'
                          : `✓ Verified · ${block._nodeId?.split('-')[0] ?? 'Node'}`
                        }
                      </p>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
          {filteredChain.length === 0 && (
            <div className="py-16 text-center text-stone-400">
              <Database size={30} className="mx-auto mb-3 opacity-25" />
              <p className="text-sm font-medium">
                {searchTerm ? `No blocks for "${searchTerm}"` : 'No blocks yet · Pair nodes in Uplink Terminal'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── MODAL ── */}
      <AnimatePresence>
        {activeModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setActiveModal(null)}
            className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-stone-900/70 dark:bg-black/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.94, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94, y: 16 }}
              onClick={e => e.stopPropagation()} className="glass-card rounded-[24px] p-8 md:p-10 w-full max-w-md relative">
              <button onClick={() => setActiveModal(null)} className="absolute top-5 right-5 p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-white/6 text-stone-400 transition-colors">
                <X size={18} />
              </button>
              <div className="flex items-center gap-4 mb-5">
                <div className="p-3 bg-red-100 dark:bg-red-500/12 text-red-600 dark:text-red-400 rounded-2xl"><Info size={22} /></div>
                <h2 className="text-lg font-bold" style={{ fontFamily: 'Space Grotesk' }}>{activeModal.title}</h2>
              </div>
              <p className="text-sm text-stone-500 dark:text-stone-400 mb-6 leading-relaxed">{activeModal.desc}</p>
              <div className="text-center bg-stone-50 dark:bg-white/4 border border-stone-100 dark:border-white/6 rounded-2xl py-10 px-6">
                <span className="text-[9px] font-bold text-red-500 uppercase tracking-widest block mb-3">Current Value</span>
                <p className="text-5xl font-bold font-mono tabular-nums">{activeModal.val}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-center text-[10px] text-stone-400 dark:text-stone-700 pb-4 uppercase tracking-widest font-medium">
        SenseChain Neural Infrastructure · SHA-256 Layer-1 Blockchain
      </p>
    </div>
  );
};

// ── SUB COMPONENTS ──

// StatCard uses CSS variables for all brand colors so it automatically
// adopts whatever theme is currently active system-wide.
const StatCard = ({ title, value, suffix, icon, color, pulse, onClick }) => {
  // 'danger' = always red (breach/critical), 'theme' = follows active theme
  const isDanger = color === 'red' || color === 'danger';

  const iconBg    = isDanger ? 'rgba(220,38,38,0.10)'  : 'var(--th-glow)';
  const iconColor = isDanger ? '#dc2626'                : 'var(--th-primary)';
  const valColor  = isDanger ? '#dc2626'                : 'var(--th-primary)';

  return (
    <motion.div whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }} onClick={onClick}
      className={`stat-card border cursor-pointer ${pulse ? 'breach-glow' : ''}`}>
      <div className="flex items-start justify-between mb-4">
        {/* Icon badge — uses theme primary color */}
        <div className="p-2.5 rounded-xl transition-colors duration-500"
          style={{ backgroundColor: iconBg, color: iconColor }}>
          {icon}
        </div>
        <ChevronRight size={14} className="text-stone-300 dark:text-stone-700 mt-0.5" />
      </div>
      {/* Value — uses theme primary color */}
      <motion.p key={String(value)} initial={{ scale: 1.08, opacity: 0.6 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="text-2xl md:text-3xl font-bold tabular-nums transition-colors duration-500"
        style={{ fontFamily: 'Space Grotesk', color: valColor }}>
        {value}
      </motion.p>
      <p className="text-xs font-semibold mt-1">{title}</p>
      <p className="text-[10px] text-stone-400 mt-0.5 uppercase tracking-wide">{suffix}</p>
    </motion.div>
  );
};

const LegendDot = ({ color, label, value }) => (
  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/60 dark:bg-white/4 border border-stone-200 dark:border-white/6 rounded-xl">
    <div className={`w-1.5 h-1.5 rounded-full ${color === 'rose' ? 'bg-red-500' : 'bg-sky-500'}`} />
    <span className="text-[9px] font-semibold text-stone-500 uppercase">{label}</span>
    <span className="text-[10px] font-bold font-mono">{value}</span>
  </div>
);

const ChartTooltip = ({ active, payload, label, liveNodes = [] }) => {
  if (!active || !payload?.length) return null;
  const nodeId   = payload[0]?.payload?.nodeId;
  const nodeIdx  = liveNodes.findIndex(n => n.id === nodeId);
  const nodeColors = ['#ef4444','#8b5cf6','#06b6d4','#f59e0b','#10b981'];
  const nodeColor = nodeIdx >= 0 ? nodeColors[nodeIdx % nodeColors.length] : '#ef4444';
  return (
    <div className="glass-card rounded-xl p-4 shadow-xl border border-stone-100 dark:border-white/8 min-w-[170px]">
      <p className="text-[9px] font-bold text-red-500 uppercase tracking-widest mb-1">{label} · Sensor Data</p>
      {nodeId && (
        <p className="text-[8px] font-mono mb-2 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: nodeColor }} />
          <span className="text-stone-400 truncate">{nodeId}</span>
        </p>
      )}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5"><Thermometer size={12} className="text-red-500" /><span className="text-xs text-stone-500">Thermal</span></div>
          <span className="text-sm font-bold text-red-500 font-mono">{payload[0]?.value}°C</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5"><Droplets size={12} className="text-sky-500" /><span className="text-xs text-stone-500">Humidity</span></div>
          <span className="text-sm font-bold text-sky-500 font-mono">{payload[1]?.value}%</span>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;