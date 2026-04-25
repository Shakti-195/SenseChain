import { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, AreaChart, Area,
} from 'recharts';
import {
  Activity, Zap, Database, ShieldCheck, ShieldAlert,
  TrendingUp, Cpu, Thermometer, Droplets,
  Wifi, Bluetooth, Signal, ChevronRight, Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBreach } from '../context/BreachContext';

// ── Helpers ──────────────────────────────────────────────────────────────────
const LOCAL_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
const fmtTime = (ts) => {
  if (!ts && ts !== 0) return '--:--:--';
  try {
    const ms = Number(ts) < 1e12 ? Number(ts) * 1000 : Number(ts);
    return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: LOCAL_TZ }).format(new Date(ms));
  } catch { return '--:--:--'; }
};

// ── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ title, value, suffix, icon, color, pulse, onClick }) => {
  const isDanger = color === 'red' || color === 'danger';
  const iconBg    = isDanger ? 'rgba(220,38,38,0.10)' : 'var(--th-glow)';
  const iconColor = isDanger ? '#dc2626'               : 'var(--th-primary)';
  const valColor  = isDanger ? '#dc2626'               : 'var(--th-primary)';

  return (
    <motion.div whileHover={{ y: -3 }} onClick={onClick}
      className={`glass-card rounded-[22px] p-6 cursor-pointer relative overflow-hidden transition-all ${pulse ? 'breach-glow' : ''}`}>
      {/* Ambient glow blob */}
      <div className="absolute top-0 right-0 -translate-y-1/3 translate-x-1/3 w-24 h-24 rounded-full blur-2xl opacity-15 pointer-events-none transition-colors duration-500"
        style={{ background: isDanger ? '#ef4444' : 'var(--th-primary)' }} />
      <div className="inline-flex p-2.5 rounded-xl mb-4 transition-colors duration-500"
        style={{ backgroundColor: iconBg, color: iconColor }}>{icon}</div>
      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1" style={{ fontFamily: 'Space Grotesk' }}>{title}</p>
      <div className="flex items-end gap-2">
        <h4 className="text-2xl font-bold tracking-tight font-mono tabular-nums transition-colors duration-500"
          style={{ color: valColor }}>{value}</h4>
        {suffix && <span className="text-[10px] text-stone-500 mb-0.5 font-mono">{suffix}</span>}
      </div>
      {onClick && <ChevronRight size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-stone-400" />}
    </motion.div>
  );
};

// ── Chart Tooltip ────────────────────────────────────────────────────────────
const RedTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card rounded-xl p-3 shadow-xl border border-white/8 min-w-[130px]">
      <p className="text-[9px] font-bold text-red-500 uppercase tracking-widest mb-1.5">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <span className="text-[10px] text-stone-400">{p.name}</span>
          <span className="text-xs font-bold font-mono" style={{ color: p.color }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ── Main ─────────────────────────────────────────────────────────────────────
const Analytics = ({ integrity = true, chainHeight = 0 }) => {
  const { virtualBlocks, pairedNodes, isSimulating, simBlockCount, virtualBreach, breachedBlock } = useBreach();

  const isBreached = !integrity || virtualBreach;
  const liveNodes  = pairedNodes.filter(n => n.status === 'Live');

  // ── Block chart data (nonce per virtual block) ──
  const blockChartData = useMemo(() => {
    if (virtualBlocks.length === 0) return [];
    return virtualBlocks.slice(-15).map(b => ({
      block: `#${b.index}`,
      nonce: b.nonce || 0,
      temp:  (() => { try { const d = typeof b.data === 'string' ? JSON.parse(b.data) : b.data; return +(d?.temperature ?? 0).toFixed(1); } catch { return 0; } })(),
      hum:   (() => { try { const d = typeof b.data === 'string' ? JSON.parse(b.data) : b.data; return +(d?.humidity ?? 0).toFixed(1); } catch { return 0; } })(),
      nodeId: b._nodeId ?? 'Node',
    }));
  }, [virtualBlocks]);

  // ── Per-node performance ──
  const nodeStats = useMemo(() => {
    return pairedNodes.map(node => {
      const nodeBlocks = virtualBlocks.filter(b => b._nodeId === node.id);
      const temps = nodeBlocks.map(b => { try { const d = typeof b.data === 'string' ? JSON.parse(b.data) : b.data; return d?.temperature ?? 0; } catch { return 0; } });
      const avgTemp = temps.length ? (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1) : '--';
      return { ...node, blockCount: nodeBlocks.length, avgTemp };
    });
  }, [pairedNodes, virtualBlocks]);

  // ── Breach: pre-computed corrupted chart data (computed in JS, NOT inline JSX to avoid parse errors) ──
  const FALLBACK_BLOCKS = Array.from({ length: 8 }, (_, i) => ({ block: '#' + i, nonce: 0, temp: 0, hum: 0, nodeId: 'chain' }));

  const corruptedBarData = useMemo(() => {
    const base = blockChartData.length > 0 ? blockChartData : FALLBACK_BLOCKS;
    return base.map((d, i) => ({
      ...d,
      nonce: Math.round(Math.abs(Math.sin(i * 1.9) * 180000 + Math.random() * 60000)),
    }));
  }, [isBreached, blockChartData]); // eslint-disable-line react-hooks/exhaustive-deps

  const corruptedAreaData = useMemo(() => {
    const base = blockChartData.length > 0 ? blockChartData : FALLBACK_BLOCKS;
    return base.map((d, i) => ({
      ...d,
      temp: parseFloat((88 + Math.sin(i * 1.8) * 10 + Math.random() * 7).toFixed(1)),
      hum:  parseFloat((5  + Math.cos(i * 2.2) * 4  + Math.random() * 4).toFixed(1)),
    }));
  }, [isBreached, blockChartData]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Stat values ──
  const totalBlocks = chainHeight + simBlockCount;
  const latestBlock = virtualBlocks[virtualBlocks.length - 1];
  const latestNonce = latestBlock?.nonce ?? '--';
  const latestTemp  = latestBlock ? (() => { try { const d = typeof latestBlock.data === 'string' ? JSON.parse(latestBlock.data) : latestBlock.data; return d?.temperature?.toFixed(1) ?? '--'; } catch { return '--'; } })() : '--';

  const nodeColors = ['#ef4444', '#8b5cf6', '#06b6d4', '#f59e0b', '#10b981'];

  return (
    <div className="page-wrapper space-y-6 custom-scrollbar">

      {/* ── PAGE HEADER ── */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest chip-red">
              <Sparkles size={9} /> Live Analytics
            </span>
            {isSimulating && (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {liveNodes.length} Node{liveNodes.length !== 1 ? 's' : ''} Mining
              </span>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight" style={{ fontFamily: 'Space Grotesk' }}>
            Network <span className="bg-gradient-to-r from-red-600 to-rose-500 bg-clip-text text-transparent">Analytics</span>
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
            PoW metrics &amp; node telemetry · <span className="font-mono text-xs text-red-400">{LOCAL_TZ}</span>
          </p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border ${
          isBreached
            ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'
            : isSimulating
            ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400'
            : 'bg-stone-50 dark:bg-white/5 border-stone-200 dark:border-white/8 text-stone-500'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${isBreached ? 'bg-red-500 animate-ping' : isSimulating ? 'bg-emerald-500 animate-pulse' : 'bg-stone-400'}`} />
          {isBreached ? '⚡ Breach Detected' : isSimulating ? `Simulation Active · ${simBlockCount} blocks` : 'Awaiting Data'}
        </div>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Blocks" value={totalBlocks} suffix="blocks" icon={<Database size={17} />} color="theme" />
        <StatCard title="Live Nodes" value={liveNodes.length || '—'} suffix={liveNodes.length > 0 ? 'mining' : 'none'} icon={<Signal size={17} />} color="theme" />
        <StatCard title="Latest Nonce" value={latestNonce} suffix="iters" icon={<Zap size={17} />} color="theme" />
        <StatCard title="System Status"
          value={isBreached ? 'CRITICAL' : 'Nominal'}
          suffix={isBreached ? 'SHA breach' : 'SHA-256 OK'}
          icon={isBreached ? <ShieldAlert size={17} /> : <ShieldCheck size={17} />}
          color={isBreached ? 'danger' : 'theme'} pulse={isBreached} />
      </div>

      {/* ── CHARTS ROW ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Nonce / Compute Distribution */}
        <div className={`glass-card rounded-[22px] p-6 transition-all duration-700 ${
          isBreached ? 'border border-red-500/30 shadow-red-900/20' : ''
        }`}>
          <div className="flex items-center gap-3 mb-5">
            <div className={`p-2.5 rounded-xl transition-all duration-500 ${
              isBreached ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-red-100 dark:bg-red-500/12 text-red-600 dark:text-red-400'
            }`}><Activity size={16} /></div>
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2" style={{ fontFamily: 'Space Grotesk' }}>
                {isBreached ? 'Compute Stream' : 'Compute Distribution'}
                {isBreached && (
                  <motion.span animate={{ opacity: [1,0.2,1] }} transition={{ repeat: Infinity, duration: 0.5 }}
                    className="text-[9px] font-black text-red-500 bg-red-500/10 border border-red-500/30 px-2 py-0.5 rounded-full uppercase tracking-widest">
                    ⚡ FORGED
                  </motion.span>
                )}
              </h3>
              <p className="text-[10px] text-stone-400">
                {isBreached ? 'Nonce values corrupted · PoW chain compromised' : 'Nonce iterations per mined block · last 15'}
              </p>
            </div>
          </div>
          {blockChartData.length === 0 && !isBreached ? (
            <div className="h-[240px] flex flex-col items-center justify-center text-stone-400 border-2 border-dashed border-white/5 rounded-2xl">
              <Activity size={28} className="mb-2 opacity-20" />
              <p className="text-xs">No blocks yet — pair a node to start mining</p>
            </div>
          ) : (
            <div className="h-[240px] relative">
              {/* Breach overlay */}
              <AnimatePresence>
                {isBreached && (
                  <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                    className="absolute inset-0 z-10 rounded-xl overflow-hidden pointer-events-none">
                    <div className="absolute inset-0 bg-red-900/20" />
                    <motion.div animate={{ y:['-100%','200%'] }} transition={{ repeat:Infinity, duration:2, ease:'linear' }}
                      className="absolute left-0 right-0 h-6 bg-gradient-to-b from-transparent via-red-500/20 to-transparent" />
                    {[15,40,65,88].map(p => (
                      <motion.div key={p} animate={{ opacity:[0,1,0], scaleX:[0.4,1,0.5] }}
                        transition={{ repeat:Infinity, duration:0.35+p*0.006, delay:p*0.008 }}
                        className="absolute left-0 right-0 h-px bg-red-400/40" style={{ top:`${p}%` }} />
                    ))}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <motion.p animate={{ opacity:[1,0.15,1], x:[-1,2,-1,0] }} transition={{ repeat:Infinity, duration:0.35 }}
                        className="text-red-500 font-black text-sm uppercase tracking-[0.25em]"
                        style={{ fontFamily:'JetBrains Mono,monospace', textShadow:'0 0 16px #ef4444' }}>
                        ⚡ NONCE FORGED
                      </motion.p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={isBreached ? corruptedBarData : blockChartData}
                  margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} strokeOpacity={isBreached ? 0.03 : 0.05} />
                  <XAxis dataKey="block" tick={{ fontSize:9, fontFamily:'JetBrains Mono', fill: isBreached ? '#ef4444' : '#6b7280' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize:9, fontFamily:'JetBrains Mono', fill: isBreached ? '#ef4444' : '#6b7280' }} tickLine={false} axisLine={false} />
                  <Tooltip content={<RedTooltip />} />
                  <Bar dataKey="nonce" name="Nonce" radius={[6,6,2,2]} barSize={28}>
                    {(isBreached ? corruptedBarData : blockChartData).map((_, i) => (
                      <Cell key={i} fill="#dc2626" opacity={isBreached ? (0.5 + (i % 3) * 0.2) : (i === blockChartData.length - 1 ? 1 : 0.55)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Temperature Stream */}
        <div className={`glass-card rounded-[22px] p-6 transition-all duration-700 ${
          isBreached ? 'border border-red-500/30' : ''
        }`}>
          <div className="flex items-center gap-3 mb-5">
            <div className={`p-2.5 rounded-xl transition-all duration-500 ${
              isBreached ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-red-100 dark:bg-red-500/12 text-red-600 dark:text-red-400'
            }`}><Thermometer size={16} /></div>
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2" style={{ fontFamily: 'Space Grotesk' }}>
                {isBreached ? 'Thermal Stream' : 'Thermal + Humidity Stream'}
                {isBreached && (
                  <motion.span animate={{ opacity:[1,0.2,1] }} transition={{ repeat:Infinity, duration:0.5 }}
                    className="text-[9px] font-black text-red-500 bg-red-500/10 border border-red-500/30 px-2 py-0.5 rounded-full uppercase tracking-widest">
                    ⚡ CORRUPTED
                  </motion.span>
                )}
              </h3>
              <p className="text-[10px] text-stone-400">
                {isBreached ? 'Sensor data compromised · Values forged' : 'Sensor telemetry per block · IoT drift simulation'}
              </p>
            </div>
          </div>
          {blockChartData.length === 0 && !isBreached ? (
            <div className="h-[240px] flex flex-col items-center justify-center text-stone-400 border-2 border-dashed border-white/5 rounded-2xl">
              <Thermometer size={28} className="mb-2 opacity-20" />
              <p className="text-xs">Awaiting telemetry from paired nodes</p>
            </div>
          ) : (
            <div className="h-[240px] relative">
              {/* Breach overlay */}
              <AnimatePresence>
                {isBreached && (
                  <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                    className="absolute inset-0 z-10 rounded-xl overflow-hidden pointer-events-none">
                    <div className="absolute inset-0 bg-red-900/20" />
                    <motion.div animate={{ y:['-100%','200%'] }} transition={{ repeat:Infinity, duration:2.2, ease:'linear' }}
                      className="absolute left-0 right-0 h-6 bg-gradient-to-b from-transparent via-red-500/20 to-transparent" />
                    {[25,50,75].map(p => (
                      <motion.div key={p} animate={{ opacity:[0,1,0], scaleX:[0.3,1,0.4] }}
                        transition={{ repeat:Infinity, duration:0.4+p*0.005, delay:p*0.01 }}
                        className="absolute left-0 right-0 h-px bg-red-400/40" style={{ top:`${p}%` }} />
                    ))}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <motion.p animate={{ opacity:[1,0.15,1], x:[-2,1,-1,0] }} transition={{ repeat:Infinity, duration:0.35 }}
                        className="text-red-500 font-black text-sm uppercase tracking-[0.25em]"
                        style={{ fontFamily:'JetBrains Mono,monospace', textShadow:'0 0 16px #ef4444' }}>
                        ⚡ DATA CORRUPTED
                      </motion.p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={isBreached ? corruptedAreaData : blockChartData}
                  margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="aTemp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#dc2626" stopOpacity={isBreached ? 0.5 : 0.3} />
                      <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="aHum" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={isBreached ? '#dc2626' : '#0ea5e9'} stopOpacity={isBreached ? 0.25 : 0.2} />
                      <stop offset="95%" stopColor={isBreached ? '#dc2626' : '#0ea5e9'} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} strokeOpacity={isBreached ? 0.03 : 0.05} />
                  <XAxis dataKey="block" tick={{ fontSize:9, fontFamily:'JetBrains Mono', fill: isBreached ? '#ef4444' : '#6b7280' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize:9, fontFamily:'JetBrains Mono', fill: isBreached ? '#ef4444' : '#6b7280' }} tickLine={false} axisLine={false} domain={isBreached ? [0, 110] : ['dataMin - 2', 'dataMax + 2']} />
                  <Tooltip content={<RedTooltip />} />
                  <Area type={isBreached ? 'basis' : 'monotone'} dataKey="temp" name="Temp °C"
                    stroke="#dc2626" strokeWidth={2} fill="url(#aTemp)" dot={false} activeDot={{ r:4 }} isAnimationActive={false} />
                  <Area type={isBreached ? 'basis' : 'monotone'} dataKey="hum" name="Humidity %"
                    stroke={isBreached ? '#ef4444' : '#0ea5e9'} strokeWidth={isBreached ? 1.5 : 2}
                    strokeDasharray={isBreached ? '4 2' : '0'}
                    fill="url(#aHum)" dot={false} activeDot={{ r:4 }} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* ── NODE PERFORMANCE TABLE ── */}
      <div className="glass-card rounded-[22px] overflow-hidden">
        <div className="p-6 md:p-8 border-b border-stone-100 dark:border-white/5 flex items-center gap-3">
          <div className="p-2.5 rounded-xl" style={{ backgroundColor: 'var(--th-glow)', color: 'var(--th-primary)' }}><Cpu size={18} /></div>
          <div>
            <h3 className="text-sm font-bold" style={{ fontFamily: 'Space Grotesk' }}>Node Performance</h3>
            <p className="text-[10px] text-stone-400">{nodeStats.length} device{nodeStats.length !== 1 ? 's' : ''} registered · real-time per-node metrics</p>
          </div>
        </div>

        {nodeStats.length === 0 ? (
          <div className="py-16 text-center text-stone-400">
            <Signal size={30} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium">No nodes paired yet</p>
            <p className="text-xs mt-1 text-stone-500">Go to Uplink Terminal to pair WiFi or Bluetooth hardware</p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left min-w-[640px]">
              <thead>
                <tr className="border-b border-stone-100 dark:border-white/5">
                  {['Node ID', 'Type', 'Status', 'Blocks Mined', 'Avg Temp', 'Signal', 'Battery'].map((h, i) => (
                    <th key={h} className={`px-6 py-3 text-[9px] font-bold text-stone-400 uppercase tracking-widest ${i >= 3 ? 'text-center' : ''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50 dark:divide-white/3">
                {nodeStats.map((node, i) => {
                  const c = nodeColors[i % nodeColors.length];
                  const dbm = parseInt(node.rssi) || -70;
                  const strength = dbm > -50 ? 4 : dbm > -60 ? 3 : dbm > -70 ? 2 : 1;
                  const bat = node.battery ?? 100;
                  return (
                    <motion.tr key={node.id} layout
                      className={`transition-colors hover:bg-stone-50 dark:hover:bg-white/2 ${isBreached && node.status === 'Live' ? 'bg-red-50/40 dark:bg-red-900/8' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c }} />
                          <span className="text-xs font-bold font-mono text-stone-200 truncate max-w-[160px]">{node.id}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold border ${node.type === 'WiFi' ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' : 'text-violet-400 bg-violet-500/10 border-violet-500/20'}`}>
                          {node.type === 'WiFi' ? <Wifi size={9} /> : <Bluetooth size={9} />}
                          {node.type}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                          isBreached && node.status === 'Live'
                            ? 'text-red-400 bg-red-500/10 border-red-500/20'
                            : node.status === 'Live'
                            ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                            : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${node.status === 'Live' ? (isBreached ? 'bg-red-400' : 'bg-emerald-400 animate-pulse') : 'bg-amber-400 animate-pulse'}`} />
                          {isBreached && node.status === 'Live' ? 'Compromised' : node.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-bold font-mono text-red-400">{node.blocksMined ?? node.blockCount ?? 0}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-sm font-bold font-mono ${isBreached ? 'text-red-500' : 'text-rose-400'}`}>
                          {isBreached ? '99.9°C' : (node.lastTemp ? `${node.lastTemp.toFixed(1)}°C` : `${node.avgTemp}°C`)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-end justify-center gap-0.5 h-3">
                          {[1,2,3,4].map(s => (
                            <div key={s} className={`w-1 rounded-sm ${s <= strength ? 'bg-emerald-400' : 'bg-white/10'}`} style={{ height: `${s * 25}%` }} />
                          ))}
                        </div>
                        <span className="text-[8px] text-stone-500 font-mono">{node.rssi}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-xs font-bold font-mono ${bat > 50 ? 'text-emerald-400' : bat > 20 ? 'text-amber-400' : 'text-red-400'}`}>{bat}%</span>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── BLOCK BROADCAST LOG ── */}
      <div className="glass-card rounded-[22px] overflow-hidden">
        <div className="p-6 md:p-8 border-b border-stone-100 dark:border-white/5 flex items-center gap-3">
          <div className="p-2.5 rounded-xl" style={{ backgroundColor: 'var(--th-glow)', color: 'var(--th-primary)' }}><TrendingUp size={18} /></div>
          <div>
            <h3 className="text-sm font-bold" style={{ fontFamily: 'Space Grotesk' }}>Block Broadcast Log</h3>
            <p className="text-[10px] text-stone-400">Real-time ledger entries from paired hardware · {virtualBlocks.length} blocks total</p>
          </div>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left min-w-[580px]">
            <thead>
              <tr className="border-b border-stone-100 dark:border-white/5">
                {['Block', 'Timestamp', 'Source Node', 'Temp', 'Hum', 'Status'].map((h, i) => (
                  <th key={h} className={`px-6 py-3 text-[9px] font-bold text-stone-400 uppercase tracking-widest ${i === 5 ? 'text-right' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50 dark:divide-white/3">
              {[...virtualBlocks].reverse().slice(0, 15).map((block, idx) => {
                const isCorrupted = isBreached;
                let temp = '--', hum = '--';
                try { const d = typeof block.data === 'string' ? JSON.parse(block.data) : block.data; temp = d?.temperature?.toFixed(1) ?? '--'; hum = d?.humidity?.toFixed(1) ?? '--'; } catch {}
                const nodeIdx = pairedNodes.findIndex(n => n.id === block._nodeId);
                const nc = nodeColors[nodeIdx >= 0 ? nodeIdx % nodeColors.length : 0];
                return (
                  <motion.tr key={block.hash || idx} layout
                    className={`transition-colors ${isCorrupted ? 'bg-red-50/40 dark:bg-red-900/8' : 'hover:bg-stone-50 dark:hover:bg-white/2'}`}>
                    <td className="px-6 py-3">
                      <span className={`text-sm font-bold font-mono ${isCorrupted ? 'text-red-500' : 'text-red-600 dark:text-red-400'}`}>#{block.index}</span>
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-[10px] font-mono text-stone-400">{fmtTime(block.timestamp)}</span>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: nc }} />
                        <span className="text-[10px] font-mono text-stone-300 truncate max-w-[120px]">{block._nodeId?.split('-')[0] ?? 'Node'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`text-[10px] font-mono font-bold ${isCorrupted ? 'text-red-400' : 'text-rose-400'}`}>
                        {isCorrupted ? '99.9°C' : `${temp}°C`}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-[10px] font-mono text-sky-400">{hum}%</span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <span className={`text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${
                        isCorrupted ? 'bg-red-500/10 border-red-500/30 text-red-500 animate-pulse' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                      }`}>
                        {isCorrupted ? '✗ Corrupted' : '✓ Confirmed'}
                      </span>
                    </td>
                  </motion.tr>
                );
              })}
              {virtualBlocks.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-stone-400 text-xs">
                    <Database size={28} className="mx-auto mb-2 opacity-20" />
                    <p className="font-medium">No blocks broadcast yet</p>
                    <p className="text-[10px] mt-1 text-stone-500">Pair hardware in Uplink Terminal to start the ledger</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-center text-[10px] text-stone-400 dark:text-stone-700 pb-4 uppercase tracking-widest">
        SenseChain Neural Infrastructure · PoW Forensic Analytics Layer
      </p>
    </div>
  );
};

export default Analytics;