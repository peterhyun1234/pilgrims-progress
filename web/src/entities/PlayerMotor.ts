export class PlayerMotor {
  private vx = 0;
  private vy = 0;

  calculate(
    inputX: number,
    inputY: number,
    _delta: number,
    speedMultiplier: number,
  ): { x: number; y: number } {
    this.vx = inputX * speedMultiplier;
    this.vy = inputY * speedMultiplier;

    return { x: this.vx, y: this.vy };
  }
}
