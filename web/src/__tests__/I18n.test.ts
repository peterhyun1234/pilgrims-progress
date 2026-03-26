import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock translation data
vi.mock('../i18n/ko.json', () => ({
  default: {
    'game.title': '천로역정',
    'menu.newGame': '새 게임',
    'hud.faith': '믿음',
    'save.slot': '저장 슬롯 {slot}',
    'toast.statUp': '+{amount} {stat}!',
    'chapter.7': '제7장: 아름다운 궁전',
  },
}));

vi.mock('../i18n/en.json', () => ({
  default: {
    'game.title': "The Pilgrim's Progress",
    'menu.newGame': 'New Game',
    'hud.faith': 'Faith',
    'save.slot': 'Save Slot {slot}',
    'toast.statUp': '+{amount} {stat}!',
    'chapter.7': 'Chapter 7: Palace Beautiful',
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

    it('accepts any string language code', () => {
      i18n.setLanguage('ja');
      expect(i18n.getLanguage()).toBe('ja');
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

    it('returns Ch7-12 chapter titles', () => {
      expect(i18n.t('chapter.7')).toBe('제7장: 아름다운 궁전');
      i18n.setLanguage('en');
      expect(i18n.t('chapter.7')).toBe('Chapter 7: Palace Beautiful');
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

    it('returns key when language has no translation for it', () => {
      i18n.setLanguage('ja');
      expect(i18n.t('game.title')).toBe('game.title');
    });
  });

  describe('parameter interpolation', () => {
    it('interpolates single parameter', () => {
      expect(i18n.t('save.slot', { slot: 1 })).toBe('저장 슬롯 1');
    });

    it('interpolates multiple parameters', () => {
      expect(i18n.t('toast.statUp', { amount: 10, stat: '믿음' })).toBe('+10 믿음!');
    });

    it('interpolates with fallback string and params', () => {
      expect(i18n.t('nonexistent', 'Hello {name}', { name: 'World' })).toBe('Hello World');
    });

    it('leaves unknown param placeholders intact', () => {
      expect(i18n.t('save.slot', { wrongKey: 1 })).toBe('저장 슬롯 {slot}');
    });

    it('works with English translations', () => {
      i18n.setLanguage('en');
      expect(i18n.t('save.slot', { slot: 3 })).toBe('Save Slot 3');
    });
  });

  describe('dynamic language registration', () => {
    it('adds a new language', () => {
      i18n.addLanguage('ja', { 'game.title': '天路歴程', 'menu.newGame': '新しいゲーム' });
      i18n.setLanguage('ja');
      expect(i18n.t('game.title')).toBe('天路歴程');
      expect(i18n.t('menu.newGame')).toBe('新しいゲーム');
    });

    it('reports supported languages', () => {
      const langs = i18n.supportedLanguages;
      expect(langs).toContain('ko');
      expect(langs).toContain('en');
    });

    it('newly added language appears in supportedLanguages', () => {
      i18n.addLanguage('fr', { 'game.title': 'Le Voyage du Pèlerin' });
      expect(i18n.supportedLanguages).toContain('fr');
    });
  });
});
