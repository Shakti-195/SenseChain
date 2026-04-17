import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send, Bot, User, X, ChevronDown, MessageSquare, Mic, Search,
  Settings, Headset, History, PlusCircle, Maximize2, Radio, Zap,
  AudioLines, Trash2, Volume2, VolumeX, MicOff, Sparkles,
} from 'lucide-react';
import API from '../services/api';

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
  const [deepSearch, setDeepSearch] = useState(() => localStorage.getItem('sc-deep-search') === 'true');

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
      // Deep search: augment the question with more detailed prompt
      const question = deepSearch
        ? `[DEEP SEARCH MODE] Provide a comprehensive, detailed, structured response to: ${text}. Include relevant technical context, key facts, and step-by-step explanations where applicable.`
        : text;
      const res = await API.post('/ask_assistant', { question, deep_search: deepSearch });
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

  const handleSend = async () => {
    const trimmed = input.trim();
    const now = Date.now();
    if (!trimmed || isThinking || (now - lastRequestTimeRef.current < 800)) return;
    lastRequestTimeRef.current = now;
    const sid = activeSessionId;

    setSessions(prev => prev.map(s => s.id === sid
      ? { ...s, messages: [...s.messages, { role: 'user', text: trimmed, id: now }] } : s));
    setInput('');
    setIsThinking(true);

    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    try {
      // Deep search augments message for comprehensive, structured AI response
      const question = deepSearch
        ? `[DEEP SEARCH] Provide a comprehensive, factual, structured answer to: "${trimmed}". Cite relevant technical detail, examples, and context. Format with clear sections if helpful.`
        : trimmed;
      const res = await API.post('/ask_assistant', { question, deep_search: deepSearch }, {
        signal: abortControllerRef.current.signal
      });
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
                <button
                  onClick={toggleLiveMode}
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
                    {activeSession.messages.length === 0 && (
                      <div className={`flex flex-col items-center justify-center h-40 text-sm ${subText} opacity-40`}>
                        <Sparkles size={24} className="mb-2" /> Ask anything about your blockchain
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
                <div className={`p-4 border-t shrink-0 ${sectionBorder}`}>
                  <div className={isMaximized ? 'max-w-3xl mx-auto' : ''}>
                    {/* Deep search toggle — persisted in localStorage */}
                    <div className="flex gap-2 mb-2.5">
                      <button
                        onClick={() => { const next = !deepSearch; setDeepSearch(next); localStorage.setItem('sc-deep-search', String(next)); }}
                        className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all flex items-center gap-1.5 ${
                          deepSearch
                            ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                            : `${isDark ? 'bg-white/6' : 'bg-stone-100'} ${subText}`
                        }`}
                      >
                        <Search size={9} />
                        Deep Search {deepSearch ? 'ON' : 'OFF'}
                      </button>
                      {deepSearch && (
                        <span className={`px-2.5 py-1.5 rounded-full text-[9px] font-bold ${isDark ? 'bg-white/4 text-red-400' : 'bg-red-50 text-red-600'}`}>
                          ⚡ All queries enhanced
                        </span>
                      )}
                    </div>
                    {/* Input box */}
                    <div className={`flex items-end gap-2.5 rounded-2xl border ${isDark ? 'bg-white/4 border-white/8' : 'bg-slate-50 border-slate-200'} px-4 py-3`}>
                      <textarea
                        rows={1}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                        placeholder="Ask Sense Brain..."
                        className={`flex-1 bg-transparent outline-none resize-none text-sm font-medium ${text} placeholder:${subText}`}
                        style={{ maxHeight: 120 }}
                      />
                      <div className="flex gap-1.5 items-center shrink-0">
                        <button
                          onClick={startVoiceInput}
                          className={`p-2 rounded-xl transition-all ${isVoiceWriting ? 'bg-red-600 text-white' : `${subText} hover:${subBg}`}`}
                        >
                          <Mic size={15} />
                        </button>
                        <button
                        onClick={handleSend}
                        disabled={!input.trim() || isThinking}
                        className="p-2 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 text-white shadow-md shadow-red-600/20 hover:shadow-red-600/40 disabled:opacity-30 transition-all active:scale-95"
                      >
                        <Send size={15} />
                      </button>
                      </div>
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