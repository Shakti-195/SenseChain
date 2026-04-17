import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, ArrowRight, Loader2, ShieldCheck, Activity, Eye, EyeOff, Blocks, Zap } from 'lucide-react';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ||
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://127.0.0.1:8000'
    : 'https://sensechain.onrender.com');

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        login(data.access_token, email);
        navigate('/');
      } else {
        setError(data.detail || 'Invalid credentials. Please try again.');
      }
    } catch {
      setError('Unable to reach server. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg relative overflow-hidden">
      {/* Animated grid */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(220,38,38,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(220,38,38,0.07) 1px, transparent 1px)',
          backgroundSize: '56px 56px'
        }}
      />
      {/* Glow blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-rose-900/15 rounded-full blur-[80px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-[440px] flex flex-col">
        {/* Left panel: brand block */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-8"
        >
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <motion.div
              animate={{ rotate: [0, 4, -4, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="brand-logo w-12 h-12 rounded-[16px] flex items-center justify-center relative"
            >
              <ShieldCheck size={20} className="text-white/20 absolute" />
              <Activity size={12} className="text-white relative z-10" fill="white" />
            </motion.div>
            <div className="text-left">
              <span className="block text-xl font-bold tracking-tight text-stone-900 dark:text-white" style={{ fontFamily: 'Space Grotesk' }}>
                SenseChain
              </span>
              <span className="block text-[9px] font-bold text-red-600 dark:text-red-500 uppercase tracking-[0.25em]">
                NEURAL LEDGER PLATFORM
              </span>
            </div>
          </div>
        </motion.div>

        {/* Auth Card */}
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1], delay: 0.05 }}
          className="glass-card rounded-[28px] overflow-hidden"
        >
          {/* Top accent bar */}
          <div className="h-1 bg-gradient-to-r from-red-600 via-rose-500 to-red-800" />

          <div className="p-8 md:p-10">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Space Grotesk' }}>
                Welcome back
              </h1>
              <p className="text-sm text-stone-500 dark:text-stone-400">
                Sign in to your SenseChain command center
              </p>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  className="flex items-start gap-3 mb-5 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm font-medium"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0 animate-pulse" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 uppercase tracking-widest mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@sensechain.io"
                    required
                    className="glass-input pl-11"
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-stone-600 dark:text-stone-400 uppercase tracking-widest">Password</label>
                  <Link to="/forgot-password" className="text-[11px] font-semibold text-red-600 dark:text-red-400 hover:text-red-700 transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="glass-input pl-11 pr-12"
                    autoComplete="current-password"
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-red-600 transition-colors">
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.01 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="btn-primary w-full mt-2 py-3.5"
              >
                {loading
                  ? <><Loader2 size={16} className="animate-spin" /> Authenticating...</>
                  : <><ArrowRight size={16} /> Sign In to Dashboard</>
                }
              </motion.button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-stone-200 dark:bg-white/6" />
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">New here?</span>
              <div className="flex-1 h-px bg-stone-200 dark:bg-white/6" />
            </div>

            {/* Sign up link */}
            <Link to="/signup">
              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-stone-200 dark:border-white/8 text-sm font-semibold text-stone-700 dark:text-stone-300 hover:border-red-400 dark:hover:border-red-600/40 hover:text-red-600 dark:hover:text-red-400 transition-all cursor-pointer"
              >
                <Blocks size={15} className="text-red-500" />
                Create a SenseChain Account
              </motion.div>
            </Link>
          </div>
        </motion.div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="flex items-center justify-center gap-6 mt-6"
        >
          {[
            { icon: <ShieldCheck size={12} />, text: 'SHA-256 Secured' },
            { icon: <Zap size={12} />, text: 'Real-time Sync' },
            { icon: <Activity size={12} />, text: 'Live Monitoring' },
          ].map(item => (
            <div key={item.text} className="flex items-center gap-1.5 text-[10px] font-semibold text-stone-400 dark:text-stone-600">
              <span className="text-red-500">{item.icon}</span>
              {item.text}
            </div>
          ))}
        </motion.div>

        <p className="text-center mt-5 text-[10px] text-stone-400 dark:text-stone-700 uppercase tracking-widest">
          SenseChain Neural Infrastructure · 2026
        </p>
      </div>
    </div>
  );
};

export default Login;