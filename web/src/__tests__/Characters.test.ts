import { describe, it, expect } from 'vitest';
import { characters } from '../narrative/data/characters';

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
  }
});
