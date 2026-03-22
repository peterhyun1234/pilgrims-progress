import { PLAYER } from '../config';
import { ServiceLocator, SERVICE_KEYS } from '../core/ServiceLocator';
import { StatsManager } from '../core/StatsManager';

export class PlayerMotor {
  update(
    sprite: Phaser.Physics.Arcade.Sprite,
    inputX: number,
    inputY: number,
  ): void {
    const sm = ServiceLocator.get<StatsManager>(SERVICE_KEYS.STATS_MANAGER);
    const speedMult = sm.getSpeedMultiplier();
    const speed = PLAYER.BASE_SPEED * speedMult;

    const vx = inputX * speed;
    const vy = inputY * speed;

    sprite.setVelocity(vx, vy);

    if (vx !== 0 || vy !== 0) {
      const mag = Math.sqrt(vx * vx + vy * vy);
      sprite.setVelocity((vx / mag) * speed, (vy / mag) * speed);
    }
  }
}
