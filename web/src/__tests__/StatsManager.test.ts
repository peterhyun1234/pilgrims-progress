import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock config before importing StatsManager
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

import { StatsManager } from '../core/StatsManager';
import { EventBus } from '../core/EventBus';
import { GameEvent } from '../core/GameEvents';

describe('StatsManager', () => {
  let sm: StatsManager;
  let bus: EventBus;

  beforeEach(() => {
    bus = new EventBus();
    sm = new StatsManager(bus);
  });

  describe('initialization', () => {
    it('starts with correct default stats', () => {
      expect(sm.get('faith')).toBe(30);
      expect(sm.get('courage')).toBe(20);
      expect(sm.get('wisdom')).toBe(20);
      expect(sm.get('burden')).toBe(60);
    });

    it('starts with empty hidden stats', () => {
      const h = sm.getHidden();
      expect(h.relationships).toEqual({});
      expect(h.spiritualInsight).toBe(0);
      expect(h.graceCounter).toBe(0);
    });
  });

  describe('change()', () => {
    it('increases stat within bounds (burden modifier applies at burden=60)', () => {
      // default burden=60 → modifier 0.8x for positive changes
      sm.change('faith', 20);
      // 20 * 0.8 = 16, faith = 30 + 16 = 46
      expect(sm.get('faith')).toBe(46);
    });

    it('increases stat without modifier when burden=0', () => {
      sm.setAll({ faith: 30, courage: 20, wisdom: 20, burden: 0 });
      sm.change('faith', 20);
      expect(sm.get('faith')).toBe(50);
    });

    it('clamps stat at max 100', () => {
      sm.change('faith', 200);
      expect(sm.get('faith')).toBe(100);
    });

    it('clamps stat at min 0 then anti-frustration applies', () => {
      // faith=30, courage=20, wisdom=20, burden=60
      sm.change('faith', -100);
      // faith hits 0 → anti-frustration sets it to 10
      // all stats (faith=10, courage=20, wisdom=20) ≤ 20 → all-low boost adds +10
      expect(sm.get('faith')).toBe(20); // 10 + 10 from all-low boost
      expect(sm.getHidden().graceCounter).toBeGreaterThan(0);
    });

    it('emits STAT_CHANGED event (burden modifier reduces gain)', () => {
      const handler = vi.fn();
      bus.on(GameEvent.STAT_CHANGED, handler);
      sm.change('courage', 5);
      // burden=60 → 5 * 0.8 = 4, courage = 20 + 4 = 24
      expect(handler).toHaveBeenCalled();
      const payload = handler.mock.calls[0][0];
      expect(payload.stat).toBe('courage');
      expect(payload.newValue).toBe(24);
      expect(payload.oldValue).toBe(20);
    });

    it('emits BURDEN_CHANGED when burden changes', () => {
      const handler = vi.fn();
      bus.on(GameEvent.BURDEN_CHANGED, handler);
      sm.change('burden', -10);
      expect(handler).toHaveBeenCalledWith(50);
    });

    it('emits BURDEN_RELEASED when burden reaches 0', () => {
      const handler = vi.fn();
      bus.on(GameEvent.BURDEN_RELEASED, handler);
      sm.change('burden', -100);
      expect(handler).toHaveBeenCalled();
    });
  });

  describe('burden modifier', () => {
    it('reduces gains when burden >= 80', () => {
      sm.setAll({ faith: 30, courage: 20, wisdom: 20, burden: 80 });
      sm.change('faith', 10);
      // 10 * 0.6 = 6, so faith = 30 + 6 = 36
      expect(sm.get('faith')).toBe(36);
    });

    it('slightly reduces gains when burden >= 60', () => {
      sm.setAll({ faith: 30, courage: 20, wisdom: 20, burden: 60 });
      sm.change('faith', 10);
      // 10 * 0.8 = 8, so faith = 30 + 8 = 38
      expect(sm.get('faith')).toBe(38);
    });

    it('does not modify negative changes', () => {
      sm.change('courage', -5);
      expect(sm.get('courage')).toBe(15);
    });

    it('boosts gains after burden is freed', () => {
      sm.setBurdenZero();
      sm.change('faith', 10);
      // 10 * 1.2 = 12, so faith = 30 + 12 = 42
      expect(sm.get('faith')).toBe(42);
    });

    it('does not apply burden modifier to burden itself', () => {
      sm.change('burden', -20);
      expect(sm.get('burden')).toBe(40);
    });
  });

  describe('anti-frustration', () => {
    it('restores faith to 10 when it reaches 0', () => {
      sm.setAll({ faith: 5, courage: 50, wisdom: 50, burden: 60 });
      sm.change('faith', -10);
      expect(sm.get('faith')).toBe(10);
    });

    it('increments grace counter when faith hits 0', () => {
      sm.setAll({ faith: 5, courage: 50, wisdom: 50, burden: 60 });
      sm.change('faith', -10);
      expect(sm.getHidden().graceCounter).toBe(1);
    });

    it('boosts all stats when all are low (<=20) and burden not freed', () => {
      sm.setAll({ faith: 15, courage: 15, wisdom: 15, burden: 60 });
      sm.change('faith', -5);
      // faith goes to 10, all stats <=20, so all get +10
      expect(sm.get('faith')).toBe(20); // 10 + 10
      expect(sm.get('courage')).toBe(25); // 15 + 10
      expect(sm.get('wisdom')).toBe(25); // 15 + 10
    });

    it('caps grace counter at 10', () => {
      const hidden = sm.getHidden();
      hidden.graceCounter = 9;
      sm.setHidden(hidden);
      sm.setAll({ faith: 1, courage: 50, wisdom: 50, burden: 60 });
      sm.change('faith', -5);
      expect(sm.getHidden().graceCounter).toBe(10);
    });
  });

  describe('speed multiplier', () => {
    it('returns 0.6 at burden >= 80', () => {
      sm.setAll({ faith: 30, courage: 20, wisdom: 20, burden: 80 });
      expect(sm.getSpeedMultiplier()).toBe(0.6);
    });

    it('returns 0.8 at burden >= 60', () => {
      sm.setAll({ faith: 30, courage: 20, wisdom: 20, burden: 60 });
      expect(sm.getSpeedMultiplier()).toBe(0.8);
    });

    it('returns ~1.0 at burden 0', () => {
      sm.setAll({ faith: 30, courage: 20, wisdom: 20, burden: 0 });
      expect(sm.getSpeedMultiplier()).toBe(1.0);
    });
  });

  describe('relationships', () => {
    it('defaults to 50 for unknown NPC', () => {
      expect(sm.getRelationship('evangelist')).toBe(50);
    });

    it('changes relationship and clamps', () => {
      sm.changeRelationship('evangelist', 30);
      expect(sm.getRelationship('evangelist')).toBe(80);
      sm.changeRelationship('evangelist', 30);
      expect(sm.getRelationship('evangelist')).toBe(100);
    });

    it('does not go below 0', () => {
      sm.changeRelationship('enemy', -100);
      expect(sm.getRelationship('enemy')).toBe(0);
    });
  });

  describe('spiritual insight', () => {
    it('adds insight clamped to 100', () => {
      sm.addInsight(30);
      expect(sm.getInsight()).toBe(30);
      sm.addInsight(200);
      expect(sm.getInsight()).toBe(100);
    });

    it('does not go below 0', () => {
      sm.addInsight(-50);
      expect(sm.getInsight()).toBe(0);
    });
  });

  describe('synergy', () => {
    it('returns true when both stats >= threshold', () => {
      sm.setAll({ faith: 60, courage: 60, wisdom: 20, burden: 0 });
      expect(sm.hasSynergy('faith', 'courage', 50)).toBe(true);
    });

    it('returns false when one stat below threshold', () => {
      expect(sm.hasSynergy('faith', 'courage', 50)).toBe(false);
    });
  });

  describe('ending score & tier', () => {
    it('calculates weighted score', () => {
      sm.setAll({ faith: 100, courage: 100, wisdom: 100, burden: 0 });
      // 100*0.4 + 100*0.3 + 100*0.3 + grace(0)*2 = 100
      expect(sm.getEndingScore()).toBe(100);
    });

    it('includes grace bonus capped at 10', () => {
      sm.setAll({ faith: 50, courage: 50, wisdom: 50, burden: 0 });
      const hidden = sm.getHidden();
      hidden.graceCounter = 8;
      sm.setHidden(hidden);
      // 50*0.4 + 50*0.3 + 50*0.3 + min(8*2, 10) = 50 + 10 = 60
      expect(sm.getEndingScore()).toBe(60);
    });

    it('returns glory tier for high scores', () => {
      sm.setAll({ faith: 90, courage: 90, wisdom: 90, burden: 0 });
      expect(sm.getEndingTier()).toBe('glory');
    });

    it('returns humble tier for medium scores', () => {
      sm.setAll({ faith: 60, courage: 50, wisdom: 50, burden: 0 });
      expect(sm.getEndingTier()).toBe('humble');
    });

    it('returns grace tier for very low scores', () => {
      sm.setAll({ faith: 10, courage: 10, wisdom: 10, burden: 80 });
      expect(sm.getEndingTier()).toBe('grace');
    });
  });

  describe('reset', () => {
    it('restores initial values', () => {
      sm.change('faith', 50);
      sm.changeRelationship('npc1', 20);
      sm.reset();
      expect(sm.get('faith')).toBe(30);
      expect(sm.getHidden().relationships).toEqual({});
    });
  });
});
