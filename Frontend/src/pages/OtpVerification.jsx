import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, RefreshCw, ChevronLeft, Fingerprint, Loader2, ArrowRight } from 'lucide-react';

const OtpVerification = () => {
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [timer, setTimer] = useState(59);
    const [error, setError] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email;

    // Dark Mode Sync logic
    const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));
    useEffect(() => {
        const observer = new MutationObserver(() => setIsDark(document.documentElement.classList.contains('dark')));
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setTimer((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleVerify = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            // ✅ FIXED: Using Render URL instead of Localhost
            const res = await fetch('https://sensechain.onrender.com/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp })
            });
            const data = await res.json();
            if (res.ok) {
                setIsSuccess(true);
                // Token handle logic yahan add kar sakte ho agar api.js se nahi ho raha
                setTimeout(() => navigate('/'), 1500);
            } else {
                setError(data.detail || "Invalid OTP");
                setOtp('');
            }
        } catch (err) {
            console.error("Verification Error:", err);
            setError("Server not available. Please check your connection.");
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setTimer(59);
        setError('');
        try {
            // ✅ FIXED: Using Render URL instead of Localhost
            const res = await fetch('https://sensechain.onrender.com/auth/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await res.json();
            if (res.ok) {
                alert(`New OTP sent! For testing: ${data.otp}`);
            } else {
                setError("Failed to send OTP");
            }
        } catch (err) {
            console.error("Resend Error:", err);
            setError("Failed to resend OTP. Node might be offline.");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#F5F5F7] dark:bg-[#020617] relative overflow-hidden transition-colors duration-500">
            {/* Cinematic Background Blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/10 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-400/10 blur-[120px] rounded-full" />

            <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="w-full max-w-[420px] z-10"
            >
                <div className="bg-white/70 dark:bg-white/5 backdrop-blur-2xl border border-white/40 dark:border-white/10 rounded-[2.5rem] p-10 shadow-2xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden">
                    
                    <AnimatePresence mode="wait">
                        {!isSuccess ? (
                            <motion.div key="otp-input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <div className="flex flex-col items-center mb-10">
                                    <div className="p-4 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-500/20 mb-4 text-white">
                                        <Fingerprint size={32} />
                                    </div>
                                    <h1 className="text-3xl font-black tracking-tighter dark:text-white uppercase italic">Verify Node</h1>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1 text-center leading-relaxed">
                                        Authorizing link for: <br/> <span className="text-indigo-500 lowercase">{email || "User"}</span>
                                    </p>
                                </div>

                                <form onSubmit={handleVerify} className="space-y-8">
                                    <div className="text-center">
                                        <input 
                                            type="text" 
                                            maxLength="4"
                                            placeholder="0 0 0 0"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value)}
                                            required
                                            className="w-full bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-3xl p-6 text-5xl font-black tracking-[0.5em] pl-[0.5em] outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all dark:text-white tabular-nums shadow-inner"
                                        />
                                        <AnimatePresence>
                                            {error && (
                                                <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 text-xs font-black text-rose-500 uppercase tracking-widest italic">
                                                    {error}
                                                </motion.p>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    <button 
                                        type="submit" 
                                        disabled={loading} 
                                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-black text-white rounded-2xl font-black uppercase italic tracking-widest text-xs shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                    >
                                        {loading ? <Loader2 className="animate-spin" size={18} /> : <>Authorize Identity <ArrowRight size={16} /></>}
                                    </button>
                                </form>

                                <div className="mt-8 text-center">
                                    {timer > 0 ? (
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            Handshake window: <span className="text-indigo-500 font-mono italic">{timer}s</span>
                                        </p>
                                    ) : (
                                        <button type="button" onClick={handleResend} className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] hover:underline flex items-center gap-2 mx-auto italic">
                                            <RefreshCw size={12}/> Re-issue Credentials
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-10 space-y-6">
                                <div className="w-24 h-24 bg-emerald-500 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/30">
                                    <ShieldCheck size={48} className="text-white" />
                                </div>
                                <h2 className="text-3xl font-black italic tracking-tighter uppercase dark:text-white">Authorized</h2>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Syncing neural link...</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <button 
                        type="button"
                        onClick={() => navigate('/login')} 
                        className="mt-10 mx-auto flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-500 transition-all italic"
                    >
                        <ChevronLeft size={14}/> Back to Terminal
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default OtpVerification;