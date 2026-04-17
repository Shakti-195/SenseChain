import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Menu, Bell, ShieldAlert, ShieldCheck, X, Settings,
  LayoutDashboard, Shield, BarChart3, User, LogOut,
  Sun, Moon, Activity, Newspaper, Blocks, Palette, PlugZap, Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useBreach } from '../context/BreachContext';
import { motion, AnimatePresence } from 'framer-motion';

const Header = ({ integrity, connError, lastUpdated, chainHeight }) => {
  const { logout, user } = useAuth();
  const { virtualBreach, breachedBlock } = useBreach();
  const navigate = useNavigate();
  const location = useLocation();

  // Combined breach: real chain OR virtual simulation
  const isBreached = !integrity || virtualBreach;

  const [showNav, setShowNav] = useState(false);
  const [showUser, setShowUser] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const navRef = useRef(null);
  const userRef = useRef(null);
  const notifRef = useRef(null);
  const prevIntegrity = useRef(integrity);
  const prevConnError = useRef(connError);

  // ── THEME TOGGLE ──
  const toggleTheme = useCallback(() => {
    setIsDark(prev => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('sc-theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('sc-theme', 'light');
      }
      return next;
    });
  }, []);

  // ── LOCAL TIMEZONE SYNC TIME ──
  const formatTime = (ts) => {
    try {
      const ms = !ts ? Date.now() : (Number(ts) < 1e12 ? Number(ts) * 1000 : Number(ts));
      return new Date(ms).toLocaleTimeString(undefined, {
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
      });
    } catch { return '--:--:--'; }
  };

  const addNotif = useCallback((type, title, msg) => {
    const n = {
      id: Date.now(), type, title, msg,
      time: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    };
    setNotifications(prev => [n, ...prev].slice(0, 10));
    setUnreadCount(prev => prev + 1);
  }, []);

  // ── BREACH / HEAL NOTIFICATIONS ──
  useEffect(() => {
    if (prevIntegrity.current === true && isBreached)
      addNotif('error', '🚨 Security Breach', virtualBreach
        ? `Virtual attack injected Block #${breachedBlock ?? '?'}! SHA-256 hash corrupted.`
        : 'Unauthorized hash linkage detected in ledger!');
    else if (prevIntegrity.current === false && !isBreached)
      addNotif('success', '✅ System Healed', 'Blockchain integrity fully restored.');
    prevIntegrity.current = isBreached;
  }, [isBreached, virtualBreach, breachedBlock, addNotif]);

  useEffect(() => {
    if (prevConnError.current && !connError)
      addNotif('success', '📡 Uplink Restored', 'Neural link reestablished with backend.');
    else if (!prevConnError.current && connError)
      addNotif('error', '⚡ Uplink Lost', 'Backend connection severed. Retrying...');
    prevConnError.current = connError;
  }, [connError, addNotif]);

  // ── CLOSE ON OUTSIDE CLICK ──
  useEffect(() => {
    const handler = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) setShowNav(false);
      if (userRef.current && !userRef.current.contains(e.target)) setShowUser(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const navItems = [
    { to: '/', label: 'Dashboard', icon: <LayoutDashboard size={15} /> },
    { to: '/provisioning', label: 'Uplink Terminal', icon: <PlugZap size={15} /> },
    { to: '/security', label: 'Security', icon: <Shield size={15} /> },
    { to: '/analytics', label: 'Analytics', icon: <BarChart3 size={15} /> },
    { to: '/node-settings', label: 'Node Settings', icon: <Settings size={15} /> },
    { to: '/about', label: 'News & Updates', icon: <Newspaper size={15} /> },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <header
      className="glass-card sticky top-0 z-[100] flex items-center justify-between gap-4 px-5 md:px-8"
      style={{ height: 64, margin: '12px 12px 0', borderRadius: 20 }}
    >
      {/* ── LEFT ── */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Menu Trigger */}
        <div ref={navRef} className="relative">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowNav(!showNav)}
            className={`flex items-center justify-center w-9 h-9 rounded-xl transition-all ${
              showNav
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                : 'text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-white/8'
            }`}
          >
            {showNav ? <X size={17} strokeWidth={2.5} /> : <Menu size={17} strokeWidth={2.5} />}
          </motion.button>

          <AnimatePresence>
            {showNav && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 8 }}
                transition={{ duration: 0.13, ease: 'easeOut' }}
                className="dropdown-menu absolute left-0 top-[calc(100%+10px)] w-62 rounded-2xl overflow-hidden p-1.5"
                style={{ zIndex: 300, borderRadius: 18 }}
              >
                {navItems.map((item) => (
                  <button
                    key={item.to}
                    onClick={() => { navigate(item.to); setShowNav(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-[14px] text-[11px] font-semibold uppercase tracking-wide transition-all ${
                      isActive(item.to)
                        ? 'bg-red-600 text-white shadow-sm shadow-red-600/25'
                        : 'text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-white/6 hover:text-red-600 dark:hover:text-red-400'
                    }`}
                  >
                    <span className={isActive(item.to) ? 'text-white' : 'text-red-500'}>{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Logo */}
        <button onClick={() => navigate('/')} className="flex items-center gap-2.5 group">
          <div className="brand-logo flex items-center justify-center w-9 h-9 rounded-[13px] relative">
            <ShieldCheck size={17} className="text-white/25 absolute" />
            <Activity size={11} className="text-white relative z-10" fill="white" />
          </div>
          <div className="hidden sm:block">
            <span
              className="text-[15px] font-bold tracking-tight text-stone-900 dark:text-white leading-none"
              style={{ fontFamily: 'Space Grotesk' }}
            >
              SenseChain
            </span>
            <span className="block text-[8px] font-bold text-red-600 dark:text-red-500 uppercase tracking-[0.2em] leading-none">
              NEURAL LEDGER
            </span>
          </div>
        </button>
      </div>

      {/* ── CENTER: Live Status Bar ── */}
      <div className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-2xl bg-stone-100/70 dark:bg-white/4 border border-stone-200/60 dark:border-white/5">
        <div className="flex items-center gap-2 pr-4 border-r border-stone-200 dark:border-white/8">
          <div className={`w-1.5 h-1.5 rounded-full ${connError ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'}`} />
          <span className="text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-widest">
            {connError ? 'Offline' : 'Live'}
          </span>
        </div>
        <div className="flex items-center gap-4 pl-2 font-mono">
          <div className="flex items-center gap-1.5">
            <Blocks size={12} className="text-stone-400" />
            <span className="text-[10px] text-stone-400 uppercase tracking-widest">Blocks</span>
            <span className="text-xs font-bold text-stone-800 dark:text-red-400 tabular-nums">{chainHeight}</span>
          </div>
          <div className="w-px h-3 bg-stone-300 dark:bg-white/10" />
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-stone-400 uppercase tracking-widest">Sync</span>
            <span className="text-xs font-bold text-stone-700 dark:text-stone-300 tabular-nums">{formatTime(lastUpdated)}</span>
          </div>
        </div>
      </div>

      {/* ── RIGHT ── */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Integrity / Breach Badge */}
        <AnimatePresence mode="wait">
          {isBreached ? (
            <motion.button
              key="breach"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={
                { scale: 1, opacity: 1 }
              }
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={() => navigate('/security')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide border cursor-pointer breach-glow bg-red-600 border-red-500 text-white shadow-lg shadow-red-600/40 transition-all"
              title={virtualBreach ? `Virtual breach: Block #${breachedBlock ?? '?'} tampered` : 'Real chain breach detected'}
            >
              {/* Ping ring behind icon */}
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60" />
                <span className="relative inline-flex rounded-full h-3 w-3 items-center justify-center">
                  <ShieldAlert size={11} strokeWidth={2.5} />
                </span>
              </span>
              <motion.span
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ repeat: Infinity, duration: 0.7 }}
              >
                ⚡ CRITICAL
              </motion.span>
            </motion.button>
          ) : (
            <motion.div
              key="secure"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide border bg-emerald-50 dark:bg-emerald-500/8 border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition-all"
            >
              <ShieldCheck size={12} strokeWidth={2.5} />
              Secure
            </motion.div>
          )}
        </AnimatePresence>

        {/* Theme Toggle */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          onClick={toggleTheme}
          className="flex items-center justify-center w-9 h-9 rounded-xl text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-white/8 hover:text-red-600 transition-all"
        >
          {isDark ? <Sun size={16} strokeWidth={2} /> : <Moon size={16} strokeWidth={2} />}
        </motion.button>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => { setShowNotifs(!showNotifs); setUnreadCount(0); }}
            className={`relative flex items-center justify-center w-9 h-9 rounded-xl transition-all ${
              showNotifs ? 'bg-red-600 text-white' : 'text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-white/8'
            }`}
          >
            <Bell size={16} strokeWidth={2} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-white dark:border-[#090909]">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </motion.button>

          <AnimatePresence>
            {showNotifs && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 8 }}
                transition={{ duration: 0.13 }}
                className="dropdown-menu absolute right-0 top-[calc(100%+10px)] w-80 overflow-hidden"
                style={{ zIndex: 300, borderRadius: 18 }}
              >
                <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 dark:border-white/6">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-widest">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-600 dark:bg-red-400 animate-pulse" /> Neural Alerts
                  </div>
                  <button
                    onClick={() => setNotifications([])}
                    className="text-[10px] font-bold text-stone-400 hover:text-red-500 uppercase tracking-wide transition-colors"
                  >
                    Clear All
                  </button>
                </div>
                <div className="max-h-72 overflow-y-auto custom-scrollbar p-2">
                  {notifications.length === 0 ? (
                    <div className="py-10 text-center">
                      <ShieldCheck size={28} className="text-stone-300 dark:text-stone-700 mx-auto mb-2" />
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Ledger Secure</p>
                    </div>
                  ) : notifications.map(n => (
                    <motion.div
                      key={n.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex gap-3 px-4 py-3 hover:bg-stone-50 dark:hover:bg-white/4 rounded-[12px] transition-colors"
                    >
                      <div className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${n.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`} />
                      <div>
                        <p className="text-xs font-bold text-stone-800 dark:text-stone-100">{n.title}</p>
                        <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 leading-snug">{n.msg}</p>
                        <p className="text-[9px] text-stone-300 dark:text-stone-600 mt-1 font-mono">{n.time}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Menu */}
        <div ref={userRef} className="relative">
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowUser(!showUser)}
            className="brand-logo w-9 h-9 rounded-[12px] flex items-center justify-center text-white"
          >
            <User size={15} strokeWidth={2.5} />
          </motion.button>

          <AnimatePresence>
            {showUser && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 8 }}
                transition={{ duration: 0.13 }}
                className="dropdown-menu absolute right-0 top-[calc(100%+10px)] w-56 overflow-hidden"
                style={{ zIndex: 300, borderRadius: 18 }}
              >
                <div className="px-5 pt-5 pb-4 border-b border-stone-100 dark:border-white/6 text-center">
                  <div className="brand-logo w-11 h-11 rounded-2xl mx-auto mb-3 flex items-center justify-center">
                    <User size={18} className="text-white" />
                  </div>
                  <p className="text-sm font-bold text-stone-800 dark:text-white truncate" style={{ fontFamily: 'Space Grotesk' }}>
                    {user?.email?.split('@')[0] || 'Agent'}
                  </p>
                  <p className="text-[10px] text-stone-400 truncate mt-0.5">{user?.email || ''}</p>
                  <span className="inline-block mt-2 chip-red">Neural Admin</span>
                </div>
                <div className="p-2">
                  <button
                    onClick={() => { navigate('/ui-settings'); setShowUser(false); }}
                    className="w-full flex items-center gap-2.5 py-2.5 px-4 rounded-[12px] text-[11px] font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-white/5 uppercase tracking-wide transition-all"
                  >
                    <Palette size={13} className="text-red-500" /> Appearance
                  </button>
                  <button
                    onClick={() => { logout(); navigate('/login'); }}
                    className="w-full flex items-center gap-2.5 py-2.5 px-4 rounded-[12px] text-[11px] font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-500/8 uppercase tracking-wide transition-all mt-0.5"
                  >
                    <LogOut size={13} /> Sign Out
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