import { describe, it, expect } from 'vitest';
// Real translation data — separate from I18n.test.ts which mocks them.
import koData from '../i18n/ko.json';
import enData from '../i18n/en.json';

describe('i18n data parity (real files)', () => {
  it('every Korean translation key has an English counterpart', () => {
    const koKeys = new Set(Object.keys(koData));
    const enKeys = new Set(Object.keys(enData));
    const missingInEn = [...koKeys].filter(k => !enKeys.has(k));
    // Untranslated Korean keys would fall back to the raw key name when the
    // app runs in English — empty/garbage UI labels.
    expect(missingInEn, `Keys missing in en.json: ${missingInEn.join(', ')}`).toEqual([]);
  });

  it('every English translation key has a Korean counterpart', () => {
    const koKeys = new Set(Object.keys(koData));
    const enKeys = new Set(Object.keys(enData));
    const missingInKo = [...enKeys].filter(k => !koKeys.has(k));
    expect(missingInKo, `Keys missing in ko.json: ${missingInKo.join(', ')}`).toEqual([]);
  });

  it('no translation value is empty in ko.json', () => {
    for (const [k, v] of Object.entries(koData)) {
      expect(typeof v).toBe('string');
      expect(v, `ko.json["${k}"] is empty`).toBeTruthy();
    }
  });

  it('no translation value is empty in en.json', () => {
    for (const [k, v] of Object.entries(enData)) {
      expect(typeof v).toBe('string');
      expect(v, `en.json["${k}"] is empty`).toBeTruthy();
    }
  });

  it('placeholder syntax matches between ko and en (e.g. {slot} appears in both)', () => {
    // If one language has {amount} but the other doesn't, runtime interpolation
    // silently misses the value on the language without the placeholder.
    const koKeys = Object.keys(koData);
    const placeholderRe = /\{(\w+)\}/g;
    for (const key of koKeys) {
      const ko = (koData as Record<string, string>)[key];
      const en = (enData as Record<string, string>)[key];
      if (!en) continue; // covered by the parity test above
      const koPlaceholders = new Set([...ko.matchAll(placeholderRe)].map(m => m[1]));
      const enPlaceholders = new Set([...en.matchAll(placeholderRe)].map(m => m[1]));
      // Both sets should be equal
      const koMissing = [...enPlaceholders].filter(p => !koPlaceholders.has(p));
      const enMissing = [...koPlaceholders].filter(p => !enPlaceholders.has(p));
      expect(
        [...koMissing, ...enMissing],
        `Placeholder mismatch in "${key}": ko has ${[...koPlaceholders]}, en has ${[...enPlaceholders]}`,
      ).toEqual([]);
    }
  });
});
