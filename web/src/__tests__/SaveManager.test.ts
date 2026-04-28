import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock config (mirrors SaveData.test.ts)
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

// Mock localforage with controllable async setItem.
let store: Record<string, unknown> = {};
let nextSetItemDelay = 0;
const setItemSpy = vi.fn();
vi.mock('localforage', () => {
  return {
    default: {
      config: vi.fn(),
      getItem: vi.fn(async (key: string) => store[key] ?? null),
      setItem: vi.fn(async (key: string, val: unknown) => {
        setItemSpy(key, val);
        if (nextSetItemDelay > 0) {
          await new Promise(r => setTimeout(r, nextSetItemDelay));
        }
        store[key] = val;
        return val;
      }),
    },
  };
});

import { SaveManager } from '../save/SaveManager';
import { EventBus } from '../core/EventBus';
import { ServiceLocator, SERVICE_KEYS } from '../core/ServiceLocator';
import { GameManager } from '../core/GameManager';

beforeEach(() => {
  store = {};
  setItemSpy.mockClear();
  nextSetItemDelay = 0;
  ServiceLocator.clear();
  EventBus.getInstance().clear();
});

describe('SaveManager', () => {
  describe('concurrent save handling (pendingSave)', () => {
    it('persists the second save when both fire while one is in flight', async () => {
      // Setup: GameManager + StatsManager registered (SaveManager pulls from them)
      new GameManager();
      const gm = ServiceLocator.get<GameManager>(SERVICE_KEYS.GAME_MANAGER);

      const eventBus = EventBus.getInstance();
      const saveMgr = new SaveManager(eventBus);

      // Slow the first setItem so the second save() arrives mid-flight
      nextSetItemDelay = 50;

      gm.setChapter(2);
      const p1 = saveMgr.save();   // chapter=2 captured into the in-flight save
      // Mutate state between the calls: this is what the pendingSave fix protects
      gm.setChapter(7);
      // Drop the artificial delay so the trailing save runs at normal speed
      nextSetItemDelay = 0;
      const p2 = saveMgr.save();   // should be queued, not silently dropped
      await Promise.all([p1, p2]);

      // setItem must have been called TWICE — once for each save.
      // Without the pendingSave fix the second call would be dropped and
      // setItemSpy would only show 1 call.
      expect(setItemSpy).toHaveBeenCalledTimes(2);

      // The second save's payload must reflect the latest chapter (7), not 2.
      const lastCall = setItemSpy.mock.calls.at(-1)!;
      expect((lastCall[1] as { chapter: number }).chapter).toBe(7);
    });

    it('drops the third save when only one is queued behind the in-flight one', async () => {
      // Doc-ing the intended behavior: pendingSave is a SINGLE-slot flag, not a
      // queue. If 3 saves fire rapidly, the 1st runs, the 2nd is queued, the
      // 3rd collapses into "we already need to re-run" — runs once more total.
      new GameManager();
      const eventBus = EventBus.getInstance();
      const saveMgr = new SaveManager(eventBus);

      nextSetItemDelay = 30;
      const p1 = saveMgr.save();
      const p2 = saveMgr.save();
      const p3 = saveMgr.save();
      await Promise.all([p1, p2, p3]);

      // 1st save runs, then ONE trailing save (covers both 2nd and 3rd's intent
      // since the latest GameManager state is captured at the trailing run).
      expect(setItemSpy).toHaveBeenCalledTimes(2);
    });
  });
});
