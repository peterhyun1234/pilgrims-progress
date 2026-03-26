import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock translation data
vi.mock('../i18n/ko.json', () => ({
  default: {
    'game.title': '천로역정',
    'menu.newGame': '새 게임',
    'hud.faith': '믿음',
  },
}));

vi.mock('../i18n/en.json', () => ({
  default: {
    'game.title': "The Pilgrim's Progress",
    'menu.newGame': 'New Game',
    'hud.faith': 'Faith',
  },
}));

import { I18n } from '../i18n/I18n';

describe('I18n', () => {
  let i18n: I18n;

  beforeEach(() => {
    i18n = new I18n();
  });

  describe('language management', () => {
    it('defaults to Korean', () => {
      expect(i18n.getLanguage()).toBe('ko');
    });

    it('switches to English', () => {
      i18n.setLanguage('en');
      expect(i18n.getLanguage()).toBe('en');
    });

    it('switches back to Korean', () => {
      i18n.setLanguage('en');
      i18n.setLanguage('ko');
      expect(i18n.getLanguage()).toBe('ko');
    });
  });

  describe('translation lookup', () => {
    it('returns Korean translation by default', () => {
      expect(i18n.t('game.title')).toBe('천로역정');
    });

    it('returns English translation after switching', () => {
      i18n.setLanguage('en');
      expect(i18n.t('game.title')).toBe("The Pilgrim's Progress");
    });

    it('returns different translations per language', () => {
      expect(i18n.t('menu.newGame')).toBe('새 게임');
      i18n.setLanguage('en');
      expect(i18n.t('menu.newGame')).toBe('New Game');
    });
  });

  describe('fallback behavior', () => {
    it('returns key when translation is missing and no fallback', () => {
      expect(i18n.t('nonexistent.key')).toBe('nonexistent.key');
    });

    it('returns fallback when translation is missing', () => {
      expect(i18n.t('nonexistent.key', 'Default Text')).toBe('Default Text');
    });

    it('prefers translation over fallback when key exists', () => {
      expect(i18n.t('game.title', 'Fallback')).toBe('천로역정');
    });
  });
});
