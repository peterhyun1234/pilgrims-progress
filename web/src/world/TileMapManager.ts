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
          this.drawGroundTile(x, y, theme, config.chapter);
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

  private drawGroundTile(x: number, y: number, theme: ChapterTheme, chapter = 0): void {
    if (!this.groundLayer) return;

    // ── Murmur-style deterministic hash ──
    let _h = (x * 0xb5297a4d + y * 0x68e31da4 + 0x1b56c4e9) >>> 0;
    _h ^= _h >>> 16;
    _h = Math.imul(_h, 0x27d4eb2d) >>> 0;
    _h ^= _h >>> 15;
    const hash = _h & 0xffff;

    // ── Base fill with variant scatter ──
    const isVariant = (hash % 9 < 2);
    const base = isVariant ? theme.groundVariant : theme.groundBase;
    this.groundLayer.fillStyle(base, 1);
    this.groundLayer.fillRect(x, y, TILE_SIZE, TILE_SIZE);

    // ── Ambient light tint ──
    if (theme.ambientAlpha > 0) {
      this.groundLayer.fillStyle(theme.ambientLight, theme.ambientAlpha);
      this.groundLayer.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    }

    // ── Subtle shading variation ──
    if ((hash & 0xf) < 3) {
      this.groundLayer.fillStyle(0x000000, 0.07 + ((hash >> 4) & 3) * 0.02);
      this.groundLayer.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    }
    if ((hash & 0x1f) < 2) {
      this.groundLayer.fillStyle(0xffffff, 0.05);
      this.groundLayer.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    }

    // ── Chapter-specific surface details ──
    switch (chapter) {
      case 1: {
        // City of Destruction — cracked cobblestone, scorch marks, ash
        // 8×8 cobblestone grid with mortar lines
        const stoneW = 8, stoneH = 8;
        for (let row = 0; row < TILE_SIZE / stoneH; row++) {
          for (let col = 0; col < TILE_SIZE / stoneW; col++) {
            const sh = ((x + col * stoneW) * 0xb5297a4d + (y + row * stoneH) * 0x68e31da4) >>> 0;
            const sv = (sh & 7) - 3;
            const stoneCol = ((0x5a + sv) << 16) | ((0x50 + sv) << 8) | (0x48 + sv);
            this.groundLayer.fillStyle(stoneCol, 0.9);
            this.groundLayer.fillRect(x + col * stoneW + 1, y + row * stoneH + 1, stoneW - 1, stoneH - 1);
          }
        }
        // Mortar grid lines (darker)
        this.groundLayer.fillStyle(0x2a2218, 0.4);
        for (let g = 0; g <= TILE_SIZE; g += stoneW) this.groundLayer.fillRect(x + g, y, 1, TILE_SIZE);
        for (let g = 0; g <= TILE_SIZE; g += stoneH) this.groundLayer.fillRect(x, y + g, TILE_SIZE, 1);
        // Scorch marks on every 3rd column
        if (((x / TILE_SIZE) % 3 === 0) && (hash & 0xff) < 60) {
          this.groundLayer.fillStyle(0x1a1008, 0.5);
          this.groundLayer.fillRect(x + 2 + (hash % 6), y + 2 + ((hash >> 3) % 6), 3, 3);
          // Ember glow in scorch
          this.groundLayer.fillStyle(0xff4400, 0.15);
          this.groundLayer.fillCircle(x + 3 + (hash % 6), y + 3 + ((hash >> 3) % 6), 1);
        }
        // Stone cracks (diagonal broken lines)
        if ((hash & 0x3fff) < 35) {
          const crx = x + 2 + ((hash >> 4) % (TILE_SIZE - 8));
          const cry = y + 2 + ((hash >> 7) % (TILE_SIZE - 7));
          this.groundLayer.lineStyle(0.5, 0x1a1208, 0.5);
          this.groundLayer.lineBetween(crx, cry, crx + 3, cry + 1);
          this.groundLayer.lineBetween(crx + 3, cry + 1, crx + 4, cry);
          this.groundLayer.lineBetween(crx + 4, cry, crx + 6, cry + 2);
        }
        // Ash particles (1-2 tiny white dots)
        if ((hash & 0x7ff) < 14) {
          this.groundLayer.fillStyle(0xffffff, 0.4);
          this.groundLayer.fillRect(x + (hash % 14), y + ((hash >> 4) % 12), 1, 1);
        }
        // Oil slick sheen (rainbow-like pale overlay)
        if ((hash & 0x1fff) < 8) {
          const oilColors = [0x8844cc, 0x4488cc, 0x44cc88, 0xcc8844];
          this.groundLayer.fillStyle(oilColors[hash % oilColors.length], 0.07);
          this.groundLayer.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        }
        break;
      }
      case 2: {
        // Slough of Despond — uneven mud, puddles, reeds, bubbles
        // Mud oval patches
        const mudCount = 2 + (hash % 3);
        for (let m = 0; m < mudCount; m++) {
          const mh = ((hash * (m + 3) * 11) + x + y) & 0xffff;
          const mudColors = [0x2e3828, 0x364030, 0x28302a];
          this.groundLayer.fillStyle(mudColors[m % mudColors.length], 0.3);
          this.groundLayer.fillEllipse(x + 1 + (mh % 10), y + 1 + ((mh >> 4) % 10), 5 + (mh % 5), 3 + (mh % 3));
        }
        // Standing water puddles
        if ((hash & 0xff) < 20) {
          this.groundLayer.fillStyle(0x2a3a4a, 0.28);
          const pw = 5 + (hash % 6), ph2 = 2 + (hash % 3);
          this.groundLayer.fillEllipse(x + 2 + (hash % 9), y + 3 + ((hash >> 4) % 9), pw, ph2);
          // Highlight on puddle
          this.groundLayer.fillStyle(0x8899aa, 0.15);
          this.groundLayer.fillEllipse(x + 2 + (hash % 9) - 1, y + 2 + ((hash >> 4) % 9), pw * 0.5, 1);
        }
        // Reed tufts at edges
        if ((hash & 0xfff) < 12) {
          const rx = x + (hash % 12) + 1;
          const ry = y + ((hash >> 3) % 8) + 1;
          this.groundLayer.fillStyle(0x446644, 0.5);
          this.groundLayer.fillRect(rx, ry, 1, 5);
          this.groundLayer.fillRect(rx + 2, ry + 1, 1, 4);
          this.groundLayer.fillStyle(0x335533, 0.4);
          this.groundLayer.fillRect(rx - 1, ry + 2, 1, 3);
        }
        // Wet footprints (darker ovals in regular pattern)
        if ((hash & 0x3fff) < 10) {
          this.groundLayer.fillStyle(0x1e2820, 0.22);
          this.groundLayer.fillEllipse(x + (hash % 10) + 2, y + ((hash >> 4) % 10) + 3, 3, 2);
        }
        // Bubbling mud circles
        if ((hash & 0x1fff) < 8) {
          const bx = x + (hash % 12) + 2, by = y + ((hash >> 3) % 10) + 3;
          this.groundLayer.fillStyle(0x2a3828, 0.5);
          this.groundLayer.fillCircle(bx, by, 2);
          this.groundLayer.fillStyle(0xaabbaa, 0.12);
          this.groundLayer.fillCircle(bx - 1, by - 1, 0.8);
        }
        break;
      }
      case 3: {
        // Hill Difficulty — rocky ground, gravel, exposed roots, slope lines
        // Large irregular stone shapes
        if ((hash & 0xff) < 18) {
          const rw = 5 + (hash % 7), rh = 3 + (hash % 4);
          const rx = x + 2 + (hash % 8), ry = y + 3 + ((hash >> 3) % 8);
          this.groundLayer.fillStyle(0x6a6658, 0.55);
          this.groundLayer.fillEllipse(rx, ry, rw, rh);
          // Stone highlight
          this.groundLayer.fillStyle(0x8a8878, 0.2);
          this.groundLayer.fillEllipse(rx - 1, ry - 1, rw * 0.55, rh * 0.5);
          // Stone shadow
          this.groundLayer.fillStyle(0x3a3830, 0.18);
          this.groundLayer.fillEllipse(rx + 1, ry + 1, rw * 0.6, rh * 0.4);
        }
        // Gravel scatter (1px darker dots)
        if ((hash & 0x7ff) < 25) {
          this.groundLayer.fillStyle(0x4a4840, 0.45);
          this.groundLayer.fillCircle(x + (hash % 14) + 1, y + ((hash >> 4) % 12) + 1, 0.8);
          this.groundLayer.fillCircle(x + (hash % 10) + 3, y + ((hash >> 6) % 10) + 4, 0.7);
        }
        // Exposed root lines (thin curving brown)
        if ((hash & 0x3fff) < 10) {
          const rootX = x + (hash % 12) + 1;
          const rootY = y + ((hash >> 4) % 10) + 3;
          this.groundLayer.lineStyle(0.8, 0x5a3a18, 0.35);
          this.groundLayer.lineBetween(rootX, rootY, rootX + 4, rootY + 1);
          this.groundLayer.lineBetween(rootX + 4, rootY + 1, rootX + 5, rootY - 1);
        }
        // Sparse dry grass tufts
        if ((hash & 0x1fff) < 12) {
          const tgx = x + (hash % 12) + 1, tgy = y + ((hash >> 5) % 10) + 2;
          this.groundLayer.fillStyle(0x8a8840, 0.4);
          this.groundLayer.fillRect(tgx, tgy, 1, 3);
          this.groundLayer.fillStyle(0xaaaa55, 0.35);
          this.groundLayer.fillRect(tgx, tgy - 1, 1, 1);
          this.groundLayer.fillRect(tgx + 2, tgy, 1, 2);
        }
        // Slope indication — subtle parallel diagonal lines
        if ((hash & 0x7f) < 12) {
          this.groundLayer.fillStyle(0x000000, 0.05);
          for (let sl = 0; sl < 3; sl++) {
            const slY = y + sl * 5 + (hash % 3);
            this.groundLayer.fillRect(x, slY, TILE_SIZE, 1);
          }
        }
        break;
      }
      case 4: {
        // Palace Beautiful — smooth flagstone, polished, carpet strip, torch glow
        // Flagstone rectangles (8×16 flags)
        const flagW = 16, flagH = 8;
        for (let row2 = 0; row2 < TILE_SIZE / flagH; row2++) {
          for (let col2 = 0; col2 < TILE_SIZE / flagW; col2++) {
            const fh = ((x + col2 * flagW) * 0xb5297a4d + (y + row2 * flagH) * 0x68e31da4) >>> 0;
            const fv = (fh & 7) - 3;
            const flagCol = ((0xd4 + fv) << 16) | ((0xc8 + fv) << 8) | (0xa8 + fv);
            this.groundLayer.fillStyle(flagCol, 1);
            this.groundLayer.fillRect(x + col2 * flagW + 1, y + row2 * flagH + 1, flagW - 1, flagH - 1);
            // Polished shine (diagonal 1px highlight)
            this.groundLayer.fillStyle(0xffffff, 0.1);
            this.groundLayer.fillRect(x + col2 * flagW + 2, y + row2 * flagH + 2, flagW - 4, 1);
            // Gold corner dots
            this.groundLayer.fillStyle(0xd4a853, 0.3);
            this.groundLayer.fillRect(x + col2 * flagW + 1, y + row2 * flagH + 1, 1, 1);
          }
        }
        // Grout lines
        this.groundLayer.fillStyle(0xa89070, 0.4);
        for (let g2 = 0; g2 <= TILE_SIZE; g2 += flagH) this.groundLayer.fillRect(x, y + g2, TILE_SIZE, 1);
        for (let g2 = 0; g2 <= TILE_SIZE; g2 += flagW) this.groundLayer.fillRect(x + g2, y, 1, TILE_SIZE);
        // Carpet strip (center 3px strip with zigzag)
        if (Math.abs((x + TILE_SIZE / 2) - Math.round((x + TILE_SIZE / 2) / 64) * 64) < 8) {
          this.groundLayer.fillStyle(0x880044, 0.4);
          this.groundLayer.fillRect(x + TILE_SIZE / 2 - 1, y, 3, TILE_SIZE);
          // Zigzag pattern on carpet
          for (let zz = 0; zz < TILE_SIZE; zz += 3) {
            this.groundLayer.fillStyle(0xcc6688, 0.25);
            this.groundLayer.fillRect(x + TILE_SIZE / 2 - 1 + (zz % 2), y + zz, 1, 2);
          }
        }
        // Torch light glow (warm orange on some tiles)
        if ((hash & 0xff) < 10) {
          this.groundLayer.fillStyle(0xff8800, 0.06);
          this.groundLayer.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        }
        break;
      }
      case 5: {
        // Interpreter's House — warm floor with light glow
        // Stone floor planks
        this.groundLayer.fillStyle(0x3a2a18, 0.12);
        this.groundLayer.fillRect(x, y + TILE_SIZE / 2, TILE_SIZE, 1);
        // Warm light overlay
        if ((hash & 0xff) < 18) {
          this.groundLayer.fillStyle(0xff8800, 0.05 + ((hash >> 6) & 3) * 0.01);
          this.groundLayer.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        }
        // Small hearth embers (tiny orange dots)
        if ((hash & 0x7ff) < 12) {
          this.groundLayer.fillStyle(0xff6600, 0.35);
          this.groundLayer.fillCircle(x + (hash % 12) + 2, y + ((hash >> 4) % 10) + 3, 0.7);
        }
        break;
      }
      case 6: {
        // Valley / Cross — lush grass, wildflowers, worn path
        // Varied grass blades
        const bladeCount = 4 + (hash % 4);
        for (let b2 = 0; b2 < bladeCount; b2++) {
          const bh2 = ((hash * (b2 + 5) * 7) + x) & 0xffff;
          const bx = x + 1 + (bh2 % (TILE_SIZE - 3));
          const bladeH = 2 + (bh2 % 3);
          const gc = bh2 % 3 === 0 ? 0x4a8a2a : (bh2 % 3 === 1 ? 0x5a9a38 : 0x3a7820);
          this.groundLayer.fillStyle(gc, 0.6);
          this.groundLayer.fillRect(bx, y + TILE_SIZE - bladeH - 1, 1, bladeH);
        }
        // Wildflowers (5-8 per tile)
        const flowerCount = 4 + (hash % 4);
        for (let f2 = 0; f2 < flowerCount; f2++) {
          const fh2 = ((hash * (f2 + 3) * 11) + y) & 0xffff;
          const fx2 = x + 1 + (fh2 % (TILE_SIZE - 3));
          const fy2 = y + 1 + ((fh2 >> 4) % (TILE_SIZE - 3));
          const flowerCols = [0xffffff, 0xffee44, 0xff88aa, 0xaa88ff, 0xff6688];
          this.groundLayer.fillStyle(flowerCols[fh2 % flowerCols.length], 0.7);
          this.groundLayer.fillCircle(fx2, fy2, 0.8);
        }
        // Clover patches (darker green trefoil-ish)
        if ((hash & 0x7ff) < 15) {
          const clx = x + (hash % 11) + 2, cly = y + ((hash >> 4) % 9) + 2;
          this.groundLayer.fillStyle(0x2e6818, 0.4);
          this.groundLayer.fillCircle(clx, cly, 1.5);
          this.groundLayer.fillCircle(clx + 2, cly, 1.2);
          this.groundLayer.fillCircle(clx + 1, cly - 2, 1.2);
        }
        // Golden light patches
        if ((hash & 0xff) < 20) {
          this.groundLayer.fillStyle(0xffd700, 0.04);
          this.groundLayer.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        }
        break;
      }
      case 7: {
        // Beautiful Palace — same as case 4 (palace flagstone) but warmer
        const flagW7 = 16, flagH7 = 8;
        for (let row7 = 0; row7 < TILE_SIZE / flagH7; row7++) {
          for (let col7 = 0; col7 < TILE_SIZE / flagW7; col7++) {
            const fh7 = ((x + col7 * flagW7) * 0xb5297a4d + (y + row7 * flagH7) * 0x68e31da4) >>> 0;
            const fv7 = (fh7 & 7) - 3;
            const flagCol7 = ((0xb8 + fv7) << 16) | ((0xa8 + fv7) << 8) | (0x88 + fv7);
            this.groundLayer.fillStyle(flagCol7, 1);
            this.groundLayer.fillRect(x + col7 * flagW7 + 1, y + row7 * flagH7 + 1, flagW7 - 1, flagH7 - 1);
            // Polished shine
            this.groundLayer.fillStyle(0xffffff, 0.08);
            this.groundLayer.fillRect(x + col7 * flagW7 + 2, y + row7 * flagH7 + 2, flagW7 - 4, 1);
            this.groundLayer.fillStyle(0xd4a853, 0.25);
            this.groundLayer.fillRect(x + col7 * flagW7 + 1, y + row7 * flagH7 + 1, 1, 1);
          }
        }
        this.groundLayer.fillStyle(0x907060, 0.35);
        for (let g7 = 0; g7 <= TILE_SIZE; g7 += flagH7) this.groundLayer.fillRect(x, y + g7, TILE_SIZE, 1);
        for (let g7 = 0; g7 <= TILE_SIZE; g7 += flagW7) this.groundLayer.fillRect(x + g7, y, 1, TILE_SIZE);
        // Torchlight glow patches
        if ((hash & 0xff) < 12) {
          this.groundLayer.fillStyle(0xffcc44, 0.07);
          this.groundLayer.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        }
        break;
      }
      case 8: {
        // Valley of Humiliation — cracked dark earth, purple mist, bone fragments
        // Cracked earth surface (dark with purple cracks)
        if ((hash & 0xff) < 20) {
          // Crack lines
          this.groundLayer.lineStyle(0.7, 0x3a0055, 0.4);
          const crx8 = x + 2 + ((hash >> 4) % (TILE_SIZE - 8));
          const cry8 = y + 2 + ((hash >> 7) % (TILE_SIZE - 6));
          this.groundLayer.lineBetween(crx8, cry8, crx8 + 3, cry8 + 2);
          this.groundLayer.lineBetween(crx8 + 3, cry8 + 2, crx8 + 5, cry8 + 1);
          this.groundLayer.lineBetween(crx8 + 5, cry8 + 1, crx8 + 7, cry8 + 3);
        }
        // Bone fragments
        if ((hash & 0x7ff) < 14) {
          this.groundLayer.fillStyle(0xc8b8a0, 0.22);
          this.groundLayer.fillRect(x + (hash % 10) + 2, y + ((hash >> 3) % 10) + 3, 4 + (hash % 4), 1);
          this.groundLayer.fillCircle(x + (hash % 10) + 2, y + ((hash >> 3) % 10) + 3, 0.8);
        }
        // Purple mist wisps (corner swirls)
        if ((hash & 0x1fff) < 15) {
          this.groundLayer.fillStyle(0x440066, 0.08);
          this.groundLayer.fillEllipse(x + (hash % 12), y + ((hash >> 3) % 10), 8 + (hash % 5), 3);
        }
        // Skulls in ground pattern (dark on dark)
        if ((hash & 0x3fff) < 6) {
          const sx8 = x + (hash % 9) + 3, sy8 = y + ((hash >> 4) % 7) + 4;
          this.groundLayer.fillStyle(0x2a2035, 0.35);
          this.groundLayer.fillCircle(sx8, sy8, 3);
          this.groundLayer.fillStyle(0x100818, 0.5);
          this.groundLayer.fillCircle(sx8 - 1, sy8 - 0.5, 0.8);
          this.groundLayer.fillCircle(sx8 + 1, sy8 - 0.5, 0.8);
        }
        break;
      }
      case 9: {
        // Valley of Shadow of Death — absolute dark, bones, skull features
        // No life — dead cracked surface
        if ((hash & 0xff) < 18) {
          this.groundLayer.lineStyle(0.5, 0x330055, 0.35);
          const crx9 = x + 2 + ((hash >> 4) % (TILE_SIZE - 8));
          const cry9 = y + 2 + ((hash >> 7) % (TILE_SIZE - 6));
          this.groundLayer.lineBetween(crx9, cry9, crx9 + 4, cry9 + 1);
          this.groundLayer.lineBetween(crx9 + 4, cry9 + 1, crx9 + 6, cry9 - 1);
        }
        // Bone fragments embedded
        if ((hash & 0x7ff) < 12) {
          this.groundLayer.fillStyle(0x9a8870, 0.2);
          this.groundLayer.fillRect(x + (hash % 11) + 1, y + ((hash >> 3) % 10) + 2, 4 + (hash % 3), 1);
          this.groundLayer.fillCircle(x + (hash % 11) + 1, y + ((hash >> 3) % 10) + 2, 0.7);
        }
        // Skull eye-socket features (occasional — dark on dark)
        if ((hash & 0x3fff) < 5) {
          const sx9 = x + (hash % 9) + 2, sy9 = y + ((hash >> 4) % 7) + 3;
          this.groundLayer.fillStyle(0x1e1428, 0.4);
          this.groundLayer.fillCircle(sx9, sy9, 2.8);
          // Eye sockets (slightly darker)
          this.groundLayer.fillStyle(0x080610, 0.55);
          this.groundLayer.fillCircle(sx9 - 1, sy9 - 0.5, 0.7);
          this.groundLayer.fillCircle(sx9 + 1, sy9 - 0.5, 0.7);
        }
        // Dungeon stone grid
        this.groundLayer.fillStyle(0x0c0818, 0.12);
        this.groundLayer.fillRect(x, y + TILE_SIZE / 2, TILE_SIZE, 1);
        this.groundLayer.fillRect(x + TILE_SIZE / 2, y, 1, TILE_SIZE);
        break;
      }
      case 10: {
        // Vanity Fair — colorful cobblestones, market debris, confetti
        // Each 4×4 stone a different hue
        for (let row10 = 0; row10 < TILE_SIZE / 4; row10++) {
          for (let col10 = 0; col10 < TILE_SIZE / 4; col10++) {
            const ch10 = ((x + col10 * 4) * 0xb5297a4d + (y + row10 * 4) * 0x68e31da4) >>> 0;
            const hues = [0x4a3860, 0x503a62, 0x443264, 0x4c3c58, 0x584268, 0x3e3054];
            this.groundLayer.fillStyle(hues[ch10 % hues.length], 0.85);
            this.groundLayer.fillRect(x + col10 * 4 + 1, y + row10 * 4 + 1, 3, 3);
          }
        }
        // Cobblestone joints
        this.groundLayer.fillStyle(0x1a1028, 0.5);
        for (let g10 = 0; g10 <= TILE_SIZE; g10 += 4) this.groundLayer.fillRect(x, y + g10, TILE_SIZE, 1);
        for (let g10 = 0; g10 <= TILE_SIZE; g10 += 4) this.groundLayer.fillRect(x + g10, y, 1, TILE_SIZE);
        // Dropped market items (cloth scraps, coin glints)
        if ((hash & 0xff) < 20) {
          const scraps = [0xff4466, 0x4488ff, 0xffaa22, 0x44cc88, 0xcc44ff];
          this.groundLayer.fillStyle(scraps[hash % scraps.length], 0.35);
          this.groundLayer.fillRect(x + (hash % 12) + 1, y + ((hash >> 3) % 12) + 1, 2, 1);
        }
        // Scuff marks (curved dark)
        if ((hash & 0x3ff) < 18) {
          this.groundLayer.fillStyle(0x0a0818, 0.2);
          this.groundLayer.fillEllipse(x + (hash % 10) + 2, y + ((hash >> 3) % 10) + 3, 5 + (hash % 3), 2);
        }
        // Confetti dots
        if ((hash & 0x1fff) < 20) {
          const confetti = [0xff66aa, 0xffdd00, 0x66ddff, 0xaaffaa, 0xff8866];
          this.groundLayer.fillStyle(confetti[hash % confetti.length], 0.5);
          this.groundLayer.fillRect(x + (hash % 14), y + ((hash >> 4) % 12), 1, 1);
        }
        break;
      }
      case 11: {
        // Doubting Castle — heavy stone floor, deep shadow lines, moss, drip stains
        // Large 8×8 stone blocks
        const blockS = 8;
        for (let row11 = 0; row11 < TILE_SIZE / blockS; row11++) {
          for (let col11 = 0; col11 < TILE_SIZE / blockS; col11++) {
            const bh11 = ((x + col11 * blockS) * 0xb5297a4d + (y + row11 * blockS) * 0x68e31da4) >>> 0;
            const bv11 = (bh11 & 5) - 2;
            const blkCol = ((0x2c + bv11) << 16) | ((0x28 + bv11) << 8) | (0x38 + bv11);
            this.groundLayer.fillStyle(blkCol, 1);
            this.groundLayer.fillRect(x + col11 * blockS + 1, y + row11 * blockS + 1, blockS - 1, blockS - 1);
            // Cold gleam highlight on top edge
            this.groundLayer.fillStyle(0x6688aa, 0.12);
            this.groundLayer.fillRect(x + col11 * blockS + 1, y + row11 * blockS + 1, blockS - 1, 1);
          }
        }
        // Deep shadow joint lines
        this.groundLayer.fillStyle(0x080610, 0.5);
        for (let g11 = 0; g11 <= TILE_SIZE; g11 += blockS) this.groundLayer.fillRect(x, y + g11, TILE_SIZE, 1);
        for (let g11 = 0; g11 <= TILE_SIZE; g11 += blockS) this.groundLayer.fillRect(x + g11, y, 1, TILE_SIZE);
        // Moss in corner cracks
        if ((hash & 0xfff) < 10) {
          this.groundLayer.fillStyle(0x224422, 0.3);
          this.groundLayer.fillCircle(x + (hash % 6) + 1, y + ((hash >> 3) % 6) + 1, 1.3);
        }
        // Water drip stain (vertical streak)
        if ((hash & 0x1fff) < 7) {
          this.groundLayer.fillStyle(0x1e3055, 0.2);
          this.groundLayer.fillRect(x + (hash % 12) + 2, y + 2, 1, 10 + (hash % 4));
        }
        // Iron ring shadow in floor
        if ((hash & 0x3fff) < 4) {
          this.groundLayer.fillStyle(0x3a2818, 0.3);
          this.groundLayer.fillCircle(x + (hash % 10) + 3, y + ((hash >> 4) % 8) + 4, 3);
          this.groundLayer.fillStyle(0x080610, 0.4);
          this.groundLayer.fillCircle(x + (hash % 10) + 3, y + ((hash >> 4) % 8) + 4, 2);
        }
        break;
      }
      case 12: {
        // Celestial City — gold and white marble, pearl inlay, radiant glow
        // Alternating white and pale gold marble tiles
        const isGold = ((Math.floor(x / TILE_SIZE) + Math.floor(y / TILE_SIZE)) % 2 === 0);
        if (isGold) {
          this.groundLayer.fillStyle(0xffd070, 0.1);
          this.groundLayer.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        }
        // Gold grain veins
        if ((hash & 0xff) < 18) {
          this.groundLayer.fillStyle(0xd4a853, 0.08);
          this.groundLayer.fillRect(x + (hash % 14), y + ((hash >> 4) % 12), TILE_SIZE - (hash % 6), 1);
        }
        // Pearl inlay circles between tiles
        if ((hash & 0x7ff) < 15) {
          this.groundLayer.fillStyle(0xffffff, 0.35);
          this.groundLayer.fillCircle(x + (hash % 14) + 1, y + ((hash >> 4) % 12) + 1, 0.7);
        }
        // Radiant glow per tile
        this.groundLayer.fillStyle(0xffd700, 0.04);
        this.groundLayer.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        // Golden sparkle
        if ((hash & 0x3ff) < 8) {
          this.groundLayer.fillStyle(0xffffff, 0.5);
          this.groundLayer.fillRect(x + (hash % 14), y + ((hash >> 4) % 12), 1, 1);
        }
        break;
      }
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
      if ([1, 2, 3, 5, 6, 7].includes(config.chapter) && (type === 0 || type === 1)) {
        this.drawTree(ox, oy, h, config.chapter);
        const tree = this.scene.add.rectangle(ox, oy + 4, 8, 8);
        this.scene.physics.add.existing(tree, true);
        this.colliders!.add(tree);
        tree.setVisible(false);
        // Wildflower clusters near trees in Ch1, Ch3, Ch6
        if ([1, 3, 6].includes(config.chapter) && (h % 3 === 0)) {
          this.drawWildflowerCluster(ox, oy + 8, h, config.chapter);
        }
      } else if (type === 2 || type === 3) {
        this.drawRock(ox, oy, h, config.theme);
        const rock = this.scene.add.rectangle(ox, oy, 10, 8);
        this.scene.physics.add.existing(rock, true);
        this.colliders!.add(rock);
        rock.setVisible(false);
      }
    }
  }

  private drawWildflowerCluster(x: number, y: number, hash: number, chapter: number): void {
    if (!this.objectLayer) return;
    const flowerPalettes: Record<number, number[]> = {
      1: [0xffaa66, 0xff8844, 0xddaa44, 0xff6655], // Ch1: warm ember tones
      3: [0xffeeaa, 0xaaddff, 0xffaacc, 0xaaffaa], // Ch3: bright meadow
      6: [0xffd700, 0xffeedd, 0xffcc88, 0xeeffaa], // Ch6: golden dawn
    };
    const palette = flowerPalettes[chapter] ?? flowerPalettes[3];
    const count = 3 + (hash % 3); // 3-5 flowers
    for (let f = 0; f < count; f++) {
      const fx = x + ((hash * (f + 1) * 7) & 0xf) - 8;
      const fy = y + ((hash * (f + 1) * 11) & 0x7) - 3;
      const fColor = palette[(hash + f) % palette.length];
      // Small stem
      this.objectLayer.fillStyle(0x5a8a3a, 0.6);
      this.objectLayer.fillRect(fx, fy, 1, 3);
      // Flower head
      this.objectLayer.fillStyle(fColor, 0.75);
      this.objectLayer.fillCircle(fx, fy - 1, 1.5);
      // Highlight
      this.objectLayer.fillStyle(0xffffff, 0.2);
      this.objectLayer.fillCircle(fx - 0.5, fy - 1.5, 0.7);
    }
  }

  private drawTree(x: number, y: number, hash: number, chapter: number): void {
    if (!this.objectLayer) return;

    const variant = this.getTreeVariant(chapter, hash);

    if (variant === 'pine') {
      this.drawPineTree(x, y, hash, chapter);
    } else if (variant === 'dead') {
      this.drawDeadTree(x, y, hash);
    } else if (variant === 'palm') {
      this.drawPalmTree(x, y, hash);
    } else if (variant === 'swamp') {
      this.drawSwampTree(x, y, hash);
    } else if (variant === 'meadow') {
      this.drawMeadowTree(x, y, hash);
    } else if (variant === 'paradise') {
      this.drawParadiseTree(x, y, hash);
    } else if (variant === 'celestial') {
      this.drawCelestialTree(x, y, hash);
    } else {
      this.drawRoundTree(x, y, hash, chapter);
    }
  }

  private getTreeVariant(chapter: number, hash: number): 'round' | 'pine' | 'dead' | 'palm' | 'swamp' | 'meadow' | 'paradise' | 'celestial' {
    if (chapter === 12) return 'celestial';
    if (chapter === 10) return 'paradise';
    if (chapter === 6) return 'meadow';
    if (chapter === 2) return 'swamp';
    if (chapter === 8 || chapter === 9) return 'dead';
    if (chapter === 11) return hash % 3 === 0 ? 'dead' : 'pine';
    if (chapter === 4) return hash % 2 === 0 ? 'pine' : 'round';
    return 'round';
  }

  private drawRoundTree(x: number, y: number, hash: number, chapter: number): void {
    if (!this.objectLayer) return;
    const trunkH = 8 + (hash % 5);
    const sizeMod = 1 + (hash % 3) * 0.15;
    const crownR = Math.round((6 + (hash % 4)) * sizeMod);
    const crownY = y - crownR + 2;

    // ── 1. Ground shadow ──
    this.objectLayer.fillStyle(0x000000, 0.35);
    this.objectLayer.fillEllipse(x, y + trunkH / 2, Math.round(crownR * 0.9), 3);

    // ── 2. Trunk with gradient and grain ──
    const trunkColor = chapter === 2 ? 0x2a2018 : 0x3a2a18;
    const trunkLight = chapter === 2 ? 0x3a3028 : 0x5a4030;
    // Trunk drop shadow
    this.objectLayer.fillStyle(0x000000, 0.22);
    this.objectLayer.fillRect(x - 1, y + 2, 4, trunkH);
    // Trunk body
    this.objectLayer.fillStyle(trunkColor, 0.92);
    this.objectLayer.fillRect(x - 2, y, 4, trunkH);
    // Trunk highlight edge (lighter left side)
    this.objectLayer.fillStyle(trunkLight, 0.45);
    this.objectLayer.fillRect(x - 2, y, 1, trunkH - 2);
    // Vertical grain lines (3 lines)
    this.objectLayer.fillStyle(0x000000, 0.2);
    this.objectLayer.fillRect(x, y + 2, 1, trunkH - 3);
    this.objectLayer.fillStyle(0x000000, 0.12);
    this.objectLayer.fillRect(x + 1, y + 3, 1, trunkH - 5);
    // Knot detail near middle
    const knotY = y + Math.floor(trunkH * 0.45);
    this.objectLayer.fillStyle(0x1a1008, 0.6);
    this.objectLayer.fillCircle(x, knotY, 1.5);

    // ── Crown color palette ──
    const crownPalette: Record<number, [number, number, number]> = {
      1: [0x1a4a1a, 0x2d5a1b, 0x4a8a3a],
      2: [0x0a3a2a, 0x1a4a3a, 0x2a6a5a],
      3: [0x3a6a1a, 0x4a7a2a, 0x5a9a3a],
      5: [0x2a4a1a, 0x3a5a2a, 0x4a7a3a],
      6: [0x2a5a1a, 0x3a6a2a, 0x4a8a3a],
      7: [0x3a5a1a, 0x4a6a2a, 0x5a8a3a],
    };
    const [cDark, cMid, cLight] = crownPalette[chapter] ?? crownPalette[1];

    // ── 3. Main foliage — 3 overlapping large circles ──
    // Bottom (darkest — base shadow)
    this.objectLayer.fillStyle(cDark, 0.9);
    this.objectLayer.fillCircle(x, crownY + Math.round(crownR * 0.35), Math.round(crownR * 0.8));
    // Middle (main body)
    this.objectLayer.fillStyle(cMid, 0.88);
    this.objectLayer.fillCircle(x, crownY, crownR);
    // Top-left offset circle (second overlapping blob)
    this.objectLayer.fillStyle(cMid, 0.6);
    this.objectLayer.fillCircle(x - Math.round(crownR * 0.4), crownY - Math.round(crownR * 0.2), Math.round(crownR * 0.72));
    // Right offset blob
    this.objectLayer.fillStyle(cDark, 0.45);
    this.objectLayer.fillCircle(x + Math.round(crownR * 0.45), crownY + Math.round(crownR * 0.1), Math.round(crownR * 0.65));

    // ── 4. Highlight cluster (upper-right) ──
    const hlCount = 5 + (hash % 3);
    for (let h2 = 0; h2 < hlCount; h2++) {
      const hh = ((hash * (h2 + 3) * 17) + chapter) & 0xff;
      const hlAngle = (hh / 255) * Math.PI * 0.9; // upper-right quadrant
      const hlDist = Math.round(crownR * (0.3 + (hh % 5) * 0.1));
      const hlX = x - Math.round(Math.cos(hlAngle) * hlDist);
      const hlY = crownY - Math.round(Math.sin(hlAngle) * hlDist * 0.7);
      this.objectLayer.fillStyle(cLight, 0.45 + (hh % 3) * 0.1);
      this.objectLayer.fillCircle(hlX, hlY, 1 + (hh % 2));
    }

    // ── 5. Canopy edge bumps (break perfect circle silhouette) ──
    const edgeCount = 8 + (hash % 4);
    for (let e = 0; e < edgeCount; e++) {
      const eh = ((hash * (e + 7) * 11) + chapter) & 0xff;
      const eAngle = (e / edgeCount) * Math.PI * 2 + (eh / 255) * 0.4;
      const eR = crownR + 1 + (eh % 3);
      const ex2 = x + Math.round(Math.cos(eAngle) * eR);
      const ey2 = crownY + Math.round(Math.sin(eAngle) * eR * 0.85);
      this.objectLayer.fillStyle(cMid, 0.5);
      this.objectLayer.fillCircle(ex2, ey2, 1 + (eh % 2));
    }

    // ── 6. Berry/flower detail (chapter-specific color) ──
    const berryColors: Record<number, number> = {
      1: 0xff6644, 3: 0xff88aa, 6: 0xffdd66, 7: 0xffaadd,
    };
    const berryColor = berryColors[chapter] ?? 0xdd8844;
    const berryCount = 2 + (hash % 2);
    for (let b = 0; b < berryCount; b++) {
      const bh = ((hash * (b + 11) * 13) + chapter) & 0xff;
      const bAngle = (bh / 255) * Math.PI * 1.8 - 0.3;
      const bDist = Math.round(crownR * (0.35 + (bh % 4) * 0.1));
      const bx2 = x + Math.round(Math.cos(bAngle) * bDist);
      const by2 = crownY + Math.round(Math.sin(bAngle) * bDist * 0.8);
      this.objectLayer.fillStyle(berryColor, 0.7);
      this.objectLayer.fillCircle(bx2, by2, 1);
      this.objectLayer.fillStyle(0xffffff, 0.3);
      this.objectLayer.fillCircle(bx2 - 0.5, by2 - 0.5, 0.5);
    }
  }

  private drawPineTree(x: number, y: number, hash: number, chapter: number): void {
    if (!this.objectLayer) return;
    const trunkH = 6 + (hash % 4);
    const pineH = 18 + (hash % 8);
    const pineW = 8 + (hash % 4);

    // Trunk
    this.objectLayer.fillStyle(0x3a2a18, 0.85);
    this.objectLayer.fillRect(x - 1, y, 3, trunkH);

    // Pine canopy (stacked triangles)
    const pineColor = chapter === 9 || chapter === 8 ? 0x1a2a18 : 0x1a4020;
    const pineHighlight = chapter === 9 || chapter === 8 ? 0x2a3a28 : 0x2a5030;
    const baseY = y - 2;
    for (let layer = 0; layer < 3; layer++) {
      const lw = pineW - layer * 2;
      const lh = pineH / 3;
      const ly = baseY - layer * (lh * 0.7);
      // Shadow
      this.objectLayer.fillStyle(0x000000, 0.15);
      this.objectLayer.fillTriangle(x - lw / 2 + 1, ly + 1, x + 1, ly - lh + 1, x + lw / 2 + 1, ly + 1);
      // Body
      this.objectLayer.fillStyle(pineColor, 0.85);
      this.objectLayer.fillTriangle(x - lw / 2, ly, x, ly - lh, x + lw / 2, ly);
      // Highlight
      this.objectLayer.fillStyle(pineHighlight, 0.4);
      this.objectLayer.fillTriangle(x - lw / 4, ly, x, ly - lh / 2, x, ly);
    }
  }

  private drawDeadTree(x: number, y: number, hash: number): void {
    if (!this.objectLayer) return;
    const tH = 14 + (hash % 8);

    // Main trunk
    this.objectLayer.fillStyle(0x2a2018, 0.8);
    this.objectLayer.fillRect(x - 1, y - tH, 3, tH);
    this.objectLayer.fillStyle(0x3a3028, 0.4);
    this.objectLayer.fillRect(x - 1, y - tH, 1, tH);

    // Bare branches
    const branchAngles = [-0.7, -0.3, 0.4, 0.9, -1.1, 0.6];
    for (let i = 0; i < 4 + (hash % 3); i++) {
      const ba = branchAngles[i % branchAngles.length] + (hash % 5) * 0.1;
      const bLen = 5 + (hash % 4) + i;
      const bStartY = y - tH * (0.4 + i * 0.12);
      const bEndX = x + Math.cos(ba) * bLen;
      const bEndY = bStartY - Math.abs(Math.sin(ba)) * bLen;
      this.objectLayer.lineStyle(1.5, 0x2a2018, 0.75);
      this.objectLayer.lineBetween(x, bStartY, bEndX, bEndY);
      // Sub-branch
      if (bLen > 6) {
        const sbLen = bLen * 0.5;
        this.objectLayer.lineStyle(0.8, 0x2a2018, 0.5);
        this.objectLayer.lineBetween(bEndX, bEndY,
          bEndX + Math.cos(ba + 0.5) * sbLen,
          bEndY - sbLen * 0.4);
      }
    }
  }

  private drawPalmTree(x: number, y: number, hash: number): void {
    if (!this.objectLayer) return;
    const tH = 18 + (hash % 6);

    // Curved trunk (slight lean)
    const lean = (hash % 3 === 0) ? 3 : -2;
    this.objectLayer.lineStyle(3, 0x6b4a20, 0.85);
    this.objectLayer.lineBetween(x, y, x + lean, y - tH);
    this.objectLayer.lineStyle(1, 0x9b7a40, 0.3);
    this.objectLayer.lineBetween(x - 1, y, x + lean - 1, y - tH);
    // Trunk rings
    for (let r = 1; r < 4; r++) {
      const ry = y - tH * (r / 4);
      this.objectLayer.lineStyle(1, 0x4a3010, 0.3);
      this.objectLayer.lineBetween(x + lean * (r / 4) - 1, ry, x + lean * (r / 4) + 2, ry);
    }

    // Palm fronds
    const frondColors = [0x2a6a1a, 0x3a8a2a, 0x1a5a10];
    const tx = x + lean;
    const ty = y - tH;
    const frondAngles = [-0.9, -0.4, 0, 0.4, 0.9, -1.3, 1.3];
    for (let f = 0; f < 6; f++) {
      const fa = frondAngles[f % frondAngles.length];
      const fLen = 8 + (hash % 4);
      const fColor = frondColors[f % frondColors.length];
      this.objectLayer.lineStyle(2, fColor, 0.75);
      this.objectLayer.lineBetween(tx, ty, tx + Math.cos(fa) * fLen, ty - Math.abs(Math.sin(fa)) * fLen - 3);
    }
  }

  private drawSwampTree(x: number, y: number, hash: number): void {
    if (!this.objectLayer) return;
    const tH = 16 + (hash % 8);

    // Gnarled wavy trunk
    this.objectLayer.fillStyle(0x22200a, 0.85);
    this.objectLayer.fillRect(x - 2, y - tH, 4, tH);
    // Wavy grain on trunk
    this.objectLayer.fillStyle(0x181808, 0.4);
    for (let g = 2; g < tH; g += 4) {
      this.objectLayer.fillRect(x - 2 + (g % 2), y - tH + g, 3, 2);
    }
    // Hollow in trunk
    this.objectLayer.fillStyle(0x0a0808, 0.7);
    this.objectLayer.fillEllipse(x, y - Math.floor(tH * 0.55), 3, 2);

    // Ground shadow
    this.objectLayer.fillStyle(0x000000, 0.3);
    this.objectLayer.fillEllipse(x, y + 2, 10, 3);

    // Drooping Spanish moss (thin vertical gray-green lines from branches)
    const branchBaseY = y - tH;
    const branchAngles = [-0.7, -0.2, 0.3, 0.8, -1.0];
    for (let i = 0; i < 4 + (hash % 3); i++) {
      const ba = branchAngles[i % branchAngles.length];
      const bLen = 6 + (hash % 5);
      const bEndX = x + Math.cos(ba) * bLen;
      const bEndY = branchBaseY - Math.abs(Math.sin(ba)) * bLen * 0.5;
      // Bare skeletal branch
      this.objectLayer.lineStyle(1, 0x222010, 0.7);
      this.objectLayer.lineBetween(x, branchBaseY, bEndX, bEndY);
      // Drooping moss strands
      for (let m = 0; m < 3; m++) {
        const mOffX = bEndX + (m - 1) * 2;
        const mLen = 4 + (hash % 5);
        this.objectLayer.lineStyle(0.8, 0x4a5a3a, 0.35);
        this.objectLayer.lineBetween(mOffX, bEndY, mOffX + (hash % 2) - 1, bEndY + mLen);
      }
    }
  }

  private drawMeadowTree(x: number, y: number, hash: number): void {
    if (!this.objectLayer) return;
    const trunkH = 7 + (hash % 4);
    const crownR = 7 + (hash % 4);
    const crownY = y - crownR;

    // Ground shadow
    this.objectLayer.fillStyle(0x000000, 0.25);
    this.objectLayer.fillEllipse(x, y + 2, crownR * 1.2, 3);

    // Trunk — shorter and rounder
    this.objectLayer.fillStyle(0x5a3820, 0.88);
    this.objectLayer.fillRect(x - 2, y - trunkH, 4, trunkH);
    this.objectLayer.fillStyle(0x7a5838, 0.35);
    this.objectLayer.fillRect(x - 2, y - trunkH, 1, trunkH - 2);

    // Round canopy (green with pink/white blossom clusters)
    this.objectLayer.fillStyle(0x2a6818, 0.85);
    this.objectLayer.fillCircle(x, crownY, crownR);
    this.objectLayer.fillStyle(0x3a7828, 0.65);
    this.objectLayer.fillCircle(x - Math.round(crownR * 0.3), crownY - Math.round(crownR * 0.2), Math.round(crownR * 0.7));

    // Pink/white blossom clusters
    const blossomCount = 5 + (hash % 4);
    for (let b = 0; b < blossomCount; b++) {
      const bh = ((hash * (b + 7) * 13) + x) & 0xff;
      const bAngle = (bh / 255) * Math.PI * 2;
      const bDist = Math.round(crownR * (0.2 + (bh % 6) * 0.1));
      const bx2 = x + Math.round(Math.cos(bAngle) * bDist);
      const by2 = crownY + Math.round(Math.sin(bAngle) * bDist * 0.8);
      this.objectLayer.fillStyle(bh % 3 === 0 ? 0xffccdd : 0xffffff, 0.65);
      this.objectLayer.fillCircle(bx2, by2, 1 + (bh % 2));
      // Golden center
      this.objectLayer.fillStyle(0xffee44, 0.5);
      this.objectLayer.fillCircle(bx2, by2, 0.5);
    }

    // Green apples/fruit (small colored circles)
    if ((hash & 3) === 0) {
      for (let a = 0; a < 3; a++) {
        const ah = ((hash * (a + 11) * 17) + y) & 0xff;
        const ax2 = x + ((ah % (crownR * 2)) - crownR);
        const ay2 = crownY + ((ah >> 4) % crownR);
        this.objectLayer.fillStyle(0x228822, 0.7);
        this.objectLayer.fillCircle(ax2, ay2, 1.2);
      }
    }
  }

  private drawParadiseTree(x: number, y: number, hash: number): void {
    if (!this.objectLayer) return;
    // Enormous canopy — paradise / Delectable Mountains
    const trunkH = 14 + (hash % 6);
    const crownR = 12 + (hash % 6);
    const crownY = y - trunkH - crownR + 4;

    // Ground shadow (large)
    this.objectLayer.fillStyle(0x000000, 0.3);
    this.objectLayer.fillEllipse(x, y + 3, crownR * 1.8, 5);

    // Trunk — rich brown
    this.objectLayer.fillStyle(0x4a2e10, 0.9);
    this.objectLayer.fillRect(x - 2, y - trunkH, 5, trunkH);
    this.objectLayer.fillStyle(0x6a4a28, 0.4);
    this.objectLayer.fillRect(x - 2, y - trunkH, 2, trunkH - 2);
    this.objectLayer.fillStyle(0x1a1008, 0.3);
    this.objectLayer.fillRect(x + 1, y - trunkH + 2, 1, trunkH - 4);
    // Knot
    this.objectLayer.fillStyle(0x1a0e08, 0.6);
    this.objectLayer.fillCircle(x, y - Math.floor(trunkH * 0.5), 1.5);

    // Multi-layer canopy — enormous
    const leafColors: [number, number, number] = [0x1a5a10, 0x2a6a20, 0x48903a];
    this.objectLayer.fillStyle(leafColors[0], 0.88);
    this.objectLayer.fillCircle(x, crownY + Math.round(crownR * 0.3), Math.round(crownR * 0.9));
    this.objectLayer.fillStyle(leafColors[1], 0.85);
    this.objectLayer.fillCircle(x, crownY, crownR);
    this.objectLayer.fillStyle(leafColors[1], 0.55);
    this.objectLayer.fillCircle(x - Math.round(crownR * 0.5), crownY - Math.round(crownR * 0.2), Math.round(crownR * 0.75));
    this.objectLayer.fillStyle(leafColors[0], 0.4);
    this.objectLayer.fillCircle(x + Math.round(crownR * 0.5), crownY + Math.round(crownR * 0.1), Math.round(crownR * 0.65));

    // Golden and orange leaf highlights (rainbow of greens)
    const hlColors = [0x5a9a30, 0x70aa40, 0xd4a830, 0xcc8820];
    const hlCount = 8 + (hash % 5);
    for (let hl = 0; hl < hlCount; hl++) {
      const hh = ((hash * (hl + 3) * 17) + x) & 0xff;
      const hlAngle = (hh / 255) * Math.PI * 2;
      const hlDist = Math.round(crownR * (0.25 + (hh % 6) * 0.12));
      const hlX = x + Math.round(Math.cos(hlAngle) * hlDist);
      const hlY = crownY + Math.round(Math.sin(hlAngle) * hlDist * 0.8);
      this.objectLayer.fillStyle(hlColors[hh % hlColors.length], 0.5);
      this.objectLayer.fillCircle(hlX, hlY, 1 + (hh % 2));
    }

    // Fruit abundance (many colored dots throughout)
    const fruitColors = [0xff4422, 0xffaa22, 0xff6666, 0x44cc44, 0xffdd44];
    const fruitCount = 6 + (hash % 5);
    for (let fr = 0; fr < fruitCount; fr++) {
      const fh = ((hash * (fr + 13) * 11) + y) & 0xff;
      const fAngle = (fh / 255) * Math.PI * 2;
      const fDist = Math.round(crownR * (0.2 + (fh % 6) * 0.12));
      const fxP = x + Math.round(Math.cos(fAngle) * fDist);
      const fyP = crownY + Math.round(Math.sin(fAngle) * fDist * 0.9);
      this.objectLayer.fillStyle(fruitColors[fh % fruitColors.length], 0.7);
      this.objectLayer.fillCircle(fxP, fyP, 1 + (fh % 2) * 0.5);
    }

    // Glowing inner light
    this.objectLayer.fillStyle(0xffee88, 0.12);
    this.objectLayer.fillCircle(x, crownY, Math.round(crownR * 0.5));

    // Butterfly shapes near canopy (2-3 tiny 2px wing shapes)
    const butterflyCount = 1 + (hash % 3);
    for (let bf = 0; bf < butterflyCount; bf++) {
      const bfh = ((hash * (bf + 17) * 7) + x) & 0xff;
      const bfX = x + (bfh % (crownR * 2)) - crownR;
      const bfY = crownY - (bfh % crownR) - 2;
      const bfColors = [0xff88cc, 0x88ccff, 0xffee44];
      this.objectLayer.fillStyle(bfColors[bfh % bfColors.length], 0.6);
      this.objectLayer.fillRect(bfX - 2, bfY, 2, 1);
      this.objectLayer.fillRect(bfX + 1, bfY, 2, 1);
      this.objectLayer.fillRect(bfX - 1, bfY + 1, 3, 1);
    }
  }

  private drawCelestialTree(x: number, y: number, hash: number): void {
    if (!this.objectLayer) return;
    const trunkH = 10 + (hash % 5);
    const crownR = 9 + (hash % 4);
    const crownY = y - trunkH - crownR + 4;

    // Ground glow
    this.objectLayer.fillStyle(0xffd700, 0.12);
    this.objectLayer.fillEllipse(x, y + 2, crownR * 1.6, 4);

    // Golden-white trunk
    this.objectLayer.fillStyle(0xffeedd, 0.9);
    this.objectLayer.fillRect(x - 2, y - trunkH, 4, trunkH);
    this.objectLayer.fillStyle(0xffd700, 0.25);
    this.objectLayer.fillRect(x - 2, y - trunkH, 1, trunkH - 1);

    // Pure white foliage with golden edges
    this.objectLayer.fillStyle(0xfff8ee, 0.85);
    this.objectLayer.fillCircle(x, crownY, crownR);
    this.objectLayer.fillStyle(0xffffff, 0.6);
    this.objectLayer.fillCircle(x - Math.round(crownR * 0.35), crownY - Math.round(crownR * 0.2), Math.round(crownR * 0.7));

    // Golden highlights at edges
    const edgeCount = 8 + (hash % 4);
    for (let e = 0; e < edgeCount; e++) {
      const eh = ((hash * (e + 5) * 11) + x) & 0xff;
      const eAngle = (e / edgeCount) * Math.PI * 2 + (eh / 255) * 0.4;
      const eR = crownR + 1 + (eh % 2);
      const ex2 = x + Math.round(Math.cos(eAngle) * eR);
      const ey2 = crownY + Math.round(Math.sin(eAngle) * eR * 0.85);
      this.objectLayer.fillStyle(0xffd700, 0.4);
      this.objectLayer.fillCircle(ex2, ey2, 1 + (eh % 2));
    }

    // Sparkle particles
    const sparkleCount = 6 + (hash % 5);
    for (let s = 0; s < sparkleCount; s++) {
      const sh2 = ((hash * (s + 19) * 13) + y) & 0xff;
      const sAngle = (sh2 / 255) * Math.PI * 2;
      const sDist = crownR * (0.5 + (sh2 % 8) * 0.12);
      const sxP = x + Math.round(Math.cos(sAngle) * sDist);
      const syP = crownY + Math.round(Math.sin(sAngle) * sDist * 0.9);
      this.objectLayer.fillStyle(0xffffff, 0.6);
      this.objectLayer.fillRect(sxP, syP, 1, 1);
    }
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

      // Base stone/tan path (broader, warmer) — increased alpha for visibility
      this.decorLayer.fillStyle(stoneTan, 0.55 + t * 0.2);
      this.decorLayer.fillEllipse(px, py, w + 4, 9);
      // Theme-colored tint on top
      this.decorLayer.fillStyle(themeColor, 0.35 + t * 0.15);
      this.decorLayer.fillEllipse(px, py, w + 2, 8);
      // Gold shimmer overlay — holy path feel — increased alpha
      this.decorLayer.fillStyle(goldColor, 0.30 + t * 0.16);
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
    1:  [0x1a1020, 0x3d2010], // City of Destruction: dark ember
    2:  [0x111828, 0x1e3040], // Slough of Despond: murky overcast
    3:  [0x0d3a6a, 0x2a6898], // Straight & Narrow: rich blue sky
    4:  [0x1a1828, 0x2e2c40], // Hill Difficulty: dusk
    5:  [0x3a2010, 0x8a4020], // Interpreter's House: warm dusk
    6:  [0x0a1428, 0x1e3850], // Beautiful Gate: dawn blue
    7:  [0x1a0c2e, 0x2e1a48], // Palace Beautiful: twilight purple
    8:  [0x0a0008, 0x1a0018], // Valley of Humiliation: near black
    9:  [0x050308, 0x100810], // Valley of Shadow: pitch dark
    10: [0x1a0828, 0x3a1448], // Vanity Fair: garish night
    11: [0x080610, 0x100c18], // Doubting Castle: dungeon black
    12: [0x1a0a40, 0x4a2080], // Celestial City: cosmic purple-gold
  };

  private drawParallaxBackground(config: ChapterConfig): void {
    const { mapWidth: W, mapHeight: H, theme } = config;
    const ch = config.chapter;

    // ── Layer 1: Sky (depth -4, scrollFactor 0.05) ──
    const sky = this.scene.add.graphics().setDepth(-4).setScrollFactor(0.05, 0.02);
    // Use theme sky colors (fallback to SKY_PALETTE for safety)
    const skyTop = theme.skyTop ?? (TileMapManager.SKY_PALETTE[ch] ?? [0x0d1a2e, 0x1e3a50])[0];
    const skyBottom = theme.skyBot ?? (TileMapManager.SKY_PALETTE[ch] ?? [0x0d1a2e, 0x1e3a50])[1];
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
      // Moon outer glow rings
      sky.fillStyle(0xddccbb, 0.04);
      sky.fillCircle(mx, my, 28);
      sky.fillStyle(0xddccbb, 0.07);
      sky.fillCircle(mx, my, 22);
      // Moon disc
      sky.fillStyle(0xeeddcc, 0.55);
      sky.fillCircle(mx, my, 10);
      sky.fillStyle(0xffeedd, 0.35);
      sky.fillCircle(mx, my, 7);
      sky.fillStyle(0xffffff, 0.2);
      sky.fillCircle(mx - 1, my - 1, 4);
      // Crater pattern (subtle shade variation)
      sky.fillStyle(0xccbbaa, 0.12);
      sky.fillCircle(mx - 3, my + 2, 2);
      sky.fillStyle(0xccbbaa, 0.09);
      sky.fillCircle(mx + 4, my - 3, 1.5);
      sky.fillStyle(0xccbbaa, 0.07);
      sky.fillCircle(mx + 2, my + 5, 1.2);
      sky.fillStyle(0xbbaa99, 0.08);
      sky.fillCircle(mx - 5, my - 4, 1.8);
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
    // Ch1: Soot smoke columns rising from fires
    if (ch === 1) {
      for (let sm = 0; sm < 5; sm++) {
        const smH = ((sm * 97 + 17) * 43) & 0xffff;
        const smX = 40 + (smH % (W - 80));
        for (let smI = 0; smI < 6; smI++) {
          sky.fillStyle(0x221810, 0.12 - smI * 0.015);
          sky.fillEllipse(smX + (smI % 2) * 3 - 1, H * 0.4 - smI * 20, 15 + smI * 4, 12 + smI * 3);
        }
      }
      // Distant fire glow on horizon
      sky.fillStyle(0xff4400, 0.08);
      sky.fillRect(0, Math.floor(H * 0.65), W, Math.floor(H * 0.35));
    }
    // Ch2: Layered fog banks
    if (ch === 2) {
      for (let fg = 0; fg < 4; fg++) {
        const fgH = ((fg * 113 + 29) * 37) & 0xffff;
        sky.fillStyle(0x3a4a50, 0.1 - fg * 0.02);
        sky.fillEllipse((fgH % W), H * 0.6 + fg * 15, 120 + (fgH % 80), 25 + fg * 5);
      }
    }
    // Ch7: Purple mist bands across valley of humiliation
    if (ch === 8) {
      for (let pm = 0; pm < 3; pm++) {
        sky.fillStyle(0x440066, 0.06);
        sky.fillRect(0, Math.floor(H * (0.5 + pm * 0.15)), W, Math.floor(H * 0.08));
      }
    }
    // Ch9: Absolute darkness bands
    if (ch === 9) {
      sky.fillStyle(0x000000, 0.3);
      sky.fillRect(0, 0, W, H);
      // Faint sickly purple glow at ground level
      sky.fillStyle(0x220044, 0.1);
      sky.fillRect(0, Math.floor(H * 0.65), W, Math.floor(H * 0.35));
    }
    // Ch10: Garish colored lantern glow on sky
    if (ch === 10) {
      const lanternColors = [0xff4466, 0x4488ff, 0xffaa00, 0x44cc88];
      for (let ln = 0; ln < 5; ln++) {
        const lnH = ((ln * 83 + 41) * 53) & 0xffff;
        sky.fillStyle(lanternColors[ln % lanternColors.length], 0.05);
        sky.fillCircle((lnH % W), H * 0.3 + (lnH % 80), 35 + (lnH % 25));
      }
    }
    // Ch11: Dungeon dripping atmosphere (no sky, just stone ceiling color — fog)
    if (ch === 11) {
      sky.fillStyle(0x080612, 0.4);
      sky.fillRect(0, 0, W, H);
    }
    // Ch12: Angel wing silhouettes in radiant sky
    if (ch === 12) {
      sky.fillStyle(0xffffff, 0.06);
      sky.fillRect(0, 0, W, H);
      // Radiant rings of light
      const rings = 4;
      for (let r = 0; r < rings; r++) {
        sky.fillStyle(0xffd700, 0.03);
        sky.fillCircle(W * 0.5, H * 0.2, 50 + r * 40);
      }
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
      // City of Destruction — 15 building silhouettes with rich detail
      const buildingData = [
        { x: 30, w: 16, h: 40 }, { x: 60, w: 10, h: 28 }, { x: 85, w: 20, h: 50 },
        { x: 120, w: 14, h: 35 }, { x: 150, w: 18, h: 44 }, { x: 182, w: 12, h: 30 },
        { x: 210, w: 22, h: 55 }, { x: 248, w: 10, h: 24 }, { x: 270, w: 16, h: 42 },
        { x: 300, w: 20, h: 38 }, { x: 340, w: 14, h: 48 }, { x: 370, w: 18, h: 32 },
        { x: 420, w: 12, h: 36 }, { x: 448, w: 24, h: 60 }, { x: 490, w: 16, h: 28 },
      ];
      const baseY = H - 15;
      for (let bi = 0; bi < buildingData.length; bi++) {
        const b = buildingData[bi];
        const bHash = ((b.x * 17 + b.h * 7) * 31) & 0xff;
        const hasRooftopFire = bi % 2 === 0;

        // Building drop shadow
        far.fillStyle(0x000000, 0.22);
        far.fillRect(b.x + 2, baseY - b.h + 2, b.w, b.h);
        // Building body base
        far.fillStyle(0x2a2420, 0.85);
        far.fillRect(b.x, baseY - b.h, b.w, b.h);
        // Rooftop slightly lighter
        far.fillStyle(0x302825, 0.9);
        far.fillRect(b.x, baseY - b.h, b.w, 4);

        // Rooftop shape variety
        if (bHash % 3 === 0) {
          far.fillStyle(0x201a14, 0.9);
          far.fillTriangle(b.x, baseY - b.h, b.x + b.w / 2, baseY - b.h - 10, b.x + b.w, baseY - b.h);
        } else if (bHash % 3 === 1) {
          for (let p = 0; p < Math.floor(b.w / 5); p++) {
            far.fillStyle(0x201c18, 0.85);
            far.fillRect(b.x + p * 5, baseY - b.h - 3, 3, 4);
          }
        }
        // Chimney
        if (bHash % 2 === 0) {
          const chimneyX = b.x + 3 + (bHash % Math.max(1, b.w - 5));
          far.fillStyle(0x1a1410, 0.9);
          far.fillRect(chimneyX, baseY - b.h - 7, 3, 7);
          for (let s = 0; s < 4; s++) {
            const smokeAlpha = 0.15 - s * 0.03;
            const smokeR = 1 + s * 0.7;
            const smokeX = chimneyX + 1 + (s % 2) * 1.5;
            const smokeY = baseY - b.h - 8 - s * 4;
            far.fillStyle(0x887060, smokeAlpha);
            far.fillCircle(smokeX, smokeY, smokeR);
          }
        }

        // Rooftop fire glow
        if (hasRooftopFire) {
          far.fillStyle(0xff2200, 0.14 + (bHash % 4) * 0.025);
          far.fillEllipse(b.x + b.w / 2, baseY - b.h - 2, b.w * 0.7, 6);
          far.fillStyle(0xff6600, 0.09);
          far.fillCircle(b.x + b.w / 2, baseY - b.h - 6, 5 + (bHash % 4));
          far.fillStyle(0xff9900, 0.06);
          far.fillCircle(b.x + b.w / 2, baseY - b.h - 12, 7 + (bHash % 5));
          far.fillStyle(0xffcc44, 0.08);
          far.fillTriangle(
            b.x + b.w / 2 - 3, baseY - b.h - 2,
            b.x + b.w / 2, baseY - b.h - 14,
            b.x + b.w / 2 + 3, baseY - b.h - 2,
          );
          for (let e = 0; e < 3; e++) {
            const ex2 = b.x + 2 + (bHash * (e + 1)) % Math.max(1, b.w - 3);
            const ey2 = baseY - b.h - 10 - (bHash >> (e + 2)) % 8;
            far.fillStyle(0xff8800, 0.3);
            far.fillCircle(ex2, ey2, 0.7);
          }
        } else {
          far.fillStyle(0xff4400, 0.06 + (bHash % 3) * 0.015);
          far.fillCircle(b.x + b.w / 2, baseY - b.h - 5, 3 + (bHash % 3));
        }

        // Window pixels: 2×2 yellow-orange glow dots
        if (b.h > 24) {
          const winCount = 3 + (bHash % 3);
          const rowSpan = Math.max(1, Math.floor(b.h / 12) * 10);
          for (let w2 = 0; w2 < winCount; w2++) {
            const wh = ((bHash * (w2 + 5) * 7) + bi) & 0xff;
            const wx = b.x + 2 + (wh % Math.max(1, b.w - 4));
            const wy = baseY - b.h + 6 + ((wh * 3) & 0xff) % rowSpan;
            far.fillStyle(0xffcc44, 0.07);
            far.fillRect(wx - 1, wy - 1, 4, 4);
            far.fillStyle(0xff9922, 0.2);
            far.fillRect(wx, wy, 2, 2);
            if (wh % 3 === 0) {
              far.fillStyle(0xff6600, 0.1);
              far.fillRect(wx, wy, 2, 2);
            }
          }
          far.fillStyle(0xffaa33, 0.18);
          far.fillRect(b.x + 2, baseY - b.h + 8, 2, 2);
        }
      }
    } else if (ch === 2) {
      // Murky swamp trees (short, gnarled, dark green)
      for (let i = 0; i < 8; i++) {
        const hash2 = ((i * 89 + 2 * 17) * 43) & 0xffff;
        const tx2 = 30 + (hash2 % (W - 60));
        const th2 = 25 + (hash2 % 20);
        // Gnarled trunk
        far.fillStyle(0x1a2a18, 0.7);
        far.fillRect(tx2 - 2, H - th2 - 10, 4, th2);
        // Drooping canopy
        far.fillStyle(0x1a3a28, 0.5);
        far.fillEllipse(tx2, H - th2 - 8, 18 + (hash2 % 12), 10);
        far.fillStyle(0x243a2a, 0.3);
        // Drooping branch curves
        far.fillRect(tx2 - 10, H - th2 - 5, 8, 2);
        far.fillRect(tx2 + 3, H - th2 - 3, 8, 2);
      }
      // Fog banks (grey ellipses at ground level)
      for (let i = 0; i < 5; i++) {
        const hash2b = ((i * 113 + 22) * 31) & 0xffff;
        far.fillStyle(0x3a4a4a, 0.12);
        far.fillEllipse((hash2b % (W - 40)) + 20, H - 12, 80 + (hash2b % 60), 18);
      }
    } else if (ch === 3) {
      // Rocky cliff face on one side
      far.fillStyle(0x4a4838, 0.6);
      far.fillRect(0, H - 80, 60, 80);
      far.fillRect(W - 50, H - 70, 50, 70);
      // Cliff texture lines
      for (let i = 0; i < 6; i++) {
        const hash3 = (i * 73 + 3 * 11) & 0xff;
        far.fillStyle(0x2a2818, 0.3);
        far.fillRect(4 + (hash3 % 40), H - 70 + i * 10, 1, 8 + (hash3 % 12));
      }
      // Pathway going uphill (diagonal lines suggesting ascent)
      far.fillStyle(0x8a7a5a, 0.15);
      for (let i = 0; i < 5; i++) {
        const py = H - 20 - i * 14;
        const px = 60 + i * 30;
        far.fillEllipse(px, py, 20, 5);
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
      // Three crosses silhouette on hilltop
      const hillTop = H - 55;
      const crossPositions = [W * 0.3, W * 0.4, W * 0.5];
      crossPositions.forEach((cpx, ci) => {
        const height = ci === 1 ? 28 : 22; // center taller
        far.fillStyle(0x3a2a1a, 0.55);
        far.fillRect(cpx - 1.5, hillTop - height, 3, height + 5);
        far.fillRect(cpx - 8, hillTop - height + 7, 16, 2.5);
      });
      // Rays of light from center cross
      for (let r = 0; r < 6; r++) {
        const angle = (r / 6) * Math.PI * 2 - Math.PI / 2;
        const rLen = 30 + r * 5;
        far.fillStyle(0xffd700, 0.04);
        far.fillTriangle(
          crossPositions[1], hillTop - 24,
          crossPositions[1] + Math.cos(angle - 0.2) * rLen,
          hillTop - 24 + Math.sin(angle - 0.2) * rLen,
          crossPositions[1] + Math.cos(angle + 0.2) * rLen,
          hillTop - 24 + Math.sin(angle + 0.2) * rLen,
        );
      }
    } else if (ch === 7) {
      // Dark twisted trees with bare branches
      for (let i = 0; i < 6; i++) {
        const hash7 = ((i * 97 + 7 * 19) * 41) & 0xffff;
        const tx7 = 20 + (hash7 % (W - 40));
        const th7 = 40 + (hash7 % 30);
        // Bare trunk
        far.fillStyle(0x180c10, 0.8);
        far.fillRect(tx7 - 2, H - th7 - 5, 4, th7);
        // Skeletal branch arms
        far.lineStyle(1, 0x200c18, 0.6);
        far.lineBetween(tx7, H - th7, tx7 - 15, H - th7 + 10);
        far.lineBetween(tx7, H - th7, tx7 + 12, H - th7 + 8);
        far.lineBetween(tx7, H - th7 - 8, tx7 - 10, H - th7 - 18);
        far.lineBetween(tx7, H - th7 - 8, tx7 + 8, H - th7 - 15);
        far.lineBetween(tx7 - 15, H - th7 + 10, tx7 - 22, H - th7 + 5);
        far.lineBetween(tx7 + 12, H - th7 + 8, tx7 + 18, H - th7 + 2);
      }
      // Purple-black mist particles at ground
      for (let i = 0; i < 8; i++) {
        const hash7b = ((i * 113 + 77) * 23) & 0xffff;
        far.fillStyle(0x180828, 0.1);
        far.fillEllipse((hash7b % (W - 40)) + 20, H - 8, 50 + (hash7b % 50), 12);
      }
    } else if (ch === 8) {
      // Market stall silhouettes (rectangular shapes with canopies)
      const stallColors = [0x662222, 0x224466, 0x664422, 0x226644, 0x662244];
      for (let i = 0; i < 6; i++) {
        const hash8 = ((i * 83 + 8 * 13) * 37) & 0xffff;
        const sx8 = 20 + (hash8 % (W - 40));
        const sw = 25 + (hash8 % 20);
        // Stall body
        far.fillStyle(0x1a1828, 0.5);
        far.fillRect(sx8, H - 40, sw, 30);
        // Canopy
        far.fillStyle(stallColors[i % stallColors.length], 0.45);
        far.fillRect(sx8 - 3, H - 45, sw + 6, 8);
        far.fillStyle(0xffffff, 0.06);
        far.fillRect(sx8 - 3, H - 45, sw + 6, 3);
      }
      // Banner flags hanging between stalls
      for (let i = 0; i < 5; i++) {
        const hash8b = ((i * 107 + 88) * 29) & 0xffff;
        const fx8 = 30 + (hash8b % (W - 60));
        const flagColors = [0xff4444, 0x4488ff, 0xffaa22, 0x44bb44];
        far.fillStyle(flagColors[i % flagColors.length], 0.35);
        far.fillTriangle(fx8, H - 60, fx8 + 8, H - 60, fx8 + 4, H - 52);
      }
    } else if (ch === 9) {
      // High stone walls on both sides (thick grey rectangles)
      far.fillStyle(0x2a2830, 0.85);
      far.fillRect(0, 0, 55, H);
      far.fillRect(W - 55, 0, 55, H);
      // Wall stone texture
      for (let row = 0; row < Math.ceil(H / 14); row++) {
        for (let col = 0; col < 4; col++) {
          const wx = col * 14 + (row % 2) * 7;
          far.fillStyle(0x202028, 0.2);
          far.fillRect(wx, row * 14, 13, 13);
          // Iron bar hint (right wall)
          if (col === 0) {
            far.fillStyle(0x404848, 0.15);
            far.fillRect(W - 50 + wx, row * 14, 13, 13);
          }
        }
      }
      // Iron bars on walls
      far.lineStyle(1, 0x442a1a, 0.5);
      for (let bar = 0; bar < 4; bar++) {
        far.lineBetween(10 + bar * 10, 20, 10 + bar * 10, H - 20);
        far.lineBetween(W - 45 + bar * 10, 20, W - 45 + bar * 10, H - 20);
      }
    } else if (ch === 10) {
      // Gentle mountain silhouettes with snow caps
      for (let m = 0; m < 5; m++) {
        const hash10 = ((m * 79 + 10 * 11) * 41) & 0xffff;
        const mx10 = (hash10 % (W - 60)) + 10;
        const mh10 = 45 + (hash10 % 35);
        const mw10 = 55 + (hash10 % 40);
        far.fillStyle(0x5a7a6a, 0.4);
        far.fillTriangle(mx10, H, mx10 + mw10 / 2, H - mh10, mx10 + mw10, H);
        // Snow cap
        far.fillStyle(0xeeeeff, 0.3);
        far.fillTriangle(
          mx10 + mw10 / 2 - 5, H - mh10 + 10,
          mx10 + mw10 / 2, H - mh10,
          mx10 + mw10 / 2 + 5, H - mh10 + 10,
        );
        // More lush trees on lower slopes
        for (let t = 0; t < 3; t++) {
          const htx = mx10 + 10 + t * (mw10 / 4);
          const hty = H - 12 - t * 6;
          far.fillStyle(0x4a8a5a, 0.45);
          far.fillCircle(htx, hty, 5 + t * 2);
        }
      }
    } else if (ch === 12) {
      // Golden pillar architecture
      for (let i = 0; i < 4; i++) {
        const px12 = W * 0.2 + i * (W * 0.2);
        far.fillStyle(0xffd700, 0.35);
        far.fillRect(px12 - 4, H - 90, 8, 80);
        // Pillar top
        far.fillStyle(0xffeedd, 0.25);
        far.fillRect(px12 - 8, H - 92, 16, 5);
        // Pillar base
        far.fillStyle(0xffcc88, 0.2);
        far.fillRect(px12 - 7, H - 15, 14, 5);
      }
      // Radiant light rays from top center
      const lx12 = W / 2;
      for (let r = 0; r < 8; r++) {
        const angle12 = ((r / 8) * Math.PI * 2) - Math.PI / 2;
        const rLen12 = 70 + r * 8;
        far.fillStyle(0xffd700, 0.04);
        far.fillTriangle(
          lx12, 10,
          lx12 + Math.cos(angle12 - 0.18) * rLen12,
          10 + Math.sin(angle12 - 0.18) * rLen12,
          lx12 + Math.cos(angle12 + 0.18) * rLen12,
          10 + Math.sin(angle12 + 0.18) * rLen12,
        );
      }
      // Distant city silhouette
      for (let b = 0; b < 8; b++) {
        const hash12 = ((b * 101 + 12 * 13) * 47) & 0xff;
        const bx12 = 10 + b * (W / 8);
        const bh12 = 30 + (hash12 % 40);
        far.fillStyle(0xffd700, 0.15);
        far.fillRect(bx12, H - bh12 - 10, 10 + (hash12 % 20), bh12);
        // Windows
        far.fillStyle(0xffffff, 0.1);
        far.fillRect(bx12 + 3, H - bh12, 4, 4);
      }
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
