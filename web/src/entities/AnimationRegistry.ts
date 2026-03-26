import { Direction, PlayerState } from '../core/GameEvents';

/** Sprite frame layout: each row = direction (down, left, right, up), columns vary by anim type */
export interface AnimDef {
  key: string;
  row: number;        // direction row offset
  startCol: number;
  frameCount: number;
  frameRate: number;
  repeat: number;      // -1 = loop
  /** If true, animation plays once and holds last frame */
  holdLast?: boolean;
}

export interface CharacterAnimSet {
  /** Sprite atlas key (matches texture key in Phaser) */
  textureKey: string;
  /** Columns in spritesheet */
  columns: number;
  /** Maps PlayerState (or 'idle'/'walk') to base anim config (per direction) */
  anims: Record<string, Omit<AnimDef, 'key' | 'row'>>;
}

/**
 * Default animation set for 32×32 characters.
 * Spritesheet layout (8 cols × 8 rows):
 *   Row 0-3: idle (4 directions: down, left, right, up), 4 frames each
 *   Row 4-7: walk (4 directions), 6 frames each
 *   (Remaining columns are blank / future use)
 *
 * For legacy 16×16 (3 cols × 4 rows):
 *   Row 0-3: directions, 3 frames (col 0 = idle, col 0-2 = walk)
 */
/**
 * Default animation set for 32×32 characters.
 * Spritesheet layout (8 cols × 8 rows):
 *   Rows 0-3: idle (down, left, right, up) — 4 frames each
 *   Rows 4-7: walk (down, left, right, up) — 6 frames each
 *
 * "run" reuses walk rows with faster frameRate.
 * Other states (interact, hurt, pray, celebrate) reuse idle rows.
 */
export const DEFAULT_ANIM_SET_32: Omit<CharacterAnimSet, 'textureKey'> = {
  columns: 8,
  anims: {
    idle: { startCol: 0, frameCount: 4, frameRate: 4, repeat: -1 },
    walk: { startCol: 0, frameCount: 6, frameRate: 10, repeat: -1 },
  },
};

/** Legacy 16×16 layout — 3 columns, 4 rows (down/left/right/up) */
export const LEGACY_ANIM_SET_16: Omit<CharacterAnimSet, 'textureKey'> = {
  columns: 3,
  anims: {
    idle: { startCol: 0, frameCount: 1, frameRate: 1, repeat: 0 },
    walk: { startCol: 0, frameCount: 3, frameRate: 8, repeat: -1 },
    run:  { startCol: 0, frameCount: 3, frameRate: 12, repeat: -1 },
  },
};

const DIR_ORDER: Direction[] = [Direction.DOWN, Direction.LEFT, Direction.RIGHT, Direction.UP];

/** Maps PlayerState to animation name. Only idle/walk exist in generated spritesheets. */
const STATE_TO_ANIM: Record<PlayerState, string> = {
  [PlayerState.IDLE]: 'idle',
  [PlayerState.WALK]: 'walk',
  [PlayerState.RUN]: 'walk',       // reuses walk frames, PlayerAnimator sets faster rate
  [PlayerState.INTERACT]: 'idle',
  [PlayerState.HURT]: 'idle',
  [PlayerState.PRAY]: 'idle',
  [PlayerState.CELEBRATE]: 'idle',
  [PlayerState.FALL]: 'idle',
  [PlayerState.CUTSCENE]: 'idle',
};

export class AnimationRegistry {
  private static registeredSets = new Map<string, CharacterAnimSet>();

  /**
   * Register all animations for a character.
   * Call once in PreloadScene after textures are loaded.
   */
  static register(
    scene: Phaser.Scene,
    textureKey: string,
    animSet: Omit<CharacterAnimSet, 'textureKey'> = LEGACY_ANIM_SET_16,
  ): void {
    const fullSet: CharacterAnimSet = { textureKey, ...animSet };
    this.registeredSets.set(textureKey, fullSet);

    const { columns, anims } = fullSet;

    for (const [animName, def] of Object.entries(anims)) {
      for (let dirIdx = 0; dirIdx < DIR_ORDER.length; dirIdx++) {
        const dir = DIR_ORDER[dirIdx];
        const key = `${textureKey}_${animName}_${dir}`;

        if (scene.anims.exists(key)) continue;

        // For legacy 16×16: idle row = direction index, walk row = same
        // For 32×32: idle rows 0-3, walk rows 4-7
        let rowOffset: number;
        if (animSet === LEGACY_ANIM_SET_16) {
          rowOffset = dirIdx;
        } else {
          // Each animation type occupies 4 rows (one per direction)
          const animTypeIndex = Object.keys(anims).indexOf(animName);
          rowOffset = animTypeIndex * 4 + dirIdx;
        }

        const startFrame = rowOffset * columns + def.startCol;
        const frames = scene.anims.generateFrameNumbers(textureKey, {
          start: startFrame,
          end: startFrame + def.frameCount - 1,
        });

        scene.anims.create({
          key,
          frames,
          frameRate: def.frameRate,
          repeat: def.repeat,
        });
      }
    }
  }

  /** Get the animation key for a given state + direction */
  static getAnimKey(textureKey: string, state: PlayerState, dir: Direction): string {
    const set = this.registeredSets.get(textureKey);
    const animName = STATE_TO_ANIM[state] ?? 'idle';

    // Fallback: if the requested anim doesn't exist for this character, try 'idle'
    if (set && !set.anims[animName]) {
      return `${textureKey}_idle_${dir}`;
    }
    return `${textureKey}_${animName}_${dir}`;
  }

  /** Check if a character has a specific animation type registered */
  static hasAnim(textureKey: string, animName: string): boolean {
    const set = this.registeredSets.get(textureKey);
    return set ? animName in set.anims : false;
  }

  static getSet(textureKey: string): CharacterAnimSet | undefined {
    return this.registeredSets.get(textureKey);
  }
}
