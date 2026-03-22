import { EventBus } from '../core/EventBus';
import { GameEvent } from '../core/GameEvents';

export class ScreenEffects {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    EventBus.getInstance().on(GameEvent.SCREEN_FADE, (data: { color: number; duration: number }) => {
      this.scene.cameras.main.fadeEffect.start(false, data.duration, 0, 0, 0, true);
    });

    EventBus.getInstance().on(GameEvent.SCREEN_FLASH, (data: { color: number; duration: number }) => {
      this.scene.cameras.main.flash(data.duration);
    });
  }
}
