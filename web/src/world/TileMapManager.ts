import { TILE_SIZE } from '../config';
import { ChapterConfig, ChapterTheme } from './ChapterData';

export class TileMapManager {
  private scene: Phaser.Scene;
  private groundLayer: Phaser.GameObjects.Graphics | null = null;
  private decorLayer: Phaser.GameObjects.Graphics | null = null;
  private objectLayer: Phaser.GameObjects.Graphics | null = null;
  private fogLayer: Phaser.GameObjects.Graphics | null = null;
  private colliders: Phaser.Physics.Arcade.StaticGroup | null = null;
  private parallaxFar: Phaser.GameObjects.Graphics | null = null;
  private parallaxMid: Phaser.GameObjects.Graphics | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  generateMap(config: ChapterConfig): void {
    this.clearMap();

    this.drawParallaxBackground(config);

    this.groundLayer = this.scene.add.graphics().setDepth(0);
    this.decorLayer = this.scene.add.graphics().setDepth(1);
    this.objectLayer = this.scene.add.graphics().setDepth(5);
    this.fogLayer = this.scene.add.graphics().setDepth(4);
    this.colliders = this.scene.physics.add.staticGroup();

    const theme = config.theme;
    const tilesX = Math.ceil(config.mapWidth / TILE_SIZE);
    const tilesY = Math.ceil(config.mapHeight / TILE_SIZE);

    for (let ty = 0; ty < tilesY; ty++) {
      for (let tx = 0; tx < tilesX; tx++) {
        const x = tx * TILE_SIZE;
        const y = ty * TILE_SIZE;
        const isBorder = tx === 0 || ty === 0 || tx === tilesX - 1 || ty === tilesY - 1;

        if (isBorder) {
          this.drawWallTile(x, y, theme);
          const wall = this.scene.add.rectangle(x + TILE_SIZE / 2, y + TILE_SIZE / 2, TILE_SIZE, TILE_SIZE);
          this.scene.physics.add.existing(wall, true);
          this.colliders!.add(wall);
          wall.setVisible(false);
        } else {
          this.drawGroundTile(x, y, theme);
          this.drawDecoration(x, y, tx, ty, config);
        }
      }
    }

    this.drawFog(config);
    this.drawPathway(config);
    this.placeEnvironmentObjects(config);
    this.drawExitIndicators(config);
    this.drawChapterLandmarks(config);

    this.scene.cameras.main.setBounds(0, 0, config.mapWidth, config.mapHeight);
    this.scene.physics.world.setBounds(0, 0, config.mapWidth, config.mapHeight);
  }

  private drawGroundTile(x: number, y: number, theme: ChapterTheme): void {
    if (!this.groundLayer) return;

    const hash = ((x * 7 + y * 13) * 31) & 0xffff;
    const base = hash % 2 === 0 ? theme.groundBase : theme.groundVariant;
    this.groundLayer.fillStyle(base, 1);
    this.groundLayer.fillRect(x, y, TILE_SIZE, TILE_SIZE);

    if ((hash & 0xf) < 3) {
      this.groundLayer.fillStyle(0x000000, 0.04 + ((hash >> 4) & 3) * 0.01);
      this.groundLayer.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    }
    if ((hash & 0x1f) < 2) {
      this.groundLayer.fillStyle(0xffffff, 0.025);
      this.groundLayer.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    }
  }

  private drawWallTile(x: number, y: number, theme: ChapterTheme): void {
    if (!this.groundLayer) return;

    this.groundLayer.fillStyle(theme.wallColor, 1);
    this.groundLayer.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    this.groundLayer.fillStyle(theme.wallTop, 0.5);
    this.groundLayer.fillRect(x, y, TILE_SIZE, TILE_SIZE / 3);
    this.groundLayer.lineStyle(0.5, 0x111111, 0.2);
    this.groundLayer.strokeRect(x, y, TILE_SIZE, TILE_SIZE);

    const hash = ((x * 11 + y * 7) * 19) & 0xff;
    if (hash < 30) {
      this.groundLayer.fillStyle(0x000000, 0.1);
      this.groundLayer.fillRect(x + (hash % 12), y + ((hash >> 2) % 12), 1, 3 + (hash % 4));
    }
  }

  private drawDecoration(x: number, y: number, tx: number, ty: number, config: ChapterConfig): void {
    if (!this.decorLayer) return;
    const hash = ((tx * 17 + ty * 23) * 47) & 0xffff;
    const theme = config.theme;

    if ((hash & 0xff) < 12) {
      const dColor = theme.decorColors[hash % theme.decorColors.length];
      this.decorLayer.fillStyle(dColor, 0.2);
      this.decorLayer.fillCircle(x + 4 + (hash % 8), y + 4 + ((hash >> 4) % 8), 1.5);
    }

    switch (config.chapter) {
      case 1:
      case 3:
        if ((hash & 0xff) < 8) {
          const gx = x + (hash % 12);
          const gy = y + ((hash >> 3) % 12);
          this.decorLayer.fillStyle(0x6a8a5a, 0.25);
          this.decorLayer.fillRect(gx, gy, 1, 3);
          this.decorLayer.fillRect(gx + 2, gy + 1, 1, 2);
        }
        if ((hash & 0xfff) < 25) {
          const fx = x + (hash % 10) + 3;
          const fy = y + ((hash >> 5) % 10) + 3;
          const colors = [0xdd8855, 0xcc6666, 0xaaaa55, 0xbb88bb];
          const alpha = config.chapter === 3 ? 0.5 : 0.35;
          this.decorLayer.fillStyle(colors[hash % colors.length], alpha);
          this.decorLayer.fillCircle(fx, fy, 1.2);
        }
        break;

      case 2:
        if ((hash & 0xff) < 18) {
          this.decorLayer.fillStyle(0x4a5a5a, 0.15);
          this.decorLayer.fillCircle(x + (hash % 14), y + ((hash >> 3) % 14), 2 + (hash % 3));
        }
        if ((hash & 0xfff) < 20) {
          this.decorLayer.fillStyle(0x3a4a5a, 0.1);
          this.decorLayer.fillEllipse(x + (hash % 12), y + ((hash >> 2) % 12), 6, 2);
        }
        if ((hash & 0xfff) < 8) {
          this.decorLayer.fillStyle(0x336655, 0.2);
          const rx = x + (hash % 10);
          const ry = y + ((hash >> 4) % 10);
          this.decorLayer.fillRect(rx, ry, 1, 4);
          this.decorLayer.fillRect(rx + 1, ry + 1, 1, 3);
        }
        break;

      case 4:
        if ((hash & 0xff) < 20) {
          this.decorLayer.fillStyle(0x4040a0, 0.05);
          this.decorLayer.fillCircle(x + (hash % 14), y + ((hash >> 3) % 14), 3 + (hash % 4));
        }
        if ((hash & 0xfff) < 10) {
          this.decorLayer.fillStyle(0x888888, 0.1);
          this.decorLayer.fillRect(x + (hash % 10), y + ((hash >> 3) % 10), 2, 1);
        }
        break;

      case 5:
        if ((hash & 0xff) < 12) {
          this.decorLayer.fillStyle(0xd4a853, 0.06);
          this.decorLayer.fillCircle(x + (hash % 14), y + ((hash >> 3) % 14), 2);
        }
        if ((hash & 0xfff) < 15) {
          this.decorLayer.fillStyle(0xff8800, 0.08);
          this.decorLayer.fillCircle(x + (hash % 10) + 3, y + ((hash >> 4) % 10) + 3, 1);
        }
        break;

      case 6:
        if ((hash & 0xff) < 20) {
          this.decorLayer.fillStyle(0xd4a853, 0.08);
          this.decorLayer.fillCircle(x + (hash % 14), y + ((hash >> 3) % 14), 1 + (hash % 3));
        }
        if ((hash & 0xfff) < 12) {
          this.decorLayer.fillStyle(0xffeedd, 0.04);
          this.decorLayer.fillCircle(x + (hash % 12), y + ((hash >> 3) % 12), 3 + (hash % 3));
        }
        break;
    }
  }

  private drawFog(config: ChapterConfig): void {
    if (!this.fogLayer) return;
    const theme = config.theme;
    if (theme.fogAlpha <= 0) return;

    for (let i = 0; i < 8; i++) {
      const hash = (i * 127 + config.chapter * 37) & 0xffff;
      const fx = (hash % config.mapWidth);
      const fy = ((hash * 3) % config.mapHeight);
      const fr = 40 + (hash % 60);
      this.fogLayer.fillStyle(theme.fogColor, theme.fogAlpha * (0.5 + (hash % 5) * 0.1));
      this.fogLayer.fillCircle(fx, fy, fr);
    }
  }

  private drawChapterLandmarks(config: ChapterConfig): void {
    if (!this.objectLayer) return;

    switch (config.chapter) {
      case 4: {
        const gx = config.mapWidth - 100;
        const gy = 130;
        this.objectLayer.fillStyle(0x555555, 0.8);
        this.objectLayer.fillRect(gx - 4, gy - 30, 8, 60);
        this.objectLayer.fillRect(gx + 20, gy - 30, 8, 60);
        this.objectLayer.fillStyle(0x666666, 0.9);
        this.objectLayer.fillRect(gx - 8, gy - 34, 36, 8);
        this.objectLayer.fillStyle(0xd4a853, 0.3);
        this.objectLayer.fillRect(gx + 8, gy - 5, 8, 30);
        break;
      }
      case 5: {
        const bx = 160;
        const by = 80;
        for (let i = 0; i < 3; i++) {
          this.objectLayer.fillStyle(0x5a3a1a, 0.6);
          this.objectLayer.fillRect(bx + i * 30, by, 6, 30);
          this.objectLayer.fillStyle(0xaa8844, 0.3);
          for (let j = 0; j < 3; j++) {
            this.objectLayer.fillRect(bx + i * 30 - 2, by + j * 8, 10, 2);
          }
        }
        for (let i = 0; i < 4; i++) {
          const cx = 100 + i * 80;
          const cy = 100 + (i % 2) * 40;
          this.objectLayer.fillStyle(0xff8800, 0.15);
          this.objectLayer.fillCircle(cx, cy, 4);
          this.objectLayer.fillStyle(0xffcc00, 0.08);
          this.objectLayer.fillCircle(cx, cy - 2, 2);
        }
        break;
      }
      case 6: {
        const cx = config.mapWidth / 2;
        const cy = 120;
        this.objectLayer.fillStyle(0x8b7355, 0.9);
        this.objectLayer.fillRect(cx - 4, cy - 40, 8, 80);
        this.objectLayer.fillRect(cx - 20, cy - 30, 40, 8);
        this.objectLayer.fillStyle(0xd4a853, 0.2);
        this.objectLayer.fillCircle(cx, cy - 20, 25);
        this.objectLayer.fillStyle(0xffd700, 0.1);
        this.objectLayer.fillCircle(cx, cy - 20, 35);
        this.objectLayer.fillStyle(0xffeedd, 0.05);
        this.objectLayer.fillCircle(cx, cy - 20, 50);
        break;
      }
    }
  }

  private placeEnvironmentObjects(config: ChapterConfig): void {
    if (!this.objectLayer || !this.colliders) return;

    const seed = config.chapter * 1337;
    const density = config.chapter === 6 ? 12000 : 6000;
    const numObjects = Math.floor(config.mapWidth * config.mapHeight / density);

    for (let i = 0; i < numObjects; i++) {
      const h = ((seed + i * 67) * 31) & 0xffff;
      const ox = TILE_SIZE * 2 + (h % (config.mapWidth - TILE_SIZE * 4));
      const oy = TILE_SIZE * 2 + ((h * 7) % (config.mapHeight - TILE_SIZE * 4));

      const tooClose = config.npcs.some(n =>
        Math.abs(n.x - ox) < 40 && Math.abs(n.y - oy) < 40,
      ) || (Math.abs(config.spawn.x - ox) < 50 && Math.abs(config.spawn.y - oy) < 50);
      if (tooClose) continue;

      const exitTooClose = (config.exits ?? []).some(e =>
        ox > e.x - 30 && ox < e.x + e.width + 30 &&
        oy > e.y - 30 && oy < e.y + e.height + 30,
      );
      if (exitTooClose) continue;

      const type = h % 5;
      if ([1, 2, 3, 5].includes(config.chapter) && (type === 0 || type === 1)) {
        this.drawTree(ox, oy, h, config.chapter);
        const tree = this.scene.add.rectangle(ox, oy + 4, 8, 8);
        this.scene.physics.add.existing(tree, true);
        this.colliders!.add(tree);
        tree.setVisible(false);
      } else if (type === 2 || type === 3) {
        this.drawRock(ox, oy, h, config.theme);
        const rock = this.scene.add.rectangle(ox, oy, 10, 8);
        this.scene.physics.add.existing(rock, true);
        this.colliders!.add(rock);
        rock.setVisible(false);
      }
    }
  }

  private drawTree(x: number, y: number, hash: number, chapter: number): void {
    if (!this.objectLayer) return;
    const trunkH = 8 + (hash % 4);

    const trunkColor = chapter === 2 ? 0x2a2018 : 0x3a2a18;
    this.objectLayer.fillStyle(trunkColor, 0.9);
    this.objectLayer.fillRect(x - 2, y, 4, trunkH);

    const crownR = 6 + (hash % 4);
    const crownY = y - crownR + 2;
    const crownColors: Record<number, number[]> = {
      1: [0x2a5a2a, 0x3a7a3a, 0x1a4a1a],
      2: [0x1a4a3a, 0x2a5a4a, 0x0a3a2a],
      3: [0x4a7a2a, 0x5a8a3a, 0x3a6a1a],
      5: [0x3a5a2a, 0x4a6a3a, 0x2a4a1a],
    };
    const colors = crownColors[chapter] ?? crownColors[1];

    this.objectLayer.fillStyle(colors[0], 0.7);
    this.objectLayer.fillCircle(x, crownY, crownR);
    this.objectLayer.fillStyle(colors[1], 0.4);
    this.objectLayer.fillCircle(x - 2, crownY - 2, crownR * 0.7);
    this.objectLayer.fillStyle(colors[2], 0.3);
    this.objectLayer.fillCircle(x + 2, crownY + 2, crownR * 0.6);
  }

  private drawRock(x: number, y: number, hash: number, theme: ChapterTheme): void {
    if (!this.objectLayer) return;
    const rw = 6 + (hash % 5);
    const rh = 4 + (hash % 3);

    const baseGray = ((theme.wallColor >> 16) & 0xff) + 0x20;
    const rockColor = (baseGray << 16) | (baseGray << 8) | baseGray;

    this.objectLayer.fillStyle(rockColor, 0.8);
    this.objectLayer.fillEllipse(x, y, rw, rh);
    this.objectLayer.fillStyle(0xffffff, 0.08);
    this.objectLayer.fillEllipse(x - 1, y - 1, rw * 0.7, rh * 0.6);
  }

  private drawPathway(config: ChapterConfig): void {
    if (!this.decorLayer) return;
    const pathColor = config.theme.pathColor;

    for (let i = 0; i < 30; i++) {
      const t = i / 30;
      const px = config.spawn.x + Math.sin(t * 3) * 6;
      const py = config.spawn.y - i * (config.mapHeight / 30);
      const w = 10 + Math.sin(i * 0.3) * 3;

      if (py < 0) break;
      this.decorLayer.fillStyle(pathColor, 0.1 + t * 0.04);
      this.decorLayer.fillEllipse(px, py, w, 5);
    }

    (config.exits ?? []).forEach(exit => {
      const ex = exit.x + exit.width / 2;
      const ey = exit.y + exit.height / 2;

      for (let i = 0; i < 10; i++) {
        const t = i / 10;
        const px = ex + (1 - t) * Math.sin(t * 2) * 4;
        const py = ey - (1 - t) * i * 12;
        this.decorLayer!.fillStyle(pathColor, 0.06 + t * 0.06);
        this.decorLayer!.fillEllipse(px, py, 8, 4);
      }
    });
  }

  private drawExitIndicators(config: ChapterConfig): void {
    if (!this.objectLayer) return;
    (config.exits ?? []).forEach(exit => {
      const cx = exit.x + exit.width / 2;
      const cy = exit.y + exit.height / 2;

      this.objectLayer!.fillStyle(0xd4a853, 0.06);
      this.objectLayer!.fillEllipse(cx, cy, exit.width + 10, exit.height + 10);

      for (let i = 0; i < 3; i++) {
        this.objectLayer!.lineStyle(0.5, 0xd4a853, 0.08 - i * 0.02);
        this.objectLayer!.strokeEllipse(cx, cy, exit.width + 6 + i * 8, exit.height + 6 + i * 8);
      }

      this.objectLayer!.fillStyle(0xd4a853, 0.3);
      this.objectLayer!.fillTriangle(cx, cy - 12, cx - 4, cy - 6, cx + 4, cy - 6);
    });
  }

  getColliders(): Phaser.Physics.Arcade.StaticGroup | null {
    return this.colliders;
  }

  private drawParallaxBackground(config: ChapterConfig): void {
    const { mapWidth: W, mapHeight: H, theme } = config;
    const GAME_H = H;

    // Far layer: sky gradient — scrolls at 15% speed
    const far = this.scene.add.graphics().setDepth(-2).setScrollFactor(0.15, 0.05);
    // Sky: blend from dark top to slightly lighter bottom
    const skyTop = this.darkenColor(theme.groundBase, 0.3);
    const skyMid = this.darkenColor(theme.groundBase, 0.5);
    const strips = 12;
    for (let i = 0; i < strips; i++) {
      const t = i / strips;
      const color = this.lerpColor(skyTop, skyMid, t);
      far.fillStyle(color, 1);
      far.fillRect(0, Math.floor(t * GAME_H), W, Math.ceil(GAME_H / strips) + 1);
    }
    // Distant "mountain" silhouettes
    far.fillStyle(this.darkenColor(theme.groundBase, 0.6), 0.5);
    for (let x = 0; x < W; x += 60) {
      const hash = ((x * 31) * 17) & 0xff;
      const h = 20 + (hash % 40);
      const w = 40 + (hash % 60);
      far.fillTriangle(x, GAME_H, x + w / 2, GAME_H - h, x + w, GAME_H);
    }
    this.parallaxFar = far;

    // Mid layer: rolling hills — scrolls at 40% speed
    const mid = this.scene.add.graphics().setDepth(-1).setScrollFactor(0.4, 0.1);
    mid.fillStyle(this.darkenColor(theme.groundBase, 0.7), 0.7);
    const hillPoints: number[] = [];
    for (let x = 0; x <= W; x += 16) {
      const hash2 = ((x * 53 + 7) * 29) & 0xff;
      hillPoints.push(GAME_H - 30 - (hash2 % 50));
    }
    // Draw hills as filled polygon using available segments
    for (let i = 0; i < hillPoints.length - 1; i++) {
      const x1 = i * 16;
      const x2 = (i + 1) * 16;
      const y1 = hillPoints[i];
      const y2 = hillPoints[i + 1];
      mid.fillTriangle(x1, GAME_H, x1, y1, x2, y2);
      mid.fillTriangle(x1, GAME_H, x2, y2, x2, GAME_H);
    }
    this.parallaxMid = mid;
  }

  private darkenColor(color: number, factor: number): number {
    const r = Math.floor(((color >> 16) & 0xff) * factor);
    const g = Math.floor(((color >> 8) & 0xff) * factor);
    const b = Math.floor((color & 0xff) * factor);
    return (r << 16) | (g << 8) | b;
  }

  private lerpColor(a: number, b: number, t: number): number {
    const ar = (a >> 16) & 0xff, ag = (a >> 8) & 0xff, ab = a & 0xff;
    const br = (b >> 16) & 0xff, bg = (b >> 8) & 0xff, bb = b & 0xff;
    const r = Math.round(ar + (br - ar) * t);
    const g = Math.round(ag + (bg - ag) * t);
    const bv = Math.round(ab + (bb - ab) * t);
    return (r << 16) | (g << 8) | bv;
  }

  clearMap(): void {
    this.parallaxFar?.destroy(); this.parallaxFar = null;
    this.parallaxMid?.destroy(); this.parallaxMid = null;
    this.groundLayer?.destroy(); this.groundLayer = null;
    this.decorLayer?.destroy(); this.decorLayer = null;
    this.objectLayer?.destroy(); this.objectLayer = null;
    this.fogLayer?.destroy(); this.fogLayer = null;
    this.colliders?.destroy(true, true); this.colliders = null;
  }
}
