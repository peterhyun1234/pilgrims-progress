import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

export class TransitionOverlay {
  private scene: Phaser.Scene;
  private overlay: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.overlay = scene.add.rectangle(
      GAME_WIDTH / 2, GAME_HEIGHT / 2,
      GAME_WIDTH, GAME_HEIGHT,
      0x000000,
    )
      .setScrollFactor(0)
      .setDepth(1000)
      .setAlpha(0);
  }

  fadeIn(duration = 500): Promise<void> {
    return new Promise((resolve) => {
      this.scene.tweens.add({
        targets: this.overlay,
        alpha: 1,
        duration,
        ease: 'Power2',
        onComplete: () => resolve(),
      });
    });
  }

  fadeOut(duration = 500): Promise<void> {
    return new Promise((resolve) => {
      this.scene.tweens.add({
        targets: this.overlay,
        alpha: 0,
        duration,
        ease: 'Power2',
        onComplete: () => resolve(),
      });
    });
  }

  flash(duration = 200): void {
    this.overlay.setAlpha(1);
    this.overlay.setFillStyle(0xffffff);
    this.scene.tweens.add({
      targets: this.overlay,
      alpha: 0,
      duration,
      ease: 'Power2',
      onComplete: () => this.overlay.setFillStyle(0x000000),
    });
  }
}
