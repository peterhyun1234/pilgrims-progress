import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../config', () => ({
  STATS: {
    FAITH:   { initial: 30, min: 0, max: 100 },
    COURAGE: { initial: 20, min: 0, max: 100 },
    WISDOM:  { initial: 20, min: 0, max: 100 },
    BURDEN:  { initial: 60, min: 0, max: 100 },
  },
  HIDDEN_STAT_CAPS: { SPIRITUAL_INSIGHT: 100, GRACE_COUNTER: 10 },
  ITEMS: { MAX_INVENTORY: 20 },
}));

import { ItemSystem } from '../systems/ItemSystem';
import { EventBus } from '../core/EventBus';
import { ServiceLocator, SERVICE_KEYS } from '../core/ServiceLocator';
import { StatsManager } from '../core/StatsManager';
import { GameEvent } from '../core/GameEvents';

let inv: ItemSystem;

beforeEach(() => {
  ServiceLocator.clear();
  EventBus.getInstance().clear();
  ServiceLocator.register(SERVICE_KEYS.STATS_MANAGER, new StatsManager(EventBus.getInstance()));
  inv = new ItemSystem();
});

describe('ItemSystem', () => {
  describe('addItem', () => {
    it('adds a new item to inventory', () => {
      const ok = inv.addItem('bread_of_life', 1);
      expect(ok).toBe(true);
      expect(inv.hasItem('bread_of_life')).toBe(true);
      expect(inv.getItemCount('bread_of_life')).toBe(1);
    });

    it('rejects unknown items', () => {
      expect(inv.addItem('nonexistent_item', 1)).toBe(false);
    });

    it('stacks stackable items into the same slot', () => {
      inv.addItem('bread_of_life', 1);
      inv.addItem('bread_of_life', 2);
      expect(inv.getInventory().length).toBe(1);
      expect(inv.getItemCount('bread_of_life')).toBe(3);
    });

    it('emits ITEM_ACQUIRED on add', () => {
      const handler = vi.fn();
      EventBus.getInstance().on(GameEvent.ITEM_ACQUIRED, handler);
      inv.addItem('bread_of_life', 1);
      expect(handler).toHaveBeenCalled();
    });
  });

  describe('removeItem', () => {
    it('returns false when removing item not in inventory', () => {
      expect(inv.removeItem('bread_of_life', 1)).toBe(false);
    });

    it('decrements quantity, removing slot when zero', () => {
      inv.addItem('bread_of_life', 3);
      inv.removeItem('bread_of_life', 2);
      expect(inv.getItemCount('bread_of_life')).toBe(1);
      inv.removeItem('bread_of_life', 1);
      expect(inv.hasItem('bread_of_life')).toBe(false);
    });
  });

  describe('useItem (consumable)', () => {
    it('applies onUseEffect.stat and removes a stack', () => {
      const sm = ServiceLocator.get<StatsManager>(SERVICE_KEYS.STATS_MANAGER);
      sm.setBurdenZero(); // avoid burden modifier dampening the gain
      const before = sm.get('faith');
      inv.addItem('bread_of_life', 1);
      const ok = inv.useItem('bread_of_life');
      expect(ok).toBe(true);
      expect(sm.get('faith')).toBeGreaterThan(before);
      // bread_of_life is consumable → removed after use
      expect(inv.hasItem('bread_of_life')).toBe(false);
    });

    it('returns false when item not in inventory', () => {
      expect(inv.useItem('bread_of_life')).toBe(false);
    });
  });

  describe('serialization', () => {
    it('round-trips inventory and equipped state', () => {
      inv.addItem('bread_of_life', 2);
      const snap = inv.getSerializable();
      expect(snap.inventory).toEqual([{ itemId: 'bread_of_life', quantity: 2 }]);
      const fresh = new ItemSystem();
      fresh.loadFromSave(snap);
      expect(fresh.getItemCount('bread_of_life')).toBe(2);
    });

    it('reset empties everything', () => {
      inv.addItem('bread_of_life', 1);
      inv.reset();
      expect(inv.getInventory()).toEqual([]);
      expect(inv.getEquipped()).toEqual({ weapon: null, armor: null, accessory: null });
    });
  });
});
