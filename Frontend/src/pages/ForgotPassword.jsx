import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Lock, KeyRound, ShieldCheck, ChevronLeft,
  Loader2, ArrowRight, Check, Activity, Zap, Eye, EyeOff,
} from 'lucide-react';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? '' : 'https://sensechain.onrender.com');

const ForgotPassword = () => {
  const [step, setStep]                 = useState(1); // 1=email, 2=otp, 3=newpw, 4=done
  const [email, setEmail]               = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [userOtp, setUserOtp]           = useState('');
  const [newPassword, setNewPassword]   = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw]             = useState(false);
  const [showCPw, setShowCPw]           = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const navigate = useNavigate();

  // Step 1: generate OTP (frontend-only for demo; show on screen)
  const handleSendOTP = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(otp);
    setTimeout(() => { setStep(2); setLoading(false); }, 800);
  };

  // Step 2: verify OTP
  const handleVerifyOTP = (e) => {
    e.preventDefault();
    if (userOtp.trim() !== generatedOtp) {
      setError('Incorrect code. Please check and try again.');
    } else {
      setError('');
      setStep(3);
    }
  };

  // Step 3: reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, new_password: newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setStep(4);
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError(data.detail || 'Failed to update password. Please try again.');
      }
    } catch {
      setError('Server unavailable. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const stepLabels = ['Request', 'Verify', 'Reset'];

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
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
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

          <div className="p-8 md:p-10">

            {/* Step progress */}
            {step < 4 && (
              <div className="flex items-center gap-2 mb-8">
                {stepLabels.map((label, i) => {
                  const n = i + 1;
                  const active = step === n;
                  const done   = step > n;
                  return (
                    <React.Fragment key={label}>
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white transition-all"
                          style={{ backgroundColor: done || active ? 'var(--th-primary, #dc2626)' : undefined }}
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white transition-all ${done || active ? '' : 'bg-stone-200 dark:bg-white/10 text-stone-500 dark:text-stone-400'}`}>
                          {done ? <Check size={10} /> : n}
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${active ? '' : 'text-stone-400'}`}
                          style={active ? { color: 'var(--th-primary, #dc2626)' } : undefined}>
                          {label}
                        </span>
                      </div>
                      {i < 2 && <div className="flex-1 h-px bg-stone-200 dark:bg-white/8" />}
                    </React.Fragment>
                  );
                })}
              </div>
            )}

            <AnimatePresence mode="wait">

              {/* ── STEP 1: EMAIL ── */}
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
                  <div className="mb-7">
                    <div className="p-3 rounded-2xl inline-flex mb-4" style={{ backgroundColor: 'var(--th-glow, rgba(220,38,38,0.10))', color: 'var(--th-primary, #dc2626)' }}>
                      <Mail size={24} />
                    </div>
                    <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Space Grotesk' }}>Reset Password</h1>
                    <p className="text-sm text-stone-500 dark:text-stone-400">Enter your account email to receive a reset code</p>
                  </div>
                  <form onSubmit={handleSendOTP} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 uppercase tracking-widest mb-1.5">Email Address</label>
                      <div className="relative">
                        <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                          placeholder="you@sensechain.io" required className="glass-input pl-11" autoComplete="email" />
                      </div>
                    </div>
                    <motion.button type="submit" disabled={loading}
                      whileHover={{ scale: loading ? 1 : 1.01 }} whileTap={{ scale: 0.98 }}
                      className="btn-primary w-full py-3.5">
                      {loading ? <><Loader2 size={16} className="animate-spin" />Sending...</> : <><ArrowRight size={16} />Send Reset Code</>}
                    </motion.button>
                  </form>
                </motion.div>
              )}

              {/* ── STEP 2: OTP ── */}
              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
                  <div className="mb-7">
                    <div className="p-3 rounded-2xl inline-flex mb-4" style={{ backgroundColor: 'var(--th-glow, rgba(220,38,38,0.10))', color: 'var(--th-primary, #dc2626)' }}>
                      <KeyRound size={24} />
                    </div>
                    <h2 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Space Grotesk' }}>Enter Code</h2>
                    <p className="text-sm text-stone-500 dark:text-stone-400">
                      Code sent to <span className="font-semibold text-stone-700 dark:text-stone-300">{email}</span>
                    </p>
                  </div>

                  {/* Demo code display */}
                  <div className="mb-5 p-4 rounded-2xl border-2 border-dashed"
                    style={{ borderColor: 'color-mix(in srgb, var(--th-primary, #dc2626) 30%, transparent)', backgroundColor: 'var(--th-glow, rgba(220,38,38,0.06))' }}>
                    <p className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--th-primary, #dc2626)' }}>
                      Demo Mode — Your Code
                    </p>
                    <p className="text-3xl font-black font-mono tracking-[0.3em]" style={{ color: 'var(--th-primary, #dc2626)' }}>
                      {generatedOtp}
                    </p>
                    <p className="text-[9px] text-stone-400 mt-1">In production this would be emailed securely.</p>
                  </div>

                  <form onSubmit={handleVerifyOTP} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 uppercase tracking-widest mb-1.5">Verification Code</label>
                      <input type="text" maxLength={4} value={userOtp}
                        onChange={e => { setUserOtp(e.target.value.replace(/\D/g, '')); setError(''); }}
                        placeholder="_ _ _ _" required autoFocus
                        className="glass-input text-center text-3xl font-black tracking-[0.4em] font-mono" />
                    </div>
                    <AnimatePresence>
                      {error && (
                        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                          className="flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm font-medium">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0 animate-pulse" />
                          {error}
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <motion.button type="submit" disabled={userOtp.length < 4}
                      whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                      className="btn-primary w-full py-3.5">
                      <ShieldCheck size={16} /> Verify Code
                    </motion.button>
                    <button type="button" onClick={() => { setStep(1); setUserOtp(''); setError(''); }}
                      className="w-full text-sm font-medium text-stone-500 hover:text-stone-700 dark:hover:text-white transition-colors py-2">
                      ← Back to email
                    </button>
                  </form>
                </motion.div>
              )}

              {/* ── STEP 3: NEW PASSWORD ── */}
              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
                  <div className="mb-7">
                    <div className="p-3 rounded-2xl inline-flex mb-4" style={{ backgroundColor: 'var(--th-glow, rgba(220,38,38,0.10))', color: 'var(--th-primary, #dc2626)' }}>
                      <Lock size={24} />
                    </div>
                    <h2 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Space Grotesk' }}>New Password</h2>
                    <p className="text-sm text-stone-500 dark:text-stone-400">Choose a strong password for your account</p>
                  </div>
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 uppercase tracking-widest mb-1.5">New Password</label>
                      <div className="relative">
                        <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                        <input type={showPw ? 'text' : 'password'} value={newPassword}
                          onChange={e => setNewPassword(e.target.value)} placeholder="Minimum 8 characters"
                          required className="glass-input pl-11 pr-12" autoComplete="new-password" />
                        <button type="button" onClick={() => setShowPw(!showPw)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 dark:hover:text-white transition-colors">
                          {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 uppercase tracking-widest mb-1.5">Confirm Password</label>
                      <div className="relative">
                        <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                        <input type={showCPw ? 'text' : 'password'} value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)} placeholder="Re-enter password"
                          required className="glass-input pl-11 pr-12" autoComplete="new-password" />
                        <button type="button" onClick={() => setShowCPw(!showCPw)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 dark:hover:text-white transition-colors">
                          {showCPw ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>
                    <AnimatePresence>
                      {error && (
                        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                          className="flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm font-medium">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0 animate-pulse" />
                          {error}
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <motion.button type="submit" disabled={loading}
                      whileHover={{ scale: loading ? 1 : 1.01 }} whileTap={{ scale: 0.98 }}
                      className="btn-primary w-full py-3.5">
                      {loading ? <><Loader2 size={16} className="animate-spin" />Updating...</> : <><KeyRound size={16} />Update Password</>}
                    </motion.button>
                  </form>
                </motion.div>
              )}

              {/* ── STEP 4: SUCCESS ── */}
              {step === 4 && (
                <motion.div key="done" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
                  className="py-8 text-center">
                  <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 0.5 }}
                    className="w-20 h-20 bg-emerald-500 rounded-[24px] flex items-center justify-center mx-auto mb-5 shadow-xl shadow-emerald-500/25">
                    <ShieldCheck size={36} className="text-white" />
                  </motion.div>
                  <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Space Grotesk' }}>Password Updated!</h2>
                  <p className="text-sm text-stone-500 dark:text-stone-400 animate-pulse">Redirecting to login...</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Back to login link */}
            {step < 4 && (
              <div className="flex items-center gap-4 mt-6">
                <div className="flex-1 h-px bg-stone-200 dark:bg-white/6" />
                <Link to="/login" className="text-[10px] font-bold text-stone-400 hover:text-stone-700 dark:hover:text-white uppercase tracking-widest transition-colors whitespace-nowrap">
                  Back to Login
                </Link>
                <div className="flex-1 h-px bg-stone-200 dark:bg-white/6" />
              </div>
            )}
          </div>
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

export default ForgotPassword;