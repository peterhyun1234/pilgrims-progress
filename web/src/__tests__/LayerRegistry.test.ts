import { describe, it, expect } from 'vitest';
import { LAYER } from '../world/LayerRegistry';

describe('LAYER constants', () => {
  it('exports the core world depth keys', () => {
    expect(LAYER.GROUND).toBeDefined();
    expect(LAYER.DECOR).toBeDefined();
    expect(LAYER.OBJECT).toBeDefined();
    expect(LAYER.BUILDING).toBeDefined();
    expect(LAYER.LIGHTING).toBeDefined();
    expect(LAYER.HUD).toBeDefined();
  });

  it('parallax layers come before world layers in render order', () => {
    expect(LAYER.PARALLAX_SKY).toBeLessThan(LAYER.GROUND + 1);
    expect(LAYER.PARALLAX_FOG).toBeLessThan(LAYER.GROUND + 1);
  });

  it('GROUND < DECOR < OBJECT (depth ordering preserves old setDepth values)', () => {
    expect(LAYER.GROUND).toBeLessThan(LAYER.DECOR);
    expect(LAYER.DECOR).toBeLessThan(LAYER.OBJECT);
  });

  it('overlay layers are at the top of the stack', () => {
    expect(LAYER.HUD).toBeGreaterThan(LAYER.LIGHTING);
    expect(LAYER.DIALOGUE).toBeGreaterThan(LAYER.HUD);
    expect(LAYER.TRANSITION).toBeGreaterThan(LAYER.DIALOGUE);
    expect(LAYER.DEBUG).toBeGreaterThan(LAYER.TRANSITION);
  });

  it('all values are finite numbers', () => {
    for (const [k, v] of Object.entries(LAYER)) {
      expect(typeof v, `LAYER.${k} should be number`).toBe('number');
      expect(Number.isFinite(v)).toBe(true);
    }
  });
});
