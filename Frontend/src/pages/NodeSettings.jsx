import { useState, useEffect } from 'react';
import {
  Cpu, Database, RefreshCw, Trash2,
  Save, AlertTriangle, Gauge, Signal,
  Wifi, Bluetooth, Thermometer, Droplets,
  Sparkles, ShieldCheck, ShieldAlert, Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBreach } from '../context/BreachContext';
import api from '../services/api';

const LOCAL_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;

// ── Mini stat pill ────────────────────────────────────────────────────────────
const InfoPill = ({ label, value, color = 'red' }) => {
  const colors = {
    red:   'text-red-400 bg-red-500/10 border-red-500/20',
    green: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    violet:'text-violet-400 bg-violet-500/10 border-violet-500/20',
    sky:   'text-sky-400 bg-sky-500/10 border-sky-500/20',
  };
  return (
    <div className="text-center">
      <p className="text-[9px] text-stone-500 uppercase tracking-widest mb-1">{label}</p>
      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold font-mono border ${colors[color] ?? colors.red}`}>{value}</span>
    </div>
  );
};

// ── Main ─────────────────────────────────────────────────────────────────────
const NodeSettings = ({ chainHeight = 0, integrity = true, lastUpdated = '' }) => {
  const { pairedNodes, virtualBlocks, isSimulating, simBlockCount, virtualBreach } = useBreach();

  const [difficulty, setDifficulty] = useState(3);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);   // { type: 'ok'|'err', text }
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const isBreached = !integrity || virtualBreach;
  const liveNodes  = pairedNodes.filter(n => n.status === 'Live');
  const totalBlocks = chainHeight + simBlockCount;

  // ── Fetch difficulty from backend ──
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/difficulty');
        if (res.data?.difficulty !== undefined) setDifficulty(res.data.difficulty);
      } catch { 
        // Backend offline — load from localStorage
        const stored = localStorage.getItem('sc_difficulty');
        if (stored) setDifficulty(parseInt(stored));
      }
    })();
  }, []);

  // ── Save difficulty: localStorage first (instant), backend in background ──
  const handleSave = () => {
    // 1. Save locally immediately
    localStorage.setItem('sc_difficulty', String(difficulty));
    setSaveMsg({ type: 'ok', text: `Consensus target set to ${difficulty} leading zeros. Configuration saved.` });
    setTimeout(() => setSaveMsg(null), 3500);

    // 2. Try backend silently in background (no blocking, no error shown to user)
    api.post('/update_config', { difficulty }).catch(() => {
      // Silently ignored — localStorage is the source of truth for offline/demo mode
    });
  };

  // ── Reset ledger ──
  const handleReset = async () => {
    setIsResetting(true);
    try {
      await api.post('/reset_ledger');
      setShowResetConfirm(false);
      window.location.href = '/';
    } catch {
      setSaveMsg({ type: 'err', text: 'Ledger reset failed or endpoint unavailable.' });
      setShowResetConfirm(false);
    }
    setIsResetting(false);
  };

  const nodeColors = ['#ef4444', '#8b5cf6', '#06b6d4', '#f59e0b', '#10b981'];

  return (
    <div className="page-wrapper space-y-6 custom-scrollbar">

      {/* ── PAGE HEADER ── */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest chip-red">
              <Sparkles size={9} /> Node Config
            </span>
            {isBreached && (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-red-500/10 border border-red-500/20 text-red-400 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" /> ⚡ Breach Active
              </span>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight" style={{ fontFamily: 'Space Grotesk' }}>
            Node <span className="bg-gradient-to-r from-red-600 to-rose-500 bg-clip-text text-transparent">Configuration</span>
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
            Consensus engine · hardware management · <span className="font-mono text-xs text-red-400">{LOCAL_TZ}</span>
          </p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border ${
          isBreached
            ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'
            : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${isBreached ? 'bg-red-500 animate-ping' : 'bg-emerald-500 animate-pulse'}`} />
          {isBreached ? 'Integrity Breach' : isSimulating ? `${liveNodes.length} Node${liveNodes.length !== 1 ? 's' : ''} Live` : 'Secure'}
        </div>
      </motion.div>

      {/* ── SUMMARY STATS ROW ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Blocks', value: totalBlocks, icon: <Database size={16} />, danger: false },
          { label: 'Live Nodes',   value: `${liveNodes.length} / ${pairedNodes.length}`, icon: <Signal size={16} />, danger: false },
          { label: 'Proof Difficulty', value: `${difficulty} Zeros`, icon: <Zap size={16} />, danger: false },
          { label: 'Chain Status', value: isBreached ? 'Breached' : 'Secure', icon: isBreached ? <ShieldAlert size={16} /> : <ShieldCheck size={16} />, danger: isBreached },
        ].map(({ label, value, icon, danger }) => (
          <motion.div key={label} whileHover={{ y: -2 }} className="glass-card rounded-2xl p-5">
            <div className="p-2 rounded-xl inline-flex mb-3"
              style={{ backgroundColor: danger ? 'rgba(220,38,38,0.10)' : 'var(--th-glow)', color: danger ? '#dc2626' : 'var(--th-primary)' }}>
              {icon}
            </div>
            <p className="text-xl font-bold font-mono"
              style={{ color: danger ? '#dc2626' : 'var(--th-primary)' }}>{value}</p>
            <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 mt-1 uppercase tracking-wide">{label}</p>
          </motion.div>
        ))}
      </div>

      {/* ── SETTINGS + MAINTENANCE GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* CONSENSUS ENGINE */}
        <div className="lg:col-span-2 glass-card rounded-[22px] p-6 md:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-48 h-48 rounded-full blur-3xl pointer-events-none" style={{ background: 'var(--th-glow)' }} />
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="p-2.5 rounded-xl" style={{ backgroundColor: 'var(--th-glow)', color: 'var(--th-primary)' }}><Cpu size={18} /></div>
            <div>
              <h3 className="text-sm font-bold" style={{ fontFamily: 'Space Grotesk' }}>Consensus Engine</h3>
              <p className="text-[10px] text-stone-400">SHA-256 proof-of-work difficulty scaling</p>
            </div>
          </div>

          <div className="relative z-10 space-y-6">
            <div>
              <div className="flex justify-between items-end mb-3">
                <div>
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Leading Zeros Target</p>
                  <p className="text-[10px] text-stone-500 mt-0.5">Higher = harder mining · more compute per block</p>
                </div>
                <span className="text-5xl font-black font-mono" style={{ fontFamily: 'Space Grotesk', color: 'var(--th-primary)' }}>{difficulty}</span>
              </div>
              <input
                type="range" min="1" max="6" value={difficulty}
                onChange={e => setDifficulty(parseInt(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: 'var(--th-primary)', background: `linear-gradient(to right, var(--th-primary) ${(difficulty-1)/5*100}%, rgba(255,255,255,0.1) ${(difficulty-1)/5*100}%)` }}
              />
              <div className="flex justify-between text-[9px] text-stone-600 font-mono mt-1.5">
                {[1,2,3,4,5,6].map(n => <span key={n} style={{ color: n === difficulty ? 'var(--th-primary)' : undefined }}>{n}</span>)}
              </div>
            </div>

            {/* Difficulty explanation */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { level: '1–2', color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5', label: 'Low', desc: 'Fast blocks, low security' },
                { level: '3–4', color: 'text-amber-400 border-amber-500/20 bg-amber-500/5', label: 'Medium', desc: 'Balanced (recommended)' },
                { level: '5–6', color: 'text-red-400 border-red-500/20 bg-red-500/5', label: 'High', desc: 'Heavy compute, slow' },
              ].map(({ level, color, label, desc }) => (
                <div key={level} className={`p-3 rounded-xl border ${color} text-center`}>
                  <p className="text-[8px] font-black uppercase tracking-widest mb-0.5">{label}</p>
                  <p className="text-sm font-black font-mono">{level}</p>
                  <p className="text-[8px] text-stone-500 mt-1">{desc}</p>
                </div>
              ))}
            </div>

            {/* Save button */}
            <button onClick={handleSave} disabled={isSaving}
              className="w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest text-white transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, var(--th-primary) 0%, var(--th-primary-dark) 100%)', boxShadow: '0 4px 14px var(--th-glow)' }}>
              {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
              {isSaving ? 'Updating Protocol...' : 'Update Consensus Protocol'}
            </button>

            {/* Save feedback */}
            <AnimatePresence>
              {saveMsg && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                  className={`p-3 rounded-xl text-xs font-medium border ${saveMsg.type === 'ok' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                  {saveMsg.type === 'ok' ? '✓ ' : '⚠ '}{saveMsg.text}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* MAINTENANCE */}
        <div className="glass-card rounded-[22px] p-6 md:p-8 flex flex-col justify-between relative overflow-hidden" style={{ borderColor: 'color-mix(in srgb, var(--th-primary) 10%, transparent)', borderWidth: '1px', borderStyle: 'solid' }}>
          <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-36 h-36 rounded-full blur-2xl pointer-events-none" style={{ background: 'var(--th-glow)' }} />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl" style={{ backgroundColor: 'var(--th-glow)', color: 'var(--th-primary)' }}><Trash2 size={18} /></div>
              <div>
                <h3 className="text-sm font-bold" style={{ fontFamily: 'Space Grotesk' }}>Maintenance</h3>
                <p className="text-[10px] text-stone-400">Ledger purge operations</p>
              </div>
            </div>
            <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 flex gap-3 mb-4">
              <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-stone-400 leading-relaxed">
                <span className="text-red-400 font-bold">CRITICAL:</span> Purge will permanently delete all blocks from MongoDB and clear the local ledger. This cannot be undone.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-2 text-center">
              <InfoPill label="Chain Blocks" value={chainHeight} color="red" />
              <InfoPill label="Virtual Blocks" value={simBlockCount} color="violet" />
            </div>
          </div>
          <button onClick={() => setShowResetConfirm(true)}
            className="relative z-10 w-full py-3 rounded-xl font-bold text-xs uppercase tracking-widest border-2 transition-all active:scale-95 mt-4 hover:text-white"
            style={{ borderColor: 'var(--th-primary)', color: 'var(--th-primary)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--th-primary)'; e.currentTarget.style.color = 'white'; }}
            onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--th-primary)'; }}>
            Reset Ledger
          </button>
        </div>
      </div>

      {/* ── PAIRED NODES DETAIL ── */}
      <div className="glass-card rounded-[22px] overflow-hidden">
        <div className="p-6 md:p-8 border-b border-stone-100 dark:border-white/5 flex items-center gap-3">
          <div className="p-2.5 rounded-xl" style={{ backgroundColor: 'var(--th-glow)', color: 'var(--th-primary)' }}><Signal size={18} /></div>
          <div>
            <h3 className="text-sm font-bold" style={{ fontFamily: 'Space Grotesk' }}>Registered Hardware</h3>
            <p className="text-[10px] text-stone-400">{pairedNodes.length} device{pairedNodes.length !== 1 ? 's' : ''} registered · {liveNodes.length} live · manage from Uplink Terminal</p>
          </div>
        </div>

        {pairedNodes.length === 0 ? (
          <div className="py-16 text-center text-stone-400">
            <Signal size={30} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium">No hardware registered</p>
            <p className="text-xs mt-1 text-stone-500">Pair devices in the Uplink Terminal to see them here</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-50 dark:divide-white/3">
            {pairedNodes.map((node, i) => {
              const nc = nodeColors[i % nodeColors.length];
              const nodeBlocks = virtualBlocks.filter(b => b._nodeId === node.id).length;
              const bat = node.battery ?? 100;
              return (
                <motion.div key={node.id} layout className={`flex items-center gap-4 px-6 py-4 transition-all ${isBreached && node.status === 'Live' ? 'bg-red-50/30 dark:bg-red-900/8' : 'hover:bg-stone-50 dark:hover:bg-white/2'}`}>
                  {/* Color + Type icon */}
                  <div className="shrink-0 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: nc }} />
                    <div className={`p-1.5 rounded-lg ${node.type === 'WiFi' ? 'bg-blue-500/10 text-blue-400' : 'bg-violet-500/10 text-violet-400'}`}>
                      {node.type === 'WiFi' ? <Wifi size={11} /> : <Bluetooth size={11} />}
                    </div>
                  </div>

                  {/* Node ID */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold font-mono text-stone-200 truncate">{node.id}</p>
                    <p className="text-[9px] text-stone-500">{node.type} · {node.rssi} dBm</p>
                  </div>

                  {/* Status */}
                  <span className={`shrink-0 text-[8px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${
                    isBreached && node.status === 'Live'
                      ? 'text-red-400 bg-red-500/10 border-red-500/20 animate-pulse'
                      : node.status === 'Live'
                      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                      : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                  }`}>
                    {isBreached && node.status === 'Live' ? '⚡ Compromised' : node.status}
                  </span>

                  {/* Blocks */}
                  <div className="shrink-0 text-center min-w-[60px]">
                    <p className="text-[8px] text-stone-500 uppercase">Blocks</p>
                    <p className="text-sm font-bold font-mono text-red-400">{nodeBlocks}</p>
                  </div>

                  {/* Temp */}
                  {node.status === 'Live' && (
                    <div className="shrink-0 hidden sm:flex items-center gap-1 min-w-[70px]">
                      <Thermometer size={11} className="text-rose-400" />
                      <span className={`text-xs font-bold font-mono ${isBreached ? 'text-red-400' : 'text-rose-400'}`}>
                        {isBreached ? '99.9°C' : `${node.lastTemp?.toFixed(1) ?? '--'}°C`}
                      </span>
                    </div>
                  )}

                  {/* Battery */}
                  <div className="shrink-0 hidden md:flex items-center gap-1 min-w-[55px]">
                    <span className={`text-xs font-bold font-mono ${bat > 50 ? 'text-emerald-400' : bat > 20 ? 'text-amber-400' : 'text-red-400'}`}>{bat}%</span>
                    <span className="text-[8px] text-stone-600">bat</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── RESET CONFIRM MODAL ── */}
      <AnimatePresence>
        {showResetConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-stone-900/80 backdrop-blur-md"
            onClick={() => setShowResetConfirm(false)}>
            <motion.div initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="glass-card w-full max-w-md rounded-[24px] p-8 border border-red-500/20 shadow-2xl shadow-red-600/20">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-3 bg-red-500/10 text-red-500 rounded-2xl"><AlertTriangle size={22} /></div>
                <div>
                  <h3 className="font-bold text-red-400" style={{ fontFamily: 'Space Grotesk' }}>Confirm Ledger Reset</h3>
                  <p className="text-[10px] text-stone-400 mt-0.5">This action is irreversible</p>
                </div>
              </div>
              <p className="text-sm text-stone-300 leading-relaxed mb-6">
                All <span className="text-red-400 font-bold">{chainHeight}</span> on-chain blocks will be permanently purged from MongoDB. Virtual simulation data cannot be purged here.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowResetConfirm(false)}
                  className="flex-1 py-3 rounded-xl text-sm font-bold border border-white/10 text-stone-400 hover:bg-white/5 transition-all">
                  Cancel
                </button>
                <button onClick={handleReset} disabled={isResetting}
                  className="flex-1 py-3 rounded-xl text-sm font-bold bg-red-600 hover:bg-red-700 text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 disabled:opacity-60">
                  {isResetting ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  {isResetting ? 'Purging...' : 'Confirm Reset'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-center text-[10px] text-stone-400 dark:text-stone-700 pb-4 uppercase tracking-widest">
        SenseChain Neural Infrastructure · SHA-256 Consensus Layer
      </p>
    </div>
  );
};

export default NodeSettings;