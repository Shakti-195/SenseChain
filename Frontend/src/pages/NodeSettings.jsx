import { useState, useEffect } from 'react';
import { 
  Cpu, Database, RefreshCw, Trash2, 
  Terminal, Info, AlertTriangle, Save, 
  ChevronRight, Gauge, Activity
} from 'lucide-react';
import { motion } from 'framer-motion'; 
import api from '../services/api';

const NodeSettings = ({
  chainHeight = 0,
  integrity = true,
  lastUpdated = new Date(),
}) => {
  const [difficulty, setDifficulty] = useState(3);
  const [isSaving, setIsSaving] = useState(false);

  // ✅ Fix: Dark mode logic synced to the 'dark' class on <html>
  const [isDarkMode, setIsDarkMode] = useState(document.documentElement.classList.contains('dark'));

  useEffect(() => {
    // Sync difficulty from backend on mount
    const fetchDifficulty = async () => {
      try {
        const res = await api.get('/difficulty');
        if (res.data.difficulty) setDifficulty(res.data.difficulty);
      } catch (_) {
        console.warn("NodeSettings: Initial sync failed");
      }
    };
    fetchDifficulty();

    // ✅ MutationObserver to watch for dark mode changes in real-time (Header Sync)
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  const handleUpdateDifficulty = async () => {
    setIsSaving(true);
    try {
      await api.post(`/update_config`, { difficulty: difficulty });
      alert(`Protocol Updated: Consensus target set to ${difficulty}`);
    } catch (err) {
      alert("Failed to communicate with Node Cluster.");
    }
    setIsSaving(false);
  };

  const handleResetLedger = async () => {
    const confirmed = window.confirm("CRITICAL: Purge MongoDB and local archives?");
    if (confirmed) {
      try {
        await api.post('/reset_ledger');
        window.location.reload();
      } catch (err) {
        alert("System Protection: Reset denied.");
      }
    }
  };

  return (
    <div className={`min-h-screen p-6 md:p-12 transition-colors duration-700 font-sans
      ${isDarkMode ? 'bg-[#000000] text-white' : 'bg-[#F5F5F7] text-[#1D1D1F]'}`}>
      
      <div className="max-w-[1200px] mx-auto space-y-12">
        
        {/* ── HEADER: Synced with Original Logic ── */}
        <header className="flex flex-col md:flex-row justify-between items-end md:items-center gap-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }}
            className="space-y-2"
          >
            <h2 className="text-5xl font-black tracking-tighter ">
              Node <span className="text-blue-500">Configuration</span>
            </h2>
            <div className="flex items-center gap-3">
               <div className={`px-3 py-1 rounded-full border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-indigo-500/10 border-indigo-500/20'}`}>
                  <p className={`text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2 ${isDarkMode ? 'text-slate-400' : 'text-indigo-500'}`}>
                    <Terminal size={12}/> SenseChain Protocol V1.0.4
                  </p>
               </div>
            </div>
          </motion.div>

          {/* Real-time Integrity & Sync Display (Header Logic) */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`px-6 py-4 rounded-[22px] backdrop-blur-3xl border flex items-center gap-6 shadow-2xl transition-all duration-500
            ${isDarkMode ? 'bg-white/5 border-white/10 shadow-black' : 'bg-white/80 border-white shadow-slate-200'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full shadow-[0_0_15px] ${integrity ? 'bg-emerald-500 shadow-emerald-500' : 'bg-rose-500 shadow-rose-500 animate-ping'}`} />
              <span className="text-[11px] font-black uppercase tracking-widest opacity-70">
                {integrity ? 'Neural Link Secure' : 'Integrity Breach'}
              </span>
            </div>
            <div className="w-px h-6 bg-slate-500/20" />
            <span className="text-[11px] font-bold opacity-40 font-mono italic">
              SYNC_{new Date(lastUpdated).toLocaleTimeString()}
            </span>
          </motion.div>
        </header>

        {/* ── MAIN SETTINGS GRID ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* CONSENSUS ENGINE: Difficulty Slider */}
          <motion.div 
            whileHover={{ y: -5 }}
            className={`lg:col-span-7 p-10 rounded-[40px] border relative overflow-hidden transition-all duration-500
            ${isDarkMode ? 'bg-[#1C1C1E] border-white/5 shadow-2xl' : 'bg-white border-white shadow-xl shadow-slate-200'}`}>
            
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] rotate-12">
               <Gauge size={220} className="text-indigo-500" />
            </div>

            <div className="relative z-10 flex flex-col h-full justify-between space-y-12">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-indigo-500 text-white rounded-2xl shadow-xl shadow-indigo-500/20">
                  <Cpu size={28}/>
                </div>
                <div>
                  <h3 className="text-2xl font-black italic uppercase tracking-tight text-inherit">Consensus Engine</h3>
                  <p className="text-[10px] font-bold opacity-40 uppercase tracking-[0.2em]">Hardware Difficulty Scaling</p>
                </div>
              </div>

              <div className="space-y-10">
                <div className="space-y-6">
                  <div className="flex justify-between items-end">
                    <span className="text-[11px] font-black uppercase tracking-widest opacity-40 italic text-indigo-500">Leading Zeros (SHA-256)</span>
                    <span className="text-7xl font-black italic tracking-tighter">{difficulty}</span>
                  </div>
                  
                  <div className="relative group py-4">
                    <input
                      type="range" min="1" max="5" value={difficulty}
                      onChange={(e) => setDifficulty(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 dark:bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>
                </div>

                <button
                  onClick={handleUpdateDifficulty}
                  disabled={isSaving}
                  className="w-full py-6 rounded-3xl font-black uppercase italic tracking-[0.2em] text-xs bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 transition-all shadow-2xl shadow-indigo-500/40 flex items-center justify-center gap-3 group"
                >
                  {isSaving ? <RefreshCw className="animate-spin"/> : <Save size={18} className="group-hover:rotate-12 transition-transform"/>}
                  Update Protocol
                </button>
              </div>
            </div>
          </motion.div>

          {/* MAINTENANCE CARD */}
          <div className="lg:col-span-5 flex flex-col gap-8">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className={`p-10 rounded-[40px] border flex-1 flex flex-col justify-between transition-all duration-500
              ${isDarkMode ? 'bg-[#1C1C1E] border-rose-500/20 shadow-2xl shadow-rose-900/10' : 'bg-white border-rose-100 shadow-xl'}`}>
              
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-rose-500/10 text-rose-500 rounded-2xl">
                    <Database size={28}/>
                  </div>
                  <h3 className="text-xl font-black italic uppercase tracking-tight text-rose-500">Maintenance</h3>
                </div>
                <div className={`p-5 rounded-2xl border flex gap-4 ${isDarkMode ? 'bg-rose-500/5 border-rose-500/10' : 'bg-rose-50 border-rose-100'}`}>
                  <AlertTriangle className="text-rose-500 shrink-0" size={20}/>
                  <p className={`text-[11px] font-bold leading-relaxed uppercase italic tracking-wider ${isDarkMode ? 'opacity-60' : 'text-rose-800'}`}>
                    Ledger Purge: Purging will permanently delete all shards from the blockchain and clear MongoDB.
                  </p>
                </div>
              </div>

              <button
                onClick={handleResetLedger}
                className="mt-8 w-full py-5 rounded-[22px] font-black text-[10px] uppercase tracking-[0.3em] border-2 border-rose-500 text-rose-500 hover:bg-rose-500 hover:text-white transition-all active:scale-95 shadow-xl shadow-rose-500/5"
              >
                Reset Ledger
              </button>
            </motion.div>

            {/* QUICK STATS SUB-CARD */}
            <div className={`p-8 rounded-[40px] border flex items-center justify-between transition-all duration-500
              ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-white border-white shadow-xl shadow-slate-200'}`}>
               <div className="flex gap-10">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black opacity-30 uppercase tracking-widest">Blocks</p>
                    <h4 className="text-3xl font-black italic">{chainHeight}</h4>
                  </div>
                  <div className="space-y-1 text-emerald-500">
                    <p className="text-[10px] font-black opacity-30 uppercase tracking-widest">Status</p>
                    <h4 className="text-3xl font-black italic">
                      {integrity ? 'Healthy' : 'Error'}
                    </h4>
                  </div>
               </div>
               <Activity size={32} className="opacity-10" />
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <p className="text-center text-[10px] font-black uppercase tracking-[0.5em] opacity-20">
          Neural Infrastructure • Optimized Consensus • SenseChain Terminal
        </p>
      </div>
    </div>
  );
};

export default NodeSettings;