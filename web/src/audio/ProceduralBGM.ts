/**
 * ProceduralBGM — 12-chapter musical BGM via Web Audio API step sequencer.
 * No audio files needed. Bass + pad + lead + kick + hat voices per chapter.
 * Uses lookahead scheduling for sample-accurate timing.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

/** [scale_degree, octave_offset, velocity_0to1, length_in_16th_notes] */
type NS = [number, number, number, number];
const N  = (d: number, o: number, v: number, l: number): NS => [d, o, v, l];
const Rx = (l = 1): NS => [-1, 0, 0, l];

interface FlatNote { hz: number; vel: number; durSec: number }

interface BGMConfig {
  bpm: number;
  rootMidi: number;
  scale: number[];
  bassPattern: NS[];    // steps sum = 16
  leadPattern: NS[];    // steps sum = 32
  chords: number[][];   // scale degree triads, one chord per bar, cycling
  padFilterHz: number;
  padAttack: number;
  useDrums: boolean;
  kickSteps: boolean[];  // 16 entries
  hatSteps: boolean[];   // 16 entries
  bassVol: number;
  leadVol: number;
  padVol: number;
  drumsVol: number;
  reverbAmt: number;
}

// ── Scales ────────────────────────────────────────────────────────────────────
const MINOR    = [0, 2, 3, 5, 7, 8, 10];
const MAJOR    = [0, 2, 4, 5, 7, 9, 11];
const DORIAN   = [0, 2, 3, 5, 7, 9, 10];
const PHRYGIAN = [0, 1, 3, 5, 7, 8, 10];
const HARM_MIN = [0, 2, 3, 5, 7, 8, 11];
const MIXOLYD  = [0, 2, 4, 5, 7, 9, 10];

const midiToHz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

// ── Chapter BGM Configs ───────────────────────────────────────────────────────
// rootMidi = bass octave root. Bass plays oct=0, lead plays oct=+1 or +2.
// Chapter 0 = dedicated battle theme (intense, chromatic A minor).
const CONFIGS: Record<number, BGMConfig> = {

  // Ch0 — Battle Theme: A natural minor, BPM 148 — raw tension, aggressive
  0: {
    bpm: 148, rootMidi: 33 /* A1 */, scale: MINOR,
    bassPattern: [
      N(0,0,.95,1),N(0,0,.85,1),Rx(1),N(4,0,.90,1),
      N(0,0,.95,1),Rx(1),N(3,0,.88,1),Rx(1),
      N(0,0,.92,1),N(0,0,.85,1),N(4,0,.90,1),Rx(1),
      N(5,0,.88,1),N(0,0,.85,1),N(4,0,.90,1),Rx(1),
    ], // 1*16=16
    leadPattern: [
      N(4,1,.85,1),N(5,1,.82,1),N(4,1,.80,1),Rx(1),
      N(2,1,.85,2),N(1,1,.80,1),Rx(1),N(4,1,.88,2),
      N(5,1,.85,1),Rx(1),N(2,1,.80,2),N(0,1,.85,2),
      Rx(2),N(4,1,.85,1),N(5,1,.85,1),N(6,1,.90,1),N(5,1,.85,1),
      N(4,1,.85,2),N(2,1,.80,1),N(1,1,.82,1),Rx(2),N(4,1,.88,2),N(0,1,.82,1),Rx(1),
    ], // bar1: 1+1+1+1+2+1+1+2+1+1+2+2=16, bar2: 2+1+1+1+1+2+1+1+2+2+1+1=16 → 32
    chords: [[0,2,4],[4,6,1],[3,5,0],[4,6,1]],
    padFilterHz: 500, padAttack: 0.08,
    useDrums: true,
    kickSteps: [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0].map(Boolean),
    hatSteps:  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1].map(Boolean),
    bassVol: 0.35, leadVol: 0.24, padVol: 0.06, drumsVol: 0.30, reverbAmt: 0.08,
  },

  // Ch1 — City of Destruction: D natural minor, BPM 90 — oppressive, driving
  1: {
    bpm: 90, rootMidi: 38 /* D2 */, scale: MINOR,
    bassPattern: [
      N(0,0,.90,2),N(0,0,.75,1),Rx(1),N(0,0,.85,2),N(4,0,.95,2),Rx(2),
      N(2,0,.80,2),N(3,0,.75,2),Rx(2),
    ], // 2+1+1+2+2+2+2+2+2=16
    leadPattern: [
      N(2,1,.70,2),N(1,1,.65,2),N(0,1,.70,2),Rx(2),N(5,1,.65,2),N(4,1,.60,2),Rx(2),N(0,1,.70,2),
      N(2,1,.75,2),N(3,1,.70,2),Rx(2),N(4,1,.80,2),N(5,1,.70,2),N(4,1,.65,2),N(3,1,.60,2),N(2,1,.70,2),
    ], // 16+16=32
    chords: [[0,2,4],[5,0,2],[2,4,6],[3,5,0]],
    padFilterHz: 550, padAttack: 0.5,
    useDrums: true,
    kickSteps: [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0].map(Boolean),
    hatSteps:  [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0].map(Boolean),
    bassVol: 0.30, leadVol: 0.18, padVol: 0.10, drumsVol: 0.24, reverbAmt: 0.16,
  },

  // Ch2 — Slough of Despond: Ab natural minor, BPM 52 — murky, suffocating
  2: {
    bpm: 52, rootMidi: 44 /* Ab2 */, scale: MINOR,
    bassPattern: [
      Rx(4),N(0,0,.70,4),Rx(4),N(4,0,.60,4),
    ], // 4+4+4+4=16
    leadPattern: [
      Rx(4),N(2,1,.50,4),Rx(4),N(1,1,.45,4),
      N(0,1,.60,8),Rx(4),N(4,1,.50,4),
    ], // 4+4+4+4+8+4+4=32
    chords: [[0,2,4],[3,5,0],[4,6,1],[3,5,0]],
    padFilterHz: 380, padAttack: 1.0,
    useDrums: false,
    kickSteps: new Array(16).fill(false),
    hatSteps:  new Array(16).fill(false),
    bassVol: 0.20, leadVol: 0.12, padVol: 0.13, drumsVol: 0, reverbAmt: 0.32,
  },

  // Ch3 — Mt. Sinai: E phrygian, BPM 74 — howling wind, lawful dread
  3: {
    bpm: 74, rootMidi: 40 /* E2 */, scale: PHRYGIAN,
    bassPattern: [
      N(0,0,.85,2),N(1,0,.80,2),N(2,0,.75,2),N(3,0,.80,2),
      N(4,0,.90,2),Rx(2),N(3,0,.75,2),Rx(2),
    ], // 2*8=16
    leadPattern: [
      N(0,1,.70,2),N(1,1,.70,2),N(2,1,.72,2),N(3,1,.70,2),
      N(4,1,.75,2),N(5,1,.70,2),N(4,1,.65,2),N(3,1,.60,2),
      Rx(2),N(4,1,.80,3),N(4,1,.70,2),N(2,1,.70,2),
      N(0,1,.80,3),Rx(2),N(1,1,.60,2),
    ], // 8*2=16, then 2+3+2+2+3+2+2=16 → total 32
    chords: [[0,2,4],[1,3,5],[2,4,6],[1,3,5]],
    padFilterHz: 650, padAttack: 0.35,
    useDrums: true,
    kickSteps: [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0].map(Boolean),
    hatSteps:  new Array(16).fill(false),
    bassVol: 0.26, leadVol: 0.16, padVol: 0.11, drumsVol: 0.20, reverbAmt: 0.38,
  },

  // Ch4 — Wicket Gate: C major, BPM 100 — hopeful, expectant, moving forward
  4: {
    bpm: 100, rootMidi: 48 /* C3 */, scale: MAJOR,
    bassPattern: [
      N(0,0,.80,2),N(2,0,.70,2),N(4,0,.75,2),N(2,0,.70,2),
      N(0,0,.80,2),N(2,0,.70,2),N(4,0,.75,2),N(6,0,.65,2),
    ], // 2*8=16 — arpeggiated C-E-G-E / C-E-G-B
    leadPattern: [
      // Bar1: E4 G4 A4(long) G4 E4 C4(held) — hopeful ascending
      N(2,1,.65,2),N(4,1,.68,2),N(5,1,.70,3),N(4,1,.68,2),N(2,1,.65,2),N(0,1,.72,5),
      // Bar2: G4 A4 B4(long) A4 G4(held) C4(held)
      N(4,1,.72,2),N(5,1,.70,2),N(6,1,.75,3),N(5,1,.70,2),N(4,1,.72,4),N(0,1,.65,3),
    ], // bar1: 2+2+3+2+2+5=16, bar2: 2+2+3+2+4+3=16 → total 32
    chords: [[0,2,4],[4,6,1],[5,0,2],[3,5,0]],
    padFilterHz: 1200, padAttack: 0.30,
    useDrums: true,
    kickSteps: [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0].map(Boolean),
    hatSteps:  [0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0].map(Boolean),
    bassVol: 0.26, leadVol: 0.20, padVol: 0.11, drumsVol: 0.18, reverbAmt: 0.22,
  },

  // Ch5 — Interpreter's House: F major, BPM 84 — warm, pedagogical, safe
  5: {
    bpm: 84, rootMidi: 41 /* F2 */, scale: MAJOR,
    bassPattern: [
      N(0,0,.80,2),N(1,0,.65,2),N(2,0,.70,2),N(0,0,.75,2),
      N(5,-1,.75,2),N(4,-1,.70,2),N(5,-1,.72,2),N(0,0,.78,2),
    ], // 2*8=16 — stepwise F-G-A-F / Bb-A-Bb-F
    leadPattern: [
      // Bar1: A3 C4 D4 C4 A3 F3 G3 A3 — flowing warm
      N(2,1,.68,2),N(4,1,.72,2),N(5,1,.74,2),N(4,1,.70,2),
      N(2,1,.68,2),N(0,1,.72,2),N(1,1,.65,2),N(2,1,.68,2),
      // Bar2: C4(held) D4 C4 A3(long) F3(long) rest
      N(4,1,.75,4),N(5,1,.70,2),N(4,1,.68,2),N(2,1,.70,3),N(0,1,.72,2),Rx(3),
    ], // bar1: 2*8=16, bar2: 4+2+2+3+2+3=16 → total 32
    chords: [[0,2,4],[4,6,1],[5,0,2],[1,3,5]],
    padFilterHz: 900, padAttack: 0.45,
    useDrums: true,
    kickSteps: [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0].map(Boolean),
    hatSteps:  [0,0,0,0,1,0,0,0,0,0,0,0,1,0,1,0].map(Boolean),
    bassVol: 0.24, leadVol: 0.22, padVol: 0.12, drumsVol: 0.16, reverbAmt: 0.28,
  },

  // Ch6 — Hill of the Cross: G major, BPM 94 — holy, radiant, triumphant
  6: {
    bpm: 94, rootMidi: 43 /* G2 */, scale: MAJOR,
    bassPattern: [
      N(0,0,.85,2),N(4,0,.80,2),N(0,0,.82,2),N(4,0,.78,2),
      N(5,0,.80,2),N(6,0,.75,2),N(4,0,.82,2),N(0,0,.88,2),
    ], // 2*8=16
    leadPattern: [
      N(4,1,.78,2),N(5,1,.80,2),N(6,1,.85,2),N(4,1,.80,2),
      N(6,1,.88,3),N(5,1,.80,2),N(4,1,.75,2),Rx(1),
      Rx(2),N(5,1,.75,2),N(4,1,.72,2),N(2,1,.78,2),
      N(4,1,.85,4),N(0,2,.70,4),
    ], // 2+2+2+2+3+2+2+1=16, then 2+2+2+2+4+4=16 → total 32
    chords: [[0,2,4],[4,6,1],[2,4,6],[3,5,0]],
    padFilterHz: 1800, padAttack: 0.25,
    useDrums: true,
    kickSteps: [1,0,0,0,0,0,1,0,1,0,0,0,0,0,1,0].map(Boolean),
    hatSteps:  [0,0,1,0,1,0,0,0,0,0,1,0,1,0,0,0].map(Boolean),
    bassVol: 0.28, leadVol: 0.22, padVol: 0.14, drumsVol: 0.22, reverbAmt: 0.20,
  },

  // Ch7 — Palace Beautiful: A major, BPM 76 — stately, restful, dignified
  7: {
    bpm: 76, rootMidi: 45 /* A2 */, scale: MAJOR,
    bassPattern: [
      N(0,0,.78,4),N(4,0,.72,4),
      N(0,0,.76,4),N(5,0,.70,4),
    ], // 4*4=16
    leadPattern: [
      N(2,1,.68,3),N(4,1,.72,3),N(5,1,.70,2),N(4,1,.68,2),N(2,1,.70,2),N(0,1,.74,4),
      N(4,1,.75,4),N(6,1,.72,2),N(5,1,.78,4),N(4,1,.72,2),N(2,1,.68,2),N(0,1,.72,2),
    ], // 3+3+2+2+2+4=16, then 4+2+4+2+2+2=16 → total 32
    chords: [[0,2,4],[4,6,1],[2,4,6],[3,5,0]],
    padFilterHz: 1100, padAttack: 0.55,
    useDrums: true,
    kickSteps: [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0].map(Boolean),
    hatSteps:  new Array(16).fill(false),
    bassVol: 0.22, leadVol: 0.20, padVol: 0.14, drumsVol: 0.14, reverbAmt: 0.30,
  },

  // Ch8 — Valley of Humiliation: D dorian, BPM 130 — battle, intense
  8: {
    bpm: 130, rootMidi: 38 /* D2 */, scale: DORIAN,
    bassPattern: [
      N(0,0,.90,1),N(0,0,.80,1),Rx(1),N(0,0,.85,1),
      N(4,0,.95,1),Rx(1),N(0,0,.88,1),Rx(1),
      N(0,0,.90,1),N(0,0,.80,1),Rx(1),N(4,0,.90,1),
      N(5,0,.85,1),Rx(1),N(4,0,.80,1),Rx(1),
    ], // 1*16=16
    leadPattern: [
      N(4,1,.80,1),N(5,1,.80,1),N(4,1,.75,1),Rx(1),
      N(2,1,.80,2),N(0,1,.75,1),Rx(1),
      N(4,1,.85,2),N(5,1,.80,1),N(4,1,.75,1),N(2,1,.70,2),N(0,1,.75,2),
      Rx(2),N(4,1,.80,1),N(5,1,.80,1),N(6,1,.85,1),N(5,1,.80,1),
      N(4,1,.80,2),N(2,1,.75,1),N(0,1,.80,1),Rx(2),N(4,1,.85,2),N(0,1,.75,1),Rx(1),
    ], // 1+1+1+1+2+1+1+2+1+1+2+2=16, then 2+1+1+1+1+2+1+1+2+2+1+1=16 → 32
    chords: [[0,2,4],[4,6,1],[3,5,0],[4,6,1]],
    padFilterHz: 700, padAttack: 0.15,
    useDrums: true,
    kickSteps: [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0].map(Boolean),
    hatSteps:  [0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1].map(Boolean),
    bassVol: 0.32, leadVol: 0.22, padVol: 0.08, drumsVol: 0.28, reverbAmt: 0.10,
  },

  // Ch9 — Shadow of Death: C# harmonic minor, BPM 66 — terror, oppression
  9: {
    bpm: 66, rootMidi: 37 /* C#2 */, scale: HARM_MIN,
    bassPattern: [
      N(0,0,.75,4),Rx(2),N(5,0,.65,2),
      N(4,0,.70,4),Rx(2),N(0,0,.70,2),
    ], // 4+2+2+4+2+2=16
    leadPattern: [
      N(0,1,.62,3),N(1,1,.58,1),N(2,1,.60,2),Rx(2),
      N(5,1,.65,3),N(4,1,.60,2),N(1,1,.55,3),
      Rx(4),N(6,1,.68,2),N(5,1,.62,2),N(4,1,.60,2),
      N(2,1,.58,2),N(1,1,.55,2),N(0,1,.62,2),
    ], // 3+1+2+2+3+2+3=16, then 4+2+2+2+2+2+2=16 → 32
    chords: [[0,2,4],[3,5,0],[4,6,1],[6,1,3]],
    padFilterHz: 420, padAttack: 0.70,
    useDrums: false,
    kickSteps: new Array(16).fill(false),
    hatSteps:  new Array(16).fill(false),
    bassVol: 0.22, leadVol: 0.14, padVol: 0.12, drumsVol: 0, reverbAmt: 0.38,
  },

  // Ch10 — Vanity Fair: Bb mixolydian, BPM 140 — chaotic, market, worldly
  10: {
    bpm: 140, rootMidi: 46 /* Bb2 */, scale: MIXOLYD,
    bassPattern: [
      N(0,0,.85,1),N(0,0,.80,1),N(4,0,.80,1),Rx(1),
      N(0,0,.85,1),N(2,0,.75,1),N(0,0,.80,1),N(4,0,.85,1),
      N(5,0,.80,1),Rx(1),N(4,0,.75,1),N(2,0,.80,1),
      N(0,0,.85,1),Rx(1),N(6,0,.70,1),Rx(1),
    ], // 1*16=16
    leadPattern: [
      N(4,1,.80,1),N(5,1,.80,1),N(6,1,.80,1),N(5,1,.75,1),
      N(4,1,.80,2),N(2,1,.75,1),N(4,1,.80,1),
      N(5,1,.80,1),N(6,1,.80,1),N(4,1,.75,1),Rx(1),
      N(5,1,.70,1),N(4,1,.75,1),Rx(2),
      N(0,1,.75,2),N(2,1,.80,1),N(4,1,.80,1),
      N(5,1,.80,2),N(6,1,.75,1),N(4,1,.80,1),Rx(1),
      N(5,1,.75,2),N(4,1,.80,1),N(2,1,.75,1),N(0,1,.80,2),Rx(1),
    ], // bar1: 1+1+1+1+2+1+1+1+1+1+1+1+1+2=16, bar2: 2+1+1+2+1+1+1+2+1+1+2+1=16 → 32
    chords: [[0,2,4],[4,6,1],[5,0,2],[3,5,0]],
    padFilterHz: 1400, padAttack: 0.12,
    useDrums: true,
    kickSteps: [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0].map(Boolean),
    hatSteps:  [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0].map(Boolean),
    bassVol: 0.28, leadVol: 0.20, padVol: 0.08, drumsVol: 0.22, reverbAmt: 0.12,
  },

  // Ch11 — Doubting Castle: B natural minor, BPM 50 — crushing, hopeless
  11: {
    bpm: 50, rootMidi: 35 /* B1 */, scale: MINOR,
    bassPattern: [
      N(0,0,.68,6),Rx(2),N(4,0,.58,4),Rx(4),
    ], // 6+2+4+4=16
    leadPattern: [
      Rx(4),N(0,1,.55,6),N(2,1,.50,4),Rx(2),
      N(3,1,.58,8),Rx(4),N(2,1,.50,4),
    ], // 4+6+4+2=16, then 8+4+4=16 → 32
    chords: [[0,2,4],[3,5,0],[1,3,5],[4,6,1]],
    padFilterHz: 340, padAttack: 1.20,
    useDrums: false,
    kickSteps: new Array(16).fill(false),
    hatSteps:  new Array(16).fill(false),
    bassVol: 0.18, leadVol: 0.10, padVol: 0.14, drumsVol: 0, reverbAmt: 0.42,
  },

  // Ch12 — Celestial City: C major, BPM 108 — triumphant, eternal, radiant
  12: {
    bpm: 108, rootMidi: 48 /* C3 */, scale: MAJOR,
    bassPattern: [
      N(0,0,.85,2),N(4,0,.78,1),N(2,0,.75,1),N(0,0,.82,2),N(4,0,.80,2),
      N(5,0,.78,2),N(4,0,.75,1),N(2,0,.72,1),N(0,0,.80,2),N(4,0,.82,2),
    ], // 2+1+1+2+2+2+1+1+2+2=16
    leadPattern: [
      N(4,1,.78,2),N(5,1,.80,2),N(6,1,.85,3),N(5,1,.80,1),
      N(4,1,.78,2),N(2,1,.75,2),N(0,1,.80,4),
      Rx(2),N(4,1,.78,2),N(5,1,.80,2),N(6,1,.85,2),
      N(4,1,.80,3),N(5,1,.82,3),N(4,1,.78,1),Rx(1),
    ], // 2+2+3+1+2+2+4=16, then 2+2+2+2+3+3+1+1=16 → 32
    chords: [[0,2,4,6],[4,6,1,3],[5,0,2,4],[3,5,0,2]],
    padFilterHz: 2200, padAttack: 0.20,
    useDrums: true,
    kickSteps: [1,0,0,0,0,0,1,0,1,0,0,0,0,0,1,0].map(Boolean),
    hatSteps:  [0,0,1,0,1,0,0,0,0,0,1,0,1,0,0,1].map(Boolean),
    bassVol: 0.28, leadVol: 0.24, padVol: 0.14, drumsVol: 0.22, reverbAmt: 0.22,
  },
};

// ── ProceduralBGM class ───────────────────────────────────────────────────────

export class ProceduralBGM {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private fadeGain: GainNode | null = null;
  private bassGain: GainNode | null = null;
  private padGain: GainNode | null = null;
  private leadGain: GainNode | null = null;
  private drumsGain: GainNode | null = null;
  private reverbDelay: DelayNode | null = null;
  private reverbFeedback: GainNode | null = null;
  private reverbOut: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  private activeCfg: BGMConfig | null = null;
  private flatBass: Array<FlatNote | null> = new Array(16).fill(null);
  private flatLead: Array<FlatNote | null> = new Array(32).fill(null);

  private isPlaying = false;
  private tickHandle: ReturnType<typeof setTimeout> | null = null;
  private nextStepTime = 0;
  private currentStep = 0;
  private stepDuration = 0;
  private volume = 0.35;
  private currentChapter = 0;

  private readonly LOOKAHEAD = 0.12;
  private readonly TICK_MS   = 55;

  // ── Public API ────────────────────────────────────────────────────────────

  play(chapter: number, fadeMs = 1800): void {
    if (!this.ctx) this.buildGraph();
    if (!this.ctx || !this.fadeGain) return;

    const cfg = CONFIGS[chapter] ?? CONFIGS[1];
    const t = this.ctx.currentTime;

    if (this.isPlaying && chapter !== this.currentChapter) {
      // Crossfade: fade out → switch → fade in
      this.fadeGain.gain.cancelScheduledValues(t);
      this.fadeGain.gain.setValueAtTime(this.fadeGain.gain.value, t);
      this.fadeGain.gain.linearRampToValueAtTime(0, t + fadeMs / 2000);

      setTimeout(() => {
        this.switchConfig(cfg);
        if (this.ctx && this.fadeGain) {
          const t2 = this.ctx.currentTime;
          this.fadeGain.gain.cancelScheduledValues(t2);
          this.fadeGain.gain.setValueAtTime(0, t2);
          this.fadeGain.gain.linearRampToValueAtTime(1, t2 + fadeMs / 2000);
        }
      }, fadeMs / 2);
    } else if (!this.isPlaying) {
      this.switchConfig(cfg);
      this.fadeGain.gain.setValueAtTime(0, t);
      this.fadeGain.gain.linearRampToValueAtTime(1, t + 1.0);
      this.isPlaying = true;
    }

    this.currentChapter = chapter;
  }

  stop(fadeMs = 1200): void {
    if (!this.ctx || !this.fadeGain || !this.isPlaying) return;
    const t = this.ctx.currentTime;
    this.fadeGain.gain.cancelScheduledValues(t);
    this.fadeGain.gain.setValueAtTime(this.fadeGain.gain.value, t);
    this.fadeGain.gain.linearRampToValueAtTime(0, t + fadeMs / 1000);
    setTimeout(() => { this.stopTick(); this.isPlaying = false; }, fadeMs);
  }

  setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.linearRampToValueAtTime(this.volume, this.ctx.currentTime + 0.05);
    }
  }

  resume(): void {
    if (this.ctx?.state === 'suspended') this.ctx.resume();
  }

  get chapter(): number { return this.currentChapter; }

  destroy(): void {
    this.stopTick();
    this.ctx?.close();
    this.ctx = null;
    this.masterGain = null;
    this.fadeGain = null;
    this.bassGain = null;
    this.padGain = null;
    this.leadGain = null;
    this.drumsGain = null;
    this.reverbDelay = null;
    this.reverbFeedback = null;
    this.reverbOut = null;
    this.noiseBuffer = null;
    this.isPlaying = false;
  }

  // ── Graph construction ────────────────────────────────────────────────────

  private buildGraph(): void {
    try { this.ctx = new AudioContext(); } catch { return; }
    const ctx = this.ctx;

    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = this.volume;
    this.masterGain.connect(ctx.destination);

    this.fadeGain = ctx.createGain();
    this.fadeGain.gain.value = 0;
    this.fadeGain.connect(this.masterGain);

    this.bassGain = ctx.createGain();
    this.bassGain.connect(this.fadeGain);

    this.padGain = ctx.createGain();
    this.padGain.connect(this.fadeGain);

    this.leadGain = ctx.createGain();
    this.leadGain.connect(this.fadeGain);

    this.drumsGain = ctx.createGain();
    this.drumsGain.connect(this.fadeGain);

    // Simple feedback-delay reverb — pad + lead send into it
    this.reverbDelay = ctx.createDelay(2.0);
    this.reverbDelay.delayTime.value = 0.28;
    this.reverbFeedback = ctx.createGain();
    this.reverbFeedback.gain.value = 0.40;
    this.reverbOut = ctx.createGain();
    this.reverbOut.gain.value = 0.20;

    this.reverbDelay.connect(this.reverbFeedback);
    this.reverbFeedback.connect(this.reverbDelay);
    this.reverbDelay.connect(this.reverbOut);
    this.reverbOut.connect(this.fadeGain);

    // Pad and lead feed reverb in parallel (dry goes direct, wet through delay)
    this.padGain.connect(this.reverbDelay);
    this.leadGain.connect(this.reverbDelay);

    // Cache a noise buffer for hi-hats
    this.noiseBuffer = this.makeNoiseBuffer(ctx, 0.06);
  }

  private makeNoiseBuffer(ctx: AudioContext, dur: number): AudioBuffer {
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  // ── Config switch & flat-array expansion ─────────────────────────────────

  private switchConfig(cfg: BGMConfig): void {
    this.stopTick();
    this.activeCfg = cfg;
    this.stepDuration = 60 / cfg.bpm / 4;
    this.buildFlatArrays(cfg);
    this.applyVoiceGains(cfg);
    this.currentStep = 0;
    this.nextStepTime = (this.ctx?.currentTime ?? 0) + 0.05;
    this.startTick();
  }

  private buildFlatArrays(cfg: BGMConfig): void {
    // Bass — 16 steps
    this.flatBass = new Array(16).fill(null);
    let pos = 0;
    for (const [deg, oct, vel, len] of cfg.bassPattern) {
      if (pos >= 16) break;
      if (deg !== -1) {
        const hz = midiToHz(cfg.rootMidi + oct * 12 + cfg.scale[deg]);
        this.flatBass[pos] = { hz, vel, durSec: len * this.stepDuration };
      }
      pos += len;
    }

    // Lead — 32 steps
    this.flatLead = new Array(32).fill(null);
    pos = 0;
    for (const [deg, oct, vel, len] of cfg.leadPattern) {
      if (pos >= 32) break;
      if (deg !== -1) {
        const hz = midiToHz(cfg.rootMidi + oct * 12 + cfg.scale[deg]);
        this.flatLead[pos] = { hz, vel, durSec: len * this.stepDuration };
      }
      pos += len;
    }
  }

  private applyVoiceGains(cfg: BGMConfig): void {
    const t = this.ctx?.currentTime ?? 0;
    const ramp = (g: GainNode | null, v: number) => {
      if (!g) return;
      g.gain.cancelScheduledValues(t);
      g.gain.setValueAtTime(g.gain.value, t);
      g.gain.linearRampToValueAtTime(v, t + 0.15);
    };
    ramp(this.bassGain, cfg.bassVol);
    ramp(this.padGain, cfg.padVol);
    ramp(this.leadGain, cfg.leadVol);
    ramp(this.drumsGain, cfg.drumsVol);
    if (this.reverbOut) {
      this.reverbOut.gain.cancelScheduledValues(t);
      this.reverbOut.gain.setValueAtTime(this.reverbOut.gain.value, t);
      this.reverbOut.gain.linearRampToValueAtTime(cfg.reverbAmt, t + 0.15);
    }
  }

  // ── Scheduler tick ────────────────────────────────────────────────────────

  private startTick(): void {
    const tick = () => {
      if (!this.ctx || !this.activeCfg) return;
      const cfg = this.activeCfg;
      const now = this.ctx.currentTime;

      while (this.nextStepTime < now + this.LOOKAHEAD) {
        const step = this.currentStep;
        const t = this.nextStepTime;
        const bStep = step % 16;
        const lStep = step % 32;

        // Bass
        const bNote = this.flatBass[bStep];
        if (bNote) this.scheduleBass(bNote.hz, bNote.vel, t, bNote.durSec);

        // Lead
        const lNote = this.flatLead[lStep];
        if (lNote) this.scheduleLead(lNote.hz, lNote.vel, t, lNote.durSec);

        // Kick + Hat
        if (cfg.useDrums) {
          if (cfg.kickSteps[bStep]) this.scheduleKick(t);
          if (cfg.hatSteps[bStep])  this.scheduleHat(t, 0.4 + Math.random() * 0.4);
        }

        // Pad chord — new chord every 16 steps (1 bar)
        if (bStep === 0) {
          const barNum = Math.floor(step / 16);
          const chordIdx = barNum % cfg.chords.length;
          const padDur = this.stepDuration * 16 + 0.2;
          this.schedulePad(cfg.chords[chordIdx], cfg.rootMidi, cfg.scale,
                           cfg.padFilterHz, cfg.padAttack, t, padDur);
        }

        this.nextStepTime += this.stepDuration;
        this.currentStep++;
      }

      this.tickHandle = setTimeout(tick, this.TICK_MS);
    };
    this.tickHandle = setTimeout(tick, 0);
  }

  private stopTick(): void {
    if (this.tickHandle !== null) {
      clearTimeout(this.tickHandle);
      this.tickHandle = null;
    }
  }

  // ── Voice synthesizers ────────────────────────────────────────────────────

  private scheduleBass(hz: number, vel: number, t: number, dur: number): void {
    if (!this.ctx || !this.bassGain) return;
    const ctx = this.ctx;

    const gain = ctx.createGain();
    const atk = 0.004;
    const rel = Math.min(0.08, dur * 0.25);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vel, t + atk);
    gain.gain.setValueAtTime(vel * 0.80, t + dur - rel);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    // Sine (sub warmth) + triangle (mid presence)
    const sine = ctx.createOscillator();
    const tri  = ctx.createOscillator();
    const triG = ctx.createGain();
    sine.type = 'sine';
    sine.frequency.value = hz;
    tri.type = 'triangle';
    tri.frequency.value = hz;
    triG.gain.value = 0.35;

    sine.connect(gain);
    tri.connect(triG);
    triG.connect(gain);
    gain.connect(this.bassGain);

    sine.start(t); tri.start(t);
    sine.stop(t + dur + 0.05); tri.stop(t + dur + 0.05);
  }

  private scheduleLead(hz: number, vel: number, t: number, dur: number): void {
    if (!this.ctx || !this.leadGain) return;
    const ctx = this.ctx;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = hz;

    // Subtle vibrato on longer notes
    if (dur > 0.25) {
      const lfo = ctx.createOscillator();
      const lfoG = ctx.createGain();
      lfo.type = 'sine';
      lfo.frequency.value = 5.2 + Math.random() * 0.6;
      lfoG.gain.value = hz * 0.007;
      lfo.connect(lfoG);
      lfoG.connect(osc.frequency);
      lfo.start(t + 0.08);
      lfo.stop(t + dur + 0.05);
    }

    const atk = 0.018;
    const rel = Math.min(0.12, dur * 0.28);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vel, t + atk);
    gain.gain.setValueAtTime(vel * 0.68, t + dur - rel);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    osc.connect(gain);
    gain.connect(this.leadGain);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  private schedulePad(
    degrees: number[], rootMidi: number, scale: number[],
    filterHz: number, attack: number,
    t: number, dur: number,
  ): void {
    if (!this.ctx || !this.padGain) return;
    const ctx = this.ctx;

    degrees.forEach((deg, i) => {
      const oct = i === 0 ? 0 : 1;
      const midi = rootMidi + oct * 12 + scale[deg];
      const hz = midiToHz(midi);

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const filt = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc1.type = 'sawtooth'; osc1.frequency.value = hz;
      osc2.type = 'sawtooth'; osc2.frequency.value = hz * 1.004; // slight detune
      filt.type = 'lowpass';  filt.frequency.value = filterHz; filt.Q.value = 0.8;

      const vol = 0.14 / degrees.length;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(vol, t + attack);
      gain.gain.setValueAtTime(vol * 0.85, t + dur - 0.25);
      gain.gain.linearRampToValueAtTime(0, t + dur);

      osc1.connect(filt); osc2.connect(filt);
      filt.connect(gain);
      gain.connect(this.padGain!);

      osc1.start(t); osc2.start(t);
      osc1.stop(t + dur + 0.1); osc2.stop(t + dur + 0.1);
    });
  }

  private scheduleKick(t: number): void {
    if (!this.ctx || !this.drumsGain) return;
    const ctx = this.ctx;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(38, t + 0.14);
    gain.gain.setValueAtTime(1.0, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain);
    gain.connect(this.drumsGain);
    osc.start(t);
    osc.stop(t + 0.24);
  }

  private scheduleHat(t: number, vel: number): void {
    if (!this.ctx || !this.drumsGain || !this.noiseBuffer) return;
    const ctx = this.ctx;

    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 7800;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vel * 0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    src.connect(hp);
    hp.connect(gain);
    gain.connect(this.drumsGain);
    src.start(t);
  }
}
