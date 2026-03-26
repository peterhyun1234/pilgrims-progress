import Phaser from 'phaser';
import { ChapterConfig, TerrainZone } from '../world/ChapterData';

/**
 * Animates environmental elements: water ripples, torch flicker, leaf fall,
 * grass sway, and chapter-specific atmospheric effects.
 * Called from GameScene.update() each frame.
 */
export class EnvironmentAnimations {
  private scene: Phaser.Scene;
  private animLayer: Phaser.GameObjects.Graphics | null = null;
  private elapsed = 0;
  private config: ChapterConfig | null = null;

  // Particle pools for floating effects
  private floatingParticles: Array<{ x: number; y: number; vy: number; alpha: number; color: number; size: number }> = [];
  private particleTimer = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  init(config: ChapterConfig): void {
    this.config = config;
    this.elapsed = 0;
    this.floatingParticles = [];
    this.animLayer?.destroy();
    this.animLayer = this.scene.add.graphics().setDepth(6);
    this.spawnInitialParticles();
  }

  update(delta: number): void {
    if (!this.animLayer || !this.config) return;
    this.elapsed += delta;
    this.particleTimer += delta;

    this.animLayer.clear();

    this.drawWaterRipples();
    this.drawTorchFlicker();
    this.updateFloatingParticles(delta);
    this.drawGrassSway();
    this.drawChapterAtmosphere();
  }

  // ── Water ripples ─────────────────────────────────────────────────────────

  private drawWaterRipples(): void {
    if (!this.config || !this.animLayer) return;
    const zones: TerrainZone[] = this.config.terrainZones ?? [];
    const waterZones = zones.filter(z => z.type === 'water');

    for (const zone of waterZones) {
      // 3 ripple waves per water zone, offset by phase
      for (let wave = 0; wave < 3; wave++) {
        const phase = (this.elapsed * 0.001 + wave * 0.6) % 1;
        const alpha = Math.sin(phase * Math.PI) * 0.12;
        const scaleX = 0.3 + phase * 0.7;
        const rippleW = zone.width * scaleX;
        const rippleX = zone.x + (zone.width - rippleW) / 2 + wave * 40;
        const rippleY = zone.y + zone.height / 2 + wave * 8;

        this.animLayer.fillStyle(0x88bbdd, alpha);
        this.animLayer.fillEllipse(rippleX + rippleW / 2, rippleY, rippleW, 6);
      }

      // Surface shimmer (fast)
      const shimmerT = (this.elapsed * 0.003) % 1;
      for (let s = 0; s < 5; s++) {
        const sx = zone.x + (((s * 137 + 11) & 0xff) % zone.width);
        const sy = zone.y + zone.height * 0.4 + Math.sin(shimmerT * Math.PI * 2 + s) * 3;
        const sa = 0.06 + Math.sin(shimmerT * Math.PI * 2 + s * 1.3) * 0.04;
        this.animLayer.fillStyle(0xffffff, Math.max(0, sa));
        this.animLayer.fillRect(sx, sy, 3, 1);
      }
    }
  }

  // ── Torch flicker ─────────────────────────────────────────────────────────

  private drawTorchFlicker(): void {
    if (!this.config || !this.animLayer) return;
    const zones: TerrainZone[] = this.config.terrainZones ?? [];
    const caveZones = zones.filter(z => z.type === 'cave');

    for (const zone of caveZones) {
      const torchCount = Math.max(1, Math.floor(zone.width / 80));
      for (let t = 0; t < torchCount; t++) {
        const tx = zone.x + 30 + t * 80;
        const ty = zone.y + 20;

        // Flicker: high-freq sine + random offset
        const flickerBase = Math.sin(this.elapsed * 0.008 + t * 2.1) * 0.5 + 0.5;
        const flickerFast = Math.sin(this.elapsed * 0.02 + t * 0.7) * 0.2;
        const flicker = Math.max(0.1, flickerBase + flickerFast);

        // Outer glow
        this.animLayer.fillStyle(0xff8800, 0.04 * flicker);
        this.animLayer.fillCircle(tx, ty, 22);
        // Inner warm light
        this.animLayer.fillStyle(0xffcc44, 0.08 * flicker);
        this.animLayer.fillCircle(tx, ty, 14);
        // Flame core
        this.animLayer.fillStyle(0xffee88, 0.15 * flicker);
        this.animLayer.fillCircle(tx, ty - 2, 5);
        this.animLayer.fillStyle(0xffffff, 0.08 * flicker);
        this.animLayer.fillCircle(tx, ty - 3, 2);
      }
    }
  }

  // ── Floating particles (leaves, petals, holy dust) ───────────────────────

  private spawnInitialParticles(): void {
    if (!this.config) return;
    const ch = this.config.chapter;
    const count = [1, 3, 7, 12].includes(ch) ? 8 : 4;
    for (let i = 0; i < count; i++) {
      this.spawnParticle();
    }
  }

  private spawnParticle(): void {
    if (!this.config) return;
    const ch = this.config.chapter;
    const W = this.config.mapWidth;
    const H = this.config.mapHeight;

    const leafColors = [0x6a8a4a, 0x8a6a2a, 0xaa5533, 0xcc8833];
    const petalColors = [0xffaacc, 0xffccaa, 0xffffff, 0xffeecc];
    const holyColors = [0xffd700, 0xffeeaa, 0xffffff];
    const gloomColors = [0x334455, 0x224433, 0x332244];

    let color: number;
    if (ch === 6 || ch === 12) {
      color = holyColors[Math.floor(Math.random() * holyColors.length)];
    } else if (ch === 7) {
      color = petalColors[Math.floor(Math.random() * petalColors.length)];
    } else if (ch === 9 || ch === 11) {
      color = gloomColors[Math.floor(Math.random() * gloomColors.length)];
    } else {
      color = leafColors[Math.floor(Math.random() * leafColors.length)];
    }

    this.floatingParticles.push({
      x: Math.random() * W,
      y: Math.random() * H * 0.6,
      vy: 0.2 + Math.random() * 0.4,
      alpha: 0.15 + Math.random() * 0.2,
      color,
      size: 1 + Math.random() * 1.5,
    });
  }

  private updateFloatingParticles(delta: number): void {
    if (!this.config || !this.animLayer) return;

    // Spawn new particles periodically
    if (this.particleTimer > 800) {
      this.particleTimer = 0;
      if (this.floatingParticles.length < 16) this.spawnParticle();
    }

    const H = this.config.mapHeight;
    this.floatingParticles = this.floatingParticles.filter(p => {
      p.y += p.vy * (delta / 16);
      // Gentle horizontal drift
      p.x += Math.sin(this.elapsed * 0.001 + p.y * 0.01) * 0.3;

      if (p.y > H) return false;

      this.animLayer!.fillStyle(p.color, p.alpha);
      this.animLayer!.fillCircle(p.x, p.y, p.size);
      return true;
    });
  }

  // ── Grass sway ───────────────────────────────────────────────────────────

  private drawGrassSway(): void {
    if (!this.config || !this.animLayer) return;
    const ch = this.config.chapter;
    // Only for natural chapters
    if (![1, 3, 5, 7, 12].includes(ch)) return;

    const H = this.config.mapHeight;
    const swayAmp = 1.5;
    const t = this.elapsed * 0.002;

    for (let g = 0; g < 20; g++) {
      const hash = ((g * 137 + ch * 31) * 17) & 0xffff;
      const gx = (hash % (this.config.mapWidth - 40)) + 20;
      const gy = H / 2 + ((hash * 3) % (H / 2 - 40)) - H / 4 + 20;
      const sway = Math.sin(t + g * 0.8) * swayAmp;

      this.animLayer.fillStyle(0x5a8a3a, 0.12);
      this.animLayer.fillRect(gx + sway, gy - 5, 1, 5);
      this.animLayer.fillRect(gx + 3 + sway * 0.7, gy - 4, 1, 4);
    }
  }

  // ── Chapter-specific atmosphere ──────────────────────────────────────────

  private drawChapterAtmosphere(): void {
    if (!this.config || !this.animLayer) return;
    const ch = this.config.chapter;
    const t = this.elapsed * 0.001;

    switch (ch) {
      case 2: {
        // Swamp: drifting mist blobs
        for (let m = 0; m < 4; m++) {
          const mx = (m * 180 + Math.sin(t + m) * 30) % this.config.mapWidth;
          const my = this.config.mapHeight * 0.6 + Math.cos(t * 0.5 + m) * 15;
          this.animLayer.fillStyle(0x3a5a4a, 0.05 + Math.sin(t + m) * 0.02);
          this.animLayer.fillEllipse(mx, my, 80, 18);
        }
        break;
      }
      case 6: {
        // Cross: holy aura pulse
        const pulse = (Math.sin(t * 1.5) * 0.5 + 0.5) * 0.06;
        const cx = this.config.mapWidth / 2;
        const cy = this.config.mapHeight / 2 - 20;
        this.animLayer.fillStyle(0xffd700, pulse);
        this.animLayer.fillCircle(cx, cy, 50 + Math.sin(t * 0.8) * 8);
        break;
      }
      case 8: {
        // Apollyon valley: lava glow pulse
        const lavaGlow = (Math.sin(t * 2) * 0.5 + 0.5) * 0.05;
        for (const lx of [200, 500, 800]) {
          this.animLayer.fillStyle(0xff4400, lavaGlow);
          this.animLayer.fillEllipse(lx, this.config.mapHeight - 20, 50, 15);
        }
        break;
      }
      case 9: {
        // Shadow valley: pulsing darkness wisps
        for (let w = 0; w < 3; w++) {
          const wx = 400 + w * 600 + Math.sin(t * 0.7 + w) * 20;
          const wy = this.config.mapHeight / 2 + Math.cos(t * 0.5 + w * 1.3) * 20;
          const wa = 0.04 + Math.sin(t + w) * 0.02;
          this.animLayer.fillStyle(0x220033, Math.max(0, wa));
          this.animLayer.fillEllipse(wx, wy, 40, 20);
        }
        break;
      }
      case 12: {
        // Celestial city: rotating golden motes
        for (let m = 0; m < 6; m++) {
          const angle = t * 0.3 + (m / 6) * Math.PI * 2;
          const radius = 30 + m * 15;
          const mx = 2200 + Math.cos(angle) * radius;
          const my = 80 + Math.sin(angle) * radius * 0.5;
          const ma = 0.15 + Math.sin(t * 2 + m) * 0.08;
          this.animLayer.fillStyle(0xffd700, Math.max(0, ma));
          this.animLayer.fillCircle(mx, my, 2);
        }
        break;
      }
    }
  }

  destroy(): void {
    this.animLayer?.destroy();
    this.animLayer = null;
    this.floatingParticles = [];
  }
}
