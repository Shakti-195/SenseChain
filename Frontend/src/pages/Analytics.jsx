import { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell, AreaChart, Area 
} from 'recharts';
import { 
  Activity, Zap, Clock, ShieldCheck, Database, 
  ChevronRight, X, TrendingUp, TrendingDown, 
  Layers, Globe, ShieldAlert 
} from 'lucide-react';
import api from '../services/api';

const Analytics = ({
  chain = [],
  integrity = true,
  lastUpdated = "",
}) => {
  const [currentDifficulty, setCurrentDifficulty] = useState(3);
  const [activeDetail, setActiveDetail] = useState(null);
  const isDarkMode = document.documentElement.classList.contains('dark');

  // Sync Difficulty logic
  useEffect(() => {
    const fetchDifficulty = async () => {
      try {
        const res = await api.get('/difficulty');
        if (res.data?.difficulty !== undefined) {
          setCurrentDifficulty(res.data.difficulty);
        }
      } catch (_) {
        console.warn("Analytics: Difficulty sync failed");
      }
    };
    fetchDifficulty();
    const interval = setInterval(fetchDifficulty, 10000);
    return () => clearInterval(interval);
  }, []);

  const miningData = useMemo(() => chain.slice(-15).map(b => ({
    block: `#${b.index}`,
    nonce: b.nonce,
    timestamp: b.timestamp
  })), [chain]);

  const getComparisonData = (type) => {
    if (chain.length < 2) return { current: '--', previous: '--', diff: 0, unit: '' };
    const currentBlock = chain[chain.length - 1];
    const previousBlock = chain[chain.length - 2];

    switch(type) {
      case 'transactions':
        return { current: chain.length, previous: chain.length - 1, diff: 1, unit: 'Blocks' };
      case 'difficulty':
        return { current: `${currentDifficulty} Zeros`, previous: 'Standard', diff: currentDifficulty, unit: 'Level' };
      case 'mining':
        const diff = currentBlock.nonce - previousBlock.nonce;
        return { current: currentBlock.nonce, previous: previousBlock.nonce, diff: diff, unit: 'Iter' };
      case 'status':
        return { current: integrity ? "Secured" : "Breached", previous: "Stable", diff: integrity ? 0 : 1, unit: 'Alert' };
      default: return { current: '--', previous: '--', diff: 0, unit: '' };
    }
  };

  return (
    <div className="p-6 md:p-10 space-y-10 animate-in fade-in duration-500 max-w-full mx-auto bg-slate-50 dark:bg-[#020617] min-h-screen transition-colors">
      
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white ">
            Mining <span className="text-blue-600">Analytics</span>
          </h1>
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] mt-1">
            PoW Computational Metrics & Cluster Persistence
          </p>
        </div>
        <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-3 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-xl">
            <div className="px-6 py-1 border-r border-slate-100 dark:border-slate-800 text-right">
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Neural Link</span>
                <span className="text-xs font-bold text-blue-600 tabular-nums">
                    {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : "--:--"}
                </span>
            </div>
            <div className={`p-3 rounded-2xl ${integrity ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500' : 'bg-rose-50 dark:bg-rose-950/30 text-rose-500 animate-pulse'}`}>
                <Globe size={22} />
            </div>
        </div>
      </div>

      {/* ── Stat Cards Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard title="Ledger Capacity" value={chain.length} icon={<Database size={22}/>} color="indigo" onClick={() => setActiveDetail({ type: 'transactions', label: 'Ledger Expansion' })} />
        <StatCard title="Proof Target" value={`${currentDifficulty} Zeros`} icon={<Zap size={22}/>} color="amber" onClick={() => setActiveDetail({ type: 'difficulty', label: 'Consensus Barrier' })} />
        <StatCard title="Current Nonce" value={chain.length > 0 ? chain[chain.length-1].nonce : "--"} icon={<Activity size={22}/>} color="blue" onClick={() => setActiveDetail({ type: 'mining', label: 'Hash Computation' })} />
        <StatCard title="Node Integrity" value={integrity ? "NOMINAL" : "COMPROMISED"} icon={integrity ? <ShieldCheck size={22}/> : <ShieldAlert size={22}/>} color={integrity ? "emerald" : "rose"} pulse={!integrity} onClick={() => setActiveDetail({ type: 'status', label: 'Forensic Health' })} />
      </div>

      {/* ── Comparison Modal ── */}
      {activeDetail && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setActiveDetail(null)} />
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3rem] shadow-2xl z-10 overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div>
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-1">Audit Snapshot</p>
                <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tighter text-2xl">{activeDetail.label}</h3>
              </div>
              <button onClick={() => setActiveDetail(null)} className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 rounded-full transition-all dark:text-slate-400"><X size={20}/></button>
            </div>
            <div className="p-12 space-y-10">
              <div className="grid grid-cols-2 gap-8 text-center">
                <div className="p-8 bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">Previous</p>
                  <p className="text-3xl font-black text-slate-500 tabular-nums">{getComparisonData(activeDetail.type).previous}</p>
                </div>
                <div className="p-8 bg-blue-50 dark:bg-blue-900/20 rounded-[2.5rem] border border-blue-100 dark:border-blue-800 shadow-inner">
                  <p className="text-[10px] font-black text-blue-500 uppercase mb-3 tracking-widest">Current</p>
                  <p className="text-3xl font-black text-blue-600 dark:text-blue-400 tabular-nums">{getComparisonData(activeDetail.type).current}</p>
                </div>
              </div>
              
              <div className="bg-slate-900 dark:bg-black rounded-[2.5rem] p-10 text-white relative overflow-hidden group shadow-2xl shadow-blue-500/10">
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:rotate-12 transition-transform duration-700">
                   <TrendingUp size={120} />
                </div>
                <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">Delta Coefficient</p>
                <div className="flex items-end gap-4 relative z-10">
                   <h2 className="text-5xl font-black italic tracking-tighter text-blue-400">
                     {getComparisonData(activeDetail.type).diff > 0 ? '+' : ''}{getComparisonData(activeDetail.type).diff}
                   </h2>
                   <span className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">{getComparisonData(activeDetail.type).unit} Shift</span>
                </div>
              </div>

              <button onClick={() => setActiveDetail(null)} className="w-full py-6 bg-slate-900 dark:bg-blue-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl active:scale-95">
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Charts Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Mining distribution */}
        <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-2xl shadow-slate-200/40 dark:shadow-none transition-all">
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-2xl text-blue-600 dark:text-blue-400"><Activity size={22} /></div>
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest italic leading-none">Compute Distribution</h3>
            </div>
            <span className="text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-[0.2em]">Iterations per confirm</span>
          </div>
          <div className="h-[380px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={miningData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#1e293b" : "#f1f5f9"} />
                <XAxis dataKey="block" fontSize={10} axisLine={false} tickLine={false} dy={10} stroke={isDarkMode ? "#475569" : "#94a3b8"} />
                <YAxis fontSize={10} axisLine={false} tickLine={false} stroke={isDarkMode ? "#475569" : "#94a3b8"} />
                <Tooltip cursor={{fill: isDarkMode ? '#0f172a' : '#f8fafc'}} contentStyle={{borderRadius: '24px', background: isDarkMode ? '#1e293b' : '#fff', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'}} />
                <Bar dataKey="nonce" radius={[12, 12, 4, 4]} barSize={40}>
                    {miningData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === miningData.length - 1 ? '#2563eb' : (isDarkMode ? '#1e293b' : '#e2e8f0')} />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Persistence Proof */}
        <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-2xl shadow-slate-200/40 dark:shadow-none transition-all">
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl text-emerald-600 dark:text-emerald-400"><Clock size={22} /></div>
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest italic leading-none">Temporal Persistence</h3>
            </div>
            <span className="text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-[0.2em]">Ledger Continuity</span>
          </div>
          <div className="h-[380px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={miningData}>
                <defs>
                    <linearGradient id="colorPersistence" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#1e293b" : "#f1f5f9"} />
                <XAxis dataKey="block" fontSize={10} axisLine={false} tickLine={false} dy={10} stroke={isDarkMode ? "#475569" : "#94a3b8"} />
                <YAxis fontSize={10} axisLine={false} tickLine={false} stroke={isDarkMode ? "#475569" : "#94a3b8"} />
                <Tooltip contentStyle={{borderRadius: '24px', background: isDarkMode ? '#1e293b' : '#fff', border: 'none'}} />
                <Area type="stepAfter" dataKey="nonce" stroke="#10b981" fillOpacity={1} fill="url(#colorPersistence)" strokeWidth={4} animationDuration={1200} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Network Broadcast Logs ── */}
      <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-2xl shadow-slate-200/40 dark:shadow-none overflow-hidden mb-12">
        <div className="px-12 py-10 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-slate-800/10">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-slate-900 dark:bg-blue-600 text-white rounded-[2rem] shadow-xl shadow-blue-500/10"><Layers size={24} /></div>
            <div>
               <h3 className="text-2xl font-black text-slate-800 dark:text-white italic uppercase tracking-tighter leading-none">Network Pulse</h3>
               <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Real-time Block Synchronization Logs</p>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 dark:bg-slate-950/20">
              <tr>
                <th className="px-12 py-6 text-[10px] font-black uppercase text-slate-400 dark:text-slate-600 tracking-[0.2em]">Broadcast Time</th>
                <th className="px-12 py-6 text-[10px] font-black uppercase text-slate-400 dark:text-slate-600 tracking-[0.2em]">Neural Status</th>
                <th className="px-12 py-6 text-[10px] font-black uppercase text-slate-400 dark:text-slate-600 tracking-[0.2em]">Transaction Ledger</th>
                <th className="px-12 py-6 text-right text-[10px] font-black uppercase text-slate-400 dark:text-slate-600 tracking-[0.2em]">System State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/60 dark:divide-slate-800/40">
              {[...chain].reverse().slice(0, 12).map((block) => (
                <tr key={block.index} className="hover:bg-blue-50/40 dark:hover:bg-white/[0.02] transition-all group cursor-default">
                  <td className="px-12 py-8 text-xs font-black text-slate-500 dark:text-slate-400 font-mono">
                    {new Date(parseFloat(block.timestamp) * (block.timestamp < 1e12 ? 1000 : 1)).toLocaleTimeString()}
                  </td>
                  <td className="px-12 py-8">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_#3b82f6]"></div>
                        <span className="text-[11px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Confirmed_ANNEX</span>
                    </div>
                  </td>
                  <td className="px-12 py-8">
                    <div className="flex flex-col">
                       <span className="text-sm font-bold text-slate-700 dark:text-slate-300 italic tracking-tight">Block #00{block.index} Confirmed</span>
                       <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-1">Difficulty Met: {currentDifficulty} Zeros</span>
                    </div>
                  </td>
                  <td className="px-12 py-8 text-right">
                    <span className={`px-5 py-2 rounded-2xl text-[9px] font-black tracking-[0.2em] uppercase border shadow-sm transition-all ${integrity ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800' : 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-800'}`}>
                      {integrity ? 'Verified' : 'Breach Detected'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ── StatCard Sub-component (Dark Ready) ──
const StatCard = ({ title, value, icon, color, onClick, pulse }) => {
  const themes = {
    indigo: "border-indigo-500 text-indigo-600 dark:text-indigo-400",
    amber: "border-amber-500 text-amber-600 dark:text-amber-400",
    emerald: "border-emerald-500 text-emerald-700 dark:text-emerald-400",
    rose: "border-rose-500 text-rose-600 dark:text-rose-400",
    blue: "border-blue-500 text-blue-600 dark:text-blue-400",
  };

  return (
    <div 
      onClick={onClick}
      className={`bg-white dark:bg-slate-900 p-10 rounded-[3rem] border-l-[6px] shadow-xl dark:shadow-none flex flex-col justify-between transition-all hover:-translate-y-2 cursor-pointer group relative overflow-hidden ${themes[color]} ${pulse ? 'animate-pulse ring-4 ring-rose-500/20' : 'border-slate-100 dark:border-slate-800'}`}
    >
      <div className="absolute -top-6 -right-6 p-8 opacity-5 group-hover:opacity-10 group-hover:rotate-12 transition-all duration-500">
         {icon}
      </div>
      <div className="flex justify-between items-start relative z-10 mb-8">
        <div className={`p-4 rounded-2xl shadow-inner bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 transition-all group-hover:scale-110`}>
            {icon}
        </div>
        <div className="p-2.5 rounded-full bg-slate-50 dark:bg-slate-800 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
           <ChevronRight size={16} />
        </div>
      </div>
      <div className="relative z-10">
        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 leading-none">{title}</p>
        <h4 className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter italic uppercase leading-none">{value}</h4>
      </div>
    </div>
  );
};

export default Analytics;