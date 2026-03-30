import { useState, useEffect } from "react";
import {
  ShieldAlert, ShieldCheck, Zap, RefreshCw,
  FileText, Download, Terminal, Activity,
  Fingerprint, Lock, Unlock, ShieldX, ChevronRight,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion"; 
// ✅ IMPORT CENTRAL API INSTANCE
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const Security = ({ integrity = true, chain = [], chainHeight = 0 }) => {
  const { token } = useAuth();

  // --- LOCAL UI STATES (Original Logic Kept) ---
  const [isRepairing, setIsRepairing] = useState(false);
  const [tamperIndex, setTamperIndex] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [repairStep, setRepairStep] = useState("");
  const [localError, setLocalError] = useState(null);
  const [statusMsg, setStatusMsg] = useState(null);

  // Sync tamper index to the latest block when chain grows
  useEffect(() => {
    if (chainHeight > 0 && (tamperIndex === 0 || tamperIndex >= chainHeight)) {
      setTamperIndex(chainHeight - 1);
    }
  }, [chainHeight]);

  // ───────── REAL-TIME ATTACK (Updated for Cloud) ─────────
  const simulateTamper = async () => {
    if (chainHeight === 0) {
      setLocalError("Ledger is empty. Initializing nodes required.");
      return;
    }

    setIsScanning(true);
    setLocalError(null);
    setStatusMsg("Executing manual entropy injection...");

    try {
      // ✅ Updated to use our Central API helper
      // Sending data via POST body is safer than query params for cloud firewalls
      await api.post(`/tamper_block/${tamperIndex}`, { 
        new_temperature: 99.9 
      });
      
      setStatusMsg(`Breach payload deployed at Index #${tamperIndex}`);
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err) {
      console.error("Forensic Blockade:", err);
      setLocalError("Node Firewall prevented the injection or Backend is offline.");
    } finally {
      setIsScanning(false);
    }
  };

  // ───────── REAL-TIME HEALING (Updated for Cloud) ─────────
  const handleRepair = async () => {
    setIsRepairing(true);
    setRepairStep("Initializing forensic recovery...");
    setLocalError(null);

    try {
      // ✅ Request Backend to Recalculate SHA-256 Linkage
      await api.post("/repair_chain");
      
      setStatusMsg("Neural link integrity restored.");
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err) {
      setLocalError("Cluster synchronization failed. Manual reset required.");
    } finally {
      setIsRepairing(false);
      setRepairStep("");
    }
  };

  // ───────── PREMIUM EXPORTS (Robust Cloud Handling) ─────────
  const handleExport = async (format) => {
    try {
      setStatusMsg(`Compiling ${format.toUpperCase()} Audit...`);
      const endpoint = format === "pdf" ? "/export_pdf" : "/export_report";
      
      // ✅ API call with blob response type for file downloads
      const response = await api.get(endpoint, { responseType: "blob" });
      
      const blob = new Blob([response.data], { 
        type: format === "pdf" ? "application/pdf" : "text/csv" 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `SenseChain_Audit_${Date.now()}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setStatusMsg(null);
    } catch (err) {
      setLocalError("Export service temporarily unreachable on Cloud Node.");
    }
  };

  return (
    <div className="p-6 lg:p-12 min-h-screen bg-[#FBFBFD] dark:bg-[#000000] text-[#1D1D1F] dark:text-[#F5F5F7] transition-colors duration-500">
      
      {/* ── TOP NAV / HEADER ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div className="space-y-1">
          <h1 className="text-5xl font-extrabold tracking-tight">
            Security <span className="text-blue-600">Terminal</span>
          </h1>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">
              SenseChain Node ISO-V1.04 • Real-time Sync Active
            </p>
          </div>
        </div>

        <div className="flex gap-3 bg-white dark:bg-[#1C1C1E] p-1.5 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
           <button onClick={() => handleExport("csv")} className="flex items-center gap-2 px-5 py-2.5 text-[11px] font-bold uppercase text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-all">
             <FileText size={16}/> CSV
           </button>
           <button onClick={() => handleExport("pdf")} className="flex items-center gap-2 px-6 py-2.5 text-[11px] font-bold uppercase bg-slate-900 dark:bg-blue-600 text-white rounded-xl shadow-xl hover:bg-blue-700 transition-all active:scale-95">
             <Download size={16}/> PDF Report
           </button>
        </div>
      </div>

      {/* ── NOTIFICATION TOASTS ── */}
      <AnimatePresence>
        {(localError || statusMsg) && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className={`fixed top-24 right-10 z-[100] p-4 rounded-2xl border backdrop-blur-xl shadow-2xl flex items-center gap-3 ${
              localError ? "bg-rose-50/90 border-rose-100 text-rose-600" : "bg-blue-50/90 border-blue-100 text-blue-600"
            }`}
          >
            {localError ? <AlertCircle size={20} /> : <Activity size={20} />}
            <span className="text-xs font-black uppercase tracking-widest">{localError || statusMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* 🔥 MAIN STATUS HERO (Apple Style - Logic Preserved) */}
        <div className={`relative rounded-[40px] border-2 p-10 lg:p-16 overflow-hidden transition-all duration-1000 shadow-2xl
          ${integrity 
            ? "bg-white dark:bg-[#1C1C1E] border-emerald-100/50 dark:border-emerald-500/10" 
            : "bg-white dark:bg-[#1C1C1E] border-rose-200/50 dark:border-rose-500/20 shadow-rose-500/5"}`}>
          
          <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
              <Fingerprint size={280} className={integrity ? "text-emerald-500" : "text-rose-500"} />
          </div>

          <div className="flex flex-col lg:flex-row justify-between items-center gap-12 relative z-10">
            <div className="flex flex-col md:flex-row items-center gap-10 text-center md:text-left">
              <div className={`w-32 h-32 rounded-[32px] flex items-center justify-center shadow-inner transition-all duration-700
                ${integrity 
                  ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500" 
                  : "bg-rose-50 dark:bg-rose-500/10 text-rose-500 animate-pulse scale-105 shadow-[0_0_40px_rgba(244,63,94,0.2)]"}`}>
                {integrity ? <ShieldCheck size={72} strokeWidth={1.5} /> : <ShieldX size={72} strokeWidth={1.5} />}
              </div>

              <div className="space-y-4">
                <h2 className={`text-5xl font-bold tracking-tighter ${integrity ? "text-slate-900 dark:text-white" : "text-rose-600"}`}>
                  {integrity ? "System Healthy" : "Breach Detected"}
                </h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium text-lg max-w-xl leading-relaxed">
                  {integrity 
                    ? "Cryptographic links are verified. Node cluster is operating within normal parameters." 
                    : "Ledger drift detected. Malicious data has severed the SHA-256 hash linkage."}
                </p>
                {!integrity && (
                   <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest">
                     <AlertCircle size={14}/> Forensic Lockdown Enabled
                   </div>
                )}
              </div>
            </div>

            <div className="w-full lg:w-auto">
              {!integrity && !isRepairing && (
                <button onClick={handleRepair} className="w-full lg:min-w-[280px] py-7 bg-slate-900 dark:bg-blue-600 text-white rounded-[24px] font-bold text-sm uppercase tracking-[0.2em] shadow-2xl hover:bg-black dark:hover:bg-blue-500 transition-all active:scale-95 flex items-center justify-center gap-4 group">
                  <RefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-700" />
                  Repair Cluster
                </button>
              )}

              {isRepairing && (
                <div className="flex flex-col items-center gap-4">
                  <RefreshCw className="animate-spin text-blue-500" size={48} />
                  <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] animate-pulse">{repairStep}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── BOTTOM GRID (Original Terminals Kept) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <div className="bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-white/5 rounded-[40px] p-10 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
              <div className="flex items-center gap-4 mb-12">
                  <div className="p-4 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-2xl group-hover:rotate-12 transition-transform duration-500">
                    <Unlock size={24}/>
                  </div>
                  <div>
                      <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Malicious Portal</h3>
                      <p className="text-xl font-bold italic">Cyber Track Terminal</p>
                  </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="number"
                  value={tamperIndex}
                  onChange={(e) => setTamperIndex(Number(e.target.value))}
                  className="w-full sm:w-32 bg-slate-50 dark:bg-black border-2 border-slate-100 dark:border-white/5 rounded-2xl px-6 py-5 text-4xl font-black text-rose-500 outline-none focus:border-rose-300 dark:focus:border-rose-900 transition-all tabular-nums shadow-inner"
                />
                <button
                  onClick={simulateTamper}
                  disabled={isScanning}
                  className="flex-1 bg-white dark:bg-white/5 border-2 border-slate-900 dark:border-white/10 text-slate-900 dark:text-white rounded-[24px] font-bold text-[11px] uppercase tracking-widest hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all active:scale-95 shadow-md flex items-center justify-center gap-3"
                >
                  {isScanning ? <RefreshCw className="animate-spin" size={18} /> : <Zap size={18}/>}
                  Simulate Cyber Attack
                </button>
              </div>
              <p className="text-[9px] font-bold text-slate-400 uppercase mt-10 tracking-[0.2em] text-center opacity-60 italic">Authorized Pen-Testing Mode • Node Isolation</p>
          </div>

          <div className="bg-slate-900 dark:bg-[#1C1C1E] rounded-[40px] p-10 text-white shadow-2xl flex flex-col justify-between group overflow-hidden relative border border-white/5">
              <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-blue-600/10 rounded-full blur-[100px] group-hover:bg-blue-600/20 transition-all duration-1000" />
              
              <div>
                  <div className="flex items-center gap-4 mb-8">
                      <Terminal size={20} className="text-blue-400"/>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Neural Log Analyzer</span>
                  </div>
                  <div className="space-y-4 font-mono text-sm leading-relaxed italic text-slate-400">
                     <p className="text-blue-400/80">&gt; Target_Node: Block_#{tamperIndex}</p>
                     <p>&gt; Integrity_Check: {integrity ? "PASS" : "FAIL"}</p>
                     <p className="text-slate-200 mt-4 leading-relaxed">
                       "Every block in the SenseChain is linked via SHA-256. Tampering with data at index #{tamperIndex} creates a mathematical ripple that invalidates all subsequent hashes."
                     </p>
                  </div>
              </div>

              <div className="flex items-center justify-between pt-8 border-t border-white/5 mt-10">
                  <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${integrity ? 'bg-blue-500' : 'bg-rose-500 animate-ping'}`} />
                      <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Monitoring Active</span>
                  </div>
                  <ChevronRight size={24} className="text-slate-700 group-hover:text-blue-500 transition-all duration-300"/>
              </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Security;