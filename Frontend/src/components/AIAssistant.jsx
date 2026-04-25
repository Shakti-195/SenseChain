import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send, Bot, User, X, ChevronDown, MessageSquare, Mic,
  Settings, Headset, History, PlusCircle, Maximize2, Radio, Zap,
  AudioLines, Trash2, Volume2, VolumeX, Sparkles, Globe, Search,
  Shield, Activity, BarChart2, Cpu, Link, HelpCircle, Database,
  Terminal, Hammer, RefreshCw, AlertTriangle, CheckCircle2, XCircle,
  Pickaxe, StopCircle, SlidersHorizontal, Eye,
} from 'lucide-react';
import API from '../services/api';

// ── Rotating placeholder text ──
const PLACEHOLDERS = [
  'Ask about your blockchain integrity...',
  'Mine a block — just say "mine a block"',
  'Is my IoT node secure right now?',
  'Repair the chain — say "repair chain"',
  'Show me a security analysis...',
  'Set difficulty to 3 — say "set difficulty 3"',
];

// ── Quick-prompt chips shown on empty chat ──
const QUICK_PROMPTS = [
  { icon: Shield,     label: 'Chain Integrity',    text: 'Check the blockchain integrity and tell me if there are any breaches.',  google: false },
  { icon: Activity,   label: 'Live Status',         text: 'Get a full system snapshot',                                             google: false },
  { icon: Cpu,        label: 'Node Health',         text: 'Analyze the health of all connected IoT nodes.',                        google: false },
  { icon: Pickaxe,    label: 'Mine a Block',        text: 'mine a block',                                                           google: false },
  { icon: RefreshCw,  label: 'Repair Chain',        text: 'repair chain',                                                           google: false },
  { icon: BarChart2,  label: 'Analytics Summary',   text: 'Give me a summary of the latest analytics data.',                       google: false },
  { icon: HelpCircle, label: 'Getting Started',     text: 'How do I get started with SenseChain as a new user?',                   google: false },
  { icon: Globe,      label: 'Search: IoT Security',text: 'IoT security best practices 2025',                                       google: true  },
];

// ── COMMAND REGISTRY ──
// Maps natural language intent to a backend action
const COMMAND_REGISTRY = [
  {
    patterns: [/mine a? ?block/i, /add a? ?block/i, /create a? ?block/i, /start (a )?node/i, /simulate node/i],
    action: 'mine_block',
    icon: Pickaxe,
    color: 'violet',
    buildPayload: (input) => {
      const nodeMatch = input.match(/node[\s-]*(\S+)/i);
      return { node_id: nodeMatch ? nodeMatch[1].toUpperCase() : 'SENSE-AI-NODE' };
    },
  },
  {
    patterns: [/repair (the )?chain/i, /fix (the )?chain/i, /restore integrity/i, /heal (the )?chain/i],
    action: 'repair_chain',
    icon: RefreshCw,
    color: 'emerald',
    buildPayload: () => ({}),
  },
  {
    patterns: [/check (integrity|security|chain)/i, /validate (chain|integrity)/i, /is (the )?chain (secure|safe|ok)/i],
    action: 'get_snapshot',
    icon: Shield,
    color: 'blue',
    buildPayload: () => ({}),
  },
  {
    patterns: [/(get|show|fetch) (a )?snapshot/i, /system (status|data|snapshot)/i, /what is the (current )?(live )?status/i, /full system/i],
    action: 'get_snapshot',
    icon: Eye,
    color: 'blue',
    buildPayload: () => ({}),
  },
  {
    patterns: [/set difficulty (to )?([1-5])/i, /change difficulty (to )?([1-5])/i, /difficulty ([1-5])/i],
    action: 'set_difficulty',
    icon: SlidersHorizontal,
    color: 'amber',
    buildPayload: (input) => {
      const m = input.match(/([1-5])/);
      return { level: m ? parseInt(m[1]) : 3 };
    },
  },
  {
    patterns: [/tamper block #?(\d+)/i, /corrupt block #?(\d+)/i, /breach block #?(\d+)/i],
    action: 'tamper_block',
    icon: AlertTriangle,
    color: 'red',
    buildPayload: (input) => {
      const m = input.match(/(\d+)/);
      return { index: m ? parseInt(m[1]) : 1, temperature: 999.9 };
    },
  },
  {
    patterns: [/stop node (\S+)/i, /kill node (\S+)/i, /remove node (\S+)/i, /disconnect node (\S+)/i],
    action: 'stop_node',
    icon: StopCircle,
    color: 'rose',
    buildPayload: (input) => {
      const m = input.match(/node[\s-]*(\S+)/i);
      return { node_id: m ? m[1].toUpperCase() : '' };
    },
  },
  {
    patterns: [/reset (the )?(ledger|chain|blockchain)/i, /clear (the )?(ledger|chain|all blocks)/i, /wipe (the )?ledger/i],
    action: 'reset_ledger',
    icon: Trash2,
    color: 'red',
    buildPayload: () => ({}),
  },
  {
    patterns: [/list (active )?nodes/i, /show (all )?nodes/i, /which nodes/i, /what nodes/i, /how many nodes/i],
    action: 'get_snapshot',
    icon: Cpu,
    color: 'blue',
    buildPayload: () => ({}),
  },
];

// ── Execute an AI command against the backend ──
const executeAICommand = async (action, payload) => {
  const res = await fetch('/ai_execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, payload }),
  });
  return res.json();
};

// ── Format action result as a rich text reply ──
const formatActionResult = (result) => {
  const status = result.status === 'success' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
  const lines = [`${status} ${result.message}`];
  if (result.data && Object.keys(result.data).length) {
    lines.push('');
    lines.push('SYSTEM DATA:');
    for (const [k, v] of Object.entries(result.data)) {
      if (v === null || v === undefined) continue;
      const label = k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      lines.push(`  ${label}: ${Array.isArray(v) ? (v.length ? v.join(', ') : 'None') : v}`);
    }
  }
  return lines.join('\n');
};

const API_BASE = import.meta.env.VITE_API_BASE_URL || window.location.origin;

const VOICE_STATE = {
  IDLE: 'idle',
  LISTENING: 'listening',
  PROCESSING: 'processing',
  SPEAKING: 'speaking',
};

const AIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [input, setInput] = useState('');
  const [sessions, setSessions] = useState([{
    id: '1',
    title: 'Neural Session',
    messages: [{ role: 'assistant', text: 'Neural Link Established. I am Sense Brain — your AI security companion for SenseChain. Ask me anything about your blockchain, security status, or IoT nodes!', id: 'init' }]
  }]);
  const [activeSessionId, setActiveSessionId] = useState('1');
  const [isThinking, setIsThinking] = useState(false);
  const [isVoiceWriting, setIsVoiceWriting] = useState(false);
  const [isGoogleSearching, setIsGoogleSearching] = useState(false);
  // Google Search Mode
  const [googleMode, setGoogleMode] = useState(() => localStorage.getItem('sc-google-mode') === 'true');
  // System Access Mode — fetches live system data before every AI query
  const [systemAccess, setSystemAccess] = useState(() => localStorage.getItem('sc-system-access') === 'true');
  const [systemSnapshot, setSystemSnapshot] = useState(null);
  const [snapLoading, setSnapLoading] = useState(false);
  const systemAccessRef = useRef(localStorage.getItem('sc-system-access') === 'true');

  // Voice state
  const [selectedVoiceName, setSelectedVoiceName] = useState('');
  const [availableVoices, setAvailableVoices] = useState([]);
  const [voiceSpeed, setVoiceSpeed] = useState(1.0);
  const [voicePitch, setVoicePitch] = useState(1.1);
  const [voiceVolume, setVoiceVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [voiceState, setVoiceState] = useState(VOICE_STATE.IDLE);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [isLiveMode, setIsLiveMode] = useState(false);

  // ── THEME: Read from global dark class, not internal state ──
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Refs to prevent stale closures
  const voiceStateRef = useRef(VOICE_STATE.IDLE);
  const isLiveModeRef = useRef(false);
  const isMutedRef = useRef(false);
  const selectedVoiceRef = useRef('');
  const voiceSpeedRef = useRef(1.0);
  const voicePitchRef = useRef(1.1);
  const voiceVolumeRef = useRef(1.0);
  const activeSessionIdRef = useRef('1');
  const googleModeRef = useRef(localStorage.getItem('sc-google-mode') === 'true');
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const chatEndRef = useRef(null);
  const abortControllerRef = useRef(null);
  const lastRequestTimeRef = useRef(0);
  const silenceTimerRef = useRef(null);

  const setVoiceStateSync = (s) => { voiceStateRef.current = s; setVoiceState(s); };
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);
  useEffect(() => { selectedVoiceRef.current = selectedVoiceName; }, [selectedVoiceName]);
  useEffect(() => { voiceSpeedRef.current = voiceSpeed; }, [voiceSpeed]);
  useEffect(() => { voicePitchRef.current = voicePitch; }, [voicePitch]);
  useEffect(() => { voiceVolumeRef.current = voiceVolume; }, [voiceVolume]);
  useEffect(() => { activeSessionIdRef.current = activeSessionId; }, [activeSessionId]);
  useEffect(() => { isLiveModeRef.current = isLiveMode; }, [isLiveMode]);
  useEffect(() => { googleModeRef.current = googleMode; }, [googleMode]);
  useEffect(() => { systemAccessRef.current = systemAccess; }, [systemAccess]);

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];

  // Load voices
  useEffect(() => {
    const load = () => {
      const all = synthRef.current.getVoices().filter(v => v.lang.startsWith('en'));
      setAvailableVoices(all);
      if (!selectedVoiceRef.current && all.length > 0) {
        const best = all.find(v => v.name.includes('Google') && v.lang === 'en-US') || all[0];
        setSelectedVoiceName(best.name);
      }
    };
    load();
    synthRef.current.onvoiceschanged = load;
    return () => { synthRef.current.onvoiceschanged = null; };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessions, isThinking]);

  useEffect(() => {
    return () => {
      synthRef.current.cancel();
      killRecognition();
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  const killRecognition = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch { /* ignore */ }
      recognitionRef.current = null;
    }
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
  };

  const startListening = useCallback(() => {
    if (!isLiveModeRef.current) return;
    if (voiceStateRef.current === VOICE_STATE.PROCESSING || voiceStateRef.current === VOICE_STATE.SPEAKING) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    killRecognition();
    setVoiceStateSync(VOICE_STATE.LISTENING);
    setLiveTranscript('Listening... speak now 🎙️');

    const rec = new SR();
    recognitionRef.current = rec;
    rec.lang = 'en-US';
    rec.continuous = true;
    rec.interimResults = true;
    let finalTranscript = '';

    rec.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalTranscript += t + ' ';
        else interim += t;
      }
      setLiveTranscript('🎙️ ' + (finalTranscript + interim).trim());
      if (finalTranscript.trim()) {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          if (voiceStateRef.current === VOICE_STATE.LISTENING) {
            setVoiceStateSync(VOICE_STATE.PROCESSING);
            sendVoiceMessage(finalTranscript.trim());
          }
        }, 1500);
      }
    };

    rec.onend = () => {
      if (isLiveModeRef.current && voiceStateRef.current === VOICE_STATE.LISTENING) {
        try { rec.start(); } catch { /* ignore */ }
      }
    };
    try { rec.start(); } catch { /* ignore */ }
  }, []); // eslint-disable-line

  const speakReply = useCallback((text) => {
    if (!isLiveModeRef.current) return;
    synthRef.current.cancel();
    setVoiceStateSync(VOICE_STATE.SPEAKING);
    setLiveTranscript(text.length > 120 ? text.slice(0, 117) + '...' : text);

    if (isMutedRef.current) { setTimeout(() => returnToListening(), 1000); return; }

    const voices = synthRef.current.getVoices();
    const voice = voices.find(v => v.name === selectedVoiceRef.current) || voices[0];
    const chunks = text.match(/[^.!?]+[.!?]*/g) || [text];

    const speakChunk = (idx) => {
      if (!isLiveModeRef.current || idx >= chunks.length) { returnToListening(); return; }
      const utt = new SpeechSynthesisUtterance(chunks[idx]);
      utt.voice = voice;
      utt.rate = voiceSpeedRef.current;
      utt.pitch = voicePitchRef.current;
      utt.volume = voiceVolumeRef.current;
      utt.onend = () => speakChunk(idx + 1);
      utt.onerror = () => returnToListening();
      synthRef.current.speak(utt);
    };
    speakChunk(0);
  }, []); // eslint-disable-line

  const returnToListening = () => {
    if (isLiveModeRef.current) {
      setVoiceStateSync(VOICE_STATE.IDLE);
      setLiveTranscript('');
      setTimeout(() => startListening(), 500);
    }
  };

  const sendVoiceMessage = async (text) => {
    const sid = activeSessionIdRef.current;
    killRecognition();
    setSessions(prev => prev.map(s => s.id === sid
      ? { ...s, messages: [...s.messages, { role: 'user', text, id: Date.now() }] } : s));
    try {
      // Use ref to get live googleMode value (avoids stale closure inside useCallback)
      const useGoogle = googleModeRef.current;
      const res = await API.post('/ask_assistant', { question: text, deep_search: useGoogle });
      const reply = res.data?.reply || 'No response from Sense Brain.';
      setSessions(prev => prev.map(s => s.id === sid
        ? { ...s, messages: [...s.messages, { role: 'assistant', text: reply, id: Date.now() + 1 }] } : s));
      speakReply(reply);
    } catch {
      returnToListening();
    }
  };

  const toggleLiveMode = () => {
    const next = !isLiveMode;
    isLiveModeRef.current = next;
    setIsLiveMode(next);
    if (next) {
      const unlock = new SpeechSynthesisUtterance('');
      unlock.volume = 0;
      unlock.onend = () => startListening();
      synthRef.current.speak(unlock);
    } else {
      synthRef.current.cancel();
      killRecognition();
      setVoiceStateSync(VOICE_STATE.IDLE);
    }
  };

  // ── FETCH LIVE SYSTEM SNAPSHOT ──
  const fetchSystemContext = useCallback(async () => {
    if (!systemAccessRef.current) return '';
    try {
      const res = await fetch('/system_snapshot');
      if (!res.ok) return '';
      const d = await res.json();
      setSystemSnapshot(d);
      return (
        `Platform: ${d.platform}\n` +
        `Timestamp: ${d.timestamp_utc}\n` +
        `Chain Length: ${d.chain_length} blocks\n` +
        `Integrity: ${d.integrity}\n` +
        `PoW Difficulty: ${d.difficulty}\n` +
        `Active Nodes: ${d.active_nodes}\n` +
        (d.nodes.length ? `Nodes: ${d.nodes.map(n => `${n.id} [${n.status}]`).join(', ')}\n` : '') +
        (d.avg_temperature_c !== null ? `Avg Temperature: ${d.avg_temperature_c}°C\n` : '') +
        (d.avg_humidity_pct  !== null ? `Avg Humidity: ${d.avg_humidity_pct}%\n`    : '') +
        `Recent Blocks Analysed: ${d.recent_blocks_count}\n` +
        `Last 5 Blocks:\n` +
        d.last_5_blocks.map(b =>
          `  Block #${b.index}: temp=${b.temperature}°C, hum=${b.humidity}%, device=${b.device_id}, hash=${b.hash}`
        ).join('\n')
      );
    } catch {
      return '';
    }
  }, []);

  // Auto-fetch snapshot when System Access is toggled ON
  useEffect(() => {
    if (systemAccess) {
      setSnapLoading(true);
      fetchSystemContext().finally(() => setSnapLoading(false));
    } else {
      setSystemSnapshot(null);
    }
  }, [systemAccess, fetchSystemContext]);

  const handleSend = async () => {
    const trimmed = input.trim();
    const now = Date.now();
    if (!trimmed || isThinking || (now - lastRequestTimeRef.current < 800)) return;
    lastRequestTimeRef.current = now;
    const sid = activeSessionId;

    // Add user message
    setSessions(prev => prev.map(s => s.id === sid
      ? { ...s, messages: [...s.messages, { role: 'user', text: trimmed, id: now }] } : s));
    setInput('');
    setIsThinking(true);

    // ── COMMAND DETECTION: try to match a system action first ──
    const matched = COMMAND_REGISTRY.find(cmd => cmd.patterns.some(p => p.test(trimmed)));
    if (matched) {
      try {
        const payload  = matched.buildPayload(trimmed);
        const result   = await executeAICommand(matched.action, payload);
        const reply    = formatActionResult(result);
        setSessions(prev => prev.map(s => s.id === sid
          ? { ...s, messages: [...s.messages, {
              role: 'assistant', text: reply, id: Date.now() + 1,
              isAction: true, actionStatus: result.status, actionIcon: matched.action,
            }] } : s));
      } catch {
        setSessions(prev => prev.map(s => s.id === sid
          ? { ...s, messages: [...s.messages, {
              role: 'assistant', text: 'Failed to execute command. Make sure the backend is running.',
              id: Date.now() + 1,
            }] } : s));
      }
      setIsThinking(false);
      return;
    }

    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    // Fetch live system context if System Access is ON
    const sysCtx = await fetchSystemContext();

    try {
      const res = await API.post('/ask_assistant',
        { question: trimmed, deep_search: googleMode, system_context: sysCtx },
        { signal: abortControllerRef.current.signal }
      );
      const reply = res.data?.reply || 'No response.';
      if (activeSessionIdRef.current !== sid) return;
      setSessions(prev => prev.map(s => s.id === sid
        ? { ...s, messages: [...s.messages, { role: 'assistant', text: reply, id: Date.now() + 1 }] } : s));
    } catch (err) {
      if (err.name !== 'AbortError') {
        setSessions(prev => prev.map(s => s.id === sid
          ? { ...s, messages: [...s.messages, { role: 'assistant', text: 'Connection error. Please try again.', id: Date.now() }] } : s));
      }
    } finally {
      setIsThinking(false);
    }
  };

  const startVoiceInput = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR || isVoiceWriting) return;
    const rec = new SR();
    rec.onstart = () => setIsVoiceWriting(true);
    rec.onresult = (e) => setInput(e.results[0][0].transcript);
    rec.onend = () => setIsVoiceWriting(false);
    rec.start();
  };

  // ── GOOGLE SEARCH BUTTON handler ─────────────────────────────────────────
  const handleGoogleSearch = async () => {
    const trimmed = input.trim();
    const now = Date.now();
    if (!trimmed || isThinking || isGoogleSearching || (now - lastRequestTimeRef.current < 800)) return;
    lastRequestTimeRef.current = now;
    const sid = activeSessionId;

    setSessions(prev => prev.map(s => s.id === sid
      ? { ...s, messages: [...s.messages, { role: 'user', text: trimmed, id: now }] } : s));
    setInput('');
    setIsGoogleSearching(true);

    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();
    const sysCtx = await fetchSystemContext();
    try {
      const res = await API.post('/ask_assistant',
        { question: trimmed, deep_search: true, system_context: sysCtx },
        { signal: abortControllerRef.current.signal }
      );
      const reply = res.data?.reply || 'No Google results found.';
      if (activeSessionIdRef.current !== sid) return;
      setSessions(prev => prev.map(s => s.id === sid
        ? { ...s, messages: [...s.messages, { role: 'assistant', text: reply, id: Date.now() + 1 }] } : s));
    } catch (err) {
      if (err.name !== 'AbortError') {
        setSessions(prev => prev.map(s => s.id === sid
          ? { ...s, messages: [...s.messages, { role: 'assistant', text: 'Google search failed. Please try again.', id: Date.now() }] } : s));
      }
    } finally {
      setIsGoogleSearching(false);
    }
  };

  const deleteMessage = (msgId) =>
    setSessions(prev => prev.map(s => s.id === activeSessionId
      ? { ...s, messages: s.messages.filter(m => m.id !== msgId) } : s));

  const clearChat = () =>
    setSessions(prev => prev.map(s => s.id === activeSessionId
      ? { ...s, messages: [] } : s));

  const deleteSession = (sid) =>
    setSessions(prev => {
      const rest = prev.filter(s => s.id !== sid);
      if (!rest.length) {
        const f = { id: Date.now().toString(), title: 'Neural Session', messages: [] };
        setActiveSessionId(f.id);
        return [f];
      }
      if (activeSessionId === sid) setActiveSessionId(rest[0].id);
      return rest;
    });

  const newSession = () => {
    const s = { id: Date.now().toString(), title: `Session ${sessions.length + 1}`, messages: [] };
    setSessions(prev => [s, ...prev]);
    setActiveSessionId(s.id);
  };

  const voiceLabel = {
    [VOICE_STATE.IDLE]: 'Ready...',
    [VOICE_STATE.LISTENING]: 'Listening 🎙️',
    [VOICE_STATE.PROCESSING]: 'Processing...',
    [VOICE_STATE.SPEAKING]: 'Speaking...',
  };

  const voiceColor = {
    [VOICE_STATE.IDLE]: isDark ? 'bg-slate-600' : 'bg-slate-300',
    [VOICE_STATE.LISTENING]: 'bg-blue-500',
    [VOICE_STATE.PROCESSING]: 'bg-amber-500',
    [VOICE_STATE.SPEAKING]: 'bg-emerald-500',
  };

  // ── THEME-AWARE STYLE TOKENS ──
  const bg = isDark ? 'bg-[#0a0a0a]' : 'bg-white';
  const border = isDark ? 'border-white/8' : 'border-slate-200';
  const subBg = isDark ? 'bg-white/4' : 'bg-slate-50';
  const text = isDark ? 'text-white' : 'text-slate-800';
  const subText = isDark ? 'text-slate-400' : 'text-slate-500';
  const inputBg = isDark ? 'bg-white/6 text-white placeholder:text-slate-500' : 'bg-slate-100 text-slate-900 placeholder:text-slate-400';
  const sectionBorder = isDark ? 'border-white/6' : 'border-slate-100';

  return (
    <>
      {/* ── FLOATING BUTTON ── */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-[1000] flex items-center gap-2.5 px-5 py-2.5 rounded-full shadow-2xl hover:scale-105 transition-all duration-300 border"
          style={{
            background: isDark
              ? 'linear-gradient(135deg, #1a1a1a, #0a0a0a)'
              : 'linear-gradient(135deg, #ffffff, #f5f5f5)',
            borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)',
            boxShadow: '0 20px 60px rgba(220, 38, 38, 0.20)',
          }}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-600 to-rose-800 flex items-center justify-center shadow-lg shadow-red-600/30">
            <Bot size={16} className="text-white" />
          </div>
          <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-stone-900'}`}>Sense Brain</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-600 text-white font-bold uppercase tracking-wide">AI</span>
        </button>
      )}

      {/* ── MAIN PANEL ── */}
      {isOpen && (
        <div
          className={`fixed z-[1001] flex flex-row transition-all duration-300 border overflow-hidden shadow-2xl ${
            isMaximized
              ? 'inset-0 rounded-none'
              : 'bottom-0 right-0 w-full md:w-[480px] h-[100dvh] md:h-[calc(100dvh-72px)] md:max-h-[700px] md:bottom-5 md:right-5 md:rounded-[28px]'
          } ${bg} ${border}`}
        >
          {/* ── HISTORY SIDEBAR ── */}
          {isHistoryOpen && (
            <div className={`w-56 shrink-0 border-r flex flex-col ${isDark ? 'bg-black/60 border-white/6' : 'bg-slate-50 border-slate-200'}`}>
              <div className={`p-3 border-b ${sectionBorder}`}>
                <button
                  onClick={newSession}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all"
                >
                  <PlusCircle size={13} /> New Chat
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-0.5 custom-scrollbar">
                {sessions.map(s => (
                  <div
                    key={s.id}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium cursor-pointer group transition-all ${
                      activeSessionId === s.id
                        ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                        : `${subText} hover:${subBg}`
                    }`}
                  >
                    <MessageSquare size={11} className="shrink-0" />
                    <span className="flex-1 truncate" onClick={() => setActiveSessionId(s.id)}>{s.title}</span>
                    <button onClick={() => deleteSession(s.id)} className="opacity-0 group-hover:opacity-100 hover:text-rose-500 transition-all">
                      <Trash2 size={10} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── MAIN AREA ── */}
          <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">

            {/* Header */}
            <div className={`flex items-center justify-between px-4 py-3 border-b shrink-0 ${sectionBorder}`}>
              <div className="flex items-center gap-3">
                <button onClick={() => setIsHistoryOpen(!isHistoryOpen)} className={`p-2 rounded-xl transition-all ${subText} hover:${subBg}`}>
                  <History size={16} />
                </button>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-600 to-rose-800 flex items-center justify-center shadow-md shadow-red-600/25">
                    <Bot size={15} className="text-white" />
                  </div>
                  <div>
                    <div className={`font-bold text-sm flex items-center gap-1.5 ${text}`}>
                      Sense Brain
                      <span className="text-[9px] bg-red-600 text-white px-1.5 py-0.5 rounded-full font-black">PRO</span>
                    </div>
                    <div className={`text-[9px] font-medium ${subText} uppercase tracking-widest`}>By SenseChain</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/* System Access Toggle */}
                <button
                  onClick={() => {
                    const next = !systemAccess;
                    setSystemAccess(next);
                    systemAccessRef.current = next;
                    localStorage.setItem('sc-system-access', String(next));
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-all text-[10px] font-bold border ${
                    systemAccess
                      ? isDark
                        ? 'bg-violet-500/20 border-violet-500/40 text-violet-300'
                        : 'bg-violet-100 border-violet-300 text-violet-700'
                      : `${subText} border-transparent hover:${subBg}`
                  }`}
                  title={systemAccess ? 'System Access ON — AI reads live data' : 'System Access OFF — click to enable'}
                >
                  <Database size={12} className={systemAccess ? (isDark ? 'text-violet-400' : 'text-violet-600') : ''} />
                  <span className="hidden sm:block">SYS</span>
                </button>
                <button onClick={toggleLiveMode}
                  className={`p-2 rounded-xl transition-all ${isLiveMode ? 'bg-red-600 text-white' : `${subText} hover:bg-red-50 dark:hover:bg-red-500/10`}`}
                  title="Voice Mode"
                >
                  <Radio size={15} />
                </button>
                <button onClick={clearChat} className={`p-2 rounded-xl transition-all ${subText} hover:${subBg}`}><Trash2 size={14} /></button>
                <button onClick={() => setIsMaximized(!isMaximized)} className={`p-2 rounded-xl transition-all ${subText} hover:${subBg}`}><Maximize2 size={14} /></button>
                <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className={`p-2 rounded-xl transition-all ${isSettingsOpen ? 'bg-blue-600/10 text-blue-600' : `${subText} hover:${subBg}`}`}><Settings size={14} /></button>
                <button onClick={() => setIsOpen(false)} className={`p-2 rounded-xl transition-all ${subText} hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-500`}><ChevronDown size={18} /></button>
              </div>
            </div>

            {/* ── SYSTEM ACCESS BANNER ── */}
            {systemAccess && (
              <div className={`px-4 py-1.5 flex items-center gap-3 text-[10px] font-semibold border-b shrink-0 ${
                isDark
                  ? 'bg-violet-500/10 border-violet-500/15 text-violet-300'
                  : 'bg-violet-50 border-violet-200 text-violet-700'
              }`}>
                <Database size={10} className="shrink-0 animate-pulse" />
                {snapLoading ? (
                  <span>Syncing system data...</span>
                ) : systemSnapshot ? (
                  <span className="flex items-center gap-3 flex-wrap">
                    <span className={`font-black ${
                      systemSnapshot.integrity === 'SECURE' ? 'text-emerald-500' : 'text-red-500'
                    }`}>{systemSnapshot.integrity}</span>
                    <span>{systemSnapshot.chain_length} blocks</span>
                    <span>{systemSnapshot.active_nodes} node{systemSnapshot.active_nodes !== 1 ? 's' : ''}</span>
                    {systemSnapshot.avg_temperature_c !== null && <span>{systemSnapshot.avg_temperature_c}°C avg</span>}
                    <span className={isDark ? 'text-violet-400 opacity-60' : 'text-violet-500 opacity-70'}>System Access ON</span>
                  </span>
                ) : (
                  <span>System Access ON — live data injected on each query</span>
                )}
              </div>
            )}

            {/* ── LIVE VOICE UI ── */}
            {isLiveMode ? (
              <div className="flex-1 flex flex-col items-center justify-between p-6 overflow-hidden">
                <div className="flex-1 flex flex-col items-center justify-center gap-6">
                  {/* Orb */}
                  <div className="relative flex items-center justify-center">
                    <div className={`absolute w-44 h-44 rounded-full border-2 transition-all duration-500 ${voiceState === VOICE_STATE.LISTENING ? 'border-blue-500/30 animate-ping' : 'border-transparent'}`} />
                    <div className={`absolute w-36 h-36 rounded-full border transition-all duration-500 ${voiceState === VOICE_STATE.SPEAKING ? 'border-emerald-400/25 animate-pulse' : 'border-slate-200/10'}`} />
                    <div className={`w-28 h-28 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl ${
                      voiceState === VOICE_STATE.SPEAKING ? 'bg-emerald-500/20 shadow-emerald-500/20'
                      : voiceState === VOICE_STATE.LISTENING ? 'bg-blue-500/20 shadow-blue-500/20'
                      : voiceState === VOICE_STATE.PROCESSING ? 'bg-amber-500/15'
                      : isDark ? 'bg-white/6' : 'bg-slate-100'
                    }`}>
                      <Headset size={44} className={
                        voiceState === VOICE_STATE.LISTENING ? 'text-blue-500'
                        : voiceState === VOICE_STATE.SPEAKING ? 'text-emerald-500'
                        : voiceState === VOICE_STATE.PROCESSING ? 'text-amber-500'
                        : subText
                      } />
                    </div>
                  </div>

                  <div className="text-center space-y-3">
                    <h3 className={`text-lg font-bold ${text}`}>{voiceLabel[voiceState]}</h3>
                    <div className="flex gap-1.5 justify-center h-7 items-end">
                      {[1,2,3,4,5,6,7,8].map(i => (
                        <div
                          key={i}
                          className={`w-1 rounded-full transition-all duration-200 ${voiceColor[voiceState]}`}
                          style={{
                            height: voiceState === VOICE_STATE.SPEAKING ? `${Math.random() * 24 + 4}px`
                              : voiceState === VOICE_STATE.LISTENING ? `${6 + (i % 3) * 6}px`
                              : '3px',
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold border transition-all ${
                      isMuted
                        ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20'
                        : `${isDark ? 'bg-white/4 border-white/10' : 'bg-slate-100 border-slate-200'} ${subText}`
                    }`}
                  >
                    {isMuted ? <><VolumeX size={12} /> Muted</> : <><Volume2 size={12} /> Voice On</>}
                  </button>
                </div>

                {/* Transcript */}
                <div className={`w-full rounded-2xl p-4 text-sm text-center transition-all duration-300 ${subBg} ${liveTranscript ? 'opacity-100' : 'opacity-40'} ${text}`}>
                  {liveTranscript || (voiceState === VOICE_STATE.LISTENING ? 'Speak now...' : voiceState === VOICE_STATE.PROCESSING ? 'Thinking...' : 'Starting...')}
                </div>

                {/* Recent messages */}
                <div className={`w-full mt-3 rounded-xl overflow-hidden border ${sectionBorder}`}>
                  {activeSession.messages.slice(-2).map(msg => (
                    <div key={msg.id} className={`px-4 py-2 text-xs flex gap-2 items-start border-b last:border-0 ${sectionBorder}`}>
                      <span className={`font-bold uppercase text-[9px] tracking-widest mt-0.5 shrink-0 ${msg.role === 'assistant' ? 'text-blue-500' : 'text-violet-500'}`}>
                        {msg.role === 'assistant' ? 'AI' : 'YOU'}
                      </span>
                      <span className={`line-clamp-2 ${subText}`}>{msg.text}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={toggleLiveMode}
                  className="mt-4 px-8 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-full text-xs font-bold uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-rose-500/20"
                >
                  End Voice Session
                </button>
              </div>
            ) : (
              <>
                {/* ── CHAT MESSAGES ── */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  <div className={isMaximized ? 'max-w-3xl mx-auto' : ''}>
                    {activeSession.messages.every(m => m.id === 'init') && (
                      <div className="px-4 pt-3 pb-2">
                        {/* Quick-prompt chips */}
                        <p className={`text-[10px] font-bold uppercase tracking-widest mb-2.5 px-0.5 ${subText} opacity-50`}>Quick Actions</p>
                        <div className="grid grid-cols-2 gap-2">
                          {QUICK_PROMPTS.map(({ icon: Icon, label, text: promptText, google }) => (
                            <button
                              key={label}
                              onClick={() => setInput(promptText)}
                              className={`flex items-center gap-2 text-left px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] ${
                                google
                                  ? isDark
                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20'
                                    : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                                  : isDark
                                    ? 'bg-white/4 border-white/8 text-white/70 hover:bg-white/8 hover:border-white/16 hover:text-white'
                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900'
                              }`}
                            >
                              <Icon size={13} className="shrink-0" style={{ color: google ? '#10b981' : 'var(--th-primary, #dc2626)' }} />
                              <span className="truncate">{label}</span>
                              {google && <span className="ml-auto text-[8px] font-black uppercase tracking-widest opacity-60">Web</span>}
                            </button>
                          ))}
                        </div>
                        <p className={`text-center text-[9px] mt-3 ${subText} opacity-30 uppercase tracking-widest`}>or type your own below</p>
                      </div>
                    )}
                    {activeSession.messages.map(msg => (
                      <div key={msg.id} className={`px-4 py-4 group relative`}>
                        <div className="flex gap-3 items-start">
                          <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                            msg.role === 'assistant'
                              ? 'bg-gradient-to-br from-blue-600 to-violet-700'
                              : isDark ? 'bg-white/10' : 'bg-slate-200'
                          }`}>
                            {msg.role === 'assistant'
                              ? <Bot size={14} className="text-white" />
                              : <User size={14} className={isDark ? 'text-white' : 'text-slate-600'} />
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${subText} opacity-50`}>
                              {msg.role === 'assistant' ? 'Sense Brain' : 'You'}
                            </p>
                            <div className={`text-sm leading-relaxed font-medium whitespace-pre-wrap break-words ${text}`}>
                              {msg.text}
                            </div>
                          </div>
                          {msg.id !== 'init' && (
                            <button
                              onClick={() => deleteMessage(msg.id)}
                              className={`opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all shrink-0 ${subText}`}
                            >
                              <X size={11} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {isThinking && (
                    <div className="px-4 py-3 flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center">
                        <Bot size={14} className="text-white" />
                      </div>
                      <div className="flex gap-1">
                        {[0.1, 0.25, 0.4].map((d, i) => (
                          <div key={i} className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: `${d}s` }} />
                        ))}
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* ── INPUT ── */}
                <div className={`border-t shrink-0 ${sectionBorder}`}>
                  <div className={`p-4 ${isMaximized ? 'max-w-3xl mx-auto' : ''}`}>

                    {/* Input Box */}
                    <div className={`flex items-end gap-2 rounded-2xl border transition-all ${
                      isDark ? 'bg-white/4 border-white/8' : 'bg-slate-50 border-slate-200'
                    } px-3 py-3`}>
                      {/* Rotating textarea */}
                      <RotatingPlaceholderInput
                        value={input}
                        onChange={setInput}
                        onSend={handleSend}
                        googleMode={googleMode}
                        isDark={isDark}
                        text={text}
                        subText={subText}
                      />
                      {/* Buttons */}
                      <div className="flex gap-1.5 items-center shrink-0 pb-0.5">
                        {/* Mic */}
                        <button
                          onClick={startVoiceInput}
                          className={`p-2 rounded-xl transition-all ${isVoiceWriting ? 'bg-red-600 text-white' : `${subText} hover:${subBg}`}`}
                          title="Voice input"
                        >
                          <Mic size={15} />
                        </button>
                        {/* Globe — always visible for one-shot Google search */}
                        <button
                          onClick={handleGoogleSearch}
                          disabled={!input.trim() || isThinking || isGoogleSearching}
                          className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl transition-all active:scale-95 disabled:opacity-30 text-xs font-semibold ${
                            isGoogleSearching
                              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30 animate-pulse'
                              : isDark
                                ? 'bg-white/8 text-emerald-400 hover:bg-emerald-500/20'
                                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                          }`}
                          title={input.trim() ? `Search Google for: "${input.trim()}"` : 'Search Google'}
                        >
                          <Globe size={14} />
                          {input.trim()
                            ? <span className="max-w-[70px] truncate hidden sm:block text-[10px]">Search: {input.trim().slice(0,18)}{input.trim().length>18?'…':''}</span>
                            : <span className="hidden sm:block text-[10px]">Web</span>
                          }
                        </button>
                        {/* Send to Sense Brain */}
                        <button
                          onClick={handleSend}
                          disabled={!input.trim() || isThinking || isGoogleSearching}
                          className="p-2 rounded-xl text-white shadow-md transition-all active:scale-95 disabled:opacity-30 bg-gradient-to-br from-red-600 to-rose-700 shadow-red-600/20 hover:shadow-red-600/40"
                          title="Send to Sense Brain"
                        >
                          <Send size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Hint row */}
                    <div className={`flex gap-3 mt-1.5 px-1 text-[9px] ${subText} opacity-40`}>
                      <span>Globe = Search Google</span><span>·</span><span>Arrow = Ask Sense Brain</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ── SETTINGS PANEL ── */}
            {isSettingsOpen && (
              <div className={`absolute top-[57px] inset-x-0 bottom-0 z-20 overflow-y-auto p-5 custom-scrollbar ${bg}`}>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-bold text-xs uppercase tracking-widest text-red-600 dark:text-red-400">Voice Settings</h3>
                  <button onClick={() => setIsSettingsOpen(false)} className={`p-1.5 rounded-lg hover:${subBg} ${text}`}><X size={14} /></button>
                </div>
                <div className="space-y-3">
                  {/* Voice Picker */}
                  <div className={`p-4 rounded-2xl ${subBg} border ${sectionBorder}`}>
                    <div className="flex items-center gap-2 mb-2"><Volume2 size={13} className="text-red-500" /><span className={`text-xs font-bold ${text}`}>Voice</span></div>
                    <select
                      value={selectedVoiceName}
                      onChange={e => setSelectedVoiceName(e.target.value)}
                      className={`w-full text-xs rounded-xl p-2.5 border outline-none font-medium ${isDark ? 'bg-white/8 text-white border-white/8' : 'bg-white text-slate-800 border-slate-200'}`}
                    >
                      {availableVoices.map(v => <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>)}
                    </select>
                    <p className={`text-[10px] mt-1 ${subText} opacity-60`}>{availableVoices.length} English voices available</p>
                  </div>

                  {/* Speed */}
                  <SettingSlider label="Speed" icon={<Zap size={13} />} value={voiceSpeed} min={0.5} max={2.0} step={0.1} display={`${voiceSpeed.toFixed(1)}x`} onChange={setVoiceSpeed} subBg={subBg} sectionBorder={sectionBorder} text={text} />
                  {/* Pitch */}
                  <SettingSlider label="Pitch" icon={<AudioLines size={13} />} value={voicePitch} min={0.5} max={2.0} step={0.1} display={voicePitch.toFixed(1)} onChange={setVoicePitch} subBg={subBg} sectionBorder={sectionBorder} text={text} />
                  {/* Volume */}
                  <SettingSlider label="Volume" icon={<Volume2 size={13} />} value={voiceVolume} min={0} max={1} step={0.05} display={`${Math.round(voiceVolume * 100)}%`} onChange={setVoiceVolume} subBg={subBg} sectionBorder={sectionBorder} text={text} />

                  {/* Mute Toggle */}
                  <div className={`p-4 rounded-2xl flex items-center justify-between ${subBg} border ${sectionBorder}`}>
                    <div>
                      <div className={`flex items-center gap-2 text-xs font-bold ${text}`}>
                        {isMuted ? <VolumeX size={13} className="text-rose-500" /> : <Volume2 size={13} className="text-blue-500" />}
                        Mute Voice Output
                      </div>
                      <p className={`text-[10px] ${subText} mt-0.5`}>Listen without AI speaking</p>
                    </div>
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className={`w-10 h-5.5 rounded-full relative transition-all ${isMuted ? 'bg-rose-500' : 'bg-blue-600'}`}
                      style={{ height: 22 }}
                    >
                      <span className={`absolute top-[3px] w-4 h-4 bg-white rounded-full shadow transition-all ${isMuted ? 'left-5' : 'left-1'}`} />
                    </button>
                  </div>

                  {/* Test Voice */}
                  <button
                    onClick={() => {
                      const v = synthRef.current.getVoices().find(v => v.name === selectedVoiceRef.current) || synthRef.current.getVoices()[0];
                      const u = new SpeechSynthesisUtterance('Hello, I am Sense Brain. Your SenseChain AI assistant is online and ready.');
                      u.voice = v; u.rate = voiceSpeedRef.current; u.pitch = voicePitchRef.current; u.volume = voiceVolumeRef.current;
                      synthRef.current.cancel();
                      synthRef.current.speak(u);
                    }}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 text-white text-xs font-bold uppercase tracking-widest transition-all hover:shadow-lg flex items-center justify-center gap-2 shadow-md shadow-red-600/20"
                  >
                    <Volume2 size={13} /> Test Voice
                  </button>

                  {/* System info */}
                  <div className={`p-4 rounded-2xl ${subBg} border ${sectionBorder}`}>
                    <p className={`text-[10px] font-bold uppercase ${subText} opacity-50 mb-2`}>System</p>
                    <div className={`space-y-1 text-[11px] ${subText} font-medium`}>
                      <p>🧠 SenseBrain V11 · Neural AI</p>
                      <p>🎙️ {availableVoices.length} voices · {voiceState}</p>
                      <p>🔗 {API_BASE}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

// ── ROTATING PLACEHOLDER INPUT ──
const RotatingPlaceholderInput = ({ value, onChange, onSend, googleMode, isDark, text, subText }) => {
  const [phIdx, setPhIdx] = useState(0);
  const [fade, setFade]   = useState(true);

  useEffect(() => {
    if (value) return; // don't cycle when user is typing
    const id = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setPhIdx(i => (i + 1) % PLACEHOLDERS.length);
        setFade(true);
      }, 300);
    }, 3000);
    return () => clearInterval(id);
  }, [value]);

  const placeholder = googleMode
    ? 'Search Google for anything...'
    : PLACEHOLDERS[phIdx];

  return (
    <textarea
      rows={1}
      value={value}
      onChange={e => onChange(e.target.value)}
      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), onSend())}
      placeholder={placeholder}
      className={`flex-1 bg-transparent outline-none resize-none text-sm font-medium transition-opacity duration-300 ${
        text
      } placeholder:text-slate-400 dark:placeholder:text-slate-500`}
      style={{
        maxHeight: 120,
        opacity: value ? 1 : (fade ? 1 : 0),
      }}
    />
  );
};

// ── SETTING SLIDER COMPONENT ──
const SettingSlider = ({ label, icon, value, min, max, step, display, onChange, subBg, sectionBorder, text }) => (
  <div className={`p-4 rounded-2xl ${subBg} border ${sectionBorder}`}>
    <div className="flex items-center justify-between mb-2">
      <div className={`flex items-center gap-2 text-xs font-bold ${text}`}>
        <span className="text-red-500">{icon}</span>{label}
      </div>
      <span className="text-xs font-bold text-red-600 dark:text-red-400">{display}</span>
    </div>
    <input
      type="range" min={min} max={max} step={step} value={value}
      onChange={e => onChange(parseFloat(e.target.value))}
      className="w-full accent-red-600"
    />
  </div>
);

export default AIAssistant;