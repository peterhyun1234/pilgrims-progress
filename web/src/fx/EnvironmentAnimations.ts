import Phaser from 'phaser';
import { ChapterConfig, TerrainZone } from '../world/ChapterData';

/**
 * EnvironmentAnimations — Sanabi-level animated environment system.
 *
 * Improvements over v1:
 *  - 3× stronger particle alpha (0.15→0.40, max 0.65)
 *  - More particles per chapter (4→12 initial, cap 30)
 *  - Torch flicker: actual multi-layer flame with random tongue flicks
 *  - Grass sway: brighter (0.12→0.35 alpha), more blades, 3-height layers
 *  - Water: 5 ripple waves + bright specular highlights
 *  - Chapter atmospheres: much stronger visual presence
 *    Ch1: ash + ember cascade
 *    Ch2: thick rolling mist
 *    Ch5: holy light column
 *    Ch6: cross aura pulses with golden rays
 *    Ch7: blood-red wisps
 *    Ch8: lava spatter + heat shimmer
 *    Ch9: deep shadow tendrils
 *    Ch12: golden mote spiral + light beams
 *  - Fireflies for chapters 3, 6, 12 (bright, visible)
 */

export class EnvironmentAnimations {
  private scene: Phaser.Scene;
  private animLayer: Phaser.GameObjects.Graphics | null = null;
  private elapsed = 0;
  private config: ChapterConfig | null = null;

  /** Richer particle definition with horizontal drift and spin */
  private floatingParticles: Array<{
    x: number; y: number;
    vx: number; vy: number;
    alpha: number; color: number; size: number;
    phase: number; spin: number;
  }> = [];

  /** Firefly/ember pool (separate from floating particles) */
  private glowParticles: Array<{
    x: number; y: number; phase: number;
    color: number; size: number; alpha: number;
  }> = [];

  private particleTimer = 0;
  private glowTimer = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  init(config: ChapterConfig): void {
    this.config = config;
    this.elapsed = 0;
    this.particleTimer = 0;
    this.glowTimer = 0;
    this.floatingParticles = [];
    this.glowParticles = [];
    this.animLayer?.destroy();
    this.animLayer = this.scene.add.graphics().setDepth(6);
    this.spawnInitialParticles();
    this.spawnGlowParticles();
  }

  update(delta: number): void {
    if (!this.animLayer || !this.config) return;
    this.elapsed += delta;
    this.particleTimer += delta;
    this.glowTimer += delta;

    this.animLayer.clear();

    this.drawWaterRipples();
    this.drawTorchFlicker();
    this.updateFloatingParticles(delta);
    this.updateGlowParticles(delta);
    this.drawGrassSway();
    this.drawChapterAtmosphere();
  }

  // ── Water ripples ─────────────────────────────────────────────────────────

  private drawWaterRipples(): void {
    if (!this.config || !this.animLayer) return;
    const zones: TerrainZone[] = this.config.terrainZones ?? [];
    const waterZones = zones.filter(z => z.type === 'water');

    for (const zone of waterZones) {
      // 5 ripple waves per water zone (was 3)
      for (let wave = 0; wave < 5; wave++) {
        const phase = (this.elapsed * 0.0012 + wave * 0.45) % 1;
        const alpha = Math.sin(phase * Math.PI) * 0.22; // was 0.12
        const scaleX = 0.2 + phase * 0.8;
        const rippleW = zone.width * scaleX;
        const rippleX = zone.x + (zone.width - rippleW) / 2 + wave * 32;
        const rippleY = zone.y + zone.height / 2 + wave * 6;

        this.animLayer.fillStyle(0x88ccee, alpha);
        this.animLayer.fillEllipse(rippleX + rippleW / 2, rippleY, rippleW, 5);
      }

      // Bright specular highlights (sun glints on water surface)
      const shimmerT = (this.elapsed * 0.004) % 1;
      for (let s = 0; s < 8; s++) {
        const sx = zone.x + (((s * 137 + 11) & 0xff) % zone.width);
        const sy = zone.y + zone.height * 0.35 + Math.sin(shimmerT * Math.PI * 2 + s) * 4;
        const sa = 0.12 + Math.sin(shimmerT * Math.PI * 2 + s * 1.3) * 0.08; // was 0.06
        this.animLayer.fillStyle(0xffffff, Math.max(0, sa));
        this.animLayer.fillRect(sx, sy, 4, 1);
      }

      // Animated dark water base tint
      const waterT = this.elapsed * 0.0008;
      this.animLayer.fillStyle(0x1a3a55, 0.08 + Math.sin(waterT) * 0.04);
      this.animLayer.fillRect(zone.x, zone.y, zone.width, zone.height);
    }
  }

  // ── Torch flicker ─────────────────────────────────────────────────────────

  private drawTorchFlicker(): void {
    if (!this.config || !this.animLayer) return;
    const zones: TerrainZone[] = this.config.terrainZones ?? [];
    const caveZones = zones.filter(z => z.type === 'cave');

    for (const zone of caveZones) {
      const torchCount = Math.max(1, Math.floor(zone.width / 80));
      for (let torchIdx = 0; torchIdx < torchCount; torchIdx++) {
        const tx = zone.x + 30 + torchIdx * 80;
        const ty = zone.y + 20;

        // Multi-frequency flicker for natural fire look
        const f1 = Math.sin(this.elapsed * 0.009 + torchIdx * 2.1) * 0.5 + 0.5;
        const f2 = Math.sin(this.elapsed * 0.022 + torchIdx * 0.7) * 0.22;
        const f3 = Math.sin(this.elapsed * 0.047 + torchIdx * 1.4) * 0.12;
        const flicker = Math.max(0.15, f1 + f2 + f3);

        // Wide outer glow
        this.animLayer.fillStyle(0xff7700, 0.08 * flicker);
        this.animLayer.fillCircle(tx, ty, 34);
        // Mid warm ring
        this.animLayer.fillStyle(0xff9900, 0.14 * flicker);
        this.animLayer.fillCircle(tx, ty, 22);
        // Inner light
        this.animLayer.fillStyle(0xffcc44, 0.22 * flicker);
        this.animLayer.fillCircle(tx, ty, 13);
        // Flame core body (teardrop shape via 3 circles)
        this.animLayer.fillStyle(0xffee88, 0.45 * flicker);
        this.animLayer.fillCircle(tx, ty - 1, 5);
        this.animLayer.fillStyle(0xffdd66, 0.55 * flicker);
        this.animLayer.fillCircle(tx, ty - 3, 3);
        // Flame tongue (random flick)
        const tonguePhase = (this.elapsed * 0.015 + torchIdx * 0.9) % (Math.PI * 2);
        const tongueX = tx + Math.sin(tonguePhase) * 2;
        this.animLayer.fillStyle(0xffffff, 0.4 * flicker);
        this.animLayer.fillCircle(tongueX, ty - 5, 1.5);
        // Ground floor cast light
        this.animLayer.fillStyle(0xff8800, 0.06 * flicker);
        this.animLayer.fillEllipse(tx, ty + 12, 20, 5);
      }
    }
  }

  // ── Floating particles ────────────────────────────────────────────────────

  private particleConfig(): { colors: number[]; alpha: [number, number]; size: [number, number]; vy: [number, number]; count: number } {
    const ch = this.config?.chapter ?? 1;
    switch (ch) {
      case 1:  return { colors: [0x887766, 0x665544, 0xaa8866], alpha: [0.30, 0.55], size: [0.8, 1.8], vy: [0.25, 0.60], count: 16 };
      case 2:  return { colors: [0x3a5a4a, 0x4a7a5a, 0x2a4a3a], alpha: [0.25, 0.50], size: [1.5, 3.0], vy: [0.10, 0.30], count: 10 };
      case 3:  return { colors: [0x6a8a4a, 0x8a6a2a, 0xaa7733], alpha: [0.35, 0.60], size: [1.0, 2.0], vy: [0.20, 0.50], count: 14 };
      case 4:  return { colors: [0x8855aa, 0x6633aa, 0x4422aa], alpha: [0.30, 0.55], size: [1.0, 2.0], vy: [0.15, 0.40], count: 12 };
      case 5:  return { colors: [0xd4a853, 0xffd080, 0xffeebb], alpha: [0.40, 0.65], size: [0.8, 1.8], vy: [0.15, 0.45], count: 14 };
      case 6:  return { colors: [0xd4a853, 0xffeebb, 0xffffff], alpha: [0.40, 0.70], size: [0.8, 1.8], vy: [0.18, 0.42], count: 16 };
      case 7:  return { colors: [0xff6666, 0xff4444, 0xee2222], alpha: [0.25, 0.50], size: [0.8, 1.8], vy: [0.20, 0.50], count: 12 };
      case 8:  return { colors: [0xff6600, 0xff4400, 0xff8800], alpha: [0.35, 0.60], size: [0.8, 1.8], vy: [0.30, 0.70], count: 18 };
      case 9:  return { colors: [0x442255, 0x333344, 0x224433], alpha: [0.20, 0.40], size: [1.5, 3.5], vy: [0.10, 0.25], count: 8  };
      case 10: return { colors: [0x6688aa, 0x4466aa, 0x8899cc], alpha: [0.30, 0.55], size: [1.0, 2.0], vy: [0.20, 0.45], count: 12 };
      case 11: return { colors: [0x888899, 0x666677, 0x4a4a5a], alpha: [0.20, 0.45], size: [1.0, 2.5], vy: [0.15, 0.40], count: 10 };
      case 12: return { colors: [0xffd700, 0xffeeaa, 0xffffff], alpha: [0.45, 0.75], size: [0.8, 2.0], vy: [0.15, 0.40], count: 20 };
      default: return { colors: [0x6a8a4a, 0x8a6a2a], alpha: [0.30, 0.55], size: [1.0, 2.0], vy: [0.20, 0.45], count: 12 };
    }
  }

  private spawnInitialParticles(): void {
    if (!this.config) return;
    const cfg = this.particleConfig();
    for (let i = 0; i < cfg.count; i++) this.spawnParticle();
  }

  private spawnParticle(): void {
    if (!this.config) return;
    const W = this.config.mapWidth;
    const H = this.config.mapHeight;
    const cfg = this.particleConfig();
    const color = cfg.colors[Math.floor(Math.random() * cfg.colors.length)];
    const alpha = cfg.alpha[0] + Math.random() * (cfg.alpha[1] - cfg.alpha[0]);
    const size  = cfg.size[0]  + Math.random() * (cfg.size[1]  - cfg.size[0]);
    const vy    = cfg.vy[0]    + Math.random() * (cfg.vy[1]    - cfg.vy[0]);

    this.floatingParticles.push({
      x: Math.random() * W,
      y: Math.random() * H * 0.7,
      vx: (Math.random() - 0.5) * 0.25,
      vy,
      alpha,
      color,
      size,
      phase: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.04,
    });
  }

  private updateFloatingParticles(delta: number): void {
    if (!this.config || !this.animLayer) return;

    // Spawn new particles periodically
    const cfg = this.particleConfig();
    if (this.particleTimer > 600) {
      this.particleTimer = 0;
      if (this.floatingParticles.length < cfg.count * 2) this.spawnParticle();
    }

    const H = this.config.mapHeight;
    const t = this.elapsed * 0.001;

    this.floatingParticles = this.floatingParticles.filter(p => {
      p.y += p.vy * (delta / 16);
      p.x += p.vx + Math.sin(t * 0.9 + p.phase) * 0.35;
      p.phase += p.spin;
      if (p.y > H + 10) return false;

      // Fade near top and bottom
      const fadeEdge = Math.min(1, p.y / 40, (H - p.y) / 40);
      const a = p.alpha * Math.max(0.2, fadeEdge);
      this.animLayer!.fillStyle(p.color, a);
      this.animLayer!.fillCircle(p.x, p.y, p.size);
      return true;
    });
  }

  // ── Glow particles (fireflies / embers) ──────────────────────────────────

  private glowConfig(): { colors: number[]; count: number } {
    const ch = this.config?.chapter ?? 1;
    if ([3, 6, 10, 12].includes(ch)) {
      return { colors: [0xaaffaa, 0xddffcc, 0xffffff], count: 12 }; // fireflies
    }
    if ([1, 8].includes(ch)) {
      return { colors: [0xff8822, 0xff6600, 0xffaa44], count: 10 }; // embers
    }
    if ([7, 9].includes(ch)) {
      return { colors: [0xff2244, 0xcc1133, 0x880022], count: 8 }; // ominous wisps
    }
    return { colors: [], count: 0 };
  }

  private spawnGlowParticles(): void {
    if (!this.config) return;
    const cfg = this.glowConfig();
    if (cfg.count === 0) return;
    const W = this.config.mapWidth;
    const H = this.config.mapHeight;
    for (let i = 0; i < cfg.count; i++) {
      const color = cfg.colors[Math.floor(Math.random() * cfg.colors.length)];
      this.glowParticles.push({
        x: Math.random() * W,
        y: H * 0.2 + Math.random() * H * 0.6,
        phase: Math.random() * Math.PI * 2,
        color,
        size: 1.5 + Math.random() * 1.5,
        alpha: 0.35 + Math.random() * 0.35,
      });
    }
  }

  private updateGlowParticles(_delta: number): void {
    if (!this.config || !this.animLayer) return;
    const cfg = this.glowConfig();
    if (cfg.count === 0) return;
    const t = this.elapsed * 0.001;

    // Spawn occasionally
    if (this.glowTimer > 1200) {
      this.glowTimer = 0;
      if (this.glowParticles.length < cfg.count * 1.5) {
        const color = cfg.colors[Math.floor(Math.random() * cfg.colors.length)];
        const W = this.config.mapWidth;
        const H = this.config.mapHeight;
        this.glowParticles.push({
          x: Math.random() * W,
          y: H * 0.3 + Math.random() * H * 0.5,
          phase: Math.random() * Math.PI * 2,
          color,
          size: 1.5 + Math.random() * 1.5,
          alpha: 0.35 + Math.random() * 0.35,
        });
      }
    }

    this.glowParticles.forEach(p => {
      // Gentle float + pulse
      const gx = p.x + Math.sin(t * 0.6 + p.phase) * 8;
      const gy = p.y + Math.cos(t * 0.4 + p.phase * 0.7) * 5;
      const pulseA = p.alpha * (0.5 + Math.sin(t * 2.5 + p.phase) * 0.5);

      // Outer soft glow
      this.animLayer!.fillStyle(p.color, pulseA * 0.35);
      this.animLayer!.fillCircle(gx, gy, p.size * 2.8);
      // Inner bright core
      this.animLayer!.fillStyle(p.color, Math.min(0.9, pulseA * 1.4));
      this.animLayer!.fillCircle(gx, gy, p.size);
      // Bright center dot
      this.animLayer!.fillStyle(0xffffff, pulseA * 0.6);
      this.animLayer!.fillCircle(gx, gy, p.size * 0.4);
    });
  }

  // ── Grass sway ───────────────────────────────────────────────────────────

  private drawGrassSway(): void {
    if (!this.config || !this.animLayer) return;
    const ch = this.config.chapter;
    // Natural + semi-natural chapters
    if (![1, 2, 3, 5, 6, 7, 10, 12].includes(ch)) return;

    const H = this.config.mapHeight;
    const W = this.config.mapWidth;
    const t = this.elapsed * 0.002;

    // Base grass color per chapter
    const grassColors: Record<number, { base: number; tip: number; alpha: number }> = {
      1:  { base: 0x4a5a2a, tip: 0x6a8a3a, alpha: 0.40 },
      2:  { base: 0x2a5a3a, tip: 0x3a8a4a, alpha: 0.35 },
      3:  { base: 0x5a8a3a, tip: 0x8aaa5a, alpha: 0.45 },
      5:  { base: 0x8a7a3a, tip: 0xaaa05a, alpha: 0.42 },
      6:  { base: 0x4a7a3a, tip: 0x6aaa4a, alpha: 0.40 },
      7:  { base: 0x5a3a3a, tip: 0x8a5a4a, alpha: 0.35 },
      10: { base: 0x5a7a9a, tip: 0x7a9aaa, alpha: 0.38 },
      12: { base: 0x8a8a3a, tip: 0xaaaa5a, alpha: 0.50 },
    };
    const gc = grassColors[ch] ?? { base: 0x5a8a3a, tip: 0x8aaa5a, alpha: 0.40 };

    // More grass blades (was 20, now 36), 3 height layers
    for (let b = 0; b < 36; b++) {
      const hash = ((b * 137 + ch * 31) * 17) & 0xffff;
      const gx = (hash % (W - 40)) + 20;
      const gy = H / 2 + ((hash * 3) % (H / 2 - 50)) - H / 4 + 25;
      const sway = Math.sin(t + b * 0.85) * 2.0; // was 1.5
      const height = 4 + (hash & 3) * 2; // 4-10px blades (was fixed 5)

      // Blade stem
      this.animLayer.fillStyle(gc.base, gc.alpha);
      this.animLayer.fillRect(gx + sway, gy - height, 1, height);
      // Second blade (offset)
      this.animLayer.fillStyle(gc.base, gc.alpha * 0.7);
      this.animLayer.fillRect(gx + 3 + sway * 0.65, gy - (height - 1), 1, height - 1);
      // Blade tip (brighter)
      this.animLayer.fillStyle(gc.tip, gc.alpha * 0.8);
      this.animLayer.fillRect(gx + sway, gy - height, 1, 2);
    }
  }

  // ── Chapter atmosphere ────────────────────────────────────────────────────

  private drawChapterAtmosphere(): void {
    if (!this.config || !this.animLayer) return;
    const ch = this.config.chapter;
    const t = this.elapsed * 0.001;
    const W = this.config.mapWidth;
    const H = this.config.mapHeight;
    const cx = W / 2;

    switch (ch) {
      case 1: {
        // City of Destruction: thick ash fall + occasional ember burst
        const ashAmt = 6;
        for (let a = 0; a < ashAmt; a++) {
          const seed = (a * 97 + Math.floor(this.elapsed / 400) * 7) & 0xffff;
          const ax = seed % W;
          const ay = ((seed * 3 + this.elapsed * 0.04) % H);
          this.animLayer.fillStyle(0x887766, 0.22 + (seed & 7) * 0.03);
          this.animLayer.fillRect(ax, ay, 2, 1);
        }
        // Smoke wisps at top
        for (let s = 0; s < 3; s++) {
          const sx = W * 0.25 + s * W * 0.25 + Math.sin(t * 0.3 + s) * 20;
          const sy = H * 0.1 + Math.cos(t * 0.2 + s * 1.3) * 10;
          this.animLayer.fillStyle(0x665544, 0.06 + Math.sin(t + s) * 0.03);
          this.animLayer.fillEllipse(sx, sy, 55, 18);
        }
        break;
      }

      case 2: {
        // Slough of Despond: 6 thick rolling mist banks
        for (let m = 0; m < 6; m++) {
          const mx = ((m * 220 + Math.sin(t * 0.4 + m) * 40) % (W + 100)) - 50;
          const my = H * 0.55 + Math.cos(t * 0.3 + m) * 18;
          const malpha = 0.10 + Math.sin(t * 0.6 + m) * 0.04; // was 0.05
          this.animLayer.fillStyle(0x3a5a4a, malpha);
          this.animLayer.fillEllipse(mx, my, 110, 28);
          // Inner denser core
          this.animLayer.fillStyle(0x2a4a3a, malpha * 0.6);
          this.animLayer.fillEllipse(mx, my, 60, 15);
        }
        // Bog bubbles
        const bubbleT = (this.elapsed * 0.002) % 1;
        for (let b = 0; b < 3; b++) {
          const bx = W * 0.2 + b * W * 0.3 + Math.sin(t + b * 2.1) * 15;
          const by = H * 0.72;
          const ba = Math.sin(bubbleT * Math.PI + b * 2) * 0.12;
          if (ba > 0) {
            this.animLayer.fillStyle(0x4a6a5a, ba);
            this.animLayer.fillCircle(bx, by, 4 + ba * 20);
          }
        }
        break;
      }

      case 5: {
        // Hill of Difficulty: holy light column from summit
        const pulse = Math.sin(t * 1.2) * 0.5 + 0.5;
        // Light column
        this.animLayer.fillStyle(0xffeedd, 0.06 + pulse * 0.04);
        this.animLayer.fillRect(cx - 20, 0, 40, H * 0.6);
        this.animLayer.fillStyle(0xffd080, 0.04 + pulse * 0.03);
        this.animLayer.fillRect(cx - 8, 0, 16, H * 0.4);
        // Golden dust motes along column
        for (let d = 0; d < 5; d++) {
          const dy = (this.elapsed * 0.03 + d * 50) % (H * 0.5);
          const dx = cx + Math.sin(t * 0.7 + d * 1.3) * 12;
          this.animLayer.fillStyle(0xffd700, 0.35 + pulse * 0.2);
          this.animLayer.fillCircle(dx, H * 0.15 + dy, 1.5);
        }
        break;
      }

      case 6: {
        // Cross/Palace Beautiful: holy aura + radiant rays
        const pulse6 = Math.sin(t * 1.5) * 0.5 + 0.5;
        const cy6 = H / 2 - 20;
        // Outer halo
        this.animLayer.fillStyle(0xffd700, 0.05 + pulse6 * 0.04);
        this.animLayer.fillCircle(cx, cy6, 65 + pulse6 * 10);
        // Mid ring
        this.animLayer.fillStyle(0xffeeaa, 0.10 + pulse6 * 0.06);
        this.animLayer.fillCircle(cx, cy6, 38 + pulse6 * 6);
        // Core glow
        this.animLayer.fillStyle(0xffffff, 0.08 + pulse6 * 0.05);
        this.animLayer.fillCircle(cx, cy6, 18 + pulse6 * 4);
        // 8 radiant rays
        for (let r = 0; r < 8; r++) {
          const angle = (r / 8) * Math.PI * 2 + t * 0.08;
          const rLen = 30 + pulse6 * 15;
          const rx = cx + Math.cos(angle) * rLen;
          const ry = cy6 + Math.sin(angle) * rLen;
          this.animLayer.lineStyle(1, 0xffd700, 0.12 * pulse6);
          this.animLayer.lineBetween(cx, cy6, rx, ry);
        }
        break;
      }

      case 7: {
        // Valley of Humiliation: blood-red wisps + low-lying fog
        for (let w = 0; w < 5; w++) {
          const wx = cx + Math.sin(t * 0.5 + w * 1.3) * (W * 0.3);
          const wy = H * 0.6 + Math.cos(t * 0.4 + w * 0.9) * 25;
          const wa = 0.08 + Math.sin(t * 0.8 + w) * 0.04;
          this.animLayer.fillStyle(0xcc1133, Math.max(0, wa));
          this.animLayer.fillEllipse(wx, wy, 55, 22);
        }
        // Dark ground mist
        for (let m = 0; m < 4; m++) {
          const mx2 = ((m * 300 + Math.sin(t * 0.3 + m) * 30) % (W + 60)) - 30;
          this.animLayer.fillStyle(0x220011, 0.07 + Math.sin(t * 0.5 + m) * 0.03);
          this.animLayer.fillEllipse(mx2, H * 0.82, 140, 24);
        }
        break;
      }

      case 8: {
        // Apollyon valley: lava spatter + heat shimmer
        const lavaT = Math.sin(t * 2.5) * 0.5 + 0.5;
        for (const lx of [W * 0.18, W * 0.45, W * 0.72, W * 0.9]) {
          this.animLayer.fillStyle(0xff4400, 0.08 + lavaT * 0.06);
          this.animLayer.fillEllipse(lx, H - 22, 65, 20);
          this.animLayer.fillStyle(0xff8800, 0.12 + lavaT * 0.08);
          this.animLayer.fillEllipse(lx, H - 18, 35, 10);
          // Lava spatter particles
          if (Math.random() < 0.15) {
            const spx = lx + (Math.random() - 0.5) * 20;
            const spy = H - 10 - Math.random() * 30;
            this.animLayer.fillStyle(0xff6600, 0.55 + Math.random() * 0.3);
            this.animLayer.fillCircle(spx, spy, 1.5 + Math.random());
          }
        }
        // Heat shimmer lines
        for (let hs = 0; hs < 4; hs++) {
          const hsx = W * 0.1 + hs * W * 0.22;
          const shimmerA = 0.04 + Math.sin(t * 4 + hs * 0.8) * 0.025;
          this.animLayer.fillStyle(0xffa055, Math.max(0, shimmerA));
          this.animLayer.fillRect(hsx, H * 0.5, 3, H * 0.4);
        }
        break;
      }

      case 9: {
        // Valley of the Shadow of Death: deep shadow tendrils
        for (let t9 = 0; t9 < 4; t9++) {
          const tx9 = cx + Math.sin(t * 0.4 + t9 * 1.6) * (W * 0.35);
          const ty9 = H * 0.5 + Math.cos(t * 0.3 + t9 * 1.1) * 35;
          this.animLayer.fillStyle(0x220033, 0.06 + Math.sin(t * 0.7 + t9) * 0.03);
          this.animLayer.fillEllipse(tx9, ty9, 55, 30);
        }
        // Creeping darkness from edges
        const edgeA = 0.07 + Math.sin(t * 0.5) * 0.03;
        this.animLayer.fillStyle(0x110022, edgeA);
        this.animLayer.fillRect(0, 0, W * 0.12, H);
        this.animLayer.fillRect(W * 0.88, 0, W * 0.12, H);
        break;
      }

      case 12: {
        // Celestial City: golden mote spiral + radiant beams
        const cityX = W - 200;
        const cityY = H * 0.3;
        const pulse12 = Math.sin(t * 1.0) * 0.5 + 0.5;

        // Rotating mote spiral
        for (let m = 0; m < 12; m++) {
          const angle = t * 0.4 + (m / 12) * Math.PI * 2;
          const radius = 20 + m * 10;
          const mx = cityX + Math.cos(angle) * radius;
          const my = cityY + Math.sin(angle) * radius * 0.5;
          const ma = 0.25 + Math.sin(t * 2 + m) * 0.12;
          this.animLayer.fillStyle(0xffd700, Math.max(0, ma));
          this.animLayer.fillCircle(mx, my, 1.5 + (m % 3) * 0.5);
        }

        // Upward light beams from city base
        for (let b = 0; b < 5; b++) {
          const bx = cityX - 30 + b * 16;
          const bLen = 30 + b * 12;
          this.animLayer.fillStyle(0xffd700, (0.08 + pulse12 * 0.05) * (1 - b * 0.15));
          this.animLayer.fillRect(bx, cityY - bLen, 2, bLen);
        }

        // Heaven glow
        this.animLayer.fillStyle(0xffd700, 0.04 + pulse12 * 0.03);
        this.animLayer.fillCircle(cityX, cityY, 100 + pulse12 * 20);
        break;
      }
    }
  }

  destroy(): void {
    this.animLayer?.destroy();
    this.animLayer = null;
    this.floatingParticles = [];
    this.glowParticles = [];
  }
}
