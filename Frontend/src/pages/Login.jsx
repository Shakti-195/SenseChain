import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
// ✅ Cleaned up unused imports (Zap, LockIcon removed)
import { Mail, Lock, ArrowRight, Loader2, ShieldCheck, Activity } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const { login } = useAuth();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            // ✅ FIXED: Using Render URL instead of 127.0.0.1
            const response = await fetch('https://sensechain.onrender.com/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await response.json();
            if (response.ok) {
                login(data.access_token, email);
                navigate('/');
            } else {
                setError(data.detail || 'Invalid email or password');
            }
        } catch (err) {
            console.error("Login Error:", err);
            setError('Server not available. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#F5F5F7] dark:bg-[#020617] relative overflow-hidden transition-colors duration-500">
            {/* Background Blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/10 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-400/10 blur-[120px] rounded-full" />

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-[420px] z-10"
            >
                <div className="bg-white/70 dark:bg-white/5 backdrop-blur-2xl border border-white/40 dark:border-white/10 rounded-[2.5rem] p-10 shadow-2xl shadow-slate-200/50 dark:shadow-none">
                    
                    {/* Branding - Logo with Heartbeat Motion */}
                    <div className="flex flex-col items-center mb-10">
                        <div className="p-4 bg-gradient-to-r from-blue-600 to-black rounded-3xl shadow-xl shadow-indigo-500/20 mb-4">
                            <div className="relative flex items-center justify-center">
                                <ShieldCheck size={28} className="text-white/30" /> 
                                
                                <motion.div 
                                    animate={{ 
                                        opacity: [0.4, 1, 0.4], 
                                        scale: [0.9, 1.1, 0.9] 
                                    }}
                                    transition={{ 
                                        duration: 2, 
                                        repeat: Infinity, 
                                        ease: "easeInOut" 
                                    }}
                                    className="absolute"
                                >
                                    <Activity size={18} className="text-white fill-current" />
                                </motion.div>
                            </div>
                        </div>
                        <h1 className="text-5xl font-semibold tracking-tight dark:text-white"> SenseChain</h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1 text-center">Please Login to Access</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Email</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                <input
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full pl-12 pr-4 py-4 bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-2xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all dark:text-white text-sm font-medium"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Password</label>
                                <Link to="/forgot-password" size={14} className="text-[11px] font-bold text-indigo-500 hover:text-indigo-600 uppercase tracking-tighter">Forgot?</Link>
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full pl-12 pr-4 py-4 bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-2xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all dark:text-white text-sm font-medium"
                                />
                            </div>
                        </div>

                        <AnimatePresence>
                            {error && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 p-3 rounded-xl">
                                    <p className="text-xs font-bold text-rose-500 text-center uppercase tracking-tight">{error}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-gradient-to-r from-blue-600 to-black hover:from-black hover:to-red-600 text-white rounded-2xl font-black tracking-widest text-xs shadow-xl shadow-indigo-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" size={18} /> : <>Login <ArrowRight size={16} /></>}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                        New to network? <Link to="/signup" className="text-blue-500 hover:text-blue-600 ml-1">Sign Up</Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;