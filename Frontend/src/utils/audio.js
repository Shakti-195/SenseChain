// Utility for generating purely synthetic sci-fi alarms using Web Audio API

let audioCtx = null;
let activeOscillators = [];

export const playSecurityBreachAlarm = () => {
    // Stop any existing active alarms
    stopSecurityBreachAlarm();

    try {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }

        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        const playBeep = (freq_start, freq_end, startTime, duration) => {
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            oscillator.type = 'square'; // sci-fi harsh buzzing tone
            
            // Frequency drop effect (siren down-pitch)
            oscillator.frequency.setValueAtTime(freq_start, startTime);
            oscillator.frequency.exponentialRampToValueAtTime(freq_end, startTime + duration);

            // Fast attack and decay for the beep volume
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(0.15, startTime + 0.05); // Volume curve
            gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            oscillator.start(startTime);
            oscillator.stop(startTime + duration);
            activeOscillators.push(oscillator);
        };

        const now = audioCtx.currentTime;
        
        // Play an urgent 3-burst alarm: (e.g. bzz-bzz-bzz!)
        for (let i = 0; i < 3; i++) {
           playBeep(800, 400, now + (i * 0.3), 0.25);
        }

    } catch (err) {
        console.warn("Audio Context failed or blocked by browser:", err);
    }
};

export const stopSecurityBreachAlarm = () => {
  try {
    activeOscillators.forEach(osc => { try { osc.stop(); } catch(e) {} });
    activeOscillators = [];
  } catch(e) {
    // ignore
  }
};
