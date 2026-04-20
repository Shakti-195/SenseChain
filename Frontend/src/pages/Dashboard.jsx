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

  // ── MERGE REAL CHAIN + VIRTUAL BLOCKS ──
  const mergedChain = useMemo(() => {
    if (virtualBlocks.length === 0) return normalizedChain;
    return [...normalizedChain, ...virtualBlocks];
  }, [normalizedChain, virtualBlocks]);

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

  // ── CHART DATA (last 30 blocks) ──
  const telemetryData = useMemo(() => {
    const src = mergedChain.filter(b => typeof b.index === 'number').slice(-30);
    if (src.length === 0) return [
      { label: '#0', temp: 22, humidity: 45 },
      { label: '#1', temp: 24, humidity: 47 },
    ];
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
  }, [mergedChain]);

  // ── FILTERED LEDGER ──
  const filteredChain = useMemo(() => {
    const src = mergedChain;
    if (!src) return [];
    const s = searchTerm.toLowerCase();
    return src.filter(b =>
      String(b.index).includes(s) ||
      b.hash?.toLowerCase().includes(s) ||
      String(b.nonce || '').includes(s) ||
      fmtTime(b.timestamp).includes(s)
    );
  }, [mergedChain, searchTerm]);

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
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border ${
          connError
            ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'
            : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${connError ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'}`} />
          {connError ? 'Backend Offline' : 'Synchronized'}
        </div>
      </motion.div>

      {/* ── STAT CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Ledger Height"
          value={chainHeight + simBlockCount} suffix="blocks" icon={<Database size={17} />} color="red"
          onClick={() => setActiveModal({ title: 'Ledger Height', val: chainHeight + simBlockCount, desc: 'Total depth of the current cryptographic blockchain including virtual simulation blocks.' })} />
        <StatCard title="Node Stability" value={`${aiAnalysis.score}%`} suffix="health" icon={<Heart size={17} />}
          color={aiAnalysis.score > 80 && !isBreached ? 'green' : 'red'} pulse={aiAnalysis.score < 80 || isBreached}
          onClick={() => setActiveModal({ title: 'Node Stability', val: `${aiAnalysis.score}%`, desc: 'Based on cryptographic linkage consistency and data throughput.' })} />
        <StatCard
          title="Security Status"
          value={isBreached ? 'CRITICAL' : 'Secure'}
          suffix={isBreached ? '⚡ ALERT' : 'SHA-256 OK'}
          icon={isBreached ? <ShieldAlert size={17} /> : <ShieldCheck size={17} />}
          color={isBreached ? 'red' : 'indigo'}
          pulse={isBreached}
          onClick={() => isBreached ? navigate('/security') : setActiveModal({ title: 'Security', val: 'Secure', desc: 'Real-time SHA-256 hash linkage monitoring.' })}
        />
        <StatCard title="Active Nodes" value={liveNodes.length || '—'} suffix={liveNodes.length > 0 ? 'mining' : 'pair in uplink'} icon={<Signal size={17} />} color="violet"
          onClick={() => navigate('/provisioning')} />
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
        <div className="lg:col-span-2 glass-card rounded-[22px] p-6 md:p-8 flex flex-col">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-100 dark:bg-red-500/12 text-red-600 dark:text-red-400 rounded-xl">
                <Activity size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold" style={{ fontFamily: 'Space Grotesk' }}>Telemetry Stream</h3>
                <p className="text-[10px] text-stone-400">
                  {liveNodes.length > 0 ? `⚡ ${liveNodes.length} node(s) broadcasting · ` : 'Live sensor data · '}
                  {telemetryData.length} data points
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <LegendDot color="rose" label="Temp" value={`${lastTemp}°C`} />
              <LegendDot color="sky"  label="Humidity" value={`${lastHum}%`} />
            </div>
          </div>
          <div className="h-64 sm:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={telemetryData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="gTemp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={isBreached ? '#ef4444' : '#ef4444'} stopOpacity={isBreached ? 0.4 : 0.2} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gHum" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#0ea5e9" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="5 5" vertical={false} strokeOpacity={0.05} />
                <XAxis dataKey="label" tick={{ fontSize: 9, fontFamily: 'JetBrains Mono', fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 9, fontFamily: 'JetBrains Mono', fill: '#9ca3af' }} tickLine={false} axisLine={false} domain={['dataMin - 3', 'dataMax + 3']} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="temp"     stroke={isBreached ? '#dc2626' : '#ef4444'} strokeWidth={isBreached ? 2.5 : 2} fill="url(#gTemp)" isAnimationActive={false} name="Temperature" />
                <Area type="monotone" dataKey="humidity" stroke="#0ea5e9" strokeWidth={2} fill="url(#gHum)" isAnimationActive={false} name="Humidity" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
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
            <div className="bg-white/4 border border-white/6 rounded-xl p-4">
              <div className="flex justify-between items-center text-[9px] font-semibold text-stone-600 mb-3 uppercase tracking-wide">
                <span>Thermal Heatmap</span>
                <div className="flex items-center gap-1.5 text-red-400"><Flame size={11} /><span className="animate-pulse">Live</span></div>
              </div>
              <div className="grid grid-cols-10 gap-0.5">
                {(heatmapCells.length > 0 ? heatmapCells.slice(-40) : Array.from({ length: 40 }, (_, i) => ({ norm: i % 2 === 0 ? 0.3 : 0.4, temp: 24 }))).map((cell, i) => {
                  const r = Math.round(cell.norm * 239); const g = Math.round((1 - cell.norm) * 180);
                  const bg = isBreached && i > 32 ? 'rgb(239,68,68)' : `rgb(${r},${g},80)`;
                  return (
                    <div key={i} title={`${cell.temp?.toFixed(1)}°C`}
                      className={`h-2 rounded-sm transition-all duration-700 ${isBreached && i > 32 ? 'animate-pulse' : ''}`}
                      style={{ backgroundColor: bg, opacity: 0.6 + cell.norm * 0.4 }} />
                  );
                })}
              </div>
              <div className="flex justify-between mt-2 text-[8px] text-stone-600">
                <span>18°C</span><span className="text-stone-500">Cool → Hot</span><span>42°C</span>
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
            <div className={`p-2.5 rounded-xl transition-all ${isBreached ? 'bg-red-100 dark:bg-red-500/12 text-red-600 dark:text-red-400' : 'bg-red-100 dark:bg-red-500/12 text-red-600 dark:text-red-400'}`}>
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
                const isTampered = isBreached && block.index === breachedBlock;
                return (
                  <motion.tr layout key={block.hash || `r-${block.index}-${rowIdx}`}
                    className={`group transition-colors ${
                      isTampered
                        ? 'bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500'
                        : block._virtual ? 'opacity-90 hover:bg-stone-50 dark:hover:bg-white/3'
                        : 'hover:bg-stone-50 dark:hover:bg-white/3'
                    }`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-base font-bold font-mono ${isTampered ? 'text-red-600' : 'text-red-600 dark:text-red-400'}`}>
                          #{block.index}
                        </span>
                        {isTampered && <span className="text-[8px] font-bold text-red-500 bg-red-500/10 border border-red-500/30 px-1.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse">TAMPERED</span>}
                        {block._virtual && !isTampered && (
                          <span className="text-[8px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full uppercase tracking-wider">SIM</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full bg-stone-100 dark:bg-white/6 text-stone-700 dark:text-stone-300 text-[10px] font-bold border border-stone-200 dark:border-white/10 font-mono">
                        {isTampered ? '⚠ FORGED' : (block.nonce ?? '0')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-mono px-3 py-1.5 rounded-lg border truncate max-w-[240px] block transition-all ${
                          isTampered
                            ? 'text-red-400 line-through opacity-60 bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/30'
                            : 'text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-white/5 border-stone-150 dark:border-white/6'
                        }`}>
                          {isTampered ? 'HASH_CORRUPTED_XXXXXXXX...' : block.hash}
                        </span>
                        {!isTampered && (
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
                        isTampered ? 'text-red-500' : block._virtual ? 'text-emerald-500' : (integrity ? 'text-emerald-500' : 'text-red-500')
                      }`}>
                        {isTampered ? '✗ Corrupted' : block._virtual ? `⚡ ${block._nodeId?.split('-')[0] ?? 'Virtual'}` : (integrity ? '✓ Verified' : '✗ Broken')}
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

const StatCard = ({ title, value, suffix, icon, color, pulse, onClick }) => {
  const c = {
    red:    { bg: 'bg-red-100 dark:bg-red-500/12', text: 'text-red-600 dark:text-red-400', val: 'text-red-600 dark:text-red-400' },
    green:  { bg: 'bg-emerald-100 dark:bg-emerald-500/12', text: 'text-emerald-600 dark:text-emerald-400', val: 'text-emerald-600 dark:text-emerald-400' },
    indigo: { bg: 'bg-indigo-100 dark:bg-indigo-500/12', text: 'text-indigo-600 dark:text-indigo-400', val: 'text-indigo-600 dark:text-indigo-400' },
    violet: { bg: 'bg-violet-100 dark:bg-violet-500/12', text: 'text-violet-600 dark:text-violet-400', val: 'text-violet-600 dark:text-violet-400' },
  }[color] || { bg: 'bg-red-100 dark:bg-red-500/12', text: 'text-red-600 dark:text-red-400', val: 'text-red-600 dark:text-red-400' };
  return (
    <motion.div whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }} onClick={onClick}
      className={`stat-card border cursor-pointer ${pulse ? 'breach-glow' : ''}`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-xl ${c.bg} ${c.text}`}>{icon}</div>
        <ChevronRight size={14} className="text-stone-300 dark:text-stone-700 mt-0.5" />
      </div>
      <motion.p key={String(value)} initial={{ scale: 1.08, opacity: 0.6 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className={`text-2xl md:text-3xl font-bold tabular-nums ${c.val}`} style={{ fontFamily: 'Space Grotesk' }}>
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

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card rounded-xl p-4 shadow-xl border border-stone-100 dark:border-white/8 min-w-[150px]">
      <p className="text-[9px] font-bold text-red-500 uppercase tracking-widest mb-2">{label} · Sensor Data</p>
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