import { describe, it, expect } from 'vitest';
import { PORTRAIT_CONFIGS, EMOTION_FEATURES } from '../narrative/data/portraitData';

const VALID_HEAD = new Set(['round', 'square', 'oval']);
const VALID_HAIR = new Set(['short', 'long', 'bald', 'hooded', 'wild']);
const VALID_ACCESSORY = new Set(['scroll', 'staff', 'crown', 'halo', 'chains', 'hat']);
const VALID_PERSONALITY = new Set([
  'kind', 'stern', 'wise', 'aggressive', 'timid', 'noble', 'sly',
]);
const VALID_EMOTIONS = new Set([
  'neutral', 'happy', 'angry', 'sad', 'fearful', 'surprised', 'determined',
  'wince', 'resolve', 'awe',
]);

const isValidHexColor = (n: unknown): n is number =>
  typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= 0xffffff;

describe('PORTRAIT_CONFIGS', () => {
  for (const [key, cfg] of Object.entries(PORTRAIT_CONFIGS)) {
    it(`portrait "${key}" has valid enums and color values`, () => {
      // id matches map key
      expect(cfg.id).toBe(key);
      expect(VALID_HEAD.has(cfg.headShape)).toBe(true);
      expect(VALID_HAIR.has(cfg.hairStyle)).toBe(true);
      expect(VALID_PERSONALITY.has(cfg.personality)).toBe(true);
      // Optional accessory must be one of the known set
      if (cfg.accessory !== undefined) {
        expect(VALID_ACCESSORY.has(cfg.accessory)).toBe(true);
        // accessoryColor must accompany accessory (otherwise factory crashes
        // on undefined.toString(16) when drawing the prop)
        expect(cfg.accessoryColor).toBeDefined();
        expect(isValidHexColor(cfg.accessoryColor!)).toBe(true);
      }
      // All required colors are valid 0xRRGGBB
      expect(isValidHexColor(cfg.skinTone)).toBe(true);
      expect(isValidHexColor(cfg.hairColor)).toBe(true);
      expect(isValidHexColor(cfg.eyeColor)).toBe(true);
      expect(isValidHexColor(cfg.clothingColor)).toBe(true);
      expect(isValidHexColor(cfg.clothingAccent)).toBe(true);
    });
  }
});

describe('EMOTION_FEATURES', () => {
  it('contains all PortraitEmotion variants', () => {
    const emotionKeys = new Set(Object.keys(EMOTION_FEATURES));
    for (const e of VALID_EMOTIONS) {
      expect(emotionKeys.has(e)).toBe(true);
    }
  });

  for (const [emotion, feat] of Object.entries(EMOTION_FEATURES)) {
    it(`emotion "${emotion}" has values in expected ranges`, () => {
      // eyebrowAngle is roughly [-1, 1]
      expect(feat.eyebrowAngle).toBeGreaterThanOrEqual(-1);
      expect(feat.eyebrowAngle).toBeLessThanOrEqual(1);
      // eyeScale > 0 (multiplier on eye radius)
      expect(feat.eyeScale).toBeGreaterThan(0);
      expect(feat.eyeScale).toBeLessThanOrEqual(2);
      // mouthCurve is roughly [-1, 1]
      expect(feat.mouthCurve).toBeGreaterThanOrEqual(-1);
      expect(feat.mouthCurve).toBeLessThanOrEqual(1);
      // boolean flags
      expect(typeof feat.mouthOpen).toBe('boolean');
      expect(typeof feat.blush).toBe('boolean');
      expect(typeof feat.tearDrop).toBe('boolean');
      expect(typeof feat.sparkle).toBe('boolean');
      expect(typeof feat.sweatDrop).toBe('boolean');
    });
  }
});
