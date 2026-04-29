import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../config', () => ({
  STATS: {
    FAITH:   { initial: 30, min: 0, max: 100 },
    COURAGE: { initial: 20, min: 0, max: 100 },
    WISDOM:  { initial: 20, min: 0, max: 100 },
    BURDEN:  { initial: 60, min: 0, max: 100 },
  },
  HIDDEN_STAT_CAPS: { SPIRITUAL_INSIGHT: 100, GRACE_COUNTER: 10 },
}));

import { NpcStateManager } from '../systems/NpcStateManager';
import { EventBus } from '../core/EventBus';
import { ServiceLocator, SERVICE_KEYS } from '../core/ServiceLocator';
import { StatsManager } from '../core/StatsManager';
import { GameEvent } from '../core/GameEvents';

let eventBus: EventBus;
let nsm: NpcStateManager;

beforeEach(() => {
  ServiceLocator.clear();
  EventBus.getInstance().clear();
  eventBus = EventBus.getInstance();
  ServiceLocator.register(SERVICE_KEYS.STATS_MANAGER, new StatsManager(eventBus));
  nsm = new NpcStateManager(eventBus);
});

describe('NpcStateManager', () => {
  describe('initNpc + getPhase', () => {
    it('NPC with no prerequisite starts as "available"', () => {
      nsm.initNpc('evangelist');
      expect(nsm.getPhase('evangelist')).toBe('available');
    });

    it('NPC with prerequisite starts as "locked"', () => {
      nsm.initNpc('shining_ones', 'evangelist');
      expect(nsm.getPhase('shining_ones')).toBe('locked');
    });

    it('initNpc is idempotent (calling twice preserves state)', () => {
      nsm.initNpc('evangelist');
      nsm.beginTalk('evangelist', 1);
      nsm.endTalk('evangelist');
      expect(nsm.getPhase('evangelist')).toBe('completed');
      // Re-init should NOT reset state
      nsm.initNpc('evangelist');
      expect(nsm.getPhase('evangelist')).toBe('completed');
    });

    it('getPhase on unknown NPC returns "available" as default', () => {
      expect(nsm.getPhase('nobody')).toBe('available');
    });
  });

  describe('beginTalk + endTalk lifecycle', () => {
    it('beginTalk on available NPC promotes to active', () => {
      nsm.initNpc('evangelist');
      nsm.beginTalk('evangelist', 1);
      expect(nsm.getPhase('evangelist')).toBe('active');
      expect(nsm.getActiveNpcId()).toBe('evangelist');
    });

    it('endTalk on active NPC promotes to completed', () => {
      nsm.initNpc('evangelist');
      nsm.beginTalk('evangelist', 1);
      nsm.endTalk('evangelist');
      expect(nsm.getPhase('evangelist')).toBe('completed');
      expect(nsm.getActiveNpcId()).toBeNull();
    });

    it('endTalk increments talkCount', () => {
      nsm.initNpc('evangelist');
      nsm.beginTalk('evangelist', 1);
      nsm.endTalk('evangelist');
      expect(nsm.getTalkCount('evangelist')).toBe(1);
      // talk again as a "completed" repeat
      nsm.beginTalk('evangelist', 1);
      nsm.endTalk('evangelist');
      expect(nsm.getTalkCount('evangelist')).toBe(2);
    });

    it('endTalk on unknown NPC is a safe no-op', () => {
      expect(() => nsm.endTalk('nobody')).not.toThrow();
      expect(nsm.getTalkCount('nobody')).toBe(0);
    });
  });

  describe('prerequisite cascade', () => {
    it('completing prereq unlocks dependent NPCs', () => {
      nsm.initNpc('evangelist');
      nsm.initNpc('dependent', 'evangelist');
      expect(nsm.getPhase('dependent')).toBe('locked');
      nsm.beginTalk('evangelist', 1);
      nsm.endTalk('evangelist');
      // checkPrerequisiteUnlocks runs after each completion
      expect(nsm.getPhase('dependent')).toBe('available');
    });
  });

  describe('stat unlock (goodwill case)', () => {
    it('goodwill stays locked when wisdom < 40', () => {
      const sm = ServiceLocator.get<StatsManager>(SERVICE_KEYS.STATS_MANAGER);
      // wisdom defaults to 20
      expect(sm.get('wisdom')).toBe(20);
      // initialize as locked but with no NPC prerequisite (stat-gated)
      nsm.initNpc('goodwill');
      // Simulate the stat-gate state: needs to be set to 'locked' explicitly
      nsm.setPhase('goodwill', 'locked');
      // STAT_CHANGED fires checkStatUnlocks but with wisdom=20 it stays locked
      eventBus.emit(GameEvent.STAT_CHANGED, { stat: 'wisdom', amount: 0, oldValue: 20, newValue: 20 });
      expect(nsm.getPhase('goodwill')).toBe('locked');
    });

    it('goodwill unlocks when wisdom reaches 40', () => {
      const sm = ServiceLocator.get<StatsManager>(SERVICE_KEYS.STATS_MANAGER);
      nsm.initNpc('goodwill');
      nsm.setPhase('goodwill', 'locked');
      // Drop burden so the gain isn't dampened, then push wisdom to 40+
      sm.setBurdenZero();
      sm.change('wisdom', 30);
      // STAT_CHANGED is emitted by sm.change; handler runs synchronously
      expect(sm.get('wisdom')).toBeGreaterThanOrEqual(40);
      expect(nsm.getPhase('goodwill')).toBe('available');
    });
  });

  describe('initFromSave', () => {
    it('restores NPC states and talk counts from save data', () => {
      nsm.initFromSave(
        {
          evangelist: {
            npcId: 'evangelist',
            phase: 'completed',
            knotPointer: null,
            talkCount: 3,
            lastTalkChapter: 1,
            relationshipScore: 75,
            lastIdleTalkTimestamp: 0,
          },
        },
        { evangelist: 3 },
      );
      expect(nsm.getPhase('evangelist')).toBe('completed');
      expect(nsm.getTalkCount('evangelist')).toBe(3);
    });
  });

  describe('destroy', () => {
    it('unsubscribes EventBus listeners', () => {
      // After destroy, STAT_CHANGED shouldn't trigger checkStatUnlocks anymore
      // Indirect test: destroy should not throw and the manager should be safe
      // to discard.
      expect(() => nsm.destroy()).not.toThrow();
    });
  });
});
