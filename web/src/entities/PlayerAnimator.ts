import { Direction, PlayerState } from '../core/GameEvents';
import { AnimationRegistry } from './AnimationRegistry';

export class PlayerAnimator {
  private sprite: Phaser.Physics.Arcade.Sprite;
  private currentDir: Direction = Direction.DOWN;
  private characterKey: string;
  private currentAnimKey = '';

  constructor(sprite: Phaser.Physics.Arcade.Sprite, characterKey = 'christian') {
    this.sprite = sprite;
    this.characterKey = characterKey;
  }

  setCharacterKey(key: string): void {
    this.characterKey = key;
    this.currentAnimKey = '';
  }

  update(state: PlayerState, vx: number, vy: number): void {
    // Determine facing direction from velocity
    if (vx !== 0 || vy !== 0) {
      if (Math.abs(vx) > Math.abs(vy)) {
        this.currentDir = vx > 0 ? Direction.RIGHT : Direction.LEFT;
      } else {
        this.currentDir = vy > 0 ? Direction.DOWN : Direction.UP;
      }
    }

    const animKey = AnimationRegistry.getAnimKey(
      this.characterKey, state, this.currentDir,
    );

    if (animKey !== this.currentAnimKey) {
      if (this.sprite.scene.anims.exists(animKey)) {
        this.sprite.play(animKey, true);
        this.currentAnimKey = animKey;
      } else {
        // Fallback to idle if requested anim doesn't exist
        const fallback = `${this.characterKey}_idle_${this.currentDir}`;
        if (this.sprite.scene.anims.exists(fallback) && fallback !== this.currentAnimKey) {
          this.sprite.play(fallback, true);
          this.currentAnimKey = fallback;
        }
      }
    }
  }

  getDirection(): Direction {
    return this.currentDir;
  }

  /** Force play a specific animation (for cutscenes/special states) */
  playAnim(animName: string, dir?: Direction): void {
    const d = dir ?? this.currentDir;
    const key = `${this.characterKey}_${animName}_${d}`;
    if (this.sprite.scene.anims.exists(key)) {
      this.sprite.play(key, true);
      this.currentAnimKey = key;
    }
  }
}
