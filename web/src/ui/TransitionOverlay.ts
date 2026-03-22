import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { EventBus } from '../core/EventBus';
import { GameEvent } from '../core/GameEvents';

export class TransitionOverlay {
  private scene: Phaser.Scene;
  private overlay: Phaser.GameObjects.Rectangle;
  private eventBus: EventBus;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.eventBus = EventBus.getInstance();

    this.overlay = scene.add.rectangle(
      GAME_WIDTH / 2, GAME_HEIGHT / 2,
      GAME_WIDTH, GAME_HEIGHT,
      0x000000, 0,
    ).setDepth(9998).setScrollFactor(0);

    this.setupEvents();
  }

  private setupEvents(): void {
    this.eventBus.on(GameEvent.SCREEN_FADE, (data: { color: number; duration: number }) => {
      this.fade(data.color, data.duration);
    });

    this.eventBus.on(GameEvent.SCREEN_FLASH, (data: { color: number; duration: number }) => {
      this.flash(data.color, data.duration);
    });
  }

  fade(color: number, duration: number): Promise<void> {
    return new Promise(resolve => {
      this.overlay.setFillStyle(color, 0);
      this.scene.tweens.add({
        targets: this.overlay,
        alpha: 1,
        duration: duration / 2,
        yoyo: true,
        onComplete: () => resolve(),
      });
    });
  }

  flash(color: number, duration: number): void {
    this.overlay.setFillStyle(color, 1);
    this.overlay.setAlpha(1);
    this.scene.tweens.add({
      targets: this.overlay,
      alpha: 0,
      duration,
      ease: 'Quad.easeOut',
    });
  }

  destroy(): void {
    this.overlay.destroy();
  }
}
