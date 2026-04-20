import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Wifi, Bluetooth, Terminal, CheckCircle2, RefreshCw,
  Smartphone, Copy, Activity, Zap, Radio, Radar,
  ShieldCheck, Lock, Plug, GitBranch, Signal,
  ShieldAlert, X, KeyRound, Eye, EyeOff, Layers,
  WifiOff, BluetoothOff, ArrowRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { useBreach } from '../context/BreachContext';

// ── TIME HELPER ──
const fmtTime = (ts) => {
  if (!ts) return '--:--';
  try {
    const ms = Number(ts) < 1e12 ? Number(ts) * 1000 : Number(ts);
    return new Date(ms).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  } catch { return '--:--'; }
};

// ── SIGNAL STRENGTH BARS ──
const SignalBars = ({ rssi, color = 'emerald' }) => {
  const dbm = parseInt(rssi) || -80;
  const s = dbm > -50 ? 4 : dbm > -62 ? 3 : dbm > -75 ? 2 : 1;
  const colors = { emerald: 'bg-emerald-400', blue: 'bg-blue-400', violet: 'bg-violet-400' };
  return (
    <div className="flex items-end gap-0.5 h-3.5">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className={`w-1 rounded-sm transition-all ${i <= s ? colors[color] : 'bg-white/15'}`}
          style={{ height: `${i * 25}%` }} />
      ))}
    </div>
  );
};

// ── WIFI DEVICE POOL ──
const WIFI_DEVICES = [
  { id: 'SENSE-NODE-ALPHA', mac: 'BC:FF:45:01:AA:FF', rssi: '-38 dBm', type: 'WiFi', freq: '5GHz', security: 'WPA3', latency: '0.8ms', compatible: true },
  { id: 'IOT-CLUSTER-GAMMA', mac: 'A4:11:77:B2:00:EE', rssi: '-55 dBm', type: 'WiFi', freq: '2.4GHz', security: 'WPA2', latency: '1.4ms', compatible: true },
  { id: 'MESH-RELAY-DELTA', mac: 'F0:23:B9:44:11:CC', rssi: '-62 dBm', type: 'WiFi', freq: '5GHz', security: 'WPA2', latency: '2.1ms', compatible: true },
  { id: 'GENERIC-AP-SIGMA', mac: 'D8:61:A9:00:FF:12', rssi: '-74 dBm', type: 'WiFi', freq: '2.4GHz', security: 'WPA2', latency: '5.2ms', compatible: false },
];

// ── BLUETOOTH DEVICE POOL ──
const BT_DEVICES = [
  { id: 'FORENSIC-HUB-BETA', mac: 'DE:22:90:B1:CC:12', rssi: '-42 dBm', type: 'BT', freq: 'BLE 5.0', security: 'Encrypted', latency: '7.5ms', battery: 84, compatible: true },
  { id: 'BLE-SENSOR-ZETA',   mac: '7C:A9:54:E0:22:AB', rssi: '-58 dBm', type: 'BT', freq: 'BLE 4.2', security: 'Encrypted', latency: '12ms', battery: 61, compatible: true },
  { id: 'BT-HUB-EPSILON',    mac: '98:D8:A4:B3:55:11', rssi: '-69 dBm', type: 'BT', freq: 'BLE 5.0', security: 'Encrypted', latency: '18ms', battery: 23, compatible: true },
];

// ══════════════════════════════════════════════════
// WIFI CONNECTION MODAL (password-based like real OS)
// ══════════════════════════════════════════════════
const WifiConnectModal = ({ device, onClose, onComplete }) => {
  const [phase, setPhase] = useState('password'); // password → connecting → done
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [step, setStep] = useState(0);
  const inputRef = useRef(null);

  const CONNECT_STEPS = [
    { label: 'Authenticating credentials...', icon: <Lock size={14} /> },
    { label: 'DHCP lease obtained · Assigning IP...', icon: <Signal size={14} /> },
    { label: 'TLS 1.3 tunnel established...', icon: <ShieldCheck size={14} /> },
    { label: `SHA-256 handshake with ${device.id}`, icon: <Zap size={14} /> },
    { label: 'Node authorized on SenseChain mesh ✓', icon: <CheckCircle2 size={14} /> },
  ];

  useEffect(() => {
    if (phase === 'connecting') inputRef.current = null;
    if (phase === 'connecting') {
      const timers = CONNECT_STEPS.map((_, i) =>
        setTimeout(() => setStep(i), i * 900)
      );
      const done = setTimeout(() => {
        setPhase('done');
        setTimeout(() => { onComplete(device); onClose(); }, 800);
      }, CONNECT_STEPS.length * 900 + 400);
      return () => { timers.forEach(clearTimeout); clearTimeout(done); };
    }
  }, [phase]); // eslint-disable-line

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-lg p-6">
      <motion.div initial={{ scale: 0.92, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
        className="glass-card rounded-[28px] max-w-md w-full p-8 relative overflow-hidden">

        {/* Progress bar */}
        {phase === 'connecting' && (
          <div className="absolute top-0 left-0 w-full h-1 bg-stone-100 dark:bg-white/5">
            <motion.div initial={{ width: 0 }}
              animate={{ width: `${((step + 1) / CONNECT_STEPS.length) * 100}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 shadow-[0_0_12px_rgba(59,130,246,0.5)]" />
          </div>
        )}

        <button onClick={onClose} className="absolute top-5 right-5 p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 dark:hover:bg-white/6 transition-all">
          <X size={16} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className={`p-3 rounded-2xl ${phase === 'done' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
            {phase === 'done'
              ? <CheckCircle2 size={26} className="text-emerald-600 dark:text-emerald-400" />
              : <Wifi size={26} className="text-blue-600 dark:text-blue-400" />
            }
          </div>
          <div>
            <h2 className="text-lg font-bold" style={{ fontFamily: 'Space Grotesk' }}>
              {phase === 'password' ? 'Connect via Wi-Fi' : phase === 'done' ? 'Connected!' : 'Establishing Link...'}
            </h2>
            <p className="text-[11px] text-stone-400 font-mono mt-0.5">{device.id} · {device.freq} · {device.security}</p>
          </div>
        </div>

        {phase === 'password' && (
          <div className="space-y-5">
            {/* Network info */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-stone-50 dark:bg-white/4 rounded-xl p-3 text-center border border-stone-100 dark:border-white/6">
                <p className="text-[8px] text-stone-400 uppercase tracking-wide mb-1">Signal</p>
                <div className="flex justify-center mb-0.5"><SignalBars rssi={device.rssi} color="blue" /></div>
                <p className="text-[9px] font-bold font-mono text-blue-500">{device.rssi}</p>
              </div>
              <div className="bg-stone-50 dark:bg-white/4 rounded-xl p-3 text-center border border-stone-100 dark:border-white/6">
                <p className="text-[8px] text-stone-400 uppercase tracking-wide mb-1">Band</p>
                <p className="text-xs font-bold text-blue-500">{device.freq}</p>
              </div>
              <div className="bg-stone-50 dark:bg-white/4 rounded-xl p-3 text-center border border-stone-100 dark:border-white/6">
                <p className="text-[8px] text-stone-400 uppercase tracking-wide mb-1">Latency</p>
                <p className="text-xs font-bold text-emerald-500">{device.latency}</p>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest block mb-2">
                Network Passphrase
              </label>
              <div className="relative">
                <KeyRound size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  ref={inputRef}
                  type={showPw ? 'text' : 'password'}
                  placeholder="Enter WPA passphrase..."
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && setPhase('connecting')}
                  className="glass-input pl-11 pr-11 text-sm font-mono"
                  autoFocus
                />
                <button onClick={() => setShowPw(p => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors">
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <p className="text-[9px] text-stone-400 mt-1.5">Default passphrase: <span className="font-mono text-blue-500">sensechain2024</span></p>
            </div>

            <motion.button whileTap={{ scale: 0.97 }}
              onClick={() => setPhase('connecting')}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-sm font-bold shadow-lg shadow-blue-600/25 transition-all">
              <Wifi size={16} /> Connect via Wi-Fi
            </motion.button>
          </div>
        )}

        {phase === 'connecting' && (
          <div className="space-y-3">
            {CONNECT_STEPS.map((s, i) => (
              <motion.div key={i} animate={{ opacity: i <= step ? 1 : 0.25 }}
                className="flex items-center gap-3 text-sm">
                <div className={`p-1.5 rounded-lg shrink-0 transition-all ${
                  i < step ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500' :
                  i === step ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-500' :
                  'bg-stone-100 dark:bg-white/6 text-stone-400'
                }`}>
                  {i < step ? <CheckCircle2 size={12} /> : i === step ? <RefreshCw size={12} className="animate-spin" /> : s.icon}
                </div>
                <p className={`text-[11px] font-mono ${i <= step ? 'text-stone-700 dark:text-stone-200' : 'text-stone-400'}`}>{s.label}</p>
              </motion.div>
            ))}
          </div>
        )}

        {phase === 'done' && (
          <div className="text-center py-4">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300 }}>
              <CheckCircle2 size={48} className="mx-auto text-emerald-500 mb-3" />
            </motion.div>
            <p className="font-bold text-emerald-600">Node Authorized · Simulation Starting</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

// ══════════════════════════════════════════════════
// BLUETOOTH CONNECT MODAL (pairing code like real BT)
// ══════════════════════════════════════════════════
const BluetoothModal = ({ device, onClose, onComplete }) => {
  const [phase, setPhase] = useState('code'); // code → pairing → done
  const [step, setStep] = useState(0);
  // Random 6-digit pairing code
  const pairingCode = useRef(String(Math.floor(100000 + Math.random() * 900000)));
  const [confirmed, setConfirmed] = useState(false);

  const BT_STEPS = [
    { label: `Advertising BLE UUID...` },
    { label: 'GATT profile exchange...' },
    { label: 'Pairing code confirmed · Bonding...' },
    { label: `Encrypting link with ${device.id}` },
    { label: 'BLE node bonded · Joining mesh ✓' },
  ];

  useEffect(() => {
    if (phase === 'pairing') {
      const timers = BT_STEPS.map((_, i) => setTimeout(() => setStep(i), i * 1100));
      const done = setTimeout(() => {
        setPhase('done');
        setTimeout(() => { onComplete(device); onClose(); }, 800);
      }, BT_STEPS.length * 1100 + 400);
      return () => { timers.forEach(clearTimeout); clearTimeout(done); };
    }
  }, [phase]); // eslint-disable-line

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-lg p-6">
      <motion.div initial={{ scale: 0.92, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
        className="glass-card rounded-[28px] max-w-md w-full p-8 relative overflow-hidden">

        {phase === 'pairing' && (
          <div className="absolute top-0 left-0 w-full h-1 bg-stone-100 dark:bg-white/5">
            <motion.div initial={{ width: 0 }}
              animate={{ width: `${((step + 1) / BT_STEPS.length) * 100}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-gradient-to-r from-violet-500 to-purple-400 shadow-[0_0_12px_rgba(139,92,246,0.5)]" />
          </div>
        )}

        <button onClick={onClose} className="absolute top-5 right-5 p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 dark:hover:bg-white/6 transition-all">
          <X size={16} />
        </button>

        <div className="flex items-center gap-4 mb-6">
          <div className={`p-3 rounded-2xl ${phase === 'done' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-violet-100 dark:bg-violet-900/30'}`}>
            {phase === 'done'
              ? <CheckCircle2 size={26} className="text-emerald-600" />
              : <Bluetooth size={26} className="text-violet-600 dark:text-violet-400" />
            }
          </div>
          <div>
            <h2 className="text-lg font-bold" style={{ fontFamily: 'Space Grotesk' }}>
              {phase === 'code' ? 'Bluetooth Pairing' : phase === 'done' ? 'Paired!' : 'Bonding...'}
            </h2>
            <p className="text-[11px] text-stone-400 font-mono mt-0.5">{device.id} · {device.freq}</p>
          </div>
        </div>

        {phase === 'code' && (
          <div className="space-y-5">
            {/* Device info */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-stone-50 dark:bg-white/4 rounded-xl p-3 text-center border border-stone-100 dark:border-white/6">
                <p className="text-[8px] text-stone-400 uppercase tracking-wide mb-1">RSSI</p>
                <p className="text-xs font-bold font-mono text-violet-500">{device.rssi}</p>
              </div>
              <div className="bg-stone-50 dark:bg-white/4 rounded-xl p-3 text-center border border-stone-100 dark:border-white/6">
                <p className="text-[8px] text-stone-400 uppercase tracking-wide mb-1">Battery</p>
                <p className="text-xs font-bold text-emerald-500">{device.battery}%</p>
              </div>
              <div className="bg-stone-50 dark:bg-white/4 rounded-xl p-3 text-center border border-stone-100 dark:border-white/6">
                <p className="text-[8px] text-stone-400 uppercase tracking-wide mb-1">Latency</p>
                <p className="text-xs font-bold text-amber-500">{device.latency}</p>
              </div>
            </div>

            {/* Pairing code */}
            <div className="text-center">
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3">
                Confirm Pairing Code on Device
              </p>
              <div className="flex justify-center gap-2 mb-4">
                {pairingCode.current.split('').map((d, i) => (
                  <div key={i} className="w-11 h-14 flex items-center justify-center text-2xl font-bold font-mono
                    bg-violet-50 dark:bg-violet-900/20 border-2 border-violet-200 dark:border-violet-700/40
                    rounded-xl text-violet-700 dark:text-violet-300 shadow-sm">
                    {d}
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-stone-400">Does the code on the device screen match?</p>
            </div>

            <div className="flex gap-3">
              <button onClick={onClose}
                className="flex-1 py-3 border border-stone-200 dark:border-white/10 rounded-xl text-sm font-bold text-stone-500 hover:bg-stone-50 dark:hover:bg-white/4 transition-all">
                Reject
              </button>
              <motion.button whileTap={{ scale: 0.97 }}
                onClick={() => setPhase('pairing')}
                className="flex-1 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-violet-600/25 transition-all flex items-center justify-center gap-2">
                <Bluetooth size={15} /> Confirm Pair
              </motion.button>
            </div>
          </div>
        )}

        {phase === 'pairing' && (
          <div className="space-y-3">
            {BT_STEPS.map((s, i) => (
              <motion.div key={i} animate={{ opacity: i <= step ? 1 : 0.25 }}
                className="flex items-center gap-3 text-sm">
                <div className={`p-1.5 rounded-lg shrink-0 transition-all ${
                  i < step ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500' :
                  i === step ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-500' :
                  'bg-stone-100 dark:bg-white/6 text-stone-400'
                }`}>
                  {i < step ? <CheckCircle2 size={12} /> : <RefreshCw size={12} className={i === step ? 'animate-spin' : ''} />}
                </div>
                <p className={`text-[11px] font-mono ${i <= step ? 'text-stone-700 dark:text-stone-200' : 'text-stone-400'}`}>{s.label}</p>
              </motion.div>
            ))}
          </div>
        )}

        {phase === 'done' && (
          <div className="text-center py-4">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300 }}>
              <CheckCircle2 size={48} className="mx-auto text-emerald-500 mb-3" />
            </motion.div>
            <p className="font-bold text-emerald-600">BLE Bonded · Simulation Starting</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

// ══════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════
const UplinkTerminal = ({ activeNodes = {}, connError }) => {
  const navigate = useNavigate();
  const { virtualBreach, breachedBlock, pairedNodes, pairNode, unpairNode,
          isSimulating, simBlockCount } = useBreach();

  const [uplinkData, setUplinkData] = useState({ ip: '127.0.0.1', endpoint: '' });

  // ── WIFI STATE ──
  const [wifiScanning, setWifiScanning]       = useState(false);
  const [wifiDevices, setWifiDevices]         = useState([]);
  const [wifiConnecting, setWifiConnecting]   = useState(null); // device being connected
  const [wifiScanProgress, setWifiScanProgress] = useState(0);

  // ── BLUETOOTH STATE ──
  const [btScanning, setBtScanning]           = useState(false);
  const [btDevices, setBtDevices]             = useState([]);
  const [btConnecting, setBtConnecting]       = useState(null);
  const [btScanProgress, setBtScanProgress]   = useState(0);

  // ── TERMINAL LOGS ──
  const [terminalLogs, setTerminalLogs] = useState([
    { id: 1, msg: 'SenseChain Uplink Kernel V12 initialized.', type: 'sys' },
    { id: 2, msg: 'Wi-Fi and Bluetooth subsystems ready.', type: 'info' },
  ]);

  const addLog = useCallback((msg, type = 'info') => {
    setTerminalLogs(prev => [{ id: Date.now() + Math.random(), msg, type }, ...prev].slice(0, 12));
  }, []);

  // ── FX: breach log injection ──
  useEffect(() => {
    if (virtualBreach) {
      addLog(`⚡ UPLINK ALERT: Block #${breachedBlock ?? '?'} compromised. Chain integrity severed.`, 'error');
      addLog('[SEC]    Neural mesh entering lockdown protocol...', 'warn');
    }
  }, [virtualBreach]); // eslint-disable-line

  // ── FX: sim block milestones ──
  useEffect(() => {
    if (isSimulating && simBlockCount > 0 && simBlockCount % 5 === 0) {
      addLog(`[LEDGER] ${simBlockCount} blocks mined across ${pairedNodes.filter(n => n.status === 'Live').length} node(s)`, 'info');
    }
  }, [simBlockCount]); // eslint-disable-line

  // ── FETCH UPLINK IP ──
  useEffect(() => {
    API.get('/get_uplink_ip').then(r => setUplinkData(r.data)).catch(() => {});
  }, []);

  // ── IS A NODE ALREADY PAIRED? ──
  const isPaired = (deviceId) => pairedNodes.some(n => n.id === deviceId);

  // ── WIFI SCAN ──
  const runWifiScan = () => {
    if (wifiScanning) return;
    setWifiScanning(true);
    setWifiDevices([]);
    setWifiScanProgress(0);
    addLog('[WIFI]   Initiating 5GHz / 2.4GHz spectrum scan...', 'warn');

    // Simulate progressive scan discovery
    const progressInterval = setInterval(() => {
      setWifiScanProgress(p => Math.min(p + 8, 95));
    }, 150);

    // Stagger device discovery
    const delays = [800, 1400, 2000, 2800];
    delays.forEach((d, i) => {
      setTimeout(() => {
        if (i < WIFI_DEVICES.length) {
          setWifiDevices(prev => [...prev, WIFI_DEVICES[i]]);
        }
      }, d);
    });

    setTimeout(() => {
      clearInterval(progressInterval);
      setWifiScanProgress(100);
      setWifiScanning(false);
      addLog(`[WIFI]   ${WIFI_DEVICES.length} access points found. ${WIFI_DEVICES.filter(d => d.compatible).length} SenseChain-compatible.`, 'success');
    }, 3200);
  };

  // ── BLUETOOTH SCAN ──
  const runBtScan = () => {
    if (btScanning) return;
    setBtScanning(true);
    setBtDevices([]);
    setBtScanProgress(0);
    addLog('[BT]     Starting BLE advertisement scan (GATT discovery)...', 'warn');

    const progressInterval = setInterval(() => {
      setBtScanProgress(p => Math.min(p + 6, 95));
    }, 200);

    const delays = [1200, 2100, 3000];
    delays.forEach((d, i) => {
      setTimeout(() => {
        if (i < BT_DEVICES.length) {
          setBtDevices(prev => [...prev, BT_DEVICES[i]]);
        }
      }, d);
    });

    setTimeout(() => {
      clearInterval(progressInterval);
      setBtScanProgress(100);
      setBtScanning(false);
      addLog(`[BT]     ${BT_DEVICES.length} BLE peripherals discovered. Ready to pair.`, 'success');
    }, 4000);
  };

  // ── HANDSHAKE COMPLETE (shared for both WiFi and BT) ──
  const handleComplete = (device) => {
    addLog(`✓ ${device.type === 'WiFi' ? 'Wi-Fi' : 'BLE'} link established: ${device.id}`, 'success');
    addLog(`[SIM]    Starting live mining simulation for ${device.id}...`, 'info');
    pairNode({ id: device.id, mac: device.mac, type: device.type, rssi: device.rssi, freq: device.freq });
  };

  const handleUnpair = (nodeId) => {
    addLog(`[DISC]   Disconnecting ${nodeId} from mesh...`, 'warn');
    unpairNode(nodeId);
  };

  // Battery color
  const battColor = (b) => b > 50 ? 'text-emerald-500' : b > 20 ? 'text-amber-500' : 'text-red-500';

  return (
    <div className="page-wrapper space-y-6 custom-scrollbar">

      {/* ── BREACH BANNER ── */}
      <AnimatePresence>
        {virtualBreach && (
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            className="flex items-center gap-4 px-6 py-4 rounded-2xl bg-red-900/80 text-white shadow-2xl shadow-red-600/40 border border-red-500/60 breach-glow">
            <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ repeat: Infinity, duration: 0.5 }}>
              <ShieldAlert size={22} className="text-red-300" />
            </motion.div>
            <div className="flex-1">
              <p className="font-bold text-sm">⚡ UPLINK COMPROMISED — Neural Mesh Under Attack</p>
              <p className="text-[11px] text-red-300 mt-0.5">
                Block #{breachedBlock ?? '?'} tampered. All node links flagged.
              </p>
            </div>
            <button onClick={() => navigate('/security')}
              className="shrink-0 px-4 py-2 bg-white/15 hover:bg-white/25 rounded-xl text-xs font-bold uppercase tracking-wide transition-all border border-white/20">
              Security →
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── PAGE HEADER ── */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-2">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest chip-red">
            <Plug size={9} /> Neural Provisioning
          </span>
          {isSimulating && (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {pairedNodes.filter(n => n.status === 'Live').length} Node{pairedNodes.filter(n => n.status === 'Live').length !== 1 ? 's' : ''} Mining
            </span>
          )}
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight" style={{ fontFamily: 'Space Grotesk' }}>
          Uplink <span className="bg-gradient-to-r from-red-600 to-rose-500 bg-clip-text text-transparent">Terminal</span>
        </h1>
        <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
          Hardware discovery and P2P authorization · Connect via Wi-Fi (fast) or Bluetooth (wireless)
        </p>
      </motion.div>

      {/* ── CONNECTION SPEED GUIDE ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50/60 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30">
          <Wifi size={16} className="text-blue-500 shrink-0" />
          <div>
            <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Wi-Fi</p>
            <p className="text-[10px] text-stone-500">Faster · Recommended · Requires passphrase</p>
          </div>
          <span className="ml-auto text-[9px] font-bold text-blue-500 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-700">~1ms</span>
        </div>
        <div className="flex items-center justify-center w-8 text-stone-400 font-bold text-xs hidden sm:flex">vs</div>
        <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl bg-violet-50/60 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-800/30">
          <Bluetooth size={16} className="text-violet-500 shrink-0" />
          <div>
            <p className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-widest">Bluetooth BLE</p>
            <p className="text-[10px] text-stone-500">Wireless · Short range · Pairing code</p>
          </div>
          <span className="ml-auto text-[9px] font-bold text-amber-600 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-700">~10ms</span>
        </div>
      </div>

      {/* ── MAIN GRID: WIFI + BLUETOOTH ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* WI-FI SECTION */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
          className="glass-card rounded-[22px] p-6 relative overflow-hidden">

          {/* Scan overlay */}
          <AnimatePresence>
            {wifiScanning && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 z-10 pointer-events-none">
                {/* Radar sweep */}
                <div className="absolute inset-0 flex items-center justify-center opacity-8">
                  {[0, 1, 2].map(i => (
                    <motion.div key={i} className="absolute border border-blue-400/30 rounded-full"
                      animate={{ scale: [0.5, 2.5], opacity: [0.6, 0] }}
                      transition={{ repeat: Infinity, duration: 2, delay: i * 0.65, ease: 'linear' }}
                      style={{ width: 80, height: 80 }} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 dark:bg-blue-500/12 text-blue-600 dark:text-blue-400 rounded-xl">
                <Wifi size={18} />
              </div>
              <div>
                <h3 className="font-bold text-sm" style={{ fontFamily: 'Space Grotesk' }}>Wi-Fi Discovery</h3>
                <p className="text-[10px] text-stone-400">Scan local network for SenseChain nodes</p>
              </div>
            </div>
            <motion.button onClick={runWifiScan} disabled={wifiScanning} whileTap={{ scale: 0.95 }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                wifiScanning
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-500 cursor-wait'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20'
              }`}>
              <Radio size={12} className={wifiScanning ? 'animate-spin' : ''} />
              {wifiScanning ? 'Scanning...' : 'Scan'}
            </motion.button>
          </div>

          {/* Scan progress bar */}
          {wifiScanning && (
            <div className="mb-4 w-full bg-blue-50 dark:bg-white/4 rounded-full overflow-hidden h-1">
              <motion.div animate={{ width: `${wifiScanProgress}%` }} transition={{ duration: 0.3 }}
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400" />
            </div>
          )}

          {/* Device list */}
          <div className="space-y-2.5 min-h-[120px]">
            <AnimatePresence>
              {wifiDevices.length === 0 && !wifiScanning && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="py-10 text-center border-2 border-dashed border-stone-100 dark:border-white/5 rounded-2xl">
                  <WifiOff size={26} className="mx-auto mb-2 text-stone-300 dark:text-stone-700" />
                  <p className="text-stone-400 text-xs font-medium">No Wi-Fi devices found</p>
                  <p className="text-[10px] text-stone-400 mt-0.5">Press Scan to detect nearby SenseChain nodes</p>
                </motion.div>
              )}
              {wifiScanning && wifiDevices.length === 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="py-8 text-center">
                  <div className="flex justify-center gap-2 mb-3">
                    {[0, 1, 2].map(i => (
                      <motion.div key={i} className="w-2 h-2 rounded-full bg-blue-500"
                        animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.2 }} />
                    ))}
                  </div>
                  <p className="text-[10px] text-blue-500 font-bold uppercase tracking-widest animate-pulse">Probing 2.4GHz / 5GHz bands...</p>
                </motion.div>
              )}
              {wifiDevices.map((device, idx) => {
                const paired = isPaired(device.id);
                const ctxNode = pairedNodes.find(n => n.id === device.id);
                return (
                  <motion.div key={device.id}
                    initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`rounded-2xl border p-3.5 transition-all duration-300 ${
                      !device.compatible ? 'opacity-50 border-stone-100 dark:border-white/4 bg-stone-50/50 dark:bg-white/2' :
                      paired ? 'border-emerald-200 dark:border-emerald-700/30 bg-emerald-50/50 dark:bg-emerald-900/10' :
                      'border-blue-100 dark:border-blue-800/20 bg-blue-50/40 dark:bg-blue-900/8 hover:border-blue-300 dark:hover:border-blue-600/40 cursor-pointer'
                    }`}
                    onClick={() => !paired && device.compatible && setWifiConnecting(device)}>
                    <div className="flex items-center gap-3">
                      {/* Icon  */}
                      <div className={`p-2 rounded-xl border shrink-0 ${
                        paired ? 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700/30 text-emerald-600' :
                        device.compatible ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700/30 text-blue-500' :
                        'bg-stone-100 dark:bg-white/4 border-stone-200 dark:border-white/6 text-stone-400'
                      }`}>
                        <Wifi size={14} />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold font-mono truncate">{device.id}</p>
                          {!device.compatible && <span className="text-[8px] text-stone-400 bg-stone-100 dark:bg-white/5 px-1.5 py-0.5 rounded-full shrink-0">Not compatible</span>}
                          {device.compatible && !paired && <span className="text-[8px] text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-700/30 shrink-0">SenseChain</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <SignalBars rssi={device.rssi} color="blue" />
                          <span className="text-[9px] text-stone-400 font-mono">{device.rssi}</span>
                          <span className="text-[9px] text-stone-400">·</span>
                          <span className="text-[9px] text-stone-400 font-mono">{device.freq}</span>
                          <span className="text-[9px] text-stone-400">·</span>
                          <Lock size={9} className="text-stone-400" />
                          <span className="text-[9px] text-stone-400">{device.security}</span>
                          <span className="text-[9px] text-emerald-500 font-mono ml-auto">{device.latency}</span>
                        </div>
                      </div>

                      {/* Action */}
                      <div className="shrink-0">
                        {paired && ctxNode ? (
                          <div className="text-right">
                            <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 rounded-full border border-emerald-200 dark:border-emerald-700/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              {ctxNode.status}
                            </span>
                            {ctxNode.status === 'Live' && (
                              <p className="text-[8px] text-stone-400 font-mono mt-0.5 text-right">{ctxNode.blocksMined} blk</p>
                            )}
                          </div>
                        ) : device.compatible ? (
                          <div className="flex items-center gap-1 text-blue-500">
                            <span className="text-[10px] font-bold">Connect</span>
                            <ArrowRight size={12} />
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* BLUETOOTH SECTION */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
          className="glass-card rounded-[22px] p-6 relative overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-violet-100 dark:bg-violet-500/12 text-violet-600 dark:text-violet-400 rounded-xl">
                <Bluetooth size={18} />
              </div>
              <div>
                <h3 className="font-bold text-sm" style={{ fontFamily: 'Space Grotesk' }}>Bluetooth BLE</h3>
                <p className="text-[10px] text-stone-400">Discover BLE peripherals in range</p>
              </div>
            </div>
            <motion.button onClick={runBtScan} disabled={btScanning} whileTap={{ scale: 0.95 }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                btScanning
                  ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-500 cursor-wait'
                  : 'bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-600/20'
              }`}>
              <Radio size={12} className={btScanning ? 'animate-spin' : ''} />
              {btScanning ? 'Scanning...' : 'Scan'}
            </motion.button>
          </div>

          {btScanning && (
            <div className="mb-4 w-full bg-violet-50 dark:bg-white/4 rounded-full overflow-hidden h-1">
              <motion.div animate={{ width: `${btScanProgress}%` }} transition={{ duration: 0.3 }}
                className="h-full bg-gradient-to-r from-violet-500 to-purple-400" />
            </div>
          )}

          {/* Device list */}
          <div className="space-y-2.5 min-h-[120px]">
            <AnimatePresence>
              {btDevices.length === 0 && !btScanning && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="py-10 text-center border-2 border-dashed border-stone-100 dark:border-white/5 rounded-2xl">
                  <BluetoothOff size={26} className="mx-auto mb-2 text-stone-300 dark:text-stone-700" />
                  <p className="text-stone-400 text-xs font-medium">No Bluetooth peripherals found</p>
                  <p className="text-[10px] text-stone-400 mt-0.5">Press Scan to discover BLE devices in range</p>
                </motion.div>
              )}
              {btScanning && btDevices.length === 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-8 text-center">
                  <div className="flex justify-center gap-2 mb-3">
                    {[0, 1, 2].map(i => (
                      <motion.div key={i} className="w-2 h-2 rounded-full bg-violet-500"
                        animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.2 }} />
                    ))}
                  </div>
                  <p className="text-[10px] text-violet-500 font-bold uppercase tracking-widest animate-pulse">Broadcasting GATT discovery...</p>
                </motion.div>
              )}
              {btDevices.map((device, idx) => {
                const paired = isPaired(device.id);
                const ctxNode = pairedNodes.find(n => n.id === device.id);
                return (
                  <motion.div key={device.id}
                    initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.08 }}
                    className={`rounded-2xl border p-3.5 transition-all duration-300 ${
                      paired ? 'border-emerald-200 dark:border-emerald-700/30 bg-emerald-50/50 dark:bg-emerald-900/10' :
                      'border-violet-100 dark:border-violet-800/20 bg-violet-50/40 dark:bg-violet-900/8 hover:border-violet-300 dark:hover:border-violet-600/40 cursor-pointer'
                    }`}
                    onClick={() => !paired && setBtConnecting(device)}>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl border shrink-0 ${
                        paired ? 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700/30 text-emerald-600' :
                        'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-700/30 text-violet-500'
                      }`}>
                        <Bluetooth size={14} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold font-mono truncate">{device.id}</p>
                          <span className="text-[8px] text-violet-500 bg-violet-50 dark:bg-violet-900/20 px-1.5 py-0.5 rounded-full border border-violet-200 dark:border-violet-700/30 shrink-0">BLE</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <SignalBars rssi={device.rssi} color="violet" />
                          <span className="text-[9px] text-stone-400 font-mono">{device.rssi}</span>
                          <span className="text-[9px] text-stone-400">·</span>
                          <span className="text-[9px] text-stone-400 font-mono">{device.freq}</span>
                          <span className="text-[9px] text-stone-400">·</span>
                          {/* Battery */}
                          <span className={`text-[9px] font-mono font-bold ${battColor(device.battery)}`}>
                            🔋{device.battery}%
                          </span>
                          <span className="text-[9px] text-amber-500 font-mono ml-auto">{device.latency}</span>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {paired && ctxNode ? (
                          <div className="text-right">
                            <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 rounded-full border border-emerald-200 dark:border-emerald-700/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              {ctxNode.status}
                            </span>
                            {ctxNode.status === 'Live' && (
                              <p className="text-[8px] text-stone-400 font-mono mt-0.5 text-right">{ctxNode.blocksMined} blk</p>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-violet-500">
                            <span className="text-[10px] font-bold">Pair</span>
                            <ArrowRight size={12} />
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* ── CONNECTED NODES (Paired + Live) ── */}
      <AnimatePresence>
        {pairedNodes.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
            className="glass-card rounded-[22px] p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${virtualBreach ? 'bg-red-100 dark:bg-red-500/12 text-red-600' : 'bg-emerald-100 dark:bg-emerald-500/12 text-emerald-600 dark:text-emerald-400'}`}>
                  {virtualBreach ? <ShieldAlert size={18} /> : <ShieldCheck size={18} />}
                </div>
                <div>
                  <h3 className="font-bold text-sm" style={{ fontFamily: 'Space Grotesk' }}>
                    Connected Nodes
                    {isSimulating && !virtualBreach && (
                      <span className="ml-2 text-[8px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full uppercase tracking-wide animate-pulse">● Mining</span>
                    )}
                    {virtualBreach && (
                      <span className="ml-2 text-[8px] font-bold text-red-500 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded-full uppercase tracking-wide animate-pulse">BREACH</span>
                    )}
                  </h3>
                  <p className="text-[10px] text-stone-400">
                    {pairedNodes.length} node{pairedNodes.length !== 1 ? 's' : ''} · {simBlockCount} blocks mined total
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {pairedNodes.map(node => (
                <motion.div key={node.id} layout
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className={`p-4 rounded-2xl border transition-all duration-500 ${
                    virtualBreach ? 'bg-red-50/60 dark:bg-red-900/15 border-red-200 dark:border-red-700/30' :
                    node.status === 'Live' ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-700/30' :
                    'bg-stone-50 dark:bg-white/3 border-stone-200 dark:border-white/5'
                  }`}>

                  {/* Node header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${node.type === 'WiFi' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600' : 'bg-violet-100 dark:bg-violet-900/20 text-violet-600'}`}>
                        {node.type === 'WiFi' ? <Wifi size={12} /> : <Bluetooth size={12} />}
                      </div>
                      <div>
                        <p className="text-xs font-bold font-mono leading-tight">{node.id}</p>
                        <p className="text-[8px] text-stone-400 font-mono">{node.mac}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[8px] font-bold uppercase rounded-full border ${
                        virtualBreach ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                        node.status === 'Live' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                        'bg-yellow-500/10 border-yellow-500/20 text-yellow-500'
                      }`}>
                        <span className={`w-1 h-1 rounded-full ${
                          virtualBreach ? 'bg-red-500 animate-ping' :
                          node.status === 'Live' ? 'bg-emerald-500 animate-pulse' : 'bg-yellow-500 animate-pulse'
                        }`} />
                        {virtualBreach ? 'Compromised' : node.status}
                      </span>
                    </div>
                  </div>

                  {/* Live stats */}
                  {node.status === 'Live' && (
                    <div className="grid grid-cols-3 gap-1.5 mb-3">
                      <div className="bg-white/50 dark:bg-white/4 rounded-xl p-2 text-center border border-stone-100/50 dark:border-white/5">
                        <p className="text-[7px] text-stone-400 uppercase tracking-wide">Blocks</p>
                        <p className="text-xs font-bold font-mono text-red-600 dark:text-red-400">{node.blocksMined}</p>
                      </div>
                      <div className="bg-white/50 dark:bg-white/4 rounded-xl p-2 text-center border border-stone-100/50 dark:border-white/5">
                        <p className="text-[7px] text-stone-400 uppercase tracking-wide">Temp</p>
                        <p className={`text-xs font-bold font-mono ${virtualBreach ? 'text-red-500' : 'text-orange-500'}`}>
                          {virtualBreach ? '99.9' : node.lastTemp?.toFixed(1)}°C
                        </p>
                      </div>
                      <div className="bg-white/50 dark:bg-white/4 rounded-xl p-2 text-center border border-stone-100/50 dark:border-white/5">
                        <p className="text-[7px] text-stone-400 uppercase tracking-wide">Hum</p>
                        <p className="text-xs font-bold font-mono text-sky-500">{node.lastHum?.toFixed(1)}%</p>
                      </div>
                    </div>
                  )}

                  {/* Signal + disconnect */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <SignalBars rssi={node.rssi} color={node.type === 'WiFi' ? 'blue' : 'violet'} />
                      <span className="text-[8px] text-stone-400 font-mono">{node.rssi}</span>
                    </div>
                    {!virtualBreach && (
                      <button onClick={() => handleUnpair(node.id)}
                        className="text-[9px] text-stone-400 hover:text-red-500 font-bold uppercase tracking-wide transition-colors flex items-center gap-1">
                        <X size={10} /> Disconnect
                      </button>
                    )}
                  </div>

                  {/* Mining activity bar */}
                  <div className="mt-2.5 w-full bg-white/5 rounded-full overflow-hidden h-0.5">
                    <motion.div
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ repeat: Infinity, duration: virtualBreach ? 0.5 : (node.type === 'WiFi' ? 1.4 : 2.4), ease: 'linear' }}
                      className={`h-full w-1/2 bg-gradient-to-r from-transparent ${
                        virtualBreach ? 'via-red-400' : node.type === 'WiFi' ? 'via-blue-400' : 'via-violet-400'
                      } to-transparent`}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── RIGHT PANEL: API config + Neural Logs ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* API Config */}
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
              <div className="flex items-center justify-between p-3.5 bg-stone-50 dark:bg-white/4 border border-stone-100 dark:border-white/6 rounded-xl font-mono text-[11px]">
                <span className="truncate mr-2 text-stone-600 dark:text-stone-400">{uplinkData.endpoint || 'https://sensechain.onrender.com'}</span>
                <button onClick={() => navigator.clipboard.writeText(uplinkData.endpoint || 'https://sensechain.onrender.com')}
                  className="text-stone-400 hover:text-red-600 transition-colors shrink-0">
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
            <div className="flex items-center gap-2 text-[10px] font-bold text-stone-500 uppercase tracking-widest">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> Neural Logs
            </div>
            <button onClick={() => setTerminalLogs([{ id: Date.now(), msg: 'Log stream cleared.', type: 'sys' }])}
              className="text-[9px] font-bold text-stone-400 hover:text-red-600 uppercase tracking-wide transition-colors">
              Clear
            </button>
          </div>
          <div className="space-y-2 font-mono text-[10px] max-h-52 overflow-y-auto custom-scrollbar">
            {terminalLogs.map(log => (
              <motion.div key={log.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                className="flex gap-2 items-start">
                <span className={`shrink-0 mt-1 w-1.5 h-1.5 rounded-full ${
                  log.type === 'error'   ? 'bg-red-500' :
                  log.type === 'success' ? 'bg-emerald-500' :
                  log.type === 'warn'    ? 'bg-yellow-500' :
                  log.type === 'sys'     ? 'bg-blue-500' : 'bg-stone-400'
                }`} />
                <p className={`leading-relaxed ${
                  log.type === 'error'   ? 'text-red-500' :
                  log.type === 'success' ? 'text-emerald-500' :
                  log.type === 'warn'    ? 'text-yellow-500' :
                  log.type === 'sys'     ? 'text-blue-400' : 'text-stone-500'
                }`}>{log.msg}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ── WI-FI CONNECT MODAL ── */}
      <AnimatePresence>
        {wifiConnecting && (
          <WifiConnectModal
            device={wifiConnecting}
            onClose={() => setWifiConnecting(null)}
            onComplete={(d) => { handleComplete(d); setWifiConnecting(null); }}
          />
        )}
      </AnimatePresence>

      {/* ── BLUETOOTH PAIR MODAL ── */}
      <AnimatePresence>
        {btConnecting && (
          <BluetoothModal
            device={btConnecting}
            onClose={() => setBtConnecting(null)}
            onComplete={(d) => { handleComplete(d); setBtConnecting(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default UplinkTerminal;