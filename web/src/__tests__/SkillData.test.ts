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

import { SKILLS, ENEMIES } from '../systems/SkillData';

const VALID_STATS = new Set(['faith', 'courage', 'wisdom', 'burden']);
const VALID_SKILL_TYPES = new Set(['attack', 'defend', 'heal', 'special']);
const VALID_ANIMATIONS = new Set(['slash', 'shield', 'light', 'prayer', 'fire', 'wave']);
const VALID_ATTACK_PATTERN_TYPES = VALID_STATS; // patterns target a stat

describe('SkillData', () => {
  describe('SKILLS shape', () => {
    for (const [id, skill] of Object.entries(SKILLS)) {
      it(`skill "${id}" has consistent id, names, and valid enums`, () => {
        expect(skill.id).toBe(id);
        expect(skill.nameKo).toBeTruthy();
        expect(skill.nameEn).toBeTruthy();
        expect(skill.descKo).toBeTruthy();
        expect(skill.descEn).toBeTruthy();
        expect(VALID_STATS.has(skill.requiredStat)).toBe(true);
        expect(VALID_STATS.has(skill.costStat)).toBe(true);
        expect(VALID_SKILL_TYPES.has(skill.type)).toBe(true);
        expect(VALID_ANIMATIONS.has(skill.animation)).toBe(true);
        expect(skill.requiredValue).toBeGreaterThanOrEqual(0);
        expect(skill.power).toBeGreaterThanOrEqual(0);
        expect(skill.cost).toBeGreaterThanOrEqual(0);
      });
    }
  });

  describe('ENEMIES shape', () => {
    for (const [id, enemy] of Object.entries(ENEMIES)) {
      it(`enemy "${id}" has consistent id, names, and valid stats`, () => {
        expect(enemy.id).toBe(id);
        expect(enemy.nameKo).toBeTruthy();
        expect(enemy.nameEn).toBeTruthy();
        expect(enemy.hp).toBeGreaterThan(0);
        expect(enemy.attack).toBeGreaterThanOrEqual(0);
        expect(enemy.defense).toBeGreaterThanOrEqual(0);
        expect(VALID_STATS.has(enemy.weakness)).toBe(true);
        expect(typeof enemy.isBoss).toBe('boolean');
        expect(enemy.chapter).toBeGreaterThanOrEqual(1);
        expect(enemy.chapter).toBeLessThanOrEqual(12);
        // Every enemy must have at least one attack pattern, otherwise the
        // combat loop has no enemy actions to execute (player would attack into
        // a vacuum on the enemy turn).
        expect(enemy.attackPatterns.length).toBeGreaterThan(0);
      });

      it(`enemy "${id}" attack patterns target real stats`, () => {
        for (const ap of enemy.attackPatterns) {
          expect(ap.nameKo).toBeTruthy();
          expect(ap.nameEn).toBeTruthy();
          expect(ap.power).toBeGreaterThan(0);
          expect(VALID_ATTACK_PATTERN_TYPES.has(ap.type)).toBe(true);
        }
      });
    }
  });
});
