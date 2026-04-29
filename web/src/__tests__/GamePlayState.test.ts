import { describe, it, expect, beforeEach } from 'vitest';
import { GamePlayState } from '../core/GamePlayState';

let state: GamePlayState;

beforeEach(() => {
  state = new GamePlayState();
});

describe('GamePlayState', () => {
  describe('triggered events', () => {
    it('starts with no events triggered', () => {
      expect(state.isEventTriggered('any')).toBe(false);
      expect(state.triggeredEvents.size).toBe(0);
    });

    it('markEventTriggered persists across calls', () => {
      state.markEventTriggered('ch1_battle_doubt');
      expect(state.isEventTriggered('ch1_battle_doubt')).toBe(true);
    });

    it('markEventTriggered is idempotent (Set semantics)', () => {
      state.markEventTriggered('ch1_battle_doubt');
      state.markEventTriggered('ch1_battle_doubt');
      expect(state.triggeredEvents.size).toBe(1);
    });

    it('different events are independent', () => {
      state.markEventTriggered('a');
      expect(state.isEventTriggered('b')).toBe(false);
      state.markEventTriggered('b');
      expect(state.triggeredEvents.size).toBe(2);
    });
  });

  describe('map object state', () => {
    it('getObjectState returns null for unknown objects', () => {
      expect(state.getObjectState('unknown_gate')).toBeNull();
    });

    it('setObjectState seeds defaults on first set', () => {
      state.setObjectState('ch4_wicket_gate', { open: true });
      const got = state.getObjectState('ch4_wicket_gate');
      expect(got).toMatchObject({
        objectId: 'ch4_wicket_gate',
        open: true,
        visible: true,
        activated: false,
      });
    });

    it('setObjectState patches existing state without losing prior fields', () => {
      state.setObjectState('door', { open: true });
      state.setObjectState('door', { activated: true });
      const got = state.getObjectState('door');
      expect(got?.open).toBe(true);
      expect(got?.activated).toBe(true);
    });
  });
});
