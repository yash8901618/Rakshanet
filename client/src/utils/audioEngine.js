// Web Audio API Sound Engine
// Synthesizes spatial emergency sirens, warning warbles, and rescue step confirmation chimes

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.sirenOsc = null;
    this.sirenGain = null;
    this.isSirenPlaying = false;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Play Critical Level 5 FM Siren
  startSiren() {
    this.init();
    if (!this.ctx || this.isSirenPlaying) return;

    try {
      this.isSirenPlaying = true;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, now);
      
      // Frequency Modulation (Warble 440Hz -> 880Hz)
      const lfo = this.ctx.createOscillator();
      lfo.frequency.setValueAtTime(2.5, now); // 2.5 Hz warble rate
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(220, now);
      lfo.connect(osc.frequency);

      gain.gain.setValueAtTime(0.12, now);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      lfo.start();
      osc.start();

      this.sirenOsc = osc;
      this.sirenGain = gain;
      this.sirenLfo = lfo;
    } catch (e) {
      console.warn('Audio siren start failed', e);
    }
  }

  stopSiren() {
    if (this.sirenOsc) {
      try {
        this.sirenOsc.stop();
        this.sirenLfo.stop();
        this.sirenOsc.disconnect();
      } catch (e) {}
      this.sirenOsc = null;
      this.sirenGain = null;
      this.sirenLfo = null;
    }
    this.isSirenPlaying = false;
  }

  // Play Uplifting Rescue Chime (Rescued -1)
  playRescueChime() {
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 arpeggio

      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.15, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.4);
      });
    } catch (e) {}
  }

  // Play Alert Beep based on Severity
  playAlert(severity = 3) {
    this.init();
    if (!this.ctx) return;

    if (severity >= 5) {
      this.startSiren();
      setTimeout(() => this.stopSiren(), 4000);
      return;
    }

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = severity >= 4 ? 'square' : 'triangle';
      osc.frequency.setValueAtTime(severity >= 4 ? 800 : 520, now);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch (e) {}
  }
}

export const audioEngine = new AudioEngine();
