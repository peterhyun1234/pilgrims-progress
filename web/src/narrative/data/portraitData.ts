import { PortraitEmotion } from '../../core/GameEvents';

export interface PortraitConfig {
  id: string;
  headShape: 'round' | 'square' | 'oval';
  skinTone: number;
  hairStyle: 'short' | 'long' | 'bald' | 'hooded' | 'wild';
  hairColor: number;
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
  neutral:    { eyebrowAngle: 0,    eyeScale: 1,   mouthCurve: 0,    mouthOpen: false, blush: false, tearDrop: false, sparkle: false, sweatDrop: false },
  happy:      { eyebrowAngle: 0.1,  eyeScale: 0.8, mouthCurve: 0.5,  mouthOpen: true,  blush: true,  tearDrop: false, sparkle: true,  sweatDrop: false },
  angry:      { eyebrowAngle: -0.4, eyeScale: 0.9, mouthCurve: -0.3, mouthOpen: false, blush: false, tearDrop: false, sparkle: false, sweatDrop: false },
  sad:        { eyebrowAngle: 0.3,  eyeScale: 1.1, mouthCurve: -0.4, mouthOpen: false, blush: false, tearDrop: true,  sparkle: false, sweatDrop: false },
  fearful:    { eyebrowAngle: 0.3,  eyeScale: 1.3, mouthCurve: -0.2, mouthOpen: true,  blush: false, tearDrop: false, sparkle: false, sweatDrop: true  },
  surprised:  { eyebrowAngle: 0.4,  eyeScale: 1.4, mouthCurve: 0,    mouthOpen: true,  blush: false, tearDrop: false, sparkle: false, sweatDrop: false },
  determined: { eyebrowAngle: -0.2, eyeScale: 0.9, mouthCurve: 0.1,  mouthOpen: false, blush: false, tearDrop: false, sparkle: true,  sweatDrop: false },
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
    hairStyle: 'hooded',
    hairColor: 0x444444,
    eyeColor: 0xd4a853,
    clothingColor: 0x2a4a2a,
    clothingAccent: 0xd4a853,
    accessory: 'scroll',
    accessoryColor: 0xf5e6d3,
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
};
