import React, { useState, useEffect, useCallback } from 'react';
import { 
  Cpu, Wifi, Link, Terminal, CheckCircle2, RefreshCw, 
  Smartphone, Copy, Activity, Search, Bluetooth, Zap, 
  Radio, Radar, ShieldCheck, X, Globe, Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- SUB-COMPONENT: HANDSHAKE MODAL ---
const HandshakeModal = ({ node, onClose, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const handshakeSteps = [
    { title: "Initializing Tunnel", desc: "Establishing encrypted P2P bridge..." },
    { title: "Key Exchange", desc: "Syncing SHA-256 public hardware keys..." },
    { title: "Identity Check", desc: "Verifying MAC: " + (node.mac || "AA:BB:CC:XX") },
    { title: "Link Secured", desc: "Node authorized for Block Mining." }
  ];

  useEffect(() => {
    if (currentStep < handshakeSteps.length - 1) {
      const timer = setTimeout(() => setCurrentStep(prev => prev + 1), 1800);
      return () => clearTimeout(timer);
    } else {
      const finalize = setTimeout(() => {
        onComplete(node.id);
        onClose();
      }, 1200);
      return () => clearTimeout(finalize);
    }
  }, [currentStep, node, onClose, onComplete]);

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#020617]/90 backdrop-blur-md p-6">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }} 
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 border border-blue-500/30 p-8 md:p-12 rounded-[3rem] max-w-lg w-full shadow-[0_0_50px_rgba(59,130,246,0.2)] relative overflow-hidden"
      >
        {/* Progress Bar Top */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-100 dark:bg-slate-800">
           <motion.div 
             initial={{ width: 0 }} 
             animate={{ width: `${((currentStep + 1) / handshakeSteps.length) * 100}%` }} 
             className="h-full bg-blue-600 shadow-[0_0_15px_#2563eb]" 
           />
        </div>

        <div className="text-center mb-10">
          <div className="inline-flex p-5 bg-blue-600/10 rounded-3xl mb-6">
             <ShieldCheck size={40} className="text-blue-600 animate-pulse" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight">Neural Handshake</h2>
          <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] mt-2 italic">Targeting: {node.id}</p>
        </div>

        <div className="space-y-6">
          {handshakeSteps.map((step, idx) => (
            <motion.div 
              key={idx}
              animate={{ opacity: idx <= currentStep ? 1 : 0.2, x: idx <= currentStep ? 0 : -10 }}
              className="flex items-start gap-4"
            >
              <div className={`mt-1 p-1 rounded-full ${idx < currentStep ? 'bg-emerald-500 text-white' : idx === currentStep ? 'bg-blue-600 text-white animate-bounce' : 'bg-slate-200 dark:bg-slate-800'}`}>
                {idx < currentStep ? <CheckCircle2 size={14} /> : <div className="w-3.5 h-3.5" />}
              </div>
              <div>
                <p className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase italic">{step.title}</p>
                <p className="text-[10px] text-slate-500 font-bold leading-relaxed">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---
const UplinkTerminal = ({ activeNodes = {}, connError }) => {
  const [uplinkData, setUplinkData] = useState({ ip: 'Detecting...', endpoint: '' });
  const [isScanning, setIsScanning] = useState(false);
  const [discoveredDevices, setDiscoveredDevices] = useState([]);
  const [pairingNode, setPairingNode] = useState(null);
  const [terminalLogs, setTerminalLogs] = useState([
    { id: 1, msg: "SenseChain Kernel V12 Loaded.", type: "sys" }
  ]);

  const addLog = useCallback((msg, type = "info") => {
    setTerminalLogs(prev => [{ id: Date.now(), msg, type }, ...prev].slice(0, 6));
  }, []);

  // ⚡ STAGGERED DISCOVERY LOGIC
  const runDiscovery = () => {
    setIsScanning(true);
    setDiscoveredDevices([]);
    addLog("Initiating Wide-Spectrum Wireless Scan...", "warn");

    setTimeout(() => {
      setDiscoveredDevices(prev => [...prev, { id: 'SENSE-NODE-ALPHA', mac: 'BC:FF:45:01', rssi: '-45dBm', type: 'WiFi' }]);
      addLog("Node Detected: SENSE-NODE-ALPHA (ESP32)", "success");
    }, 1500);

    setTimeout(() => {
      setDiscoveredDevices(prev => [...prev, { id: 'FORENSIC-HUB-BETA', mac: 'DE:22:90:X1', rssi: '-62dBm', type: 'BT' }]);
      addLog("Node Detected: FORENSIC-HUB-BETA (BLE)", "success");
    }, 3200);

    setTimeout(() => {
      setIsScanning(false);
      addLog("Scan Cycle Complete. Waiting for pairing.", "sys");
    }, 4500);
  };

  useEffect(() => {
    fetch('http://localhost:8000/get_uplink_ip')
      .then(res => res.json())
      .then(data => setUplinkData(data))
      .catch(() => addLog("Backend Uplink Offline", "error"));
  }, [addLog]);

  return (
    <div className="p-6 md:p-10 space-y-8 bg-[#F8FAFC] dark:bg-[#020617] min-h-screen transition-all duration-700">
      
      {/* ── HEADER ── */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-5xl font-black tracking-tighter text-slate-900 dark:text-white ">
            Uplink <span className="text-blue-600">Terminal</span>
          </h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-2 italic">Hardware Provisioning Interface</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 📟 DISCOVERY & PAIRING PANEL */}
        <div className="lg:col-span-2 space-y-6 relative">
          
          <AnimatePresence>
            {isScanning && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 bg-blue-600/5 backdrop-blur-[3px] rounded-[3rem] flex flex-col items-center justify-center border-2 border-blue-500/20 pointer-events-none"
              >
                <div className="relative p-10 bg-blue-600 rounded-full text-white shadow-[0_0_50px_rgba(37,99,235,0.4)]">
                   <Radar size={48} className="animate-spin-slow" />
                   <motion.div animate={{ scale: [1, 1.8], opacity: [0.4, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute inset-0 bg-blue-500 rounded-full" />
                </div>
                <p className="mt-8 text-xs font-black text-blue-600 uppercase tracking-[0.6em] animate-pulse">Scanning Neural Frequencies...</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="bg-white dark:bg-slate-900/80 backdrop-blur-2xl p-8 rounded-[3rem] border border-white dark:border-white/5 shadow-2xl">
            <div className="flex items-center justify-between mb-10">
               <div className="flex items-center gap-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-600/20 text-blue-600 rounded-2xl shadow-inner"><Radio size={24} /></div>
                  <h3 className="text-xl font-black dark:text-white uppercase italic tracking-tight">Wireless Discovery</h3>
               </div>
               <button 
                onClick={runDiscovery}
                disabled={isScanning}
                className="group relative px-8 py-3.5 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest overflow-hidden hover:scale-105 transition-all shadow-xl shadow-blue-500/20"
               >
                 <span className="relative z-10 flex items-center gap-2">
                    {isScanning ? <RefreshCw className="animate-spin" size={14}/> : <Zap size={14}/>}
                    {isScanning ? 'Probing...' : 'Initiate Scan'}
                 </span>
               </button>
            </div>

            <div className="space-y-4 min-h-[260px]">
              <AnimatePresence mode='popLayout'>
                {discoveredDevices.length === 0 && !isScanning && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-24 text-center border-2 border-dashed border-slate-100 dark:border-white/5 rounded-[2.5rem]">
                    <Search className="mx-auto text-slate-200 dark:text-slate-800 mb-4" size={56} />
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest italic">No active neural nodes detected in radius</p>
                  </motion.div>
                )}
                
                {discoveredDevices.map((device) => (
                  <motion.div 
                    layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} key={device.id}
                    className="flex items-center justify-between p-6 bg-slate-50 dark:bg-black/40 border border-slate-100 dark:border-white/5 rounded-[2rem] hover:border-blue-500/40 transition-all group"
                  >
                    <div className="flex items-center gap-5">
                      <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        {device.type === 'WiFi' ? <Wifi size={22} /> : <Bluetooth size={22} />}
                      </div>
                      <div>
                        <p className="font-black text-slate-900 dark:text-white text-md uppercase italic tracking-tighter">{device.id}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">{device.type} PROTOCOL • {device.rssi} SIGNAL</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setPairingNode(device)}
                      className="px-6 py-3 bg-slate-900 dark:bg-blue-600 text-white text-[10px] font-black uppercase rounded-xl hover:scale-105 transition-all shadow-lg"
                    >
                      Pair Node
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* 🔗 AUTHORIZED CLUSTERS */}
          <div className="bg-white dark:bg-slate-900/80 backdrop-blur-2xl p-8 rounded-[3rem] border border-white dark:border-white/5 shadow-2xl">
             <div className="flex items-center gap-4 mb-8">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-500/20 text-emerald-500 rounded-2xl"><ShieldCheck size={24} /></div>
                <h3 className="text-xl font-black dark:text-white uppercase italic tracking-tight">Authorized Clusters</h3>
             </div>
             <div className="space-y-4">
                {Object.keys(activeNodes).length > 0 ? Object.entries(activeNodes).map(([id, info]) => (
                  <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={id} className="flex items-center justify-between p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-[2rem]">
                     <div className="flex items-center gap-5">
                        <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm text-emerald-500"><Smartphone /></div>
                        <div>
                           <p className="font-black text-slate-900 dark:text-white italic text-lg uppercase">{id}</p>
                           <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                             <Activity size={12} className="animate-pulse" /> Live Stream: {info.last_data || 'Linked'}
                           </p>
                        </div>
                     </div>
                     <div className="text-right">
                        <span className="px-3 py-1 bg-emerald-500 text-white text-[9px] font-black uppercase rounded-full animate-pulse shadow-lg shadow-emerald-500/20">Synced</span>
                        <p className="text-[8px] text-slate-400 font-bold uppercase mt-2">Latency: 0.12ms</p>
                     </div>
                  </motion.div>
                )) : (
                  <div className="py-12 text-center bg-slate-50/50 dark:bg-black/20 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-white/5">
                     <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] italic">Awaiting Wireless Neural Handshake...</p>
                  </div>
                )}
             </div>
          </div>
        </div>

        {/* ⚙️ CONFIG & LOGS */}
        <div className="space-y-8">
          
          <div className="bg-slate-900 dark:bg-black rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden border border-white/5">
            <div className="absolute top-[-20%] right-[-10%] p-10 opacity-5 rotate-12"><Globe size={240}/></div>
            <div className="relative z-10 space-y-8">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-blue-600 text-white rounded-[2rem] shadow-xl shadow-blue-500/20"><Terminal size={24} /></div>
                <h3 className="text-sm font-black uppercase tracking-[0.3em]">Manual Uplink</h3>
              </div>
              
              <div className="space-y-4">
                 <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Static API Gateway</p>
                 <div className="flex items-center justify-between p-5 bg-white/5 border border-white/10 rounded-2xl font-mono text-[10px] text-blue-400 italic">
                    <span className="truncate mr-2 tabular-nums">{uplinkData.endpoint || 'FETCHING...'}</span>
                    <button onClick={() => {navigator.clipboard.writeText(uplinkData.endpoint); addLog("Endpoint copied.", "success")}} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                      <Copy size={16} />
                    </button>
                 </div>
              </div>

              <div className="p-6 bg-blue-600/5 border border-blue-500/20 rounded-[2rem] flex items-center gap-4">
                 <Lock className="text-blue-500" size={24} />
                 <p className="text-[10px] text-slate-400 leading-relaxed font-bold italic uppercase tracking-tighter">
                    "Secure peer-to-peer tunnel is active. Encrypt all local packets."
                 </p>
              </div>
            </div>
          </div>

          {/* REAL-TIME TERMINAL LOGS */}
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-white/5 p-8 shadow-xl">
             <div className="flex items-center justify-between mb-8">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic">Neural Logs</h4>
                <div className="flex gap-1">
                   <div className="w-1 h-3 bg-blue-500 animate-pulse" />
                   <div className="w-1 h-5 bg-blue-400 animate-pulse delay-75" />
                   <div className="w-1 h-2 bg-blue-600 animate-pulse delay-150" />
                </div>
             </div>
             <div className="space-y-4 font-mono text-[10px]">
                {terminalLogs.map(log => (
                  <div key={log.id} className="flex gap-3 items-start">
                     <span className="text-slate-300 dark:text-slate-700 select-none">&gt;</span>
                     <p className={`${log.type === 'error' ? 'text-rose-500' : log.type === 'success' ? 'text-emerald-500' : log.type === 'warn' ? 'text-blue-400' : 'text-slate-500'} font-bold leading-tight uppercase italic`}>
                       {log.msg}
                     </p>
                  </div>
                ))}
             </div>
          </div>

        </div>
      </div>

      {/* PAIRING OVERLAY MODAL */}
      <AnimatePresence>
        {pairingNode && (
          <HandshakeModal 
            node={pairingNode} 
            onClose={() => setPairingNode(null)} 
            onComplete={(id) => addLog(`Handshake Finalized with ${id}`, "success")}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default UplinkTerminal;