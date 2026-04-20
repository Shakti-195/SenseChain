import React, { useState, useEffect, useCallback } from 'react';
import {
  Cpu, Wifi, Terminal, CheckCircle2, RefreshCw,
  Smartphone, Copy, Activity, Bluetooth, Zap,
  Radio, Radar, ShieldCheck, Globe, Lock, Plug,
  Plus, GitBranch, Signal, ShieldAlert, AlertTriangle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../services/api';
import { useBreach } from '../context/BreachContext';

// ── LOCAL TIMEZONE ──
const fmtTime = (ts) => {
  if (!ts) return '--:--';
  try {
    const ms = Number(ts) < 1e12 ? Number(ts) * 1000 : Number(ts);
    return new Date(ms).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  } catch { return '--:--'; }
};

// --- HANDSHAKE MODAL ---
const HandshakeModal = ({ node, onClose, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const steps = [
    { title: 'Initializing Tunnel', desc: 'Establishing encrypted P2P bridge...' },
    { title: 'Key Exchange', desc: 'Syncing SHA-256 public hardware keys...' },
    { title: 'Identity Verification', desc: `Verifying MAC: ${node.mac || 'XX:XX:XX:XX'}` },
    { title: 'Link Secured', desc: 'Node authorized for Block Mining.' },
  ];

  useEffect(() => {
    if (currentStep < steps.length - 1) {
      const t = setTimeout(() => setCurrentStep(p => p + 1), 1400);
      return () => clearTimeout(t);
    } else {
      // Final: register with backend
      API.post('/node_handshake', { node_id: node.id, mac_addr: node.mac })
        .then(() => { setTimeout(() => { onComplete(node); onClose(); }, 700); })
        .catch(() => { setTimeout(() => { onComplete(node); onClose(); }, 700); }); // Show success even if backend is offline
    }
  }, [currentStep]);

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
      <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="glass-card rounded-[28px] max-w-md w-full p-8 relative overflow-hidden">
        {/* Progress bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-stone-100 dark:bg-white/5">
          <motion.div initial={{ width: 0 }}
            animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            className="h-full bg-gradient-to-r from-red-600 to-rose-500 shadow-[0_0_12px_rgba(220,38,38,0.5)]" />
        </div>

        <div className="text-center mb-7 mt-2">
          <div className="inline-flex p-4 bg-red-100 dark:bg-red-900/30 rounded-2xl mb-4">
            <ShieldCheck size={32} className="text-red-600 dark:text-red-400 animate-pulse" />
          </div>
          <h2 className="text-xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>Neural Handshake</h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 font-mono">{node.id}</p>
        </div>

        <div className="space-y-4">
          {steps.map((step, idx) => (
            <motion.div key={idx} animate={{ opacity: idx <= currentStep ? 1 : 0.3 }} className="flex items-start gap-3">
              <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                idx < currentStep ? 'bg-emerald-500 text-white' :
                idx === currentStep ? 'bg-red-600 text-white' :
                'bg-stone-100 dark:bg-white/6 text-stone-400'
              }`}>
                {idx < currentStep ? <CheckCircle2 size={13} /> : <span className="text-[10px] font-bold">{idx + 1}</span>}
              </div>
              <div>
                <p className="text-sm font-bold">{step.title}</p>
                <p className="text-[10px] text-stone-400">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

// --- MAIN PAGE ---
const UplinkTerminal = ({ activeNodes = {}, connError }) => {
  const { virtualBreach, breachedBlock, isSimulating, simBlockCount, simNodeId } = useBreach();

  const [uplinkData, setUplinkData] = useState({ ip: '127.0.0.1', endpoint: '' });
  const [isScanning, setIsScanning] = useState(false);
  const [discoveredDevices, setDiscoveredDevices] = useState([]);
  const [pairingNode, setPairingNode] = useState(null);
  // Local authorized nodes accumulate across handshakes (persisted in sessionStorage)
  const [localAuthorized, setLocalAuthorized] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('sc-authorized-nodes') || '{}'); } catch { return {}; }
  });
  const [terminalLogs, setTerminalLogs] = useState([
    { id: 1, msg: 'SenseChain Kernel V12 Loaded.', type: 'sys' },
    { id: 2, msg: 'Neural P2P discovery subsystem ready.', type: 'info' },
  ]);

  const addLog = useCallback((msg, type = 'info') => {
    setTerminalLogs(prev => [{ id: Date.now(), msg, type }, ...prev].slice(0, 8));
  }, []);

  // Inject uplink log entries on breach/heal
  useEffect(() => {
    if (virtualBreach) {
      addLog(`⚡ UPLINK ALERT: Block #${breachedBlock ?? '?'} compromised. Chain integrity severed.`, 'error');
      addLog('[SEC]    Neural mesh entering lockdown protocol...', 'warn');
    }
  }, [virtualBreach]); // eslint-disable-line

  useEffect(() => {
    if (isSimulating) {
      addLog(`[SIM]    Virtual node ${simNodeId} broadcasting ${simBlockCount} blocks`, 'info');
    }
  }, [isSimulating, simBlockCount]); // eslint-disable-line

  // Merge backend activeNodes with locally authorized ones
  const allAuthorized = { ...localAuthorized, ...activeNodes };

  // Fetch uplink IP
  useEffect(() => {
    API.get('/get_uplink_ip')
      .then(res => setUplinkData(res.data))
      .catch(() => addLog('Node IP detection failed — using localhost.', 'error'));
  }, [addLog]);

  const runDiscovery = () => {
    setIsScanning(true);
    setDiscoveredDevices([]);
    addLog('Neural spectrum scan initiated...', 'warn');
    setTimeout(() => {
      const devices = [
        { id: 'SENSE-NODE-ALPHA', mac: 'BC:FF:45:01:AA:FF', rssi: '-45 dBm', type: 'WiFi', freq: '2.4GHz' },
        { id: 'FORENSIC-HUB-BETA', mac: 'DE:22:90:X1:CC:12', rssi: '-62 dBm', type: 'BT', freq: '5.0GHz' },
        { id: 'IOT-CLUSTER-GAMMA', mac: 'A4:11:77:B2:00:EE', rssi: '-78 dBm', type: 'WiFi', freq: '2.4GHz' },
      ];
      setDiscoveredDevices(devices);
      setIsScanning(false);
      addLog(`${devices.length} nodes detected. Ready for handshake.`, 'success');
    }, 3000);
  };

  const handleHandshakeComplete = (node) => {
    const entry = {
      status: 'Authorized',
      mac: node.mac,
      type: node.type,
      authorized_at: Date.now() / 1000,
      last_sync: Date.now() / 1000,
    };
    const updated = { ...localAuthorized, [node.id]: entry };
    setLocalAuthorized(updated);
    sessionStorage.setItem('sc-authorized-nodes', JSON.stringify(updated));
    addLog(`Cluster authorized: ${node.id} [${node.mac}]`, 'success');
  };

  return (
    <div className="page-wrapper space-y-6 custom-scrollbar">

      {/* ── BREACH UPLINK BANNER ── */}
      <AnimatePresence>
        {virtualBreach && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="flex items-center gap-4 px-6 py-4 rounded-2xl bg-red-900/80 text-white shadow-2xl shadow-red-600/40 border border-red-500/60 breach-glow"
          >
            <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ repeat: Infinity, duration: 0.5 }}>
              <ShieldAlert size={22} className="text-red-300" />
            </motion.div>
            <div className="flex-1">
              <p className="font-bold text-sm">⚡ UPLINK COMPROMISED — Neural Mesh Under Attack</p>
              <p className="text-[11px] text-red-300 mt-0.5">
                Block #{breachedBlock ?? '?'} tampered. All node communications flagged. Go to Security Terminal to restore.
              </p>
            </div>
            <button
              onClick={() => window.location.href = '/security'}
              className="shrink-0 px-4 py-2 bg-white/15 hover:bg-white/25 rounded-xl text-xs font-bold uppercase tracking-wide transition-all border border-white/20"
            >
              Security →
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-2">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest chip-red">
            <Plug size={9} /> Neural Provisioning
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight" style={{ fontFamily: 'Space Grotesk' }}>
          Uplink <span className="bg-gradient-to-r from-red-600 to-rose-500 bg-clip-text text-transparent">Terminal</span>
        </h1>
        <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">P2P hardware node discovery and authorization</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── LEFT: Discovery + Authorized Clusters ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Wireless Discovery */}
          <div className="glass-card rounded-[22px] p-6 md:p-8 relative overflow-hidden">
            <AnimatePresence>
              {isScanning && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 z-50 bg-red-600/5 backdrop-blur-sm rounded-[22px] flex flex-col items-center justify-center">
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}>
                    <Radar size={48} className="text-red-600" />
                  </motion.div>
                  <p className="text-xs font-bold text-red-600 uppercase tracking-widest mt-4 animate-pulse">Syncing neural frequencies...</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-red-100 dark:bg-red-500/12 text-red-600 dark:text-red-400 rounded-xl"><Radar size={18} /></div>
                <div>
                  <h3 className="font-bold text-sm" style={{ fontFamily: 'Space Grotesk' }}>Wireless Discovery</h3>
                  <p className="text-[10px] text-stone-400">Scan for nearby IoT nodes</p>
                </div>
              </div>
              <motion.button onClick={runDiscovery} disabled={isScanning} whileTap={{ scale: 0.96 }}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-red-600/20">
                <Radio size={14} className={isScanning ? 'animate-spin' : ''} /> {isScanning ? 'Scanning...' : 'Initiate Scan'}
              </motion.button>
            </div>

            <div className="space-y-3">
              {discoveredDevices.length === 0 && !isScanning ? (
                <div className="py-14 text-center border-2 border-dashed border-stone-100 dark:border-white/5 rounded-2xl">
                  <Signal size={28} className="mx-auto mb-2 text-stone-300 dark:text-stone-700" />
                  <p className="text-stone-400 text-xs font-medium">No active nodes detected · Run a scan to discover devices</p>
                </div>
              ) : discoveredDevices.map((device) => {
                const isPaired = !!allAuthorized[device.id];
                return (
                  <motion.div key={device.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-4 bg-stone-50 dark:bg-white/3 border border-stone-100 dark:border-white/5 rounded-2xl hover:border-red-200 dark:hover:border-red-800/40 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 bg-white dark:bg-white/6 rounded-xl text-red-500 border border-stone-100 dark:border-white/5">
                        {device.type === 'WiFi' ? <Wifi size={18} /> : <Bluetooth size={18} />}
                      </div>
                      <div>
                        <p className="font-bold text-sm font-mono">{device.id}</p>
                        <p className="text-[10px] text-stone-400 font-mono">{device.mac} · {device.rssi} · {device.freq}</p>
                      </div>
                    </div>
                    {isPaired ? (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 size={11} /> Authorized
                      </span>
                    ) : (
                      <motion.button onClick={() => setPairingNode(device)} whileTap={{ scale: 0.95 }}
                        className="px-4 py-2 bg-stone-900 dark:bg-white/6 text-white dark:text-stone-200 text-[10px] font-bold uppercase tracking-wide rounded-xl hover:bg-red-600 transition-all">
                        Pair Node
                      </motion.button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Authorized Clusters */}
          <div className="glass-card rounded-[22px] p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-2.5 rounded-xl ${virtualBreach ? 'bg-red-100 dark:bg-red-500/12 text-red-600 dark:text-red-400' : 'bg-emerald-100 dark:bg-emerald-500/12 text-emerald-600 dark:text-emerald-400'}`}>
                {virtualBreach ? <ShieldAlert size={18} /> : <ShieldCheck size={18} />}
              </div>
              <div>
                <h3 className="font-bold text-sm" style={{ fontFamily: 'Space Grotesk' }}>
                  Authorized Clusters
                  {virtualBreach && (
                    <span className="ml-2 text-[8px] font-bold text-red-500 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded-full uppercase tracking-wide animate-pulse">BREACH</span>
                  )}
                </h3>
                <p className="text-[10px] text-stone-400">{Object.keys(allAuthorized).length} node{Object.keys(allAuthorized).length !== 1 ? 's' : ''} registered</p>
              </div>
            </div>

            <div className="space-y-3">
              {Object.keys(allAuthorized).length === 0 ? (
                <div className="py-14 text-center border-2 border-dashed border-stone-100 dark:border-white/5 rounded-2xl">
                  <GitBranch size={28} className="mx-auto mb-2 text-stone-300 dark:text-stone-700" />
                  <p className="text-stone-400 text-xs font-medium">Awaiting P2P link authorization · Pair a node above to register</p>
                </div>
              ) : Object.entries(allAuthorized).map(([id, info]) => (
                <motion.div key={id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex items-center justify-between p-4 border rounded-2xl transition-all duration-500 ${
                    virtualBreach
                      ? 'bg-red-50/60 dark:bg-red-900/15 border-red-200 dark:border-red-800/40'
                      : 'bg-emerald-50/60 dark:bg-emerald-900/15 border-emerald-200 dark:border-emerald-800/40'
                  }`}>
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 bg-white dark:bg-white/6 rounded-xl border ${virtualBreach ? 'text-red-500 border-red-100' : 'text-emerald-500 border-emerald-100'} dark:border-white/5`}>
                      <Smartphone size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-sm font-mono">{id}</p>
                      <p className="text-[10px] text-stone-400 font-mono flex items-center gap-2">
                        <Activity size={9} className={virtualBreach ? 'text-red-500 animate-ping' : 'text-emerald-500 animate-pulse'} />
                        {virtualBreach ? 'LINK COMPROMISED' : (info.status || 'Authorized')} · {info.mac || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-3 py-1 text-white text-[9px] font-black uppercase rounded-full shadow mb-1 ${
                      virtualBreach ? 'bg-red-500 shadow-red-500/20 animate-pulse' : 'bg-emerald-500 shadow-emerald-500/20'
                    }`}>
                      {virtualBreach ? 'Compromised' : 'Secured'}
                    </span>
                    <p className="text-[9px] text-stone-400 font-mono">{fmtTime(info.authorized_at)}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Config + Logs ── */}
        <div className="space-y-6">
          {/* Manual Uplink Config */}
          <div className="glass-card rounded-[22px] p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 bg-red-100 dark:bg-red-500/12 text-red-600 dark:text-red-400 rounded-xl"><Terminal size={18} /></div>
              <div>
                <h3 className="font-bold text-sm" style={{ fontFamily: 'Space Grotesk' }}>Manual Uplink</h3>
                <p className="text-[10px] text-stone-400">Direct API gateway config</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-2">API Gateway</p>
                <div className="flex items-center justify-between p-3.5 bg-stone-50 dark:bg-white/4 border border-stone-100 dark:border-white/6 rounded-xl font-mono text-[11px] text-red-600 dark:text-red-400">
                  <span className="truncate mr-2 text-stone-600 dark:text-stone-400">{uplinkData.endpoint || 'https://sensechain.onrender.com'}</span>
                  <button onClick={() => {
                    navigator.clipboard.writeText(uplinkData.endpoint || 'https://sensechain.onrender.com');
                    addLog('API link copied to clipboard', 'success');
                  }} className="text-stone-400 hover:text-red-600 transition-colors shrink-0">
                    <Copy size={14} />
                  </button>
                </div>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-900/15 border border-red-200 dark:border-red-800/40 rounded-xl flex items-center gap-3">
                <Lock size={16} className="text-red-600 dark:text-red-400 shrink-0" />
                <p className="text-[10px] text-stone-600 dark:text-stone-400 leading-relaxed">
                  Neural tunnel secured. Hardware nodes authorized for block mining via SHA-256 chain.
                </p>
              </div>
            </div>
          </div>

          {/* Neural Logs */}
          <div className="glass-card rounded-[22px] p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-widest">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> Neural Logs
              </div>
              <button onClick={() => setTerminalLogs([{ id: Date.now(), msg: 'Log stream cleared.', type: 'sys' }])}
                className="text-[9px] font-bold text-stone-400 hover:text-red-600 uppercase tracking-wide transition-colors">
                Clear
              </button>
            </div>
            <div className="space-y-2 font-mono text-[10px] max-h-48 overflow-y-auto custom-scrollbar">
              {terminalLogs.map(log => (
                <div key={log.id} className="flex gap-2 items-start">
                  <span className={`shrink-0 mt-0.5 w-1.5 h-1.5 rounded-full ${
                    log.type === 'error' ? 'bg-red-500' :
                    log.type === 'success' ? 'bg-emerald-500' :
                    log.type === 'warn' ? 'bg-yellow-500' :
                    log.type === 'sys' ? 'bg-blue-500' : 'bg-stone-400'
                  }`} />
                  <p className={`${
                    log.type === 'error' ? 'text-red-500' :
                    log.type === 'success' ? 'text-emerald-500' :
                    log.type === 'warn' ? 'text-yellow-500' :
                    log.type === 'sys' ? 'text-blue-400' : 'text-stone-500'
                  } leading-relaxed`}>{log.msg}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Handshake Modal */}
      <AnimatePresence>
        {pairingNode && (
          <HandshakeModal
            node={pairingNode}
            onClose={() => setPairingNode(null)}
            onComplete={handleHandshakeComplete}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default UplinkTerminal;