/**
 * AmbientAudioEngine — Chapter-specific procedural ambient soundscapes.
 *
 * All audio is 100% synthesized via Web Audio API — no files needed.
 * Each chapter has a unique ambient "fingerprint":
 *   - Drone: continuous low oscillator (mood / tonality)
 *   - Texture: filtered noise (wind, rain, decay)
 *   - Sparkle: scheduled bell/chime events (hope, holiness)
 *
 * Transitions are smooth parameter ramps so chapter changes feel
 * organic rather than abrupt.
 */

interface AmbientConfig {
  droneFreq: number;           // fundamental Hz
  droneType: OscillatorType;   // waveform character
  droneVol: number;            // 0-1
  droneLFORate: number;        // Hz — tremolo speed
  droneLFODepth: number;       // Hz — tremolo depth
  noiseFreq: number;           // bandpass center Hz
  noiseQ: number;              // bandpass resonance
  noiseVol: number;            // 0-1
  sparkleEnabled: boolean;
  sparkleIntervalMs: number;   // ms between sparkle events
  sparkleFreqs: number[];      // pool of note frequencies
  reverbSend: number;          // 0-1 reverb mix
}

// Chapter ambient fingerprints — tuned to narrative mood
const CHAPTER_CONFIGS: Record<number, AmbientConfig> = {
  1: { // City of Destruction — oppressive, urban dread
    droneFreq: 73.4, droneType: 'sawtooth', droneVol: 0.10,
    droneLFORate: 0.15, droneLFODepth: 3,
    noiseFreq: 380, noiseQ: 1.5, noiseVol: 0.09,
    sparkleEnabled: false, sparkleIntervalMs: 0, sparkleFreqs: [],
    reverbSend: 0.2,
  },
  2: { // Slough of Despond — murky, suffocating
    droneFreq: 55.0, droneType: 'sine', droneVol: 0.13,
    droneLFORate: 0.08, droneLFODepth: 1.5,
    noiseFreq: 180, noiseQ: 2.0, noiseVol: 0.13,
    sparkleEnabled: false, sparkleIntervalMs: 0, sparkleFreqs: [],
    reverbSend: 0.3,
  },
  3: { // Mt. Sinai — howling wind, lawful dread
    droneFreq: 82.4, droneType: 'sawtooth', droneVol: 0.09,
    droneLFORate: 0.3, droneLFODepth: 6,
    noiseFreq: 900, noiseQ: 0.8, noiseVol: 0.16,
    sparkleEnabled: false, sparkleIntervalMs: 0, sparkleFreqs: [],
    reverbSend: 0.4,
  },
  4: { // Wicket Gate — hopeful, expectant
    droneFreq: 98.0, droneType: 'sine', droneVol: 0.07,
    droneLFORate: 0.12, droneLFODepth: 1,
    noiseFreq: 600, noiseQ: 1.2, noiseVol: 0.04,
    sparkleEnabled: true, sparkleIntervalMs: 4500, sparkleFreqs: [523, 659, 784],
    reverbSend: 0.5,
  },
  5: { // Interpreter's House — warm, pedagogical
    droneFreq: 110.0, droneType: 'sine', droneVol: 0.06,
    droneLFORate: 0.1, droneLFODepth: 0.5,
    noiseFreq: 450, noiseQ: 1.5, noiseVol: 0.03,
    sparkleEnabled: true, sparkleIntervalMs: 6000, sparkleFreqs: [440, 550, 660, 880],
    reverbSend: 0.6,
  },
  6: { // Hill of the Cross — holy, radiant, burden lifted
    droneFreq: 130.8, droneType: 'sine', droneVol: 0.08,
    droneLFORate: 0.07, droneLFODepth: 0.5,
    noiseFreq: 1200, noiseQ: 0.6, noiseVol: 0.02,
    sparkleEnabled: true, sparkleIntervalMs: 2500, sparkleFreqs: [659, 784, 1047, 1319],
    reverbSend: 0.7,
  },
  7: { // Palace Beautiful — stately, restful
    droneFreq: 110.0, droneType: 'sine', droneVol: 0.07,
    droneLFORate: 0.06, droneLFODepth: 0.8,
    noiseFreq: 550, noiseQ: 1.0, noiseVol: 0.025,
    sparkleEnabled: true, sparkleIntervalMs: 5000, sparkleFreqs: [523, 659, 784, 1047],
    reverbSend: 0.6,
  },
  8: { // Valley of Humiliation — dark, battle-ready
    droneFreq: 55.0, droneType: 'sawtooth', droneVol: 0.12,
    droneLFORate: 0.25, droneLFODepth: 4,
    noiseFreq: 260, noiseQ: 2.0, noiseVol: 0.11,
    sparkleEnabled: false, sparkleIntervalMs: 0, sparkleFreqs: [],
    reverbSend: 0.2,
  },
  9: { // Shadow of Death — oppressive whispers, terror
    droneFreq: 41.2, droneType: 'sawtooth', droneVol: 0.16,
    droneLFORate: 0.18, droneLFODepth: 5,
    noiseFreq: 140, noiseQ: 3.0, noiseVol: 0.15,
    sparkleEnabled: false, sparkleIntervalMs: 0, sparkleFreqs: [],
    reverbSend: 0.35,
  },
  10: { // Vanity Fair — chaotic, dissonant
    droneFreq: 164.8, droneType: 'square', droneVol: 0.07,
    droneLFORate: 0.5, droneLFODepth: 8,
    noiseFreq: 1100, noiseQ: 0.9, noiseVol: 0.07,
    sparkleEnabled: false, sparkleIntervalMs: 0, sparkleFreqs: [],
    reverbSend: 0.15,
  },
  11: { // Doubting Castle — most desolate, crushing
    droneFreq: 49.0, droneType: 'sawtooth', droneVol: 0.18,
    droneLFORate: 0.05, droneLFODepth: 2,
    noiseFreq: 160, noiseQ: 4.0, noiseVol: 0.17,
    sparkleEnabled: false, sparkleIntervalMs: 0, sparkleFreqs: [],
    reverbSend: 0.4,
  },
  12: { // Celestial City — ethereal, triumphant
    droneFreq: 130.8, droneType: 'sine', droneVol: 0.05,
    droneLFORate: 0.04, droneLFODepth: 0.3,
    noiseFreq: 2200, noiseQ: 0.4, noiseVol: 0.01,
    sparkleEnabled: true, sparkleIntervalMs: 1200, sparkleFreqs: [784, 1047, 1319, 1568, 2093],
    reverbSend: 0.85,
  },
};

const DEFAULT_CONFIG = CHAPTER_CONFIGS[1];

export class AmbientAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  // Drone chain: osc → droneGain → masterGain
  private droneOsc: OscillatorNode | null = null;
  private droneGain: GainNode | null = null;
  private droneLFO: OscillatorNode | null = null;
  private droneLFOGain: GainNode | null = null;

  // Noise chain: noiseSource → noiseFilter → noiseGain → masterGain
  private noiseSource: AudioBufferSourceNode | null = null;
  private noiseFilter: BiquadFilterNode | null = null;
  private noiseGain: GainNode | null = null;

  // Reverb (simple convolver-based or manual feedback delay)
  private reverbGain: GainNode | null = null;
  private delayNode: DelayNode | null = null;
  private feedbackGain: GainNode | null = null;

  // Sparkle scheduler
  private sparkleHandle: ReturnType<typeof setTimeout> | null = null;
  private sparkleEnabled = false;
  private sparkleIntervalMs = 5000;
  private sparkleFreqs: number[] = [];
  private volume = 0.35;
  private running = false;
  private currentChapter = 1;

  /** Initialize and start the ambient engine. */
  init(chapter: number): void {
    if (!this.ctx) {
      this.buildGraph();
    }
    if (!this.running) {
      this.startNodes();
      this.running = true;
    }
    this.applyConfig(CHAPTER_CONFIGS[chapter] ?? DEFAULT_CONFIG, 0);
    this.currentChapter = chapter;
    this.rescheduleSparkle();
  }

  /** Smoothly crossfade to a new chapter's atmosphere. */
  crossfadeTo(chapter: number, durationMs = 3000): void {
    if (!this.ctx || chapter === this.currentChapter) return;
    const config = CHAPTER_CONFIGS[chapter] ?? DEFAULT_CONFIG;
    this.applyConfig(config, durationMs / 1000);
    this.currentChapter = chapter;
    this.rescheduleSparkle();
  }

  /** Fade to silence for dramatic moments. */
  setSilence(durationMs = 2000): void {
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(t);
    this.masterGain.gain.linearRampToValueAtTime(0, t + durationMs / 1000);
  }

  /** Restore from silence. */
  restore(durationMs = 1500): void {
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(t);
    this.masterGain.gain.linearRampToValueAtTime(this.volume, t + durationMs / 1000);
  }

  setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.ctx && this.masterGain) {
      const t = this.ctx.currentTime;
      this.masterGain.gain.linearRampToValueAtTime(this.volume, t + 0.1);
    }
  }

  resume(): void {
    if (this.ctx?.state === 'suspended') this.ctx.resume();
  }

  destroy(): void {
    this.clearSparkle();
    this.droneOsc?.stop();
    this.droneLFO?.stop();
    this.noiseSource?.stop();
    this.ctx?.close();
    this.ctx = null;
    this.masterGain = null;
    this.droneOsc = null;
    this.droneGain = null;
    this.droneLFO = null;
    this.droneLFOGain = null;
    this.noiseSource = null;
    this.noiseFilter = null;
    this.noiseGain = null;
    this.running = false;
  }

  // ── Private ──────────────────────────────────────────────────────────────

  private buildGraph(): void {
    try {
      this.ctx = new AudioContext();
    } catch {
      return;
    }
    const ctx = this.ctx;

    // Master output gain
    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = this.volume;
    this.masterGain.connect(ctx.destination);

    // ── Drone chain ──────────────────────────────────────────────────
    this.droneLFO = ctx.createOscillator();
    this.droneLFO.type = 'sine';
    this.droneLFO.frequency.value = 0.1;

    this.droneLFOGain = ctx.createGain();
    this.droneLFOGain.gain.value = 2;

    this.droneOsc = ctx.createOscillator();
    this.droneOsc.type = 'sine';
    this.droneOsc.frequency.value = 73;

    this.droneGain = ctx.createGain();
    this.droneGain.gain.value = 0;

    this.droneLFO.connect(this.droneLFOGain);
    this.droneLFOGain.connect(this.droneOsc.frequency);
    this.droneOsc.connect(this.droneGain);
    this.droneGain.connect(this.masterGain);

    // ── Noise chain ──────────────────────────────────────────────────
    const noiseBuffer = this.createNoiseBuffer(ctx, 3); // 3s looping noise
    this.noiseSource = ctx.createBufferSource();
    this.noiseSource.buffer = noiseBuffer;
    this.noiseSource.loop = true;

    this.noiseFilter = ctx.createBiquadFilter();
    this.noiseFilter.type = 'bandpass';
    this.noiseFilter.frequency.value = 400;
    this.noiseFilter.Q.value = 1.5;

    this.noiseGain = ctx.createGain();
    this.noiseGain.gain.value = 0;

    this.noiseSource.connect(this.noiseFilter);
    this.noiseFilter.connect(this.noiseGain);
    this.noiseGain.connect(this.masterGain);

    // ── Simple feedback delay reverb ─────────────────────────────────
    this.delayNode = ctx.createDelay(2.0);
    this.delayNode.delayTime.value = 0.35;
    this.feedbackGain = ctx.createGain();
    this.feedbackGain.gain.value = 0.38;
    this.reverbGain = ctx.createGain();
    this.reverbGain.gain.value = 0.2;

    this.droneGain.connect(this.reverbGain);
    this.reverbGain.connect(this.delayNode);
    this.delayNode.connect(this.feedbackGain);
    this.feedbackGain.connect(this.delayNode);
    this.delayNode.connect(this.masterGain);
  }

  private startNodes(): void {
    this.droneOsc?.start();
    this.droneLFO?.start();
    this.noiseSource?.start();
  }

  private applyConfig(cfg: AmbientConfig, rampSec: number): void {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const at = t + (rampSec > 0 ? rampSec : 0.05);

    this.ramp(this.droneOsc?.frequency, cfg.droneFreq, t, at);
    this.ramp(this.droneGain?.gain, cfg.droneVol, t, at);
    this.ramp(this.droneLFO?.frequency, cfg.droneLFORate, t, at);
    this.ramp(this.droneLFOGain?.gain, cfg.droneLFODepth, t, at);
    this.ramp(this.noiseFilter?.frequency, cfg.noiseFreq, t, at);
    this.ramp(this.noiseGain?.gain, cfg.noiseVol, t, at);
    if (this.noiseFilter) this.noiseFilter.Q.value = cfg.noiseQ;
    if (this.reverbGain) this.ramp(this.reverbGain.gain, cfg.reverbSend * 0.25, t, at);
    if (this.droneOsc) this.droneOsc.type = cfg.droneType;

    this.sparkleEnabled = cfg.sparkleEnabled;
    this.sparkleIntervalMs = cfg.sparkleIntervalMs;
    this.sparkleFreqs = cfg.sparkleFreqs;
  }

  private ramp(
    param: AudioParam | undefined,
    value: number,
    currentTime: number,
    targetTime: number,
  ): void {
    if (!param) return;
    param.cancelScheduledValues(currentTime);
    param.setValueAtTime(param.value, currentTime);
    param.linearRampToValueAtTime(value, targetTime);
  }

  private createNoiseBuffer(ctx: AudioContext, durationSec: number): AudioBuffer {
    const length = ctx.sampleRate * durationSec;
    const buf = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buf;
  }

  // ── Sparkle scheduler ───────────────────────────────────────────────────

  private rescheduleSparkle(): void {
    this.clearSparkle();
    if (!this.sparkleEnabled || this.sparkleIntervalMs <= 0) return;
    const schedule = () => {
      if (!this.sparkleEnabled) return;
      this.fireSparkle();
      const jitter = 0.6 + Math.random() * 0.8; // ±40% jitter
      this.sparkleHandle = setTimeout(schedule, this.sparkleIntervalMs * jitter);
    };
    this.sparkleHandle = setTimeout(schedule, this.sparkleIntervalMs * 0.5);
  }

  private clearSparkle(): void {
    if (this.sparkleHandle !== null) {
      clearTimeout(this.sparkleHandle);
      this.sparkleHandle = null;
    }
  }

  private fireSparkle(): void {
    if (!this.ctx || !this.masterGain || this.sparkleFreqs.length === 0) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;

    // Pick 1-3 harmonically related notes
    const root = this.sparkleFreqs[Math.floor(Math.random() * this.sparkleFreqs.length)];
    const notes = [root];
    if (Math.random() > 0.5 && this.sparkleFreqs.length > 1) {
      const upper = this.sparkleFreqs.find(f => f > root);
      if (upper) notes.push(upper);
    }

    notes.forEach((freq, idx) => {
      const delay = idx * 0.07;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = freq;

      g.gain.setValueAtTime(0, t + delay);
      g.gain.linearRampToValueAtTime(0.06 * this.volume, t + delay + 0.03);
      g.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.8);

      osc.connect(g);
      g.connect(this.masterGain!);
      osc.start(t + delay);
      osc.stop(t + delay + 0.9);
    });
  }

  // ── One-shot effects ───────────────────────────────────────────────────

  /** Chapter title stinger — unique 3-note motif per chapter mood. */
  playChapterStinger(chapter: number): void {
    if (!this.ctx || !this.masterGain) return;
    const ctx = this.ctx;
    const t = ctx.currentTime + 0.05;

    const dark = chapter >= 9 && chapter <= 11;
    const holy = chapter === 6 || chapter === 12;

    const motif = holy
      ? [{ freq: 523, delay: 0 }, { freq: 659, delay: 0.14 }, { freq: 784, delay: 0.28 }, { freq: 1047, delay: 0.42 }]
      : dark
        ? [{ freq: 220, delay: 0 }, { freq: 185, delay: 0.18 }, { freq: 165, delay: 0.36 }]
        : [{ freq: 392, delay: 0 }, { freq: 440, delay: 0.12 }, { freq: 523, delay: 0.24 }];

    motif.forEach(({ freq, delay }) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = holy ? 'sine' : dark ? 'sawtooth' : 'triangle';
      osc.frequency.value = freq;
      const vol = 0.12 * this.volume;
      g.gain.setValueAtTime(vol, t + delay);
      g.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.6);
      osc.connect(g);
      g.connect(this.masterGain!);
      osc.start(t + delay);
      osc.stop(t + delay + 0.7);
    });
  }

  /** Boss phase escalation — deep ominous boom. */
  playBossWarning(): void {
    if (!this.ctx || !this.masterGain) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;

    // Low thud
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(60, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.5);
    g.gain.setValueAtTime(0.25 * this.volume, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.65);

    // Harmonic dissonance
    [180, 267].forEach((freq, i) => {
      const o2 = ctx.createOscillator();
      const g2 = ctx.createGain();
      o2.type = 'sawtooth';
      o2.frequency.value = freq;
      g2.gain.setValueAtTime(0, t + i * 0.08);
      g2.gain.linearRampToValueAtTime(0.06 * this.volume, t + i * 0.08 + 0.04);
      g2.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
      o2.connect(g2);
      g2.connect(this.masterGain!);
      o2.start(t + i * 0.08);
      o2.stop(t + 0.8);
    });
  }

  /** Celestial arrival — ascending radiant chord. */
  playCelestialArrival(): void {
    if (!this.ctx || !this.masterGain) return;
    const ctx = this.ctx;
    const t = ctx.currentTime + 0.1;

    const chord = [261, 329, 392, 523, 659, 784, 1047];
    chord.forEach((freq, i) => {
      const delay = i * 0.12;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq * 0.5, t + delay);
      osc.frequency.linearRampToValueAtTime(freq, t + delay + 0.3);
      g.gain.setValueAtTime(0, t + delay);
      g.gain.linearRampToValueAtTime(0.09 * this.volume, t + delay + 0.15);
      g.gain.setValueAtTime(0.09 * this.volume, t + delay + 1.5);
      g.gain.exponentialRampToValueAtTime(0.001, t + delay + 3.5);
      osc.connect(g);
      g.connect(this.masterGain!);
      osc.start(t + delay);
      osc.stop(t + delay + 4.0);
    });
  }
}
