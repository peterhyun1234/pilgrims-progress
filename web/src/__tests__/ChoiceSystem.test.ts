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

import { ChoiceSystem } from '../narrative/ChoiceSystem';
import { StatsManager } from '../core/StatsManager';
import { ServiceLocator, SERVICE_KEYS } from '../core/ServiceLocator';
import { EventBus } from '../core/EventBus';

beforeEach(() => {
  ServiceLocator.clear();
  EventBus.getInstance().clear();
  const stats = new StatsManager(EventBus.getInstance());
  ServiceLocator.register(SERVICE_KEYS.STATS_MANAGER, stats);
});

describe('ChoiceSystem.filterChoices', () => {
  it('passes through plain choices unchanged with weight=light and isLocked=false', () => {
    const result = ChoiceSystem.filterChoices([
      { text: 'Yes', index: 0, isHidden: false },
      { text: 'No',  index: 1, isHidden: false },
    ]);
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ text: 'Yes', isLocked: false, weight: 'light' });
    expect(result[1]).toMatchObject({ text: 'No',  isLocked: false, weight: 'light' });
  });

  it('marks isHidden choices with weight=heavy', () => {
    const result = ChoiceSystem.filterChoices([
      { text: 'Stat-locked option', index: 0, isHidden: true },
    ]);
    expect(result[0].weight).toBe('heavy');
  });

  it('locks a choice when stat requirement is not met', () => {
    const stats = ServiceLocator.get<StatsManager>(SERVICE_KEYS.STATS_MANAGER);
    // Default faith = 30
    expect(stats.get('faith')).toBe(30);
    const result = ChoiceSystem.filterChoices([
      { text: 'Hard route', index: 0, isHidden: false, requiredStat: 'faith', requiredValue: 80 },
    ]);
    expect(result[0].isLocked).toBe(true);
    expect(result[0].lockReason).toContain('faith');
    expect(result[0].lockReason).toContain('80');
  });

  it('does not lock when stat requirement is met', () => {
    const stats = ServiceLocator.get<StatsManager>(SERVICE_KEYS.STATS_MANAGER);
    // Drop burden first so stat-gain modifiers don't reduce the +faith below
    // the 80 threshold (StatsManager.applyBurdenModifier scales positive
    // gains by remaining burden).
    stats.setBurdenZero();
    stats.change('faith', 70); // floor 30 → enough headroom under burden=0
    const faith = stats.get('faith');
    expect(faith).toBeGreaterThanOrEqual(80); // sanity for the test setup
    const result = ChoiceSystem.filterChoices([
      { text: 'Hard route', index: 0, isHidden: false, requiredStat: 'faith', requiredValue: 80 },
    ]);
    expect(result[0].isLocked).toBe(false);
    expect(result[0].lockReason).toBeUndefined();
  });

  it('preserves the original index ordering', () => {
    const result = ChoiceSystem.filterChoices([
      { text: 'A', index: 0, isHidden: false },
      { text: 'B', index: 1, isHidden: false },
      { text: 'C', index: 2, isHidden: false },
    ]);
    expect(result.map(r => r.index)).toEqual([0, 1, 2]);
  });

  it('returns empty array for empty input', () => {
    expect(ChoiceSystem.filterChoices([])).toEqual([]);
  });
});
