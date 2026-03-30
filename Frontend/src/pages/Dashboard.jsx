import React, { useState, useEffect, useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Activity, ShieldCheck, Search, Database, Globe, ChevronRight, ShieldAlert, Cpu as Brain, 
  RefreshCw, Heart, Sparkles, Thermometer, Droplets, Flame, X, Info,
  Play, Pause, Terminal, Radio, Share2, Copy, Check, Cpu, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
// ✅ IMPORT CENTRAL API
import API from '../services/api';

const Dashboard = ({
  chain = [],
  integrity = true,
  lastUpdated = "",
  connError = null,
  chainHeight = 0
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedHash, setCopiedHash] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
  
  // ✅ SIMULATION STATES
  const [isSimulating, setIsSimulating] = useState(false);
  const [simNode, setSimNode] = useState("SENSE_NODE_SIM_01");
  const [simLogs, setSimLogs] = useState([]);

  // 🧠 --- ORIGINAL AI ANALYSIS LOGIC (Kept exactly as is) ---
  const aiAnalysis = useMemo(() => {
    if (chain.length < 2) return { status: 'Initializing', message: 'Gathering neural data...', score: 100, anomalies: [] };
    const lastBlocks = chain.slice(-5);
    const latest = lastBlocks[lastBlocks.length - 1].data;
    const previous = lastBlocks[lastBlocks.length - 2].data;
    let anomalies = [];
    let score = 100;
    let message = "All systems operating within nominal parameters.";

    if (!integrity) {
      anomalies.push({ type: 'CRITICAL', msg: 'Cryptographic Breach' });
      score -= 50;
      message = "Emergency: Blockchain integrity compromise detected.";
    }
    const tempChange = Math.abs((latest.temperature || 0) - (previous.temperature || 0));
    if (tempChange > (previous.temperature * 0.1)) {
      anomalies.push({ type: 'WARNING', msg: 'Thermal Spike' });
      score -= 20;
      message = "Temperature fluctuation detected. Possible environmental anomaly.";
    }
    if (integrity && anomalies.length === 0) {
       if (latest.temperature > previous.temperature) message = "Blockchain growing steadily with a upward thermal trend.";
       else message = "Network pulse is stable. Data throughput is optimized.";
    }
    return { status: anomalies.length > 0 ? 'Anomaly Detected' : 'Stable', message, score: Math.max(score, 0), anomalies };
  }, [chain, integrity]);

  // 📊 --- CHART DATA MAPPING ---
  const telemetryData = useMemo(() => {
    return chain.slice(-20).map(b => ({
      index: `#${b.index}`,
      temp: Number(b.data?.temperature || 0),
      humidity: Number(b.data?.humidity || 0),
      timestamp: b.timestamp
    }));
  }, [chain]);

  // ✅ SIMULATION LOG ENGINE
  useEffect(() => {
    if (isSimulating) {
      const interval = setInterval(() => {
        const events = [
          `[INGEST] Block #${chainHeight + 1} SHA-256 Validated`,
          `[SYNC] Node ${simNode} pushing telemetry packet`,
          `[AUTH] Cryptographic Signature Verified`,
          `[DB] MongoDB Write-stream: SUCCESS`,
          `[NETWORK] Latency: 0.14ms Optimized`
        ];
        setSimLogs(prev => [events[Math.floor(Math.random() * events.length)], ...prev].slice(0, 5));
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isSimulating, simNode, chainHeight]);

  // ✅ UPDATED: Simulation Toggle using Cloud API
  const toggleSim = async () => {
    if (!isSimulating) {
      try {
        // ✅ Using API helper instead of direct localhost fetch
        await API.post(`/trigger_simulated_node/${simNode}`);
        setIsSimulating(true);
      } catch (err) { 
        console.error("Simulation Uplink Failed", err); 
        alert("Node simulation failed. Is the Render backend awake?");
      }
    } else {
      setIsSimulating(false);
    }
  };

  const handleCopy = (hash) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const filteredChain = useMemo(() => {
    return chain.filter(block => {
      const search = searchTerm.toLowerCase();
      return (
        String(block.index).includes(search) ||
        block.hash?.toLowerCase().includes(search) ||
        String(block.nonce || '').includes(search)
      );
    });
  }, [chain, searchTerm]);

  return (
    <div className="p-6 md:p-10 space-y-12 bg-transparent min-h-screen transition-all duration-700 relative">
      
      {/* ── HEADER SECTION ── */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-slate-200 dark:border-white/5 pb-10">
        <div>
          <h1 className="text-6xl font-black tracking-tighter text-slate-900 dark:text-white leading-none">
            Live <span className="text-blue-600">DashBoard</span>
          </h1>
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.5em] mt-4 italic flex items-center gap-3">
            <Sparkles size={14} className="text-blue-500 animate-pulse" /> Global Neural Telemetry Stream
          </p>
        </div>
        
        <div className="flex items-center gap-3 bg-white/40 dark:bg-white/5 backdrop-blur-xl p-1.5 rounded-[22px] border border-white dark:border-white/10 shadow-sm">
            <div className="flex flex-col items-end px-5 border-r border-slate-200 dark:border-white/10 font-mono">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Uplink Status</span>
                <span className={`text-[11px] font-black uppercase mt-0.5 ${connError ? 'text-rose-500' : 'text-emerald-500 animate-pulse'}`}>
                  {connError ? 'Disconnected' : 'Sync Active'}
                </span>
            </div>
            <div className="p-2.5 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-500/20">
                <RefreshCw size={18} className="animate-spin-slow" />
            </div>
        </div>
      </div>

      {/* ── STATS GRID ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Ledger Height" value={chainHeight} sub="Verified Blocks" color="blue" icon={<Database size={22} />} onClick={() => setActiveModal({title: 'Ledger Analytics', val: chainHeight, desc: 'Every block in SenseChain is linked via SHA-256 Fingerprints.'})} />
        <StatCard title="Health Score" value={`${aiAnalysis.score}%`} sub="Node Stability" color={aiAnalysis.score > 80 ? "emerald" : "rose"} icon={<Heart size={22} />} pulse={aiAnalysis.score < 80} onClick={() => setActiveModal({title: 'Stability Index', val: `${aiAnalysis.score}%`, desc: 'Based on neural drift and cryptographic consistency.'})} />
        <StatCard title="Security" value={integrity ? "Secure" : "Breach"} sub="Integrity Status" color={integrity ? "indigo" : "rose"} icon={integrity ? <ShieldCheck size={22} /> : <ShieldAlert size={22} />} onClick={() => setActiveModal({title: 'Forensic Audit', val: integrity ? 'Verified' : 'Breached', desc: 'SHA-256 Linkage verification across all neural clusters.'})} />
        <StatCard title="Latency" value="0.14ms" sub="Node Uplink" color="blue" icon={<Zap size={22} />} onClick={() => setActiveModal({title: 'Node Latency', val: '0.14ms', desc: 'Real-time packet propagation between nodes.'})} />
      </div>

      {/* ── 🚀 SIMULATION CONTROL LAB ── */}
      <div className="bg-white/50 dark:bg-[#0B1220]/60 backdrop-blur-3xl rounded-[40px] p-10 border border-white dark:border-white/5 shadow-2xl relative overflow-hidden group">
        <div className="absolute -top-10 -right-10 p-10 opacity-5 rotate-12"><Share2 size={240}/></div>
        <div className="flex flex-col md:flex-row items-center justify-between gap-10 relative z-10">
          <div className="flex items-center gap-8">
             <div className="p-6 bg-slate-900 dark:bg-blue-600 text-white rounded-[24px] shadow-2xl shadow-blue-500/20"><Terminal size={32} /></div>
             <div>
                <h3 className="text-3xl font-black uppercase italic dark:text-white tracking-tighter leading-none">Hardware Simulation Lab</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em] mt-2 italic">Inject Virtual Neural Clusters</p>
             </div>
          </div>
          <div className="flex items-center gap-4 bg-slate-100/50 dark:bg-black/40 p-3 rounded-3xl border border-white dark:border-white/5 backdrop-blur-md">
             <div className="px-6 border-r border-slate-200 dark:border-white/10">
                <span className="text-[8px] font-black text-slate-400 uppercase block mb-1 tracking-widest">Node ID</span>
                <input 
                  type="text" value={simNode} onChange={(e) => setSimNode(e.target.value)}
                  className="bg-transparent border-none outline-none text-xs font-black text-blue-600 uppercase italic w-44"
                />
             </div>
             <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleSim}
                className={`flex items-center gap-3 px-12 py-4 rounded-[18px] font-black text-[11px] uppercase tracking-widest transition-all ${isSimulating ? 'bg-rose-500 text-white shadow-xl shadow-rose-500/30 animate-pulse' : 'bg-blue-600 text-white shadow-xl shadow-blue-500/30'}`}
             >
                {isSimulating ? <Pause size={16} strokeWidth={3}/> : <Play size={16} strokeWidth={3}/>}
                {isSimulating ? 'Stop Uplink' : 'Deploy Node'}
             </motion.button>
          </div>
        </div>

        <AnimatePresence>
          {isSimulating && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8 pt-12 border-t border-slate-200 dark:border-white/5">
                <div className="lg:col-span-2 bg-slate-950/90 rounded-[32px] p-8 border border-blue-500/20 font-mono text-[11px] space-y-4 relative overflow-hidden shadow-inner">
                   <div className="absolute top-0 right-0 p-8 opacity-5"><Cpu size={120}/></div>
                   {simLogs.map((log, i) => (
                    <motion.p initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} key={i} className="text-slate-400 flex gap-5 border-l-2 border-blue-600/30 pl-4">
                        <span className="text-blue-500 font-black tabular-nums opacity-60">[{new Date().toLocaleTimeString()}]</span>
                        <span className="italic tracking-tight">{log}</span>
                    </motion.p>
                  ))}
                </div>
                <div className="bg-white/40 dark:bg-white/5 rounded-[32px] p-10 flex flex-col items-center justify-center text-center border border-white/20 dark:border-white/5 shadow-xl">
                  <div className="relative mb-6">
                     <motion.div animate={{ scale: [1, 1.8], opacity: [0.3, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute inset-0 bg-emerald-500 rounded-full" />
                     <div className="relative p-7 bg-emerald-500 text-white rounded-full shadow-[0_0_40px_rgba(16,185,129,0.4)]"><Radio size={36} /></div>
                  </div>
                  <h4 className="text-sm font-black dark:text-white uppercase tracking-[0.3em]">{simNode}</h4>
                  <p className="text-[10px] font-bold text-emerald-500 uppercase mt-2 animate-pulse tracking-widest">Broadcasting neural Packets...</p>
                </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── CHARTS SECTION ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white/60 dark:bg-[#0B1220]/60 backdrop-blur-3xl rounded-[40px] p-10 border border-white dark:border-white/5 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-12">
             <div className="flex items-center gap-5">
                <div className="p-4 bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 rounded-2xl"><Activity size={26}/></div>
                <h3 className="text-xl font-black uppercase italic dark:text-white tracking-tighter">Telemetry Convergence</h3>
             </div>
             <div className="flex gap-4">
                <div className="flex items-center gap-3 px-5 py-2.5 bg-rose-50 dark:bg-rose-600/10 rounded-2xl text-rose-600 text-[10px] font-black uppercase italic border border-rose-100 dark:border-rose-600/20">
                    <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]" /> Temp
                </div>
                <div className="flex items-center gap-3 px-5 py-2.5 bg-sky-50 dark:bg-sky-600/10 rounded-2xl text-sky-600 text-[10px] font-black uppercase italic border border-sky-100 dark:border-sky-600/20">
                    <div className="w-2 h-2 rounded-full bg-sky-500 shadow-[0_0_8px_#0ea5e9]" /> Humid
                </div>
             </div>
          </div>
          <div className="h-[420px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={telemetryData}>
                <defs>
                  <linearGradient id="gradTemp" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/><stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/></linearGradient>
                  <linearGradient id="gradHum" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4}/><stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.05} />
                <XAxis dataKey="index" hide />
                <YAxis fontSize={10} tick={{fontWeight: 'bold', fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="temp" stroke="#f43f5e" strokeWidth={5} fill="url(#gradTemp)" isAnimationActive={false} />
                <Area type="monotone" dataKey="humidity" stroke="#0ea5e9" strokeWidth={5} fill="url(#gradHum)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI SIDEBAR */}
        <div className="bg-slate-900 dark:bg-black rounded-[40px] p-12 text-white shadow-2xl relative overflow-hidden group border border-white/5 flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-[120px] animate-pulse" />
          <div className="relative z-10 space-y-12">
            <div className="flex items-center gap-6">
              <div className="p-5 bg-white/5 rounded-[24px] border border-white/10 text-blue-400 shadow-inner"><Brain size={36} /></div>
              <h3 className="text-xs font-black uppercase tracking-[0.6em] text-blue-300">Neural Brain</h3>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-[32px] p-8 space-y-8">
              <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-500 tracking-widest">
                  <p>Neural Load Status</p>
                  <div className="flex items-center gap-2 animate-pulse"><Flame size={14} className="text-rose-500"/><span className="text-rose-500">Live</span></div>
              </div>
              <div className="grid grid-cols-10 gap-2.5">
                {Array.from({length: 40}).map((_, i) => (
                  <div key={i} className={`h-4 rounded-[4px] transition-all duration-1000 ${integrity ? 'bg-emerald-500/20' : (i > 32 ? 'bg-rose-500 shadow-[0_0_12px_#f43f5e] animate-pulse' : 'bg-emerald-500/10 opacity-30')}`} />
                ))}
              </div>
            </div>
            <div className="p-10 bg-white/[0.03] border border-white/5 rounded-[32px] space-y-6 text-center shadow-inner">
                <div className="flex items-center justify-center gap-3 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  <div className={`w-2.5 h-2.5 rounded-full ${aiAnalysis.status === 'Stable' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-rose-500 animate-ping shadow-[0_0_8px_#f43f5e]'}`} /> 
                  Neural Inference
                </div>
                <p className="text-2xl font-black italic text-slate-100 leading-tight uppercase tracking-tighter">"{aiAnalysis.message}"</p>
            </div>
          </div>
          <div className="pt-10">
              <div className="flex justify-between text-[10px] font-black uppercase text-slate-500 mb-4 tracking-[0.4em]"><span>Node Load</span><span className="text-blue-400">Optimized</span></div>
              <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden shadow-inner">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${aiAnalysis.score}%` }} className="h-full bg-blue-600 shadow-[0_0_20px_#2563eb] rounded-full" />
              </div>
          </div>
        </div>
      </div>

      {/* ── VERIFIED LEDGER TABLE ── */}
      <div className="bg-white/60 dark:bg-[#0B1220]/60 backdrop-blur-3xl rounded-[40px] border border-white dark:border-white/5 shadow-2xl overflow-hidden mb-10">
          <div className="p-12 border-b border-slate-200 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="flex items-center gap-7">
                <div className="p-6 bg-slate-900 dark:bg-blue-600 text-white rounded-[24px] shadow-2xl"><Globe size={32}/></div>
                <div>
                  <h3 className="text-3xl font-black uppercase italic dark:text-white tracking-tighter leading-tight">Verified Ledger</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1 italic">Cryptographic SHA-256 Forensic Stream</p>
                </div>
            </div>
            <div className="relative w-full md:w-[550px] group">
              <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={24} />
              <input type="text" placeholder="QUERY LEDGER INDEX OR FINGERPRINT..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-20 pr-10 py-7 bg-slate-100/50 dark:bg-black/40 border-none rounded-[30px] text-xs font-black outline-none dark:text-white uppercase italic tracking-widest shadow-inner focus:ring-2 ring-blue-500/20 transition-all" />
            </div>
          </div>
          <div className="overflow-x-auto max-h-[700px] custom-scrollbar">
            <table className="w-full text-left">
                <thead className="bg-slate-50/50 dark:bg-black/20 sticky top-0 backdrop-blur-md z-10 border-b border-slate-200 dark:border-white/5">
                  <tr>
                    <th className="px-12 py-10 text-[10px] uppercase font-black text-slate-400 tracking-[0.4em]">Block Index</th>
                    <th className="px-8 py-10 text-[10px] uppercase font-black text-slate-400 tracking-[0.4em]">Proof (Nonce)</th>
                    <th className="px-12 py-10 text-[10px] uppercase font-black text-slate-400 tracking-[0.4em]">Fingerprint (SHA-256)</th>
                    <th className="px-12 py-10 text-right text-[10px] uppercase font-black text-slate-400 tracking-[0.4em]">Synched At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                  {filteredChain.slice().reverse().map(block => (
                    <tr key={block.index} className="hover:bg-blue-600/[0.03] transition-all group cursor-default">
                       <td className="px-12 py-12 font-black text-blue-600 italic text-4xl tracking-tighter">#{block.index}</td>
                       <td className="px-8 py-12">
                          <span className="px-6 py-2.5 bg-blue-50 dark:bg-blue-600/10 text-blue-600 rounded-[12px] text-[11px] font-black border border-blue-100 dark:border-blue-600/20 tabular-nums shadow-sm">
                            P-{block.nonce || '0'}
                          </span>
                       </td>
                       <td className="px-12 py-12">
                          <div className="flex items-center gap-5 group">
                             <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-white/5 px-6 py-4 rounded-[18px] border border-slate-200 dark:border-white/5 truncate max-w-[420px] shadow-sm tracking-tight">{block.hash}</span>
                             <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => handleCopy(block.hash)} className="opacity-0 group-hover:opacity-100 p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-white/10 transition-all">
                                {copiedHash === block.hash ? <Check size={20} className="text-emerald-500" /> : <Copy size={20} className="text-slate-400" />}
                             </motion.button>
                          </div>
                       </td>
                       <td className="px-12 py-12 text-right font-black text-[11px] text-slate-400 tabular-nums">
                          <div className="flex flex-col gap-3 uppercase italic tracking-tighter">
                             <span className="text-slate-900 dark:text-slate-200">{new Date(Number(block.timestamp) * (block.timestamp < 1e12 ? 1000 : 1)).toLocaleTimeString([], {hour12: false})}</span>
                             <span className={`px-3 py-1 rounded-full text-[8px] self-end border ${integrity ? 'text-emerald-500 border-emerald-500/30 bg-emerald-500/5' : 'text-rose-500 border-rose-500/30 bg-rose-500/5 shadow-[0_0_10px_#f43f5e]'}`}>
                               {integrity ? 'Verified Secure' : 'Integrity Breach'}
                             </span>
                          </div>
                       </td>
                    </tr>
                  ))}
                </tbody>
            </table>
          </div>
      </div>

      {/* ── DETAIL MODAL ── */}
      <AnimatePresence>{activeModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-[#020617]/80 backdrop-blur-xl" onClick={() => setActiveModal(null)}>
            <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }} className="bg-white dark:bg-[#0B1220] w-full max-w-lg rounded-[50px] p-16 shadow-[0_40px_100px_rgba(0,0,0,0.4)] border border-white dark:border-white/10 relative overflow-hidden" onClick={e => e.stopPropagation()}>
              <button onClick={() => setActiveModal(null)} className="absolute top-10 right-10 p-3 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors text-slate-400"><X size={32} /></button>
              <div className="flex items-center gap-7 mb-10">
                <div className="p-6 bg-blue-50 dark:bg-blue-600/20 rounded-[28px] text-blue-600 shadow-inner"><Info size={44} /></div>
                <h2 className="text-4xl font-black uppercase italic dark:text-white leading-none tracking-tighter">{activeModal.title}</h2>
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-bold mb-12 text-xl italic uppercase tracking-tight leading-relaxed">{activeModal.desc}</p>
              <div className="bg-slate-100/50 dark:bg-black/60 rounded-[40px] text-center p-16 border border-white dark:border-white/5 shadow-inner">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em] mb-4 block">Neural Snapshot</span>
                <p className="text-8xl font-black text-blue-600 italic tracking-tighter tabular-nums">{activeModal.val}</p>
              </div>
            </motion.div>
          </motion.div>
      )}</AnimatePresence>
    </div>
  );
};

// --- STAT CARD COMPONENT ---
const StatCard = ({ title, value, sub, icon, color, pulse, onClick }) => {
  const themes = { 
    blue: "border-blue-500 text-blue-600 bg-blue-50/20 shadow-blue-500/5", 
    emerald: "border-emerald-500 text-emerald-600 bg-emerald-50/20 shadow-emerald-500/5", 
    rose: "border-rose-500 text-rose-600 bg-rose-50/20 shadow-rose-500/5", 
    indigo: "border-indigo-500 text-indigo-600 bg-indigo-50/20 shadow-indigo-500/5" 
  };
  return (
    <motion.div 
      whileHover={{ y: -8, scale: 1.02 }}
      onClick={onClick} 
      className={`p-10 rounded-[35px] border-l-[12px] bg-white/70 dark:bg-[#0B1220]/70 backdrop-blur-xl border border-slate-200 dark:border-white/5 transition-all cursor-pointer group relative overflow-hidden shadow-2xl ${themes[color]} ${pulse ? 'animate-pulse' : ''}`}
    >
      <div className="flex justify-between items-start mb-8">
        <div className="p-5 bg-white dark:bg-white/5 rounded-[20px] shadow-sm border border-slate-100 dark:border-white/5 group-hover:scale-110 transition-transform duration-500">{icon}</div>
        <div className="text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">{title}</p>
          <h3 className="text-5xl font-black dark:text-white italic tracking-tighter leading-none tabular-nums">{value}</h3>
        </div>
      </div>
      <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-white/5">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{sub}</p>
        <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-500 transition-all" />
      </div>
    </motion.div>
  );
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload) return null;
  return (
    <div className="p-7 bg-[#0B1220]/95 backdrop-blur-3xl text-white rounded-[30px] border border-white/10 space-y-6 shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
      <p className="text-[11px] font-black text-blue-400 uppercase tracking-[0.4em] border-b border-white/10 pb-3 flex items-center gap-3"><Activity size={14} /> Neural Data Link</p>
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-16">
          <div className="flex items-center gap-3"><Thermometer size={20} className="text-rose-500" /><span className="text-[11px] font-black text-slate-400 uppercase italic">Thermal</span></div>
          <span className="text-xl font-black text-rose-500 tabular-nums">{payload[0]?.value}°C</span>
        </div>
        <div className="flex items-center justify-between gap-16">
          <div className="flex items-center gap-3"><Droplets size={20} className="text-sky-500" /><span className="text-[11px] font-black text-slate-400 uppercase italic">Humidity</span></div>
          <span className="text-xl font-black text-sky-500 tabular-nums">{payload[1]?.value}%</span>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;