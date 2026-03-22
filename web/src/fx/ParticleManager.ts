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

  private createParticle(type: string, x: number, y: number): SimpleParticle {
    const angle = Math.random() * Math.PI * 2;
    const speed = 10 + Math.random() * 30;

    const configs: Record<string, Partial<SimpleParticle>> = {
      dust: { color: 0x8b7355, size: 1, maxLife: 500 },
      light: { color: 0xd4a853, size: 1.5, maxLife: 1000 },
      holy_light: { color: 0xffeedd, size: 2, maxLife: 1500 },
      darkness: { color: 0x220033, size: 1.5, maxLife: 800 },
      rain: { color: 0x4488aa, size: 0.5, maxLife: 600 },
      fire: { color: 0xff6600, size: 1, maxLife: 400 },
      leaf: { color: 0x55aa44, size: 1, maxLife: 1200 },
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
