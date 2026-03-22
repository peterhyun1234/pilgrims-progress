import { Direction, PlayerState } from '../core/GameEvents';

export class PlayerAnimator {
  private sprite: Phaser.Physics.Arcade.Sprite;
  private currentDir: Direction = Direction.DOWN;
  private characterKey: string;

  constructor(sprite: Phaser.Physics.Arcade.Sprite, characterKey = 'christian') {
    this.sprite = sprite;
    this.characterKey = characterKey;
  }

  update(state: PlayerState, vx: number, vy: number): void {
    if (vx !== 0 || vy !== 0) {
      if (Math.abs(vx) > Math.abs(vy)) {
        this.currentDir = vx > 0 ? Direction.RIGHT : Direction.LEFT;
      } else {
        this.currentDir = vy > 0 ? Direction.DOWN : Direction.UP;
      }
    }

    const animKey = state === PlayerState.WALK || state === PlayerState.RUN
      ? `${this.characterKey}_walk_${this.currentDir}`
      : `${this.characterKey}_idle_${this.currentDir}`;

    if (this.sprite.anims.currentAnim?.key !== animKey) {
      if (this.sprite.scene.anims.exists(animKey)) {
        this.sprite.play(animKey, true);
      }
    }
  }

  getDirection(): Direction {
    return this.currentDir;
  }
}
