import { describe, it, expect, vi } from 'vitest';

// Mock config
vi.mock('../config', () => ({
  STATS: {
    FAITH: { initial: 30, min: 0, max: 100 },
    COURAGE: { initial: 20, min: 0, max: 100 },
    WISDOM: { initial: 20, min: 0, max: 100 },
    BURDEN: { initial: 60, min: 0, max: 100 },
  },
  HIDDEN_STAT_CAPS: {
    SPIRITUAL_INSIGHT: 100,
    GRACE_COUNTER: 10,
  },
}));

import { createDefaultSaveData, migrateSaveData } from '../save/SaveData';

describe('SaveData', () => {
  describe('createDefaultSaveData', () => {
    it('creates valid default save', () => {
      const data = createDefaultSaveData();
      expect(data.version).toBe(3);
      expect(data.chapter).toBe(1);
      expect(data.playerName).toBe('Christian');
      expect(data.stats.faith).toBe(30);
      expect(data.stats.courage).toBe(20);
      expect(data.stats.wisdom).toBe(20);
      expect(data.stats.burden).toBe(60);
      expect(data.settings.language).toBe('ko');
      expect(data.hiddenStats.graceCounter).toBe(0);
    });

    it('includes all required fields', () => {
      const data = createDefaultSaveData();
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('npcStates');
      expect(data).toHaveProperty('talkedNpcs');
      expect(data).toHaveProperty('inkState');
      expect(data).toHaveProperty('triggeredEvents');
      expect(data).toHaveProperty('mapState');
      expect(data).toHaveProperty('firedTriggers');
    });
  });

  describe('settings fields', () => {
    it('includes colorblindMode defaulting to none', () => {
      const data = createDefaultSaveData();
      expect(data.settings.colorblindMode).toBe('none');
    });

    it('includes reduceMotion defaulting to false', () => {
      const data = createDefaultSaveData();
      expect(data.settings.reduceMotion).toBe(false);
    });

    it('preserves colorblindMode through migrateSaveData', () => {
      const data = createDefaultSaveData();
      data.settings.colorblindMode = 'protanopia';
      const result = migrateSaveData(data);
      expect(result.settings.colorblindMode).toBe('protanopia');
    });

    it('preserves reduceMotion through migrateSaveData', () => {
      const data = createDefaultSaveData();
      data.settings.reduceMotion = true;
      const result = migrateSaveData(data);
      expect(result.settings.reduceMotion).toBe(true);
    });

    it('migrated v2 data gets default colorblindMode none', () => {
      const v2: Record<string, unknown> = {
        version: 2,
        chapter: 1,
        playerName: 'Test',
        stats: { faith: 30, courage: 20, wisdom: 20, burden: 60 },
        hiddenStats: { relationships: {}, spiritualInsight: 0, graceCounter: 0 },
        settings: { language: 'ko' },
        timestamp: 0,
      };
      const result = migrateSaveData(v2 as unknown);
      expect(result.settings.colorblindMode).toBe('none');
      expect(result.settings.reduceMotion).toBe(false);
    });
  });

  describe('migrateSaveData', () => {
    it('migrates v2 data to v3', () => {
      const v2: Record<string, unknown> = {
        version: 2,
        chapter: 2,
        playerName: 'Test',
        stats: { faith: 50, courage: 40, wisdom: 30, burden: 20 },
        hiddenStats: { relationships: {}, spiritualInsight: 0, graceCounter: 0 },
        settings: { language: 'en' },
        timestamp: 12345,
        bibleCards: [],
        metCharacters: [],
        inkState: 'old-string-state',
      };
      const result = migrateSaveData(v2 as unknown);
      expect(result.version).toBe(3);
      expect(result.chapter).toBe(2);
      expect(result.inkState).toEqual({}); // v2 inkState (string) reset to empty Record
      expect(result.npcStates).toBeDefined();
      expect(result.talkedNpcs).toBeDefined();
      expect(result.triggeredEvents).toBeDefined();
      expect(result.firedTriggers).toBeDefined();
    });

    it('preserves v3 data as-is', () => {
      const v3 = createDefaultSaveData();
      v3.chapter = 5;
      v3.stats.faith = 80;
      const result = migrateSaveData(v3);
      expect(result.chapter).toBe(5);
      expect(result.stats.faith).toBe(80);
    });

    it('handles missing fields gracefully', () => {
      const partial: Record<string, unknown> = {
        version: 2,
        chapter: 1,
        playerName: 'X',
        stats: { faith: 30, courage: 20, wisdom: 20, burden: 60 },
        settings: { language: 'ko' },
        timestamp: 0,
      };
      const result = migrateSaveData(partial as unknown);
      expect(result.version).toBe(3);
      expect(result.npcStates).toBeDefined();
      expect(result.triggeredEvents).toBeDefined();
    });
  });
});
