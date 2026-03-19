import Phaser from 'phaser';
import { Direction } from '../core/GameEvents';

export class PlayerAnimator {
  private sprite: Phaser.Physics.Arcade.Sprite;
  private currentAnim = '';
  private textureKey = 'christian';

  constructor(sprite: Phaser.Physics.Arcade.Sprite) {
    this.sprite = sprite;
  }

  setTexture(key: string): void {
    this.textureKey = key;
    this.currentAnim = '';
  }

  playIdle(direction: Direction): void {
    const key = `${this.textureKey}_idle_${direction}`;
    if (this.currentAnim !== key) {
      this.currentAnim = key;
      if (this.sprite.anims.animationManager.exists(key)) {
        this.sprite.anims.play(key, true);
      }
    }
  }

  playWalk(direction: Direction): void {
    const key = `${this.textureKey}_walk_${direction}`;
    if (this.currentAnim !== key) {
      this.currentAnim = key;
      if (this.sprite.anims.animationManager.exists(key)) {
        this.sprite.anims.play(key, true);
      }
    }
  }
}
