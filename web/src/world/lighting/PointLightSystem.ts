import Phaser from 'phaser';
import type { ChapterConfig } from '../ChapterData';
import { LAYER } from '../LayerRegistry';

/**
 * Per-chapter torch / point-light pass. Renders into a single `Graphics` layer
 * with `ADD` blend so overlapping warm glows accumulate naturally. Indoor /
 * night chapters draw a darkness base on the same layer first (NORMAL blend)
 * before flipping to ADD for the lights.
 *
 * Extracted from the WIP `drawTorchLights` in `TileMapManager.ts`. Any
 * `WorldRenderer` can invoke `render(config)` after laying down ground/decor.
 */
export class PointLightSystem {
  private scene: Phaser.Scene;
  private layer: Phaser.GameObjects.Graphics | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  render(config: ChapterConfig): void {
    this.destroy();
    this.layer = this.scene.add.graphics().setDepth(LAYER.LIGHTING);
    this.layer.setBlendMode(Phaser.BlendModes.ADD);

    const g = this.layer;
    const ch = config.chapter;
    const W = config.mapWidth;
    const H = config.mapHeight;

    const pointLight = (lx: number, ly: number, r: number, color: number, intensity = 0.55) => {
      const steps = 10;
      for (let i = steps; i >= 1; i--) {
        const t = i / steps;
        const alpha = intensity * t * t * 0.38;
        g.fillStyle(color, Math.min(alpha, 0.6));
        g.fillCircle(lx, ly, r * t);
      }
    };

    const darkChapters = [4, 7, 8, 9, 11];
    if (darkChapters.includes(ch)) {
      g.setBlendMode(Phaser.BlendModes.NORMAL);
      g.fillStyle(0x000000, 0.72);
      g.fillRect(0, 0, W, H);
      g.setBlendMode(Phaser.BlendModes.ADD);
    }

    switch (ch) {
      case 1: {
        const fireX = [420, 760, 1060, 1360, 1680, 2020];
        for (const fx of fireX) {
          pointLight(fx, H * 0.35 + (fx % 60) - 30, 55, 0xff4400, 0.6);
          pointLight(fx, H * 0.35 + (fx % 60) - 30, 20, 0xff8800, 0.7);
        }
        pointLight(280, H / 2 - 20, 70, 0xffd700, 0.5);
        break;
      }
      case 2: {
        for (let i = 0; i < 8; i++) {
          const h = (i * 113) & 0xff;
          pointLight(60 + (h % (W - 120)), 40 + ((h * 5) & 0xff) % (H - 80), 28, 0x44ffaa, 0.30);
        }
        pointLight(360, H / 2 - 22, 45, 0xffd700, 0.45);
        break;
      }
      case 3: {
        pointLight(200, H / 2 - 8, 40, 0xffcc44, 0.35);
        break;
      }
      case 4: {
        pointLight(W / 2, H * 0.15, 120, 0xffcc44, 0.65);
        pointLight(W / 2, H * 0.15, 50, 0xfff0a0, 0.70);
        for (let sx = 80; sx < W; sx += 80) {
          pointLight(sx, H * 0.20, 50, 0xff9900, 0.55);
          pointLight(sx, H * 0.20, 18, 0xffcc44, 0.65);
          pointLight(sx, H * 0.75, 50, 0xff9900, 0.55);
          pointLight(sx, H * 0.75, 18, 0xffcc44, 0.65);
        }
        break;
      }
      case 5: {
        pointLight(W / 2, H * 0.35, 80, 0xff8800, 0.60);
        pointLight(W / 2, H * 0.35, 30, 0xffcc44, 0.70);
        break;
      }
      case 6: {
        pointLight(W / 2, H * 0.15, 150, 0xffffff, 0.45);
        pointLight(W / 2, H * 0.15, 60, 0xffffd0, 0.55);
        pointLight(W / 2, H * 0.15, 22, 0xffffff, 0.65);
        pointLight(W / 2 - 30, H * 0.25, 40, 0xffffff, 0.22);
        pointLight(W / 2 + 30, H * 0.28, 35, 0xffffff, 0.20);
        break;
      }
      case 7: {
        pointLight(W / 2, H * 0.12, 130, 0xffcc44, 0.60);
        pointLight(W / 2, H * 0.12, 50, 0xfff0a0, 0.68);
        for (let sx = 70; sx < W; sx += 90) {
          pointLight(sx, H * 0.22, 55, 0xffaa33, 0.52);
          pointLight(sx, H * 0.22, 20, 0xffdd66, 0.62);
          pointLight(sx, H * 0.72, 55, 0xffaa33, 0.52);
          pointLight(sx, H * 0.72, 20, 0xffdd66, 0.62);
        }
        break;
      }
      case 8: {
        const lavaX = [200, 500, 800];
        for (const lx of lavaX) {
          pointLight(lx, H - 30, 60, 0xff3300, 0.65);
          pointLight(lx, H - 30, 22, 0xff8800, 0.72);
        }
        pointLight(W / 2, H / 2, 100, 0x330011, 0.40);
        break;
      }
      case 9: {
        const fires: [number, number][] = [[300, 80], [700, H - 80], [1200, 60], [1800, H - 70], [2100, 80]];
        for (const [fx, fy] of fires) {
          pointLight(fx, fy, 35, 0xff4400, 0.50);
          pointLight(fx, fy, 12, 0xff8800, 0.65);
        }
        pointLight(1960, H / 2 - 10, 30, 0x4466ff, 0.40);
        break;
      }
      case 10: {
        const marketCols = [0xff4488, 0xffaa22, 0x44ccff, 0xcc44ff, 0x44ff88];
        for (let ml = 0; ml < 8; ml++) {
          const mx = 60 + ml * (W - 120) / 7;
          pointLight(mx, H * 0.35, 40, marketCols[ml % marketCols.length], 0.42);
          pointLight(mx, H * 0.65, 35, marketCols[(ml + 2) % marketCols.length], 0.38);
        }
        break;
      }
      case 11: {
        for (let sx = 60; sx < W; sx += 120) {
          pointLight(sx, H * 0.28, 45, 0x6688cc, 0.48);
          pointLight(sx, H * 0.28, 16, 0x99bbff, 0.58);
          pointLight(sx, H * 0.72, 45, 0x6688cc, 0.48);
          pointLight(sx, H * 0.72, 16, 0x99bbff, 0.58);
        }
        pointLight(W * 0.5, H * 0.5, 30, 0x334466, 0.35);
        break;
      }
      case 12: {
        for (let i = 0; i < 6; i++) {
          const lx = W * (0.1 + i * 0.16);
          pointLight(lx, H * 0.3, 100, 0xffd700, 0.40);
          pointLight(lx, H * 0.3, 35, 0xffffff, 0.55);
        }
        pointLight(W / 2, H / 2, 200, 0xffffff, 0.35);
        pointLight(W / 2, H / 2, 70, 0xffffd0, 0.50);
        break;
      }
    }
  }

  destroy(): void {
    this.layer?.destroy();
    this.layer = null;
  }
}
