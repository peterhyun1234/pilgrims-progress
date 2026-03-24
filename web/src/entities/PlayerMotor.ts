import { PLAYER } from '../config';
import { ServiceLocator, SERVICE_KEYS } from '../core/ServiceLocator';
import { StatsManager } from '../core/StatsManager';

export class PlayerMotor {
  private velX = 0;
  private velY = 0;

  update(
    sprite: Phaser.Physics.Arcade.Sprite,
    inputX: number,
    inputY: number,
    delta: number,
  ): void {
    const dt = delta / 1000;
    const sm = ServiceLocator.get<StatsManager>(SERVICE_KEYS.STATS_MANAGER);
    const speedMult = sm.getSpeedMultiplier();
    const speed = PLAYER.BASE_SPEED * speedMult;

    let targetX = 0;
    let targetY = 0;
    if (inputX !== 0 || inputY !== 0) {
      const mag = Math.sqrt(inputX * inputX + inputY * inputY);
      targetX = (inputX / mag) * speed;
      targetY = (inputY / mag) * speed;
    }

    const isMoving = targetX !== 0 || targetY !== 0;
    const accel = isMoving ? PLAYER.ACCELERATION : PLAYER.DECELERATION;

    const dvx = targetX - this.velX;
    const dvy = targetY - this.velY;
    const dist = Math.sqrt(dvx * dvx + dvy * dvy);
    const maxStep = accel * dt;

    if (dist <= maxStep) {
      this.velX = targetX;
      this.velY = targetY;
    } else {
      this.velX += (dvx / dist) * maxStep;
      this.velY += (dvy / dist) * maxStep;
    }

    sprite.setVelocity(this.velX, this.velY);
  }

  reset(): void {
    this.velX = 0;
    this.velY = 0;
  }
}
