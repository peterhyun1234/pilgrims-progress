import { describe, it, expect } from 'vitest';
import { easeIn, easeOut, easeInOut, lerp } from '../utils/Easing';
import { pixelSnap, pixelSnapVec } from '../utils/PixelSnap';

describe('easing functions', () => {
  it('all easing functions return 0 at t=0 and 1 at t=1', () => {
    for (const fn of [easeIn, easeOut, easeInOut]) {
      expect(fn(0)).toBeCloseTo(0, 6);
      expect(fn(1)).toBeCloseTo(1, 6);
    }
  });

  it('easeIn is below linear in the first half', () => {
    expect(easeIn(0.5)).toBeLessThan(0.5);
    expect(easeIn(0.25)).toBeLessThan(0.25);
  });

  it('easeOut is above linear in the first half', () => {
    expect(easeOut(0.5)).toBeGreaterThan(0.5);
    expect(easeOut(0.25)).toBeGreaterThan(0.25);
  });

  it('easeInOut is symmetric around 0.5', () => {
    expect(easeInOut(0.5)).toBeCloseTo(0.5, 6);
    // Symmetry: easeInOut(t) + easeInOut(1-t) = 1 for any t
    for (const t of [0.1, 0.3, 0.7, 0.9]) {
      expect(easeInOut(t) + easeInOut(1 - t)).toBeCloseTo(1, 6);
    }
  });

  it('lerp interpolates linearly', () => {
    expect(lerp(0, 100, 0)).toBe(0);
    expect(lerp(0, 100, 1)).toBe(100);
    expect(lerp(0, 100, 0.5)).toBe(50);
    expect(lerp(-50, 50, 0.5)).toBe(0);
  });

  it('lerp extrapolates outside [0, 1]', () => {
    expect(lerp(0, 10, 2)).toBe(20);
    expect(lerp(0, 10, -1)).toBe(-10);
  });
});

describe('pixel snapping', () => {
  it('pixelSnap rounds half-toward-positive', () => {
    expect(pixelSnap(1.4)).toBe(1);
    expect(pixelSnap(1.6)).toBe(2);
    expect(pixelSnap(-1.4)).toBe(-1);
  });

  it('pixelSnap is idempotent on integers', () => {
    expect(pixelSnap(5)).toBe(5);
    expect(pixelSnap(0)).toBe(0);
  });

  it('pixelSnapVec rounds both axes independently', () => {
    expect(pixelSnapVec(1.4, 2.7)).toEqual({ x: 1, y: 3 });
    // Note: JS Math.round half-rounds toward +∞ (Math.round(-0.5) is -0).
    // Use numeric equality so -0 and 0 are treated as equal.
    const r = pixelSnapVec(-0.5, 0.5);
    expect(r.x === 0).toBe(true);  // covers both 0 and -0
    expect(r.y).toBe(1);
  });
});
