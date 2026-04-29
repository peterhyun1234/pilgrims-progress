import { describe, it, expect, vi } from 'vitest';

vi.mock('../config', () => ({
  STATS: {
    FAITH:   { initial: 30, min: 0, max: 100 },
    COURAGE: { initial: 20, min: 0, max: 100 },
    WISDOM:  { initial: 20, min: 0, max: 100 },
    BURDEN:  { initial: 60, min: 0, max: 100 },
  },
  HIDDEN_STAT_CAPS: { SPIRITUAL_INSIGHT: 100, GRACE_COUNTER: 10 },
}));

import { characters } from '../narrative/data/characters';
import { PORTRAIT_CONFIGS } from '../narrative/data/portraitData';

describe('characters metadata', () => {
  it('character ids are unique', () => {
    const ids = characters.map(c => c.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  for (const c of characters) {
    it(`character "${c.id}" has all required text fields`, () => {
      expect(c.nameKo).toBeTruthy();
      expect(c.nameEn).toBeTruthy();
      expect(c.symbolKo).toBeTruthy();
      expect(c.symbolEn).toBeTruthy();
      expect(c.sprite).toBeTruthy();
      expect(c.chapter.length).toBeGreaterThan(0);
    });

    it(`character "${c.id}" chapter list is sorted, unique, and in 1..12`, () => {
      // Sorted ascending — keeps the data file scannable
      const sorted = [...c.chapter].sort((a, b) => a - b);
      expect(c.chapter).toEqual(sorted);
      expect(new Set(c.chapter).size).toBe(c.chapter.length);
      for (const ch of c.chapter) {
        expect(ch).toBeGreaterThanOrEqual(1);
        expect(ch).toBeLessThanOrEqual(12);
      }
    });

    it(`character "${c.id}" has a matching portrait config`, () => {
      // Every character in metadata should have visual data so dialogue renders.
      // (PORTRAIT_CONFIGS is keyed by character id.)
      expect(PORTRAIT_CONFIGS[c.id], `Character "${c.id}" missing PORTRAIT_CONFIGS entry`).toBeDefined();
    });
  }
});
