import { describe, it, expect } from 'vitest';
import { FALLBACK_DIALOGUES, Conversation, ConvChoice } from '../narrative/data/fallbackDialogues';

// ─── helpers ────────────────────────────────────────────────────────────────

function getGatedChoices(conv: Conversation): ConvChoice[] {
  return (conv.choices ?? []).filter(c => c.requires != null);
}

function getUnlockedChoices(conv: Conversation): ConvChoice[] {
  return (conv.choices ?? []).filter(c => c.requires == null);
}

// ─── structural contract ─────────────────────────────────────────────────────

describe('FALLBACK_DIALOGUES', () => {
  describe('data shape', () => {
    it('is a non-empty record', () => {
      expect(Object.keys(FALLBACK_DIALOGUES).length).toBeGreaterThan(0);
    });

    for (const [key, langConv] of Object.entries(FALLBACK_DIALOGUES)) {
      it(`${key}: has both ko and en variants`, () => {
        expect(langConv.ko).toBeDefined();
        expect(langConv.en).toBeDefined();
      });

      it(`${key}: each variant has at least one line`, () => {
        expect(langConv.ko.lines.length).toBeGreaterThan(0);
        expect(langConv.en.lines.length).toBeGreaterThan(0);
      });

      it(`${key}: lines have non-empty text`, () => {
        for (const line of [...langConv.ko.lines, ...langConv.en.lines]) {
          expect(line.text.trim().length).toBeGreaterThan(0);
        }
      });
    }
  });

  // ─── stat-gated choices contract ──────────────────────────────────────────

  describe('stat-gated choices', () => {
    it('every requires block has valid stat and positive min', () => {
      const validStats = new Set(['faith', 'courage', 'wisdom', 'burden']);
      for (const [key, langConv] of Object.entries(FALLBACK_DIALOGUES)) {
        for (const lang of ['ko', 'en'] as const) {
          for (const choice of langConv[lang].choices ?? []) {
            if (!choice.requires) continue;
            expect(validStats.has(choice.requires.stat),
              `${key}/${lang}: invalid stat "${choice.requires.stat}"`).toBe(true);
            expect(choice.requires.min,
              `${key}/${lang}: min must be > 0`).toBeGreaterThan(0);
          }
        }
      }
    });

    it('gated choices always have at least one response line', () => {
      for (const [key, langConv] of Object.entries(FALLBACK_DIALOGUES)) {
        for (const lang of ['ko', 'en'] as const) {
          for (const choice of getGatedChoices(langConv[lang])) {
            expect(choice.lines?.length ?? 0,
              `${key}/${lang}: gated choice must have response lines`).toBeGreaterThan(0);
          }
        }
      }
    });
  });

  // ─── watchful ─────────────────────────────────────────────────────────────

  describe('watchful', () => {
    const d = FALLBACK_DIALOGUES['watchful'];

    it('exists', () => {
      expect(d).toBeDefined();
    });

    it('ko: has a faith-gated choice (min 20)', () => {
      const gated = getGatedChoices(d.ko);
      const faithGate = gated.find(c => c.requires?.stat === 'faith' && c.requires?.min === 20);
      expect(faithGate).toBeDefined();
    });

    it('en: has matching faith-gated choice (min 20)', () => {
      const gated = getGatedChoices(d.en);
      const faithGate = gated.find(c => c.requires?.stat === 'faith' && c.requires?.min === 20);
      expect(faithGate).toBeDefined();
    });

    it('ko: faith-gated choice rewards faith', () => {
      const choice = d.ko.choices!.find(c => c.requires?.stat === 'faith')!;
      expect(choice.stat).toBe('faith');
      expect(choice.amount).toBeGreaterThan(0);
    });

    it('has a repeated line', () => {
      expect(d.ko.repeated?.length).toBeGreaterThan(0);
      expect(d.en.repeated?.length).toBeGreaterThan(0);
    });
  });

  // ─── timorous ─────────────────────────────────────────────────────────────

  describe('timorous', () => {
    const d = FALLBACK_DIALOGUES['timorous'];

    it('exists', () => {
      expect(d).toBeDefined();
    });

    it('ko: has 3 choices', () => {
      expect(d.ko.choices?.length).toBe(3);
    });

    it('en: has 3 choices', () => {
      expect(d.en.choices?.length).toBe(3);
    });

    it('ko: first choice requires wisdom >= 25', () => {
      const gated = getGatedChoices(d.ko);
      const wisdomGate = gated.find(c => c.requires?.stat === 'wisdom' && c.requires?.min === 25);
      expect(wisdomGate).toBeDefined();
    });

    it('ko: wisdom-gated choice rewards courage', () => {
      const choice = d.ko.choices!.find(c => c.requires?.stat === 'wisdom')!;
      expect(choice.stat).toBe('courage');
      expect(choice.amount).toBeGreaterThanOrEqual(10);
    });

    it('en: first choice requires wisdom >= 25', () => {
      const gated = getGatedChoices(d.en);
      expect(gated.find(c => c.requires?.stat === 'wisdom' && c.requires?.min === 25)).toBeDefined();
    });

    it('ko: has at least one unlocked choice', () => {
      expect(getUnlockedChoices(d.ko).length).toBeGreaterThan(0);
    });

    it('ko: opening lines apply courage penalty (burden-like discouragement)', () => {
      const negativeLine = d.ko.lines.find(l => l.amount != null && l.amount < 0);
      expect(negativeLine).toBeDefined();
    });
  });

  // ─── prudence ─────────────────────────────────────────────────────────────

  describe('prudence', () => {
    const d = FALLBACK_DIALOGUES['prudence'];

    it('exists', () => {
      expect(d).toBeDefined();
    });

    it('ko: has 3 choices', () => {
      expect(d.ko.choices?.length).toBe(3);
    });

    it('en: has 3 choices', () => {
      expect(d.en.choices?.length).toBe(3);
    });

    it('all choice response lines have non-empty text', () => {
      for (const lang of ['ko', 'en'] as const) {
        for (const choice of d[lang].choices ?? []) {
          for (const line of choice.lines ?? []) {
            expect(line.text.trim().length).toBeGreaterThan(0);
          }
        }
      }
    });
  });

  // ─── evangelist ───────────────────────────────────────────────────────────

  describe('evangelist', () => {
    const d = FALLBACK_DIALOGUES['evangelist'];

    it('exists', () => {
      expect(d).toBeDefined();
    });

    it('ko: first line sequence gives faith', () => {
      const faithLine = d.ko.lines.find(l => l.stat === 'faith' && (l.amount ?? 0) > 0);
      expect(faithLine).toBeDefined();
    });

    it('ko: has a faith-gated advanced question (min 35)', () => {
      const gated = getGatedChoices(d.ko);
      expect(gated.find(c => c.requires?.stat === 'faith' && c.requires?.min === 35)).toBeDefined();
    });
  });
});
