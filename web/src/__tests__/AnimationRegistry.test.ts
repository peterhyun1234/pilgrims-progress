import { describe, it, expect } from 'vitest';
import {
  AnimationRegistry,
  DEFAULT_ANIM_SET_32,
  LEGACY_ANIM_SET_16,
} from '../entities/AnimationRegistry';
import { PlayerState, Direction } from '../core/GameEvents';

describe('AnimationRegistry', () => {
  describe('animation set definitions', () => {
    it('DEFAULT_ANIM_SET_32 has 8 columns and idle/walk animations', () => {
      expect(DEFAULT_ANIM_SET_32.columns).toBe(8);
      expect(DEFAULT_ANIM_SET_32.anims.idle).toBeDefined();
      expect(DEFAULT_ANIM_SET_32.anims.walk).toBeDefined();
      expect(DEFAULT_ANIM_SET_32.anims.idle.frameCount).toBe(4);
      expect(DEFAULT_ANIM_SET_32.anims.walk.frameCount).toBe(6);
    });

    it('LEGACY_ANIM_SET_16 has 3 columns and idle/walk/run animations', () => {
      expect(LEGACY_ANIM_SET_16.columns).toBe(3);
      expect(LEGACY_ANIM_SET_16.anims.idle).toBeDefined();
      expect(LEGACY_ANIM_SET_16.anims.walk).toBeDefined();
      expect(LEGACY_ANIM_SET_16.anims.run).toBeDefined();
    });

    it('all anims have repeat = -1 (loop) or 0 (once) — no other values', () => {
      for (const set of [DEFAULT_ANIM_SET_32, LEGACY_ANIM_SET_16]) {
        for (const def of Object.values(set.anims)) {
          // Phaser convention: -1 loops forever, 0 plays once
          expect([-1, 0]).toContain(def.repeat);
          expect(def.frameRate).toBeGreaterThan(0);
          expect(def.frameCount).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('getAnimKey', () => {
    it('builds expected key shape: <textureKey>_<animName>_<direction>', () => {
      // No registered set → fallback to literal animName from STATE_TO_ANIM
      expect(AnimationRegistry.getAnimKey('christian_gen', PlayerState.IDLE, Direction.DOWN))
        .toBe('christian_gen_idle_down');
      expect(AnimationRegistry.getAnimKey('christian_gen', PlayerState.WALK, Direction.LEFT))
        .toBe('christian_gen_walk_left');
    });

    it('RUN state reuses walk animation key (faster frame rate elsewhere)', () => {
      expect(AnimationRegistry.getAnimKey('christian_gen', PlayerState.RUN, Direction.UP))
        .toBe('christian_gen_walk_up');
    });

    it('non-movement states (INTERACT/HURT/PRAY/CELEBRATE/FALL/CUTSCENE) collapse to idle', () => {
      expect(AnimationRegistry.getAnimKey('x', PlayerState.INTERACT, Direction.RIGHT)).toContain('_idle_');
      expect(AnimationRegistry.getAnimKey('x', PlayerState.HURT,    Direction.RIGHT)).toContain('_idle_');
      expect(AnimationRegistry.getAnimKey('x', PlayerState.PRAY,    Direction.RIGHT)).toContain('_idle_');
      expect(AnimationRegistry.getAnimKey('x', PlayerState.CELEBRATE,Direction.RIGHT)).toContain('_idle_');
      expect(AnimationRegistry.getAnimKey('x', PlayerState.FALL,    Direction.RIGHT)).toContain('_idle_');
      expect(AnimationRegistry.getAnimKey('x', PlayerState.CUTSCENE,Direction.RIGHT)).toContain('_idle_');
    });
  });

  describe('hasAnim', () => {
    it('returns false for unregistered textures (no registry side effect)', () => {
      expect(AnimationRegistry.hasAnim('not_registered', 'idle')).toBe(false);
    });
  });

  describe('getSet', () => {
    it('returns undefined for unregistered textures', () => {
      expect(AnimationRegistry.getSet('not_registered')).toBeUndefined();
    });
  });
});
