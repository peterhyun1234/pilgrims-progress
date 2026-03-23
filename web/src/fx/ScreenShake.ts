import { EventBus } from '../core/EventBus';
import { GameEvent, ShakePayload } from '../core/GameEvents';

export class ScreenShake {
  private scene: Phaser.Scene;

  private onShake = (payload: ShakePayload | undefined) => {
    if (payload && this.scene.scene.isActive()) {
      this.scene.cameras.main.shake(payload.duration, payload.intensity / 100);
    }
  };

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    EventBus.getInstance().on(GameEvent.SCREEN_SHAKE, this.onShake);
  }

  destroy(): void {
    EventBus.getInstance().off(GameEvent.SCREEN_SHAKE, this.onShake);
  }
}
