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
  lastUpdated = '',
}) => {
  const [currentDifficulty, setCurrentDifficulty] = useState(3);
  const [activeDetail, setActiveDetail] = useState(null);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  // Track theme changes
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

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

  const miningData = useMemo(() => {
    if (!chain || chain.length === 0) {
      return [
        { block: '#empty-1', nonce: 0, timestamp: Date.now() - 2000 },
        { block: '#empty-2', nonce: 0, timestamp: Date.now() - 1000 }
      ];
    }
    return chain.slice(-15).map(b => ({
      block: `#${b.index}`,
      nonce: b.nonce || 0,
      timestamp: b.timestamp
    }));
  }, [chain]);

  const getComparisonData = (type) => {
    if (chain.length < 2) return { current: '--', previous: '--', diff: 0, unit: '' };
    const currentBlock = chain[chain.length - 1];
    const previousBlock = chain[chain.length - 2];

    switch(type) {
      case 'transactions':
        return { current: chain.length, previous: chain.length - 1, diff: 1, unit: 'Blocks' };
      case 'difficulty':
        return { current: `${currentDifficulty} Zeros`, previous: 'Standard', diff: currentDifficulty, unit: 'Level' };
      case 'mining': {
        const diff = currentBlock.nonce - previousBlock.nonce;
        return { current: currentBlock.nonce, previous: previousBlock.nonce, diff: diff, unit: 'Iter' };
      }
      case 'status':
        return { current: integrity ? "Secured" : "Breached", previous: "Stable", diff: integrity ? 0 : 1, unit: 'Alert' };
      default: return { current: '--', previous: '--', diff: 0, unit: '' };
    }
  };

  return (
    <div className="page-wrapper space-y-8 custom-scrollbar">
      
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
        <div className="flex items-center gap-3 glass-panel p-3 rounded-2xl">
            <div className="px-4 py-1 border-r border-slate-200 dark:border-slate-700 text-right">
                <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Neural Link</span>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono">
                    {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : '--:--'}
                </span>
            </div>
            <div className={`p-2.5 rounded-xl ${integrity ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-500/15 text-rose-500 animate-pulse'}`}>
                <Globe size={18} />
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
          <div className="fixed inset-0 bg-[#020617]/80 backdrop-blur-2xl" onClick={() => setActiveDetail(null)} />
          <div className="glass-card w-full max-w-lg rounded-[3rem] shadow-2xl z-10 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-white/5 flex justify-between items-center">
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
              
              <div className="bg-slate-900 dark:bg-black rounded-[2.5rem] p-10 text-slate-900 dark:text-white relative overflow-hidden group shadow-2xl shadow-blue-500/10">
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

              <button onClick={() => setActiveDetail(null)} className="w-full py-6 bg-slate-900 dark:bg-blue-600 text-slate-900 dark:text-white rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl active:scale-95">
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Charts Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Mining distribution */}
        <div className="glass-card p-10 rounded-[35px]">
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-2xl text-blue-600 dark:text-blue-400"><Activity size={22} /></div>
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest italic leading-none">Compute Distribution</h3>
            </div>
            <span className="text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-[0.2em]">Iterations per confirm</span>
          </div>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={miningData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#1e293b' : '#f1f5f9'} />
                <XAxis dataKey="block" fontSize={10} axisLine={false} tickLine={false} dy={10} stroke={isDark ? '#475569' : '#94a3b8'} tick={{ fontFamily: 'JetBrains Mono' }} />
                <YAxis fontSize={10} axisLine={false} tickLine={false} stroke={isDark ? '#475569' : '#94a3b8'} tick={{ fontFamily: 'JetBrains Mono' }} />
                <Tooltip cursor={{ fill: isDark ? '#0f172a' : '#f8fafc' }} contentStyle={{ borderRadius: '16px', background: isDark ? '#1e293b' : '#fff', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'), boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }} />
                <Bar dataKey="nonce" radius={[8, 8, 2, 2]} barSize={32}>
                    {miningData.map((_, i) => (
                        <Cell key={`cell-${i}`} fill={i === miningData.length - 1 ? '#2563eb' : (isDark ? '#1e293b' : '#e2e8f0')} />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Persistence Proof */}
        <div className="glass-card p-10 rounded-[35px]">
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl text-emerald-600 dark:text-emerald-400"><Clock size={22} /></div>
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest italic leading-none">Temporal Persistence</h3>
            </div>
            <span className="text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-[0.2em]">Ledger Continuity</span>
          </div>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={miningData}>
                <defs>
                    <linearGradient id="colorPersistence" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#1e293b' : '#f1f5f9'} />
                <XAxis dataKey="block" fontSize={10} axisLine={false} tickLine={false} dy={10} stroke={isDark ? '#475569' : '#94a3b8'} tick={{ fontFamily: 'JetBrains Mono' }} />
                <YAxis fontSize={10} axisLine={false} tickLine={false} stroke={isDark ? '#475569' : '#94a3b8'} tick={{ fontFamily: 'JetBrains Mono' }} />
                <Tooltip contentStyle={{ borderRadius: '16px', background: isDark ? '#1e293b' : '#fff', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)') }} />
                <Area type="stepAfter" dataKey="nonce" stroke="#10b981" fillOpacity={1} fill="url(#colorPersistence)" strokeWidth={2.5} animationDuration={1200} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Network Broadcast Logs ── */}
      <div className="glass-card rounded-[35px] overflow-hidden mb-12">
        <div className="px-12 py-10 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-slate-800/10">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-slate-900 dark:bg-blue-600 text-slate-900 dark:text-white rounded-[2rem] shadow-xl shadow-blue-500/10"><Layers size={24} /></div>
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
              {[...chain].reverse().slice(0, 12).map((block, index) => (
                <tr key={block.hash || `analytics-${block.index}-${index}`} className="hover:bg-blue-50/40 dark:hover:bg-white/[0.02] transition-all group cursor-default">
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

// ── StatCard Sub-component (Dual-Theme Adaptive) ──
const StatCard = ({ title, value, icon, color, onClick, pulse }) => {
  const themes = {
    indigo: 'bg-indigo-100 dark:bg-indigo-500/12 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20',
    amber: 'bg-amber-100 dark:bg-amber-500/12 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
    emerald: 'bg-emerald-100 dark:bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
    rose: 'bg-rose-100 dark:bg-rose-500/12 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20',
    blue: 'bg-blue-100 dark:bg-blue-500/12 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20',
  };
  const c = themes[color] || themes.blue;

  return (
    <div
      onClick={onClick}
      className={`stat-card border border-slate-200 dark:border-white/6 cursor-pointer ${pulse ? 'breach-glow' : ''}`}
    >
      <div className={`inline-flex p-2.5 rounded-xl mb-4 border ${c}`}>
        {icon}
      </div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
      <h4 className={`text-2xl font-bold tracking-tight font-mono tabular-nums ${c.split(' ')[2]} ${c.split(' ')[3]}`}>{value}</h4>
    </div>
  );
};

export default Analytics;