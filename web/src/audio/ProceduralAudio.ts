/**
 * ProceduralAudio — Web Audio API synthesizer for UI/game sounds.
 * Generates all sounds programmatically; no audio files required.
 * Designed for Pilgrim's Progress's meditative, biblical tone.
 */
export class ProceduralAudio {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private enabled = true;
  private volume = 0.4;

  /** Throttle for typing clicks — minimum ms between clicks */
  private lastTypingClick = 0;
  private typingThrottleMs = 60;

  constructor() {
    this.tryInit();
  }

  private tryInit(): void {
    try {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.ctx.destination);
    } catch {
      this.ctx = null;
    }
  }

  /** Resume context (must be called from a user interaction) */
  resume(): void {
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setEnabled(enabled: boolean): void { this.enabled = enabled; }
  setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain) this.masterGain.gain.value = this.volume;
  }

  private get ac(): AudioContext | null { return this.ctx; }
  private get out(): AudioNode | null { return this.masterGain; }

  /** Soft typewriter click for dialogue text reveal */
  playTypingClick(): void {
    if (!this.enabled || !this.ac || !this.out) return;
    const now = Date.now();
    if (now - this.lastTypingClick < this.typingThrottleMs) return;
    this.lastTypingClick = now;

    const t = this.ac.currentTime;
    const osc = this.ac.createOscillator();
    const gain = this.ac.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800 + Math.random() * 200, t);
    osc.frequency.exponentialRampToValueAtTime(400, t + 0.04);

    gain.gain.setValueAtTime(0.06, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(gain);
    gain.connect(this.out);
    osc.start(t);
    osc.stop(t + 0.06);
  }

  /** UI button hover — brief high tone */
  playUIHover(): void {
    if (!this.enabled || !this.ac || !this.out) return;
    const t = this.ac.currentTime;
    const osc = this.ac.createOscillator();
    const gain = this.ac.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(1400, t + 0.08);

    gain.gain.setValueAtTime(0.04, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(gain);
    gain.connect(this.out);
    osc.start(t);
    osc.stop(t + 0.09);
  }

  /** UI button click — satisfying thud */
  playUIClick(): void {
    if (!this.enabled || !this.ac || !this.out) return;
    const t = this.ac.currentTime;

    // Low click
    const osc = this.ac.createOscillator();
    const gain = this.ac.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.06);
    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    osc.connect(gain);
    gain.connect(this.out);
    osc.start(t);
    osc.stop(t + 0.09);

    // High click accent
    const osc2 = this.ac.createOscillator();
    const gain2 = this.ac.createGain();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(1600, t);
    gain2.gain.setValueAtTime(0.03, t);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    osc2.connect(gain2);
    gain2.connect(this.out);
    osc2.start(t);
    osc2.stop(t + 0.05);
  }

  /** Dialogue advance — soft chime */
  playDialogueAdvance(): void {
    if (!this.enabled || !this.ac || !this.out) return;
    const t = this.ac.currentTime;
    const freqs = [440, 554, 659]; // A major chord

    freqs.forEach((freq, i) => {
      const osc = this.ac!.createOscillator();
      const gain = this.ac!.createGain();
      const delay = i * 0.03;

      osc.type = 'sine';
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(0, t + delay);
      gain.gain.linearRampToValueAtTime(0.07, t + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.4);

      osc.connect(gain);
      gain.connect(this.out!);
      osc.start(t + delay);
      osc.stop(t + delay + 0.5);
    });
  }

  /** Item / Bible card pickup — uplifting arpeggio */
  playPickup(): void {
    if (!this.enabled || !this.ac || !this.out) return;
    const t = this.ac.currentTime;
    const notes = [523, 659, 784, 1047]; // C5 arpeggio

    notes.forEach((freq, i) => {
      const osc = this.ac!.createOscillator();
      const gain = this.ac!.createGain();
      const delay = i * 0.07;

      osc.type = 'triangle';
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(0.12, t + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.3);

      osc.connect(gain);
      gain.connect(this.out!);
      osc.start(t + delay);
      osc.stop(t + delay + 0.35);
    });
  }

  /** Stat increase — warm positive tone */
  playStatGain(): void {
    if (!this.enabled || !this.ac || !this.out) return;
    const t = this.ac.currentTime;
    const osc = this.ac.createOscillator();
    const gain = this.ac.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.linearRampToValueAtTime(660, t + 0.15);

    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    osc.connect(gain);
    gain.connect(this.out);
    osc.start(t);
    osc.stop(t + 0.35);
  }

  /** Stat decrease — descending minor tone */
  playStatLoss(): void {
    if (!this.enabled || !this.ac || !this.out) return;
    const t = this.ac.currentTime;
    const osc = this.ac.createOscillator();
    const gain = this.ac.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.linearRampToValueAtTime(277, t + 0.2); // down a minor sixth

    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(gain);
    gain.connect(this.out);
    osc.start(t);
    osc.stop(t + 0.4);
  }

  /** Chapter complete — triumphant fanfare */
  playChapterComplete(): void {
    if (!this.enabled || !this.ac || !this.out) return;
    const t = this.ac.currentTime;

    // Major fanfare: C-E-G-C octave
    const melody = [
      { freq: 523, delay: 0,    dur: 0.15 },
      { freq: 659, delay: 0.12, dur: 0.15 },
      { freq: 784, delay: 0.24, dur: 0.15 },
      { freq: 1047, delay: 0.36, dur: 0.6 },
    ];

    melody.forEach(({ freq, delay, dur }) => {
      const osc = this.ac!.createOscillator();
      const gain = this.ac!.createGain();

      osc.type = 'triangle';
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(0.18, t + delay);
      gain.gain.setValueAtTime(0.18, t + delay + dur * 0.7);
      gain.gain.exponentialRampToValueAtTime(0.001, t + delay + dur);

      osc.connect(gain);
      gain.connect(this.out!);
      osc.start(t + delay);
      osc.stop(t + delay + dur + 0.05);
    });
  }

  /** Player hit / damage — harsh buzz */
  playHit(): void {
    if (!this.enabled || !this.ac || !this.out) return;
    const t = this.ac.currentTime;

    const buf = this.ac.createBuffer(1, this.ac.sampleRate * 0.08, this.ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    }

    const src = this.ac.createBufferSource();
    src.buffer = buf;
    const gain = this.ac.createGain();
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    src.connect(gain);
    gain.connect(this.out);
    src.start(t);
  }

  /** Door/gate open — creak-like sweep */
  playDoorOpen(): void {
    if (!this.enabled || !this.ac || !this.out) return;
    const t = this.ac.currentTime;
    const osc = this.ac.createOscillator();
    const gain = this.ac.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, t);
    osc.frequency.linearRampToValueAtTime(200, t + 0.3);

    gain.gain.setValueAtTime(0.05, t);
    gain.gain.setValueAtTime(0.05, t + 0.25);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    const filter = this.ac.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 400;
    filter.Q.value = 5;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.out);
    osc.start(t);
    osc.stop(t + 0.45);
  }

  /** Footstep on ground — subtle thud */
  playFootstep(): void {
    if (!this.enabled || !this.ac || !this.out) return;
    const t = this.ac.currentTime;
    const osc = this.ac.createOscillator();
    const gain = this.ac.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(120 + Math.random() * 20, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.06);

    gain.gain.setValueAtTime(0.06, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

    osc.connect(gain);
    gain.connect(this.out);
    osc.start(t);
    osc.stop(t + 0.08);
  }

  destroy(): void {
    this.ctx?.close();
    this.ctx = null;
    this.masterGain = null;
  }
}
