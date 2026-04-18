import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface CP {
  skyA: number; skyB: number; skyC: number; skyD: number;
  glowColor: number; glowAlpha: number; glowCX: number;
  silFar: number; silFarA: number;
  silMid: number; silMidA: number;
  groundA: number; groundB: number;
  stars: number; starBright: number;
  fogColor: number; fogAlpha: number;
  cloudColor: number; cloudAlpha: number;
  atm: 'smoke' | 'mist' | 'embers' | 'holy' | 'dark' | 'market' | 'none';
}

interface StarData { x: number; y: number; size: number; bright: number }
interface AmbientParticle { x: number; y: number; vx: number; vy: number; life: number; size: number; color: number }

// ─────────────────────────────────────────────────────────────────────────────
// Palettes  (much more vivid than the old near-black versions)
// ─────────────────────────────────────────────────────────────────────────────

const PALETTES: Record<number, CP> = {
  // Ch1 – City of Destruction  (smoky ember sky, burning city)
  1: {
    skyA: 0x1e0808, skyB: 0x3a1200, skyC: 0x6e2200, skyD: 0xaa3800,
    glowColor: 0xff5500, glowAlpha: 0.55, glowCX: 0.72,
    silFar: 0x220a04, silFarA: 0.95,
    silMid: 0x150402, silMidA: 0.97,
    groundA: 0x1c0e08, groundB: 0x0e0804,
    stars: 25, starBright: 0.15,
    fogColor: 0x3a1000, fogAlpha: 0.18,
    cloudColor: 0x2e0c04, cloudAlpha: 0.45,
    atm: 'smoke',
  },
  // Ch2 – Slough of Despond  (sickly olive-green swamp sky)
  2: {
    skyA: 0x0c1410, skyB: 0x182418, skyC: 0x1e3020, skyD: 0x283a28,
    glowColor: 0x3a7044, glowAlpha: 0.22, glowCX: 0.38,
    silFar: 0x0a1810, silFarA: 0.90,
    silMid: 0x081208, silMidA: 0.95,
    groundA: 0x101a10, groundB: 0x080e08,
    stars: 18, starBright: 0.10,
    fogColor: 0x1a4a28, fogAlpha: 0.30,
    cloudColor: 0x1a2820, cloudAlpha: 0.48,
    atm: 'mist',
  },
  // Ch3 – Hill Difficulty  (crisp stormy blue sky, rocky peaks)
  3: {
    skyA: 0x0e1424, skyB: 0x1a2e48, skyC: 0x2e4870, skyD: 0x446688,
    glowColor: 0x6088aa, glowAlpha: 0.28, glowCX: 0.55,
    silFar: 0x0e1a28, silFarA: 0.88,
    silMid: 0x081018, silMidA: 0.92,
    groundA: 0x142030, groundB: 0x080e18,
    stars: 65, starBright: 0.24,
    fogColor: 0x6090b8, fogAlpha: 0.07,
    cloudColor: 0x243040, cloudAlpha: 0.32,
    atm: 'none',
  },
  // Ch4 – Palace Beautiful  (rich purple twilight)
  4: {
    skyA: 0x100a22, skyB: 0x1e1244, skyC: 0x302060, skyD: 0x4e2e88,
    glowColor: 0x8855cc, glowAlpha: 0.40, glowCX: 0.60,
    silFar: 0x150c22, silFarA: 0.88,
    silMid: 0x0c0818, silMidA: 0.92,
    groundA: 0x14102a, groundB: 0x0a0818,
    stars: 60, starBright: 0.24,
    fogColor: 0x4422aa, fogAlpha: 0.06,
    cloudColor: 0x201840, cloudAlpha: 0.28,
    atm: 'none',
  },
  // Ch5 – Interpreter's House  (warm amber candlelit interior)
  5: {
    skyA: 0x1c1006, skyB: 0x2e1a08, skyC: 0x4e2e0a, skyD: 0x884010,
    glowColor: 0xd48828, glowAlpha: 0.48, glowCX: 0.45,
    silFar: 0x1e1208, silFarA: 0.90,
    silMid: 0x120c04, silMidA: 0.94,
    groundA: 0x1c1208, groundB: 0x0e0a04,
    stars: 35, starBright: 0.16,
    fogColor: 0xd48828, fogAlpha: 0.04,
    cloudColor: 0x2a1a08, cloudAlpha: 0.22,
    atm: 'none',
  },
  // Ch6 – The Cross / Valley of Grace  (brilliant bright blue sky)
  6: {
    skyA: 0x0c1830, skyB: 0x1a3870, skyC: 0x3068a8, skyD: 0x58a0cc,
    glowColor: 0x80d8f8, glowAlpha: 0.38, glowCX: 0.50,
    silFar: 0x0a2a18, silFarA: 0.85,
    silMid: 0x081a10, silMidA: 0.88,
    groundA: 0x183a18, groundB: 0x0c2008,
    stars: 28, starBright: 0.14,
    fogColor: 0x90d8f8, fogAlpha: 0.05,
    cloudColor: 0xd8e8f8, cloudAlpha: 0.22,
    atm: 'holy',
  },
  // Ch7 – Beautiful Palace (2nd)  (dusk amber-red)
  7: {
    skyA: 0x120808, skyB: 0x281008, skyC: 0x401808, skyD: 0x6a2808,
    glowColor: 0xcc3322, glowAlpha: 0.38, glowCX: 0.65,
    silFar: 0x160808, silFarA: 0.92,
    silMid: 0x0c0404, silMidA: 0.96,
    groundA: 0x1c1008, groundB: 0x100804,
    stars: 22, starBright: 0.12,
    fogColor: 0x440022, fogAlpha: 0.10,
    cloudColor: 0x1c0a08, cloudAlpha: 0.35,
    atm: 'none',
  },
  // Ch8 – Valley of Humiliation / Apollyon  (volcanic blood-red)
  8: {
    skyA: 0x180404, skyB: 0x2c0808, skyC: 0x480808, skyD: 0x700808,
    glowColor: 0xff2200, glowAlpha: 0.55, glowCX: 0.50,
    silFar: 0x1a0404, silFarA: 0.96,
    silMid: 0x100202, silMidA: 0.98,
    groundA: 0x200808, groundB: 0x120404,
    stars: 12, starBright: 0.07,
    fogColor: 0xff1100, fogAlpha: 0.08,
    cloudColor: 0x2a0404, cloudAlpha: 0.45,
    atm: 'embers',
  },
  // Ch9 – Valley of Shadow of Death  (near-total darkness)
  9: {
    skyA: 0x040204, skyB: 0x060408, skyC: 0x08060c, skyD: 0x0c080e,
    glowColor: 0x550033, glowAlpha: 0.20, glowCX: 0.50,
    silFar: 0x060208, silFarA: 0.98,
    silMid: 0x040106, silMidA: 0.99,
    groundA: 0x060404, groundB: 0x040204,
    stars: 8, starBright: 0.05,
    fogColor: 0x220011, fogAlpha: 0.22,
    cloudColor: 0x080408, cloudAlpha: 0.55,
    atm: 'dark',
  },
  // Ch10 – Vanity Fair  (lurid purple night-market sky)
  10: {
    skyA: 0x0c0820, skyB: 0x18103c, skyC: 0x261460, skyD: 0x3c1a88,
    glowColor: 0x5522cc, glowAlpha: 0.42, glowCX: 0.35,
    silFar: 0x100820, silFarA: 0.88,
    silMid: 0x080412, silMidA: 0.92,
    groundA: 0x100c20, groundB: 0x080818,
    stars: 55, starBright: 0.22,
    fogColor: 0x2244aa, fogAlpha: 0.06,
    cloudColor: 0x181030, cloudAlpha: 0.28,
    atm: 'market',
  },
  // Ch11 – Doubting Castle  (cold iron-blue prison sky)
  11: {
    skyA: 0x080c16, skyB: 0x101a2e, skyC: 0x182840, skyD: 0x243658,
    glowColor: 0x3a4a78, glowAlpha: 0.28, glowCX: 0.50,
    silFar: 0x0c1220, silFarA: 0.94,
    silMid: 0x060c14, silMidA: 0.96,
    groundA: 0x0e1420, groundB: 0x070c16,
    stars: 28, starBright: 0.14,
    fogColor: 0x333366, fogAlpha: 0.14,
    cloudColor: 0x141a2c, cloudAlpha: 0.42,
    atm: 'mist',
  },
  // Ch12 – Celestial City  (purple-to-gold glory sky)
  12: {
    skyA: 0x200c2a, skyB: 0x381a4a, skyC: 0x603074, skyD: 0xd4a030,
    glowColor: 0xffd700, glowAlpha: 0.65, glowCX: 0.50,
    silFar: 0xe8e0b8, silFarA: 0.65,
    silMid: 0xf4f0d8, silMidA: 0.50,
    groundA: 0x201630, groundB: 0x140c20,
    stars: 90, starBright: 0.38,
    fogColor: 0xffd700, fogAlpha: 0.04,
    cloudColor: 0xfff0c8, cloudAlpha: 0.18,
    atm: 'holy',
  },
};

const DEFAULT_PAL: CP = {
  skyA: 0x080414, skyB: 0x100818, skyC: 0x18102a, skyD: 0x28183e,
  glowColor: 0xd4a853, glowAlpha: 0.18, glowCX: 0.60,
  silFar: 0x0a0318, silFarA: 0.88,
  silMid: 0x060210, silMidA: 0.92,
  groundA: 0x100818, groundB: 0x080410,
  stars: 50, starBright: 0.22,
  fogColor: 0x000000, fogAlpha: 0,
  cloudColor: 0x181028, cloudAlpha: 0.25,
  atm: 'none',
};

// ─────────────────────────────────────────────────────────────────────────────
// Main class
// ─────────────────────────────────────────────────────────────────────────────

export class ParallaxBackground {
  private scene: Phaser.Scene;
  private layers: Phaser.GameObjects.Graphics[] = [];
  private animGfx: Phaser.GameObjects.Graphics | null = null;
  private cloudGfx: Phaser.GameObjects.Graphics | null = null;

  private horizonY: number;
  private chapter = 1;
  private elapsed = 0;

  private stars: StarData[] = [];
  private atmParticles: AmbientParticle[] = [];
  // Cloud strip data for drift animation
  private clouds: { x: number; y: number; w: number; h: number; drift: number }[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.horizonY = Math.round(GAME_HEIGHT * 0.42);
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  init(chapter: number, mapWidth: number): void {
    this.destroy();
    this.chapter   = chapter;
    void mapWidth; // mapWidth stored for potential future parallax tuning
    this.horizonY  = Math.round(GAME_HEIGHT * 0.42);
    this.elapsed   = 0;
    this.atmParticles = [];

    const pal = PALETTES[chapter] ?? DEFAULT_PAL;

    // Depth ladder (all above groundLayer depth=0 so they sit in the "sky zone")
    // ALL layers use scrollFactor(0,0) — fully fixed theatrical backdrop.
    // Only the game-world tile layer (depth=0, SF=1) scrolls with the camera.
    // This prevents any "background drifts separately from floor" disconnect.
    this.buildSky(pal);                      // depth 0.50, SF(0,0)
    this.buildStars(pal);                    // depth 0.52, SF(0,0)
    this.buildClouds(pal);                   // depth 0.54, SF(0,0) + animated drift
    this.buildHorizonGlow(pal);              // depth 0.56, SF(0,0)
    this.buildFarSilhouette(pal, chapter);   // depth 0.58, SF(0,0)
    this.buildMidSilhouette(pal, chapter);   // depth 0.62, SF(0,0)
    this.buildHorizonBlend(pal);             // depth 0.64, SF(0,0) — gradient seam cover
    if (pal.fogAlpha > 0.01) this.buildFog(pal);   // depth 0.66, SF(0,0)
    this.buildVignette();                    // depth 3.5, SF(0,0)

    this.animGfx = this.scene.add.graphics().setDepth(0.68).setScrollFactor(0);
    this.seedAtmosphere(pal);
  }

  update(_scrollX: number): void {
    this.elapsed += 16;
    const t = this.elapsed * 0.001;

    // ── Cloud drift ──
    if (this.cloudGfx) {
      const drift = t * 6; // px/sec scroll
      this.cloudGfx.setX(-((drift % GAME_WIDTH)));
    }

    if (!this.animGfx) return;
    this.animGfx.clear();
    const pal = PALETTES[this.chapter] ?? DEFAULT_PAL;

    // ── Star twinkle ──
    const twinkleN = Math.min(6, this.stars.length);
    for (let i = 0; i < twinkleN; i++) {
      const idx = Math.floor(Math.random() * this.stars.length);
      const s = this.stars[idx];
      if (!s) continue;
      const tw = 0.55 + Math.sin(t * 3 + idx * 2.3) * 0.45;
      this.animGfx.fillStyle(0xffffff, s.bright * tw);
      this.animGfx.fillCircle(s.x, s.y, s.size * Math.max(0.5, tw));
    }

    // ── Atmosphere particles ──
    this.updateAtmParticles(pal);
    for (const p of this.atmParticles) {
      if (p.life <= 0) continue;
      const alpha = (p.life / 1.0) * 0.8;
      this.animGfx.fillStyle(p.color, alpha);
      this.animGfx.fillCircle(p.x, p.y, p.size);
    }

    // ── Holy light pulse (Ch6, Ch12) ──
    if (pal.atm === 'holy') {
      const pulse = 0.015 + Math.abs(Math.sin(t * 0.6)) * 0.015;
      const cx = GAME_WIDTH * pal.glowCX;
      this.animGfx.fillStyle(pal.glowColor, pulse);
      this.animGfx.fillEllipse(cx, this.horizonY, 260, 80);
    }

    // ── Market lights (Ch10) ──
    if (pal.atm === 'market') {
      const marketColors = [0xff4488, 0xffaa22, 0x44ccff, 0xcc44ff, 0x44ff88];
      for (let ml = 0; ml < 8; ml++) {
        const mx = (ml * 58 + 20) % GAME_WIDTH;
        const my = this.horizonY - 8 - (ml % 4) * 6;
        const flicker = 0.3 + Math.abs(Math.sin(t * 4 + ml * 1.7)) * 0.4;
        this.animGfx.fillStyle(marketColors[ml % marketColors.length], flicker * 0.7);
        this.animGfx.fillCircle(mx, my, 1.5);
        this.animGfx.fillStyle(marketColors[ml % marketColors.length], flicker * 0.15);
        this.animGfx.fillCircle(mx, my, 5);
      }
    }
  }

  destroy(): void {
    for (const g of this.layers) g.destroy();
    this.layers = [];
    this.cloudGfx?.destroy(); this.cloudGfx = null;
    this.animGfx?.destroy();  this.animGfx  = null;
    this.stars = [];
    this.atmParticles = [];
    this.clouds = [];
  }

  // Expose so TileMapManager can call after other layers
  buildVignette(): void {
    const W = GAME_WIDTH, H = GAME_HEIGHT;
    const gfx = this.scene.add.graphics().setDepth(3.5).setScrollFactor(0);
    // Top & bottom darkening
    for (let i = 0; i < 12; i++) {
      const a = 0.22 * (1 - i / 12);
      gfx.fillStyle(0x000000, a);
      gfx.fillRect(0, 0, W, Math.max(1, 9 - i));
      gfx.fillRect(0, H - 9 + i, W, 9);
    }
    // Left & right darkening
    for (let i = 0; i < 7; i++) {
      gfx.fillStyle(0x000000, 0.14 * (1 - i / 7));
      gfx.fillRect(0, 0, 6 - i, H);
      gfx.fillRect(W - 6 + i, 0, 6, H);
    }
    this.layers.push(gfx);
  }

  // ── Private builders ───────────────────────────────────────────────────────

  private buildSky(pal: CP): void {
    const W = GAME_WIDTH, HOR = this.horizonY;
    const gfx = this.scene.add.graphics().setDepth(0.50).setScrollFactor(0);

    // 4-stop gradient with 32 strips for smooth banding
    const stops = [pal.skyA, pal.skyB, pal.skyC, pal.skyD];
    const STRIPS = 32;
    for (let i = 0; i < STRIPS; i++) {
      const t    = i / STRIPS;
      const seg  = t * (stops.length - 1);
      const lo   = Math.floor(seg), hi = Math.min(stops.length - 1, lo + 1);
      const frac = seg - lo;
      const col  = this.lerp3(stops[lo], stops[hi], frac);
      gfx.fillStyle(col, 1);
      const y0 = Math.floor(t * HOR);
      const y1 = Math.floor((i + 1) / STRIPS * HOR);
      gfx.fillRect(0, y0, W, Math.max(1, y1 - y0) + 1);
    }
    this.layers.push(gfx);
  }

  private buildStars(pal: CP): void {
    if (pal.stars === 0) return;
    const W = GAME_WIDTH, HOR = this.horizonY;
    const gfx = this.scene.add.graphics().setDepth(0.52).setScrollFactor(0);
    this.stars = [];

    // Distribute across 3 zones: tiny dim / small / occasional bright
    for (let i = 0; i < pal.stars; i++) {
      const h = ((i * 137 + 7) * 31 + i * 11) & 0xffff;
      const x = h % W;
      const y = ((h * 3) % Math.round(HOR * 0.92));
      const bright = pal.starBright * (0.4 + (h % 10) * 0.06);
      const size   = 0.25 + (h % 4) * 0.22;
      this.stars.push({ x, y, size, bright });
      gfx.fillStyle(0xffffff, bright);
      gfx.fillCircle(x, y, size);
    }
    this.layers.push(gfx);
  }

  private buildClouds(pal: CP): void {
    if (pal.cloudAlpha < 0.02) return;
    const W = GAME_WIDTH * 2.2; // double-wide for seamless drift loop
    const HOR = this.horizonY;
    const gfx = this.scene.add.graphics().setDepth(0.54).setScrollFactor(0);
    this.cloudGfx = gfx;

    this.clouds = [];
    const cloudCount = 7 + (this.chapter % 4);
    for (let i = 0; i < cloudCount; i++) {
      const h  = ((i * 97 + 13) * 41 + this.chapter * 7) & 0xffff;
      const cx = (h % Math.round(W));
      const cy = 4 + ((h * 3) % Math.round(HOR * 0.72));
      const cw = 30 + (h % 50);
      const ch = 6  + (h % 14);
      this.clouds.push({ x: cx, y: cy, w: cw, h: ch, drift: 1 + (h % 3) * 0.5 });

      // Draw multi-blob cloud
      const baseAlpha = pal.cloudAlpha * (0.6 + (h % 5) * 0.08);
      // Outer soft halo
      gfx.fillStyle(pal.cloudColor, baseAlpha * 0.35);
      gfx.fillEllipse(cx, cy, cw * 1.3, ch * 1.6);
      // Mid layer
      gfx.fillStyle(pal.cloudColor, baseAlpha * 0.65);
      gfx.fillEllipse(cx, cy, cw, ch);
      // Left blob
      gfx.fillStyle(pal.cloudColor, baseAlpha * 0.55);
      gfx.fillEllipse(cx - cw * 0.28, cy + 1, cw * 0.6, ch * 0.8);
      // Right blob
      gfx.fillStyle(pal.cloudColor, baseAlpha * 0.50);
      gfx.fillEllipse(cx + cw * 0.30, cy + 2, cw * 0.55, ch * 0.75);
      // Bright core highlight
      gfx.fillStyle(0xffffff, baseAlpha * 0.06);
      gfx.fillEllipse(cx - 2, cy - 1, cw * 0.4, ch * 0.4);
    }
    this.layers.push(gfx);
  }

  private buildHorizonGlow(pal: CP): void {
    if (pal.glowAlpha < 0.01) return;
    const W = GAME_WIDTH, HOR = this.horizonY;
    const cx = W * pal.glowCX;
    // FIXED depth: was -6 (invisible behind tiles). Now 0.56 (visible in sky).
    const gfx = this.scene.add.graphics().setDepth(0.56).setScrollFactor(0);

    // Concentric halo rings
    const halos: [number, number][] = [
      [200, 0.06], [150, 0.10], [110, 0.16], [75, 0.25],
      [48,  0.40], [28,  0.60], [14,  0.82], [6,  1.00],
    ];
    for (const [r, frac] of halos) {
      gfx.fillStyle(pal.glowColor, pal.glowAlpha * frac);
      gfx.fillEllipse(cx, HOR, r * 2.8, r * 0.55);
    }
    // Bright core
    gfx.fillStyle(0xffffff, pal.glowAlpha * 0.55);
    gfx.fillEllipse(cx, HOR, 24, 6);
    // Thin horizon line
    gfx.lineStyle(1, pal.glowColor, pal.glowAlpha * 0.4);
    gfx.lineBetween(0, HOR, W, HOR);

    // Ch12: vertical god-rays
    if (this.chapter === 12) {
      for (let r = -4; r <= 4; r++) {
        const rx   = cx + r * 16;
        const rLen = 28 + Math.abs(r) * 4;
        gfx.fillStyle(pal.glowColor, 0.10 - Math.abs(r) * 0.018);
        gfx.fillTriangle(rx - 2, HOR, rx, HOR - rLen, rx + 2, HOR);
      }
    }
    this.layers.push(gfx);
  }

  // ── Far silhouette dispatcher ──────────────────────────────────────────────

  private buildFarSilhouette(pal: CP, chapter: number): void {
    // SF(0,0): completely fixed to viewport — no horizontal drift vs. ground tiles
    const drawW = GAME_WIDTH + 20;
    const gfx = this.scene.add.graphics().setDepth(0.58).setScrollFactor(0, 0);

    switch (chapter) {
      case 1:  this.silCity(gfx, drawW, pal); break;
      case 2:  this.silSwamp(gfx, drawW, pal); break;
      case 3:  this.silMountains(gfx, drawW, pal); break;
      case 4:  this.silPalace(gfx, drawW, pal); break;
      case 5:  this.silInterior(gfx, drawW, pal); break;
      case 6:  this.silValley(gfx, drawW, pal); break;
      case 7:  this.silCanyonFar(gfx, drawW, pal); break;
      case 8:  this.silVolcanic(gfx, drawW, pal); break;
      case 9:  this.silShadow(gfx, drawW, pal); break;
      case 10: this.silMarket(gfx, drawW, pal); break;
      case 11: this.silCastle(gfx, drawW, pal); break;
      case 12: this.silCelestial(gfx, drawW, pal); break;
      default: this.silGenericMountains(gfx, drawW, pal); break;
    }
    this.layers.push(gfx);
  }

  // ── Mid silhouette dispatcher ──────────────────────────────────────────────

  private buildMidSilhouette(pal: CP, chapter: number): void {
    // SF(0,0): completely fixed — no drift against ground tile layer
    const drawW = GAME_WIDTH + 20;
    const gfx = this.scene.add.graphics().setDepth(0.62).setScrollFactor(0, 0);

    switch (chapter) {
      case 1:  this.midCityRuins(gfx, drawW, pal); break;
      case 2:  this.midSwampTrees(gfx, drawW, pal); break;
      case 3:  this.midRockyCliff(gfx, drawW, pal); break;
      case 4:  this.midPalaceGarden(gfx, drawW, pal); break;
      case 5:  this.midInteriorWarm(gfx, drawW, pal); break;
      case 6:  this.midMeadow(gfx, drawW, pal); break;
      case 7:  this.midDarkRocks(gfx, drawW, pal); break;
      case 8:  this.midLavaField(gfx, drawW, pal); break;
      case 9:  this.midShadowCliffs(gfx, drawW, pal); break;
      case 10: this.midMarketStalls(gfx, drawW, pal); break;
      case 11: this.midCastleWalls(gfx, drawW, pal); break;
      case 12: this.midHeavenlyRoad(gfx, drawW, pal); break;
      default: this.midGenericHills(gfx, drawW, pal); break;
    }
    this.layers.push(gfx);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FAR SILHOUETTE CHAPTERS
  // ─────────────────────────────────────────────────────────────────────────

  /** Ch1 – Burning city skyline: towers, broken battlements, fire glow */
  private silCity(g: Phaser.GameObjects.Graphics, W: number, pal: CP): void {
    const HOR = this.horizonY;
    const towerDefs: [number, number, number][] = []; // [x, w, h]
    let tx = -20;
    while (tx < W + 20) {
      const h2 = ((tx * 31 + 7) * 17) & 0xff;
      const tw = 14 + (h2 % 22);
      const th = 30 + (h2 % 55);
      towerDefs.push([tx, tw, th]);
      tx += tw + 2 + (h2 % 8);
    }
    // Back fill: solid horizon band
    g.fillStyle(pal.silFar, 0.60);
    g.fillRect(0, HOR - 10, W, 14);

    for (const [x, tw, th] of towerDefs) {
      const h2 = ((x * 31 + 7) * 17) & 0xff;
      const broken = (h2 % 4 === 0);

      // Tower body
      g.fillStyle(pal.silFar, pal.silFarA);
      g.fillRect(x, HOR - th, tw, th + 4);

      // Darker inner shadow
      g.fillStyle(0x000000, 0.25);
      g.fillRect(x + tw - 3, HOR - th + 4, 3, th - 4);

      // Battlement notches
      const mw = 5, mg = 3;
      for (let bx = x; bx < x + tw - mw; bx += mw + mg) {
        g.fillStyle(broken && bx === x ? 0x000000 : pal.silFar, broken && bx === x ? 0 : pal.silFarA);
        if (!broken || bx !== x) {
          g.fillRect(bx, HOR - th - 6, mw, 6);
        }
      }

      // Broken top on some towers
      if (broken) {
        g.fillStyle(0x000000, 1);
        g.fillTriangle(x + tw - 8, HOR - th - 2, x + tw, HOR - th + 8, x + tw + 4, HOR - th - 4);
        // Fire glow behind broken edge
        g.fillStyle(0xff4400, 0.12);
        g.fillCircle(x + tw / 2, HOR - th - 8, 12);
        g.fillStyle(0xff8800, 0.07);
        g.fillCircle(x + tw / 2, HOR - th - 14, 8);
      }

      // Window openings (2 per tall tower)
      if (th > 40) {
        const wh = 5, ww = 3;
        for (let wi = 0; wi < 2; wi++) {
          const wy = HOR - th + 8 + wi * 14;
          g.fillStyle(0x000000, 0.85);
          g.fillRect(x + 4, wy, ww, wh);
          // Occasional warm light in window
          if ((h2 + wi) % 3 === 0) {
            g.fillStyle(0xff6600, 0.20);
            g.fillRect(x + 4, wy, ww, wh);
          }
        }
      }

      // Smoke plume from top
      if ((h2 % 3) === 0) {
        g.fillStyle(0x1a0a00, 0.18);
        g.fillEllipse(x + tw / 2, HOR - th - 18, 12, 22);
        g.fillStyle(0x1a0a00, 0.10);
        g.fillEllipse(x + tw / 2 + 3, HOR - th - 30, 10, 16);
      }
    }
  }

  /** Ch2 – Dead willow silhouettes, reeds, murky water hint */
  private silSwamp(g: Phaser.GameObjects.Graphics, W: number, pal: CP): void {
    const HOR = this.horizonY;

    // Murky water band at horizon
    g.fillStyle(0x182820, 0.55);
    g.fillRect(0, HOR - 4, W, 10);
    g.fillStyle(0x3a6050, 0.12);
    g.fillRect(0, HOR - 2, W, 4);

    // Willow tree silhouettes
    let wt = -10;
    while (wt < W + 20) {
      const h2 = ((wt * 23 + 5) * 19) & 0xff;
      const th = 28 + (h2 % 30);
      const tw = 3 + (h2 % 4);
      // Trunk
      g.fillStyle(pal.silFar, pal.silFarA * 0.9);
      g.fillRect(wt - 1, HOR - th, tw, th + 4);
      // Gnarled branches
      for (let b = 0; b < 5 + (h2 % 4); b++) {
        const bh = ((h2 * (b + 3) * 11) + wt) & 0xff;
        const ba = (bh / 255) * Math.PI - Math.PI * 0.15;
        const bLen = 8 + (bh % 12);
        const bStartY = HOR - th * (0.35 + b * 0.12);
        g.lineStyle(1, pal.silFar, pal.silFarA * 0.85);
        g.lineBetween(wt, bStartY, wt + Math.cos(ba) * bLen, bStartY - Math.abs(Math.sin(ba)) * bLen * 0.6);
      }
      // Hanging moss (drooping lines)
      for (let m = 0; m < 3 + (h2 % 3); m++) {
        const mh = ((h2 * (m + 5) * 7) + wt) & 0xff;
        const mx = wt - 6 + (mh % 14);
        const mStartY = HOR - th * (0.4 + m * 0.1);
        g.lineStyle(1, 0x1a3020, 0.35);
        g.lineBetween(mx, mStartY, mx + (mh % 3) - 1, mStartY + 8 + (mh % 10));
      }
      wt += 18 + (h2 % 25);
    }

    // Reed bed at horizon
    for (let r = 0; r < 40; r++) {
      const rh = ((r * 43 + 2) * 11) & 0xff;
      const rx = (rh % W);
      const ry = HOR - 2 - (rh % 12);
      g.fillStyle(0x2a4030, pal.silFarA * 0.5);
      g.fillRect(rx, ry, 1, 10 + (rh % 8));
      g.fillStyle(0x3a5040, 0.4);
      g.fillRect(rx - 1, ry - 3, 3, 5);
    }
  }

  /** Ch3 – Dramatic jagged mountain range with snow caps */
  private silMountains(g: Phaser.GameObjects.Graphics, W: number, pal: CP): void {
    const HOR = this.horizonY;

    // Back range (slightly lighter = more distant)
    let mx = -40;
    while (mx < W + 60) {
      const h2 = ((mx * 31 + 7) * 17) & 0xff;
      const mh = 24 + (h2 % 34);
      const mw = 50 + (h2 % 40);
      const col = this.lerp3(pal.silFar, pal.silFar | 0x060810, 0.4);
      g.fillStyle(col, pal.silFarA * 0.7);
      g.fillTriangle(mx, HOR + 2, mx + mw / 2, HOR - mh, mx + mw, HOR + 2);
      mx += mw - 15 + (h2 % 20);
    }

    // Front range (darker, more detailed)
    mx = -30;
    while (mx < W + 50) {
      const h2 = ((mx * 53 + 3) * 23) & 0xff;
      const mh = 38 + (h2 % 42);
      const mw = 65 + (h2 % 55);
      // Mountain body
      g.fillStyle(pal.silFar, pal.silFarA);
      g.fillTriangle(mx, HOR + 2, mx + mw / 2, HOR - mh, mx + mw, HOR + 2);
      // Left face shadow
      g.fillStyle(0x000000, 0.15);
      g.fillTriangle(mx + mw / 2, HOR - mh, mx, HOR + 2, mx + mw / 3, HOR + 2);
      // Snow cap
      if (mh > 42) {
        const snowH = Math.round(mh * 0.22);
        g.fillStyle(0xdde8f0, 0.55);
        g.fillTriangle(
          mx + mw / 2, HOR - mh,
          mx + mw / 2 - snowH * 1.2, HOR - mh + snowH * 1.6,
          mx + mw / 2 + snowH * 1.2, HOR - mh + snowH * 1.6,
        );
        // Snow shimmer
        g.fillStyle(0xffffff, 0.25);
        g.fillTriangle(
          mx + mw / 2, HOR - mh,
          mx + mw / 2 - 3, HOR - mh + snowH * 0.8,
          mx + mw / 2 + 2, HOR - mh + snowH * 0.9,
        );
      }
      // Rocky texture lines on face
      g.lineStyle(0.6, pal.silFar, 0.3);
      const numLines = 2 + (h2 % 3);
      for (let l = 0; l < numLines; l++) {
        const lh = ((h2 * (l + 3) * 7) + mx) & 0xff;
        const ly = HOR - mh * (0.25 + l * 0.2);
        g.lineBetween(mx + mw / 4 + (lh % 10), ly, mx + mw * 0.7 - (lh % 8), ly + 4);
      }
      mx += mw - 20 + (h2 % 25);
    }
  }

  /** Ch4 – Palace Beautiful dome and towers */
  private silPalace(g: Phaser.GameObjects.Graphics, W: number, pal: CP): void {
    const HOR = this.horizonY;

    // Distant hills behind palace
    for (let i = 0; i < 5; i++) {
      const h2 = ((i * 67 + 4) * 29) & 0xff;
      const hx = (h2 % W);
      const hh = 14 + (h2 % 18);
      const hw = 90 + (h2 % 60);
      g.fillStyle(pal.silFar, pal.silFarA * 0.45);
      g.fillEllipse(hx + hw / 2, HOR - hh / 2, hw, hh);
    }

    // Tiling palace silhouettes across the width
    let px = -60;
    while (px < W + 80) {
      const h2 = ((px * 41 + 9) * 13) & 0xff;
      const pW = 80 + (h2 % 60);
      const pHMain = 40 + (h2 % 25);

      // Main palace body
      g.fillStyle(pal.silFar, pal.silFarA);
      g.fillRect(px, HOR - pHMain, pW, pHMain + 2);

      // Central dome
      const domeX = px + pW / 2;
      const domeH = 22 + (h2 % 14);
      g.fillStyle(pal.silFar, pal.silFarA);
      g.fillEllipse(domeX, HOR - pHMain - domeH / 2, 36, domeH);
      // Dome lantern
      g.fillStyle(pal.silFar, pal.silFarA);
      g.fillRect(domeX - 2, HOR - pHMain - domeH - 6, 5, 8);
      g.fillStyle(0xffd700, 0.18);
      g.fillCircle(domeX, HOR - pHMain - domeH - 5, 3);

      // Flanking towers
      for (const dx of [-pW * 0.4, pW * 0.4]) {
        const tH = pHMain + 14 + (h2 % 12);
        const tW = 10 + (h2 % 6);
        g.fillStyle(pal.silFar, pal.silFarA);
        g.fillRect(px + pW / 2 + dx - tW / 2, HOR - tH, tW, tH + 2);
        // Tower spire
        g.fillTriangle(
          px + pW / 2 + dx - tW / 2, HOR - tH,
          px + pW / 2 + dx, HOR - tH - 14,
          px + pW / 2 + dx + tW / 2, HOR - tH,
        );
        // Battlement
        for (let b = 0; b < 3; b++) {
          g.fillRect(px + pW / 2 + dx - tW / 2 + b * 4, HOR - tH - 4, 3, 5);
        }
      }

      // Arched windows glow
      for (let w = 0; w < 3; w++) {
        const wX = px + 12 + w * Math.round(pW / 3.5);
        g.fillStyle(0xffd700, 0.12);
        g.fillRect(wX, HOR - pHMain + 8, 7, 12);
        g.fillStyle(0xffd700, 0.06);
        g.fillCircle(wX + 3, HOR - pHMain + 8, 3);
      }

      px += pW + 40 + (h2 % 30);
    }
  }

  /** Ch5 – Interpreter's House warm building exterior */
  private silInterior(g: Phaser.GameObjects.Graphics, W: number, pal: CP): void {
    const HOR = this.horizonY;

    // Tiled warm house facades
    let bx = -30;
    while (bx < W + 40) {
      const h2 = ((bx * 37 + 11) * 19) & 0xff;
      const bW = 55 + (h2 % 45);
      const bH = 32 + (h2 % 22);

      // Building body
      g.fillStyle(pal.silFar, pal.silFarA * 0.88);
      g.fillRect(bx, HOR - bH, bW, bH + 3);

      // Gabled roof
      g.fillStyle(pal.silFar, pal.silFarA);
      g.fillTriangle(bx - 4, HOR - bH, bx + bW / 2, HOR - bH - 16 - (h2 % 10), bx + bW + 4, HOR - bH);

      // Warm glowing windows
      const winCount = 1 + (h2 % 3);
      for (let w = 0; w < winCount; w++) {
        const wX = bx + 8 + w * Math.round(bW / (winCount + 1));
        const wY = HOR - bH + 8;
        // Warm glow halo
        g.fillStyle(0xdd8820, 0.18);
        g.fillCircle(wX + 4, wY + 6, 10);
        // Window frame
        g.fillStyle(0xd4882a, 0.35);
        g.fillRect(wX, wY, 9, 12);
        // Window cross
        g.fillStyle(pal.silFar, 0.6);
        g.fillRect(wX, wY + 5, 9, 1);
        g.fillRect(wX + 4, wY, 1, 12);
      }

      // Chimney
      g.fillStyle(pal.silFar, pal.silFarA);
      const cX = bx + Math.round(bW * 0.7);
      g.fillRect(cX, HOR - bH - 20, 6, 22);
      // Smoke from chimney
      g.fillStyle(0x1a0e06, 0.15);
      g.fillEllipse(cX + 3, HOR - bH - 26, 10, 14);
      g.fillStyle(0x1a0e06, 0.08);
      g.fillEllipse(cX + 5, HOR - bH - 36, 8, 10);

      bx += bW + 16 + (h2 % 20);
    }
  }

  /** Ch6 – Rolling hills with cross silhouette */
  private silValley(g: Phaser.GameObjects.Graphics, W: number, pal: CP): void {
    const HOR = this.horizonY;

    // Rolling hills (sinusoidal profile)
    for (let layer = 0; layer < 2; layer++) {
      const offset = layer * 20;
      const hillAlpha = layer === 0 ? pal.silFarA * 0.6 : pal.silFarA;
      const hillCol   = layer === 0 ? this.lerp3(pal.silFar, 0x0a2010, 0.3) : pal.silFar;

      g.fillStyle(hillCol, hillAlpha);
      // Draw hill profile as a series of trapezoids
      const pts: [number, number][] = [[0, HOR + 4]];
      for (let x = 0; x <= W + 20; x += 4) {
        const h2 = ((x * 7 + layer * 300) * 13) & 0xff;
        const hy = HOR - 10 - offset - (h2 % 22);
        pts.push([x, hy]);
      }
      pts.push([W + 20, HOR + 4]);
      // Fill as polygon approximation via triangles
      for (let i = 1; i < pts.length - 1; i++) {
        g.fillTriangle(pts[i][0], pts[i][1], pts[i + 1]?.[0] ?? W, pts[i + 1]?.[1] ?? HOR, pts[i][0], HOR + 4);
      }
    }

    // Cross silhouette on hilltop (centered at ~60% of draw width)
    const crossX = Math.round(W * 0.62);
    const crossHillY = HOR - 32;
    // Hill mound under cross
    g.fillStyle(pal.silFar, pal.silFarA);
    g.fillEllipse(crossX, crossHillY + 12, 60, 20);
    // Cross post
    g.fillStyle(pal.silFar, pal.silFarA);
    g.fillRect(crossX - 2, crossHillY - 22, 5, 26);
    // Cross bar
    g.fillRect(crossX - 14, crossHillY - 16, 30, 5);
    // Subtle glow behind cross
    g.fillStyle(0xffffff, 0.06);
    g.fillEllipse(crossX, crossHillY - 10, 50, 36);

    // Tree line along ridge
    for (let t = 0; t < Math.round(W / 20); t++) {
      const h2 = ((t * 29 + 6) * 11) & 0xff;
      const tx2 = t * 20 + (h2 % 18);
      const ty  = HOR - 15 - (h2 % 12);
      const th  = 10 + (h2 % 12);
      const tw2 = 6 + (h2 % 8);
      g.fillStyle(pal.silFar, pal.silFarA * 0.85);
      g.fillEllipse(tx2, ty - th / 2, tw2, th);
      g.fillRect(tx2 - 1, ty, 2, 6);
    }
  }

  /** Ch7 – Dark canyon walls far silhouette */
  private silCanyonFar(g: Phaser.GameObjects.Graphics, W: number, pal: CP): void {
    const HOR = this.horizonY;

    // Top and bottom cliff bands
    g.fillStyle(pal.silFar, pal.silFarA * 0.85);
    g.fillRect(0, 0, W, Math.round(HOR * 0.28));

    // Jagged lower cliff edge
    let cx = 0;
    while (cx < W + 20) {
      const h2 = ((cx * 23 + 7) * 17) & 0xff;
      const cw2 = 16 + (h2 % 24);
      const ch  = 8  + (h2 % 18);
      g.fillStyle(pal.silFar, pal.silFarA);
      g.fillTriangle(cx, Math.round(HOR * 0.28), cx + cw2 / 2, Math.round(HOR * 0.28) + ch, cx + cw2, Math.round(HOR * 0.28));
      cx += cw2 - 4 + (h2 % 12);
    }

    // Distant cliff face
    g.fillStyle(pal.silFar, pal.silFarA * 0.70);
    for (let i = 0; i < 8; i++) {
      const h2 = ((i * 53 + 7) * 31) & 0xff;
      const fx2 = (h2 % W);
      const fh  = 22 + (h2 % 30);
      const fw  = 30 + (h2 % 40);
      g.fillTriangle(fx2, HOR, fx2 + fw / 2, HOR - fh, fx2 + fw, HOR);
    }
  }

  /** Ch8 – Volcanic spires with lava glow */
  private silVolcanic(g: Phaser.GameObjects.Graphics, W: number, pal: CP): void {
    const HOR = this.horizonY;

    // Lava horizon glow
    g.fillStyle(0xff2200, 0.20);
    g.fillRect(0, HOR - 6, W, 12);
    g.fillStyle(0xff6600, 0.10);
    g.fillRect(0, HOR - 12, W, 8);

    // Volcanic spires
    let vx = -20;
    while (vx < W + 30) {
      const h2 = ((vx * 41 + 8) * 23) & 0xff;
      const vh = 35 + (h2 % 50);
      const vw = 8  + (h2 % 16);
      // Spire body
      g.fillStyle(pal.silFar, pal.silFarA);
      g.fillTriangle(vx, HOR + 2, vx + vw / 2, HOR - vh, vx + vw, HOR + 2);
      // Jagged edge on right
      if ((h2 % 3) === 0) {
        g.fillStyle(0x000000, 0.4);
        g.fillTriangle(vx + vw * 0.6, HOR - vh * 0.6, vx + vw * 0.9, HOR - vh * 0.3, vx + vw * 0.75, HOR - vh * 0.4);
      }
      // Lava crack glow on base
      g.fillStyle(0xff3300, 0.12);
      g.fillRect(vx, HOR, vw, 5);

      vx += vw + 4 + (h2 % 20);
    }

    // Ash cloud backdrop
    for (let ac = 0; ac < 6; ac++) {
      const h2 = ((ac * 67 + 8) * 13) & 0xff;
      const acX = (h2 % W);
      const acY = (h2 % Math.round(HOR * 0.5));
      g.fillStyle(0x1a0404, 0.20);
      g.fillEllipse(acX, acY, 40 + (h2 % 30), 16 + (h2 % 14));
    }
  }

  /** Ch9 – Near-total darkness with subtle cliff edges */
  private silShadow(g: Phaser.GameObjects.Graphics, W: number, pal: CP): void {
    const HOR = this.horizonY;

    // Ceiling of darkness
    g.fillStyle(pal.silFar, 0.97);
    g.fillRect(0, 0, W, Math.round(HOR * 0.22));

    // Jagged ceiling drips
    let jx = 0;
    while (jx < W + 10) {
      const h2 = ((jx * 19 + 9) * 13) & 0xff;
      const jw2 = 10 + (h2 % 18);
      const jh2 = 6  + (h2 % 16);
      g.fillStyle(pal.silFar, pal.silFarA);
      g.fillTriangle(jx, Math.round(HOR * 0.22), jx + jw2 / 2, Math.round(HOR * 0.22) + jh2, jx + jw2, Math.round(HOR * 0.22));
      jx += jw2 - 2 + (h2 % 8);
    }

    // Distant faint red eyes (2-3 pairs barely visible)
    const eyePairs = [[W * 0.3, HOR * 0.5], [W * 0.65, HOR * 0.4], [W * 0.15, HOR * 0.6]];
    for (const [ex2, ey2] of eyePairs) {
      g.fillStyle(0x880022, 0.14);
      g.fillCircle(ex2 - 3, ey2, 2);
      g.fillCircle(ex2 + 3, ey2, 2);
      g.fillStyle(0xcc0033, 0.07);
      g.fillCircle(ex2 - 3, ey2, 5);
      g.fillCircle(ex2 + 3, ey2, 5);
    }
  }

  /** Ch10 – Vanity Fair market town skyline with banners */
  private silMarket(g: Phaser.GameObjects.Graphics, W: number, pal: CP): void {
    const HOR = this.horizonY;
    const bannerColors = [0xcc2244, 0x2244cc, 0xcc8822, 0x22aa44, 0x8822cc, 0xcc4488];

    // Building cluster silhouettes
    let bx = -20;
    while (bx < W + 30) {
      const h2 = ((bx * 37 + 10) * 17) & 0xff;
      const bW2 = 22 + (h2 % 30);
      const bH2 = 20 + (h2 % 28);

      // Building body
      g.fillStyle(pal.silFar, pal.silFarA);
      g.fillRect(bx, HOR - bH2, bW2, bH2 + 2);

      // Flat or gabled roof variety
      if ((h2 % 3) === 0) {
        g.fillTriangle(bx - 2, HOR - bH2, bx + bW2 / 2, HOR - bH2 - 10, bx + bW2 + 2, HOR - bH2);
      }

      // Banner pole and flag
      const flagX = bx + Math.round(bW2 * 0.75);
      g.fillStyle(pal.silFar, pal.silFarA);
      g.fillRect(flagX - 1, HOR - bH2 - 14, 2, 16);
      g.fillStyle(bannerColors[h2 % bannerColors.length], 0.55);
      g.fillTriangle(flagX + 1, HOR - bH2 - 14, flagX + 12, HOR - bH2 - 10, flagX + 1, HOR - bH2 - 6);

      // Window lights (colored market lanterns)
      for (let w = 0; w < 2; w++) {
        const wX = bx + 3 + w * Math.round(bW2 / 2.5);
        g.fillStyle(bannerColors[(h2 + w) % bannerColors.length], 0.22);
        g.fillRect(wX, HOR - bH2 + 5, 5, 7);
        g.fillStyle(bannerColors[(h2 + w) % bannerColors.length], 0.10);
        g.fillCircle(wX + 2, HOR - bH2 + 8, 6);
      }

      bx += bW2 + 3 + (h2 % 10);
    }
  }

  /** Ch11 – Doubting Castle fortress silhouette */
  private silCastle(g: Phaser.GameObjects.Graphics, W: number, pal: CP): void {
    const HOR = this.horizonY;

    // Tiling castle silhouettes
    let cx = -40;
    while (cx < W + 50) {
      const h2 = ((cx * 43 + 11) * 19) & 0xff;
      const cW2 = 90 + (h2 % 60);
      const cH  = 40 + (h2 % 30);

      // Main keep
      g.fillStyle(pal.silFar, pal.silFarA);
      g.fillRect(cx, HOR - cH, cW2, cH + 3);

      // Battlements on keep
      for (let b = 0; b < Math.floor(cW2 / 8); b++) {
        if (b % 2 === 0) {
          g.fillRect(cx + b * 8, HOR - cH - 6, 7, 6);
        }
      }

      // Flanking towers (taller)
      for (const dx of [0, cW2 - 14]) {
        const tH = cH + 16 + (h2 % 14);
        g.fillStyle(pal.silFar, pal.silFarA);
        g.fillRect(cx + dx, HOR - tH, 14, tH + 3);
        // Tower battlements
        for (let b = 0; b < 3; b++) {
          if (b % 2 === 0) g.fillRect(cx + dx + b * 5, HOR - tH - 5, 4, 5);
        }
        // Arrow slit windows
        for (let w = 0; w < 3; w++) {
          g.fillStyle(0x000000, 0.6);
          g.fillRect(cx + dx + 4, HOR - tH + 8 + w * 10, 3, 7);
        }
      }

      // Portcullis opening
      g.fillStyle(0x000000, 0.8);
      g.fillRect(cx + cW2 / 2 - 7, HOR - 18, 14, 18);
      g.fillStyle(0x000000, 0.6);
      g.fillCircle(cx + cW2 / 2, HOR - 18, 7);

      cx += cW2 + 20 + (h2 % 30);
    }
  }

  /** Ch12 – Celestial City golden spires */
  private silCelestial(g: Phaser.GameObjects.Graphics, W: number, pal: CP): void {
    const HOR = this.horizonY;

    // Heavenly wall base
    g.fillStyle(pal.silFar, pal.silFarA * 0.55);
    g.fillRect(0, HOR - 12, W, 14);
    // Wall shimmer
    g.fillStyle(0xffffff, 0.08);
    g.fillRect(0, HOR - 14, W, 2);

    // Spires tiling across width
    let sx = -30;
    while (sx < W + 40) {
      const h2 = ((sx * 37 + 12) * 23) & 0xff;
      const sW2 = 10 + (h2 % 14);
      const sH  = 35 + (h2 % 55);

      // Spire body (bright light silhouette)
      g.fillStyle(pal.silFar, pal.silFarA);
      g.fillRect(sx, HOR - sH, sW2, sH + 2);
      // Pointed spire tip
      g.fillTriangle(sx - 2, HOR - sH, sx + sW2 / 2, HOR - sH - 20, sx + sW2 + 2, HOR - sH);

      // Golden glow aura
      g.fillStyle(0xffd700, 0.08);
      g.fillEllipse(sx + sW2 / 2, HOR - sH - 10, sW2 * 2.5, sH * 0.6);
      // Star/orb at spire tip
      g.fillStyle(0xffffff, 0.55);
      g.fillCircle(sx + sW2 / 2, HOR - sH - 18, 2);
      g.fillStyle(0xffd700, 0.30);
      g.fillCircle(sx + sW2 / 2, HOR - sH - 18, 5);

      // Window arches glowing
      for (let w = 0; w < 2; w++) {
        const wY = HOR - sH + 10 + w * 14;
        g.fillStyle(0xffd700, 0.20);
        g.fillRect(sx + 2, wY, sW2 - 4, 8);
        g.fillStyle(0xffffff, 0.12);
        g.fillCircle(sx + sW2 / 2, wY, 4);
      }

      sx += sW2 + 8 + (h2 % 20);
    }

    // God-ray columns
    for (let r = 0; r < 6; r++) {
      const rx2 = (r + 1) * Math.round(W / 7);
      g.fillStyle(0xffd700, 0.04);
      g.fillTriangle(rx2 - 8, HOR + 4, rx2, HOR - this.horizonY, rx2 + 8, HOR + 4);
    }
  }

  /** Generic fallback mountains */
  private silGenericMountains(g: Phaser.GameObjects.Graphics, W: number, pal: CP): void {
    const HOR = this.horizonY;
    for (let x = -40; x < W + 60; x += 36) {
      const h2 = ((x * 31 + 7) * 17) & 0xff;
      const mh = 20 + (h2 % 28);
      const mw = 55 + (h2 % 35);
      g.fillStyle(pal.silFar, pal.silFarA);
      g.fillTriangle(x, HOR + 2, x + mw / 2, HOR - mh, x + mw, HOR + 2);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MID SILHOUETTE CHAPTERS
  // ─────────────────────────────────────────────────────────────────────────

  /** Fills a solid ground-colour strip at the horizon base for every mid layer.
   *  This anchors the silhouette visually to the tile surface below it. */
  private fillMidBase(g: Phaser.GameObjects.Graphics, W: number, pal: CP): void {
    const HOR = this.horizonY;
    g.fillStyle(pal.silMid, 1.0);
    g.fillRect(0, HOR - 2, W, 6); // 2px above → 4px below horizon
    // slight transparent gradient below to blend into tile layer
    for (let i = 0; i < 4; i++) {
      g.fillStyle(pal.silMid, 0.55 - i * 0.12);
      g.fillRect(0, HOR + 4 + i * 3, W, 3);
    }
  }

  private midCityRuins(g: Phaser.GameObjects.Graphics, W: number, pal: CP): void {
    this.fillMidBase(g, W, pal);
    const HOR = this.horizonY;
    let rx = -10;
    while (rx < W + 20) {
      const h2 = ((rx * 29 + 7) * 11) & 0xff;
      const rw = 12 + (h2 % 20);
      const rh = 12 + (h2 % 22);
      // Rubble wall
      g.fillStyle(pal.silMid, pal.silMidA);
      g.fillRect(rx, HOR - rh, rw, rh + 4);
      // Broken top
      if ((h2 % 3) === 0) {
        g.fillStyle(0x000000, 0.4);
        g.fillTriangle(rx + rw - 5, HOR - rh, rx + rw, HOR - rh + 6, rx + rw + 3, HOR - rh - 3);
      }
      // Ember glow
      if ((h2 % 4) === 0) {
        g.fillStyle(0xff3300, 0.08);
        g.fillCircle(rx + rw / 2, HOR - rh - 6, 8);
      }
      rx += rw + 5 + (h2 % 18);
    }
  }

  private midSwampTrees(g: Phaser.GameObjects.Graphics, W: number, pal: CP): void {
    this.fillMidBase(g, W, pal);
    const HOR = this.horizonY;
    for (let i = 0; i < Math.round(W / 28); i++) {
      const h2 = ((i * 43 + 2) * 17) & 0xff;
      const tx2 = i * 28 + (h2 % 22);
      const th  = 22 + (h2 % 20);
      const tw2 = 2 + (h2 % 3);
      g.fillStyle(pal.silMid, pal.silMidA * 0.90);
      g.fillRect(tx2 - 1, HOR - th, tw2 + 1, th + 3);
      // Root splays
      g.fillStyle(pal.silMid, pal.silMidA * 0.6);
      g.fillTriangle(tx2 - 5, HOR + 2, tx2, HOR - 6, tx2 + tw2 + 5, HOR + 2);
      // Moss clumps
      for (let m = 0; m < 3; m++) {
        const mh = ((h2 * (m + 3) * 7) + i) & 0xff;
        g.fillStyle(0x1a3020, 0.25);
        g.fillEllipse(tx2 + (mh % 12) - 6, HOR - th * 0.4 + (mh % 10) - 5, 8, 5);
      }
    }
  }

  private midRockyCliff(g: Phaser.GameObjects.Graphics, W: number, pal: CP): void {
    this.fillMidBase(g, W, pal);
    const HOR = this.horizonY;
    // Cliff face
    g.fillStyle(pal.silMid, pal.silMidA);
    g.fillRect(0, HOR - 20, W, 22);
    // Jagged cliff top
    for (let x = 0; x < W + 12; x += 12) {
      const h2 = ((x * 19 + 3) * 7) & 0xff;
      g.fillStyle(pal.silMid, pal.silMidA);
      g.fillTriangle(x, HOR - 20, x + 6, HOR - 20 - 8 - (h2 % 16), x + 12, HOR - 20);
    }
    // Boulder scatter
    for (let i = 0; i < Math.round(W / 40); i++) {
      const h2 = ((i * 53 + 3) * 11) & 0xff;
      const bx = i * 40 + (h2 % 34);
      const br = 4 + (h2 % 8);
      g.fillStyle(pal.silMid, pal.silMidA * 0.9);
      g.fillEllipse(bx, HOR - br * 0.4, br * 2.4, br * 1.2);
      g.fillStyle(0x000000, 0.15);
      g.fillEllipse(bx + 2, HOR - br * 0.3 + 1, br * 2.2, br * 0.8);
    }
  }

  private midPalaceGarden(g: Phaser.GameObjects.Graphics, W: number, pal: CP): void {
    this.fillMidBase(g, W, pal);
    const HOR = this.horizonY;
    // Hedge row
    for (let i = 0; i < Math.round(W / 22); i++) {
      const h2 = ((i * 31 + 4) * 13) & 0xff;
      const hx = i * 22 + (h2 % 14);
      const hh = 14 + (h2 % 12);
      const hw = 18 + (h2 % 8);
      g.fillStyle(pal.silMid, pal.silMidA * 0.85);
      g.fillEllipse(hx, HOR - hh / 2, hw, hh);
      // Trim top flat
      g.fillStyle(pal.silMid, pal.silMidA);
      g.fillRect(hx - hw / 2, HOR - hh, hw, 4);
    }
    // Rose arch accents
    for (let arch = 0; arch < 4; arch++) {
      const ax = Math.round(W * (0.15 + arch * 0.22));
      g.fillStyle(pal.silMid, pal.silMidA * 0.7);
      g.fillRect(ax - 1, HOR - 22, 3, 22);
      g.fillRect(ax + 18, HOR - 22, 3, 22);
      g.fillStyle(pal.silMid, pal.silMidA * 0.6);
      g.fillEllipse(ax + 10, HOR - 22, 22, 16);
    }
  }

  private midInteriorWarm(g: Phaser.GameObjects.Graphics, W: number, pal: CP): void {
    this.fillMidBase(g, W, pal);
    const HOR = this.horizonY;
    // Bookshelf silhouette band
    g.fillStyle(pal.silMid, pal.silMidA * 0.80);
    g.fillRect(0, HOR - 22, W, 24);
    // Book spines
    let bx = 4;
    while (bx < W - 4) {
      const h2 = ((bx * 17 + 5) * 7) & 0xff;
      const bw = 4 + (h2 % 6);
      const bh = 10 + (h2 % 10);
      g.fillStyle(pal.silMid, pal.silMidA);
      g.fillRect(bx, HOR - 4 - bh, bw, bh);
      bx += bw + 1;
    }
    // Warm ground glow (hearth)
    g.fillStyle(0xcc6600, 0.10);
    g.fillRect(0, HOR - 4, W, 6);
  }

  private midMeadow(g: Phaser.GameObjects.Graphics, W: number, pal: CP): void {
    this.fillMidBase(g, W, pal);
    const HOR = this.horizonY;
    // Undulating meadow edge
    g.fillStyle(pal.silMid, pal.silMidA * 0.85);
    for (let x = 0; x < W + 6; x += 6) {
      const h2 = ((x * 13 + 6) * 7) & 0xff;
      const gy = HOR - 4 - (h2 % 10);
      g.fillRect(x, gy, 6, HOR - gy + 4);
    }
    // Tall grass blades
    for (let i = 0; i < Math.round(W / 6); i++) {
      const h2 = ((i * 23 + 6) * 11) & 0xff;
      const gx = i * 6 + (h2 % 5);
      const gh = 8 + (h2 % 14);
      g.fillStyle(pal.silMid, pal.silMidA * 0.9);
      g.fillRect(gx, HOR - gh, 1, gh);
      // Flower heads
      if ((h2 % 4) === 0) {
        g.fillStyle(0xffffff, 0.55);
        g.fillCircle(gx, HOR - gh - 1, 1.5);
      } else if ((h2 % 4) === 1) {
        g.fillStyle(0xffd700, 0.50);
        g.fillCircle(gx, HOR - gh - 1, 1.5);
      }
    }
  }

  private midDarkRocks(g: Phaser.GameObjects.Graphics, W: number, pal: CP): void {
    this.fillMidBase(g, W, pal);
    const HOR = this.horizonY;
    g.fillStyle(pal.silMid, pal.silMidA * 0.85);
    g.fillRect(0, HOR - 14, W, 16);
    for (let i = 0; i < Math.round(W / 30); i++) {
      const h2 = ((i * 37 + 7) * 13) & 0xff;
      const rx2 = i * 30 + (h2 % 26);
      const rr  = 6 + (h2 % 10);
      g.fillStyle(pal.silMid, pal.silMidA);
      g.fillEllipse(rx2, HOR - rr * 0.5, rr * 2.8, rr * 1.3);
    }
  }

  private midLavaField(g: Phaser.GameObjects.Graphics, W: number, pal: CP): void {
    this.fillMidBase(g, W, pal);
    const HOR = this.horizonY;
    g.fillStyle(pal.silMid, pal.silMidA);
    g.fillRect(0, HOR - 10, W, 12);
    // Lava cracks with glow
    for (let i = 0; i < Math.round(W / 50); i++) {
      const h2 = ((i * 47 + 8) * 11) & 0xff;
      const lx2 = i * 50 + (h2 % 40);
      g.fillStyle(0xff2200, 0.22);
      g.fillRect(lx2, HOR - 8, 20 + (h2 % 20), 3);
      g.fillStyle(0xff6600, 0.12);
      g.fillRect(lx2, HOR - 10, 20 + (h2 % 20), 6);
    }
    // Rock pillars
    for (let i = 0; i < Math.round(W / 60); i++) {
      const h2 = ((i * 53 + 8) * 17) & 0xff;
      const px = i * 60 + (h2 % 50);
      const ph = 18 + (h2 % 20);
      const pw = 8 + (h2 % 8);
      g.fillStyle(pal.silMid, pal.silMidA);
      g.fillRect(px, HOR - ph, pw, ph);
      // Lava base glow
      g.fillStyle(0xff3300, 0.15);
      g.fillRect(px - 2, HOR - 6, pw + 4, 8);
    }
  }

  private midShadowCliffs(g: Phaser.GameObjects.Graphics, W: number, pal: CP): void {
    this.fillMidBase(g, W, pal);
    const HOR = this.horizonY;
    // Near-invisible cliff edge
    g.fillStyle(pal.silMid, pal.silMidA);
    g.fillRect(0, HOR - 8, W, 10);
    // Skull hints on ground
    for (let i = 0; i < 5; i++) {
      const h2 = ((i * 59 + 9) * 13) & 0xff;
      const sx2 = (h2 % W);
      g.fillStyle(0x1a0a18, 0.30);
      g.fillCircle(sx2, HOR - 4, 4);
      g.fillStyle(0x000000, 0.40);
      g.fillCircle(sx2 - 1, HOR - 5, 1);
      g.fillCircle(sx2 + 1, HOR - 5, 1);
    }
  }

  private midMarketStalls(g: Phaser.GameObjects.Graphics, W: number, pal: CP): void {
    this.fillMidBase(g, W, pal);
    const HOR = this.horizonY;
    const awningCols = [0xaa1133, 0x1133aa, 0xaa7711, 0x117733, 0x661188];
    let sx = -15;
    while (sx < W + 20) {
      const h2 = ((sx * 29 + 10) * 13) & 0xff;
      const sw = 30 + (h2 % 20);
      // Frame posts
      g.fillStyle(pal.silMid, pal.silMidA);
      g.fillRect(sx - 1, HOR - 26, 3, 28);
      g.fillRect(sx + sw - 2, HOR - 26, 3, 28);
      // Awning
      g.fillStyle(awningCols[h2 % awningCols.length], 0.60);
      g.fillRect(sx - 3, HOR - 28, sw + 4, 8);
      // Awning stripe highlights
      g.fillStyle(0xffffff, 0.12);
      g.fillRect(sx - 3, HOR - 28, sw + 4, 2);
      // Hanging goods (colored rectangles)
      for (let item = 0; item < 3; item++) {
        const ih = ((h2 * (item + 3) * 7) + sx) & 0xff;
        g.fillStyle(awningCols[(ih) % awningCols.length], 0.45);
        g.fillRect(sx + 3 + item * Math.round(sw / 3.5), HOR - 20, 6, 9);
      }
      sx += sw + 8 + (h2 % 16);
    }
  }

  private midCastleWalls(g: Phaser.GameObjects.Graphics, W: number, pal: CP): void {
    this.fillMidBase(g, W, pal);
    const HOR = this.horizonY;
    // Wall base
    g.fillStyle(pal.silMid, pal.silMidA);
    g.fillRect(0, HOR - 16, W, 18);
    // Wall top crenellations
    for (let i = 0; i < Math.round(W / 10); i++) {
      if (i % 2 === 0) {
        g.fillStyle(pal.silMid, pal.silMidA);
        g.fillRect(i * 10, HOR - 22, 8, 6);
      }
    }
    // Iron grates in wall
    for (let i = 0; i < Math.round(W / 70); i++) {
      const h2 = ((i * 53 + 11) * 7) & 0xff;
      const gx2 = i * 70 + (h2 % 55);
      g.fillStyle(0x000000, 0.55);
      g.fillRect(gx2, HOR - 15, 14, 15);
      // Bar lines
      g.lineStyle(1, 0x2a3050, 0.5);
      for (let b = 0; b < 4; b++) {
        g.lineBetween(gx2 + b * 4, HOR - 15, gx2 + b * 4, HOR);
      }
    }
  }

  private midHeavenlyRoad(g: Phaser.GameObjects.Graphics, W: number, pal: CP): void {
    this.fillMidBase(g, W, pal);
    const HOR = this.horizonY;
    // Golden road surface
    g.fillStyle(0xd4a830, 0.22);
    g.fillRect(0, HOR - 8, W, 10);
    g.fillStyle(0xffd700, 0.10);
    g.fillRect(0, HOR - 10, W, 2);
    // Pearl wall base
    g.fillStyle(pal.silMid, pal.silMidA * 0.65);
    g.fillRect(0, HOR - 20, W, 12);
    // Wall shimmer
    g.fillStyle(0xffffff, 0.12);
    g.fillRect(0, HOR - 21, W, 2);
    // Angel/figure hints flanking road
    for (let i = 0; i < Math.round(W / 55); i++) {
      const h2 = ((i * 41 + 12) * 7) & 0xff;
      const ax2 = i * 55 + (h2 % 44);
      g.fillStyle(pal.silMid, pal.silMidA * 0.55);
      // Body
      g.fillEllipse(ax2, HOR - 14, 7, 16);
      // Head halo
      g.fillStyle(0xffd700, 0.18);
      g.fillCircle(ax2, HOR - 22, 5);
      // Wing hints
      g.fillStyle(pal.silMid, pal.silMidA * 0.30);
      g.fillEllipse(ax2 - 6, HOR - 16, 10, 5);
      g.fillEllipse(ax2 + 6, HOR - 16, 10, 5);
    }
  }

  private midGenericHills(g: Phaser.GameObjects.Graphics, W: number, pal: CP): void {
    this.fillMidBase(g, W, pal);
    const HOR = this.horizonY;
    for (let x = -40; x < W + 50; x += 45) {
      const h2 = ((x * 53 + 3) * 23) & 0xff;
      const mh = 22 + (h2 % 18);
      const mw = 65 + (h2 % 40);
      g.fillStyle(pal.silMid, pal.silMidA);
      g.fillTriangle(x, HOR + 2, x + mw / 2, HOR - mh, x + mw, HOR + 2);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Horizon blend — covers the seam between fixed sky backdrop and scrolling
  // ground tiles. A downward gradient from groundA → transparent softens the
  // hard edge that would otherwise be visible when the camera scrolls.
  // ─────────────────────────────────────────────────────────────────────────

  private buildHorizonBlend(pal: CP): void {
    const W = GAME_WIDTH, HOR = this.horizonY;
    const gfx = this.scene.add.graphics().setDepth(0.64).setScrollFactor(0, 0);

    // Draw a downward gradient band starting at the horizon.
    // It starts at groundA (solid) and fades to transparent over ~30px,
    // visually "grounding" the silhouette base onto the tile surface.
    const BLEND_H = 32;
    const STEPS   = 12;
    const r = (pal.groundA >> 16) & 0xff;
    const g = (pal.groundA >>  8) & 0xff;
    const b =  pal.groundA        & 0xff;

    for (let i = 0; i < STEPS; i++) {
      const t   = i / STEPS;
      const a   = 0.82 * (1 - t * t); // ease-out alpha falloff
      const col = (r << 16) | (g << 8) | b;
      gfx.fillStyle(col, a);
      const y0 = Math.floor(HOR + t       * BLEND_H);
      const y1 = Math.floor(HOR + (t + 1 / STEPS) * BLEND_H) + 1;
      gfx.fillRect(0, y0, W, y1 - y0);
    }

    // Also paint a thin solid strip AT the horizon to hide the transition edge
    gfx.fillStyle(pal.groundA, 0.90);
    gfx.fillRect(0, HOR - 1, W, 3);

    this.layers.push(gfx);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Fog + atmosphere
  // ─────────────────────────────────────────────────────────────────────────

  private buildFog(pal: CP): void {
    const W = GAME_WIDTH, HOR = this.horizonY;
    const gfx = this.scene.add.graphics().setDepth(0.66).setScrollFactor(0);

    // Mist bands at and just above horizon
    for (let i = 0; i < 6; i++) {
      const y = HOR - 2 + i * 7;
      const a = pal.fogAlpha * (1 - i / 6) * 1.4;
      gfx.fillStyle(pal.fogColor, Math.min(1, a));
      gfx.fillRect(0, y, W, 7);
    }
    // Wispy fog puffs
    for (let i = 0; i < 5; i++) {
      const h2 = ((i * 83 + this.chapter * 7) * 17) & 0xffff;
      const fx = (h2 % W);
      const fy = HOR - 5 - (h2 % 18);
      gfx.fillStyle(pal.fogColor, pal.fogAlpha * 0.7);
      gfx.fillEllipse(fx, fy, 60 + (h2 % 50), 10 + (h2 % 10));
    }
    this.layers.push(gfx);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Atmosphere particles (animated, redrawn each frame via animGfx)
  // ─────────────────────────────────────────────────────────────────────────

  private seedAtmosphere(pal: CP): void {
    if (pal.atm === 'none' || pal.atm === 'dark') return;
    const count = pal.atm === 'smoke' ? 18 : pal.atm === 'embers' ? 22 : 14;
    for (let i = 0; i < count; i++) {
      this.spawnAmbientParticle(pal, i);
    }
  }

  private spawnAmbientParticle(pal: CP, idx: number): void {
    const h2 = ((idx * 137 + this.chapter * 31) * 17 + idx * 53) & 0xffff;
    const col = pal.atm === 'embers' ? (h2 % 2 === 0 ? 0xff4400 : 0xff8800)
              : pal.atm === 'holy'   ? (h2 % 2 === 0 ? 0xffd700 : 0xffffff)
              : pal.atm === 'market' ? [0xff4488, 0xffaa22, 0x44ccff][idx % 3]
              : pal.cloudColor;
    const upward = pal.atm !== 'smoke' && pal.atm !== 'embers';
    this.atmParticles[idx] = {
      x:    (h2 % GAME_WIDTH),
      y:    upward ? GAME_HEIGHT * 0.85 : (h2 % Math.round(this.horizonY * 0.9)),
      vx:   ((h2 % 20) - 10) * 0.03,
      vy:   upward ? -(0.3 + (h2 % 8) * 0.05) : (0.2 + (h2 % 6) * 0.04),
      life: 0.3 + (h2 % 7) * 0.1,
      size: 0.8 + (h2 % 3) * 0.5,
      color: col,
    };
  }

  private updateAtmParticles(pal: CP): void {
    for (let i = 0; i < this.atmParticles.length; i++) {
      const p = this.atmParticles[i];
      if (!p) continue;
      p.x   += p.vx;
      p.y   += p.vy;
      p.life -= 0.003;
      if (p.life <= 0 || p.y < -4 || p.y > GAME_HEIGHT + 4) {
        this.spawnAmbientParticle(pal, i);
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────

  /** Linear interpolation between two 24-bit hex colours */
  private lerp3(a: number, b: number, t: number): number {
    const tc = Math.max(0, Math.min(1, t));
    const ar = (a >> 16) & 0xff, ag = (a >> 8) & 0xff, ab2 = a & 0xff;
    const br = (b >> 16) & 0xff, bg2 = (b >> 8) & 0xff, bb  = b & 0xff;
    return (Math.round(ar + (br - ar) * tc) << 16)
         | (Math.round(ag + (bg2 - ag) * tc) << 8)
         |  Math.round(ab2 + (bb - ab2) * tc);
  }
}
