import { TILE_SIZE, GAME_WIDTH, GAME_HEIGHT } from '../config';
import { ChapterConfig, ChapterTheme, TerrainZone } from './ChapterData';

export class TileMapManager {
  private scene: Phaser.Scene;
  private groundLayer: Phaser.GameObjects.Graphics | null = null;
  private decorLayer: Phaser.GameObjects.Graphics | null = null;
  private objectLayer: Phaser.GameObjects.Graphics | null = null;
  private fogLayer: Phaser.GameObjects.Graphics | null = null;
  private terrainZoneLayer: Phaser.GameObjects.Graphics | null = null;
  private colliders: Phaser.Physics.Arcade.StaticGroup | null = null;
  private parallaxLayers: Phaser.GameObjects.GameObject[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  generateMap(config: ChapterConfig): void {
    this.clearMap();

    this.drawParallaxBackground(config);

    this.groundLayer = this.scene.add.graphics().setDepth(0);
    this.decorLayer = this.scene.add.graphics().setDepth(1);
    this.terrainZoneLayer = this.scene.add.graphics().setDepth(2);
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
    this.drawTerrainZones(config);

    this.scene.cameras.main.setBounds(0, 0, config.mapWidth, config.mapHeight);
    this.scene.physics.world.setBounds(0, 0, config.mapWidth, config.mapHeight);
  }

  private drawGroundTile(x: number, y: number, theme: ChapterTheme): void {
    if (!this.groundLayer) return;

    const hash = ((x * 7 + y * 13) * 31) & 0xffff;
    const base = hash % 2 === 0 ? theme.groundBase : theme.groundVariant;
    this.groundLayer.fillStyle(base, 1);
    this.groundLayer.fillRect(x, y, TILE_SIZE, TILE_SIZE);

    // Subtle random shading variation
    if ((hash & 0xf) < 3) {
      this.groundLayer.fillStyle(0x000000, 0.08 + ((hash >> 4) & 3) * 0.02);
      this.groundLayer.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    }
    if ((hash & 0x1f) < 2) {
      this.groundLayer.fillStyle(0xffffff, 0.07);
      this.groundLayer.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    }

    // Tile texture details (every ~3rd tile gets details)
    const detailHash = ((x * 11 + y * 17) * 53) & 0xffff;
    if (detailHash % 3 === 0) {
      // Small pebble/rock
      if ((detailHash & 0xff) < 80) {
        const px = x + (detailHash % (TILE_SIZE - 4)) + 2;
        const py = y + ((detailHash >> 3) % (TILE_SIZE - 4)) + 2;
        this.groundLayer.fillStyle(0x000000, 0.22);
        this.groundLayer.fillCircle(px, py, 1 + (detailHash % 2) * 0.5);
        this.groundLayer.fillStyle(0xffffff, 0.08);
        this.groundLayer.fillCircle(px - 0.5, py - 0.5, 0.7);
      }
      // Grass tuft (V shape)
      if ((detailHash & 0xfff) < 120) {
        const gx = x + ((detailHash >> 2) % (TILE_SIZE - 6)) + 3;
        const gy = y + ((detailHash >> 5) % (TILE_SIZE - 6)) + 3;
        this.groundLayer.lineStyle(1, 0x4a7a3a, 0.35);
        this.groundLayer.lineBetween(gx, gy, gx - 1, gy - 2);
        this.groundLayer.lineBetween(gx, gy, gx + 1, gy - 2);
      }
      // Earth crack (thin line)
      if ((detailHash & 0x3fff) < 60) {
        const crx = x + ((detailHash >> 4) % (TILE_SIZE - 6)) + 3;
        const cry = y + ((detailHash >> 7) % (TILE_SIZE - 4)) + 2;
        this.groundLayer.lineStyle(0.5, 0x000000, 0.15);
        this.groundLayer.lineBetween(crx, cry, crx + 2, cry + 1);
        this.groundLayer.lineBetween(crx + 2, cry + 1, crx + 3, cry);
      }
    }

    // Tile edge border — very subtle, just enough to break flat look
    this.groundLayer.lineStyle(0.5, 0x000000, 0.06);
    this.groundLayer.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
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

      case 7:
        // Palace gardens — flowers and vines
        if ((hash & 0xff) < 14) {
          const flowerColors = [0xffaacc, 0xaaccff, 0xffeeaa, 0xccffaa];
          this.decorLayer.fillStyle(flowerColors[hash % flowerColors.length], 0.3);
          this.decorLayer.fillCircle(x + (hash % 12) + 2, y + ((hash >> 3) % 12) + 2, 1.2);
          this.decorLayer.fillStyle(0x88bb66, 0.2);
          this.decorLayer.fillRect(x + (hash % 10) + 3, y + ((hash >> 4) % 10) + 3, 1, 3);
        }
        if ((hash & 0xfff) < 8) {
          // Stone tile grout lines
          this.decorLayer.fillStyle(0x888888, 0.06);
          this.decorLayer.fillRect(x, y + TILE_SIZE / 2, TILE_SIZE, 1);
          this.decorLayer.fillRect(x + TILE_SIZE / 2, y, 1, TILE_SIZE);
        }
        break;

      case 8:
        // Valley of Humiliation — volcanic cracks
        if ((hash & 0xff) < 22) {
          this.decorLayer.fillStyle(0x8b0000, 0.06);
          const lx = x + (hash % 12);
          const ly = y + ((hash >> 3) % 12);
          this.decorLayer.fillRect(lx, ly, 1 + (hash % 4), 1);
          this.decorLayer.fillRect(lx + 1, ly + 1, 1 + (hash % 3), 1);
        }
        if ((hash & 0xfff) < 6) {
          // Lava glow pulse (static approximation)
          this.decorLayer.fillStyle(0xff4400, 0.04);
          this.decorLayer.fillCircle(x + (hash % 10) + 3, y + ((hash >> 4) % 10) + 3, 2 + (hash % 2));
        }
        break;

      case 9:
        // Shadow Valley — bones and dark stones
        if ((hash & 0xff) < 16) {
          this.decorLayer.fillStyle(0xccbbaa, 0.08);
          // Bone fragment
          this.decorLayer.fillRect(x + (hash % 10) + 2, y + ((hash >> 3) % 10) + 2, 4, 1);
          this.decorLayer.fillCircle(x + (hash % 10) + 2, y + ((hash >> 3) % 10) + 2, 1);
        }
        if ((hash & 0xfff) < 10) {
          // Eerie wisps
          this.decorLayer.fillStyle(0x4433aa, 0.05);
          this.decorLayer.fillCircle(x + (hash % 14), y + ((hash >> 4) % 14), 2 + (hash % 3));
        }
        break;

      case 10:
        // Vanity Fair — cobblestone market ground
        if ((hash & 0xff) < 30) {
          this.decorLayer.fillStyle(0x555566, 0.06);
          this.decorLayer.fillRect(x + (hash % 6), y + ((hash >> 2) % 6), 5, 4);
        }
        if ((hash & 0xfff) < 10) {
          // Dropped market scraps (confetti-like)
          const scraps = [0xffcc00, 0xff6688, 0x88ccff, 0xaaff88];
          this.decorLayer.fillStyle(scraps[hash % scraps.length], 0.15);
          this.decorLayer.fillRect(x + (hash % 12) + 2, y + ((hash >> 3) % 12) + 2, 2, 1);
        }
        break;

      case 11:
        // Doubting Castle — dungeon damp stones
        if ((hash & 0xff) < 25) {
          // Stone block grout
          this.decorLayer.fillStyle(0x333344, 0.1);
          this.decorLayer.fillRect(x, y + TILE_SIZE / 2, TILE_SIZE, 1);
        }
        if ((hash & 0xfff) < 8) {
          // Moss patches
          this.decorLayer.fillStyle(0x336633, 0.12);
          this.decorLayer.fillCircle(x + (hash % 12) + 2, y + ((hash >> 3) % 12) + 2, 1.5 + (hash % 2));
        }
        if ((hash & 0x1fff) < 4) {
          // Water drip stain
          this.decorLayer.fillStyle(0x224466, 0.1);
          this.decorLayer.fillRect(x + (hash % 10) + 3, y + 2, 1, 6 + (hash % 6));
        }
        break;

      case 12:
        // Celestial City — golden shimmer, flower petals
        if ((hash & 0xff) < 18) {
          this.decorLayer.fillStyle(0xffd700, 0.07);
          this.decorLayer.fillCircle(x + (hash % 14), y + ((hash >> 3) % 14), 1 + (hash % 2));
        }
        if ((hash & 0xfff) < 12) {
          // Flower petals in gold/white
          const petalColors = [0xffd700, 0xffffff, 0xffeecc];
          this.decorLayer.fillStyle(petalColors[hash % petalColors.length], 0.25);
          this.decorLayer.fillCircle(x + (hash % 12) + 2, y + ((hash >> 4) % 12) + 2, 1.5);
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

      case 7: {
        const W7 = config.mapWidth;
        const H7 = config.mapHeight;
        // Forked road signpost at x≈400
        const signX = 400;
        const signY = H7 / 2 - 20;
        this.objectLayer.fillStyle(0x8b6940, 0.9);
        this.objectLayer.fillRect(signX - 1, signY - 20, 2, 30);
        this.objectLayer.fillStyle(0xaa8855, 0.9);
        this.objectLayer.fillRect(signX - 12, signY - 22, 24, 7);
        this.objectLayer.fillStyle(0xd4a853, 0.8);
        this.objectLayer.fillRect(signX - 12, signY - 30, 24, 7);
        // Palace Beautiful — large arched building at x≈1800
        const palX = W7 - 600;
        const palY = 60;
        const palW = 200;
        const palH = 120;
        // Main palace body
        this.objectLayer.fillStyle(0xd4c8b4, 0.8);
        this.objectLayer.fillRect(palX, palY, palW, palH);
        // Pillars
        for (let i = 0; i < 5; i++) {
          this.objectLayer.fillStyle(0xeeddcc, 0.9);
          this.objectLayer.fillRect(palX + 10 + i * 38, palY - 8, 10, palH + 8);
        }
        // Arched windows
        for (let i = 0; i < 4; i++) {
          this.objectLayer.fillStyle(0xffe8c0, 0.35);
          this.objectLayer.fillRect(palX + 18 + i * 38, palY + 20, 14, 22);
          this.objectLayer.fillCircle(palX + 25 + i * 38, palY + 20, 7);
        }
        // Roof
        this.objectLayer.fillStyle(0x8b7355, 0.85);
        this.objectLayer.fillTriangle(palX - 10, palY, palX + palW / 2, palY - 40, palX + palW + 10, palY);
        // Palace gate (lions flank it)
        const gateX = palX + palW / 2;
        const gateY = palY + palH;
        this.objectLayer.fillStyle(0xd4a853, 0.7);
        this.objectLayer.fillRect(gateX - 12, gateY - 20, 24, 20);
        this.objectLayer.fillStyle(0x000000, 0.0);
        this.objectLayer.fillCircle(gateX, gateY - 20, 12);
        // Two lion silhouettes flanking gate
        for (const dx of [-30, 30]) {
          this.objectLayer.fillStyle(0xaa8844, 0.6);
          this.objectLayer.fillEllipse(gateX + dx, gateY - 6, 18, 10);
          this.objectLayer.fillCircle(gateX + dx + (dx > 0 ? 7 : -7), gateY - 10, 6);
        }
        // Light glow around palace
        this.objectLayer.fillStyle(0xffe8c0, 0.04);
        this.objectLayer.fillCircle(palX + palW / 2, palY + palH / 2, 160);
        // Distant mountains behind palace
        for (let m = 0; m < 4; m++) {
          const mx = W7 - 800 + m * 90;
          const mh = 60 + (m % 2) * 30;
          this.objectLayer.fillStyle(0x6a8899, 0.2);
          this.objectLayer.fillTriangle(mx, H7, mx + 60, H7 - mh, mx + 120, H7);
        }
        break;
      }

      case 8: {
        const W8 = config.mapWidth;
        const H8 = config.mapHeight;
        // Apollyon's volcanic valley — lava pools and volcanic rock
        // Jagged cliff walls on sides
        for (let i = 0; i < 5; i++) {
          const hash8 = (i * 113 + 8 * 7) & 0xff;
          const rx = TILE_SIZE + (hash8 % 60);
          const rw = 20 + (hash8 % 30);
          const rh = 30 + (hash8 % 50);
          this.objectLayer.fillStyle(0x1a0a08, 0.85);
          this.objectLayer.fillTriangle(rx, H8, rx + rw / 2, H8 - rh, rx + rw, H8);
        }
        // Lava pools
        const lavaPositions = [200, 500, 800];
        for (const lx of lavaPositions) {
          this.objectLayer.fillStyle(0xff3300, 0.25);
          this.objectLayer.fillEllipse(lx, H8 - 20, 40, 10);
          this.objectLayer.fillStyle(0xff8800, 0.15);
          this.objectLayer.fillEllipse(lx, H8 - 20, 25, 6);
          // Glow
          this.objectLayer.fillStyle(0xff4400, 0.06);
          this.objectLayer.fillCircle(lx, H8 - 22, 30);
        }
        // Bone piles from previous victims
        for (const bx of [350, 700]) {
          this.objectLayer.fillStyle(0xddccbb, 0.4);
          this.objectLayer.fillEllipse(bx, H8 - 16, 16, 8);
          this.objectLayer.fillRect(bx - 8, H8 - 14, 16, 2);
          this.objectLayer.fillCircle(bx + 6, H8 - 18, 4);
        }
        // Apollyon boss position marker — dark cloud
        const apollyonX = W8 / 2;
        this.objectLayer.fillStyle(0x220011, 0.4);
        this.objectLayer.fillEllipse(apollyonX, H8 / 2, 80, 40);
        this.objectLayer.fillStyle(0x440022, 0.2);
        this.objectLayer.fillEllipse(apollyonX, H8 / 2 - 10, 50, 25);
        break;
      }

      case 9: {
        const W9 = config.mapWidth;
        const H9 = config.mapHeight;
        // Valley of Shadow — cliff edges, distant fires, skulls
        // Cliff walls (top narrow zone)
        this.objectLayer.fillStyle(0x0a0008, 0.7);
        this.objectLayer.fillRect(0, 0, W9, 40);
        this.objectLayer.fillRect(0, H9 - 40, W9, 40);
        // Jagged upper cliff edge
        for (let i = 0; i < 24; i++) {
          const hash9 = (i * 97 + 9 * 11) & 0xff;
          const sx = i * (W9 / 24);
          const sh = 5 + (hash9 % 20);
          this.objectLayer.fillStyle(0x110816, 0.9);
          this.objectLayer.fillTriangle(sx, 40, sx + W9 / 48, 40 - sh, sx + W9 / 24, 40);
        }
        // Jagged lower cliff edge
        for (let i = 0; i < 24; i++) {
          const hash9b = (i * 113 + 9 * 7) & 0xff;
          const sx = i * (W9 / 24);
          const sh = 5 + (hash9b % 20);
          this.objectLayer.fillStyle(0x110816, 0.9);
          this.objectLayer.fillTriangle(sx, H9 - 40, sx + W9 / 48, H9 - 40 + sh, sx + W9 / 24, H9 - 40);
        }
        // Distant fires (eerie red glow)
        for (const [fx, fy] of [[300, 80], [700, H9 - 80], [1200, 60], [1800, H9 - 70], [2100, 80]]) {
          this.objectLayer.fillStyle(0xff4400, 0.18);
          this.objectLayer.fillCircle(fx, fy, 8);
          this.objectLayer.fillStyle(0xff8800, 0.1);
          this.objectLayer.fillCircle(fx, fy - 5, 5);
          this.objectLayer.fillStyle(0xff4400, 0.06);
          this.objectLayer.fillCircle(fx, fy, 18);
        }
        // Skull markers along path
        for (const sx of [400, 900, 1400, 1900]) {
          const sy = H9 / 2;
          this.objectLayer.fillStyle(0xddccbb, 0.35);
          this.objectLayer.fillCircle(sx, sy, 5);
          // Eye sockets
          this.objectLayer.fillStyle(0x000000, 0.5);
          this.objectLayer.fillCircle(sx - 2, sy - 1, 1.5);
          this.objectLayer.fillCircle(sx + 2, sy - 1, 1.5);
        }
        // Faithful waiting at x≈1960
        this.objectLayer.fillStyle(0x4466bb, 0.2);
        this.objectLayer.fillCircle(1960, H9 / 2 - 10, 12);
        break;
      }

      case 10: {
        const W10 = config.mapWidth;
        const H10 = config.mapHeight;
        // Vanity Fair — colorful market stalls
        const stallPositions = [300, 550, 800, 1050, 1400, 1650, 1900];
        const awningColors = [0xff4444, 0x4488ff, 0xffaa22, 0x44bb44, 0xaa44cc, 0xff6688, 0x44cccc];
        stallPositions.forEach((sx, i) => {
          const sy = H10 / 2 - 30;
          const aw = awningColors[i % awningColors.length];
          // Stall frame
          this.objectLayer!.fillStyle(0x8b6940, 0.7);
          this.objectLayer!.fillRect(sx - 18, sy, 3, 40);
          this.objectLayer!.fillRect(sx + 15, sy, 3, 40);
          // Awning
          this.objectLayer!.fillStyle(aw, 0.55);
          this.objectLayer!.fillRect(sx - 20, sy - 8, 40, 8);
          this.objectLayer!.fillStyle(0xffffff, 0.12);
          this.objectLayer!.fillRect(sx - 20, sy - 8, 40, 3);
          // Hanging goods
          for (let g = 0; g < 3; g++) {
            this.objectLayer!.fillStyle(aw, 0.4);
            this.objectLayer!.fillRect(sx - 12 + g * 10, sy + 5, 5, 8);
          }
        });
        // Judge's platform (Lord Hate-good) at x≈1750
        const judgeX = W10 - 650;
        const judgeY = H10 / 2 - 60;
        this.objectLayer.fillStyle(0x333344, 0.85);
        this.objectLayer.fillRect(judgeX - 40, judgeY, 80, 50);
        // Platform steps
        for (let s = 0; s < 3; s++) {
          this.objectLayer.fillStyle(0x444455, 0.6);
          this.objectLayer.fillRect(judgeX - 30 + s * 5, judgeY + 50 + s * 5, 60 - s * 10, 5);
        }
        // Judge's chair silhouette
        this.objectLayer.fillStyle(0x1a1028, 0.9);
        this.objectLayer.fillRect(judgeX - 10, judgeY + 5, 20, 30);
        this.objectLayer.fillRect(judgeX - 12, judgeY + 3, 24, 6);
        // Flag on platform
        this.objectLayer.fillStyle(0xaa0000, 0.7);
        this.objectLayer.fillRect(judgeX + 35, judgeY - 20, 1, 25);
        this.objectLayer.fillTriangle(judgeX + 36, judgeY - 20, judgeX + 48, judgeY - 13, judgeX + 36, judgeY - 6);
        break;
      }

      case 11: {
        const W11 = config.mapWidth;
        const H11 = config.mapHeight;
        // Doubting Castle — imposing castle structure
        const castleX = W11 / 2 - 80;
        const castleY = 40;
        const castleW = 160;
        const castleH = H11 - 80;
        // Castle walls
        this.objectLayer.fillStyle(0x2a2830, 0.9);
        this.objectLayer.fillRect(castleX, castleY, castleW, castleH);
        // Battlements (top)
        for (let b = 0; b < 10; b++) {
          this.objectLayer.fillStyle(b % 2 === 0 ? 0x3a3840 : 0x1a1820, 0.9);
          this.objectLayer.fillRect(castleX + b * 16, castleY - 8, 10, 10);
        }
        // Two towers flanking
        for (const tx of [castleX - 20, castleX + castleW + 5]) {
          this.objectLayer.fillStyle(0x1e1c24, 0.92);
          this.objectLayer.fillRect(tx, castleY - 30, 25, castleH + 30);
          // Tower battlements
          for (let tb = 0; tb < 4; tb++) {
            this.objectLayer.fillStyle(tb % 2 === 0 ? 0x2e2c34 : 0x0e0c14, 0.9);
            this.objectLayer.fillRect(tx + tb * 6, castleY - 38, 5, 10);
          }
        }
        // Portcullis gate
        const gX = W11 / 2;
        const gY = H11 / 2 + 20;
        this.objectLayer.fillStyle(0x0a0808, 0.95);
        this.objectLayer.fillRect(gX - 12, gY - 30, 24, 30);
        this.objectLayer.fillCircle(gX, gY - 30, 12);
        // Portcullis bars
        this.objectLayer.lineStyle(1, 0x553322, 0.8);
        for (let bar = -10; bar <= 10; bar += 5) {
          this.objectLayer.lineBetween(gX + bar, gY - 30, gX + bar, gY);
        }
        // Arrow-slit windows
        for (let row = 0; row < 3; row++) {
          for (let col = 0; col < 3; col++) {
            this.objectLayer.fillStyle(0xff8800, 0.08);
            this.objectLayer.fillRect(castleX + 20 + col * 40, castleY + 20 + row * 50, 6, 14);
          }
        }
        // Dungeon pit (x:200, y:600 — tall map)
        this.objectLayer.fillStyle(0x080610, 0.95);
        this.objectLayer.fillRect(150, H11 - 200, 120, 150);
        // Iron bars
        this.objectLayer.lineStyle(2, 0x554433, 0.85);
        for (let bar = 0; bar < 5; bar++) {
          this.objectLayer.lineBetween(150 + bar * 24, H11 - 200, 150 + bar * 24, H11 - 50);
        }
        // Key of Promise — faint glow at x:200, y:H-250
        this.objectLayer.fillStyle(0xffd700, 0.15);
        this.objectLayer.fillCircle(200, H11 - 250, 10);
        this.objectLayer.fillStyle(0xffd700, 0.3);
        this.objectLayer.fillCircle(200, H11 - 250, 4);
        break;
      }

      case 12: {
        const H12 = config.mapHeight;
        // Zone 1: Enchanted Ground (x:0-1000) — dreamy flowers
        for (let i = 0; i < 15; i++) {
          const hash12 = (i * 131 + 12 * 17) & 0xffff;
          const fx = 50 + (hash12 % 900);
          const fy = H12 / 2 + 10 + ((hash12 * 3) % 60) - 30;
          this.objectLayer.fillStyle(0xffaacc, 0.2);
          this.objectLayer.fillCircle(fx, fy, 4 + (hash12 % 4));
          this.objectLayer.fillStyle(0xffffff, 0.1);
          this.objectLayer.fillCircle(fx, fy, 2);
        }
        // Zone 2: River of Death (x:1000-2000) — river visual
        this.objectLayer.fillStyle(0x1a3a6a, 0.5);
        this.objectLayer.fillRect(1000, H12 / 2 - 40, 1000, 80);
        // River ripple highlights
        for (let r = 0; r < 8; r++) {
          const hash12r = (r * 89 + 12) & 0xff;
          const rx = 1050 + (hash12r % 880);
          this.objectLayer.fillStyle(0x4488cc, 0.15);
          this.objectLayer.fillEllipse(rx, H12 / 2, 30 + (hash12r % 20), 5);
        }
        // Stepping stones
        for (let s = 0; s < 6; s++) {
          const stoneX = 1060 + s * 155;
          this.objectLayer.fillStyle(0x888880, 0.7);
          this.objectLayer.fillEllipse(stoneX, H12 / 2 + 10, 22, 10);
          this.objectLayer.fillStyle(0xaaaaaa, 0.3);
          this.objectLayer.fillEllipse(stoneX - 3, H12 / 2 + 7, 12, 5);
        }
        // Zone 3: Celestial City gates (x:2000-3000)
        const gateX12 = 2200;
        const gateY12 = 40;
        // Gate arch columns
        this.objectLayer.fillStyle(0xffd700, 0.8);
        this.objectLayer.fillRect(gateX12 - 60, gateY12, 12, 140);
        this.objectLayer.fillRect(gateX12 + 48, gateY12, 12, 140);
        // Arch top
        this.objectLayer.fillStyle(0xffd700, 0.7);
        this.objectLayer.fillRect(gateX12 - 60, gateY12, 120, 12);
        this.objectLayer.fillCircle(gateX12, gateY12, 60);
        // Inner arch glow
        this.objectLayer.fillStyle(0xffffff, 0.1);
        this.objectLayer.fillCircle(gateX12, gateY12, 45);
        this.objectLayer.fillStyle(0xfffacc, 0.06);
        this.objectLayer.fillCircle(gateX12, gateY12, 70);
        // Radiating light beams
        for (let beam = 0; beam < 8; beam++) {
          const angle = (beam / 8) * Math.PI * 2;
          const bLen = 100;
          this.objectLayer.fillStyle(0xffd700, 0.04);
          this.objectLayer.fillTriangle(
            gateX12, gateY12,
            gateX12 + Math.cos(angle - 0.15) * bLen,
            gateY12 + Math.sin(angle - 0.15) * bLen,
            gateX12 + Math.cos(angle + 0.15) * bLen,
            gateY12 + Math.sin(angle + 0.15) * bLen,
          );
        }
        // Golden road leading to gate
        this.objectLayer.fillStyle(0xffd700, 0.12);
        this.objectLayer.fillRect(2000, H12 / 2 - 15, 300, 30);
        this.objectLayer.fillStyle(0xffd700, 0.08);
        this.objectLayer.fillRect(1800, H12 / 2 - 20, 200, 40);
        // Shining Ones near gate
        for (const soX of [2080, 2330]) {
          this.objectLayer.fillStyle(0xffffff, 0.2);
          this.objectLayer.fillCircle(soX, H12 / 2 - 15, 8);
          this.objectLayer.fillStyle(0xffd700, 0.15);
          this.objectLayer.fillCircle(soX, H12 / 2 - 20, 12);
        }
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
    const trunkH = 8 + (hash % 5);
    const sizeMod = 1 + (hash % 3) * 0.15; // slight size variation

    // Trunk shadow
    const trunkColor = chapter === 2 ? 0x2a2018 : 0x3a2a18;
    this.objectLayer.fillStyle(0x000000, 0.2);
    this.objectLayer.fillRect(x - 1, y + 2, 4, trunkH);
    // Trunk
    this.objectLayer.fillStyle(trunkColor, 0.9);
    this.objectLayer.fillRect(x - 2, y, 4, trunkH);
    // Trunk highlight
    this.objectLayer.fillStyle(0xffffff, 0.08);
    this.objectLayer.fillRect(x - 2, y, 1, trunkH - 2);

    const crownR = Math.round((6 + (hash % 4)) * sizeMod);
    const crownY = y - crownR + 2;
    const crownColors: Record<number, number[]> = {
      1: [0x2a5a2a, 0x3a7a3a, 0x1a4a1a],
      2: [0x1a4a3a, 0x2a5a4a, 0x0a3a2a],
      3: [0x4a7a2a, 0x5a8a3a, 0x3a6a1a],
      5: [0x3a5a2a, 0x4a6a3a, 0x2a4a1a],
    };
    const colors = crownColors[chapter] ?? crownColors[1];

    // Shadow circle (darker, offset down-right)
    this.objectLayer.fillStyle(0x000000, 0.18);
    this.objectLayer.fillCircle(x + 2, crownY + 2, crownR);
    // Main canopy layer
    this.objectLayer.fillStyle(colors[0], 0.85);
    this.objectLayer.fillCircle(x, crownY, crownR);
    // Lighter highlight canopy
    this.objectLayer.fillStyle(colors[1], 0.55);
    this.objectLayer.fillCircle(x - 2, crownY - 2, Math.round(crownR * 0.7));
    // Dark shadow underneath canopy
    this.objectLayer.fillStyle(colors[2], 0.4);
    this.objectLayer.fillCircle(x + 1, crownY + 2, Math.round(crownR * 0.6));
    // Bright highlight dot at top
    this.objectLayer.fillStyle(0xffffff, 0.12);
    this.objectLayer.fillCircle(x - 1, crownY - crownR + 3, Math.max(1, Math.round(crownR * 0.25)));
  }

  private drawTerrainZones(config: ChapterConfig): void {
    if (!this.terrainZoneLayer) return;
    const zones: TerrainZone[] = config.terrainZones ?? [];

    for (const zone of zones) {
      const { x, y, width, height, type } = zone;

      switch (type) {
        case 'elevated': {
          // Lighter ground tint + cast shadow below
          this.terrainZoneLayer.fillStyle(0xffffff, 0.08);
          this.terrainZoneLayer.fillRect(x, y, width, height);
          // Edge highlight (top)
          this.terrainZoneLayer.fillStyle(0xffffff, 0.12);
          this.terrainZoneLayer.fillRect(x, y, width, 2);
          // Drop shadow below
          this.terrainZoneLayer.fillStyle(0x000000, 0.18);
          this.terrainZoneLayer.fillRect(x, y + height, width, 5);
          break;
        }
        case 'water': {
          // Blue semi-transparent overlay
          this.terrainZoneLayer.fillStyle(0x1a4a8a, 0.45);
          this.terrainZoneLayer.fillRect(x, y, width, height);
          // Ripple lines
          for (let r = 0; r < Math.floor(height / 10); r++) {
            const ry = y + 6 + r * 10;
            const hash = (r * 137 + x * 31) & 0xffff;
            this.terrainZoneLayer.fillStyle(0x4488cc, 0.2);
            this.terrainZoneLayer.fillEllipse(x + (hash % (width - 20)) + 10, ry, 20 + (hash % 20), 3);
          }
          // Shoreline edge tint
          this.terrainZoneLayer.fillStyle(0x4499bb, 0.15);
          this.terrainZoneLayer.fillRect(x, y, width, 4);
          this.terrainZoneLayer.fillRect(x, y + height - 4, width, 4);
          break;
        }
        case 'cave': {
          // Dark oppressive tint
          this.terrainZoneLayer.fillStyle(0x000000, 0.4);
          this.terrainZoneLayer.fillRect(x, y, width, height);
          // Jagged stalactites (top edge)
          for (let s = 0; s < Math.floor(width / 12); s++) {
            const hash = (s * 113 + y * 7) & 0xff;
            const sx2 = x + s * 12;
            const sh = 4 + (hash % 10);
            this.terrainZoneLayer.fillStyle(0x1a1418, 0.8);
            this.terrainZoneLayer.fillTriangle(sx2, y, sx2 + 6, y + sh, sx2 + 12, y);
          }
          // Torch glow pockets
          for (let t = 0; t < Math.floor(width / 80); t++) {
            const tx2 = x + 30 + t * 80;
            this.terrainZoneLayer.fillStyle(0xff8800, 0.06);
            this.terrainZoneLayer.fillCircle(tx2, y + 20, 18);
          }
          break;
        }
        case 'interior': {
          // Floor planks pattern (palace) or stone blocks (dungeon)
          const isPalace = config.chapter === 7;
          if (isPalace) {
            // Warm wood planks
            this.terrainZoneLayer.fillStyle(0xbb8844, 0.12);
            this.terrainZoneLayer.fillRect(x, y, width, height);
            for (let row = 0; row < Math.floor(height / 8); row++) {
              this.terrainZoneLayer.fillStyle(0x000000, 0.04);
              this.terrainZoneLayer.fillRect(x, y + row * 8, width, 1);
              // Plank seams (offset per row)
              const offset = (row % 2) * 20;
              for (let col = 0; col < Math.floor(width / 40); col++) {
                this.terrainZoneLayer.fillRect(x + offset + col * 40, y + row * 8, 1, 8);
              }
            }
          } else {
            // Cold dungeon stone
            this.terrainZoneLayer.fillStyle(0x2a2830, 0.15);
            this.terrainZoneLayer.fillRect(x, y, width, height);
            for (let row = 0; row < Math.floor(height / 10); row++) {
              for (let col = 0; col < Math.floor(width / 14); col++) {
                this.terrainZoneLayer.fillStyle(0x000000, 0.06);
                this.terrainZoneLayer.fillRect(x + col * 14 + (row % 2) * 7, y + row * 10, 13, 9);
              }
            }
          }
          break;
        }
        case 'bridge': {
          // Narrow wooden/stone platform
          this.terrainZoneLayer.fillStyle(0x7a6040, 0.7);
          this.terrainZoneLayer.fillRect(x, y, width, height);
          // Plank lines
          for (let p = 0; p < Math.floor(width / 10); p++) {
            this.terrainZoneLayer.fillStyle(0x000000, 0.08);
            this.terrainZoneLayer.fillRect(x + p * 10, y, 1, height);
          }
          // Rope/railing lines
          this.terrainZoneLayer.fillStyle(0xaa8855, 0.5);
          this.terrainZoneLayer.fillRect(x, y - 3, width, 2);
          this.terrainZoneLayer.fillRect(x, y + height + 1, width, 2);
          break;
        }
        case 'pit': {
          // Very dark abyss
          this.terrainZoneLayer.fillStyle(0x000000, 0.7);
          this.terrainZoneLayer.fillRect(x, y, width, height);
          // Warning edge glow (red)
          this.terrainZoneLayer.fillStyle(0x880000, 0.2);
          this.terrainZoneLayer.fillRect(x, y, width, 3);
          this.terrainZoneLayer.fillRect(x, y, 3, height);
          this.terrainZoneLayer.fillRect(x + width - 3, y, 3, height);
          // Depth gradient
          this.terrainZoneLayer.fillStyle(0x000000, 0.3);
          this.terrainZoneLayer.fillRect(x + 3, y + 3, width - 6, height - 6);
          break;
        }
      }
    }
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
    // Use a brighter path color blended from theme + gold so it's always visible
    const themeColor = config.theme.pathColor;
    const goldColor = 0xd4a853;
    const stoneTan = 0xc8a870; // warm tan stone path color

    for (let i = 0; i < 30; i++) {
      const t = i / 30;
      const px = config.spawn.x + Math.sin(t * 3) * 6;
      const py = config.spawn.y - i * (config.mapHeight / 30);
      const w = 14 + Math.sin(i * 0.3) * 3;

      if (py < 0) break;

      // Base stone/tan path (broader, warmer)
      this.decorLayer.fillStyle(stoneTan, 0.45 + t * 0.2);
      this.decorLayer.fillEllipse(px, py, w + 2, 8);
      // Theme-colored tint on top
      this.decorLayer.fillStyle(themeColor, 0.3 + t * 0.15);
      this.decorLayer.fillEllipse(px, py, w, 7);
      // Gold shimmer overlay — holy path feel
      this.decorLayer.fillStyle(goldColor, 0.20 + t * 0.14);
      this.decorLayer.fillEllipse(px, py, w - 3, 5);
      // Worn center track (slightly darker)
      this.decorLayer.fillStyle(0x000000, 0.08);
      this.decorLayer.fillEllipse(px, py, 4, 3);
      // Path edge stones (small dots on sides)
      const hash = ((i * 37 + config.chapter * 13) * 17) & 0xff;
      if (hash < 80) {
        this.decorLayer.fillStyle(0x888866, 0.4);
        this.decorLayer.fillCircle(px - w / 2 + 1, py, 1);
        this.decorLayer.fillCircle(px + w / 2 - 1, py, 1);
      }
      // Small wildflowers near path
      if ((hash & 0x3f) < 20) {
        const flowerColors = [0xffffff, 0xffd700, 0xffeeaa];
        this.decorLayer.fillStyle(flowerColors[hash % flowerColors.length], 0.5);
        this.decorLayer.fillCircle(px - w / 2 - 2, py + ((hash % 3) - 1), 1);
      }
    }

    (config.exits ?? []).forEach(exit => {
      const ex = exit.x + exit.width / 2;
      const ey = exit.y + exit.height / 2;

      for (let i = 0; i < 10; i++) {
        const t = i / 10;
        const px = ex + (1 - t) * Math.sin(t * 2) * 4;
        const py = ey - (1 - t) * i * 12;
        this.decorLayer!.fillStyle(goldColor, 0.12 + t * 0.12);
        this.decorLayer!.fillEllipse(px, py, 9, 5);
      }
    });
  }

  private drawExitIndicators(config: ChapterConfig): void {
    if (!this.objectLayer) return;
    (config.exits ?? []).forEach(exit => {
      const cx = exit.x + exit.width / 2;
      const cy = exit.y + exit.height / 2;

      this.objectLayer!.fillStyle(0xd4a853, 0.18);
      this.objectLayer!.fillEllipse(cx, cy, exit.width + 10, exit.height + 10);

      for (let i = 0; i < 3; i++) {
        this.objectLayer!.lineStyle(1, 0xd4a853, 0.22 - i * 0.06);
        this.objectLayer!.strokeEllipse(cx, cy, exit.width + 6 + i * 8, exit.height + 6 + i * 8);
      }

      this.objectLayer!.fillStyle(0xd4a853, 0.7);
      this.objectLayer!.fillTriangle(cx, cy - 12, cx - 4, cy - 6, cx + 4, cy - 6);
    });
  }

  getColliders(): Phaser.Physics.Arcade.StaticGroup | null {
    return this.colliders;
  }

  /** Per-chapter sky gradient colors [top, bottom] */
  private static readonly SKY_PALETTE: Record<number, [number, number]> = {
    1:  [0x1a1020, 0x3d2010], // City of Destruction: dark ember sky
    2:  [0x111828, 0x1e2d3a], // Slough of Despond: murky overcast
    3:  [0x0d2240, 0x2a5878], // Straight & Narrow: clear blue day
    4:  [0x1a2e4a, 0x3a6478], // Hill Difficulty: pale haze
    5:  [0x1e1228, 0x3a2218], // Interpreter's House: warm dusk
    6:  [0x261a06, 0x5a4210], // Cross / Celestial: golden radiance
    7:  [0x10181e, 0x1e2a30], // Palace Beautiful: twilight blue
    8:  [0x0a0610, 0x160c18], // Apollyon: oppressive dark
    9:  [0x080408, 0x120810], // Valley of Shadow: near-black
    10: [0x182030, 0x2e4260], // Vanity Fair: cold city night
    11: [0x0e1a28, 0x203850], // Enchanted Ground: hazy mist
    12: [0x1a1a30, 0x403868], // Celestial City approach: deep purple-blue
  };

  private drawParallaxBackground(config: ChapterConfig): void {
    const { mapWidth: W, mapHeight: H, theme } = config;
    const ch = config.chapter;

    // ── Layer 1: Sky (depth -4, scrollFactor 0.05) ──
    const sky = this.scene.add.graphics().setDepth(-4).setScrollFactor(0.05, 0.02);
    const [skyTop, skyBottom] = TileMapManager.SKY_PALETTE[ch] ?? [0x0d1a2e, 0x1e3a50];
    const strips = 20;
    for (let i = 0; i < strips; i++) {
      const t = i / strips;
      sky.fillStyle(this.lerpColor(skyTop, skyBottom, t), 1);
      sky.fillRect(0, Math.floor(t * H), W, Math.ceil(H / strips) + 1);
    }
    // Stars (visible for night/dark chapters)
    if ([1, 8, 9, 11, 12].includes(ch)) {
      const starCount = ch === 12 ? 80 : 50;
      for (let i = 0; i < starCount; i++) {
        const hash = ((i * 127 + ch * 37) * 31) & 0xffff;
        const sx = hash % W;
        const sy = (hash * 3) % (H * 0.55);
        const brightness = 0.35 + (hash % 10) * 0.06;
        const size = 0.5 + (hash % 3) * 0.35;
        sky.fillStyle(0xffffff, brightness);
        sky.fillCircle(sx, sy, size);
      }
    }
    // Moon for night chapters
    if (ch === 1 || ch === 8 || ch === 9 || ch === 11) {
      const mx = W * 0.75;
      const my = H * 0.12;
      sky.fillStyle(0xeeddcc, 0.5);
      sky.fillCircle(mx, my, 10);
      sky.fillStyle(0xffeedd, 0.3);
      sky.fillCircle(mx, my, 7);
      sky.fillStyle(0xffffff, 0.2);
      sky.fillCircle(mx, my, 4);
      // Moon glow
      sky.fillStyle(0xddccbb, 0.06);
      sky.fillCircle(mx, my, 22);
    }
    // Sun for daytime chapters
    if (ch === 3 || ch === 4 || ch === 7) {
      const sx2 = W * 0.7;
      const sy2 = H * 0.12;
      sky.fillStyle(0xffffaa, 0.7);
      sky.fillCircle(sx2, sy2, 10);
      sky.fillStyle(0xffd700, 0.15);
      sky.fillCircle(sx2, sy2, 22);
      sky.fillStyle(0xffeeaa, 0.07);
      sky.fillCircle(sx2, sy2, 38);
    }
    // Holy light beams for celestial chapters
    if (ch === 6 || ch === 12) {
      const lx = W * 0.5;
      sky.fillStyle(0xffd700, 0.06);
      sky.fillTriangle(lx - 90, 0, lx, H * 0.75, lx + 90, 0);
      sky.fillStyle(0xffeedd, 0.04);
      sky.fillTriangle(lx - 45, 0, lx, H * 0.55, lx + 45, 0);
      sky.fillStyle(0xffffff, 0.02);
      sky.fillTriangle(lx - 20, 0, lx, H * 0.4, lx + 20, 0);
    }
    // Sunrise glow for Ch5 (Interpreter's House at dusk)
    if (ch === 5) {
      const hx = W * 0.4;
      sky.fillStyle(0xff8800, 0.06);
      sky.fillCircle(hx, H * 0.35, 55);
      sky.fillStyle(0xffaa44, 0.04);
      sky.fillCircle(hx, H * 0.35, 80);
    }
    this.parallaxLayers.push(sky);

    // ── Layer 2: Far mountains/structures (depth -3, scrollFactor 0.12) ──
    const far = this.scene.add.graphics().setDepth(-3).setScrollFactor(0.12, 0.04);
    // Mountain colors derived from sky bottom with a slight tint
    const mtBase = this.lerpColor(skyBottom, theme.groundBase, 0.35);
    const mtColor = this.darkenColor(mtBase, 0.55);
    const mtHighlight = this.lerpColor(mtColor, 0xffffff, 0.12);

    // Draw mountain range
    for (let x = -20; x < W + 40; x += 35) {
      const hash = ((x * 31 + ch * 13) * 17) & 0xff;
      const h = 30 + (hash % 50);
      const w = 50 + (hash % 40);
      far.fillStyle(mtColor, 0.6);
      far.fillTriangle(x, H, x + w / 2, H - h, x + w, H);
      // Snow cap / highlight
      if (h > 50 || ch === 6 || ch === 12) {
        far.fillStyle(mtHighlight, 0.3);
        far.fillTriangle(x + w / 2 - 5, H - h + 8, x + w / 2, H - h, x + w / 2 + 5, H - h + 8);
      }
    }

    // Chapter-specific far elements
    if (ch === 1) {
      // Distant burning city
      for (let i = 0; i < 6; i++) {
        const bx = 50 + i * 80 + (i * 37 % 20);
        const bh = 25 + (i * 13 % 20);
        far.fillStyle(0x3a2a1a, 0.5);
        far.fillRect(bx, H - bh - 20, 12, bh);
        far.fillStyle(0xff6600, 0.12);
        far.fillCircle(bx + 6, H - bh - 22, 6 + (i % 3));
        far.fillStyle(0xff4400, 0.08);
        far.fillCircle(bx + 6, H - bh - 26, 4);
      }
    } else if (ch === 5) {
      // Interpreter's house silhouette
      const hx = W * 0.6;
      far.fillStyle(0x2a1a0a, 0.4);
      far.fillRect(hx, H - 60, 50, 40);
      far.fillTriangle(hx - 5, H - 60, hx + 25, H - 80, hx + 55, H - 60);
      // Warm window glow
      far.fillStyle(0xff8800, 0.15);
      far.fillRect(hx + 10, H - 50, 8, 8);
      far.fillRect(hx + 30, H - 50, 8, 8);
    }
    this.parallaxLayers.push(far);

    // ── Layer 3: Mid hills/terrain (depth -2, scrollFactor 0.3) ──
    const mid = this.scene.add.graphics().setDepth(-2).setScrollFactor(0.3, 0.08);
    const hillColor = this.lerpColor(skyBottom, theme.groundBase, 0.5);

    // Rolling hills
    const hillSegments = Math.ceil(W / 12) + 2;
    const hillHeights: number[] = [];
    for (let i = 0; i <= hillSegments; i++) {
      const hash2 = ((i * 53 + ch * 7) * 29) & 0xff;
      hillHeights.push(H - 25 - (hash2 % 40));
    }

    mid.fillStyle(hillColor, 0.75);
    for (let i = 0; i < hillHeights.length - 1; i++) {
      const x1 = i * 12;
      const x2 = (i + 1) * 12;
      mid.fillTriangle(x1, H, x1, hillHeights[i], x2, hillHeights[i + 1]);
      mid.fillTriangle(x1, H, x2, hillHeights[i + 1], x2, H);
    }

    // Add vegetation dots on hills
    const vegColor = ch === 2 ? 0x2a4a3a : (ch === 6 ? 0x5a7a3a : 0x3a5a2a);
    for (let i = 0; i < 30; i++) {
      const hash3 = ((i * 89 + ch * 41) * 23) & 0xffff;
      const vx = hash3 % W;
      const vi = Math.floor(vx / 12);
      if (vi >= hillHeights.length) continue;
      const vy = hillHeights[vi] - 1 - (hash3 % 4);
      mid.fillStyle(vegColor, 0.25 + (hash3 % 10) * 0.02);
      mid.fillCircle(vx, vy, 2 + (hash3 % 3));
    }
    this.parallaxLayers.push(mid);

    // ── Layer 4: Near atmospheric overlay (depth -1, scrollFactor 0.5) ──
    const near = this.scene.add.graphics().setDepth(-1).setScrollFactor(0.5, 0.15);
    const nearColor = this.lerpColor(theme.groundBase, 0x000000, 0.3);

    // Foreground bushes/terrain details
    for (let x = -10; x < W + 20; x += 25) {
      const hash4 = ((x * 71 + ch * 19) * 43) & 0xffff;
      const bw = 15 + (hash4 % 20);
      const bh = 8 + (hash4 % 10);
      const by = H - bh / 2 - 5;
      near.fillStyle(nearColor, 0.5);
      near.fillEllipse(x + bw / 2, by, bw, bh);
    }

    // Chapter atmospheric effects
    if (ch === 2) {
      // Swamp mist
      for (let i = 0; i < 6; i++) {
        const hash5 = ((i * 137 + 11) * 31) & 0xffff;
        near.fillStyle(0x3a5a4a, 0.08);
        near.fillEllipse(hash5 % W, H - 20 - (hash5 % 30), 60 + (hash5 % 40), 15);
      }
    } else if (ch === 9) {
      // Shadow of death darkness
      near.fillStyle(0x0a0008, 0.3);
      near.fillRect(0, 0, W, H);
    }
    this.parallaxLayers.push(near);

    // ── Vignette overlay (depth 3, fixed to camera) ──
    const vignette = this.scene.add.graphics().setDepth(3).setScrollFactor(0);
    const vigW = GAME_WIDTH + 4;
    const vigH = GAME_HEIGHT + 4;
    const vigAlpha = ch === 9 ? 0.25 : (ch === 1 || ch === 8 ? 0.15 : 0.1);
    // Top/bottom gradient strips
    for (let i = 0; i < 8; i++) {
      const t = i / 8;
      vignette.fillStyle(0x000000, vigAlpha * (1 - t));
      vignette.fillRect(-2, -2 + i * 6, vigW, 6);
      vignette.fillRect(-2, vigH - 8 - i * 6, vigW, 6);
    }
    // Side vignettes
    for (let i = 0; i < 5; i++) {
      const t = i / 5;
      vignette.fillStyle(0x000000, vigAlpha * 0.6 * (1 - t));
      vignette.fillRect(-2 + i * 6, -2, 6, vigH);
      vignette.fillRect(vigW - 8 - i * 6, -2, 6, vigH);
    }
    this.parallaxLayers.push(vignette);
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
    this.parallaxLayers.forEach(l => l.destroy());
    this.parallaxLayers = [];
    this.groundLayer?.destroy(); this.groundLayer = null;
    this.decorLayer?.destroy(); this.decorLayer = null;
    this.terrainZoneLayer?.destroy(); this.terrainZoneLayer = null;
    this.objectLayer?.destroy(); this.objectLayer = null;
    this.fogLayer?.destroy(); this.fogLayer = null;
    this.colliders?.destroy(true, true); this.colliders = null;
  }
}
