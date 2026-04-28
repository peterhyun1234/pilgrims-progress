import { describe, it, expect, vi } from 'vitest';

// ItemData transitively imports core/config bits — pin to test-safe values
vi.mock('../config', () => ({
  STATS: {
    FAITH:   { initial: 30, min: 0, max: 100 },
    COURAGE: { initial: 20, min: 0, max: 100 },
    WISDOM:  { initial: 20, min: 0, max: 100 },
    BURDEN:  { initial: 60, min: 0, max: 100 },
  },
  HIDDEN_STAT_CAPS: { SPIRITUAL_INSIGHT: 100, GRACE_COUNTER: 10 },
}));

import { ITEMS, CHAPTER_ITEMS } from '../systems/ItemData';

const VALID_STATS = new Set(['faith', 'courage', 'wisdom', 'burden']);
const VALID_TYPES = new Set(['consumable', 'equipment', 'key', 'scripture']);
const VALID_RARITIES = new Set(['common', 'uncommon', 'rare', 'legendary']);
const VALID_SLOTS = new Set(['weapon', 'armor', 'accessory']);

describe('ItemData', () => {
  describe('ITEMS shape', () => {
    for (const [id, item] of Object.entries(ITEMS)) {
      it(`item "${id}" has consistent id, names and core fields`, () => {
        // The map key must match the item's own id — otherwise inventory lookups
        // by id would silently return the wrong item.
        expect(item.id).toBe(id);
        expect(item.nameKo).toBeTruthy();
        expect(item.nameEn).toBeTruthy();
        expect(item.descKo).toBeTruthy();
        expect(item.descEn).toBeTruthy();
        expect(VALID_TYPES.has(item.type)).toBe(true);
        expect(VALID_RARITIES.has(item.rarity)).toBe(true);
        expect(item.icon).toBeTruthy();
        expect(item.maxStack).toBeGreaterThan(0);
      });

      if (item.onUseEffect?.stat !== undefined) {
        it(`item "${id}" onUseEffect.stat references a real stat`, () => {
          expect(VALID_STATS.has(item.onUseEffect!.stat!)).toBe(true);
        });
      }

      if (item.statBonus) {
        it(`item "${id}" statBonus keys are real stats`, () => {
          for (const k of Object.keys(item.statBonus!)) {
            expect(VALID_STATS.has(k)).toBe(true);
          }
        });
      }

      if (item.equipSlot !== undefined) {
        it(`item "${id}" equipSlot is a real slot`, () => {
          expect(VALID_SLOTS.has(item.equipSlot!)).toBe(true);
        });
      }
    }
  });

  describe('CHAPTER_ITEMS coverage', () => {
    it('every chapter listed in CHAPTER_ITEMS has at least one drop', () => {
      for (const [chKey, drops] of Object.entries(CHAPTER_ITEMS)) {
        // empty drop array would silently hide items from a chapter
        expect(drops.length, `Ch${chKey} CHAPTER_ITEMS has no drops`).toBeGreaterThan(0);
      }
    });
  });
});
