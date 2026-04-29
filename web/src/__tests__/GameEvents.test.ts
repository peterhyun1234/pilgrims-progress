import { describe, it, expect } from 'vitest';
import { GameEvent, GameState } from '../core/GameEvents';

describe('GameEvent enum', () => {
  it('all enum values are unique snake_case strings (no two events share a string)', () => {
    const values = Object.values(GameEvent);
    const stringValues = values.filter(v => typeof v === 'string') as string[];
    const unique = new Set(stringValues);
    expect(unique.size, `Duplicate event strings would route to wrong handler: ${stringValues.join(', ')}`).toBe(stringValues.length);
    // sanity: every value is snake_case (lowercase + underscores only, no spaces)
    for (const v of stringValues) {
      expect(v, `Event "${v}" should be snake_case`).toMatch(/^[a-z][a-z0-9_:]*$/);
    }
  });

  it('NPC_INTERACT is the canonical "npc_interact" string', () => {
    // GameScene listens on this — changing it would break interactions silently
    expect(GameEvent.NPC_INTERACT).toBe('npc_interact');
  });

  it('CHAPTER_CHANGED string matches HUD listener registration', () => {
    expect(GameEvent.CHAPTER_CHANGED).toBe('chapter_changed');
  });

  it('SAVE_GAME / LOAD_GAME / AUTO_SAVE strings are stable for SaveManager', () => {
    expect(GameEvent.SAVE_GAME).toBe('save_game');
    expect(GameEvent.LOAD_GAME).toBe('load_game');
    expect(GameEvent.AUTO_SAVE).toBe('auto_save');
  });
});

describe('GameState enum', () => {
  it('contains the core scene states', () => {
    const values = Object.values(GameState).filter(v => typeof v === 'string') as string[];
    expect(values).toContain('boot');
    expect(values).toContain('menu');
    expect(values).toContain('game');
    expect(values).toContain('pause');
    expect(values).toContain('battle');
    expect(values).toContain('cutscene');
    expect(values).toContain('dialogue');
    expect(values).toContain('inventory');
  });

  it('all GameState string values are unique', () => {
    const values = Object.values(GameState).filter(v => typeof v === 'string');
    expect(new Set(values).size).toBe(values.length);
  });
});
