import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
  Mail, Lock, User, ShieldCheck, ArrowRight, Loader2,
  Activity, Eye, EyeOff, KeyRound, Copy, Check, Blocks, Zap
} from 'lucide-react';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ||
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://127.0.0.1:8000'
    : 'https://sensechain.onrender.com');

const Signup = () => {
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [step, setStep] = useState('form'); // 'form' | 'otp' | 'done'
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [userOtp, setUserOtp] = useState('');
  const [otpCopied, setOtpCopied] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  // ── Step 1: Generate OTP and show it on-screen ──
  const handleSignupRequest = (e) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.email.trim() || !formData.password.trim()) {
      setError('Please fill in all fields.'); return;
    }
    setLoading(true);
    setError('');
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(otp);
    setTimeout(() => { setStep('otp'); setLoading(false); }, 600);
  };

  // ── Step 2: Verify OTP and register ──
  const handleVerify = async () => {
    if (userOtp.trim() !== generatedOtp) {
      setError('Invalid verification code. Please check and try again.'); return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        setStep('done');
        setTimeout(() => { login(data.access_token, formData.email); navigate('/'); }, 1200);
      } else {
        setError(data.detail || 'Registration failed. Account may already exist.');
      }
    } catch {
      setError('Unable to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyOtp = () => {
    navigator.clipboard.writeText(generatedOtp);
    setOtpCopied(true);
    setTimeout(() => setOtpCopied(false), 2000);
  };

  const update = (field) => (e) => setFormData(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="auth-bg relative overflow-hidden">
      {/* Grid */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(220,38,38,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(220,38,38,0.07) 1px, transparent 1px)',
          backgroundSize: '56px 56px'
        }}
      />
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-rose-900/12 rounded-full blur-[80px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-[440px]">
        {/* Logo */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-7">
          <div className="flex items-center justify-center gap-3 mb-4">
            <motion.div animate={{ rotate: [0, 4, -4, 0] }} transition={{ duration: 5, repeat: Infinity }}
              className="brand-logo w-11 h-11 rounded-[14px] flex items-center justify-center relative">
              <ShieldCheck size={18} className="text-white/20 absolute" />
              <Activity size={11} className="text-white relative z-10" fill="white" />
            </motion.div>
            <div className="text-left">
              <span className="block text-xl font-bold tracking-tight text-stone-900 dark:text-white" style={{ fontFamily: 'Space Grotesk' }}>SenseChain</span>
              <span className="block text-[9px] font-bold text-red-600 dark:text-red-500 uppercase tracking-[0.25em]">NEURAL LEDGER PLATFORM</span>
            </div>
          </div>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1], delay: 0.05 }}
          className="glass-card rounded-[28px] overflow-hidden"
        >
          <div className="h-1 bg-gradient-to-r from-red-600 via-rose-500 to-red-800" />

          <AnimatePresence mode="wait">
            {/* ── STEP 1: REGISTRATION FORM ── */}
            {step === 'form' && (
              <motion.div key="form" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-8 md:p-10">
                <div className="mb-7">
                  <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Space Grotesk' }}>Create Account</h1>
                  <p className="text-sm text-stone-500 dark:text-stone-400">Join the SenseChain neural network</p>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                      className="flex items-start gap-3 mb-5 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm font-medium">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0 animate-pulse" />{error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSignupRequest} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 uppercase tracking-widest mb-1.5">Username</label>
                    <div className="relative">
                      <User size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input type="text" value={formData.username} onChange={update('username')} placeholder="neural_agent_01" required className="glass-input pl-11" autoComplete="username" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 uppercase tracking-widest mb-1.5">Email</label>
                    <div className="relative">
                      <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input type="email" value={formData.email} onChange={update('email')} placeholder="you@sensechain.io" required className="glass-input pl-11" autoComplete="email" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 uppercase tracking-widest mb-1.5">Password</label>
                    <div className="relative">
                      <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input type={showPw ? 'text' : 'password'} value={formData.password} onChange={update('password')} placeholder="Minimum 8 characters" required className="glass-input pl-11 pr-12" autoComplete="new-password" />
                      <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-red-600 transition-colors">
                        {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                  <motion.button type="submit" disabled={loading} whileHover={{ scale: loading ? 1 : 1.01 }} whileTap={{ scale: 0.98 }}
                    className="btn-primary w-full mt-2 py-3.5">
                    {loading ? <><Loader2 size={16} className="animate-spin" />Securing...</> : <><KeyRound size={16} />Continue to Verification</>}
                  </motion.button>
                </form>

                <div className="flex items-center gap-4 my-5">
                  <div className="flex-1 h-px bg-stone-200 dark:bg-white/6" />
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Have an account?</span>
                  <div className="flex-1 h-px bg-stone-200 dark:bg-white/6" />
                </div>
                <Link to="/login">
                  <motion.div whileHover={{ scale: 1.01 }} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-stone-200 dark:border-white/8 text-sm font-semibold text-stone-700 dark:text-stone-300 hover:border-red-400 hover:text-red-600 dark:hover:text-red-400 transition-all cursor-pointer">
                    <Blocks size={14} className="text-red-500" /> Sign In Instead
                  </motion.div>
                </Link>
              </motion.div>
            )}

            {/* ── STEP 2: OTP VERIFICATION ── */}
            {step === 'otp' && (
              <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="p-8 md:p-10">
                <div className="text-center mb-7">
                  <div className="w-16 h-16 rounded-[20px] bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4 border border-red-200 dark:border-red-700">
                    <KeyRound size={28} className="text-red-600 dark:text-red-400" />
                  </div>
                  <h2 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Space Grotesk' }}>Verify Identity</h2>
                  <p className="text-sm text-stone-500 dark:text-stone-400">Enter the code sent to <span className="font-semibold text-stone-700 dark:text-stone-300">{formData.email}</span></p>
                </div>

                {/* ── OTP DISPLAY CARD — This shows it on screen ── */}
                <div className="mb-6 p-5 rounded-2xl bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/40 dark:to-rose-950/30 border-2 border-red-200 dark:border-red-800">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-widest">Your Verification Code</p>
                    <button onClick={copyOtp} className="flex items-center gap-1 text-[10px] font-bold text-stone-500 hover:text-red-600 transition-colors">
                      {otpCopied ? <><Check size={11} className="text-emerald-500" />Copied!</> : <><Copy size={11} />Copy</>}
                    </button>
                  </div>
                  <div className="text-center">
                    <p className="text-5xl font-black tracking-[0.4em] text-red-600 dark:text-red-400 font-mono tabular-nums select-all">{generatedOtp}</p>
                    <p className="text-[10px] text-stone-400 mt-2 font-medium">
                      ⚡ For demo purposes — in production this is emailed
                    </p>
                  </div>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                      className="flex items-start gap-3 mb-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm font-medium">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />{error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 uppercase tracking-widest mb-1.5">Enter Code</label>
                    <input
                      type="text"
                      maxLength={4}
                      value={userOtp}
                      onChange={(e) => { setUserOtp(e.target.value.replace(/\D/g, '')); setError(''); }}
                      placeholder="_ _ _ _"
                      className="glass-input text-center text-3xl font-black tracking-[0.4em] font-mono"
                      autoFocus
                    />
                  </div>
                  <motion.button
                    onClick={handleVerify}
                    disabled={loading || userOtp.length < 4}
                    whileHover={{ scale: loading ? 1 : 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    className="btn-primary w-full py-3.5"
                  >
                    {loading ? <><Loader2 size={16} className="animate-spin" />Authorizing...</> : <><ShieldCheck size={16} />Verify & Create Account</>}
                  </motion.button>
                  <button onClick={() => { setStep('form'); setUserOtp(''); setError(''); }}
                    className="w-full text-sm font-medium text-stone-500 hover:text-red-600 transition-colors py-2">
                    ← Go back and edit details
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── STEP 3: SUCCESS ── */}
            {step === 'done' && (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} className="p-10 text-center">
                <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 0.5 }}
                  className="w-20 h-20 bg-emerald-500 rounded-[24px] flex items-center justify-center mx-auto mb-5 shadow-xl shadow-emerald-500/25">
                  <ShieldCheck size={36} className="text-white" />
                </motion.div>
                <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Space Grotesk' }}>Node Authorized!</h2>
                <p className="text-sm text-stone-500 dark:text-stone-400 animate-pulse">Syncing neural link...</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Trust badges */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="flex items-center justify-center gap-6 mt-5">
          {[
            { icon: <ShieldCheck size={11} />, text: 'SHA-256 Secured' },
            { icon: <Zap size={11} />, text: 'Real-time Sync' },
            { icon: <Activity size={11} />, text: 'Live Monitoring' },
          ].map(item => (
            <div key={item.text} className="flex items-center gap-1.5 text-[10px] font-semibold text-stone-400 dark:text-stone-600">
              <span className="text-red-500">{item.icon}</span>{item.text}
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

export default Signup;