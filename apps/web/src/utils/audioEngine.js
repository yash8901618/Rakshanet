// Spatial Audio Synthesizer Engine using Web Audio API
// Maps incident safe-exit vectors to stereo/3D spatial coordinates and scales tone urgency by severity (Levels 1-5).

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.initialized = false;
  }

  init() {
    if (this.ctx && this.ctx.state !== 'closed') {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.initialized = true;
      }
    } catch (err) {
      console.warn('[AUDIO ENGINE] Web Audio API init failed:', err);
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  /**
   * Play spatial alert directed towards safe exit with urgency scaled by severity
   * @param {number} severity - 1 (Low) to 5 (Critical)
   * @param {Array<number>} [safeVector] - Direction [x, y, z] to nearest safe exit
   */
  playAlert(severity = 3, safeVector = [0, 0, -1]) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const now = this.ctx.currentTime;
    const clampedSev = Math.min(5, Math.max(1, severity));

    // 1. Setup Spatial Panner
    let panner;
    try {
      if (this.ctx.createPanner) {
        panner = this.ctx.createPanner();
        panner.panningModel = 'HRTF';
        panner.distanceModel = 'inverse';
        const vx = safeVector[0] || 0;
        const vy = safeVector[1] || 0;
        const vz = safeVector[2] || -1;
        const len = Math.sqrt(vx * vx + vy * vy + vz * vz) || 1;
        
        panner.positionX.setValueAtTime((vx / len) * 3, now);
        panner.positionY.setValueAtTime((vy / len) * 1.5, now);
        panner.positionZ.setValueAtTime((vz / len) * 3, now);
      } else if (this.ctx.createStereoPanner) {
        panner = this.ctx.createStereoPanner();
        const panX = Math.max(-1, Math.min(1, (safeVector[0] || 0) / 10));
        panner.pan.setValueAtTime(panX, now);
      }
    } catch (e) {
      panner = null;
    }

    // 2. Setup Master Gain
    const masterGain = this.ctx.createGain();
    const volumeBySev = { 1: 0.2, 2: 0.35, 3: 0.5, 4: 0.7, 5: 0.9 }[clampedSev] || 0.5;
    masterGain.gain.setValueAtTime(volumeBySev, now);

    if (panner) {
      panner.connect(masterGain);
    }
    masterGain.connect(this.ctx.destination);

    const inputNode = panner || masterGain;

    // 3. Synthesize urgency tones based on severity
    if (clampedSev === 1) {
      // Info / Low: Soft chime (587Hz -> 880Hz)
      this._playTone(inputNode, 587, now, 0.2, 'sine');
      this._playTone(inputNode, 880, now + 0.18, 0.3, 'sine');
    } else if (clampedSev === 2) {
      // Caution: Warning dual tone
      this._playTone(inputNode, 700, now, 0.18, 'triangle');
      this._playTone(inputNode, 920, now + 0.18, 0.18, 'triangle');
      this._playTone(inputNode, 700, now + 0.36, 0.18, 'triangle');
      this._playTone(inputNode, 920, now + 0.54, 0.25, 'triangle');
    } else if (clampedSev === 3) {
      // Warning: Pulsed alarm (880Hz / 1175Hz)
      for (let i = 0; i < 3; i++) {
        const t = now + i * 0.18;
        this._playTone(inputNode, 880, t, 0.08, 'sawtooth');
        this._playTone(inputNode, 1175, t + 0.09, 0.08, 'sawtooth');
      }
    } else if (clampedSev === 4) {
      // High: Rapid emergency siren
      for (let i = 0; i < 4; i++) {
        const t = now + i * 0.16;
        this._playTone(inputNode, 950, t, 0.07, 'sawtooth');
        this._playTone(inputNode, 1300, t + 0.08, 0.07, 'square');
      }
    } else if (clampedSev === 5) {
      // Critical: Continuous multi-oscillator frequency modulated klaxon siren
      this._playCriticalKlaxon(inputNode, now);
    }
  }

  _playTone(destination, freq, startTime, duration, type = 'sine') {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.exponentialRampToValueAtTime(0.7, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(destination);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
  }

  _playCriticalKlaxon(destination, startTime) {
    if (!this.ctx) return;
    for (let cycle = 0; cycle < 3; cycle++) {
      const cycleStart = startTime + cycle * 0.45;

      const osc = this.ctx.createOscillator();
      const subOsc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      subOsc.type = 'square';

      // Siren frequency sweep up and down
      osc.frequency.setValueAtTime(700, cycleStart);
      osc.frequency.exponentialRampToValueAtTime(1500, cycleStart + 0.2);
      osc.frequency.exponentialRampToValueAtTime(700, cycleStart + 0.4);

      subOsc.frequency.setValueAtTime(350, cycleStart);
      subOsc.frequency.exponentialRampToValueAtTime(750, cycleStart + 0.2);
      subOsc.frequency.exponentialRampToValueAtTime(350, cycleStart + 0.4);

      gain.gain.setValueAtTime(0.01, cycleStart);
      gain.gain.exponentialRampToValueAtTime(0.85, cycleStart + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.01, cycleStart + 0.42);

      osc.connect(gain);
      subOsc.connect(gain);
      gain.connect(destination);

      osc.start(cycleStart);
      subOsc.start(cycleStart);
      osc.stop(cycleStart + 0.44);
      subOsc.stop(cycleStart + 0.44);
    }
  }

  // Uplifting chime when saving trapped occupant
  playRescueChime() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(0.4, now);
    masterGain.connect(this.ctx.destination);

    this._playTone(masterGain, 523.25, now, 0.1, 'sine'); // C5
    this._playTone(masterGain, 659.25, now + 0.08, 0.1, 'sine'); // E5
    this._playTone(masterGain, 783.99, now + 0.16, 0.1, 'sine'); // G5
    this._playTone(masterGain, 1046.50, now + 0.24, 0.25, 'sine'); // C6
  }

  // Acknowledgment confirmation
  playAckChime() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(0.3, now);
    masterGain.connect(this.ctx.destination);

    this._playTone(masterGain, 523.25, now, 0.1, 'sine');
    this._playTone(masterGain, 659.25, now + 0.08, 0.1, 'sine');
    this._playTone(masterGain, 783.99, now + 0.16, 0.2, 'sine');
  }
}

export const audioEngine = new AudioEngine();
