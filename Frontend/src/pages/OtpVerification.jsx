import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, RefreshCw, ChevronLeft, Fingerprint,
  Loader2, ArrowRight, Activity, Zap,
} from 'lucide-react';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? '' : 'https://sensechain.onrender.com');

const OtpVerification = () => {
  const [otp, setOtp]           = useState('');
  const [loading, setLoading]   = useState(false);
  const [timer, setTimer]       = useState(59);
  const [error, setError]       = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState('');

  const navigate  = useNavigate();
  const location  = useLocation();
  const email     = location.state?.email || '';

  useEffect(() => {
    const interval = setInterval(() =>
      setTimer(prev => (prev > 0 ? prev - 1 : 0)), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${BASE_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsSuccess(true);
        setTimeout(() => navigate('/'), 1500);
      } else {
        setError(data.detail || 'Invalid OTP. Please try again.');
        setOtp('');
      }
    } catch {
      setError('Server unavailable. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setResendMsg('');
    setError('');
    try {
      const res = await fetch(`${BASE_URL}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setTimer(59);
        setResendMsg('A new code has been sent to your email.');
      } else {
        setError(data.detail || 'Failed to resend OTP.');
      }
    } catch {
      setError('Failed to resend. Server may be offline.');
    } finally {
      setResending(false);
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
      <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-[120px] pointer-events-none animate-pulse"
        style={{ backgroundColor: 'var(--th-glow, rgba(220,38,38,0.10))' }} />
      <div className="absolute bottom-0 right-1/4 w-72 h-72 rounded-full blur-[80px] pointer-events-none"
        style={{ backgroundColor: 'var(--th-glow, rgba(220,38,38,0.08))' }} />

      <div className="relative z-10 w-full max-w-[440px] flex flex-col">

        {/* Logo */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <motion.div animate={{ rotate: [0, 4, -4, 0] }} transition={{ duration: 5, repeat: Infinity }}
              className="brand-logo w-12 h-12 rounded-[16px] flex items-center justify-center relative">
              <ShieldCheck size={20} className="text-white/20 absolute" />
              <Activity size={12} className="text-white relative z-10" fill="white" />
            </motion.div>
            <div className="text-left">
              <span className="block text-xl font-bold tracking-tight text-stone-900 dark:text-white" style={{ fontFamily: 'Space Grotesk' }}>
                SenseChain
              </span>
              <span className="block text-[9px] font-bold uppercase tracking-[0.25em]" style={{ color: 'var(--th-primary, #dc2626)' }}>
                NEURAL LEDGER PLATFORM
              </span>
            </div>
          </div>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1], delay: 0.05 }}
          className="glass-card rounded-[28px] overflow-hidden">

          <div className="h-1" style={{ background: 'linear-gradient(90deg, var(--th-primary), var(--th-accent, var(--th-primary)))' }} />

          <AnimatePresence mode="wait">
            {!isSuccess ? (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="p-8 md:p-10">

                {/* Header */}
                <div className="flex items-center gap-3 mb-8">
                  <Link to="/login" className="p-2 rounded-xl border border-stone-200 dark:border-white/8 text-stone-400 hover:text-stone-700 dark:hover:text-white transition-colors">
                    <ChevronLeft size={15} />
                  </Link>
                  <div>
                    <h1 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>Verify Identity</h1>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                      Enter the 4-digit code sent to{' '}
                      <span className="font-semibold text-stone-700 dark:text-stone-300">{email || 'your email'}</span>
                    </p>
                  </div>
                </div>

                {/* Fingerprint icon */}
                <div className="flex justify-center mb-7">
                  <div className="p-5 rounded-2xl" style={{ backgroundColor: 'var(--th-glow, rgba(220,38,38,0.10))', color: 'var(--th-primary, #dc2626)' }}>
                    <Fingerprint size={36} />
                  </div>
                </div>

                {/* OTP Input */}
                <form onSubmit={handleVerify} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 uppercase tracking-widest mb-1.5">
                      Verification Code
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      value={otp}
                      onChange={e => { setOtp(e.target.value.replace(/\D/g, '')); setError(''); }}
                      placeholder="_ _ _ _"
                      required
                      autoFocus
                      className="glass-input text-center text-3xl font-black tracking-[0.4em] font-mono"
                    />
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                        className="flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm font-medium">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0 animate-pulse" />
                        {error}
                      </motion.div>
                    )}
                    {resendMsg && (
                      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                        className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-sm font-medium">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        {resendMsg}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.button type="submit" disabled={loading || otp.length < 4}
                    whileHover={{ scale: loading ? 1 : 1.01 }} whileTap={{ scale: 0.98 }}
                    className="btn-primary w-full py-3.5">
                    {loading
                      ? <><Loader2 size={16} className="animate-spin" /> Verifying...</>
                      : <><ShieldCheck size={16} /> Authorize Identity</>
                    }
                  </motion.button>
                </form>

                {/* Resend */}
                <div className="mt-5 text-center">
                  {timer > 0 ? (
                    <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-widest">
                      Resend code in{' '}
                      <span className="font-black font-mono" style={{ color: 'var(--th-primary, #dc2626)' }}>{timer}s</span>
                    </p>
                  ) : (
                    <button type="button" onClick={handleResend} disabled={resending}
                      className="flex items-center gap-1.5 mx-auto text-[11px] font-bold uppercase tracking-widest text-stone-400 hover:text-stone-700 dark:hover:text-white transition-colors">
                      <RefreshCw size={11} className={resending ? 'animate-spin' : ''} />
                      {resending ? 'Sending...' : 'Resend Code'}
                    </button>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
                className="p-10 text-center">
                <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 0.5 }}
                  className="w-20 h-20 bg-emerald-500 rounded-[24px] flex items-center justify-center mx-auto mb-5 shadow-xl shadow-emerald-500/25">
                  <ShieldCheck size={36} className="text-white" />
                </motion.div>
                <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Space Grotesk' }}>Identity Verified!</h2>
                <p className="text-sm text-stone-500 dark:text-stone-400 animate-pulse">Syncing neural link...</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Trust badges */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="flex items-center justify-center gap-6 mt-6">
          {[
            { icon: <ShieldCheck size={12} />, text: 'SHA-256 Secured' },
            { icon: <Zap size={12} />, text: 'Real-time Sync' },
            { icon: <Activity size={12} />, text: 'Live Monitoring' },
          ].map(item => (
            <div key={item.text} className="flex items-center gap-1.5 text-[10px] font-semibold text-stone-400 dark:text-stone-600">
              <span style={{ color: 'var(--th-primary, #dc2626)' }}>{item.icon}</span>
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

export default OtpVerification;