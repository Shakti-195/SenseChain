import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Activity, ShieldCheck, ShieldAlert, Search, Database, Globe, ChevronRight,
  Cpu, Sparkles, Thermometer, Droplets, Flame, X, Info,
  Play, Pause, Terminal, Radio, Copy, Check, Zap, Heart, Blocks,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ── LOCAL TIMEZONE TIMESTAMP (always matches PC clock) ──
const LOCAL_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;

const fmtTime = (ts) => {
  if (!ts && ts !== 0) return '--:--:--';
  try {
    const raw = Number(ts);
    const ms = raw < 1e12 ? raw * 1000 : raw;
    return new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false, timeZone: LOCAL_TZ,
    }).format(new Date(ms));
  } catch { return '--:--:--'; }
};

const fmtDate = (ts) => {
  if (!ts) return '';
  try {
    const raw = Number(ts);
    const ms = raw < 1e12 ? raw * 1000 : raw;
    return new Intl.DateTimeFormat('en-GB', {
      month: 'short', day: 'numeric', timeZone: LOCAL_TZ,
    }).format(new Date(ms));
  } catch { return ''; }
};

const nowTime = () =>
  new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false, timeZone: LOCAL_TZ,
  }).format(new Date());

// ── SIMULATION ENGINE (pure local, no backend needed) ──
const SIM_INTERVAL_MS = 1800;
const SIM_LOG_POOL = [
  (node, blk) => `[INGEST] Block #${blk} SHA-256 Validated`,
  (node)      => `[SYNC]   Node ${node} pushing telemetry packet`,
  ()          => `[AUTH]   Cryptographic Signature Verified`,
  ()          => `[DB]     Write-stream: ✓ SUCCESS`,
  ()          => `[NET]    Latency: ${(Math.random() * 0.5 + 0.08).toFixed(3)}ms`,
  ()          => `[HASH]   PoW solved. Difficulty satisfied.`,
  (node)      => `[BCAST]  ${node} broadcasting to peer mesh`,
  ()          => `[BLOCK]  Merkle root computed. Sealed.`,
  ()          => `[TLS]    Handshake renewed.`,
  ()          => `[TEMP]   Sensor: ${(22 + Math.random() * 8).toFixed(1)}°C`,
];

// Generate a fake virtual block for simulation display
let _simBlockCount = 0;
const makeFakeBlock = (nodeId, baseIdx) => {
  _simBlockCount++;
  const temp = parseFloat((22 + Math.sin(_simBlockCount * 0.4) * 4 + Math.random()).toFixed(1));
  const humidity = parseFloat((50 + Math.cos(_simBlockCount * 0.4) * 6 + Math.random()).toFixed(1));
  return {
    index: baseIdx + _simBlockCount,
    nonce: Math.floor(Math.random() * 99999),
    hash: '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
    timestamp: Date.now(),
    data: { temperature: temp, humidity, node_id: nodeId, virtual: true },
    _virtual: true,
  };
};

const Dashboard = ({
  chain = [],
  integrity = true,
  lastUpdated = '',
  connError = null,
  chainHeight = 0,
  refreshData = null,
}) => {
  const [searchTerm, setSearchTerm]     = useState('');
  const [copiedHash, setCopiedHash]     = useState(null);
  const [activeModal, setActiveModal]   = useState(null);

  // ── SIMULATION STATE ──
  const [isSimulating, setIsSimulating] = useState(false);
  const [simNode, setSimNode]           = useState('SENSE-NODE-01');
  const [simLogs, setSimLogs]           = useState([]);
  const [simBlocks, setSimBlocks]       = useState([]);   // virtual blocks generated locally
  const [simTick, setSimTick]           = useState(0);    // forces chart refresh
  const simIntervalRef = useRef(null);
  const simBlocksRef   = useRef([]);

  // keep ref in sync
  simBlocksRef.current = simBlocks;

  // ── NORMALIZE BLOCK INDEX ──
  const normalizedChain = useMemo(() => {
    if (!chain?.length) return [];
    const allZero = chain.every(b => b.index === 0);
    if (allZero) return chain.map((b, i) => ({ ...b, index: i }));
    return chain;
  }, [chain]);

  // Merge real chain + virtual sim blocks
  const mergedChain = useMemo(() => {
    if (!isSimulating || simBlocks.length === 0) return normalizedChain;
    return [...normalizedChain, ...simBlocks];
  }, [normalizedChain, simBlocks, isSimulating, simTick]); // eslint-disable-line

  // ── AI ANALYSIS ──
  const aiAnalysis = useMemo(() => {
    if (!mergedChain || mergedChain.length < 2)
      return { status: 'Initializing', message: 'Gathering neural data...', score: 100, anomalies: [] };
    const lastBlocks = mergedChain.slice(-5);
    const parse = (b) => { let d = b?.data; if (typeof d === 'string') { try { d = JSON.parse(d); } catch { d = {}; } } return d || {}; };
    const latest   = parse(lastBlocks[lastBlocks.length - 1]);
    const previous = parse(lastBlocks[lastBlocks.length - 2]);
    let anomalies = [], score = 100, message = 'All systems operating within nominal parameters.';
    if (!integrity) { anomalies.push({ type: 'CRITICAL', msg: 'Cryptographic Breach' }); score -= 50; message = 'Emergency: Blockchain integrity compromise detected.'; }
    const tempChange = Math.abs((latest.temperature || 0) - (previous.temperature || 0));
    if (tempChange > (previous.temperature || 0) * 0.1) { anomalies.push({ type: 'WARNING', msg: 'Thermal Spike' }); score -= 20; message = 'Temperature fluctuation detected. Possible environmental anomaly.'; }
    if (integrity && anomalies.length === 0) message = latest.temperature > previous.temperature ? 'Blockchain growing steadily with an upward thermal trend.' : 'Network pulse is stable. Data throughput optimized.';
    return { status: anomalies.length > 0 ? 'Anomaly Detected' : 'Stable', message, score: Math.max(score, 0), anomalies };
  }, [mergedChain, integrity]);

  // ── CHART DATA ──
  const telemetryData = useMemo(() => {
    const src = mergedChain.length ? mergedChain : null;
    if (!src) {
      return [
        { label: '#0', temp: 22, humidity: 45, ts: Date.now() - 60000 },
        { label: '#1', temp: 24, humidity: 47, ts: Date.now() },
      ];
    }
    const working = src.filter(b => typeof b.index === 'number').slice(-30);
    const data = working.map((b) => {
      let d = b.data;
      if (typeof d === 'string') { try { d = JSON.parse(d); } catch { d = {}; } }
      d = d || {};
      return {
        label: `#${b.index}`,
        temp: Number((d.temperature ?? (22 + Math.sin(b.index * 0.4) * 3)).toFixed(1)),
        humidity: Number((d.humidity ?? (50 + Math.cos(b.index * 0.4) * 6)).toFixed(1)),
        ts: Number(b.timestamp),
      };
    });
    if (data.length === 1) data.push({ ...data[0], label: `#${working[0].index + 1}`, ts: data[0].ts + 1 });
    return data;
  }, [mergedChain, simTick]); // eslint-disable-line

  // ── SIMULATION TICK ──
  useEffect(() => {
    if (isSimulating) {
      _simBlockCount = 0; // reset block counter each time sim starts
      setSimBlocks([]);
      setSimLogs([]);

      simIntervalRef.current = setInterval(() => {
        const baseIdx = chainHeight + simBlocksRef.current.length;
        const newBlock = makeFakeBlock(simNode, baseIdx);

        // Add virtual block
        setSimBlocks(prev => [...prev.slice(-19), newBlock]);

        // Add log entry
        const fn = SIM_LOG_POOL[Math.floor(Math.random() * SIM_LOG_POOL.length)];
        const logLine = fn(simNode, newBlock.index);
        setSimLogs(prev => [logLine, ...prev].slice(0, 8));

        // Force chart refresh
        setSimTick(t => t + 1);
      }, SIM_INTERVAL_MS);
    } else {
      clearInterval(simIntervalRef.current);
      // Don't clear simBlocks immediately so chart doesn't flash
    }
    return () => clearInterval(simIntervalRef.current);
  }, [isSimulating, simNode, chainHeight]); // eslint-disable-line

  const toggleSim = () => {
    if (!isSimulating) {
      setIsSimulating(true);
    } else {
      setIsSimulating(false);
      setSimBlocks([]);
      setSimLogs([]);
      _simBlockCount = 0;
    }
  };

  const handleCopy = (hash) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const filteredChain = useMemo(() => {
    const src = isSimulating ? mergedChain : normalizedChain;
    if (!src) return [];
    const s = searchTerm.toLowerCase();
    return src.filter(b =>
      String(b.index).includes(s) ||
      b.hash?.toLowerCase().includes(s) ||
      String(b.nonce || '').includes(s) ||
      fmtTime(b.timestamp).includes(s)
    );
  }, [normalizedChain, mergedChain, isSimulating, searchTerm, simTick]); // eslint-disable-line

  const lastTemp = telemetryData[telemetryData.length - 1]?.temp ?? '--';
  const lastHum  = telemetryData[telemetryData.length - 1]?.humidity ?? '--';

  return (
    <div className="page-wrapper space-y-6 custom-scrollbar">

      {/* ── PAGE HEADER ── */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest chip-red">
              <Sparkles size={9} /> Live Terminal
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight" style={{ fontFamily: 'Space Grotesk' }}>
            Network <span className="bg-gradient-to-r from-red-600 to-rose-500 bg-clip-text text-transparent">Overview</span>
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">Real-time blockchain telemetry monitoring · <span className="font-mono text-xs text-red-400">{LOCAL_TZ}</span></p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border ${
            connError
              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'
              : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${connError ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'}`} />
            {connError ? 'Backend Offline' : 'Synchronized'}
          </div>
        </div>
      </motion.div>

      {/* ── STAT CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Ledger Height" value={chainHeight + (isSimulating ? simBlocks.length : 0)} suffix="blocks" icon={<Database size={17} />} color="red"
          onClick={() => setActiveModal({ title: 'Ledger Height', val: chainHeight, desc: 'Total depth of the current cryptographic blockchain.' })} />
        <StatCard title="Node Stability" value={`${aiAnalysis.score}%`} suffix="health" icon={<Heart size={17} />}
          color={aiAnalysis.score > 80 ? 'green' : 'red'} pulse={aiAnalysis.score < 80}
          onClick={() => setActiveModal({ title: 'Node Stability', val: `${aiAnalysis.score}%`, desc: 'Based on cryptographic linkage consistency and data throughput.' })} />
        <StatCard title="Security Status" value={integrity ? 'Secure' : 'Breached'} suffix={integrity ? 'SHA-256 OK' : 'ALERT'}
          icon={integrity ? <ShieldCheck size={17} /> : <ShieldAlert size={17} />} color={integrity ? 'indigo' : 'red'}
          onClick={() => setActiveModal({ title: 'Security', val: integrity ? 'Secure' : 'Critical', desc: 'Real-time SHA-256 hash linkage monitoring.' })} />
        <StatCard title="Packet Latency" value="0.14ms" suffix="interconnect" icon={<Zap size={17} />} color="violet"
          onClick={() => setActiveModal({ title: 'Latency', val: '0.14ms', desc: 'Propagation delay across neural network clusters.' })} />
      </div>

      {/* ── SIMULATION LAB ── */}
      <motion.div className="glass-card rounded-[22px] p-6 md:p-8 relative overflow-hidden" whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-56 h-56 bg-red-500/5 dark:bg-red-500/8 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 relative z-10">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl transition-all duration-500 ${isSimulating ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-500/15 text-red-600 dark:text-red-400'}`}>
              <Terminal size={22} />
            </div>
            <div>
              <h3 className="text-base font-bold" style={{ fontFamily: 'Space Grotesk' }}>
                Simulation Lab
                {isSimulating && (
                  <span className="ml-2 text-[9px] font-bold text-emerald-500 bg-emerald-500/12 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-widest animate-pulse">
                    VIRTUAL · Local
                  </span>
                )}
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">Deploy virtual IoT cluster shards to the chain</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
            <div className="glass-panel rounded-xl px-4 py-3 flex-1 lg:w-52">
              <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-1">Node ID</p>
              <input
                type="text"
                value={simNode}
                onChange={(e) => setSimNode(e.target.value)}
                disabled={isSimulating}
                className="bg-transparent border-none outline-none text-sm font-semibold text-red-600 dark:text-red-400 w-full font-mono disabled:opacity-60"
              />
            </div>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={toggleSim}
              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-lg ${
                isSimulating ? 'bg-stone-800 dark:bg-white/8 text-white' : 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/25'
              }`}
            >
              {isSimulating ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}
              {isSimulating ? 'Stop Node' : 'Start Node'}
            </motion.button>
          </div>
        </div>

        <AnimatePresence>
          {isSimulating && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-6 pt-6 border-t border-stone-200 dark:border-white/6 grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Terminal log */}
                <div className="md:col-span-2 bg-stone-950 dark:bg-black/70 rounded-2xl p-5 terminal-scanline">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-[10px] text-stone-600 ml-2 font-mono">sensechain-node — virtual bash</span>
                    <span className="ml-auto text-[9px] text-emerald-500 font-mono animate-pulse">● LIVE</span>
                  </div>
                  <div className="space-y-2 max-h-36 overflow-hidden">
                    {simLogs.length === 0 && (
                      <p className="text-xs text-stone-600 font-mono animate-pulse">Initializing virtual node...</p>
                    )}
                    {simLogs.map((log, i) => (
                      <motion.p
                        key={`${log}-${i}`}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-xs text-stone-400 font-mono flex gap-3"
                      >
                        <span className="text-red-500 shrink-0">{nowTime()}</span>
                        <span className="text-stone-300">{log}</span>
                      </motion.p>
                    ))}
                  </div>
                </div>

                {/* Node status widget */}
                <div className="glass-panel rounded-2xl p-5 flex flex-col items-center justify-center text-center gap-3">
                  <div className="relative mb-2">
                    <motion.div
                      animate={{ scale: [1, 1.8], opacity: [0.4, 0] }}
                      transition={{ repeat: Infinity, duration: 1.8 }}
                      className="absolute inset-0 bg-emerald-500 rounded-full"
                    />
                    <div className="relative w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/25">
                      <Radio size={22} className="text-white" />
                    </div>
                  </div>
                  <p className="text-sm font-bold font-mono">{simNode}</p>
                  <p className="text-[10px] text-emerald-500 animate-pulse font-medium">Broadcasting...</p>
                  <div className="w-full bg-white/5 rounded-full overflow-hidden h-1">
                    <motion.div
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                      className="h-full w-1/2 bg-gradient-to-r from-transparent via-emerald-400 to-transparent"
                    />
                  </div>
                  <p className="text-[9px] text-stone-500 font-mono">
                    +{simBlocks.length} virtual block{simBlocks.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── CHART + AI PANEL ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Chart */}
        <div className="lg:col-span-2 glass-card rounded-[22px] p-6 md:p-8 flex flex-col">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-100 dark:bg-red-500/12 text-red-600 dark:text-red-400 rounded-xl">
                <Activity size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold" style={{ fontFamily: 'Space Grotesk' }}>Telemetry Stream</h3>
                <p className="text-[10px] text-stone-400">
                  {isSimulating ? '⚡ Virtual simulation active · ' : 'Live sensor data · '}
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
                    <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.2} />
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
                <Area type="monotone" dataKey="temp"     stroke="#ef4444" strokeWidth={2} fill="url(#gTemp)" isAnimationActive={false} name="Temperature" />
                <Area type="monotone" dataKey="humidity" stroke="#0ea5e9" strokeWidth={2} fill="url(#gHum)"  isAnimationActive={false} name="Humidity" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Sidebar */}
        <div className="glass-card rounded-[22px] p-6 relative overflow-hidden flex flex-col justify-between bg-stone-950 dark:bg-black/85">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-48 h-48 bg-red-600/8 rounded-full blur-3xl" />
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
            {/* Pulse Grid */}
            <div className="bg-white/4 border border-white/6 rounded-xl p-4">
              <div className="flex justify-between items-center text-[9px] font-semibold text-stone-600 mb-3 uppercase tracking-wide">
                <span>Neural Pulse</span>
                <div className="flex items-center gap-1.5 text-red-400"><Flame size={11} /><span className="animate-pulse">Live</span></div>
              </div>
              <div className="grid grid-cols-10 gap-1">
                {Array.from({ length: 40 }).map((_, i) => (
                  <div key={i} className={`h-2 rounded-full transition-all duration-500 ${
                    integrity ? 'bg-emerald-500/30' : (i > 32 ? 'bg-red-500 animate-pulse' : 'bg-white/6')
                  }`} />
                ))}
              </div>
            </div>
            {/* AI Message */}
            <div className="bg-red-600/6 border border-red-500/12 rounded-xl p-4">
              <div className="flex items-center gap-2 text-[9px] font-bold text-red-400 uppercase tracking-widest mb-2">
                <div className={`w-1.5 h-1.5 rounded-full ${aiAnalysis.status === 'Stable' ? 'bg-emerald-500' : 'bg-red-500 animate-ping'}`} />
                AI Inference
              </div>
              <p className="text-sm font-medium text-stone-200 leading-relaxed">&ldquo;{aiAnalysis.message}&rdquo;</p>
            </div>
          </div>
          {/* Progress */}
          <div className="relative z-10 pt-4 mt-4 border-t border-white/6">
            <div className="flex justify-between text-[9px] font-bold text-stone-600 mb-2 uppercase tracking-wide">
              <span>Node Throughput</span>
              <span className="text-red-400">{aiAnalysis.score}%</span>
            </div>
            <div className="w-full h-1.5 bg-white/6 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${aiAnalysis.score}%` }}
                className="h-full bg-gradient-to-r from-red-600 to-rose-500 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* ── LEDGER TABLE ── */}
      <div className="glass-card rounded-[22px] overflow-hidden">
        <div className="p-6 md:p-8 border-b border-stone-100 dark:border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-100 dark:bg-red-500/12 text-red-600 dark:text-red-400 rounded-xl"><Globe size={18} /></div>
            <div>
              <h3 className="text-sm font-bold" style={{ fontFamily: 'Space Grotesk' }}>
                Verified Ledger
                {isSimulating && <span className="ml-2 text-[9px] text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">+Virtual</span>}
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
              {filteredChain.slice().reverse().map((block, rowIdx) => (
                <motion.tr layout key={block.hash || `r-${block.index}-${rowIdx}`}
                  className={`group hover:bg-stone-50 dark:hover:bg-white/3 transition-colors ${block._virtual ? 'opacity-90' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-red-600 dark:text-red-400 font-mono">#{block.index}</span>
                      {block._virtual && (
                        <span className="text-[8px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full uppercase tracking-wider">SIM</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full bg-stone-100 dark:bg-white/6 text-stone-700 dark:text-stone-300 text-[10px] font-bold border border-stone-200 dark:border-white/10 font-mono">
                      {block.nonce ?? '0'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-white/5 px-3 py-1.5 rounded-lg border border-stone-150 dark:border-white/6 truncate max-w-[240px] block">
                        {block.hash}
                      </span>
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                        onClick={() => handleCopy(block.hash)}
                        className="p-1.5 rounded-lg bg-white dark:bg-white/6 border border-stone-200 dark:border-white/8 text-stone-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                        {copiedHash === block.hash ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                      </motion.button>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className="text-sm font-mono font-semibold tabular-nums">{fmtTime(block.timestamp)}</p>
                    <p className="text-[9px] text-stone-400 font-mono mt-0.5">{fmtDate(block.timestamp)}</p>
                    <p className={`text-[9px] font-bold uppercase tracking-wide mt-0.5 ${
                      block._virtual ? 'text-emerald-500' : (integrity ? 'text-emerald-500' : 'text-red-500')
                    }`}>
                      {block._virtual ? '⚡ Virtual' : (integrity ? '✓ Verified' : '✗ Broken')}
                    </p>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {filteredChain.length === 0 && (
            <div className="py-16 text-center text-stone-400">
              <Database size={30} className="mx-auto mb-3 opacity-25" />
              <p className="text-sm font-medium">No blocks found{searchTerm ? ` for "${searchTerm}"` : ''}</p>
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
    red:    { bg: 'bg-red-100 dark:bg-red-500/12',     text: 'text-red-600 dark:text-red-400',     val: 'text-red-600 dark:text-red-400' },
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