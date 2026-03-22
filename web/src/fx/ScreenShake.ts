import { EventBus } from '../core/EventBus';
import { GameEvent, ShakePayload } from '../core/GameEvents';

export class ScreenShake {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    EventBus.getInstance().on<ShakePayload>(GameEvent.SCREEN_SHAKE, (payload) => {
      if (payload) {
        this.scene.cameras.main.shake(payload.duration, payload.intensity / 100);
      }
    });
  }
}
