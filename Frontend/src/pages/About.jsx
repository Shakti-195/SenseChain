import React from "react";
import { motion } from "framer-motion";
import { 
  Cpu, ShieldCheck, Activity, Zap, Globe, Brain, 
  Wifi, Radio, Handshake, Terminal, Link, Share2,
  Mail, ExternalLink 
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 }
  }
};

const stagger = {
  show: {
    transition: {
      staggerChildren: 0.15
    }
  }
};

const About = () => {
  return (
    <div className="relative min-h-screen px-6 lg:px-20 py-12 space-y-24 
    bg-gradient-to-br from-slate-50 to-slate-100 
    dark:from-[#020617] dark:to-[#020617] text-slate-800 dark:text-white overflow-hidden">

      {/* 🌌 BACKGROUND BLOBS */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-400/20 blur-3xl rounded-full animate-pulse" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-400/20 blur-3xl rounded-full animate-pulse" />

      {/* 1. HERO SECTION */}
      <motion.section variants={fadeUp} initial="hidden" animate="show" className="text-center space-y-6">
        <h1 className="text-5xl font-extrabold tracking-tight">
          SenseChain <span className="text-blue-500">Platform</span>
        </h1>
        <p className="max-w-2xl mx-auto text-slate-500 dark:text-slate-400">
          A blockchain-powered IoT system ensuring secure, real-time data integrity.
        </p>
      </motion.section>

      {/* 2. OVERVIEW */}
      <motion.section variants={stagger} initial="hidden" animate="show" className="grid md:grid-cols-3 gap-8">
        <AnimatedCard icon={<Cpu />} title="Blockchain Core" desc="Immutable ledger system." />
        <AnimatedCard icon={<ShieldCheck />} title="Security Engine" desc="Detects tampering instantly." />
        <AnimatedCard icon={<Activity />} title="Live Monitoring" desc="Real-time sensor tracking." />
      </motion.section>

      {/* 3. HOW IT WORKS */}
      <motion.section variants={fadeUp} initial="hidden" whileInView="show">
        <h2 className="text-2xl font-bold mb-6">How It Works</h2>
        <div className="grid md:grid-cols-4 gap-6">
          <Step step="1" title="Collect Data" desc="Sensors capture data." />
          <Step step="2" title="Create Block" desc="Stored in blockchain." />
          <Step step="3" title="Hashing" desc="Secured cryptographically." />
          <Step step="4" title="Validation" desc="Chain is verified." />
        </div>
      </motion.section>

      {/* 4. USE CASES */}
      <motion.section variants={fadeUp} initial="hidden" whileInView="show">
        <h2 className="text-2xl font-bold mb-6">Use Cases</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <AnimatedCard icon={<Globe />} title="Smart Agriculture" desc="Monitor climate securely." />
          <AnimatedCard icon={<Zap />} title="Industrial IoT" desc="Machine monitoring." />
          <AnimatedCard icon={<Brain />} title="Healthcare" desc="Secure patient data." />
          <AnimatedCard icon={<ShieldCheck />} title="Supply Chain" desc="Track goods safely." />
        </div>
      </motion.section>

      {/* 5. NEWS */}
      <motion.section variants={fadeUp} initial="hidden" whileInView="show">
        <h2 className="text-2xl font-bold mb-6">Latest Upcomming Updates</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <News title="AI Upgrade" tag="NEW" />
          <News title="Security Patch" tag="UPDATE" />
          <News title="Mobile App" tag="SOON" />
        </div>
      </motion.section>

      {/* 🚀 6. NEW UPLINK SECTION */}
      <motion.section 
        variants={fadeUp} 
        initial="hidden" 
        whileInView="show" 
        className="bg-white/40 dark:bg-white/5 backdrop-blur-2xl rounded-[3rem] p-10 lg:p-16 border border-white dark:border-white/10 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12"><Share2 size={200}/></div>
        
        <div className="flex items-center gap-6 mb-12">
           <div className="p-5 bg-indigo-600 text-white rounded-3xl shadow-xl shadow-indigo-500/20">
              <Wifi size={32} />
           </div>
           <div>
              <h2 className="text-3xl font-black  tracking-tighter">Neural Uplink Infrastructure</h2>
              <p className="text-[10px] font-bold text-indigo-500  tracking-[0.4em] mt-2">Hardware-to-Ledger Synchronization Engine</p>
           </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="space-y-4">
             <div className="flex items-center gap-3 text-indigo-500">
                <Handshake size={20} />
                <h4 className="font-black  text-sm">P2P Handshake</h4>
             </div>
             <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">Establishing autonomous encrypted tunnels between ESP32 nodes and the forensic terminal via dynamic SHA-256 session keys.</p>
          </div>
          <div className="space-y-4">
             <div className="flex items-center gap-3 text-indigo-500">
                <Terminal size={20} />
                <h4 className="font-black  text-sm">Packet Ingestion</h4>
             </div>
             <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">Real-time telemetry streams are captured, validated, and mined into blocks with an average network latency of 0.14ms.</p>
          </div>
          <div className="space-y-4">
             <div className="flex items-center gap-3 text-indigo-500">
                <Link size={20} />
                <h4 className="font-black  text-sm">Distributed Registry</h4>
             </div>
             <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">Decentralized management of physical node identities, allowing multi-cluster deployments across static API gateways.</p>
          </div>
        </div>

        <div className="mt-12 pt-10 border-t border-slate-200 dark:border-white/5 flex flex-wrap gap-8 items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Uplink Gateway: <span className="text-emerald-500 italic">Optimized</span></span>
           </div>
           <div className="flex gap-4">
              <div className="px-4 py-2 bg-slate-100 dark:bg-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-slate-200 dark:border-white/5">Protocol: MQTT/WS</div>
              <div className="px-4 py-2 bg-slate-100 dark:bg-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-slate-200 dark:border-white/5">AES-NI Encryption</div>
           </div>
        </div>
      </motion.section>

      {/* 7. ROADMAP */}
      <motion.section variants={fadeUp} initial="hidden" whileInView="show">
        <h2 className="text-2xl font-bold mb-6">Future Roadmap</h2>
        <div className="space-y-4">
          <Road text="AI anomaly detection" />
          <Road text="Multi-node blockchain" />
          <Road text="Mobile app launch" />
        </div>
      </motion.section>

      {/* 📧 8. NEURAL SUPPORT GATEWAY (Correctly Nested) */}
      <motion.section 
        variants={fadeUp} 
        initial="hidden" 
        whileInView="show"
        className="mt-24 p-12 bg-white/40 dark:bg-white/5 border border-indigo-500/20 rounded-[3.5rem] backdrop-blur-3xl text-center shadow-2xl relative overflow-hidden"
      >
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/10 blur-3xl rounded-full opacity-50" />
        
        <div className="relative z-10 space-y-6">
          <div className="p-5 bg-indigo-600 text-white w-fit mx-auto rounded-3xl shadow-xl shadow-indigo-500/30">
            <Mail size={32} />
          </div>
          
          <h2 className="text-4xl font-black  tracking-tighter">
            Help and <span className="text-indigo-500">Support</span>
          </h2>
          
          <p className="max-w-xl mx-auto text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-[0.2em] leading-relaxed">
            Technical drift in your node clusters? Connect with SenseChain engineering for real-time forensic assistance.
          </p>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 pt-6">
            <motion.a 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              href="mailto:thakurshaktisingh195@gmail.com" 
              className="flex items-center gap-4 px-10 py-5 bg-indigo-600 hover:bg-indigo-700 text-white font-black tracking-widest rounded-2xl transition-all shadow-2xl shadow-indigo-500/40"
            >
              SEND DIRECT MAIL <ExternalLink size={18}/>
            </motion.a>
            
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Response Protocol</span>
               <span className="text-emerald-500 font-black italic text-sm uppercase">ACTIVE // UNDER 12H</span>
            </div>
          </div>
        </div>
      </motion.section>

    </div> // Closing main div
  );
};

/* ── SUPPORTING COMPONENTS ── */

const AnimatedCard = ({ icon, title, desc }) => (
  <motion.div
    variants={fadeUp}
    whileHover={{ scale: 1.05, rotate: 1 }}
    className="bg-white/70 dark:bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-xl border border-white/20 transition-all duration-300"
  >
    <div className="text-indigo-500 mb-4">{icon}</div>
    <h3 className="font-bold text-lg">{title}</h3>
    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">{desc}</p>
  </motion.div>
);

const Step = ({ step, title, desc }) => (
  <motion.div
    whileHover={{ scale: 1.05 }}
    className="bg-white/70 dark:bg-white/5 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-white/5"
  >
    <p className="text-indigo-500 text-sm font-bold uppercase tracking-widest">STEP {step}</p>
    <h4 className="font-semibold mt-3 text-lg">{title}</h4>
    <p className="text-sm text-slate-500 mt-2">{desc}</p>
  </motion.div>
);

const News = ({ title, tag }) => (
  <motion.div
    whileHover={{ scale: 1.05 }}
    className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-8 rounded-[2.5rem] shadow-2xl"
  >
    <span className="text-[10px] font-black bg-white/20 px-3 py-1 rounded-full uppercase tracking-widest">{tag}</span>
    <h4 className="mt-5 font-black text-xl italic uppercase tracking-tight">{title}</h4>
  </motion.div>
);

const Road = ({ text }) => (
  <motion.div
    whileHover={{ x: 10 }}
    className="flex items-center gap-4 bg-white/70 dark:bg-white/5 p-5 rounded-2xl border border-slate-100 dark:border-white/5 transition-all"
  >
    <div className="w-3 h-3 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_10px_#6366f1]" />
    <p className="font-medium text-slate-700 dark:text-slate-300 italic">{text}</p>
  </motion.div>
);

export default About;