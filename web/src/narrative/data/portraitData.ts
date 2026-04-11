import { PortraitEmotion } from '../../core/GameEvents';

export interface PortraitConfig {
  id: string;
  headShape: 'round' | 'square' | 'oval';
  skinTone: number;
  hairStyle: 'short' | 'long' | 'bald' | 'hooded' | 'wild';
  hairColor: number;
  beard?: boolean;
  eyeColor: number;
  clothingColor: number;
  clothingAccent: number;
  accessory?: 'scroll' | 'staff' | 'crown' | 'halo' | 'chains' | 'hat';
  accessoryColor?: number;
  personality: 'kind' | 'stern' | 'wise' | 'aggressive' | 'timid' | 'noble' | 'sly';
}

export interface EmotionFeatures {
  eyebrowAngle: number;
  eyeScale: number;
  mouthCurve: number;
  mouthOpen: boolean;
  blush: boolean;
  tearDrop: boolean;
  sparkle: boolean;
  sweatDrop: boolean;
}

export const EMOTION_FEATURES: Record<PortraitEmotion, EmotionFeatures> = {
  neutral:    { eyebrowAngle: 0,    eyeScale: 1.0, mouthCurve: 0,    mouthOpen: false, blush: false, tearDrop: false, sparkle: false, sweatDrop: false },
  happy:      { eyebrowAngle: 0.1,  eyeScale: 0.8, mouthCurve: 0.55, mouthOpen: true,  blush: true,  tearDrop: false, sparkle: true,  sweatDrop: false },
  angry:      { eyebrowAngle: -0.5, eyeScale: 0.9, mouthCurve: -0.3, mouthOpen: false, blush: false, tearDrop: false, sparkle: false, sweatDrop: false },
  sad:        { eyebrowAngle: 0.35, eyeScale: 1.1, mouthCurve: -0.5, mouthOpen: false, blush: false, tearDrop: true,  sparkle: false, sweatDrop: false },
  fearful:    { eyebrowAngle: 0.35, eyeScale: 1.4, mouthCurve: -0.2, mouthOpen: true,  blush: false, tearDrop: false, sparkle: false, sweatDrop: true  },
  surprised:  { eyebrowAngle: 0.45, eyeScale: 1.5, mouthCurve: 0,    mouthOpen: true,  blush: false, tearDrop: false, sparkle: false, sweatDrop: false },
  determined: { eyebrowAngle: -0.3, eyeScale: 0.88,mouthCurve: 0.1,  mouthOpen: false, blush: false, tearDrop: false, sparkle: true,  sweatDrop: false },
  // New high-expressivity states
  wince:      { eyebrowAngle: 0.4,  eyeScale: 0.7, mouthCurve: -0.2, mouthOpen: false, blush: false, tearDrop: false, sparkle: false, sweatDrop: true  },
  resolve:    { eyebrowAngle: -0.4, eyeScale: 0.85,mouthCurve: 0.15, mouthOpen: false, blush: false, tearDrop: false, sparkle: true,  sweatDrop: false },
  awe:        { eyebrowAngle: 0.5,  eyeScale: 1.6, mouthCurve: 0,    mouthOpen: true,  blush: true,  tearDrop: false, sparkle: true,  sweatDrop: false },
};

export const PORTRAIT_CONFIGS: Record<string, PortraitConfig> = {
  christian: {
    id: 'christian',
    headShape: 'round',
    skinTone: 0xe8c8a0,
    hairStyle: 'short',
    hairColor: 0x6b4423,
    eyeColor: 0x4a6b8a,
    clothingColor: 0x8b7355,
    clothingAccent: 0xa68d50,
    accessory: 'chains',
    accessoryColor: 0x666666,
    personality: 'kind',
  },
  evangelist: {
    id: 'evangelist',
    headShape: 'oval',
    skinTone: 0xd4a878,
    hairStyle: 'bald',
    hairColor: 0xd8d0c8,     // light gray — used as beard color
    beard: true,
    eyeColor: 0xd4a853,
    clothingColor: 0xd0c8c0,  // light gray robe (matches world sprite)
    clothingAccent: 0xa8a098,
    accessory: 'staff',
    accessoryColor: 0x6a4a20,
    personality: 'wise',
  },
  obstinate: {
    id: 'obstinate',
    headShape: 'square',
    skinTone: 0xd4a070,
    hairStyle: 'short',
    hairColor: 0x333333,
    eyeColor: 0x553322,
    clothingColor: 0x553322,
    clothingAccent: 0x774433,
    personality: 'aggressive',
  },
  pliable: {
    id: 'pliable',
    headShape: 'round',
    skinTone: 0xf0d0b0,
    hairStyle: 'short',
    hairColor: 0x887755,
    eyeColor: 0x6699aa,
    clothingColor: 0x667788,
    clothingAccent: 0x88aacc,
    personality: 'timid',
  },
  help: {
    id: 'help',
    headShape: 'oval',
    skinTone: 0xe0b890,
    hairStyle: 'short',
    hairColor: 0x998866,
    eyeColor: 0x88aa66,
    clothingColor: 0x4a7c59,
    clothingAccent: 0x66aa77,
    accessory: 'staff',
    accessoryColor: 0x8b7355,
    personality: 'kind',
  },
  worldly_wiseman: {
    id: 'worldly_wiseman',
    headShape: 'oval',
    skinTone: 0xe8c8a0,
    hairStyle: 'short',
    hairColor: 0x888888,
    eyeColor: 0x445566,
    clothingColor: 0x4a3a6a,
    clothingAccent: 0x8866aa,
    accessory: 'hat',
    accessoryColor: 0x3a2a5a,
    personality: 'sly',
  },
  goodwill: {
    id: 'goodwill',
    headShape: 'round',
    skinTone: 0xf0d8c0,
    hairStyle: 'long',
    hairColor: 0xd4a853,
    eyeColor: 0x88aadd,
    clothingColor: 0xdddddd,
    clothingAccent: 0xd4a853,
    accessory: 'halo',
    accessoryColor: 0xffeedd,
    personality: 'noble',
  },
  interpreter: {
    id: 'interpreter',
    headShape: 'oval',
    skinTone: 0xd8b898,
    hairStyle: 'long',
    hairColor: 0xcccccc,
    eyeColor: 0x9b59b6,
    clothingColor: 0x2d1b4e,
    clothingAccent: 0x9b59b6,
    accessory: 'scroll',
    accessoryColor: 0xf5e6d3,
    personality: 'wise',
  },
  shining_ones: {
    id: 'shining_ones',
    headShape: 'oval',
    skinTone: 0xffeedd,
    hairStyle: 'long',
    hairColor: 0xffd700,
    eyeColor: 0xffffff,
    clothingColor: 0xffeedd,
    clothingAccent: 0xffd700,
    accessory: 'halo',
    accessoryColor: 0xffd700,
    personality: 'noble',
  },

  // ─── Ch7: Beautiful Palace characters ────────────────────────────────────
  timorous: {
    id: 'timorous',
    headShape: 'round',
    skinTone: 0xd8b898,
    hairStyle: 'short',
    hairColor: 0x887766,
    eyeColor: 0x997755,
    clothingColor: 0x7a6a55,
    clothingAccent: 0x998877,
    accessory: 'hat',
    accessoryColor: 0x665544,
    personality: 'timid',
  },
  mistrust: {
    id: 'mistrust',
    headShape: 'square',
    skinTone: 0xc8a888,
    hairStyle: 'short',
    hairColor: 0x554433,
    eyeColor: 0x445566,
    clothingColor: 0x3a3a4a,
    clothingAccent: 0x554455,
    personality: 'sly',
  },
  watchful: {
    id: 'watchful',
    headShape: 'square',
    skinTone: 0xd8c0a0,
    hairStyle: 'short',
    hairColor: 0x886644,
    eyeColor: 0x557799,
    clothingColor: 0x556677,
    clothingAccent: 0x8899aa,
    accessory: 'staff',
    accessoryColor: 0x998877,
    personality: 'stern',
  },
  prudence: {
    id: 'prudence',
    headShape: 'oval',
    skinTone: 0xf0d8c0,
    hairStyle: 'long',
    hairColor: 0x997755,
    eyeColor: 0x778866,
    clothingColor: 0x6688aa,
    clothingAccent: 0xaaccdd,
    accessory: 'scroll',
    accessoryColor: 0xf5e6d3,
    personality: 'wise',
  },
  piety: {
    id: 'piety',
    headShape: 'oval',
    skinTone: 0xe8c8a8,
    hairStyle: 'long',
    hairColor: 0xddbb88,
    eyeColor: 0x99aa77,
    clothingColor: 0x5a7a4a,
    clothingAccent: 0x88bb66,
    personality: 'kind',
  },
  charity: {
    id: 'charity',
    headShape: 'round',
    skinTone: 0xf5e0c0,
    hairStyle: 'long',
    hairColor: 0xcc9966,
    eyeColor: 0xdd7766,
    clothingColor: 0xaa4455,
    clothingAccent: 0xdd8877,
    personality: 'kind',
  },

  // ─── Ch9 & Ch11: Companion characters ────────────────────────────────────
  faithful: {
    id: 'faithful',
    headShape: 'round',
    skinTone: 0xe0c8a8,
    hairStyle: 'short',
    hairColor: 0x775533,
    eyeColor: 0x5588aa,
    clothingColor: 0x336699,
    clothingAccent: 0x6699cc,
    personality: 'kind',
  },
  hopeful: {
    id: 'hopeful',
    headShape: 'round',
    skinTone: 0xecd8b8,
    hairStyle: 'short',
    hairColor: 0xaacc66,
    eyeColor: 0x66aa55,
    clothingColor: 0x4a8844,
    clothingAccent: 0x88cc66,
    personality: 'kind',
  },

  // ─── Ch10: Vanity Fair characters ────────────────────────────────────────
  lord_hategood: {
    id: 'lord_hategood',
    headShape: 'square',
    skinTone: 0xc0a890,
    hairStyle: 'short',
    hairColor: 0x222222,
    eyeColor: 0x441111,
    clothingColor: 0x111111,
    clothingAccent: 0x442222,
    accessory: 'crown',
    accessoryColor: 0x884422,
    personality: 'aggressive',
  },

  // ─── Ch11: Doubting Castle characters ────────────────────────────────────
  diffidence: {
    id: 'diffidence',
    headShape: 'oval',
    skinTone: 0xb8a090,
    hairStyle: 'long',
    hairColor: 0x554466,
    eyeColor: 0x664477,
    clothingColor: 0x3a2a4a,
    clothingAccent: 0x664488,
    personality: 'sly',
  },

  // ─── Ch12: Final characters ───────────────────────────────────────────────
  ignorance: {
    id: 'ignorance',
    headShape: 'round',
    skinTone: 0xe8d0a8,
    hairStyle: 'short',
    hairColor: 0x998866,
    eyeColor: 0x778855,
    clothingColor: 0xaa8833,
    clothingAccent: 0xddbb55,
    accessory: 'hat',
    accessoryColor: 0xcc9944,
    personality: 'sly',
  },
};
