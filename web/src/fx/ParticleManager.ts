interface SimpleParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: number;
  alpha: number;
}

export class ParticleManager {
  private graphics: Phaser.GameObjects.Graphics;
  private particles: SimpleParticle[] = [];
  private static readonly MAX_PARTICLES = 50;

  constructor(scene: Phaser.Scene) {
    this.graphics = scene.add.graphics().setDepth(40);
  }

  emit(type: string, x: number, y: number, count = 5): void {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= ParticleManager.MAX_PARTICLES) break;

      const p = this.createParticle(type, x, y);
      this.particles.push(p);
    }
  }

  /**
   * faithGlow: golden expanding ring that fades when player gains faith stat.
   * @param x/y - world position to center the ring
   */
  faithGlow(x: number, y: number): void {
    const scene = (this.graphics as unknown as { scene: Phaser.Scene }).scene;
    if (!scene) return;
    const ringObj = { r: 0 };
    const gfx = scene.add.graphics().setDepth(39);
    scene.tweens.add({
      targets: ringObj,
      r: 40,
      duration: 600,
      ease: 'Quad.easeOut',
      onUpdate: () => {
        gfx.clear();
        const alpha = (1 - ringObj.r / 40) * 0.5;
        gfx.lineStyle(2, 0xd4a853, alpha);
        gfx.strokeCircle(x, y, ringObj.r);
        gfx.fillStyle(0xffd080, alpha * 0.15);
        gfx.fillCircle(x, y, ringObj.r);
      },
      onComplete: () => gfx.destroy(),
    });
    // Emit some light particles too
    this.emit('holy_light', x, y, 6);
  }

  private createParticle(type: string, x: number, y: number): SimpleParticle {
    const angle = Math.random() * Math.PI * 2;
    const speed = 10 + Math.random() * 30;

    const configs: Record<string, Partial<SimpleParticle>> = {
      dust:       { color: 0x8b7355, size: 1,   maxLife: 500 },
      light:      { color: 0xd4a853, size: 1.5, maxLife: 1000 },
      holy_light: { color: 0xffeedd, size: 2,   maxLife: 1500 },
      darkness:   { color: 0x220033, size: 1.5, maxLife: 800 },
      rain:       { color: 0x4488aa, size: 0.5, maxLife: 600 },
      fire:       { color: 0xff6600, size: 1,   maxLife: 400 },
      leaf:       { color: 0x55aa44, size: 1,   maxLife: 1200 },
      ash:        { color: 0x887766, size: 1.2, maxLife: 900 },    // Ch1: ash falling
      firefly:    { color: 0xaaffaa, size: 1.5, maxLife: 2000 },   // Ch3/Ch6: fireflies
      ember:      { color: 0xff8822, size: 0.8, maxLife: 700 },    // Ch1/Ch8: embers
      mist:       { color: 0x88aabb, size: 2.5, maxLife: 1800 },   // Ch2/Ch9: mist
    };

    const cfg = configs[type] ?? configs.dust!;

    return {
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed + (type === 'rain' ? 40 : 0),
      life: cfg.maxLife ?? 500,
      maxLife: cfg.maxLife ?? 500,
      size: cfg.size ?? 1,
      color: cfg.color ?? 0xffffff,
      alpha: 1,
    };
  }

  update(delta: number): void {
    this.graphics.clear();
    const dt = delta / 1000;

    this.particles = this.particles.filter(p => {
      p.life -= delta;
      if (p.life <= 0) return false;

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 10 * dt;
      p.alpha = p.life / p.maxLife;

      this.graphics.fillStyle(p.color, p.alpha * 0.8);
      this.graphics.fillCircle(p.x, p.y, p.size);
      return true;
    });
  }

  destroy(): void {
    this.graphics.destroy();
    this.particles = [];
  }
}
