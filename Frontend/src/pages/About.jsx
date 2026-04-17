import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  Cpu, ShieldCheck, Activity, Zap, Globe, Brain,
  Wifi, Handshake, Terminal, Link as LinkIcon, Share2,
  Mail, ExternalLink, ChevronRight, Lock, Database,
  Server, Layers, Radio, CheckCircle, ArrowRight, Star,
  TrendingUp, Network, Code2, Blocks,
} from 'lucide-react';

const About = () => {
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  useEffect(() => {
    const obs = new MutationObserver(() => setIsDark(document.documentElement.classList.contains('dark')));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  return (
    <div className={`relative min-h-screen overflow-x-hidden ${isDark ? 'bg-[#020617]' : 'bg-slate-50'} transition-colors duration-500`}>

      {/* ── AMBIENT BACKGROUND ── */}
      <div className="fixed inset-0 pointer-events-none">
        <div className={`absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full blur-[120px] ${isDark ? 'bg-blue-500/5' : 'bg-blue-400/8'} animate-pulse`} />
        <div className={`absolute bottom-1/4 right-0 w-[500px] h-[500px] rounded-full blur-[100px] ${isDark ? 'bg-violet-500/5' : 'bg-violet-400/6'}`} />
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `linear-gradient(${isDark ? 'rgba(59,130,246,1)' : 'rgba(99,102,241,1)'} 1px, transparent 1px), linear-gradient(90deg, ${isDark ? 'rgba(59,130,246,1)' : 'rgba(99,102,241,1)'} 1px, transparent 1px)`,
            backgroundSize: '64px 64px'
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-16 py-16 space-y-32">

        {/* ═══════════════════════════════════════════════════
            1. HERO SECTION with animated blockchain illustration
        ═══════════════════════════════════════════════════ */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center relative"
        >
          {/* Chain Illustration */}
          <div className="flex justify-center mb-12 overflow-hidden">
            <BlockchainIllustration isDark={isDark} />
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-6"
            style={{
              background: isDark ? 'rgba(59,130,246,0.08)' : 'rgba(37,99,235,0.06)',
              borderColor: isDark ? 'rgba(59,130,246,0.2)' : 'rgba(37,99,235,0.15)',
            }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">News & Platform Overview</span>
          </div>

          <h1 className={`text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}
            style={{ fontFamily: 'Space Grotesk' }}>
            The Future of<br />
            <span className="bg-gradient-to-r from-blue-600 via-violet-600 to-indigo-600 bg-clip-text text-transparent">
              Secure IoT
            </span>
          </h1>
          <p className={`max-w-2xl mx-auto text-lg leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            SenseChain combines real-time sensor networks with immutable blockchain ledgers —
            creating a tamper-proof, AI-monitored security infrastructure for the industrial age.
          </p>
        </motion.section>

        {/* ═══════════════════════════════════════════════════
            2. CORE FEATURES with SVG illustrations
        ═══════════════════════════════════════════════════ */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <SectionLabel label="Core Technology" />
          <h2 className={`text-3xl md:text-4xl font-bold mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: 'Space Grotesk' }}>
            Built on Three Pillars
          </h2>
          <p className={`text-sm mb-12 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Industry-proven technologies powering SenseChain</p>

          <div className="grid md:grid-cols-3 gap-6">
            <PillarCard
              isDark={isDark}
              illustration={<BlockchainSVG />}
              icon={<Blocks size={20} />}
              color="blue"
              title="Blockchain Core"
              desc="Proof-of-Work SHA-256 ledger with immutable hash linkages. Every sensor reading is cryptographically sealed into a permanent block."
              stat="100%" statLabel="Tamper-proof"
            />
            <PillarCard
              isDark={isDark}
              illustration={<ShieldSVG />}
              icon={<ShieldCheck size={20} />}
              color="violet"
              title="Security Engine"
              desc="Real-time cryptographic verification detects any unauthorized data modification within milliseconds. AI-powered anomaly detection included."
              stat="0.14ms" statLabel="Detection latency"
            />
            <PillarCard
              isDark={isDark}
              illustration={<NetworkSVG />}
              icon={<Network size={20} />}
              color="emerald"
              title="Live Monitoring"
              desc="WebSocket-powered real-time dashboards with sub-second data sync. Temperature, humidity, and device health tracked continuously."
              stat="24/7" statLabel="Uptime guarantee"
            />
          </div>
        </motion.section>

        {/* ═══════════════════════════════════════════════════
            3. HOW IT WORKS — visual flow
        ═══════════════════════════════════════════════════ */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <SectionLabel label="Architecture" />
          <h2 className={`text-3xl md:text-4xl font-bold mb-12 ${isDark ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: 'Space Grotesk' }}>
            How SenseChain Works
          </h2>

          <div className="grid md:grid-cols-4 gap-0 relative">
            {/* Connector line */}
            <div className="absolute top-12 left-[12.5%] right-[12.5%] h-0.5 hidden md:block"
              style={{ background: isDark ? 'linear-gradient(90deg, rgba(59,130,246,0), rgba(59,130,246,0.4), rgba(139,92,246,0.4), rgba(59,130,246,0))' : 'linear-gradient(90deg, rgba(37,99,235,0), rgba(37,99,235,0.3), rgba(124,58,237,0.3), rgba(37,99,235,0))' }}
            />

            {[
              { step: '01', icon: <Radio size={20} />, title: 'Sensor Capture', desc: 'IoT devices stream telemetry data via MQTT/WebSocket in real time', color: 'blue' },
              { step: '02', icon: <Code2 size={20} />, title: 'Block Mining', desc: 'Each data packet is solved with Proof-of-Work and sealed into a block', color: 'indigo' },
              { step: '03', icon: <Lock size={20} />, title: 'SHA-256 Hash', desc: 'Cryptographic fingerprinting links every block to the previous one', color: 'violet' },
              { step: '04', icon: <ShieldCheck size={20} />, title: 'Verification', desc: 'AI engine continuously validates chain integrity and triggers alerts', color: 'emerald' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="flex flex-col items-center text-center px-4"
              >
                <div className={`w-24 h-24 rounded-3xl flex items-center justify-center mb-5 relative shadow-xl ${
                  isDark
                    ? `bg-${item.color}-500/12 border border-${item.color}-500/20 text-${item.color}-400`
                    : `bg-${item.color}-50 border border-${item.color}-100 text-${item.color}-600`
                }`}
                  style={{
                    background: isDark ? `rgba(var(--color-${item.color}), 0.08)` : undefined,
                    borderColor: isDark ? `rgba(var(--color-${item.color}), 0.15)` : undefined,
                  }}
                >
                  <div className={`w-24 h-24 rounded-3xl flex items-center justify-center ${
                    item.color === 'blue' ? 'bg-blue-100 dark:bg-blue-500/12 border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400'
                    : item.color === 'indigo' ? 'bg-indigo-100 dark:bg-indigo-500/12 border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                    : item.color === 'violet' ? 'bg-violet-100 dark:bg-violet-500/12 border border-violet-200 dark:border-violet-500/20 text-violet-600 dark:text-violet-400'
                    : 'bg-emerald-100 dark:bg-emerald-500/12 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                  }`}>{item.icon}</div>
                  <span className={`absolute -top-3 -right-3 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black text-white ${
                    item.color === 'blue' ? 'bg-blue-600' : item.color === 'indigo' ? 'bg-indigo-600' : item.color === 'violet' ? 'bg-violet-600' : 'bg-emerald-600'
                  }`}>{item.step}</span>
                </div>
                <h4 className={`font-bold text-sm mb-2 ${isDark ? 'text-white' : 'text-slate-800'}`} style={{ fontFamily: 'Space Grotesk' }}>{item.title}</h4>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ═══════════════════════════════════════════════════
            4. USE CASES with rich visual cards
        ═══════════════════════════════════════════════════ */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <SectionLabel label="Applications" />
          <h2 className={`text-3xl md:text-4xl font-bold mb-12 ${isDark ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: 'Space Grotesk' }}>
            Real-World Use Cases
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: '🌾', title: 'Smart Agriculture', desc: 'Monitor soil sensors, irrigation systems, and climate data with immutable audit trails for regulatory compliance.', color: 'emerald' },
              { icon: '⚡', title: 'Industrial IoT', desc: 'Track machine telemetry across factory floors with real-time breach detection and predictive maintenance alerts.', color: 'amber' },
              { icon: '🏥', title: 'Healthcare', desc: 'Secure patient vitals and cold-chain pharmaceutical data with cryptographic proof of data integrity.', color: 'rose' },
              { icon: '📦', title: 'Supply Chain', desc: 'Track goods from origin to destination with blockchain-verified provenance and tamper-evident records.', color: 'blue' },
            ].map((uc, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -6 }}
                className={`rounded-[24px] p-6 cursor-pointer transition-all group relative overflow-hidden border ${
                  isDark ? 'bg-white/3 border-white/6 hover:border-white/12' : 'bg-white border-slate-100 shadow-sm hover:shadow-md'
                }`}
              >
                <div className="text-4xl mb-4">{uc.icon}</div>
                <h4 className={`font-bold text-base mb-2 ${isDark ? 'text-white' : 'text-slate-800'}`} style={{ fontFamily: 'Space Grotesk' }}>{uc.title}</h4>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{uc.desc}</p>
                <div className={`absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity ${
                  uc.color === 'emerald' ? 'text-emerald-500' : uc.color === 'amber' ? 'text-amber-500' : uc.color === 'rose' ? 'text-rose-500' : 'text-blue-500'
                }`}>
                  <ArrowRight size={18} />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ═══════════════════════════════════════════════════
            5. NEURAL UPLINK INFRASTRUCTURE with illustration
        ═══════════════════════════════════════════════════ */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className={`rounded-[32px] overflow-hidden border ${isDark ? 'border-white/6' : 'border-slate-200'} relative`}
        >
          <div className={`${isDark ? 'bg-gradient-to-br from-blue-950/40 to-violet-950/30' : 'bg-gradient-to-br from-blue-50 to-indigo-50/50'} p-8 md:p-16`}>
            <div className="absolute top-0 right-0 opacity-8 pointer-events-none">
              <UplinkSVG isDark={isDark} />
            </div>

            <div className="max-w-4xl relative z-10">
              <SectionLabel label="Neural Infrastructure" />
              <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: 'Space Grotesk' }}>
                Hardware-to-Ledger<br />Synchronization Engine
              </h2>
              <p className={`text-sm mb-10 max-w-xl ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                SenseChain's neural uplink establishes persistent encrypted tunnels between physical IoT hardware and the forensic blockchain terminal.
              </p>

              <div className="grid md:grid-cols-3 gap-6 mb-10">
                {[
                  { icon: <Handshake size={18} />, title: 'P2P Handshake', desc: 'Autonomous encrypted tunnels between ESP32 nodes via dynamic SHA-256 session keys.' },
                  { icon: <Terminal size={18} />, title: 'Packet Ingestion', desc: 'Real-time telemetry streams validated and mined into blocks at 0.14ms latency.' },
                  { icon: <LinkIcon size={18} />, title: 'Distributed Registry', desc: 'Decentralized node identity management for multi-cluster deployments.' },
                ].map((item, i) => (
                  <div key={i} className={`rounded-2xl p-5 border ${isDark ? 'bg-white/4 border-white/6' : 'bg-white/80 border-slate-200'}`}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400">{item.icon}</div>
                      <h4 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>{item.title}</h4>
                    </div>
                    <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{item.desc}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                {['MQTT/WebSocket', 'AES-NI Encryption', 'ESP32 Compatible', 'Sub-second Sync', 'SHA-256 PoW'].map(tag => (
                  <span key={tag} className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                    isDark ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-white border-slate-200 text-slate-600'
                  }`}>{tag}</span>
                ))}
              </div>
            </div>
          </div>
        </motion.section>

        {/* ═══════════════════════════════════════════════════
            6. LATEST UPDATES (news cards)
        ═══════════════════════════════════════════════════ */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <SectionLabel label="Changelog & Updates" />
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <h2 className={`text-3xl md:text-4xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: 'Space Grotesk' }}>
              Platform Updates
            </h2>
            <span className={`text-xs font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>All times UTC</span>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                tag: 'NEW',
                tagColor: 'bg-blue-600',
                date: 'April 2026',
                title: 'AI Neural Assistant v11',
                desc: 'Sense Brain AI with full voice interface, deep search, live conversation, and multi-session history.',
                icon: '🧠',
              },
              {
                tag: 'UPDATE',
                tagColor: 'bg-emerald-600',
                date: 'April 2026',
                title: 'Forensic Audit Reports',
                desc: 'Government-grade PDF and CSV exports with cryptographic signature blocks, classification headers, and row-level integrity flags.',
                icon: '📋',
              },
              {
                tag: 'SOON',
                tagColor: 'bg-amber-500',
                date: 'Q3 2026',
                title: 'Mobile App Launch',
                desc: 'Native iOS and Android apps with biometric authentication, push breach notifications, and remote node management.',
                icon: '📱',
              },
            ].map((news, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -4 }}
                className={`rounded-[24px] overflow-hidden border group ${
                  isDark ? 'bg-white/3 border-white/6' : 'bg-white border-slate-100 shadow-sm'
                }`}
              >
                <div className={`h-2 ${news.tagColor}`} />
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-[10px] font-black px-3 py-1 rounded-full text-white uppercase tracking-widest ${news.tagColor}`}>{news.tag}</span>
                    <span className={`text-[10px] font-medium ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>{news.date}</span>
                  </div>
                  <div className="text-3xl mb-3">{news.icon}</div>
                  <h4 className={`font-bold text-base mb-2 ${isDark ? 'text-white' : 'text-slate-800'}`} style={{ fontFamily: 'Space Grotesk' }}>{news.title}</h4>
                  <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{news.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ═══════════════════════════════════════════════════
            7. ROADMAP
        ═══════════════════════════════════════════════════ */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <SectionLabel label="Future Roadmap" />
          <h2 className={`text-3xl md:text-4xl font-bold mb-10 ${isDark ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: 'Space Grotesk' }}>
            What's Coming Next
          </h2>
          <div className="space-y-3">
            {[
              { q: 'Q3 2026', title: 'Multi-node Distributed Blockchain', desc: 'P2P consensus across geographically distributed blockchain nodes', done: false, prog: 40 },
              { q: 'Q3 2026', title: 'Mobile App (iOS & Android)', desc: 'Native mobile experience with biometric authentication and offline mode', done: false, prog: 20 },
              { q: 'Q4 2026', title: 'AI Anomaly Detection Engine', desc: 'Neural network trained on sensor patterns to predict failures 48h in advance', done: false, prog: 10 },
              { q: 'Q1 2027', title: 'API Gateway & Developer SDK', desc: 'Public REST API with webhook support for third-party integrations', done: false, prog: 5 },
            ].map((item, i) => (
              <motion.div
                key={i}
                whileHover={{ x: 6 }}
                className={`rounded-2xl p-5 border ${isDark ? 'bg-white/3 border-white/6' : 'bg-white border-slate-100'}`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest w-16 shrink-0">{item.q}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>{item.title}</h4>
                      <span className={`text-[10px] font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{item.prog}%</span>
                    </div>
                    <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{item.desc}</p>
                    <div className={`h-1 rounded-full mt-2 ${isDark ? 'bg-white/6' : 'bg-slate-100'}`}>
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-600 to-violet-600"
                        style={{ width: `${item.prog}%` }}
                      />
                    </div>
                  </div>
                  <ArrowRight size={16} className={`shrink-0 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ═══════════════════════════════════════════════════
            8. CONTACT CTA
        ═══════════════════════════════════════════════════ */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className={`rounded-[32px] p-12 md:p-20 text-center relative overflow-hidden border ${
            isDark ? 'bg-gradient-to-br from-blue-950/60 to-violet-950/40 border-blue-500/15' : 'bg-gradient-to-br from-blue-600 to-violet-700 border-blue-600'
          }`}
        >
          {/* Decorative circles */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full border border-white/8 translate-x-1/3 -translate-y-1/3" />
            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full border border-white/6 -translate-x-1/3 translate-y-1/3" />
          </div>

          <div className="relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center mx-auto mb-6 backdrop-blur-xl">
              <Mail size={28} className="text-white" />
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4" style={{ fontFamily: 'Space Grotesk' }}>
              Get in Touch
            </h2>
            <p className="text-blue-100/80 text-sm mb-8 max-w-lg mx-auto leading-relaxed">
              Technical questions, partnership inquiries, or enterprise integration support — our engineering team responds within 12 hours.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.a
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                href="mailto:thakurshaktisingh195@gmail.com"
                className="flex items-center gap-3 px-8 py-4 bg-white text-blue-700 font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all text-sm"
              >
                <Mail size={18} /> Send Direct Mail
              </motion.a>
              <div className="text-center sm:text-left">
                <div className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">Response SLA</div>
                <div className="text-white font-bold text-sm">Under 12 Hours</div>
              </div>
            </div>
          </div>
        </motion.section>

        <p className="text-center text-[11px] text-slate-400 dark:text-slate-700 pb-8 font-medium uppercase tracking-widest">
          SenseChain Neural Infrastructure Division · 2026 · All Rights Reserved
        </p>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════
// ILLUSTRATION SVG COMPONENTS
// ═══════════════════════════════════════════════════

const BlockchainIllustration = ({ isDark }) => (
  <div className="flex items-center gap-3 scale-75 md:scale-100">
    {[0, 1, 2, 3, 4].map((i) => (
      <React.Fragment key={i}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.12, duration: 0.5 }}
          className={`relative rounded-2xl w-32 h-24 flex flex-col items-center justify-center gap-1.5 border shadow-xl ${
            isDark
              ? 'bg-gradient-to-br from-blue-950/80 to-slate-900 border-blue-500/20'
              : 'bg-gradient-to-br from-white to-blue-50 border-blue-100 shadow-blue-50'
          }`}
        >
          <div className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>BLOCK #{i}</div>
          <div className={`text-[9px] font-mono truncate w-20 text-center ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
            {`0x${Math.random().toString(16).slice(2, 8).toUpperCase()}`}
          </div>
          <div className={`w-2 h-2 rounded-full ${i === 4 ? 'bg-blue-500 animate-pulse' : 'bg-emerald-500'}`} />
        </motion.div>
        {i < 4 && (
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: i * 0.12 + 0.4, duration: 0.3 }}
            className={`h-0.5 w-6 ${isDark ? 'bg-blue-500/40' : 'bg-blue-200'}`}
          />
        )}
      </React.Fragment>
    ))}
  </div>
);

const BlockchainSVG = () => (
  <svg width="200" height="120" viewBox="0 0 200 120" className="mx-auto opacity-80">
    <defs>
      <linearGradient id="bg1" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#2563eb" stopOpacity="0.15" />
        <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.05" />
      </linearGradient>
    </defs>
    <rect x="10" y="30" width="60" height="60" rx="12" fill="url(#bg1)" stroke="#3b82f6" strokeWidth="1.5" strokeOpacity="0.4" />
    <rect x="70" y="30" width="60" height="60" rx="12" fill="url(#bg1)" stroke="#6366f1" strokeWidth="1.5" strokeOpacity="0.4" />
    <rect x="130" y="30" width="60" height="60" rx="12" fill="url(#bg1)" stroke="#7c3aed" strokeWidth="1.5" strokeOpacity="0.4" />
    <line x1="70" y1="60" x2="70" y2="60" stroke="#3b82f6" strokeWidth="2" strokeOpacity="0.4" />
    <line x1="130" y1="60" x2="130" y2="60" stroke="#6366f1" strokeWidth="2" strokeOpacity="0.4" />
    <text x="40" y="55" textAnchor="middle" fontSize="8" fill="#3b82f6" opacity="0.7" fontFamily="monospace">#001</text>
    <text x="100" y="55" textAnchor="middle" fontSize="8" fill="#6366f1" opacity="0.7" fontFamily="monospace">#002</text>
    <text x="160" y="55" textAnchor="middle" fontSize="8" fill="#7c3aed" opacity="0.7" fontFamily="monospace">#003</text>
    <text x="40" y="70" textAnchor="middle" fontSize="6" fill="#94a3b8" fontFamily="monospace">SHA256</text>
    <text x="100" y="70" textAnchor="middle" fontSize="6" fill="#94a3b8" fontFamily="monospace">SHA256</text>
    <text x="160" y="70" textAnchor="middle" fontSize="6" fill="#94a3b8" fontFamily="monospace">SHA256</text>
    <path d="M 70 60 L 70 60" stroke="#3b82f6" strokeWidth="1.5" strokeOpacity="0.5" markerEnd="url(#arrow)" />
  </svg>
);

const ShieldSVG = () => (
  <svg width="200" height="120" viewBox="0 0 200 120" className="mx-auto opacity-80">
    <defs>
      <linearGradient id="shieldGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.2" />
        <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.05" />
      </linearGradient>
    </defs>
    <path d="M 100 15 L 155 35 L 155 75 Q 155 95 100 110 Q 45 95 45 75 L 45 35 Z" fill="url(#shieldGrad)" stroke="#7c3aed" strokeWidth="1.5" strokeOpacity="0.5" />
    <circle cx="100" cy="62" r="20" fill="none" stroke="#7c3aed" strokeWidth="1.5" strokeOpacity="0.7" />
    <path d="M 89 62 L 97 70 L 111 54" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    {[0, 1, 2, 3].map(i => (
      <circle key={i} cx={60 + i * 30} cy={22} r="3" fill="none" stroke="#7c3aed" strokeWidth="1" strokeOpacity="0.4" />
    ))}
  </svg>
);

const NetworkSVG = () => (
  <svg width="200" height="120" viewBox="0 0 200 120" className="mx-auto opacity-80">
    <circle cx="100" cy="60" r="10" fill="#10b981" fillOpacity="0.2" stroke="#10b981" strokeWidth="1.5" />
    {[0, 1, 2, 3, 4].map(i => {
      const angle = (i * 360) / 5;
      const x = 100 + 45 * Math.cos((angle - 90) * Math.PI / 180);
      const y = 60 + 42 * Math.sin((angle - 90) * Math.PI / 180);
      return (
        <g key={i}>
          <line x1="100" y1="60" x2={x} y2={y} stroke="#10b981" strokeWidth="1" strokeOpacity="0.25" strokeDasharray="3 3" />
          <circle cx={x} cy={y} r="7" fill="#10b981" fillOpacity="0.1" stroke="#10b981" strokeWidth="1.5" strokeOpacity="0.5" />
          <text x={x} y={y + 3} textAnchor="middle" fontSize="5" fill="#10b981" opacity="0.8">N{i + 1}</text>
        </g>
      );
    })}
    <circle cx="100" cy="60" r="5" fill="#10b981" />
  </svg>
);

const UplinkSVG = ({ isDark }) => (
  <svg width="320" height="280" viewBox="0 0 320 280" className="pointer-events-none">
    <defs>
      <radialGradient id="uplinkGrad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
      </radialGradient>
    </defs>
    <circle cx="200" cy="140" r="120" fill="url(#uplinkGrad)" />
    <circle cx="200" cy="140" r="80" fill="none" stroke="#3b82f6" strokeWidth="0.8" strokeOpacity="0.2" strokeDasharray="4 4" />
    <circle cx="200" cy="140" r="110" fill="none" stroke="#7c3aed" strokeWidth="0.5" strokeOpacity="0.15" strokeDasharray="6 6" />
    {[0, 1, 2, 3, 4, 5].map(i => {
      const angle = (i * 60 - 30) * Math.PI / 180;
      const x = 200 + 80 * Math.cos(angle);
      const y = 140 + 80 * Math.sin(angle);
      return (
        <g key={i}>
          <line x1="200" y1="140" x2={x} y2={y} stroke="#3b82f6" strokeOpacity="0.15" strokeWidth="1" />
          <circle cx={x} cy={y} r="8" fill="#3b82f6" fillOpacity="0.12" stroke="#3b82f6" strokeOpacity="0.3" strokeWidth="1" />
        </g>
      );
    })}
    <circle cx="200" cy="140" r="15" fill="#3b82f6" fillOpacity="0.2" />
  </svg>
);

// ─── UTILITY COMPONENTS ───

const SectionLabel = ({ label }) => (
  <div className="flex items-center gap-2 mb-3">
    <div className="w-5 h-0.5 bg-blue-600" />
    <span className="text-[11px] font-bold text-blue-600 dark:text-blue-500 uppercase tracking-widest">{label}</span>
  </div>
);

const PillarCard = ({ isDark, illustration, icon, color, title, desc, stat, statLabel }) => {
  const colors = {
    blue: { bg: 'bg-blue-100 dark:bg-blue-500/12', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-500/20', stat: 'text-blue-600 dark:text-blue-400' },
    violet: { bg: 'bg-violet-100 dark:bg-violet-500/12', text: 'text-violet-600 dark:text-violet-400', border: 'border-violet-200 dark:border-violet-500/20', stat: 'text-violet-600 dark:text-violet-400' },
    emerald: { bg: 'bg-emerald-100 dark:bg-emerald-500/12', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-500/20', stat: 'text-emerald-600 dark:text-emerald-400' },
  };
  const c = colors[color];
  return (
    <motion.div
      whileHover={{ y: -6 }}
      className={`rounded-[24px] overflow-hidden border transition-all ${isDark ? 'bg-white/3 border-white/6 hover:border-white/12' : 'bg-white border-slate-100 shadow-sm hover:shadow-md'}`}
    >
      <div className={`p-5 flex justify-center ${isDark ? 'bg-white/3' : 'bg-slate-50/70'}`}>
        {illustration}
      </div>
      <div className="p-6">
        <div className={`inline-flex p-2 rounded-xl ${c.bg} ${c.text} mb-4 border ${c.border}`}>{icon}</div>
        <h3 className={`font-bold text-base mb-2 ${isDark ? 'text-white' : 'text-slate-800'}`} style={{ fontFamily: 'Space Grotesk' }}>{title}</h3>
        <p className={`text-xs leading-relaxed mb-5 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{desc}</p>
        <div className={`flex items-center gap-2 ${c.border} border-t pt-4`}>
          <span className={`text-2xl font-bold ${c.stat}`} style={{ fontFamily: 'Space Grotesk' }}>{stat}</span>
          <span className={`text-[10px] font-medium uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{statLabel}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default About;