/**
 * SenseChain Sound Engine — Web Audio API Synthesizer
 * All sounds are generated programmatically. No audio files required.
 */

class SoundManager {
  constructor() {
    this._ctx = null;
    this._alarmId = null;
    this.enabled = localStorage.getItem('sc-sound') !== 'false';
  }

  /* ── Internal helpers ──────────────────────────────────────────── */

  _getCtx() {
    if (!this._ctx) {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this._ctx.state === 'suspended') this._ctx.resume();
    return this._ctx;
  }

  /**
   * Play a single synthesized tone.
   * @param {number} freq       Frequency in Hz
   * @param {number} dur        Duration in seconds
   * @param {string} type       OscillatorType: 'sine'|'square'|'sawtooth'|'triangle'
   * @param {number} vol        Peak gain (0–1)
   * @param {number} startAt    Offset from now in seconds
   * @param {AudioContext} ctx  Optional shared context
   */
  _tone(freq, dur, type = 'sine', vol = 0.25, startAt = 0, ctx = null) {
    if (!this.enabled) return;
    const ac = ctx || this._getCtx();
    const osc  = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ac.currentTime + startAt);
    gain.gain.setValueAtTime(0, ac.currentTime + startAt);
    gain.gain.linearRampToValueAtTime(vol, ac.currentTime + startAt + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + startAt + dur);
    osc.start(ac.currentTime + startAt);
    osc.stop(ac.currentTime + startAt + dur + 0.05);
  }

  /** Frequency sweep (descending or ascending). */
  _sweep(fromFreq, toFreq, dur, type = 'sawtooth', vol = 0.3, startAt = 0, ctx = null) {
    if (!this.enabled) return;
    const ac = ctx || this._getCtx();
    const osc  = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(fromFreq, ac.currentTime + startAt);
    osc.frequency.exponentialRampToValueAtTime(toFreq, ac.currentTime + startAt + dur);
    gain.gain.setValueAtTime(vol, ac.currentTime + startAt);
    gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + startAt + dur);
    osc.start(ac.currentTime + startAt);
    osc.stop(ac.currentTime + startAt + dur + 0.05);
  }

  /* ── Public API ────────────────────────────────────────────────── */

  setEnabled(val) {
    this.enabled = !!val;
    localStorage.setItem('sc-sound', val ? 'true' : 'false');
    if (!val) this.stopAlarm();
  }

  isEnabled() {
    return this.enabled;
  }

  /**
   * ⚡ BREACH / CRITICAL ALERT
   * Rapid dual-tone alarm — urgent, unmistakable.
   */
  breach() {
    if (!this.enabled) return;
    const ac = this._getCtx();
    // 3 sharp alarm pulses
    [0, 0.28, 0.56].forEach(t => {
      this._tone(1040, 0.18, 'square', 0.38, t,        ac);
      this._tone(780,  0.16, 'square', 0.22, t + 0.14, ac);
    });
  }

  /**
   * 🔴 Start repeating breach alarm (stops when stopAlarm is called).
   */
  startAlarm() {
    if (!this.enabled) return;
    this.stopAlarm();
    this.breach();
    this._alarmId = setInterval(() => {
      if (this.enabled) this.breach();
    }, 3500);
  }

  stopAlarm() {
    if (this._alarmId) {
      clearInterval(this._alarmId);
      this._alarmId = null;
    }
  }

  /**
   * 💥 CYBER ATTACK INITIATED
   * Low, ominous thud + descending sawtooth sweep.
   */
  attack() {
    if (!this.enabled) return;
    const ac = this._getCtx();
    // Deep impact thuds
    this._tone(90,  0.45, 'sine',     0.55, 0,   ac);
    this._tone(65,  0.35, 'sine',     0.35, 0.1,  ac);
    // Descending digital sweep
    this._sweep(900, 80, 0.85, 'sawtooth', 0.28, 0.05, ac);
    // High-pitch glitch bursts
    [0.15, 0.3, 0.5].forEach(t => this._tone(2200, 0.04, 'square', 0.12, t, ac));
  }

  /**
   * ✅ CHAIN REPAIRED / RESTORED
   * Triumphant ascending 4-note arpeggio.
   */
  repaired() {
    if (!this.enabled) return;
    this.stopAlarm();
    const ac = this._getCtx();
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
    notes.forEach((f, i) => this._tone(f, 0.35, 'sine', 0.28, i * 0.13, ac));
    // Soft shimmer on top
    this._sweep(1046, 2093, 0.4, 'sine', 0.1, 0.45, ac);
  }

  /**
   * 🟢 NODE CONNECTED / LIVE
   * Ascending 3-note chime — warm, positive.
   */
  nodeConnected() {
    if (!this.enabled) return;
    const ac = this._getCtx();
    [523.25, 659.25, 783.99].forEach((f, i) => this._tone(f, 0.28, 'sine', 0.22, i * 0.11, ac));
  }

  /**
   * 🔌 NODE DISCONNECTED
   * Short descending two-tone drop.
   */
  nodeDisconnected() {
    if (!this.enabled) return;
    const ac = this._getCtx();
    this._tone(440, 0.22, 'sine', 0.25, 0,    ac);
    this._tone(294, 0.28, 'sine', 0.2,  0.18, ac);
  }

  /**
   * ⛏ BLOCK MINED
   * Crisp short double-blip — subtle, non-intrusive.
   */
  blockMined() {
    if (!this.enabled) return;
    const ac = this._getCtx();
    this._tone(880,  0.07, 'sine', 0.18, 0,    ac);
    this._tone(1108, 0.07, 'sine', 0.13, 0.09, ac);
  }

  /**
   * 🔔 NOTIFICATION / TOAST
   * Soft two-tone ping — neutral info.
   */
  notification() {
    if (!this.enabled) return;
    const ac = this._getCtx();
    this._tone(880,  0.14, 'sine', 0.18, 0,    ac);
    this._tone(1109, 0.14, 'sine', 0.14, 0.16, ac);
  }

  /**
   * ⚠ WARNING
   * Two short medium-pitch beeps — caution signal.
   */
  warning() {
    if (!this.enabled) return;
    const ac = this._getCtx();
    this._tone(550, 0.14, 'square', 0.2, 0,    ac);
    this._tone(550, 0.14, 'square', 0.2, 0.22, ac);
  }

  /**
   * 🔐 LOGIN SUCCESS
   * Three-note ascending welcome chime.
   */
  login() {
    if (!this.enabled) return;
    const ac = this._getCtx();
    [392, 523.25, 659.25].forEach((f, i) => this._tone(f, 0.28, 'sine', 0.2, i * 0.13, ac));
  }

  /**
   * ❌ LOGIN ERROR / AUTH FAIL
   * Low buzzer.
   */
  error() {
    if (!this.enabled) return;
    const ac = this._getCtx();
    this._tone(180, 0.3, 'square', 0.3, 0,    ac);
    this._tone(160, 0.3, 'square', 0.25, 0.15, ac);
  }

  /**
   * 🖱 UI CLICK (light)
   * Barely-there tick — satisfying micro-interaction.
   */
  click() {
    if (!this.enabled) return;
    const ac = this._getCtx();
    this._tone(1200, 0.035, 'sine', 0.1, 0, ac);
  }
}

export const soundManager = new SoundManager();
