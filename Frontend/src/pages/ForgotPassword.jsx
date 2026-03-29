import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
// ✅ Import renamed to LockIcon to avoid browser conflict
import { KeyRound, Mail, ShieldCheck, ChevronLeft, Loader2, Zap, ArrowRight, Lock as LockIcon } from 'lucide-react';

const ForgotPassword = () => {
    // Logic: State management preserved exactly as original
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [generatedOtp, setGeneratedOtp] = useState('');
    const [userOtp, setUserOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    // ✅ Added Confirm Password State
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSendOTP = (e) => {
        e.preventDefault();
        setLoading(true);
        const randomOtp = Math.floor(1000 + Math.random() * 9000).toString();
        setGeneratedOtp(randomOtp);
        setTimeout(() => {
            setStep(2);
            setLoading(false);
            alert(`Your Verification Code is: ${randomOtp}`);
        }, 1000);
    };

    const handleVerifyOTP = (e) => {
        e.preventDefault();
        if (userOtp === generatedOtp) {
            setStep(3);
            setError('');
        } else {
            setError('The code you entered is incorrect.');
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();

        // ✅ CRITICAL: Match Validation
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);
        setError('');
        try {
            const response = await fetch('http://127.0.0.1:8000/auth/reset-password', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ email, new_password: newPassword })
            });
            const data = await response.json();
            if (response.ok) {
                alert("Security credentials updated.");
                navigate('/login');
            } else {
                setError(data.detail || "Unable to update password.");
            }
        } catch (err) {
            setError("SenseChain node unreachable.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#F5F5F7] dark:bg-[#020617] relative overflow-hidden transition-colors duration-500">
            {/* Background Blobs - Exactly matching Login theme */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/10 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-400/10 blur-[120px] rounded-full" />

            <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="w-full max-w-[420px] z-10"
            >
                <div className="bg-white/70 dark:bg-white/5 backdrop-blur-2xl border border-white/40 dark:border-white/10 rounded-[2.5rem] p-10 shadow-2xl shadow-slate-200/50 dark:shadow-none relative">
                    
                    {/* Back Button */}
                    <Link to="/login" className="absolute top-8 left-8 p-2 bg-white/50 dark:bg-white/5 rounded-xl hover:bg-white transition-all text-slate-400 hover:text-indigo-500">
                        <ChevronLeft size={18} />
                    </Link>

                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <div className="flex flex-col items-center mb-10 mt-4">
                                    <div className="p-4 bg-gradient-to-r from-blue-600 to-black rounded-2xl shadow-xl shadow-indigo-500/20 mb-4 text-white font-bold">
                                        <Mail size={28} />
                                    </div>
                                    <h1 className="text-4xl font-semibold tracking-tight dark:text-white">Reset Password</h1>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1 ">Enter Your Valid Email</p>
                                </div>
                                <form onSubmit={handleSendOTP} className="space-y-5">
                                    <div className="space-y-1.5 text-left">
                                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Recovery Email</label>
                                        <div className="relative group">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input 
                                                type="email" 
                                                placeholder="name@example.com" 
                                                value={email} 
                                                onChange={(e)=>setEmail(e.target.value)} 
                                                required 
                                                className="w-full pl-12 pr-4 py-4 bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-2xl outline-none focus:border-indigo-500 transition-all dark:text-white text-sm font-medium" 
                                            />
                                        </div>
                                    </div>
                                    <button type="submit" disabled={loading} className="w-full py-4 bg-gradient-to-r from-blue-600 to-black hover:from-black hover:to-red-600 text-white rounded-2xl font-black  tracking-widest text-xs shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                                        {loading ? <Loader2 className="animate-spin" size={18}/> : <>Request OTP <ArrowRight size={16} /></>}
                                    </button>
                                </form>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <div className="flex flex-col items-center mb-10 mt-4">
                                    <div className="p-4 bg-gradient-to-r from-blue-600 to-black rounded-3xl shadow-xl shadow-indigo-500/20 mb-4 text-white">
                                        <ShieldCheck size={28} />
                                    </div>
                                    <h1 className="text-4xl font-semibold tracking-tighter dark:text-white ">Verify OTP</h1>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1">Check your inbox</p>
                                </div>
                                <form onSubmit={handleVerifyOTP} className="space-y-6 text-center">
                                <input 
                                        type="text" 
                                        maxLength="4" 
                                        placeholder="0000" 
                                        value={userOtp} 
                                        onChange={(e) => setUserOtp(e.target.value)} 
                                        // ✅ classes updated: 'text-center' added, 'pl' removed for perfect centering
                                        className="w-full py-6 bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-3xl outline-none text-4xl font-black tracking-[0.8em] text-center text-blue-600 dark:text-white transition-all focus:border-blue-500" 
                                        required 
                                    />
                                    {error && <p className="text-xs font-black text-rose-500 uppercase tracking-widest italic">{error}</p>}
                                    <button type="submit" className="w-full py-4 bg-gradient-to-r from-blue-600 to-black hover:from-black hover:to-red-600 text-white rounded-2xl font-black  tracking-widest text-xs active:scale-95 transition-all">Verify</button>
                                </form>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div key="step3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <div className="flex flex-col items-center mb-10 mt-4">
                                    <div className="p-4 bg-gradient-to-r from-blue-600 to-black rounded-2xl shadow-xl shadow-emerald-500/20 mb-4 text-white">
                                        <KeyRound size={28} />
                                    </div>
                                    <h1 className="text-4xl font-semibold tracking-tighter dark:text-white  text-center leading-none">New Password</h1>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-2">Update Node Security</p>
                                </div>
                                <form onSubmit={handleResetPassword} className="space-y-4">
                                    <div className="space-y-1.5 text-left">
                                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">New Password</label>
                                        <div className="relative group">
                                            <LockIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input 
                                                type="password" 
                                                placeholder="New Password" 
                                                value={newPassword} 
                                                onChange={(e)=>setNewPassword(e.target.value)} 
                                                required 
                                                className="w-full pl-12 pr-4 py-4 bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-2xl outline-none focus:border-indigo-500 dark:text-white text-sm font-medium" 
                                            />
                                        </div>
                                    </div>

                                    {/* ✅ Added Confirm Password UI */}
                                    <div className="space-y-1.5 text-left">
                                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Confirm Password</label>
                                        <div className="relative group">
                                            <LockIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input 
                                                type="password" 
                                                placeholder="Confirm Password" 
                                                value={confirmPassword} 
                                                onChange={(e)=>setConfirmPassword(e.target.value)} 
                                                required 
                                                className="w-full pl-12 pr-4 py-4 bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-2xl outline-none focus:border-indigo-500 dark:text-white text-sm font-medium" 
                                            />
                                        </div>
                                    </div>

                                    {error && <p className="text-xs font-black text-rose-500 uppercase tracking-widest text-center italic">{error}</p>}
                                    <button type="submit" disabled={loading} className="w-full py-4 bg-gradient-to-r from-blue-600 to-black  hover:from-black hover:to-red-600 text-white rounded-2xl font-black   tracking-widest text-xs shadow-xl active:scale-95 transition-all">
                                        {loading ? <Loader2 className="animate-spin mx-auto"/> : 'Update Password'}
                                    </button>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <p className="mt-10 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Back to terminal? <Link to="/login" className="text-blue-500 hover:text-blue-600 ml-1  underline-offset-4">Sign In</Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default ForgotPassword;