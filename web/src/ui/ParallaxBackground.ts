import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

/**
 * ParallaxBackground — Sanabi-quality cinematic multi-layer background system.
 *
 * Each chapter gets a distinct visual palette with:
 *   - Deep sky gradient (24-strip banding for smooth gradient look)
 *   - Stars / atmospheric specks
 *   - Distant mountain silhouettes (2 depth layers)
 *   - Horizon glow (chapter-specific color)
 *   - Ground gradient
 *   - Parallax scrolling (slower layers for depth)
 *
 * Usage (in TileMapManager or GameScene):
 *   this.parallaxBg = new ParallaxBackground(scene);
 *   this.parallaxBg.init(chapter, mapWidth);
 *   // In update():
 *   this.parallaxBg.update(camera.scrollX);
 */

interface ChapterPalette {
  skyTop: number;
  skyMid: number;
  skyBot: number;
  horizonGlow: number;
  horizonGlowAlpha: number;
  mtFar: number;
  mtNear: number;
  ground: number;
  groundBot: number;
  starBrightness: number;
  starCount: number;
  fogColor: number;
  fogAlpha: number;
}

const CHAPTER_PALETTES: Record<number, ChapterPalette> = {
  1:  { skyTop: 0x0d0510, skyMid: 0x150a18, skyBot: 0x200e1a, horizonGlow: 0x882200, horizonGlowAlpha: 0.22, mtFar: 0x0d0520, mtNear: 0x08031a, ground: 0x12082a, groundBot: 0x08041a, starBrightness: 0.25, starCount: 60, fogColor: 0x1a0a10, fogAlpha: 0.10 },
  2:  { skyTop: 0x060e0a, skyMid: 0x0a1510, skyBot: 0x101c14, horizonGlow: 0x224422, horizonGlowAlpha: 0.14, mtFar: 0x081010, mtNear: 0x060c08, ground: 0x0e1810, groundBot: 0x060c08, starBrightness: 0.12, starCount: 30, fogColor: 0x1a4a2a, fogAlpha: 0.18 },
  3:  { skyTop: 0x080e18, skyMid: 0x0e1828, skyBot: 0x182a38, horizonGlow: 0x4488aa, horizonGlowAlpha: 0.18, mtFar: 0x08101a, mtNear: 0x060c12, ground: 0x101e28, groundBot: 0x080e18, starBrightness: 0.30, starCount: 80, fogColor: 0x88bbdd, fogAlpha: 0.06 },
  4:  { skyTop: 0x0c0818, skyMid: 0x14102a, skyBot: 0x1c1a38, horizonGlow: 0x8866cc, horizonGlowAlpha: 0.20, mtFar: 0x100818, mtNear: 0x08040e, ground: 0x12101e, groundBot: 0x08060e, starBrightness: 0.28, starCount: 70, fogColor: 0x442266, fogAlpha: 0.08 },
  5:  { skyTop: 0x100808, skyMid: 0x1a1008, skyBot: 0x281810, horizonGlow: 0xd4a853, horizonGlowAlpha: 0.30, mtFar: 0x0e0808, mtNear: 0x080408, ground: 0x1a1008, groundBot: 0x0e0804, starBrightness: 0.18, starCount: 45, fogColor: 0xd4a853, fogAlpha: 0.04 },
  6:  { skyTop: 0x06080a, skyMid: 0x0a100c, skyBot: 0x101808, horizonGlow: 0x4a8a44, horizonGlowAlpha: 0.16, mtFar: 0x080a08, mtNear: 0x060808, ground: 0x0c1008, groundBot: 0x060804, starBrightness: 0.15, starCount: 40, fogColor: 0x224422, fogAlpha: 0.07 },
  7:  { skyTop: 0x080408, skyMid: 0x0c060a, skyBot: 0x10080e, horizonGlow: 0xcc2255, horizonGlowAlpha: 0.28, mtFar: 0x080408, mtNear: 0x040204, ground: 0x0a0608, groundBot: 0x060404, starBrightness: 0.10, starCount: 25, fogColor: 0x440022, fogAlpha: 0.12 },
  8:  { skyTop: 0x120404, skyMid: 0x1a0804, skyBot: 0x220a04, horizonGlow: 0xff4400, horizonGlowAlpha: 0.35, mtFar: 0x100404, mtNear: 0x080202, ground: 0x140804, groundBot: 0x080402, starBrightness: 0.08, starCount: 20, fogColor: 0xff2200, fogAlpha: 0.08 },
  9:  { skyTop: 0x040204, skyMid: 0x060406, skyBot: 0x080408, horizonGlow: 0x660033, horizonGlowAlpha: 0.20, mtFar: 0x040204, mtNear: 0x020102, ground: 0x060404, groundBot: 0x040204, starBrightness: 0.08, starCount: 15, fogColor: 0x220011, fogAlpha: 0.15 },
  10: { skyTop: 0x0a0e18, skyMid: 0x101828, skyBot: 0x182040, horizonGlow: 0x4466aa, horizonGlowAlpha: 0.20, mtFar: 0x0a0e18, mtNear: 0x080c14, ground: 0x101828, groundBot: 0x080e14, starBrightness: 0.25, starCount: 65, fogColor: 0x2244aa, fogAlpha: 0.06 },
  11: { skyTop: 0x0a0a12, skyMid: 0x101018, skyBot: 0x181820, horizonGlow: 0x444488, horizonGlowAlpha: 0.16, mtFar: 0x0a0a12, mtNear: 0x080810, ground: 0x0e0e18, groundBot: 0x080810, starBrightness: 0.14, starCount: 35, fogColor: 0x333355, fogAlpha: 0.10 },
  12: { skyTop: 0x180e28, skyMid: 0x241840, skyBot: 0x342060, horizonGlow: 0xffd700, horizonGlowAlpha: 0.45, mtFar: 0x14102a, mtNear: 0x100c1e, ground: 0x1c1430, groundBot: 0x100c1e, starBrightness: 0.40, starCount: 100, fogColor: 0xffd700, fogAlpha: 0.04 },
};

const DEFAULT_PALETTE: ChapterPalette = {
  skyTop: 0x080410, skyMid: 0x100818, skyBot: 0x181228,
  horizonGlow: 0xd4a853, horizonGlowAlpha: 0.18,
  mtFar: 0x0a0318, mtNear: 0x060210,
  ground: 0x100818, groundBot: 0x080410,
  starBrightness: 0.20, starCount: 50,
  fogColor: 0x000000, fogAlpha: 0,
};

interface ParallaxLayer {
  gfx: Phaser.GameObjects.Graphics;
  speed: number; // 0=fixed, 0.1=slow parallax, 1.0=camera-matched
  depth: number;
}

export class ParallaxBackground {
  private scene: Phaser.Scene;
  private layers: ParallaxLayer[] = [];
  private mapWidth = GAME_WIDTH;
  private horizonY: number;
  private animGfx: Phaser.GameObjects.Graphics | null = null;
  private elapsed = 0;

  // Static star data (computed once on init)
  private stars: Array<{ x: number; y: number; size: number; brightness: number }> = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.horizonY = GAME_HEIGHT * 0.42;
  }

  init(chapter: number, mapWidth: number): void {
    this.destroy();
    this.mapWidth = mapWidth;
    this.horizonY = GAME_HEIGHT * 0.42;
    this.elapsed = 0;

    const pal = CHAPTER_PALETTES[chapter] ?? DEFAULT_PALETTE;

    // Layer order (back → front): sky, stars, mtFar, horizonGlow, mtNear, ground, fog, anim
    this.buildSky(pal);
    this.buildStars(pal);
    this.buildMountainsFar(pal);
    this.buildHorizonGlow(pal, chapter);
    this.buildMountainsNear(pal);
    this.buildGround(pal);
    if (pal.fogAlpha > 0.01) this.buildFog(pal);
    this.buildVignette();

    // Animated layer (star twinkle, horizon pulse) — above sky layers
    this.animGfx = this.scene.add.graphics().setDepth(0.65).setScrollFactor(0);
  }

  private addLayer(gfx: Phaser.GameObjects.Graphics, speed: number, depth: number): void {
    this.layers.push({ gfx, speed, depth });
  }

  // ── Sky gradient (multi-strip for smooth look) ────────────────────────────

  private buildSky(pal: ChapterPalette): void {
    const W = this.mapWidth;
    const HOR = this.horizonY;
    // depth 0.5: above groundLayer (0) so sky is visible at top of screen
    const gfx = this.scene.add.graphics().setDepth(0.5).setScrollFactor(0);

    const strips = 28;
    for (let i = 0; i < strips; i++) {
      const t = i / strips;
      const color = this.lerpColor(pal.skyTop, i < strips * 0.5 ? pal.skyMid : pal.skyBot, t * 2 > 1 ? t * 2 - 1 : t * 2);
      gfx.fillStyle(color, 1);
      gfx.fillRect(0, Math.floor(t * HOR), W, Math.ceil(HOR / strips) + 1);
    }

    this.addLayer(gfx, 0, 0.5);
  }

  // ── Stars ─────────────────────────────────────────────────────────────────

  private buildStars(pal: ChapterPalette): void {
    const W = GAME_WIDTH;
    const HOR = this.horizonY;
    const gfx = this.scene.add.graphics().setDepth(0.6).setScrollFactor(0);

    this.stars = [];
    for (let i = 0; i < pal.starCount; i++) {
      const hash = ((i * 137 + 7) * 31 + i * 11) & 0xffff;
      const sx = hash % W;
      const sy = (hash * 3) % (HOR * 0.88);
      const brightness = pal.starBrightness * (0.4 + (hash % 10) * 0.06);
      const sz = 0.3 + (hash % 4) * 0.25;
      this.stars.push({ x: sx, y: sy, size: sz, brightness });
      gfx.fillStyle(0xffffff, brightness);
      gfx.fillCircle(sx, sy, sz);
    }

    this.addLayer(gfx, 0, 0.6);
  }

  // ── Far mountains ─────────────────────────────────────────────────────────

  private buildMountainsFar(pal: ChapterPalette): void {
    const W = GAME_WIDTH;
    const HOR = this.horizonY;
    const gfx = this.scene.add.graphics().setDepth(0.7).setScrollFactor(0.15);

    for (let x = -30; x < W + 60; x += 28) {
      const h2 = ((x * 31 + 7) * 17) & 0xff;
      const mh = 16 + (h2 % 26);
      const mw = 42 + (h2 % 24);
      gfx.fillStyle(pal.mtFar, 0.85);
      gfx.fillTriangle(x, HOR + 3, x + mw / 2, HOR - mh, x + mw, HOR + 3);
      // Subtle highlight on peak
      gfx.fillStyle(0xffffff, 0.025);
      gfx.fillTriangle(x + mw / 2 - 2, HOR - mh + 2, x + mw / 2, HOR - mh, x + mw / 2 + 2, HOR - mh + 3);
    }

    this.addLayer(gfx, 0.15, 0.7);
  }

  // ── Horizon glow ─────────────────────────────────────────────────────────

  private buildHorizonGlow(pal: ChapterPalette, chapter: number): void {
    const W = GAME_WIDTH;
    const HOR = this.horizonY;
    const glowX = chapter === 12 ? W * 0.5 : W * 0.62;
    const gfx = this.scene.add.graphics().setDepth(-6).setScrollFactor(0);

    // Wide soft halo
    const halos = [
      { r: 120, a: pal.horizonGlowAlpha * 0.12 },
      { r: 85,  a: pal.horizonGlowAlpha * 0.22 },
      { r: 55,  a: pal.horizonGlowAlpha * 0.38 },
      { r: 32,  a: pal.horizonGlowAlpha * 0.60 },
      { r: 16,  a: pal.horizonGlowAlpha * 0.80 },
      { r: 8,   a: pal.horizonGlowAlpha },
    ];
    for (const { r, a } of halos) {
      gfx.fillStyle(pal.horizonGlow, a);
      gfx.fillEllipse(glowX, HOR, r * 2.6, r * 0.75);
    }
    // Bright core
    gfx.fillStyle(0xffffff, pal.horizonGlowAlpha * 0.5);
    gfx.fillEllipse(glowX, HOR, 22, 7);

    // Chapter 12 — vertical light rays
    if (chapter === 12) {
      for (let ray = -3; ray <= 3; ray++) {
        const rx = glowX + ray * 14;
        const rLen = 20 + Math.abs(ray) * 5;
        gfx.fillStyle(pal.horizonGlow, 0.12 - Math.abs(ray) * 0.025);
        gfx.fillRect(rx - 1, HOR - rLen, 2, rLen);
      }
    }

    this.addLayer(gfx, 0, 0.8);
  }

  // ── Near mountains ────────────────────────────────────────────────────────

  private buildMountainsNear(pal: ChapterPalette): void {
    const W = GAME_WIDTH;
    const HOR = this.horizonY;
    const gfx = this.scene.add.graphics().setDepth(0.9).setScrollFactor(0.35);

    for (let x = -40; x < W + 80; x += 50) {
      const h2 = ((x * 53 + 3) * 23) & 0xff;
      const mh = 30 + (h2 % 24);
      const mw = 75 + (h2 % 45);
      gfx.fillStyle(pal.mtNear, 0.97);
      gfx.fillTriangle(x, HOR + 3, x + mw / 2, HOR - mh, x + mw, HOR + 3);
      // Snow/light cap on near mountains for high-visibility
      if (pal.starBrightness > 0.2) {
        gfx.fillStyle(0xffffff, 0.04);
        gfx.fillTriangle(x + mw / 2 - 3, HOR - mh + 4, x + mw / 2, HOR - mh, x + mw / 2 + 3, HOR - mh + 5);
      }
    }

    this.addLayer(gfx, 0.35, 0.9);
  }

  // ── Ground ────────────────────────────────────────────────────────────────

  private buildGround(pal: ChapterPalette): void {
    const W = GAME_WIDTH;
    const H = GAME_HEIGHT;
    const HOR = this.horizonY;
    const gfx = this.scene.add.graphics().setDepth(-4).setScrollFactor(0);

    const strips = 12;
    for (let i = 0; i < strips; i++) {
      const t = i / strips;
      const color = this.lerpColor(pal.ground, pal.groundBot, t);
      gfx.fillStyle(color, 1);
      gfx.fillRect(0, HOR + Math.floor(t * (H - HOR)), W, Math.ceil((H - HOR) / strips) + 1);
    }

    // Ground edge highlight line
    gfx.lineStyle(1, 0xffffff, 0.04);
    gfx.lineBetween(0, HOR, W, HOR);

    this.addLayer(gfx, 0, -4);
  }

  // ── Fog (optional, for swamp/dark chapters) ───────────────────────────────

  private buildFog(pal: ChapterPalette): void {
    const W = GAME_WIDTH;
    const HOR = this.horizonY;
    const gfx = this.scene.add.graphics().setDepth(-3).setScrollFactor(0);

    // Mist band at horizon
    for (let i = 0; i < 4; i++) {
      const y = HOR + i * 8;
      gfx.fillStyle(pal.fogColor, pal.fogAlpha * (1 - i / 4));
      gfx.fillRect(0, y, W, 8);
    }

    this.addLayer(gfx, 0, -3);
  }

  // ── Edge vignette (always present) ────────────────────────────────────────

  buildVignette(): void {
    const W = GAME_WIDTH;
    const H = GAME_HEIGHT;
    // depth 3.5: above terrain zones (2) but below NPC/player/HUD
    const gfx = this.scene.add.graphics().setDepth(3.5).setScrollFactor(0);

    for (let i = 0; i < 10; i++) {
      const t = i / 10;
      const a = 0.20 * (1 - t);
      gfx.fillStyle(0x000000, a);
      // Top edge
      gfx.fillRect(0, 0, W, 7 - i * 0.6 + 1);
      // Bottom edge
      gfx.fillRect(0, H - 7 + i, W, 7);
    }
    for (let i = 0; i < 6; i++) {
      gfx.fillStyle(0x000000, 0.12 * (1 - i / 6));
      gfx.fillRect(0, 0, 5, H);
      gfx.fillRect(W - 5, 0, 5, H);
    }

    this.addLayer(gfx, 0, 3.5);
  }

  // ── Animated overlay (stars twinkle, horizon pulse) ───────────────────────

  update(scrollX: number): void {
    this.elapsed += 16; // approximate frame ms
    const t = this.elapsed * 0.001;

    // Update parallax layer scroll offsets
    for (const layer of this.layers) {
      if (layer.speed > 0 && layer.speed < 1) {
        // Partial parallax: move slower than camera
        layer.gfx.setScrollFactor(layer.speed);
      }
    }

    if (!this.animGfx) return;
    this.animGfx.clear();

    // Twinkle stars (randomly flash ~5 per frame)
    const twinkleCount = Math.min(5, this.stars.length);
    for (let i = 0; i < twinkleCount; i++) {
      const idx = Math.floor(Math.random() * this.stars.length);
      const star = this.stars[idx];
      if (!star) continue;
      const twinkle = 0.6 + Math.sin(t * 3 + idx * 2.3) * 0.4;
      this.animGfx.fillStyle(0xffffff, star.brightness * twinkle);
      this.animGfx.fillCircle(star.x, star.y, star.size * twinkle);
    }

    // Subtle horizon glow pulse
    const horizonGlowPulse = 0.98 + Math.sin(t * 0.8) * 0.02;
    void scrollX; // horizontal scroll used by caller; unused in pure parallax-setScrollFactor mode
    void horizonGlowPulse;
  }

  // ── Utility ───────────────────────────────────────────────────────────────

  private lerpColor(a: number, b: number, t: number): number {
    const tc = Phaser.Math.Clamp(t, 0, 1);
    const ar = (a >> 16) & 0xff, ag = (a >> 8) & 0xff, ab = a & 0xff;
    const br = (b >> 16) & 0xff, bg2 = (b >> 8) & 0xff, bb = b & 0xff;
    return (Math.round(ar + (br - ar) * tc) << 16) |
           (Math.round(ag + (bg2 - ag) * tc) << 8) |
            Math.round(ab + (bb - ab) * tc);
  }

  destroy(): void {
    for (const layer of this.layers) layer.gfx.destroy();
    this.layers = [];
    this.animGfx?.destroy();
    this.animGfx = null;
    this.stars = [];
  }
}
