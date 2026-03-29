import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  Menu, Bell, ShieldAlert, ShieldCheck, X, Settings, 
  LayoutDashboard, Shield, BarChart3, User, LogOut, ChevronDown, 
  Cpu, RefreshCw, Sun, Moon, Volume2, VolumeX,
  CheckCircle2, AlertTriangle, Wifi, Smartphone, Radio, Zap,
  Activity, // ✅ Added Activity here to fix the ReferenceError
  BlocksIcon,
  PlugZap,
  LucideActivity,
  AlarmCheckIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const Header = ({ integrity, connError, lastUpdated, title, chainHeight }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showNav, setShowNav] = useState(false);
  const [showUser, setShowUser] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const navRef = useRef(null);
  const userRef = useRef(null);
  const notifRef = useRef(null);
  const prevIntegrity = useRef(integrity);
  const prevConnError = useRef(connError);

  const formatTime = (ts) => {
    if (!ts || ts === "") {
      return new Date().toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: false 
      });
    }
    
    try {
      const date = new Date(Number(ts) * (ts < 1e12 ? 1000 : 1));
      return isNaN(date.getTime()) 
        ? "--:--:--" 
        : date.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit',
            hour12: false 
          });
    } catch (e) {
      return "--:--:--";
    }
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const addNotif = useCallback((type, title, msg) => {
    const newNotif = {
      id: Date.now(),
      type, title, msg,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setNotifications(prev => [newNotif, ...prev].slice(0, 10));
    setUnreadCount(prev => prev + 1);
  }, []);

  useEffect(() => {
    if (prevIntegrity.current === true && integrity === false) {
      addNotif('error', 'Security Breach', 'Unauthorized hash linkage detected!');
    } else if (prevIntegrity.current === false && integrity === true) {
      addNotif('success', 'System Healed', 'Node integrity successfully restored.');
    }

    if (prevConnError.current === true && connError === false) {
        addNotif('success', 'Hardware Linked', 'Uplink established with IoT Node.');
    } else if (prevConnError.current === false && connError === true) {
        addNotif('error', 'Link Lost', 'Uplink with hardware terminal was severed.');
    }

    prevIntegrity.current = integrity;
    prevConnError.current = connError;
  }, [integrity, connError, addNotif]);

  useEffect(() => {
    const handler = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) setShowNav(false);
      if (userRef.current && !userRef.current.contains(e.target)) setShowUser(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const menuItems = [
    { to: '/', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
    { to: '/provisioning', label: 'Uplink Terminal', icon: <Wifi size={16} /> },
    { to: '/security', label: 'Security', icon: <Shield size={16} /> },
    { to: '/analytics', label: 'Analytics', icon: <BarChart3 size={16} /> },
    { to: '/node-settings', label: 'Settings', icon: <Settings size={16} /> },
    { to: '/about', label: 'News and Updates', icon: <Cpu size={16} /> },
  ];

  return (
    <header className="h-[72px] w-full bg-white/60 dark:bg-[#0B1220]/75 backdrop-blur-xl border-b border-slate-200/50 dark:border-white/5 px-8 flex items-center justify-between sticky top-0 z-[100] transition-all duration-500 shadow-[0_10px_40px_rgba(0,0,0,0.03)] dark:shadow-none">
      
      <div className="flex items-center gap-6 flex-1">
        <div className="relative" ref={navRef}>
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowNav(!showNav)} 
            className={`p-3 rounded-2xl transition-all duration-300 ${showNav ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'}`}
          >
            {showNav ? <X size={20} /> : <Menu size={20} />}
          </motion.button>
          
          <AnimatePresence>
            {showNav && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="absolute left-0 mt-4 w-72 bg-white/95 dark:bg-[#161F30]/95 backdrop-blur-2xl rounded-[28px] shadow-[0_30px_60px_rgba(0,0,0,0.18)] border border-slate-200 dark:border-white/10 p-2.5 overflow-hidden"
              >
                {menuItems.map((item) => (
                  <button 
                    key={item.to} 
                    onClick={() => { navigate(item.to); setShowNav(false); }} 
                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] transition-all duration-200 ${location.pathname === item.to ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'}`}
                  >
                    <span className={location.pathname === item.to ? 'text-white' : 'text-blue-500'}>{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-4 group cursor-pointer" onClick={() => navigate('/')}>
          <motion.div 
            whileHover={{ rotate: 12, scale: 1.1 }}
            className="w-10 h-10 bg-gradient-to-r from-blue-600 to-black rounded-[14px] flex items-center justify-center shadow-xl shadow-blue-500/10 dark:shadow-blue-500/30 transition-all border border-white/10"
          >
            {/* ✅ LOGO FIXED: Both icons now correctly imported and aligned */}
            <div className="relative flex items-center justify-center">
              <ShieldCheck size={24} className="text-white/30" /> 
              <Activity size={14} className="absolute text-white fill-current" />
            </div>
          </motion.div>
          <span className="text-3xl font-bold tracking-tighter dark:text-white hidden md:block bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-500 bg-clip-text text-transparent">
            SenseChain
          </span>
        </div>
      </div>

      <div className="hidden lg:flex items-center gap-1.5 bg-slate-100/40 dark:bg-white/5 p-1.5 rounded-[20px] border border-slate-200/40 dark:border-white/5 backdrop-blur-lg shadow-inner">
        <div className="flex items-center gap-3 px-5 py-2 rounded-[14px] bg-white/80 dark:bg-[#0F172A]/60 shadow-sm border border-slate-200/20 dark:border-white/5">
          <div className={`w-2 h-2 rounded-full ${connError ? 'bg-rose-500 shadow-[0_0_12px_#f43f5e]' : 'bg-emerald-500 animate-pulse shadow-[0_0_12px_#10b981]'}`} />
          <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-[0.2em] italic">
            {connError ? 'Node Offline' : 'Uplink Live'}
          </span>
        </div>
        
        <div className="flex items-center gap-6 px-5 py-2 font-mono">
          <div className="flex items-center gap-2.5">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest opacity-60">Blocks</span>
            <span className="text-[13px] font-black text-slate-800 dark:text-blue-400 tabular-nums">{chainHeight}</span>
          </div>
          <div className="w-px h-4 bg-slate-300 dark:bg-white/10" />
          <div className="flex items-center gap-2.5">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest opacity-60">Sync</span>
            <span className="text-[13px] font-black text-slate-800 dark:text-emerald-400 tabular-nums">{formatTime(lastUpdated)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3.5 flex-1">
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsDarkMode(!isDarkMode)} 
          className="p-3 rounded-2xl text-slate-500 dark:text-slate-400 hover:text-blue-500 hover:bg-white dark:hover:bg-white/5 transition-all shadow-sm border border-transparent hover:border-slate-100 dark:hover:border-white/5"
        >
          {isDarkMode ? <Sun size={20} strokeWidth={2.2} /> : <Moon size={20} strokeWidth={2.2} />}
        </motion.button>

        <div className="relative" ref={notifRef}>
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => { setShowNotifs(!showNotifs); setUnreadCount(0); }} 
            className={`p-3 rounded-2xl transition-all duration-300 relative ${showNotifs ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/30' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-white/5 shadow-sm border border-transparent hover:border-slate-100 dark:hover:border-white/5'}`}
          >
            <Bell size={20} strokeWidth={2.2} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-[3px] border-white dark:border-[#0B1220] shadow-lg">
                {unreadCount}
              </span>
            )}
          </motion.button>
          
          <AnimatePresence>
            {showNotifs && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="absolute right-0 mt-4 w-80 bg-white/95 dark:bg-[#161F30]/95 backdrop-blur-2xl rounded-[28px] shadow-[0_40px_80px_rgba(0,0,0,0.25)] border border-slate-200 dark:border-white/10 overflow-hidden"
              >
                <div className="p-6 bg-slate-50/50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
                  <span className="flex items-center gap-2.5 text-[11px] font-black uppercase tracking-[0.2em] text-blue-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                    Neural Alerts
                  </span>
                  <button onClick={() => setNotifications([])} className="text-[10px] font-black uppercase text-slate-400 hover:text-rose-500 transition-colors">Clear All</button>
                </div>
                <div className="max-h-[380px] overflow-y-auto p-2.5 custom-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="p-14 text-center">
                      <div className="w-14 h-14 bg-slate-50 dark:bg-white/5 rounded-[20px] flex items-center justify-center mx-auto mb-4 border border-slate-100 dark:border-white/5">
                        <ShieldCheck size={28} className="text-slate-200 dark:text-slate-700" />
                      </div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Ledger Secure</p>
                    </div>
                  ) : notifications.map(n => (
                    <motion.div 
                      initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                      key={n.id} className="p-4 mb-1.5 hover:bg-slate-50 dark:hover:bg-white/5 rounded-2xl flex gap-4 transition-all group border border-transparent hover:border-slate-100 dark:hover:border-white/5"
                    >
                      <div className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-none group-hover:scale-150 transition-transform ${n.type === 'error' ? 'bg-rose-500 shadow-[0_0_12px_#f43f5e]' : 'bg-emerald-500 shadow-[0_0_12px_#10b981]'}`} />
                      <div>
                        <p className="text-xs font-black dark:text-slate-100 uppercase tracking-tight">{n.title}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug italic mt-1 font-medium">{n.msg}</p>
                        <p className="text-[9px] text-slate-300 dark:text-slate-600 mt-2.5 font-bold tracking-widest">{n.time}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className={`hidden sm:flex px-5 py-2.5 rounded-[18px] border transition-all duration-700 items-center gap-3 shadow-sm ${integrity ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600' : 'bg-rose-500/5 border-rose-500/20 text-rose-600 animate-pulse'}`}>
          <div className={`p-1 rounded-full ${integrity ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
            {integrity ? <ShieldCheck size={16} strokeWidth={2.5}/> : <ShieldAlert size={16} strokeWidth={2.5} />}
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">{integrity ? 'SECURE' : 'CRITICAL'}</span>
        </div>

        <div className="relative ml-2" ref={userRef}>
          <motion.button 
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowUser(!showUser)} 
            className="relative p-0.5 rounded-[18px] bg-gradient-to-br from-blue-500 to-indigo-600"
          >
            <div className="w-10 h-10 rounded-[16px] bg-white dark:bg-[#0B1220] flex items-center justify-center text-slate-900 dark:text-white shadow-inner overflow-hidden">
               <User size={18} strokeWidth={2.5} />
            </div>
          </motion.button>
          
          <AnimatePresence>
            {showUser && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="absolute right-0 mt-4 w-64 bg-white/95 dark:bg-[#161F30]/95 backdrop-blur-2xl rounded-[28px] shadow-[0_40px_80px_rgba(0,0,0,0.25)] border border-slate-200 dark:border-white/10 overflow-hidden"
              >
                <div className="p-6 bg-slate-50/50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5 text-center">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-3 tracking-[0.3em] italic opacity-60">User</p>
                  <div className="w-14 h-14 bg-blue-600 rounded-[20px] mx-auto mb-4 flex items-center justify-center shadow-xl shadow-blue-500/30">
                    <User size={24} className="text-white" />
                  </div>
                  <p className="text-sm font-black text-slate-900 dark:text-white truncate uppercase tracking-tighter italic">
                    {user?.email?.split('@')[0] || 'Agent'}
                  </p>
                </div>
                <div className="p-2.5">
                  <button 
                    onClick={() => { logout(); navigate('/login'); }} 
                    className="w-full flex items-center justify-center gap-3 px-4 py-4 rounded-2xl text-[10px] font-black text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all uppercase tracking-widest border border-transparent hover:border-rose-200 dark:hover:border-rose-500/20"
                  >
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default Header;