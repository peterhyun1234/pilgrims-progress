import { describe, it, expect, beforeAll } from 'vitest';
import { CHAPTER_CONFIGS, ChapterConfig } from '../world/ChapterData';
import { ENEMIES } from '../systems/SkillData';
import { CUTSCENE_REGISTRY } from '../narrative/data/cutsceneDefinitions';
import { ITEMS, CHAPTER_ITEMS } from '../systems/ItemData';
import { CHAPTER_VERSES } from '../narrative/data/bibleVerses';
import { PORTRAIT_CONFIGS } from '../narrative/data/portraitData';

describe('ChapterData', () => {
  describe('CHAPTER_CONFIGS array', () => {
    it('contains exactly 12 chapters', () => {
      expect(CHAPTER_CONFIGS).toHaveLength(12);
    });

    it('chapters are numbered 1–12 in order', () => {
      const numbers = CHAPTER_CONFIGS.map(c => c.chapter);
      expect(numbers).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    });
  });

  describe('every chapter structural contract', () => {
    for (const config of CHAPTER_CONFIGS) {
      it(`Ch${config.chapter} has required fields`, () => {
        expect(config.chapter).toBeGreaterThanOrEqual(1);
        expect(config.locationName).toBeTruthy();
        expect(config.locationNameEn).toBeTruthy();
        expect(config.mapWidth).toBeGreaterThan(0);
        expect(config.mapHeight).toBeGreaterThan(0);
        expect(config.spawn.x).toBeGreaterThanOrEqual(0);
        expect(config.spawn.y).toBeGreaterThanOrEqual(0);
        expect(Array.isArray(config.npcs)).toBe(true);
        expect(config.theme).toBeDefined();
      });

      it(`Ch${config.chapter} spawn is within map bounds`, () => {
        expect(config.spawn.x).toBeLessThanOrEqual(config.mapWidth);
        expect(config.spawn.y).toBeLessThanOrEqual(config.mapHeight);
      });
    }
  });

  describe('exit zone validity', () => {
    for (const config of CHAPTER_CONFIGS) {
      if (!config.exits?.length) continue;
      it(`Ch${config.chapter} exits have positive dimensions and stay inside map bounds`, () => {
        for (const exit of config.exits!) {
          expect(exit.width).toBeGreaterThan(0);
          expect(exit.height).toBeGreaterThan(0);
          expect(exit.targetChapter).toBeGreaterThan(0);
          // Exit rect must be reachable — entirely inside the chapter map.
          // Out-of-bounds exits would silently never trigger.
          expect(exit.x).toBeGreaterThanOrEqual(0);
          expect(exit.y).toBeGreaterThanOrEqual(0);
          expect(exit.x + exit.width).toBeLessThanOrEqual(config.mapWidth);
          expect(exit.y + exit.height).toBeLessThanOrEqual(config.mapHeight);
        }
      });

      it(`Ch${config.chapter} exits target an existing chapter`, () => {
        const validChapterNumbers = new Set(CHAPTER_CONFIGS.map(c => c.chapter));
        for (const exit of config.exits!) {
          expect(validChapterNumbers.has(exit.targetChapter)).toBe(true);
        }
      });
    }
  });

  describe('npc spawn positions inside map bounds', () => {
    for (const config of CHAPTER_CONFIGS) {
      if (!config.npcs.length) continue;
      it(`Ch${config.chapter} NPCs spawn inside the map`, () => {
        for (const npc of config.npcs) {
          expect(npc.x).toBeGreaterThanOrEqual(0);
          expect(npc.x).toBeLessThanOrEqual(config.mapWidth);
          expect(npc.y).toBeGreaterThanOrEqual(0);
          expect(npc.y).toBeLessThanOrEqual(config.mapHeight);
        }
      });
    }
  });

  describe('terrain zone bounds + id uniqueness', () => {
    for (const config of CHAPTER_CONFIGS) {
      if (!config.terrainZones?.length) continue;
      it(`Ch${config.chapter} terrain zones stay inside map and have unique ids`, () => {
        const ids = new Set<string>();
        for (const tz of config.terrainZones!) {
          expect(tz.x).toBeGreaterThanOrEqual(0);
          expect(tz.y).toBeGreaterThanOrEqual(0);
          expect(tz.x + tz.width).toBeLessThanOrEqual(config.mapWidth);
          expect(tz.y + tz.height).toBeLessThanOrEqual(config.mapHeight);
          expect(tz.width).toBeGreaterThan(0);
          expect(tz.height).toBeGreaterThan(0);
          // slowFactor should be in (0, 1] — values >1 would speed the player up
          // (semantics-mismatch: it's a slow factor, not a speed multiplier)
          if (tz.slowFactor !== undefined) {
            expect(tz.slowFactor).toBeGreaterThan(0);
            expect(tz.slowFactor).toBeLessThanOrEqual(1);
          }
          // id uniqueness within the chapter
          expect(ids.has(tz.id)).toBe(false);
          ids.add(tz.id);
        }
      });
    }
  });

  describe('event zone bounds', () => {
    for (const config of CHAPTER_CONFIGS) {
      if (!config.events?.length) continue;
      it(`Ch${config.chapter} event zones stay inside map bounds`, () => {
        for (const ev of config.events!) {
          expect(ev.x).toBeGreaterThanOrEqual(0);
          expect(ev.y).toBeGreaterThanOrEqual(0);
          expect(ev.x + ev.width).toBeLessThanOrEqual(config.mapWidth);
          expect(ev.y + ev.height).toBeLessThanOrEqual(config.mapHeight);
        }
      });
    }
  });

  describe('event zone validity', () => {
    for (const config of CHAPTER_CONFIGS) {
      if (!config.events?.length) continue;
      it(`Ch${config.chapter} events have valid structure`, () => {
        for (const ev of config.events!) {
          expect(ev.id).toBeTruthy();
          expect(['battle', 'item', 'cutscene', 'dialogue']).toContain(ev.type);
          expect(ev.width).toBeGreaterThan(0);
          expect(ev.height).toBeGreaterThan(0);
          expect(typeof ev.triggerOnce).toBe('boolean');
        }
      });
    }
  });

  // ─── Chapter 6: The Cross — specific assertions ────────────────────────────

  describe('Chapter 6 (십자가 / The Cross)', () => {
    let ch6: ChapterConfig;

    beforeAll(() => {
      ch6 = CHAPTER_CONFIGS.find(c => c.chapter === 6)!;
    });

    it('exists in CHAPTER_CONFIGS', () => {
      expect(ch6).toBeDefined();
    });

    it('has correct location name', () => {
      expect(ch6.locationName).toBe('십자가');
      expect(ch6.locationNameEn).toBe('The Cross');
    });

    it('has a spawn near south edge', () => {
      expect(ch6.spawn.y).toBeGreaterThan(ch6.mapHeight / 2);
    });

    it('has the ch6_burden_released cutscene event', () => {
      const ev = ch6.events?.find(e => e.id === 'ch6_burden_released');
      expect(ev).toBeDefined();
      expect(ev?.type).toBe('cutscene');
      expect(ev?.triggerOnce).toBe(true);
      expect(ev?.data?.cutsceneId).toBe('ch6_burden_released');
    });

    it('has a north exit to chapter 7', () => {
      expect(ch6.exits).toBeDefined();
      const exit = ch6.exits?.find(e => e.targetChapter === 7);
      expect(exit).toBeDefined();
      // North exit: y near 0
      expect(exit!.y).toBeLessThan(100);
    });

    it('has the cross landmark as a map object', () => {
      const cross = ch6.mapObjects?.find(o => o.id === 'ch6_cross');
      expect(cross).toBeDefined();
      expect(cross?.type).toBe('sign');
    });

    it('requires ch6_burden_released event for completion', () => {
      expect(ch6.completionRequirements?.requiredEvents).toContain('ch6_burden_released');
    });

    it('has bgmKey defined', () => {
      expect(ch6.bgmKey).toBeTruthy();
    });
  });

  // ─── NPC uniqueness within chapters ────────────────────────────────────────

  describe('NPC id uniqueness per chapter', () => {
    for (const config of CHAPTER_CONFIGS) {
      if (!config.npcs.length) continue;
      it(`Ch${config.chapter} NPC ids are unique`, () => {
        const ids = config.npcs.map(n => n.id);
        const unique = new Set(ids);
        expect(unique.size).toBe(ids.length);
      });
    }
  });

  // ─── Cross-system reference integrity ──────────────────────────────────────

  describe('battle event enemyId references real enemy', () => {
    for (const config of CHAPTER_CONFIGS) {
      if (!config.events?.length) continue;
      const battleEvents = config.events.filter(e => e.type === 'battle');
      if (battleEvents.length === 0) continue;
      it(`Ch${config.chapter} battle events name a real enemy in ENEMIES`, () => {
        for (const ev of battleEvents) {
          const enemyId = ev.data?.enemyId;
          if (typeof enemyId === 'string') {
            // Misnamed enemy = player triggers battle, BattleScene loads but
            // no enemy → silent crash or null deref
            expect(ENEMIES[enemyId]).toBeDefined();
          }
        }
      });
    }
  });

  describe('every NPC id resolves to a portrait config (so sprite generation works)', () => {
    // NPCs use `${config.id}_gen` as their preferred texture key, generated by
    // CharacterSpriteFactory. If PORTRAIT_CONFIGS lacks the id, the factory
    // logs a warning and returns the raw id — Phaser then renders a missing
    // texture (purple/magenta box). Catches typos and per-chapter NPC id
    // variants like `worldly_wiseman_ch3` that need their own portrait alias.
    const LEGACY_SPRITE_IDS = new Set([
      'faithful', 'hopeful', 'apollyon', 'giant_despair',
    ]);
    for (const config of CHAPTER_CONFIGS) {
      it(`Ch${config.chapter} NPC ids all map to a portrait or legacy sprite`, () => {
        for (const npc of config.npcs) {
          const hasPortrait = PORTRAIT_CONFIGS[npc.id] !== undefined;
          const isLegacy = LEGACY_SPRITE_IDS.has(npc.id);
          expect(hasPortrait || isLegacy, `NPC "${npc.id}" has no PORTRAIT_CONFIGS entry and isn't a legacy sprite`).toBe(true);
        }
      });
    }
  });

  describe('CHAPTER_VERSES has a verse for every chapter and refs are non-empty', () => {
    for (const config of CHAPTER_CONFIGS) {
      it(`Ch${config.chapter} has a Bible verse with both languages and a reference`, () => {
        const v = CHAPTER_VERSES[config.chapter];
        expect(v).toBeDefined();
        if (!v) return;
        expect(v.ko).toBeTruthy();
        expect(v.en).toBeTruthy();
        expect(v.refKo).toBeTruthy();
        expect(v.refEn).toBeTruthy();
      });
    }
  });

  describe('CHAPTER_ITEMS reference real items + are in chapter bounds', () => {
    for (const [chKey, items] of Object.entries(CHAPTER_ITEMS)) {
      const chNum = Number(chKey);
      const config = CHAPTER_CONFIGS.find(c => c.chapter === chNum);
      it(`Ch${chNum} item drops reference real items in ITEMS and stay in bounds`, () => {
        // Chapter must exist for the item drop to be reachable
        expect(config).toBeDefined();
        if (!config) return;
        const seenIds = new Set<string>();
        for (const drop of items) {
          // Real item def
          expect(ITEMS[drop.itemId]).toBeDefined();
          // In bounds
          expect(drop.x).toBeGreaterThanOrEqual(0);
          expect(drop.x).toBeLessThanOrEqual(config.mapWidth);
          expect(drop.y).toBeGreaterThanOrEqual(0);
          expect(drop.y).toBeLessThanOrEqual(config.mapHeight);
          seenIds.add(drop.itemId);
        }
        // Note: same itemId can appear in multiple chapter drops intentionally
        // (e.g. wisdom_scroll in both Ch3 and Ch5) — uniqueness within a single
        // chapter's item drops is also fine; we don't enforce that.
      });
    }
  });

  describe('cutscene references resolve (or are in known-gap list)', () => {
    // 5 cutscenes are referenced by chapter events but not yet implemented.
    // GameScene.playCutsceneEvent gracefully no-ops via the `if (!def)` branch
    // (line ~1383), so missing cutscenes don't crash — they just skip the
    // story moment silently. This list documents those known gaps so adding
    // a NEW unreferenced cutscene id still trips the test.
    const KNOWN_MISSING_CUTSCENES = new Set([
      'faithful_joins',           // Ch10 — Faithful joining the journey
      'giant_despair_entrance',   // Ch11 — Giant Despair appears
      'key_of_promise',           // Ch11 — Promise key revelation
      'river_crossing',           // Ch12 — crossing the final river
      'ignorance_turned_away',    // Ch12 — Ignorance's fate
    ]);

    for (const config of CHAPTER_CONFIGS) {
      if (!config.events?.length) continue;
      it(`Ch${config.chapter} cutsceneId / cutsceneBefore refs are registered or known-missing`, () => {
        for (const ev of config.events!) {
          const cutsceneId = ev.data?.cutsceneId;
          const cutsceneBefore = ev.data?.cutsceneBefore;
          for (const id of [cutsceneId, cutsceneBefore]) {
            if (typeof id !== 'string') continue;
            const known = CUTSCENE_REGISTRY[id] !== undefined || KNOWN_MISSING_CUTSCENES.has(id);
            expect(known, `Cutscene "${id}" is referenced but neither registered nor in KNOWN_MISSING_CUTSCENES list`).toBe(true);
          }
        }
      });
    }
  });

  // ─── completionRequirements referential integrity ─────────────────────────

  describe('completionRequirements references valid NPCs and events', () => {
    for (const config of CHAPTER_CONFIGS) {
      if (!config.completionRequirements) continue;
      it(`Ch${config.chapter} completionRequirements name real NPCs/events`, () => {
        const npcIds = new Set(config.npcs.map(n => n.id));
        const eventIds = new Set((config.events ?? []).map(e => e.id));
        for (const npcId of config.completionRequirements?.requiredNpcs ?? []) {
          // Misnamed required NPC = chapter unfinishable
          expect(npcIds.has(npcId)).toBe(true);
        }
        for (const evId of config.completionRequirements?.requiredEvents ?? []) {
          // Misnamed required event = chapter unfinishable
          expect(eventIds.has(evId)).toBe(true);
        }
      });
    }
  });

  // ─── NPC unlockedAt references ─────────────────────────────────────────────

  describe('NPC unlockedAt references existing NPC in same chapter', () => {
    for (const config of CHAPTER_CONFIGS) {
      it(`Ch${config.chapter} npc.unlockedAt fields name a chapter-mate NPC`, () => {
        const npcIds = new Set(config.npcs.map(n => n.id));
        for (const npc of config.npcs) {
          if (npc.unlockedAt) {
            // Misnamed prerequisite = NPC silently never unlocks
            expect(npcIds.has(npc.unlockedAt)).toBe(true);
            // No NPC should depend on itself
            expect(npc.unlockedAt).not.toBe(npc.id);
          }
        }
      });
    }
  });

  // ─── Map object validity ───────────────────────────────────────────────────

  describe('map object id uniqueness + bounds + opensOnNpcComplete refs', () => {
    for (const config of CHAPTER_CONFIGS) {
      if (!config.mapObjects?.length) continue;
      it(`Ch${config.chapter} mapObject ids are unique and positions are in bounds`, () => {
        const ids = config.mapObjects!.map(o => o.id);
        const unique = new Set(ids);
        expect(unique.size).toBe(ids.length);
        for (const obj of config.mapObjects!) {
          expect(obj.x).toBeGreaterThanOrEqual(0);
          expect(obj.x).toBeLessThanOrEqual(config.mapWidth);
          expect(obj.y).toBeGreaterThanOrEqual(0);
          expect(obj.y).toBeLessThanOrEqual(config.mapHeight);
        }
      });

      it(`Ch${config.chapter} opensOnNpcComplete refs name an NPC in this chapter`, () => {
        const npcIds = new Set(config.npcs.map(n => n.id));
        for (const obj of config.mapObjects!) {
          if (obj.opensOnNpcComplete) {
            // Misnamed gate trigger would silently never open — gameplay block
            expect(npcIds.has(obj.opensOnNpcComplete)).toBe(true);
          }
        }
      });
    }
  });

  // ─── Perspective field ─────────────────────────────────────────────────────
  // Catches typos when adding new chapters. Adding a 13th chapter without a
  // valid perspective will fail typecheck via PerspectiveMode, but a typo
  // through `as any` would still slip past — this test guards that.

  describe('perspective field', () => {
    const VALID_PERSPECTIVES = ['legacy', 'sideScroll', 'topDown', 'celestial'];

    for (const config of CHAPTER_CONFIGS) {
      it(`Ch${config.chapter} has a valid perspective (or undefined → defaults to legacy)`, () => {
        if (config.perspective !== undefined) {
          expect(VALID_PERSPECTIVES).toContain(config.perspective);
        }
      });
    }

    it('current perspective distribution matches the rollout plan', () => {
      const counts = { legacy: 0, sideScroll: 0, topDown: 0, celestial: 0 };
      for (const c of CHAPTER_CONFIGS) {
        const p = c.perspective ?? 'legacy';
        counts[p]++;
      }
      // Frozen as of the Phase 2 rollout. Update intentionally if the plan
      // changes — failing this means a chapter's perspective was edited
      // without updating the canonical map.
      expect(counts).toEqual({ legacy: 0, sideScroll: 6, topDown: 5, celestial: 1 });
    });
  });
});
