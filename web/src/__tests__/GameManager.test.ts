import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../config', () => ({
  STATS: {
    FAITH:   { initial: 30, min: 0, max: 100 },
    COURAGE: { initial: 20, min: 0, max: 100 },
    WISDOM:  { initial: 20, min: 0, max: 100 },
    BURDEN:  { initial: 60, min: 0, max: 100 },
  },
  HIDDEN_STAT_CAPS: {
    SPIRITUAL_INSIGHT: 100,
    GRACE_COUNTER: 10,
  },
}));

vi.mock('../i18n/ko.json', () => ({ default: { 'game.title': '천로역정' } }));
vi.mock('../i18n/en.json', () => ({ default: { 'game.title': "The Pilgrim's Progress" } }));

import { EventBus } from '../core/EventBus';
import { ServiceLocator } from '../core/ServiceLocator';
import { GameManager, ColorblindType } from '../core/GameManager';
import { GameEvent } from '../core/GameEvents';

describe('GameManager', () => {
  let gm: GameManager;

  beforeEach(() => {
    // Reset singletons between tests
    // @ts-expect-error - reset private static for test isolation
    EventBus['instance'] = undefined;
    ServiceLocator.clear();
    gm = new GameManager();
  });

  // ─── colorblindMode ───────────────────────────────────────────────────────

  describe('colorblindMode', () => {
    it('defaults to "none"', () => {
      expect(gm.colorblindMode).toBe('none');
    });

    it('sets protanopia mode', () => {
      gm.colorblindMode = 'protanopia';
      expect(gm.colorblindMode).toBe('protanopia');
    });

    it('sets deuteranopia mode', () => {
      gm.colorblindMode = 'deuteranopia';
      expect(gm.colorblindMode).toBe('deuteranopia');
    });

    it('sets tritanopia mode', () => {
      gm.colorblindMode = 'tritanopia';
      expect(gm.colorblindMode).toBe('tritanopia');
    });

    it('emits SETTINGS_CHANGED when mode changes', () => {
      const handler = vi.fn();
      EventBus.getInstance().on(GameEvent.SETTINGS_CHANGED, handler);
      gm.colorblindMode = 'protanopia';
      expect(handler).toHaveBeenCalledWith({ colorblindMode: 'protanopia' });
    });

    it('does NOT emit SETTINGS_CHANGED when setting same value', () => {
      const handler = vi.fn();
      gm.colorblindMode = 'protanopia';
      EventBus.getInstance().on(GameEvent.SETTINGS_CHANGED, handler);
      gm.colorblindMode = 'protanopia'; // same value
      expect(handler).not.toHaveBeenCalled();
    });

    it('can be toggled back to none', () => {
      gm.colorblindMode = 'tritanopia';
      gm.colorblindMode = 'none';
      expect(gm.colorblindMode).toBe('none');
    });
  });

  // ─── getStatColor ─────────────────────────────────────────────────────────

  describe('getStatColor()', () => {
    it('returns default colors when mode is none', () => {
      expect(gm.getStatColor('faith')).toBe(0x6699ff);
      expect(gm.getStatColor('courage')).toBe(0xff8844);
      expect(gm.getStatColor('wisdom')).toBe(0x88ddaa);
      expect(gm.getStatColor('burden')).toBe(0xcc4444);
    });

    it('returns protanopia palette colors', () => {
      gm.colorblindMode = 'protanopia';
      expect(gm.getStatColor('faith')).toBe(0xe8c040);
      expect(gm.getStatColor('courage')).toBe(0x5555ff);
      expect(gm.getStatColor('wisdom')).toBe(0xff6600);
      expect(gm.getStatColor('burden')).toBe(0x888888);
    });

    it('returns deuteranopia palette colors', () => {
      gm.colorblindMode = 'deuteranopia';
      expect(gm.getStatColor('faith')).toBe(0xffdd00);
      expect(gm.getStatColor('courage')).toBe(0x0066ff);
      expect(gm.getStatColor('wisdom')).toBe(0xff8800);
      expect(gm.getStatColor('burden')).toBe(0x999999);
    });

    it('returns tritanopia palette colors', () => {
      gm.colorblindMode = 'tritanopia';
      expect(gm.getStatColor('faith')).toBe(0xff6688);
      expect(gm.getStatColor('courage')).toBe(0x44ddcc);
      expect(gm.getStatColor('wisdom')).toBe(0xff4400);
      expect(gm.getStatColor('burden')).toBe(0xaaaaaa);
    });

    it('all palette colors differ from default for faith', () => {
      const defaultColor = gm.getStatColor('faith');
      const modes: Exclude<ColorblindType, 'none'>[] = ['protanopia', 'deuteranopia', 'tritanopia'];
      for (const mode of modes) {
        gm.colorblindMode = mode;
        expect(gm.getStatColor('faith')).not.toBe(defaultColor);
        gm.colorblindMode = 'none';
      }
    });
  });

  // ─── reduceMotion ─────────────────────────────────────────────────────────

  describe('reduceMotion', () => {
    it('defaults to false', () => {
      expect(gm.reduceMotion).toBe(false);
    });

    it('can be set to true', () => {
      gm.reduceMotion = true;
      expect(gm.reduceMotion).toBe(true);
    });

    it('emits SETTINGS_CHANGED when value changes', () => {
      const handler = vi.fn();
      EventBus.getInstance().on(GameEvent.SETTINGS_CHANGED, handler);
      gm.reduceMotion = true;
      expect(handler).toHaveBeenCalledWith({ reduceMotion: true });
    });

    it('does NOT emit SETTINGS_CHANGED when setting same value', () => {
      const handler = vi.fn();
      EventBus.getInstance().on(GameEvent.SETTINGS_CHANGED, handler);
      gm.reduceMotion = false; // already false
      expect(handler).not.toHaveBeenCalled();
    });
  });

  // ─── basic GameManager API ────────────────────────────────────────────────

  describe('language', () => {
    it('defaults to ko', () => {
      expect(gm.language).toBe('ko');
    });

    it('setting language also updates i18n', () => {
      gm.language = 'en';
      expect(gm.language).toBe('en');
      expect(gm.i18n.getLanguage()).toBe('en');
    });
  });

  describe('currentChapter', () => {
    it('defaults to chapter 1', () => {
      expect(gm.currentChapter).toBe(1);
    });

    it('updates via setChapter()', () => {
      gm.setChapter(5);
      expect(gm.currentChapter).toBe(5);
    });
  });
});
