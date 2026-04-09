import { EventBus } from '../core/EventBus';
import { GameEvent, ShakePayload } from '../core/GameEvents';
import { ServiceLocator, SERVICE_KEYS } from '../core/ServiceLocator';
import { GameManager } from '../core/GameManager';

export class ScreenShake {
  private scene: Phaser.Scene;

  private onShake = (payload: ShakePayload | undefined) => {
    if (!payload || !this.scene.scene.isActive()) return;
    // Skip screen shake when reduce motion is enabled
    try {
      const gm = ServiceLocator.get<GameManager>(SERVICE_KEYS.GAME_MANAGER);
      if (gm.reduceMotion) return;
    } catch { /* ServiceLocator not ready yet — allow shake */ }
    this.scene.cameras.main.shake(payload.duration, payload.intensity / 100);
  };

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    EventBus.getInstance().on(GameEvent.SCREEN_SHAKE, this.onShake);
  }

  destroy(): void {
    EventBus.getInstance().off(GameEvent.SCREEN_SHAKE, this.onShake);
  }
}
