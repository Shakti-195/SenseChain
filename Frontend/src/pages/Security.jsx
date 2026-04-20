import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ShieldAlert, ShieldCheck, ShieldX, Zap, RefreshCw,
  FileText, Download, Terminal, Fingerprint, Unlock,
  AlertCircle, Database, Hash, Signal, Lock, Cpu,
  Flame, Radio, TrendingDown, TrendingUp, Eye, EyeOff,
  Wifi, Bluetooth, Activity,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useBreach } from '../context/BreachContext';
import { generatePDF, generateExcel } from '../utils/reportGenerator';

// ── TIMEZONE-AWARE CLOCK ──
const LOCAL_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
const fmtNow = () =>
  new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false, timeZone: LOCAL_TZ,
  }).format(new Date());

// ── ATTACK PHASES (drives multi-step animation) ──
const ATTACK_PHASES = [
  { delay: 0,    type: 'warn',    msg: (idx) => `[RECON]  Scanning target Block #${idx}...` },
  { delay: 600,  type: 'warn',    msg: (idx) => `[INJECT] Deploying entropy payload at Block #${idx}` },
  { delay: 1200, type: 'error',   msg: (idx) => `[MUTATE] Block #${idx} data overridden → temperature: 99.9°C` },
  { delay: 1800, type: 'error',   msg: (idx) => `[HASH]   SHA-256 recomputed with malicious nonce` },
  { delay: 2400, type: 'error',   msg: (idx) => `[BREACH] Hash linkage severed ← chain integrity BROKEN` },
  { delay: 2900, type: 'error',   msg: ()    => `[ALERT]  ⚡ CRITICAL: Global breach alert broadcast` },
];

const REPAIR_PHASES = [
  { delay: 0,    type: 'warn',    msg: () => `[INIT]   Forensic chain recovery initiated` },
  { delay: 500,  type: 'info',    msg: () => `[SCAN]   Locating tampered block...` },
  { delay: 1100, type: 'warn',    msg: () => `[REBUILD]Recomputing SHA-256 from genesis block #0` },
  { delay: 1700, type: 'info',    msg: () => `[VERIFY] Re-linking parent hashes across all nodes` },
  { delay: 2300, type: 'success', msg: () => `[DONE]   All hashes re-validated. Merkle root restored.` },
  { delay: 2700, type: 'success', msg: () => `[SYNC]   ✓ Neural network re-synchronized. Integrity RESTORED.` },
];

// ── LIVE TICKER LOGS (when no attack is running) ──
const IDLE_LOGS = [
  () => `[WATCH]  Monitoring hash chain... ${(Math.random() * 0.5 + 0.1).toFixed(3)}ms ping`,
  () => `[SCAN]   Block integrity check passed`,
  () => `[CRYPTO] SHA-256 signature valid`,
  () => `[NET]    Peer mesh heartbeat OK`,
  () => `[AUTH]   JWT token verified`,
  () => `[LEDGER] No anomalies detected in last 60s`,
  () => `[TLS]    Handshake renewed`,
  () => `[TEMP]   Sensor within bounds: ${(22 + Math.random() * 4).toFixed(1)}°C`,
];

const Security = ({ integrity = true, chain = [], chainHeight = 0 }) => {
  const { token } = useAuth();
  const { virtualBreach, breachedBlock, setVirtualBreach, clearBreach,
          isSimulating, simBlockCount, simNodeId,
          pairedNodes, nodeSimLogs, virtualBlocks } = useBreach();

  // Effective chain height = real backend blocks + virtual sim blocks
  const effectiveChainHeight = chainHeight + (isSimulating ? simBlockCount : 0);

  // ── UI STATE ──
  const [toast, setToast]               = useState(null);
  const [exporting, setExporting]       = useState(null); // 'pdf' | 'excel' | null

  // ── ATTACK LAB STATE ──
  const [tamperIndex, setTamperIndex]         = useState(1);
  const [isAttacking, setIsAttacking]         = useState(false);
  const [isRepairing, setIsRepairing]         = useState(false);

  // Local mirrors of context (for immediate UI update within this page)
  const [breachedBlockIdx, setBreachedBlockIdx] = useState(breachedBlock);
  const [attackPhase, setAttackPhase]           = useState(virtualBreach ? 2 : 0);

  // ── TERMINAL LOG ──
  const [log, setLog] = useState([
    { time: fmtNow(), msg: 'Pen-test terminal ready. Awaiting command.', type: 'sys' },
    { time: fmtNow(), msg: `Chain height: ${chainHeight} blocks detected`, type: 'info' },
  ]);
  const logEndRef = useRef(null);

  const addLog = useCallback((msg, type = 'info') => {
    setLog(prev => [{ time: fmtNow(), msg, type }, ...prev].slice(0, 20));
  }, []);

  const showToast = useCallback((type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Update chain height log when prop or sim changes
  useEffect(() => {
    const eff = effectiveChainHeight;
    if (eff > 1) {
      setTamperIndex(prev => Math.min(Math.max(prev, 1), eff - 1));
      setLog(prev => {
        const updated = [...prev];
        const idx = updated.findIndex(l => l.msg.startsWith('Chain height:'));
        const liveNodes = pairedNodes.filter(n => n.status === 'Live');
        const nodeNames = liveNodes.map(n => n.id.split('-')[0]).join(', ');
        const msg = `Chain height: ${eff} blocks detected${liveNodes.length > 0 ? ` (${simBlockCount} virtual from ${nodeNames || simNodeId})` : ''}`;
        if (idx > -1) updated[idx] = { time: fmtNow(), msg, type: 'info' };
        return updated;
      });
    }
  }, [effectiveChainHeight, isSimulating, simBlockCount, simNodeId, pairedNodes]);

  // Merge real-time nodeSimLogs (from paired nodes) into the terminal display
  // Only inject when not attacking/repairing to avoid log collision
  useEffect(() => {
    if (!isAttacking && !isRepairing && nodeSimLogs.length > 0) {
      const latest = nodeSimLogs[0]; // most recent log
      if (latest) {
        setLog(prev => {
          // Avoid duplicate injection
          if (prev[0]?.id === latest.id) return prev;
          return [{ id: latest.id, time: latest.time, msg: latest.msg, type: latest.type }, ...prev].slice(0, 20);
        });
      }
    }
  }, [nodeSimLogs, isAttacking, isRepairing]);

  // Idle ticker — fallback when no nodes are live
  const idleRef = useRef(null);
  useEffect(() => {
    if (isAttacking || isRepairing || pairedNodes.some(n => n.status === 'Live')) {
      clearInterval(idleRef.current);
      return;
    }
    idleRef.current = setInterval(() => {
      const fn = IDLE_LOGS[Math.floor(Math.random() * IDLE_LOGS.length)];
      addLog(fn(), 'sys');
    }, 5000);
    return () => clearInterval(idleRef.current);
  }, [isAttacking, isRepairing, pairedNodes, addLog]);


  // ── VIRTUAL ATTACK (fully local) ──
  const runVirtualAttack = useCallback((idx) => {
    setIsAttacking(true);
    setAttackPhase(1);
    clearInterval(idleRef.current);

    ATTACK_PHASES.forEach(({ delay, type, msg }) => {
      setTimeout(() => addLog(msg(idx), type), delay);
    });

    // After all phases, mark breach — write to GLOBAL context so Header sees it
    setTimeout(() => {
      setAttackPhase(2);
      setBreachedBlockIdx(idx);
      setIsAttacking(false);
      setVirtualBreach(true, idx);  // ← global context
    }, 3200);
  }, [addLog, setVirtualBreach]);

  // ── VIRTUAL REPAIR (fully local) ──
  const runVirtualRepair = useCallback(() => {
    setIsRepairing(true);
    setAttackPhase(3);
    clearInterval(idleRef.current);

    REPAIR_PHASES.forEach(({ delay, type, msg }) => {
      setTimeout(() => addLog(msg(), type), delay);
    });

    setTimeout(() => {
      setBreachedBlockIdx(null);
      setAttackPhase(0);
      setIsRepairing(false);
      clearBreach();  // ← clear global context so Header goes back to Secure
      showToast('success', 'Chain integrity fully restored. All nodes re-validated.');
    }, 3200);
  }, [addLog, showToast, clearBreach]);

  // ── MAIN ATTACK TRIGGER ──
  const simulateTamper = async () => {
    const totalBlocks = effectiveChainHeight;
    if (totalBlocks <= 1) {
      showToast('error', 'Need ≥ 2 blocks. Start the Simulation Lab on Dashboard first.');
      addLog('[ABORT]  Insufficient chain depth. Generate blocks via Dashboard → Simulation Lab.', 'error');
      return;
    }
    if (tamperIndex < 1) {
      showToast('error', 'Cannot tamper Block #0 — genesis block is immutable.');
      return;
    }

    // Always run virtual simulation immediately
    runVirtualAttack(tamperIndex);

    // Also attempt real backend (fire-and-forget, silent fail)
    try {
      await api.post(`/tamper_block/${tamperIndex}`, null, {
        params: { new_temperature: 99.9 },
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch { /* backend optional — virtual sim still runs */ }
  };

  // ── MAIN REPAIR TRIGGER ──
  const handleRepair = async () => {
    runVirtualRepair();

    try {
      await api.post('/repair_chain', {}, { headers: { Authorization: `Bearer ${token}` } });
    } catch { /* backend optional */ }
  };

  // ── EXPORT ──
  const handleExport = async (format) => {
    if (exporting) return;
    setExporting(format);
    addLog(`[EXPORT] Generating ${format.toUpperCase()} forensic audit report...`, 'info');
    try {
      const opts = { chain, integrity, chainHeight, userEmail: token ? '' : '' };
      let filename;
      if (format === 'pdf') {
        filename = await generatePDF(opts);
      } else {
        filename = await generateExcel(opts);
      }
      addLog(`[EXPORT] ✓ Report saved: ${filename}`, 'success');
      showToast('success', `${format.toUpperCase()} report downloaded successfully.`);
    } catch (err) {
      console.error('Export error:', err);
      addLog(`[EXPORT] ✗ Export failed: ${err?.message || 'Unknown error'}`, 'error');
      showToast('error', `Export failed. Check console for details.`);
    } finally {
      setExporting(null);
    }
  };

  // Resolved integrity = real chain OR global virtual breach context
  const isBreached = !integrity || virtualBreach;

  return (
    <div className="page-wrapper space-y-6 custom-scrollbar">

      {/* ── TOAST ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className={`fixed top-24 left-1/2 -translate-x-1/2 z-[300] flex items-center gap-3 px-6 py-3 rounded-2xl shadow-2xl border backdrop-blur-xl text-sm font-semibold ${
              toast.type === 'error'
                ? 'bg-red-50 dark:bg-red-900/25 border-red-200 dark:border-red-700 text-red-700 dark:text-red-400'
                : 'bg-emerald-50 dark:bg-emerald-900/25 border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400'
            }`}
          >
            {toast.type === 'error' ? <ShieldAlert size={16} /> : <ShieldCheck size={16} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── PAGE HEADER ── */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <motion.div
              animate={isBreached ? { scale: [1, 1.3, 1] } : {}}
              transition={{ repeat: Infinity, duration: 0.8 }}
              className={`w-2 h-2 rounded-full ${isBreached ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'}`}
            />
            <span className="text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-widest">
              {isBreached ? '🚨 VIRTUAL BREACH ACTIVE' : '✓ All Nodes Nominal'}
            </span>
            <span className="text-[9px] font-mono text-stone-400 ml-1">· {LOCAL_TZ}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>
            Security <span className="bg-gradient-to-r from-red-600 to-rose-500 bg-clip-text text-transparent">Terminal</span>
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">SHA-256 cryptographic integrity · Virtual cyber attack lab</p>
        </div>
        <div className="flex gap-2">
          {/* Excel Export */}
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => handleExport('excel')}
            disabled={!!exporting}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-stone-600 dark:text-stone-300 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/8 rounded-xl border border-stone-200 dark:border-white/8 transition-all disabled:opacity-50"
          >
            {exporting === 'excel'
              ? <><RefreshCw size={14} className="animate-spin" /> Generating...</>
              : <><FileText size={15} /> Excel Report</>}
          </motion.button>
          {/* PDF Export */}
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => handleExport('pdf')}
            disabled={!!exporting}
            className="btn-primary px-4 py-2.5 disabled:opacity-50"
          >
            {exporting === 'pdf'
              ? <><RefreshCw size={14} className="animate-spin" /> Generating...</>
              : <><Download size={15} /> PDF Report</>}
          </motion.button>
        </div>
      </motion.div>

      {/* ── MAIN STATUS BANNER ── */}
      <motion.div layout
        className={`glass-card rounded-[24px] p-6 md:p-10 relative overflow-hidden transition-all duration-700 ${isBreached ? 'breach-glow' : ''}`}>
        <div className="absolute right-6 top-6 opacity-[0.04] pointer-events-none">
          <Fingerprint size={200} className={isBreached ? 'text-red-500' : 'text-emerald-500'} />
        </div>

        {/* Animated scan line during attack */}
        <AnimatePresence>
          {isAttacking && (
            <motion.div
              initial={{ top: 0 }} animate={{ top: '100%' }} transition={{ duration: 3, ease: 'linear' }}
              className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent z-20 pointer-events-none"
            />
          )}
        </AnimatePresence>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 relative z-10">
          <div className="flex items-center gap-6">
            <motion.div
              animate={isBreached ? { scale: [1, 1.06, 1] } : {}}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className={`p-5 rounded-2xl transition-all duration-700 ${
                isAttacking
                  ? 'bg-yellow-100 dark:bg-yellow-500/15 text-yellow-600 dark:text-yellow-400'
                  : isBreached
                  ? 'bg-red-100 dark:bg-red-500/15 text-red-600 dark:text-red-400'
                  : 'bg-emerald-100 dark:bg-emerald-500/12 text-emerald-600 dark:text-emerald-400'
              }`}>
              {isAttacking
                ? <Zap size={40} strokeWidth={1.5} />
                : isBreached
                ? <ShieldX size={40} strokeWidth={1.5} />
                : <ShieldCheck size={40} strokeWidth={1.5} />}
            </motion.div>

            <div>
              <p className="text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-1">Ledger Status</p>
              <motion.h2
                key={isBreached ? 'breach' : 'clear'}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className={`text-3xl md:text-4xl font-bold ${
                  isAttacking ? 'text-yellow-500' : isBreached ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                }`}
                style={{ fontFamily: 'Space Grotesk' }}>
                {isAttacking ? 'ATTACKING...' : isRepairing ? 'REPAIRING...' : isBreached ? 'BREACH' : 'All Clear'}
              </motion.h2>
              <p className="text-sm text-stone-500 dark:text-stone-400 mt-1 max-w-md">
                {isAttacking
                  ? `Injecting exploit payload at Block #${tamperIndex}...`
                  : isRepairing
                  ? 'Rebuilding SHA-256 hash chain from genesis...'
                  : isBreached
                  ? `Virtual breach detected at Block #${breachedBlockIdx ?? tamperIndex}. SHA-256 hash linkage severed.`
                  : 'All cryptographic links verified. Nodes operating within expected parameters.'}
              </p>
              {isBreached && !isAttacking && !isRepairing && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 bg-red-100 dark:bg-red-500/12 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 rounded-full text-xs font-bold uppercase tracking-wide">
                  <AlertCircle size={12} /> Critical — Forensic Lockdown Active
                </motion.div>
              )}
            </div>
          </div>

          <div className="shrink-0 flex flex-col items-center gap-3">
            {isBreached && !isRepairing && !isAttacking && (
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handleRepair}
                className="btn-primary px-8 py-4 text-base">
                <RefreshCw size={18} /> Repair Chain
              </motion.button>
            )}
            {isRepairing && (
              <div className="flex flex-col items-center gap-3">
                <RefreshCw size={32} className="animate-spin text-red-600 dark:text-red-400" />
                <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-widest animate-pulse">Repairing...</span>
              </div>
            )}
            {!isBreached && !isRepairing && !isAttacking && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-emerald-100 dark:bg-emerald-900/25 border border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wide">
                <ShieldCheck size={14} /> Chain Verified
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── ATTACK LAB + TERMINAL ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* CYBER ATTACK LAB */}
        <div className={`glass-card rounded-[24px] p-6 md:p-8 relative overflow-hidden transition-all duration-700 ${isBreached ? 'border-red-300 dark:border-red-700/40' : ''}`}>
          <div className={`absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${isBreached ? 'bg-red-500/10' : 'bg-red-500/4'}`} />

          <div className="flex items-center gap-3 mb-6 relative z-10">
            <motion.div
              animate={isAttacking ? { rotate: [0, 15, -15, 0] } : {}}
              transition={{ repeat: Infinity, duration: 0.6 }}
              className={`p-2.5 rounded-xl transition-all ${
                isAttacking ? 'bg-red-500 text-white animate-pulse' : 'bg-red-100 dark:bg-red-500/12 text-red-500'
              }`}>
              <Unlock size={18} />
            </motion.div>
            <div>
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Pen-Test Portal · Virtual</p>
              <h3 className="text-base font-bold" style={{ fontFamily: 'Space Grotesk' }}>Cyber Attack Lab</h3>
            </div>
          </div>

          <div className="space-y-5 relative z-10">

            {/* Chain depth display with sim awareness */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 dark:bg-white/3 border border-stone-100 dark:border-white/5">
              <span className="text-xs font-semibold text-stone-500">Chain depth</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm font-mono text-red-600 dark:text-red-400">{effectiveChainHeight} blocks</span>
                {isSimulating && (
                  <span className="text-[8px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full uppercase tracking-wide animate-pulse">
                    +{simBlockCount} SIM
                  </span>
                )}
              </div>
            </div>

            {/* Warning banner if not enough blocks */}
            {effectiveChainHeight <= 1 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-400 text-xs font-medium flex items-start gap-2">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>Go to <strong>Dashboard → Simulation Lab</strong> and click <strong>Start Node</strong> to generate virtual blocks, then run the attack.</span>
              </motion.div>
            )}

            {/* Target block picker */}
            <div>
              <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-widest mb-2">
                Target Block Index
              </label>
              <div className="relative">
                <Hash size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="number"
                  min={1}
                  max={Math.max(1, effectiveChainHeight - 1)}
                  value={tamperIndex}
                  onChange={e => setTamperIndex(Math.max(1, Math.min(Number(e.target.value), Math.max(1, effectiveChainHeight - 1))))}
                  disabled={effectiveChainHeight <= 1 || isAttacking || isRepairing}
                  className="glass-input pl-11 text-xl font-bold text-red-600 dark:text-red-400 font-mono text-center disabled:opacity-50"
                />
              </div>
              <p className="text-[10px] text-stone-400 text-center mt-1.5">
                Genesis Block #0 is immutable · Valid range: 1–{Math.max(1, effectiveChainHeight - 1)}
              </p>
            </div>

            {/* Attack type selector */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Data Mutate', icon: <TrendingDown size={13} />, active: true },
                { label: 'Hash Forge', icon: <Hash size={13} />, active: false },
                { label: 'Replay', icon: <Radio size={13} />, active: false },
              ].map(({ label, icon, active }) => (
                <button key={label}
                  className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl text-[10px] font-bold uppercase tracking-wide border transition-all ${
                    active
                      ? 'bg-red-600/10 border-red-500/30 text-red-500 dark:text-red-400'
                      : 'bg-stone-50 dark:bg-white/3 border-stone-200 dark:border-white/6 text-stone-400 opacity-50 cursor-not-allowed'
                  }`}
                  disabled={!active}
                  title={active ? undefined : 'Coming soon'}>
                  {icon}
                  {label}
                </button>
              ))}
            </div>

            {/* Main attack / repair button */}
            {!isBreached ? (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={simulateTamper}
                disabled={isAttacking || isRepairing || effectiveChainHeight <= 1}
                className={`w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl text-sm font-bold transition-all shadow-lg ${
                  effectiveChainHeight <= 1
                    ? 'bg-stone-200 dark:bg-white/6 text-stone-400 cursor-not-allowed'
                    : 'bg-stone-900 dark:bg-white/8 hover:bg-red-600 hover:text-white hover:shadow-red-600/25 text-white border border-stone-700 dark:border-white/10'
                } disabled:opacity-40 disabled:cursor-not-allowed`}>
                {isAttacking
                  ? <><RefreshCw size={16} className="animate-spin" /> Deploying Attack...</>
                  : effectiveChainHeight <= 1
                  ? <><AlertCircle size={16} /> Insufficient Blocks</>
                  : <><Zap size={16} /> Simulate Cyber Attack</>}
              </motion.button>
            ) : (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleRepair}
                disabled={isRepairing}
                className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl text-sm font-bold bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                {isRepairing
                  ? <><RefreshCw size={16} className="animate-spin" /> Repairing...</>
                  : <><RefreshCw size={16} /> Repair Chain</>}
              </motion.button>
            )}

            <p className="text-center text-[10px] text-stone-400 uppercase tracking-widest">
              {isBreached
                ? '⚡ Virtual breach active — click Repair Chain to restore'
                : '⚠ Attack runs fully in local virtual simulation'}
            </p>
          </div>
        </div>

        {/* NEURAL LOG TERMINAL + CONNECTED NODES */}
        <div className={`glass-panel rounded-[24px] p-6 md:p-8 flex flex-col transition-all duration-700 ${isBreached ? 'border-red-300 dark:border-red-700/30' : ''}`}>

          {/* Connected Nodes Banner */}
          {pairedNodes.length > 0 && (
            <div className="mb-5 p-4 bg-white/3 border border-white/6 rounded-2xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                  <Activity size={12} className={isSimulating ? 'text-emerald-400 animate-pulse' : 'text-stone-500'} />
                  Paired Node Monitor
                </div>
                <span className="text-[9px] font-bold text-stone-500 font-mono">{pairedNodes.filter(n => n.status === 'Live').length}/{pairedNodes.length} live</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {pairedNodes.map(node => (
                  <div key={node.id} className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                    isBreached && node.status === 'Live' ? 'bg-red-900/20 border-red-700/30' :
                    node.status === 'Live' ? 'bg-emerald-900/15 border-emerald-700/25' :
                    'bg-white/3 border-white/6'
                  }`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        isBreached && node.status === 'Live' ? 'bg-red-500 animate-ping' :
                        node.status === 'Live' ? 'bg-emerald-500 animate-pulse' :
                        'bg-yellow-500 animate-pulse'
                      }`} />
                      <span className="text-[10px] font-mono font-bold text-stone-300">{node.id}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[9px] font-mono">
                      {node.status === 'Live' && (
                        <>
                          <span className={isBreached ? 'text-red-400' : 'text-orange-400'}>{isBreached ? '99.9' : node.lastTemp?.toFixed(1)}°C</span>
                          <span className="text-blue-400">{node.lastHum?.toFixed(1)}%</span>
                          <span className="text-emerald-400 font-bold">{node.blocksMined}blk</span>
                        </>
                      )}
                      {node.status !== 'Live' && (
                        <span className="text-yellow-400 animate-pulse">{node.status}...</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 mb-4">
            <Terminal size={16} className={isBreached ? 'text-red-500' : isSimulating ? 'text-emerald-500' : 'text-stone-500'} />
            <span className="text-xs font-bold text-stone-500 uppercase tracking-widest">Neural Log Analyzer</span>
            {isSimulating && !isBreached && (
              <span className="text-[8px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full uppercase tracking-wide">● Live Feed</span>
            )}
            <div className={`ml-auto w-2 h-2 rounded-full ${isBreached ? 'bg-red-500 animate-ping' : 'bg-emerald-500 animate-pulse'}`} />
            <span className="text-[9px] font-mono text-stone-500">{LOCAL_TZ}</span>
          </div>

          {/* Terminal window */}
          <div className="flex-1 bg-stone-950 dark:bg-black/70 rounded-2xl p-5 font-mono text-[11px] space-y-2 overflow-y-auto custom-scrollbar max-h-72 terminal-scanline">
            {/* MAC-style dots */}
            <div className="flex items-center gap-1.5 mb-3 pb-3 border-b border-white/5">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[9px] text-stone-700 ml-2">sensechain-security — forensic bash</span>
              <span className="ml-auto text-[9px] text-emerald-500 animate-pulse">● LIVE</span>
            </div>
            {log.map((entry, i) => (
              <motion.div
                key={`${entry.time}-${i}`}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex gap-3 items-start">
                <span className="text-stone-700 shrink-0">{entry.time}</span>
                <span className={`leading-relaxed ${
                  entry.type === 'error'   ? 'text-red-400' :
                  entry.type === 'success' ? 'text-emerald-400' :
                  entry.type === 'warn'    ? 'text-yellow-400' :
                  entry.type === 'sys'     ? 'text-blue-400' :
                  'text-stone-400'
                }`}>
                  &gt; {entry.msg}
                </span>
              </motion.div>
            ))}
            <div ref={logEndRef} />
          </div>

          <div className={`flex items-center gap-3 pt-3 mt-3 border-t ${isBreached ? 'border-red-200 dark:border-red-700/30' : 'border-stone-100 dark:border-white/6'}`}>
            <div className={`w-2 h-2 rounded-full ${isBreached ? 'bg-red-500 animate-ping' : 'bg-emerald-500 animate-pulse'}`} />
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">
              {isBreached ? 'Breach Confirmed · Restore Required' : 'Surveillance Active · Monitoring'}
            </span>
          </div>
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <div className="glass-card rounded-[24px] p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-blue-100 dark:bg-blue-500/12 text-blue-600 dark:text-blue-400 rounded-xl">
            <Cpu size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold" style={{ fontFamily: 'Space Grotesk' }}>How the Simulation Works</h3>
            <p className="text-[10px] text-stone-400">Attack → Breach → Detect → Repair — full forensic workflow explained</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ATTACK FLOW */}
          <div className="space-y-2">
            <p className="text-[9px] font-bold text-red-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500" /> Cyber Attack Simulation
            </p>
            {[
              { step: '01', icon: '🎯', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20', title: 'Reconnaissance', desc: 'Attacker scans the active blockchain for a target block index to tamper.' },
              { step: '02', icon: '💉', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20', title: 'Payload Injection', desc: 'Malicious entropy payload is deployed at the chosen block address.' },
              { step: '03', icon: '🔥', color: 'text-red-400 bg-red-500/10 border-red-500/20', title: 'Data Mutation', desc: 'Block data is overridden (temperature → 99.9°C) simulating sensor spoofing.' },
              { step: '04', icon: '🔓', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20', title: 'Hash Forgery', desc: 'SHA-256 is recomputed with a malicious nonce, severing the hash chain link.' },
              { step: '05', icon: '⚡', color: 'text-red-600 bg-red-700/10 border-red-600/20', title: 'Global Breach Alert', desc: 'All downstream blocks invalid. Critical alert broadcasts across the entire network.' },
            ].map(({ step, icon, color, title, desc }) => (
              <div key={step} className={`flex items-start gap-3 p-3 rounded-xl border ${color}`}>
                <span className={`shrink-0 text-[9px] font-black font-mono px-1.5 py-0.5 rounded-md border ${color}`}>{step}</span>
                <span className="text-lg leading-none shrink-0">{icon}</span>
                <div>
                  <p className="text-xs font-bold text-stone-200">{title}</p>
                  <p className="text-[10px] text-stone-400 leading-relaxed mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* REPAIR FLOW */}
          <div className="space-y-2">
            <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Chain Repair Protocol
            </p>
            {[
              { step: '01', icon: '🔬', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', title: 'Forensic Initiation', desc: 'Repair protocol triggered. Forensic scan launched to locate the tampered block.' },
              { step: '02', icon: '🗺️', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20', title: 'Block Locator', desc: 'Hash comparison identifies the exact tampered block by detecting the broken chain link.' },
              { step: '03', icon: '🔨', color: 'text-violet-400 bg-violet-500/10 border-violet-500/20', title: 'SHA-256 Rebuild', desc: 'Valid SHA-256 hashes recomputed from genesis #0 upward using original sensor data.' },
              { step: '04', icon: '🔗', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20', title: 'Hash Re-linking', desc: 'Parent hashes re-linked across all nodes, restoring the cryptographic chain integrity.' },
              { step: '05', icon: '✅', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', title: 'Network Sync', desc: 'Merkle root restored. All nodes re-synchronized. Ledger returns to verified state.' },
            ].map(({ step, icon, color, title, desc }) => (
              <div key={step} className={`flex items-start gap-3 p-3 rounded-xl border ${color}`}>
                <span className={`shrink-0 text-[9px] font-black font-mono px-1.5 py-0.5 rounded-md border ${color}`}>{step}</span>
                <span className="text-lg leading-none shrink-0">{icon}</span>
                <div>
                  <p className="text-xs font-bold text-stone-200">{title}</p>
                  <p className="text-[10px] text-stone-400 leading-relaxed mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* QUICK GUIDE */}
        <div className="mt-6 p-4 bg-white/3 border border-white/6 rounded-2xl">
          <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <Lock size={10} /> Quick Guide — 3 Steps to Run a Full Simulation
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { num: '1', color: 'text-blue-400 border-blue-500/30 bg-blue-500/10', title: 'Pair Hardware', desc: 'Uplink Terminal → Scan → Connect via WiFi or Bluetooth to start mining' },
              { num: '2', color: 'text-red-400 border-red-500/30 bg-red-500/10', title: 'Launch Attack', desc: 'Choose a block index below → Click "Simulate Cyber Attack"' },
              { num: '3', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10', title: 'Repair Chain', desc: 'Press "Repair Chain" to restore the cryptographic integrity' },
            ].map(({ num, color, title, desc }) => (
              <div key={num} className={`flex items-start gap-2.5 p-3 rounded-xl border ${color}`}>
                <span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black border ${color}`}>{num}</span>
                <div>
                  <p className="text-xs font-bold text-stone-200">{title}</p>
                  <p className="text-[10px] text-stone-400 mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── REAL-TIME BLOCK INSPECTOR ── */}
      <div className="glass-card rounded-[24px] p-6 md:p-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 bg-violet-100 dark:bg-violet-500/12 text-violet-600 dark:text-violet-400 rounded-xl"><Eye size={18} /></div>
          <div>
            <h3 className="text-sm font-bold" style={{ fontFamily: 'Space Grotesk' }}>Block Inspector</h3>
            <p className="text-[10px] text-stone-400">
              Live SHA-256 block analysis · {virtualBlocks.length} virtual block{virtualBlocks.length !== 1 ? 's' : ''} from {pairedNodes.filter(n => n.status === 'Live').length} live node{pairedNodes.filter(n => n.status === 'Live').length !== 1 ? 's' : ''}
            </p>
          </div>
          {isBreached && virtualBlocks.length > 0 && (
            <span className="ml-auto text-[8px] font-bold text-red-500 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full uppercase tracking-wide animate-pulse">⚡ All Corrupted</span>
          )}
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left min-w-[520px]">
            <thead>
              <tr className="border-b border-stone-100 dark:border-white/5">
                {['Block', 'Source Node', 'SHA-256 Hash', 'Nonce', 'Status'].map((h, i) => (
                  <th key={h} className={`px-4 py-3 text-[9px] font-bold text-stone-400 uppercase tracking-widest ${i === 4 ? 'text-right' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50 dark:divide-white/3">
              {(virtualBlocks.length > 0 ? virtualBlocks.slice(-10).reverse() : []).map((block, i) => {
                const isCorrupted = isBreached;
                return (
                  <motion.tr key={block.hash || i} layout
                    className={`transition-colors ${isCorrupted ? 'bg-red-50/60 dark:bg-red-900/10' : 'hover:bg-stone-50 dark:hover:bg-white/2'}`}>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-bold font-mono ${isCorrupted ? 'text-red-500' : 'text-red-600 dark:text-red-400'}`}>
                        #{block.index}
                        {isCorrupted && <span className="ml-2 text-[8px] bg-red-500/10 border border-red-500/30 text-red-500 px-1.5 py-0.5 rounded-full uppercase animate-pulse">CORRUPTED</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[9px] font-mono text-stone-400 bg-white/5 border border-white/6 px-2 py-0.5 rounded-full">
                        {block._nodeId?.split('-')[0] ?? 'Node'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-mono truncate max-w-[180px] block ${isCorrupted ? 'text-red-400 line-through opacity-60' : 'text-stone-400'}`}>
                        {isCorrupted ? 'HASH_CORRUPTED_' + (block.hash?.slice(2, 10).toUpperCase() ?? 'XXXX') + '...' : block.hash}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-mono px-2 py-1 rounded-lg ${isCorrupted ? 'text-red-400 bg-red-500/10 border border-red-500/20' : 'text-stone-500 bg-stone-100 dark:bg-white/5'}`}>
                        {isCorrupted ? '⚠ FORGED' : (block.nonce ?? 0)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-[9px] font-bold uppercase tracking-wide px-2 py-1 rounded-full border ${isCorrupted ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'}`}>
                        {isCorrupted ? '✗ Corrupted' : '✓ Verified'}
                      </span>
                    </td>
                  </motion.tr>
                );
              })}
              {virtualBlocks.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-stone-400 text-xs">
                    <Database size={28} className="mx-auto mb-2 opacity-20" />
                    <p className="font-medium">No paired node blocks yet</p>
                    <p className="text-[10px] mt-1 text-stone-500">Pair a device in the Uplink Terminal to start live block mining</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── STATS ROW ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Blocks', value: effectiveChainHeight, icon: <Database size={16} />,
            color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-500/12',
          },
          {
            label: 'Chain Status', value: isBreached ? 'Breached' : 'Secure', icon: <ShieldCheck size={16} />,
            color: isBreached ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400',
            bg: isBreached ? 'bg-red-100 dark:bg-red-500/12' : 'bg-emerald-100 dark:bg-emerald-500/12',
          },
          {
            label: 'Hash Algorithm', value: 'SHA-256', icon: <Hash size={16} />,
            color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-100 dark:bg-violet-500/12',
          },
          {
            label: 'Network Nodes', value: effectiveChainHeight > 0 ? (isSimulating ? 'Live+Sim' : 'Live') : 'Offline', icon: <Signal size={16} />,
            color: effectiveChainHeight > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-stone-500',
            bg: 'bg-blue-100 dark:bg-blue-500/12',
          },
        ].map(({ label, value, color, bg, icon }) => (
          <motion.div key={label} whileHover={{ y: -2 }} className="glass-card rounded-2xl p-5">
            <div className={`p-2 rounded-xl ${bg} ${color} inline-flex mb-3`}>{icon}</div>
            <p className={`text-xl md:text-2xl font-bold font-mono ${color}`}>{value}</p>
            <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 mt-1 uppercase tracking-wide">{label}</p>
          </motion.div>
        ))}
      </div>

      <p className="text-center text-[10px] text-stone-400 dark:text-stone-700 pb-4 uppercase tracking-widest">
        SenseChain Neural Infrastructure · SHA-256 Forensic Security Layer
      </p>
    </div>
  );
};

export default Security;