import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
// ✅ Zap removed as it's not being used, to prevent build failure
import { Mail, Lock, User, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';

const Signup = () => {
    const [formData, setFormData] = useState({ username: '', email: '', password: '' });
    const [isVerifying, setIsVerifying] = useState(false);
    const [generatedOtp, setGeneratedOtp] = useState('');
    const [userOtp, setUserOtp] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSignupRequest = (e) => {
        e.preventDefault();
        setLoading(true);
        // Prototype logic: local OTP generation
        const randomOtp = Math.floor(1000 + Math.random() * 9000).toString();
        setGeneratedOtp(randomOtp);
        setTimeout(() => {
            setIsVerifying(true);
            setLoading(false);
            alert(`Verification Code: ${randomOtp}`);
        }, 1200);
    };

    const handleVerifyAndLogin = async () => {
        if (userOtp === generatedOtp) {
            setLoading(true);
            setError('');
            try {
                // ✅ UPDATED FOR CLOUD (Render URL instead of 127.0.0.1)
                const response = await fetch('https://sensechain.onrender.com/auth/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData),
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    login(data.access_token, formData.email);
                    navigate('/');
                } else {
                    setError(data.detail || 'User already exists or Invalid Data');
                    // If error occurs, maybe reset verification to let user try again
                    // setIsVerifying(false); 
                }
            } catch (err) {
                console.error("Signup Error:", err);
                setError('Node connection failed. Backend might be sleeping.');
            } finally {
                setLoading(false);
            }
        } else {
            setError("Invalid code. Please try again.");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#F5F5F7] dark:bg-[#020617] relative overflow-hidden transition-colors duration-500">
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 blur-[100px] rounded-full" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 blur-[100px] rounded-full" />

            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-[420px] z-10">
                <div className="bg-white/80 dark:bg-white/5 backdrop-blur-2xl border border-white/50 dark:border-white/10 rounded-[3rem] p-12 shadow-2xl">
                    
                    <AnimatePresence mode="wait">
                        {!isVerifying ? (
                            <motion.div key="signup" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                                <div className="text-center mb-10">
                                    <div className="p-4 bg-gradient-to-r from-blue-600 to-black rounded-3xl inline-flex mb-6 shadow-xl shadow-indigo-500/20">
                                        <User size={28} className="text-white" />
                                    </div>
                                    <h2 className="text-4xl font-semibold tracking-tight dark:text-white">Create Account</h2>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-2">Welcome To SenseChain</p>
                                </div>

                                <form onSubmit={handleSignupRequest} className="space-y-4">
                                    <div className="relative">
                                        <input type="text" placeholder="Full Name" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} required className="w-full px-6 py-4 bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-2xl outline-none focus:border-indigo-500 transition-all dark:text-white text-sm font-medium" />
                                    </div>
                                    <div className="relative">
                                        <input type="email" placeholder="Email Address" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required className="w-full px-6 py-4 bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-2xl outline-none focus:border-indigo-500 transition-all dark:text-white text-sm font-medium" />
                                    </div>
                                    <div className="relative">
                                        <input type="password" placeholder="Create Password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required className="w-full px-6 py-4 bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-2xl outline-none focus:border-indigo-500 transition-all dark:text-white text-sm font-medium" />
                                    </div>
                                    
                                    <button type="submit" disabled={loading} className="w-full py-4 bg-gradient-to-r from-black to-blue-600 hover:to-red-600 text-white rounded-2xl font-black tracking-widest text-xs shadow-xl shadow-indigo-500/20 mt-4 active:scale-95 transition-all">
                                        {loading ? <Loader2 className="animate-spin mx-auto" size={18} /> : 'Sign Up'}
                                    </button>
                                </form>
                                <p className="mt-8 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                                    Already registered? <Link to="/login" className="text-indigo-500 hover:text-indigo-600 ml-1">Sign In</Link>
                                </p>
                            </motion.div>
                        ) : (
                            <motion.div key="otp" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                                <div className="text-center mb-10">
                                    <div className="p-4 bg-gradient-to-r from-blue-600 to-black rounded-3xl inline-flex mb-6 shadow-xl shadow-indigo-500/20">
                                        <ShieldCheck size={28} className="text-white" />
                                    </div>
                                    <h2 className="text-4xl font-semibold tracking-tighter dark:text-white">Verify Account</h2>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-2">Code sent to: {formData.email}</p>
                                </div>

                                <div className="space-y-6 text-center">
                                    <input 
                                        type="text" 
                                        maxLength="4" 
                                        placeholder="0000" 
                                        value={userOtp} 
                                        onChange={(e) => setUserOtp(e.target.value)} 
                                        className="w-full py-6 bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-3xl outline-none text-4xl font-black tracking-[0.8em] text-center text-blue-600 dark:text-white transition-all focus:border-blue-500" 
                                        required 
                                    />
                                    {error && <p className="text-xs font-black text-rose-500 tracking-widest uppercase italic">{error}</p>}
                                    <button onClick={handleVerifyAndLogin} disabled={loading} className="w-full py-5 bg-gradient-to-r from-blue-600 to-black hover:from-black hover:to-red-600 text-white rounded-2xl font-black tracking-widest text-xs shadow-2xl transition-all">
                                        {loading ? <Loader2 className="animate-spin mx-auto" size={18} /> : 'Complete Registration'}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};

export default Signup;