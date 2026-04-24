import type Phaser from 'phaser';
import type { ChapterConfig } from '../ChapterData';
import { LAYER } from '../LayerRegistry';

/**
 * Per-chapter building facade pass. Each building is drawn as a 2.5D shape
 * (top face = roof, bottom face = wall + door + windows + side shadow) so the
 * top-down tile world reads as having occluding architecture rather than flat
 * decorations.
 *
 * Extracted from the WIP `drawBuildingFacades` in `TileMapManager.ts`. Any
 * `WorldRenderer` can invoke `render(config)`.
 */
export class BuildingFacade {
  private scene: Phaser.Scene;
  private layer: Phaser.GameObjects.Graphics | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  render(config: ChapterConfig): void {
    this.destroy();
    this.layer = this.scene.add.graphics().setDepth(LAYER.BUILDING);
    const g = this.layer;
    const ch = config.chapter;
    const W = config.mapWidth;
    const H = config.mapHeight;

    const drawBuilding = (
      bx: number, by: number, bw: number, bh: number,
      roofColor: number, wallColor: number, shadowColor: number,
      hasWindow: boolean, hasDoor: boolean,
    ) => {
      const roofH = Math.round(bh * 0.32);
      const shadow = 4;

      g.fillStyle(0x000000, 0.28);
      g.fillRect(bx + shadow, by + shadow, bw, bh);

      g.fillStyle(wallColor, 1);
      g.fillRect(bx, by + roofH, bw, bh - roofH);

      g.fillStyle(roofColor, 1);
      g.fillRect(bx, by, bw, roofH);

      g.fillStyle(0xffffff, 0.14);
      g.fillRect(bx, by, bw, 1);

      g.fillStyle(0x000000, 0.20);
      g.fillRect(bx + bw - 2, by, 2, roofH);

      g.fillStyle(shadowColor, 0.5);
      g.fillRect(bx + bw - 3, by + roofH, 3, bh - roofH);

      g.fillStyle(0x000000, 0.25);
      g.fillRect(bx, by + bh - 2, bw, 2);

      const plankH = 4;
      g.fillStyle(0x000000, 0.10);
      for (let py = by + roofH + plankH; py < by + bh; py += plankH) {
        g.fillRect(bx, py, bw, 1);
      }

      if (hasDoor) {
        const doorW = Math.round(bw * 0.18), doorH = Math.round((bh - roofH) * 0.55);
        const doorX = bx + Math.round((bw - doorW) / 2);
        const doorY = by + bh - doorH;
        g.fillStyle(shadowColor, 0.85);
        g.fillRect(doorX, doorY, doorW, doorH);
        g.fillStyle(roofColor, 0.6);
        g.fillRect(doorX - 1, doorY - 1, doorW + 2, 1);
        g.fillRect(doorX - 1, doorY, 1, doorH);
        g.fillRect(doorX + doorW, doorY, 1, doorH);
        g.fillStyle(0xd4a853, 0.9);
        g.fillCircle(doorX + doorW - 2, doorY + Math.round(doorH * 0.5), 1);
      }

      if (hasWindow && bw > 16) {
        const winW = Math.round(bw * 0.14), winH = Math.round((bh - roofH) * 0.3);
        const winY = by + roofH + Math.round((bh - roofH) * 0.2);
        const offsets = hasDoor ? [0.2, 0.75] : [0.22, 0.6];
        for (const frac of offsets) {
          const winX = bx + Math.round(bw * frac);
          g.fillStyle(0x1a2a4a, 0.75);
          g.fillRect(winX, winY, winW, winH);
          g.fillStyle(roofColor, 0.55);
          g.fillRect(winX - 1, winY - 1, winW + 2, 1);
          g.fillRect(winX - 1, winY + winH, winW + 2, 1);
          g.fillRect(winX - 1, winY, 1, winH);
          g.fillRect(winX + winW, winY, 1, winH);
          g.fillStyle(0xffcc44, 0.12);
          g.fillRect(winX, winY, winW, winH);
        }
      }
    };

    switch (ch) {
      case 1: {
        const positions = [
          { x: 60, y: H * 0.18, w: 64, h: 40 },
          { x: 200, y: H * 0.12, w: 56, h: 36 },
          { x: 400, y: H * 0.20, w: 72, h: 44 },
          { x: 620, y: H * 0.16, w: 60, h: 38 },
          { x: 900, y: H * 0.15, w: 68, h: 42 },
          { x: 1200, y: H * 0.18, w: 58, h: 36 },
          { x: 60, y: H * 0.62, w: 64, h: 40 },
          { x: 300, y: H * 0.70, w: 56, h: 36 },
          { x: 550, y: H * 0.65, w: 72, h: 44 },
          { x: 800, y: H * 0.68, w: 60, h: 38 },
        ];
        for (const p of positions) {
          drawBuilding(p.x, p.y, p.w, p.h, 0x8a7060, 0x6a5040, 0x3a2818, true, true);
          g.fillStyle(0x1a0a00, 0.20);
          g.fillRect(p.x + p.w * 0.6, p.y, p.w * 0.4, p.h * 0.5);
        }
        break;
      }
      case 3: {
        const posC3 = [
          { x: 50, y: H * 0.15, w: 52, h: 34 },
          { x: 160, y: H * 0.65, w: 60, h: 38 },
          { x: W - 160, y: H * 0.20, w: 56, h: 36 },
        ];
        for (const p of posC3) {
          drawBuilding(p.x, p.y, p.w, p.h, 0x5a5848, 0x4a4838, 0x1a1810, true, true);
        }
        break;
      }
      case 4: {
        const cols = [80, 200, 320, 440];
        for (const cx of cols) {
          drawBuilding(cx, H * 0.08, 18, H * 0.45, 0xf0d8b0, 0xd0b890, 0x604030, false, false);
          g.fillStyle(0xfff0c0, 1);
          g.fillRect(cx - 4, H * 0.08 - 4, 26, 5);
        }
        drawBuilding(60, H * 0.06, W - 120, H * 0.12, 0xe8d0a0, 0xc8b080, 0x604030, true, true);
        break;
      }
      case 5: {
        drawBuilding(W * 0.1, H * 0.1, W * 0.8, H * 0.5, 0xb89878, 0x987858, 0x483828, true, true);
        g.fillStyle(0xff8800, 0.12);
        g.fillCircle(W / 2, H * 0.35, 30);
        break;
      }
      case 7: {
        drawBuilding(W * 0.1, H * 0.05, W * 0.8, H * 0.35, 0xd8b898, 0xb89878, 0x503830, true, true);
        drawBuilding(W * 0.05, H * 0.05, 40, H * 0.45, 0xc8a888, 0xa88868, 0x483020, false, false);
        drawBuilding(W * 0.88, H * 0.05, 40, H * 0.45, 0xc8a888, 0xa88868, 0x483020, false, false);
        break;
      }
      case 10: {
        const marketBuildings = [
          { x: 60,  y: H * 0.10, w: 52, h: 36, r: 0xff4444, w2: 0xcc3333 },
          { x: 160, y: H * 0.12, w: 56, h: 38, r: 0x4488ff, w2: 0x3366cc },
          { x: 270, y: H * 0.10, w: 48, h: 34, r: 0xffaa22, w2: 0xcc8810 },
          { x: 360, y: H * 0.14, w: 60, h: 40, r: 0x44bb44, w2: 0x338833 },
          { x: 60,  y: H * 0.62, w: 52, h: 36, r: 0xaa44cc, w2: 0x882299 },
          { x: 160, y: H * 0.65, w: 56, h: 38, r: 0xff6688, w2: 0xcc3355 },
        ];
        for (const b of marketBuildings) {
          drawBuilding(b.x, b.y, b.w, b.h, b.r, b.w2, 0x1a1028, true, true);
          g.fillStyle(b.r, 0.6);
          g.fillRect(b.x, b.y + Math.round(b.h * 0.32) - 3, b.w, 4);
          g.fillStyle(0xffffff, 0.2);
          for (let s = 0; s < b.w; s += 6) g.fillRect(b.x + s, b.y + Math.round(b.h * 0.32) - 3, 3, 4);
        }
        break;
      }
      case 11: {
        const castleX = W * 0.25, castleY = H * 0.05;
        drawBuilding(castleX, castleY, W * 0.5, H * 0.55, 0x3c3c48, 0x2c2c38, 0x0c0c18, true, true);
        for (let b = 0; b < 10; b++) {
          g.fillStyle(b % 2 === 0 ? 0x3a3848 : 0x1a1828, 1);
          g.fillRect(castleX + b * (W * 0.05), castleY - 6, W * 0.04, 7);
        }
        drawBuilding(castleX - 25, castleY - 15, 28, H * 0.65, 0x282838, 0x181828, 0x080818, false, false);
        drawBuilding(castleX + W * 0.5 - 3, castleY - 15, 28, H * 0.65, 0x282838, 0x181828, 0x080818, false, false);
        break;
      }
    }
  }

  destroy(): void {
    this.layer?.destroy();
    this.layer = null;
  }
}
