import React, { useState, useEffect, useCallback } from 'react';
import { 
  Cpu, Wifi, Link, Terminal, CheckCircle2, RefreshCw, 
  Smartphone, Copy, Activity, Search, Bluetooth, Zap, 
  Radio, Radar, ShieldCheck, X, Globe, Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../services/api';

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
    const runHandshake = async () => {
      if (currentStep < handshakeSteps.length - 1) {
        const timer = setTimeout(() => setCurrentStep(prev => prev + 1), 1500);
        return () => clearTimeout(timer);
      } else {
        // ✅ FINAL STEP: Call Backend to authorize the node
        try {
          await API.post('/node_handshake', {
            node_id: node.id,
            mac_addr: node.mac
          });
          
          setTimeout(() => {
            onComplete(node.id);
            onClose();
          }, 800);
        } catch (err) {
          console.error("Handshake Failed at Backend", err);
          onClose();
        }
      }
    };
    runHandshake();
  }, [currentStep, node]);

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#020617]/90 backdrop-blur-md p-6">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-slate-900 border border-blue-500/30 p-8 md:p-12 rounded-[3.5rem] max-w-lg w-full shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-800">
           <motion.div initial={{ width: 0 }} animate={{ width: `${((currentStep + 1) / handshakeSteps.length) * 100}%` }} className="h-full bg-blue-600 shadow-[0_0_15px_#2563eb]" />
        </div>
        <div className="text-center mb-10">
          <div className="inline-flex p-5 bg-blue-600/10 rounded-3xl mb-6"><ShieldCheck size={40} className="text-blue-600 animate-pulse" /></div>
          <h2 className="text-2xl font-black dark:text-white uppercase italic tracking-tight">Neural Handshake</h2>
          <p className="text-[9px] font-black text-blue-500 uppercase tracking-[0.4em] mt-2 italic">Linking: {node.id}</p>
        </div>
        <div className="space-y-6">
          {handshakeSteps.map((step, idx) => (
            <motion.div key={idx} animate={{ opacity: idx <= currentStep ? 1 : 0.2 }} className="flex items-start gap-4">
              <div className={`mt-1 p-1 rounded-full ${idx < currentStep ? 'bg-emerald-500 text-white' : 'bg-blue-600 text-white animate-bounce'}`}>
                {idx < currentStep ? <CheckCircle2 size={12} /> : <Zap size={12} />}
              </div>
              <div>
                <p className="text-xs font-black dark:text-slate-100 uppercase italic">{step.title}</p>
                <p className="text-[9px] text-slate-500 font-bold">{step.desc}</p>
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

  const runDiscovery = () => {
    setIsScanning(true);
    setDiscoveredDevices([]);
    addLog("Neural Scan Initiated...", "warn");
    setTimeout(() => {
      setDiscoveredDevices([
        { id: 'SENSE-NODE-ALPHA', mac: 'BC:FF:45:01', rssi: '-45dBm', type: 'WiFi' },
        { id: 'FORENSIC-HUB-BETA', mac: 'DE:22:90:X1', rssi: '-62dBm', type: 'BT' }
      ]);
      setIsScanning(false);
      addLog("Nodes Detected. Waiting for handshake.", "success");
    }, 3000);
  };

  useEffect(() => {
    API.get('/get_uplink_ip')
      .then(res => setUplinkData(res.data))
      .catch(() => addLog("Node IP Detection Failed", "error"));
  }, [addLog]);

  return (
    <div className="p-6 md:p-10 space-y-8 bg-[#F8FAFC] dark:bg-[#020617] min-h-screen transition-all">
      
      {/* ── HEADER ── */}
      <div>
        <h1 className="text-5xl font-black tracking-tighter dark:text-white uppercase italic">
          Uplink <span className="text-blue-600">Terminal</span>
        </h1>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-2">Neural Provisioning V.12</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 📟 DISCOVERY & PAIRING PANEL */}
        <div className="lg:col-span-2 space-y-8 relative">
          
          <AnimatePresence>
            {isScanning && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 bg-blue-600/5 backdrop-blur-md rounded-[3rem] flex flex-col items-center justify-center border border-blue-500/20">
                <Radar size={64} className="text-blue-600 animate-spin-slow mb-4" />
                <p className="text-xs font-black text-blue-600 uppercase tracking-[0.5em] animate-pulse">Syncing neural frequencies...</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Wireless Discovery Card */}
          <div className="bg-white dark:bg-slate-900/50 p-8 rounded-[3rem] border border-slate-200 dark:border-white/5 shadow-2xl">
            <div className="flex items-center justify-between mb-10">
               <h3 className="text-xl font-black dark:text-white uppercase italic">Wireless Discovery</h3>
               <button onClick={runDiscovery} disabled={isScanning} className="px-8 py-3.5 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-blue-600/20">
                  {isScanning ? 'Scanning...' : 'Initiate Scan'}
               </button>
            </div>
            <div className="space-y-4">
              {discoveredDevices.length === 0 && !isScanning && (
                <div className="py-20 text-center border-2 border-dashed border-slate-100 dark:border-white/5 rounded-[2.5rem]">
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest italic">Zero active nodes in vicinity</p>
                </div>
              )}
              {discoveredDevices.map((device) => (
                <div key={device.id} className="flex items-center justify-between p-6 bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-[2rem]">
                  <div className="flex items-center gap-5">
                    <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl text-blue-500">{device.type === 'WiFi' ? <Wifi size={22} /> : <Bluetooth size={22} />}</div>
                    <div>
                      <p className="font-black dark:text-white uppercase italic">{device.id}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{device.mac} • {device.rssi}</p>
                    </div>
                  </div>
                  <button onClick={() => setPairingNode(device)} className="px-6 py-3 bg-slate-900 dark:bg-blue-600 text-white text-[10px] font-black uppercase rounded-xl hover:bg-blue-700 transition-all">Pair Node</button>
                </div>
              ))}
            </div>
          </div>

          {/* ✅ AUTHORIZED CLUSTERS (REPAIRED) */}
          <div className="bg-white dark:bg-slate-900/50 p-8 rounded-[3rem] border border-slate-200 dark:border-white/5 shadow-2xl">
             <div className="flex items-center gap-4 mb-8">
                <div className="p-4 bg-emerald-500/10 text-emerald-500 rounded-2xl"><ShieldCheck size={24} /></div>
                <h3 className="text-xl font-black dark:text-white uppercase italic">Authorized Clusters</h3>
             </div>
             <div className="space-y-4">
                {Object.keys(activeNodes).length > 0 ? Object.entries(activeNodes).map(([id, info]) => (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={id} className="flex items-center justify-between p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-[2.5rem]">
                     <div className="flex items-center gap-5">
                        <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl text-emerald-500 shadow-sm"><Smartphone /></div>
                        <div>
                           <p className="font-black dark:text-white italic text-lg uppercase">{id}</p>
                           <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                             <Activity size={12} className="animate-pulse" /> Status: {info.status || 'Active Sync'}
                           </p>
                        </div>
                     </div>
                     <div className="text-right">
                        <span className="px-4 py-1.5 bg-emerald-500 text-white text-[9px] font-black uppercase rounded-full shadow-lg shadow-emerald-500/20">Secured</span>
                        <p className="text-[8px] text-slate-400 font-bold uppercase mt-2">Latency: {Math.floor(Math.random() * 5) + 1}ms</p>
                     </div>
                  </motion.div>
                )) : (
                  <div className="py-16 text-center bg-slate-100/50 dark:bg-black/20 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-white/5">
                     <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] italic animate-pulse">Awaiting P2P Link Authorization...</p>
                  </div>
                )}
             </div>
          </div>
        </div>

        {/* ⚙️ CONFIG & LOGS */}
        <div className="space-y-8">
          <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl border border-white/5">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-4 bg-blue-600 rounded-2xl shadow-lg shadow-blue-600/20"><Terminal size={24} /></div>
              <h3 className="text-sm font-black uppercase tracking-widest">Manual Uplink</h3>
            </div>
            <div className="space-y-6">
               <div>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">API GATEWAY</p>
                  <div className="flex items-center justify-between p-5 bg-white/5 border border-white/10 rounded-2xl font-mono text-[10px] text-blue-400 italic">
                    <span className="truncate mr-2">{uplinkData.endpoint || 'FETCHING...'}</span>
                    <button onClick={() => {navigator.clipboard.writeText(uplinkData.endpoint); addLog("API Link Copied", "success")}} className="hover:text-white transition-colors"><Copy size={16} /></button>
                  </div>
               </div>
               <div className="p-6 bg-blue-600/10 border border-blue-500/20 rounded-[2rem] flex items-center gap-4">
                  <Lock className="text-blue-500 shrink-0" size={24} />
                  <p className="text-[10px] text-slate-400 leading-relaxed font-bold uppercase italic tracking-tighter">"Neural Tunnel Secure. Hardware nodes ready for Block Mining."</p>
               </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-white/5 p-8 shadow-xl">
             <div className="flex items-center justify-between mb-8">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Neural Logs</h4>
                <div className="flex gap-1 h-4 items-end">
                   {[...Array(3)].map((_, i) => <div key={i} className={`w-1 bg-blue-500 animate-pulse delay-${i * 75}`} style={{height: `${(i+1)*6}px`}} />)}
                </div>
             </div>
             <div className="space-y-4 font-mono text-[10px]">
                {terminalLogs.map(log => (
                  <div key={log.id} className="flex gap-3 items-start">
                     <span className="text-slate-300 dark:text-slate-700">&gt;</span>
                     <p className={`${log.type === 'error' ? 'text-rose-500' : log.type === 'success' ? 'text-emerald-500' : 'text-slate-500'} font-bold uppercase italic`}>{log.msg}</p>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {pairingNode && (
          <HandshakeModal 
            node={pairingNode} 
            onClose={() => setPairingNode(null)} 
            onComplete={(id) => addLog(`Cluster authorized: ${id}`, "success")}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default UplinkTerminal;