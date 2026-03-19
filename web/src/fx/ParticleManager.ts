import Phaser from 'phaser';

export class ParticleManager {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  createDust(x: number, y: number): void {
    for (let i = 0; i < 5; i++) {
      const particle = this.scene.add.circle(
        x + Phaser.Math.Between(-8, 8),
        y + Phaser.Math.Between(-4, 4),
        1,
        0x8c8070,
        0.5,
      );
      particle.setDepth(50);

      this.scene.tweens.add({
        targets: particle,
        y: particle.y - Phaser.Math.Between(4, 12),
        alpha: 0,
        duration: Phaser.Math.Between(400, 800),
        ease: 'Power2',
        onComplete: () => particle.destroy(),
      });
    }
  }

  createLightParticles(x: number, y: number, count = 10): void {
    for (let i = 0; i < count; i++) {
      const particle = this.scene.add.circle(
        x + Phaser.Math.Between(-16, 16),
        y + Phaser.Math.Between(-16, 16),
        Phaser.Math.Between(1, 2),
        0xe6c86e,
        0.7,
      );
      particle.setDepth(50);

      this.scene.tweens.add({
        targets: particle,
        y: particle.y - Phaser.Math.Between(8, 24),
        alpha: 0,
        scale: 0,
        duration: Phaser.Math.Between(800, 1500),
        ease: 'Power2',
        onComplete: () => particle.destroy(),
      });
    }
  }
}
