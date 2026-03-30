import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Bot, User, X, ChevronDown, MessageSquare, Mic, Search, Settings, Moon, Sun, Headset, History, PlusCircle, Maximize2, Radio, Zap, AudioLines, Trash2, Volume2, VolumeX, MicOff } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL;
// ─── Voice State Machine ───────────────────────────────────────
// IDLE → LISTENING → PROCESSING → SPEAKING → LISTENING → ...
// Each state has exactly one exit path. No parallel states possible.
const VOICE_STATE = {
  IDLE:       'idle',
  LISTENING:  'listening',
  PROCESSING: 'processing',
  SPEAKING:   'speaking',
};

const AIAssistant = () => {
  const [isOpen, setIsOpen]           = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen]   = useState(false);
  const [input, setInput]             = useState('');
  const [sessions, setSessions]       = useState([{
    id: '1',
    title: 'Neural Session',
    messages: [{ role: 'assistant', text: 'Neural Link Established. I am Sense Brain V11. Ready to help!', id: 'init' }]
  }]);
  const [activeSessionId, setActiveSessionId] = useState('1');
  const [isThinking, setIsThinking]   = useState(false);
  const [theme, setTheme]             = useState('light');
  const [isVoiceWriting, setIsVoiceWriting] = useState(false);
  const [deepSearch, setDeepSearch]   = useState(false);

  // Voice settings
  const [selectedVoiceName, setSelectedVoiceName] = useState('');
  const [availableVoices, setAvailableVoices]       = useState([]);
  const [voiceSpeed, setVoiceSpeed]   = useState(1.0);
  const [voicePitch, setVoicePitch]   = useState(1.1);
  const [voiceVolume, setVoiceVolume] = useState(1.0);
  const [isMuted, setIsMuted]         = useState(false);

  // Voice UI state
  const [voiceState, setVoiceState]       = useState(VOICE_STATE.IDLE);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [isLiveMode, setIsLiveMode]       = useState(false);

  // ── Core refs (never stale inside callbacks) ──
  const voiceStateRef      = useRef(VOICE_STATE.IDLE);
  const isLiveModeRef      = useRef(false);
  const isMutedRef         = useRef(false);
  const selectedVoiceRef   = useRef('');
  const voiceSpeedRef      = useRef(1.0);
  const voicePitchRef      = useRef(1.1);
  const voiceVolumeRef     = useRef(1.0);
  const activeSessionIdRef = useRef('1');
  const recognitionRef     = useRef(null);
  const synthRef           = useRef(window.speechSynthesis);
  const chatEndRef         = useRef(null);

  // Keep refs in sync
  const setVoiceStateSync = (s) => { voiceStateRef.current = s; setVoiceState(s); };
  useEffect(() => { isMutedRef.current = isMuted; },               [isMuted]);
  useEffect(() => { selectedVoiceRef.current = selectedVoiceName; }, [selectedVoiceName]);
  useEffect(() => { voiceSpeedRef.current = voiceSpeed; },          [voiceSpeed]);
  useEffect(() => { voicePitchRef.current = voicePitch; },          [voicePitch]);
  useEffect(() => { voiceVolumeRef.current = voiceVolume; },        [voiceVolume]);
  useEffect(() => { activeSessionIdRef.current = activeSessionId; }, [activeSessionId]);
  useEffect(() => { isLiveModeRef.current = isLiveMode; },          [isLiveMode]);

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
  const isDark = theme === 'dark';

  // ── Load voices ──
  useEffect(() => {
    const load = () => {
      const all = synthRef.current.getVoices().filter(v => v.lang.startsWith('en'));
      setAvailableVoices(all);
      if (!selectedVoiceName && all.length > 0) {
        const best = all.find(v => v.name.includes('Google') && v.lang === 'en-US')
          || all.find(v => v.lang === 'en-US')
          || all[0];
        const name = best?.name || '';
        setSelectedVoiceName(name);
        selectedVoiceRef.current = name;
      }
    };
    load();
    synthRef.current.onvoiceschanged = load;
    return () => { synthRef.current.onvoiceschanged = null; };
  }, []);

  // ── Scroll ──
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessions, isThinking]);

  // ── Cleanup ──
  useEffect(() => {
    return () => {
      synthRef.current.cancel();
      killRecognition();
    };
  }, []);

  // ─────────────────────────────────────────────────────────────
  // RECOGNITION - create fresh instance every time
  // ─────────────────────────────────────────────────────────────
  const killRecognition = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.onresult = null; recognitionRef.current.onend = null; recognitionRef.current.onerror = null; recognitionRef.current.abort(); } catch(_) {}
      recognitionRef.current = null;
    }
  };

  const startListening = useCallback(() => {
    // Guard: only start from IDLE - never during PROCESSING or SPEAKING
    if (!isLiveModeRef.current) return;
    if (
      voiceStateRef.current === VOICE_STATE.PROCESSING ||
      voiceStateRef.current === VOICE_STATE.SPEAKING
    ) {
      console.log('startListening blocked - state is', voiceStateRef.current);
      return;
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert('Voice recognition requires Chrome or Edge.'); return; }

    killRecognition();
    setVoiceStateSync(VOICE_STATE.LISTENING);
    setLiveTranscript('Listening... speak now 🎙️');

    const rec = new SR();
    recognitionRef.current = rec;
    rec.lang             = 'en-US';
    rec.continuous       = true;   // FIX: Keep listening until silence detected
    rec.interimResults   = true;   // FIX: Show partial results so user sees recognition working
    rec.maxAlternatives  = 1;

    let finalTranscript  = '';
    let interimTranscript = '';
    let silenceTimer     = null;   // FIX: Wait for natural pause before sending

    const clearSilenceTimer = () => {
      if (silenceTimer) { clearTimeout(silenceTimer); silenceTimer = null; }
    };

    const sendWhenReady = (text) => {
      clearSilenceTimer();
      if (!text.trim() || !isLiveModeRef.current) return;
      // Move to PROCESSING - block mic restart
      setVoiceStateSync(VOICE_STATE.PROCESSING);
      setLiveTranscript(`You: "${text.trim()}"`);
      sendVoiceMessage(text.trim());
    };

    rec.onresult = (e) => {
      finalTranscript   = '';
      interimTranscript = '';

      // FIX: Accumulate ALL results (not just from resultIndex)
      // resultIndex-only misses earlier words in long sentences
      for (let i = 0; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          finalTranscript += t + ' ';
        } else {
          interimTranscript += t;
        }
      }

      // Show live text - full sentence as it builds
      const display = (finalTranscript + interimTranscript).trim();
      if (display) setLiveTranscript('🎙️ ' + display);

      // When we get final result, wait 800ms for more words
      // This handles: "what is blockchain" → brief pause → sends full sentence
      if (finalTranscript.trim()) {
        clearSilenceTimer();
        silenceTimer = setTimeout(() => {
          const full = finalTranscript.trim();
          if (full && voiceStateRef.current === VOICE_STATE.LISTENING) {
            sendWhenReady(full);
          }
        }, 1500); // FIX: 1500ms silence = end of sentence (was 800ms - too short)
      }
    };

    rec.onerror = (e) => {
      clearSilenceTimer();
      if (e.error === 'aborted' || e.error === 'interrupted') {
        return; // Intentional - ignore
      }
      if (e.error === 'no-speech') {
        // Chrome reports no-speech even in continuous mode - just ignore it
        // The recognition keeps running in continuous mode
        return;
      }
      if (e.error === 'network') {
        console.warn('SR network error - restarting');
        if (isLiveModeRef.current && voiceStateRef.current === VOICE_STATE.LISTENING) {
          setVoiceStateSync(VOICE_STATE.IDLE);
          setTimeout(() => startListening(), 1500);
        }
        return;
      }
      console.warn('SR error:', e.error);
      if (
        isLiveModeRef.current &&
        voiceStateRef.current !== VOICE_STATE.PROCESSING &&
        voiceStateRef.current !== VOICE_STATE.SPEAKING
      ) {
        setVoiceStateSync(VOICE_STATE.IDLE);
        setTimeout(() => startListening(), 1000);
      }
    };

    rec.onend = () => {
      clearSilenceTimer();
      // continuous=true should not fire onend unless we aborted
      // But Chrome sometimes fires it anyway - restart if still LISTENING
      if (
        isLiveModeRef.current &&
        voiceStateRef.current === VOICE_STATE.LISTENING
      ) {
        setVoiceStateSync(VOICE_STATE.IDLE);
        setTimeout(() => startListening(), 200);
      }
    };

    try { rec.start(); } catch(e) { console.warn('rec.start error:', e); }
  }, []);

  // ─────────────────────────────────────────────────────────────
  // SPEAK - plays reply ONCE, then returns to LISTENING
  // FIX: Single onend handler, watchdog only fires if speech
  //      silently stalls (Chrome bug), cleared on normal end
  // ─────────────────────────────────────────────────────────────
  const watchdogRef = useRef(null);

  const clearWatchdog = () => {
    if (watchdogRef.current) { clearTimeout(watchdogRef.current); watchdogRef.current = null; }
  };

  const returnToListening = useCallback(() => {
    clearWatchdog();
    if (isLiveModeRef.current) {
      setVoiceStateSync(VOICE_STATE.IDLE);
      setLiveTranscript('');
      setTimeout(() => startListening(), 450);
    }
  }, [startListening]);

  const speakReply = useCallback((text) => {
    if (!isLiveModeRef.current) return;

    // Cancel any previous speech immediately
    synthRef.current.cancel();
    clearWatchdog();

    setVoiceStateSync(VOICE_STATE.SPEAKING);
    // Show only first 120 chars in transcript to keep it readable
    setLiveTranscript(text.length > 120 ? text.slice(0, 117) + '...' : text);

    // Muted - skip TTS, go straight back to listening
    if (isMutedRef.current) {
      setTimeout(() => returnToListening(), 400);
      return;
    }

    const voices = synthRef.current.getVoices();
    const voice  = voices.find(v => v.name === selectedVoiceRef.current)
      || voices.find(v => v.lang === 'en-US')
      || voices.find(v => v.lang.startsWith('en'))
      || voices[0];

    // Split long replies into sentences to prevent Chrome cutting off
    // Chrome TTS has a ~250 char bug where it silently stops
    const sentences = text.match(/[^.!?]+[.!?]*/g) || [text];
    const chunks = [];
    let current = '';
    for (const s of sentences) {
      if ((current + s).length > 200) {
        if (current) chunks.push(current.trim());
        current = s;
      } else {
        current += s;
      }
    }
    if (current.trim()) chunks.push(current.trim());

    let chunkIndex = 0;
    let hasFinished = false;  // FIX: prevent double-fire

    const speakChunk = (idx) => {
      if (!isLiveModeRef.current || hasFinished) return;
      if (idx >= chunks.length) {
        hasFinished = true;
        returnToListening();
        return;
      }

      const utt    = new SpeechSynthesisUtterance(chunks[idx]);
      utt.voice    = voice;
      utt.rate     = voiceSpeedRef.current;
      utt.pitch    = voicePitchRef.current;
      utt.volume   = voiceVolumeRef.current;

      // Watchdog: Chrome sometimes fires onend early or not at all
      // Only kicks in if we detect silence for too long
      const wordCount   = chunks[idx].split(' ').length;
      const maxDuration = Math.max(5000, (wordCount / Math.max(voiceSpeedRef.current, 0.5)) * 700 + 2000);

      clearWatchdog();
      watchdogRef.current = setTimeout(() => {
        if (!hasFinished && isLiveModeRef.current && voiceStateRef.current === VOICE_STATE.SPEAKING) {
          console.warn('Watchdog triggered - speech stalled at chunk', idx);
          hasFinished = true;
          synthRef.current.cancel();
          returnToListening();
        }
      }, maxDuration);

      utt.onend = () => {
        clearWatchdog();
        if (!hasFinished) {
          chunkIndex++;
          if (chunkIndex < chunks.length) {
            // Small gap between chunks
            setTimeout(() => speakChunk(chunkIndex), 120);
          } else {
            hasFinished = true;
            returnToListening();
          }
        }
      };

      utt.onerror = (e) => {
        // 'interrupted' means we called cancel() - expected, ignore
        if (e.error === 'interrupted' || e.error === 'canceled') return;
        clearWatchdog();
        if (!hasFinished) {
          console.warn('TTS error on chunk', idx, e.error);
          hasFinished = true;
          returnToListening();
        }
      };

      synthRef.current.speak(utt);
    };

    // Small delay so browser audio context is ready
    setTimeout(() => speakChunk(0), 80);

  }, [startListening, returnToListening]);

  // ─────────────────────────────────────────────────────────────
  // SEND VOICE MESSAGE
  // FIX: Kill mic FIRST before any async work
  //      so recognition never overlaps with API response
  // ─────────────────────────────────────────────────────────────
  const sendVoiceMessage = async (text) => {
    const sid = activeSessionIdRef.current;

    // STEP 1: Hard-kill recognition immediately - mic OFF
    killRecognition();
    setVoiceStateSync(VOICE_STATE.PROCESSING);
    setLiveTranscript('Processing your message...');

    // STEP 2: Show user message in chat
    setSessions(prev => prev.map(s => s.id === sid
      ? { ...s, title: text.slice(0, 22), messages: [...s.messages, { role: 'user', text, id: Date.now() }] }
      : s
    ));

    // STEP 3: Call API
    try {
      const res  = await fetch(`${API_BASE}/ask_assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: text, deep_search: deepSearch }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const reply = (data.reply || "Sorry, I couldn't get a response.").trim();

      // STEP 4: Show AI reply in chat
      setSessions(prev => prev.map(s => s.id === sid
        ? { ...s, messages: [...s.messages, { role: 'assistant', text: reply, id: Date.now() + 1 }] }
        : s
      ));

      // STEP 5: Speak reply (recognition stays OFF during speaking)
      // speakReply handles: SPEAKING → IDLE → startListening
      speakReply(reply);

    } catch (err) {
      console.error('Voice send error:', err);
      const errMsg = '🚨 Connection error. Please check if the backend is running.';
      setSessions(prev => prev.map(s => s.id === sid
        ? { ...s, messages: [...s.messages, { role: 'assistant', text: errMsg, id: Date.now() + 1 }] }
        : s
      ));
      // Return to listening after error
      if (isLiveModeRef.current) {
        setVoiceStateSync(VOICE_STATE.IDLE);
        setLiveTranscript('Connection error - try again');
        setTimeout(() => startListening(), 1500);
      }
    }
  };

  // ─────────────────────────────────────────────────────────────
  // TOGGLE LIVE MODE
  // ─────────────────────────────────────────────────────────────
  const toggleLiveMode = () => {
    const next = !isLiveMode;
    isLiveModeRef.current = next;
    setIsLiveMode(next);
    setIsSettingsOpen(false);

    if (next) {
      setVoiceStateSync(VOICE_STATE.IDLE);
      setLiveTranscript('');

      // Chrome requires a tiny audio context unlock before recognition works
      const unlock = new SpeechSynthesisUtterance(' ');
      unlock.volume = 0;
      unlock.onend  = () => setTimeout(() => startListening(), 300);
      synthRef.current.speak(unlock);
    } else {
      // Full stop
      synthRef.current.cancel();
      killRecognition();
      setVoiceStateSync(VOICE_STATE.IDLE);
      setLiveTranscript('');
    }
  };

  // ─────────────────────────────────────────────────────────────
  // TEXT SEND
  // ─────────────────────────────────────────────────────────────
  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isThinking) return;

    const sid = activeSessionId;
    setSessions(prev => prev.map(s => s.id === sid
      ? { ...s, title: trimmed.slice(0, 20), messages: [...s.messages, { role: 'user', text: trimmed, id: Date.now() }] }
      : s
    ));
    setInput('');
    setIsThinking(true);

    try {
      const res  = await fetch(`${API_BASE}/ask_assistant`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: trimmed, deep_search: deepSearch }),
      });
      const data = await res.json();
      setSessions(prev => prev.map(s => s.id === sid
        ? { ...s, messages: [...s.messages, { role: 'assistant', text: data.reply || 'No response.', id: Date.now() + 1 }] }
        : s
      ));
    } catch {
      setSessions(prev => prev.map(s => s.id === sid
        ? { ...s, messages: [...s.messages, { role: 'assistant', text: '🚨 Connection error. Is the backend running?', id: Date.now() + 1 }] }
        : s
      ));
    } finally {
      setIsThinking(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // MIC TO TEXT (input box) - captures full sentence
  // ─────────────────────────────────────────────────────────────
  const startVoiceInput = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang           = 'en-US';
    rec.continuous     = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    let accumulated = '';

    rec.onstart  = () => setIsVoiceWriting(true);

    rec.onresult = (e) => {
      accumulated = '';
      for (let i = 0; i < e.results.length; i++) {
        accumulated += e.results[i][0].transcript + ' ';
      }
      // Show live in input box
      setInput(accumulated.trim());
    };

    rec.onend = () => {
      setIsVoiceWriting(false);
      // Final value already set by onresult
    };

    rec.start();
  };

  // ─────────────────────────────────────────────────────────────
  // CHAT MANAGEMENT
  // ─────────────────────────────────────────────────────────────
  const deleteMessage = (msgId) =>
    setSessions(prev => prev.map(s => s.id === activeSessionId
      ? { ...s, messages: s.messages.filter(m => m.id !== msgId) } : s));

  const clearChat = () =>
    setSessions(prev => prev.map(s => s.id === activeSessionId
      ? { ...s, messages: [] } : s));

  const deleteSession = (sid) =>
    setSessions(prev => {
      const rest = prev.filter(s => s.id !== sid);
      if (!rest.length) { const f = { id: Date.now().toString(), title: 'New Chat', messages: [] }; setActiveSessionId(f.id); return [f]; }
      if (activeSessionId === sid) setActiveSessionId(rest[0].id);
      return rest;
    });

  const newSession = () => {
    const s = { id: Date.now().toString(), title: 'New Chat', messages: [] };
    setSessions(prev => [s, ...prev]);
    setActiveSessionId(s.id);
  };

  // ── Voice state labels & colors ──
  const voiceLabel = {
    [VOICE_STATE.IDLE]:       'Starting...',
    [VOICE_STATE.LISTENING]:  'Listening... 🎙️',
    [VOICE_STATE.PROCESSING]: 'Processing...',
    [VOICE_STATE.SPEAKING]:   'Speaking...',
  };
  const voiceColor = {
    [VOICE_STATE.IDLE]:       'bg-slate-400',
    [VOICE_STATE.LISTENING]:  'bg-indigo-500',
    [VOICE_STATE.PROCESSING]: 'bg-amber-500',
    [VOICE_STATE.SPEAKING]:   'bg-emerald-500',
  };
  const voiceHeadsetColor = {
    [VOICE_STATE.IDLE]:       'text-slate-500',
    [VOICE_STATE.LISTENING]:  'text-indigo-600',
    [VOICE_STATE.PROCESSING]: 'text-amber-500',
    [VOICE_STATE.SPEAKING]:   'text-emerald-500',
  };

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-[1000] flex items-center gap-3 bg-slate-900 text-white p-2.5 pr-6 rounded-full shadow-2xl hover:scale-105 border border-slate-800 transition-all">
          <div className="bg-gradient-to-r from-blue-600 to-black  p-2.5 rounded-full"><Bot size={22}/></div>
          <p className="text-xs font-bold">Sense Brain </p>
        </button>
      )}

      {isOpen && (
        <div className={`fixed z-[1001] transition-all duration-500 border overflow-hidden flex flex-row animate-in fade-in slide-in-from-bottom-12
          ${isMaximized ? 'inset-0 rounded-none' : 'bottom-0 right-0 w-full md:w-[500px] h-[100dvh] md:h-[calc(100dvh-60px)] md:max-h-[750px] md:bottom-5 md:right-5 md:rounded-[40px] shadow-2xl'}
          ${isDark ? 'bg-black border-white/10 text-white' : 'bg-white border-slate-100 text-slate-800'}`}>

          {/* ── SIDEBAR ── */}
          {isHistoryOpen && (
            <div className={`w-60 flex-shrink-0 border-r flex flex-col animate-in slide-in-from-left duration-300 ${isDark ? 'bg-[#080808] border-white/5' : 'bg-slate-50 border-slate-100'}`}>
              <div className="p-4 border-b border-black/5">
                <button onClick={newSession} className="w-full flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-blue-600 to-black  text-white rounded-2xl text-xs font-bold">
                  <PlusCircle size={14}/> New Chat
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-1">
                {sessions.map(s => (
                  <div key={s.id} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-[11px] font-medium cursor-pointer group transition-all ${activeSessionId === s.id ? 'bg-indigo-500/10 text-indigo-500' : 'hover:bg-slate-100 opacity-60 hover:opacity-100'}`}>
                    <div className="flex-1 truncate" onClick={() => setActiveSessionId(s.id)}>
                      <MessageSquare size={11} className="inline mr-1.5"/>{s.title || 'Empty'}
                    </div>
                    <button onClick={() => deleteSession(s.id)} className="opacity-0 group-hover:opacity-100 hover:text-rose-500 transition-all p-0.5">
                      <Trash2 size={11}/>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── MAIN PANEL ── */}
          <div className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden">

            {/* Header */}
            <div className={`flex items-center justify-between px-5 py-4 border-b flex-shrink-0 ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
              <div className="flex items-center gap-3">
                <button onClick={() => setIsHistoryOpen(!isHistoryOpen)} className="p-2 hover:bg-slate-500/10 rounded-xl text-slate-400"><History size={18}/></button>
                <div>
                  <h2 className="font-bold text-[14px] flex items-center gap-2">
                    Sense Brain
                    <span className="text-[9px] bg-gradient-to-r from-blue-600 to-black  text-white px-2 py-0.5 rounded-full font-black">PRO</span>
                  </h2>
                  <span className="text-[10px] opacity-40 font-black  tracking-widest">By SenseChain</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={toggleLiveMode} title="Voice Mode"
                  className={`p-2.5 rounded-full transition-all ${isLiveMode ? 'bg-rose-500 text-white animate-pulse' : 'hover:bg-slate-500/10 text-slate-400'}`}>
                  <Radio size={18}/>
                </button>
                <button onClick={clearChat} title="Clear chat" className="p-2.5 hover:bg-slate-500/10 rounded-full text-slate-400"><Trash2 size={15}/></button>
                <button onClick={() => setIsMaximized(!isMaximized)} className="p-2.5 hover:bg-slate-500/10 rounded-full text-slate-400"><Maximize2 size={15}/></button>
                <button onClick={() => setTheme(isDark ? 'light' : 'dark')} className="p-2.5 hover:bg-slate-500/10 rounded-full text-slate-400">
                  {isDark ? <Sun size={15} className="text-amber-400"/> : <Moon size={15}/>}
                </button>
                <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className={`p-2.5 rounded-full text-slate-400 ${isSettingsOpen ? 'bg-indigo-500/10 text-indigo-500' : 'hover:bg-slate-500/10'}`}>
                  <Settings size={15}/>
                </button>
                <button onClick={() => setIsOpen(false)} className="p-2.5 hover:bg-rose-50 rounded-full text-slate-400"><ChevronDown size={20}/></button>
              </div>
            </div>

            {/* ── LIVE VOICE UI ── */}
            {isLiveMode ? (
              <div className="flex-1 flex flex-col items-center justify-between p-8 overflow-hidden">

                {/* Status orb */}
                <div className="flex-1 flex flex-col items-center justify-center gap-8">
                  <div className="relative flex items-center justify-center">
                    {/* Outer ring - pulses when listening */}
                    <div className={`absolute w-52 h-52 rounded-full border-2 transition-all duration-500 ${voiceState === VOICE_STATE.LISTENING ? 'border-indigo-500/30 animate-ping' : 'border-transparent'}`}/>
                    {/* Middle ring */}
                    <div className={`absolute w-44 h-44 rounded-full border transition-all duration-500 ${voiceState === VOICE_STATE.LISTENING ? 'border-indigo-400/20' : voiceState === VOICE_STATE.SPEAKING ? 'border-emerald-400/20 animate-pulse' : 'border-slate-200/20'}`}/>
                    {/* Core */}
                    <div className={`w-36 h-36 rounded-full flex items-center justify-center transition-all duration-500 ${voiceState === VOICE_STATE.SPEAKING ? 'bg-emerald-500/15 shadow-lg shadow-emerald-500/20' : voiceState === VOICE_STATE.LISTENING ? 'bg-indigo-500/15 shadow-lg shadow-indigo-500/20' : voiceState === VOICE_STATE.PROCESSING ? 'bg-amber-500/15' : 'bg-slate-500/10'}`}>
                      <Headset size={52} className={`transition-all duration-300 ${voiceHeadsetColor[voiceState]}`}/>
                    </div>
                  </div>

                  {/* State label */}
                  <div className="text-center space-y-3">
                    <h3 className="text-xl font-black tracking-tight">{voiceLabel[voiceState]}</h3>

                    {/* Animated bars */}
                    <div className="flex gap-1.5 justify-center h-8 items-end">
                      {[1,2,3,4,5,6,7,8].map(i => (
                        <div key={i}
                          className={`w-1 rounded-full transition-all duration-200 ${voiceColor[voiceState]}`}
                          style={{
                            height: voiceState === VOICE_STATE.SPEAKING
                              ? `${Math.random() * 28 + 4}px`
                              : voiceState === VOICE_STATE.LISTENING
                              ? `${8 + (i % 3) * 6}px`
                              : '4px',
                            animationDelay: `${i * 0.08}s`,
                            animation: voiceState !== VOICE_STATE.IDLE ? 'pulse 0.8s ease-in-out infinite' : 'none',
                          }}/>
                      ))}
                    </div>
                  </div>

                  {/* Mute toggle */}
                  <button onClick={() => setIsMuted(!isMuted)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-black transition-all border ${isMuted ? 'bg-rose-500/10 text-rose-500 border-rose-200' : isDark ? 'bg-white/5 border-white/10 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
                    {isMuted ? <><VolumeX size={13}/> Voice Muted</> : <><Volume2 size={13}/> Voice On</>}
                  </button>
                </div>

                {/* Transcript box */}
                <div className={`w-full rounded-3xl p-5 text-sm font-medium text-center transition-all duration-300 ${isDark ? 'bg-white/5' : 'bg-slate-50'} ${liveTranscript ? 'opacity-100' : 'opacity-40'}`}>
                  {liveTranscript || (voiceState === VOICE_STATE.LISTENING ? 'Speak now - I am listening...' : voiceState === VOICE_STATE.PROCESSING ? 'Got it! Thinking...' : voiceState === VOICE_STATE.SPEAKING ? 'Speaking reply...' : 'Starting up...')}
                </div>

                {/* Recent messages in live mode */}
                <div className={`w-full mt-3 rounded-2xl overflow-hidden ${isDark ? 'bg-white/3' : 'bg-slate-50/80'}`}>
                  {activeSession.messages.slice(-2).map(msg => (
                    <div key={msg.id} className={`px-4 py-2 text-xs flex gap-2 items-start border-b last:border-0 ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                      <span className={`font-black uppercase text-[9px] tracking-widest mt-0.5 flex-shrink-0 ${msg.role === 'assistant' ? 'text-emerald-500' : 'text-indigo-500'}`}>
                        {msg.role === 'assistant' ? 'AI' : 'YOU'}
                      </span>
                      <span className="opacity-70 leading-relaxed line-clamp-2">{msg.text}</span>
                    </div>
                  ))}
                </div>

                <button onClick={toggleLiveMode}
                  className="mt-5 px-10 py-3 bg-rose-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-rose-600 transition-all active:scale-95">
                  End Voice Session
                </button>
              </div>
            ) : (
              <>
                {/* ── CHAT MESSAGES ── */}
                <div className="flex-1 overflow-y-auto">
                  <div className={isMaximized ? 'max-w-3xl mx-auto' : ''}>
                    {activeSession.messages.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-40 opacity-25 text-sm">
                        <Bot size={28} className="mb-2"/>Start a conversation
                      </div>
                    )}
                    {activeSession.messages.map(msg => (
                      <div key={msg.id} className="px-5 py-5 group relative animate-in slide-in-from-bottom-2 duration-300">
                        <div className="flex gap-4 items-start max-w-3xl mx-auto">
                          <div className={`p-2 rounded-xl flex-shrink-0 text-white ${msg.role === 'assistant' ? 'bg-gradient-to-r from-blue-600 to-black' : 'bg-gradient-to-r from-red-600 to-black'}`}>
                            {msg.role === 'assistant' ? <Bot size={16}/> : <User size={16}/>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-30 mb-1">
                              {msg.role === 'assistant' ? 'SENSE BRAIN' : 'YOU'}
                            </p>
                            <div className="text-[14px] leading-relaxed font-medium whitespace-pre-wrap break-words">{msg.text}</div>
                          </div>
                          {msg.id !== 'init' && (
                            <button onClick={() => deleteMessage(msg.id)}
                              className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-rose-50 hover:text-rose-500 rounded-lg text-slate-300 transition-all flex-shrink-0 mt-1">
                              <X size={12}/>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {isThinking && (
                    <div className="px-9 py-3 flex items-center gap-2">
                      <div className="flex gap-1">
                        {['-0.3s','-0.15s','0s'].map((d,i) => (
                          <div key={i} className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{animationDelay:d}}/>
                        ))}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-30">Thinking...</span>
                    </div>
                  )}
                  <div ref={chatEndRef}/>
                </div>

                {/* ── INPUT ── */}
                <div className={`p-5 border-t flex-shrink-0 ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                  <div className={isMaximized ? 'max-w-3xl mx-auto' : ''}>
                    <div className="flex gap-2 mb-3">
                      <button onClick={() => setDeepSearch(!deepSearch)}
                        className={`px-3 py-1.5 rounded-full text-[10px] font-black transition-all ${deepSearch ? 'bg-indigo-600 text-white' : isDark ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-400'}`}>
                        <Search size={10} className="inline mr-1"/>Deep Search {deepSearch ? 'ON' : 'OFF'}
                      </button>
                    </div>
                    <div className="relative">
                      <textarea rows="1" value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                        placeholder="Message Sense Brain..."
                        className={`w-full rounded-[20px] px-5 py-4 pr-24 text-sm outline-none resize-none font-medium border-none transition-all ${isDark ? 'bg-white/5 text-white placeholder:text-white/30' : 'bg-slate-100 text-slate-800'} focus:ring-2 focus:ring-indigo-500/20`}/>
                      <div className="absolute right-2.5 bottom-2.5 flex gap-1.5">
                        <button onClick={startVoiceInput}
                          className={`p-2.5 rounded-xl transition-all ${isVoiceWriting ? 'bg-blue-600 text-white animate-pulse' : isDark ? 'text-white/30 hover:bg-white/10' : 'text-slate-400 hover:bg-slate-200'}`}>
                          <Mic size={17}/>
                        </button>
                          <button 
                              onClick={handleSend} 
                                    disabled={!input.trim() || isThinking}
                            className="p-2.5 bg-gradient-to-r from-blue-600 to-black rounded-xl hover:bg-blue-700 disabled:opacity-20 disabled:grayscale active:scale-95 transition-all shadow-lg shadow-blue-500/20"
>
                                  <Send size={17} fill="white" />
                                 </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ── SETTINGS PANEL ── */}
            {isSettingsOpen && (
              <div className={`absolute top-[68px] inset-x-0 bottom-0 z-20 overflow-y-auto p-5 animate-in slide-in-from-top-2 duration-200 ${isDark ? 'bg-black text-white' : 'bg-white text-slate-800'}`}>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-black text-xs uppercase tracking-widest text-indigo-500">Voice Settings</h3>
                  <button onClick={() => setIsSettingsOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X size={14}/></button>
                </div>
                <div className="space-y-4">

                  {/* Voice picker */}
                  <div className={`p-4 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
                    <div className="flex items-center gap-2 mb-2"><Volume2 size={14} className="text-indigo-500"/><span className="text-xs font-black uppercase">Voice</span></div>
                    <select value={selectedVoiceName} onChange={e => { setSelectedVoiceName(e.target.value); selectedVoiceRef.current = e.target.value; }}
                      className={`w-full text-xs rounded-xl p-2.5 outline-none border-none font-medium ${isDark ? 'bg-white/10 text-white' : 'bg-white text-slate-800'} focus:ring-2 focus:ring-indigo-500/20`}>
                      {availableVoices.map(v => <option key={v.name} value={v.name}>{v.name} - {v.lang}</option>)}
                    </select>
                    <p className="text-[10px] opacity-40 mt-1.5">{availableVoices.length} English voices available on this device</p>
                  </div>

                  {/* Speed */}
                  <div className={`p-4 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2"><Zap size={14} className="text-indigo-500"/><span className="text-xs font-black uppercase">Speed</span></div>
                      <span className="text-xs font-black text-indigo-500">{voiceSpeed.toFixed(1)}x</span>
                    </div>
                    <input type="range" min="0.5" max="2.0" step="0.1" value={voiceSpeed}
                      onChange={e => { const v = parseFloat(e.target.value); setVoiceSpeed(v); voiceSpeedRef.current = v; }}
                      className="w-full accent-indigo-500"/>
                    <div className="flex justify-between text-[10px] opacity-40 mt-1"><span>Slow</span><span>Fast</span></div>
                  </div>

                  {/* Pitch */}
                  <div className={`p-4 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2"><AudioLines size={14} className="text-indigo-500"/><span className="text-xs font-black uppercase">Pitch</span></div>
                      <span className="text-xs font-black text-indigo-500">{voicePitch.toFixed(1)}</span>
                    </div>
                    <input type="range" min="0.5" max="2.0" step="0.1" value={voicePitch}
                      onChange={e => { const v = parseFloat(e.target.value); setVoicePitch(v); voicePitchRef.current = v; }}
                      className="w-full accent-indigo-500"/>
                    <div className="flex justify-between text-[10px] opacity-40 mt-1"><span>Deep</span><span>High</span></div>
                  </div>

                  {/* Volume */}
                  <div className={`p-4 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2"><Volume2 size={14} className="text-indigo-500"/><span className="text-xs font-black uppercase">Volume</span></div>
                      <span className="text-xs font-black text-indigo-500">{Math.round(voiceVolume * 100)}%</span>
                    </div>
                    <input type="range" min="0" max="1" step="0.05" value={voiceVolume}
                      onChange={e => { const v = parseFloat(e.target.value); setVoiceVolume(v); voiceVolumeRef.current = v; }}
                      className="w-full accent-indigo-500"/>
                    <div className="flex justify-between text-[10px] opacity-40 mt-1"><span>Quiet</span><span>Loud</span></div>
                  </div>

                  {/* Mute */}
                  <div className={`p-4 rounded-2xl flex items-center justify-between ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        {isMuted ? <VolumeX size={14} className="text-rose-500"/> : <Volume2 size={14} className="text-indigo-500"/>}
                        <span className="text-xs font-black uppercase">Mute Voice Output</span>
                      </div>
                      <p className="text-[10px] opacity-40">Listen without AI speaking back</p>
                    </div>
                    <button onClick={() => { setIsMuted(!isMuted); isMutedRef.current = !isMuted; }}
                      className={`w-11 h-6 rounded-full relative transition-all ${isMuted ? 'bg-rose-500' : 'bg-gradient-to-r from-blue-600 to-black '}`}>
                      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${isMuted ? 'left-6' : 'left-1'}`}/>
                    </button>
                  </div>

                  {/* Test voice */}
                  <button onClick={() => {
                    const v = synthRef.current.getVoices().find(v => v.name === selectedVoiceRef.current) || synthRef.current.getVoices()[0];
                    const u = new SpeechSynthesisUtterance("Hello! I am Sense Brain V11, ready to assist with SenseChain.");
                    u.voice = v; u.rate = voiceSpeedRef.current; u.pitch = voicePitchRef.current; u.volume = voiceVolumeRef.current;
                    synthRef.current.cancel();
                    synthRef.current.speak(u);
                  }} className="w-full py-3 bg-gradient-to-r from-blue-600 to-black  text-white rounded-2xl text-xs font-black uppercase tracking-widest  hover:from-black hover:to-red-600 transition-all flex items-center justify-center gap-2">
                    <Volume2 size={14}/> Test Voice
                  </button>

                  {/* System info */}
                  <div className={`p-4 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
                    <p className="text-[10px] font-black uppercase opacity-40 mb-2">System</p>
                    <div className="space-y-1 text-[11px] opacity-60 font-medium">
                      <p>🧠 SenseBrain V11 · 1024 Neurons</p>
                      <p>🎙️ {availableVoices.length} voices · State: {voiceState}</p>
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

export default AIAssistant;