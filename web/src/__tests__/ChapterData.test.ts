import { describe, it, expect, beforeAll } from 'vitest';
import { CHAPTER_CONFIGS, ChapterConfig } from '../world/ChapterData';

describe('ChapterData', () => {
  describe('CHAPTER_CONFIGS array', () => {
    it('contains exactly 12 chapters', () => {
      expect(CHAPTER_CONFIGS).toHaveLength(12);
    });

    it('chapters are numbered 1–12 in order', () => {
      const numbers = CHAPTER_CONFIGS.map(c => c.chapter);
      expect(numbers).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    });
  });

  describe('every chapter structural contract', () => {
    for (const config of CHAPTER_CONFIGS) {
      it(`Ch${config.chapter} has required fields`, () => {
        expect(config.chapter).toBeGreaterThanOrEqual(1);
        expect(config.locationName).toBeTruthy();
        expect(config.locationNameEn).toBeTruthy();
        expect(config.mapWidth).toBeGreaterThan(0);
        expect(config.mapHeight).toBeGreaterThan(0);
        expect(config.spawn.x).toBeGreaterThanOrEqual(0);
        expect(config.spawn.y).toBeGreaterThanOrEqual(0);
        expect(Array.isArray(config.npcs)).toBe(true);
        expect(config.theme).toBeDefined();
      });

      it(`Ch${config.chapter} spawn is within map bounds`, () => {
        expect(config.spawn.x).toBeLessThanOrEqual(config.mapWidth);
        expect(config.spawn.y).toBeLessThanOrEqual(config.mapHeight);
      });
    }
  });

  describe('exit zone validity', () => {
    for (const config of CHAPTER_CONFIGS) {
      if (!config.exits?.length) continue;
      it(`Ch${config.chapter} exits have positive dimensions`, () => {
        for (const exit of config.exits!) {
          expect(exit.width).toBeGreaterThan(0);
          expect(exit.height).toBeGreaterThan(0);
          expect(exit.targetChapter).toBeGreaterThan(0);
        }
      });
    }
  });

  describe('event zone validity', () => {
    for (const config of CHAPTER_CONFIGS) {
      if (!config.events?.length) continue;
      it(`Ch${config.chapter} events have valid structure`, () => {
        for (const ev of config.events!) {
          expect(ev.id).toBeTruthy();
          expect(['battle', 'item', 'cutscene', 'dialogue']).toContain(ev.type);
          expect(ev.width).toBeGreaterThan(0);
          expect(ev.height).toBeGreaterThan(0);
          expect(typeof ev.triggerOnce).toBe('boolean');
        }
      });
    }
  });

  // ─── Chapter 6: The Cross — specific assertions ────────────────────────────

  describe('Chapter 6 (십자가 / The Cross)', () => {
    let ch6: ChapterConfig;

    beforeAll(() => {
      ch6 = CHAPTER_CONFIGS.find(c => c.chapter === 6)!;
    });

    it('exists in CHAPTER_CONFIGS', () => {
      expect(ch6).toBeDefined();
    });

    it('has correct location name', () => {
      expect(ch6.locationName).toBe('십자가');
      expect(ch6.locationNameEn).toBe('The Cross');
    });

    it('has a spawn near south edge', () => {
      expect(ch6.spawn.y).toBeGreaterThan(ch6.mapHeight / 2);
    });

    it('has the ch6_burden_released cutscene event', () => {
      const ev = ch6.events?.find(e => e.id === 'ch6_burden_released');
      expect(ev).toBeDefined();
      expect(ev?.type).toBe('cutscene');
      expect(ev?.triggerOnce).toBe(true);
      expect(ev?.data?.cutsceneId).toBe('ch6_burden_released');
    });

    it('has a north exit to chapter 7', () => {
      expect(ch6.exits).toBeDefined();
      const exit = ch6.exits?.find(e => e.targetChapter === 7);
      expect(exit).toBeDefined();
      // North exit: y near 0
      expect(exit!.y).toBeLessThan(100);
    });

    it('has the cross landmark as a map object', () => {
      const cross = ch6.mapObjects?.find(o => o.id === 'ch6_cross');
      expect(cross).toBeDefined();
      expect(cross?.type).toBe('sign');
    });

    it('requires ch6_burden_released event for completion', () => {
      expect(ch6.completionRequirements?.requiredEvents).toContain('ch6_burden_released');
    });

    it('has bgmKey defined', () => {
      expect(ch6.bgmKey).toBeTruthy();
    });
  });

  // ─── NPC uniqueness within chapters ────────────────────────────────────────

  describe('NPC id uniqueness per chapter', () => {
    for (const config of CHAPTER_CONFIGS) {
      if (!config.npcs.length) continue;
      it(`Ch${config.chapter} NPC ids are unique`, () => {
        const ids = config.npcs.map(n => n.id);
        const unique = new Set(ids);
        expect(unique.size).toBe(ids.length);
      });
    }
  });

  // ─── Map object id uniqueness ──────────────────────────────────────────────

  describe('map object id uniqueness per chapter', () => {
    for (const config of CHAPTER_CONFIGS) {
      if (!config.mapObjects?.length) continue;
      it(`Ch${config.chapter} mapObject ids are unique`, () => {
        const ids = config.mapObjects!.map(o => o.id);
        const unique = new Set(ids);
        expect(unique.size).toBe(ids.length);
      });
    }
  });
});
