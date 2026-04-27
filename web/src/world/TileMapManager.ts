import { TILE_SIZE, GAME_HEIGHT } from '../config';
import { ChapterConfig, ChapterTheme, TerrainZone } from './ChapterData';
import { ParallaxBackground } from '../ui/ParallaxBackground';

export class TileMapManager {
  private scene: Phaser.Scene;
  private groundLayer: Phaser.GameObjects.Graphics | null = null;
  private decorLayer: Phaser.GameObjects.Graphics | null = null;
  private objectLayer: Phaser.GameObjects.Graphics | null = null;
  private fogLayer: Phaser.GameObjects.Graphics | null = null;
  private terrainZoneLayer: Phaser.GameObjects.Graphics | null = null;
  private colliders: Phaser.Physics.Arcade.StaticGroup | null = null;
  private parallaxLayers: Phaser.GameObjects.GameObject[] = [];
  private parallaxBg: ParallaxBackground | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /** Call from GameScene.update() every frame to animate parallax layers */
  update(scrollX: number): void {
    this.parallaxBg?.update(scrollX);
  }

  generateMap(config: ChapterConfig, options?: { skipParallax?: boolean }): void {
    this.clearMap();

    // Cinematic animated parallax background (Sanabi-quality multi-layer system).
    // Top-down / celestial renderers pass skipParallax: true so the sky curtain
    // is omitted entirely — the whole viewport becomes ground.
    if (!options?.skipParallax) {
      this.parallaxBg = new ParallaxBackground(this.scene);
      this.parallaxBg.init(config.chapter, config.mapWidth);
    }

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
          this.drawWallTile(x, y, theme, config.chapter);
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

    // Camera Y bounds: clamp vertical scroll to keep the sky/ground horizon line
    // consistent on screen. We allow only a small vertical window (±30px beyond
    // the map's playable region) so the fixed parallax backdrop never shows gaps.
    const camBoundsH = Math.max(config.mapHeight, GAME_HEIGHT);
    this.scene.cameras.main.setBounds(0, 0, config.mapWidth, camBoundsH);
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

  private drawWallTile(x: number, y: number, _theme: ChapterTheme, chapter = 0): void {
    if (!this.groundLayer) return;
    const hash = ((x * 0xb5297a4d + y * 0x68e31da4) >>> 0) & 0xffff;

    // ── Chapter-specific wall materials ──
    type WallStyle = { front: number; top: number; shadow: number; brick: number };
    const wallStyles: Record<number, WallStyle> = {
      1:  { front: 0x6a5a48, top: 0x8a7a68, shadow: 0x2a2018, brick: 0x5a4a38 }, // sandstone ruins
      2:  { front: 0x3a4a38, top: 0x4a5a48, shadow: 0x1a2a18, brick: 0x2a3a28 }, // mossy bog wall
      3:  { front: 0x5a5848, top: 0x7a7868, shadow: 0x2a2820, brick: 0x4a4838 }, // rocky cliff face
      4:  { front: 0xd0b890, top: 0xf0d8b0, shadow: 0x503828, brick: 0xb09870 }, // polished palace marble
      5:  { front: 0xc8a870, top: 0xe8c890, shadow: 0x483818, brick: 0xa88850 }, // warm stone
      6:  { front: 0xe8e0d0, top: 0xfff8f0, shadow: 0x786860, brick: 0xd0c8b8 }, // white marble cross
      7:  { front: 0xb89878, top: 0xd8b898, shadow: 0x483828, brick: 0x987858 }, // palace stone
      8:  { front: 0x2a1820, top: 0x3a2830, shadow: 0x0a0810, brick: 0x1a1018 }, // volcanic dark
      9:  { front: 0x181020, top: 0x281828, shadow: 0x080408, brick: 0x100810 }, // shadow valley
      10: { front: 0x483858, top: 0x685878, shadow: 0x181028, brick: 0x382848 }, // vanity fair
      11: { front: 0x2c2c38, top: 0x3c3c48, shadow: 0x0c0c18, brick: 0x1c1c28 }, // doubting castle
      12: { front: 0xe8d8a8, top: 0xfff8d8, shadow: 0x786840, brick: 0xd0c088 }, // celestial gold
    };
    const ws = wallStyles[chapter] ?? wallStyles[1];

    const topH = 5; // top-face height (roof/top of wall seen from above)
    const frontH = TILE_SIZE - topH;

    // 1. Top face (lighter — what you see looking down at the roof/top edge)
    this.groundLayer.fillStyle(ws.top, 1);
    this.groundLayer.fillRect(x, y, TILE_SIZE, topH);
    // Top face highlight strip
    this.groundLayer.fillStyle(0xffffff, 0.12);
    this.groundLayer.fillRect(x, y, TILE_SIZE, 1);
    // Top face right-edge shadow (depth cue)
    this.groundLayer.fillStyle(0x000000, 0.18);
    this.groundLayer.fillRect(x + TILE_SIZE - 1, y, 1, topH);

    // 2. Front face (main wall body)
    this.groundLayer.fillStyle(ws.front, 1);
    this.groundLayer.fillRect(x, y + topH, TILE_SIZE, frontH);

    // 3. Brick / stone texture on front face (2 rows of offset bricks)
    const brickH = 4, brickW = 8;
    for (let row = 0; row < Math.ceil(frontH / brickH); row++) {
      const offset = row % 2 === 0 ? 0 : brickW / 2;
      const bh2 = ((hash * (row + 3) * 7) & 0xf) - 7;
      const bc = ws.brick + (bh2 << 16 | bh2 << 8 | bh2);
      for (let col = 0; col < Math.ceil(TILE_SIZE / brickW) + 1; col++) {
        const bx = x + col * brickW - offset;
        const by = y + topH + row * brickH;
        if (bx >= x && bx < x + TILE_SIZE) {
          this.groundLayer.fillStyle(bc & 0xffffff, 0.3);
          this.groundLayer.fillRect(bx + 1, by + 1, Math.min(brickW - 2, x + TILE_SIZE - bx - 1), brickH - 2);
        }
      }
    }

    // 4. Mortar lines (horizontal grooves between brick rows)
    this.groundLayer.fillStyle(ws.shadow, 0.45);
    for (let row = 0; row <= Math.ceil(frontH / brickH); row++) {
      this.groundLayer.fillRect(x, y + topH + row * brickH, TILE_SIZE, 1);
    }

    // 5. Right-side shadow (creates 3D depth illusion)
    this.groundLayer.fillStyle(0x000000, 0.22);
    this.groundLayer.fillRect(x + TILE_SIZE - 2, y + topH, 2, frontH);

    // 6. Bottom drop shadow (casts onto ground)
    this.groundLayer.fillStyle(ws.shadow, 0.35);
    this.groundLayer.fillRect(x, y + TILE_SIZE - 2, TILE_SIZE, 2);

    // 7. Subtle surface variation (cracks, stains)
    if ((hash & 0xff) < 20) {
      this.groundLayer.fillStyle(ws.shadow, 0.25);
      const vy = y + topH + 2 + ((hash >> 4) % (frontH - 4));
      this.groundLayer.fillRect(x + (hash % (TILE_SIZE - 4)), vy, 2 + (hash & 3), 1);
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

    // Use a subtle purple-tinted fog instead of pure black/grey
    // so unvisited areas feel mysterious rather than flat.
    const fogTint = theme.fogColor !== 0x000000 ? theme.fogColor : 0x1a0a2e;

    for (let i = 0; i < 10; i++) {
      const hash = (i * 127 + config.chapter * 37) & 0xffff;
      const fx = (hash % config.mapWidth);
      const fy = ((hash * 3) % config.mapHeight);
      const fr = 50 + (hash % 70);
      // Layered fog: outer soft ring + inner denser ring
      this.fogLayer.fillStyle(fogTint, theme.fogAlpha * (0.30 + (hash % 5) * 0.08));
      this.fogLayer.fillCircle(fx, fy, fr);
      this.fogLayer.fillStyle(fogTint, theme.fogAlpha * (0.45 + (hash % 3) * 0.08));
      this.fogLayer.fillCircle(fx, fy, fr * 0.55);
    }
  }

  private drawChapterLandmarks(config: ChapterConfig): void {
    if (!this.objectLayer) return;

    switch (config.chapter) {
      case 1: {
        const W1 = config.mapWidth;
        const H1 = config.mapHeight;
        // City of Destruction — burning ruins, oppressive gate, Evangelist light beacon, exit arch

        // Scattered burning debris piles along the 2400-wide map
        const debrisPx = [420, 760, 1060, 1360, 1680, 2020];
        for (const dx of debrisPx) {
          const dh = ((dx * 17 + 7) * 31) & 0xff;
          const dy = H1 * 0.25 + (dh % Math.round(H1 * 0.45));
          // Rubble shadow
          this.objectLayer.fillStyle(0x000000, 0.2);
          this.objectLayer.fillEllipse(dx + 2, dy + 3, 26 + (dh % 14), 9);
          // Rubble base
          this.objectLayer.fillStyle(0x2a2018, 0.75);
          this.objectLayer.fillEllipse(dx, dy, 24 + (dh % 14), 8 + (dh % 5));
          // Broken wall fragments
          this.objectLayer.fillStyle(0x3a3028, 0.65);
          this.objectLayer.fillRect(dx - 8, dy - 14, 5, 14 + (dh % 8));
          this.objectLayer.fillRect(dx + 4, dy - 10, 4, 10 + (dh % 6));
          // Fire glow (every other ruin)
          if (dh % 2 === 0) {
            this.objectLayer.fillStyle(0xff2200, 0.10 + (dh % 4) * 0.02);
            this.objectLayer.fillCircle(dx, dy - 18, 9 + (dh % 5));
            this.objectLayer.fillStyle(0xff8800, 0.06);
            this.objectLayer.fillCircle(dx, dy - 25, 6 + (dh % 3));
            this.objectLayer.fillStyle(0xffcc44, 0.04);
            this.objectLayer.fillTriangle(dx - 4, dy - 8, dx, dy - 26, dx + 4, dy - 8);
            // Ember sparks
            for (let e = 0; e < 3; e++) {
              const eh = ((dh * (e + 3) * 7) + dx) & 0xff;
              this.objectLayer.fillStyle(0xff6600, 0.35);
              this.objectLayer.fillCircle(dx - 6 + (eh % 12), dy - 12 - (eh % 10), 0.8);
            }
          }
          // Crack lines in ground near rubble
          this.objectLayer.lineStyle(0.6, 0x000000, 0.3);
          this.objectLayer.lineBetween(dx - 12, dy + 2, dx - 6, dy + 5);
          this.objectLayer.lineBetween(dx + 8, dy + 3, dx + 14, dy + 1);
        }

        // Oppressive start-gate archway (city still holds the player)
        const sg = { x: 140, y: Math.round(H1 / 2) };
        this.objectLayer.fillStyle(0x000000, 0.25);
        this.objectLayer.fillRect(sg.x - 24, sg.y - 58, 14, 84);
        this.objectLayer.fillRect(sg.x + 14, sg.y - 58, 14, 84);
        this.objectLayer.fillStyle(0x1a1410, 0.88);
        this.objectLayer.fillRect(sg.x - 22, sg.y - 56, 12, 82);
        this.objectLayer.fillRect(sg.x + 12, sg.y - 56, 12, 82);
        this.objectLayer.fillRect(sg.x - 22, sg.y - 56, 46, 9);
        // Arch crown (dark stone)
        this.objectLayer.fillStyle(0x100c08, 0.9);
        this.objectLayer.fillCircle(sg.x + 1, sg.y - 56, 24);
        // Ominous red glow above gate
        this.objectLayer.fillStyle(0x660000, 0.07);
        this.objectLayer.fillCircle(sg.x + 1, sg.y - 42, 32);
        // Battlement notches on top
        for (let b = 0; b < 3; b++) {
          this.objectLayer.fillStyle(0x1a1410, 0.9);
          this.objectLayer.fillRect(sg.x - 22 + b * 8, sg.y - 66, 5, 10);
          this.objectLayer.fillRect(sg.x + 12 + b * 8, sg.y - 66, 5, 10);
        }

        // Evangelist's golden light beacon at x≈280
        const evX = 280, evY = Math.round(H1 / 2) - 20;
        this.objectLayer.fillStyle(0xffd700, 0.04);
        this.objectLayer.fillCircle(evX, evY, 48);
        this.objectLayer.fillStyle(0xffd700, 0.08);
        this.objectLayer.fillCircle(evX, evY, 28);
        this.objectLayer.fillStyle(0xffd700, 0.14);
        this.objectLayer.fillCircle(evX, evY, 16);
        // Upward light beam
        this.objectLayer.fillStyle(0xffd700, 0.04);
        this.objectLayer.fillTriangle(evX - 12, evY + 8, evX, evY - 60, evX + 12, evY + 8);
        this.objectLayer.fillStyle(0xffffff, 0.06);
        this.objectLayer.fillTriangle(evX - 5, evY + 4, evX, evY - 40, evX + 5, evY + 4);

        // Stone road paving toward the exit (eastern half)
        for (let seg = 0; seg < 8; seg++) {
          const sx = W1 - 400 + seg * 50;
          const sy = Math.round(H1 / 2) - 10;
          const sh = ((seg * 29 + 1) * 17) & 0xff;
          this.objectLayer.fillStyle(0x8a7a60, 0.28 + seg * 0.03);
          this.objectLayer.fillRect(sx, sy, 48, 20);
          this.objectLayer.lineStyle(0.5, 0x000000, 0.1);
          this.objectLayer.strokeRect(sx, sy, 48, 20);
          // Road wear marks
          if (sh % 2 === 0) {
            this.objectLayer.fillStyle(0x000000, 0.06);
            this.objectLayer.fillRect(sx + 5, sy + 3, 38, 2);
          }
        }

        // Narrow exit gate (the wicket gate direction) at east edge
        const eg = { x: W1 - 90, y: Math.round(H1 / 2) };
        this.objectLayer.fillStyle(0x000000, 0.2);
        this.objectLayer.fillRect(eg.x - 7, eg.y - 64, 13, 86);
        this.objectLayer.fillRect(eg.x + 28, eg.y - 64, 13, 86);
        this.objectLayer.fillStyle(0x5a4830, 0.88);
        this.objectLayer.fillRect(eg.x - 5, eg.y - 62, 10, 84);
        this.objectLayer.fillRect(eg.x + 30, eg.y - 62, 10, 84);
        this.objectLayer.fillStyle(0x4a3820, 0.85);
        this.objectLayer.fillCircle(eg.x + 17, eg.y - 62, 22);
        // Inviting warm glow around exit
        this.objectLayer.fillStyle(0xffd700, 0.07);
        this.objectLayer.fillCircle(eg.x + 17, eg.y - 42, 35);
        this.objectLayer.fillStyle(0xffd700, 0.12);
        this.objectLayer.fillCircle(eg.x + 17, eg.y - 42, 18);
        break;
      }

      case 2: {
        const W2 = config.mapWidth;
        const H2 = config.mapHeight;
        // Slough of Despond — murky bog, reed clusters, stepping stones, Help's beacon

        // Dark bog water patches scattered across map
        const bogSeed = [
          { x: 90, y: 90, rw: 120, rh: 70 },
          { x: 270, y: 120, rw: 140, rh: 90 },
          { x: 430, y: 80, rw: 110, rh: 80 },
          { x: 560, y: 130, rw: 100, rh: 70 },
          { x: 180, y: 250, rw: 130, rh: 75 },
          { x: 380, y: 260, rw: 120, rh: 70 },
        ];
        for (const b of bogSeed) {
          // Outer dark water
          this.objectLayer.fillStyle(0x0a2a1a, 0.35);
          this.objectLayer.fillEllipse(b.x, b.y, b.rw, b.rh);
          // Surface sheen
          this.objectLayer.fillStyle(0x1a4a3a, 0.12);
          this.objectLayer.fillEllipse(b.x - 10, b.y - 6, Math.round(b.rw * 0.6), Math.round(b.rh * 0.5));
          // Ripple rings
          this.objectLayer.lineStyle(0.6, 0x2a5a4a, 0.18);
          this.objectLayer.strokeEllipse(b.x, b.y, Math.round(b.rw * 0.7), Math.round(b.rh * 0.6));
        }

        // Reed clusters at bog margins
        for (let i = 0; i < 14; i++) {
          const rh = ((i * 67 + 37) * 23) & 0xff;
          const rx = 60 + (rh % (W2 - 120));
          const ry = 30 + ((rh * 5) & 0xff) % (H2 - 60);
          const rCount = 2 + (rh % 3);
          for (let r = 0; r < rCount; r++) {
            const rrx = rx + (r - 1) * 4 + ((rh >> (r * 2)) & 3) - 1;
            // Stem
            this.objectLayer.fillStyle(0x3a5a2a, 0.55);
            this.objectLayer.fillRect(rrx, ry - 15, 1, 18);
            // Reed head (brown capsule)
            this.objectLayer.fillStyle(0x6a4a20, 0.5);
            this.objectLayer.fillEllipse(rrx, ry - 20, 3, 7);
            // Tip highlight
            this.objectLayer.fillStyle(0xaa8844, 0.2);
            this.objectLayer.fillCircle(rrx, ry - 23, 1);
          }
        }

        // Stepping stone path zigzagging across center
        const centerY = Math.round(H2 / 2);
        for (let s = 0; s < 7; s++) {
          const stX = 80 + s * 80;
          const stOff = s % 2 === 0 ? -18 : 18;
          // Shadow
          this.objectLayer.fillStyle(0x000000, 0.22);
          this.objectLayer.fillEllipse(stX + 3, centerY + stOff + 3, 28, 12);
          // Stone body
          this.objectLayer.fillStyle(0x6a5a48, 0.82);
          this.objectLayer.fillEllipse(stX, centerY + stOff, 26, 10);
          // Stone highlight
          this.objectLayer.fillStyle(0x9a8a78, 0.35);
          this.objectLayer.fillEllipse(stX - 5, centerY + stOff - 2, 12, 5);
          // Wet edge line
          this.objectLayer.lineStyle(0.5, 0x2a4a3a, 0.3);
          this.objectLayer.strokeEllipse(stX, centerY + stOff, 26, 10);
        }

        // Mud bubbles on bog surface
        for (let i = 0; i < 12; i++) {
          const bh = ((i * 47 + 2) * 19) & 0xff;
          const bx2 = 60 + (bh % (W2 - 120));
          const by2 = 40 + ((bh * 3) & 0xff) % (H2 - 80);
          this.objectLayer.lineStyle(0.8, 0x2a4a3a, 0.2);
          this.objectLayer.strokeEllipse(bx2, by2, 6 + (bh % 6), 3 + (bh % 3));
        }

        // Help's golden rescue beacon at x≈360 (NPC position)
        const hlpX = 360, hlpY = Math.round(H2 / 2) - 22;
        this.objectLayer.fillStyle(0xffd700, 0.05);
        this.objectLayer.fillCircle(hlpX, hlpY, 36);
        this.objectLayer.fillStyle(0xffd700, 0.10);
        this.objectLayer.fillCircle(hlpX, hlpY, 22);
        this.objectLayer.fillStyle(0xffd700, 0.18);
        this.objectLayer.fillCircle(hlpX, hlpY, 13);
        // Reaching hand visual (arm extending)
        this.objectLayer.fillStyle(0xe8c8a0, 0.4);
        this.objectLayer.fillEllipse(hlpX - 16, hlpY + 8, 30, 8);
        this.objectLayer.fillCircle(hlpX - 28, hlpY + 8, 5);
        break;
      }

      case 3: {
        const W3 = config.mapWidth;
        const H3 = config.mapHeight;
        // Worldly Wiseman's Path — meadow vs rocky fork, Hill Difficulty, signpost

        // Left meadow zone (the true narrow path — bright and hopeful)
        for (let i = 0; i < 22; i++) {
          const fh = ((i * 79 + 37) * 41) & 0xffff;
          const fx = 30 + (fh % 200);
          const fy = 40 + ((fh * 3) & 0xffff) % (H3 - 80);
          const fCols = [0xffaacc, 0xffeeaa, 0xaaffaa, 0x99ddff, 0xffdd88];
          this.objectLayer.fillStyle(fCols[fh % fCols.length], 0.38);
          this.objectLayer.fillCircle(fx, fy, 2.5 + (fh % 2));
          // Stem
          this.objectLayer.fillStyle(0x6a9a4a, 0.42);
          this.objectLayer.fillRect(fx, fy + 2, 1, 4);
        }
        // Grass blades in meadow
        for (let i = 0; i < 30; i++) {
          const gh = ((i * 53 + 3 * 11) * 29) & 0xffff;
          const gx2 = 20 + (gh % 240);
          const gy2 = 40 + ((gh * 5) & 0xffff) % (H3 - 80);
          this.objectLayer.fillStyle(0x5a8a3a, 0.28);
          this.objectLayer.fillRect(gx2, gy2 - 6, 1, 7);
          this.objectLayer.fillRect(gx2 + 3, gy2 - 4, 1, 5);
        }

        // Fork in road signpost at x≈200
        const fkX = 200, fkY = Math.round(H3 / 2) - 8;
        // Post
        this.objectLayer.fillStyle(0x6b4a20, 0.9);
        this.objectLayer.fillRect(fkX - 1, fkY - 35, 3, 45);
        // Left sign (narrow gate — gold, good)
        this.objectLayer.fillStyle(0xd4a853, 0.88);
        this.objectLayer.fillRect(fkX - 32, fkY - 34, 30, 10);
        this.objectLayer.fillTriangle(fkX - 32, fkY - 34, fkX - 38, fkY - 29, fkX - 32, fkY - 24);
        this.objectLayer.fillStyle(0x8b5a10, 0.5);
        this.objectLayer.fillRect(fkX - 30, fkY - 32, 26, 2);
        this.objectLayer.fillRect(fkX - 30, fkY - 28, 20, 2);
        // Right sign (easy path — muted brown, false)
        this.objectLayer.fillStyle(0x9a7840, 0.72);
        this.objectLayer.fillRect(fkX + 3, fkY - 34, 30, 10);
        this.objectLayer.fillTriangle(fkX + 33, fkY - 34, fkX + 39, fkY - 29, fkX + 33, fkY - 24);

        // Rocky terrain on right half (the false easy path)
        for (let i = 0; i < 12; i++) {
          const rh = ((i * 113 + 3 * 7) * 29) & 0xff;
          const rx = 320 + (rh % 220);
          const ry = 35 + ((rh * 5) & 0xff) % (H3 - 70);
          this.objectLayer.fillStyle(0x000000, 0.12);
          this.objectLayer.fillEllipse(rx + 2, ry + 3, 20 + (rh % 14), 8 + (rh % 5));
          this.objectLayer.fillStyle(0x555548, 0.52);
          this.objectLayer.fillEllipse(rx, ry, 18 + (rh % 14), 7 + (rh % 5));
          this.objectLayer.fillStyle(0x777768, 0.22);
          this.objectLayer.fillEllipse(rx - 3, ry - 2, 9, 4);
        }

        // Hill Difficulty looming on the right background
        const hillX = W3 - 80;
        const hillY = Math.round(H3 / 2) + 20;
        // Shadow base
        this.objectLayer.fillStyle(0x000000, 0.12);
        this.objectLayer.fillTriangle(hillX - 125, hillY + 45, hillX, hillY - 85, hillX + 125, hillY + 45);
        // Hill body — two overlapping peaks
        this.objectLayer.fillStyle(0x2a3018, 0.52);
        this.objectLayer.fillTriangle(hillX - 120, hillY + 40, hillX, hillY - 82, hillX + 120, hillY + 40);
        this.objectLayer.fillStyle(0x1e2410, 0.32);
        this.objectLayer.fillTriangle(hillX - 70, hillY + 40, hillX + 30, hillY - 52, hillX + 120, hillY + 40);
        // Rocky summit highlight
        this.objectLayer.fillStyle(0x7a8870, 0.22);
        this.objectLayer.fillTriangle(hillX - 18, hillY - 58, hillX, hillY - 82, hillX + 18, hillY - 58);
        // Pine trees on hillside
        for (let t = 0; t < 4; t++) {
          const tx = hillX - 80 + t * 35;
          const ty = hillY - 10 - t * 8;
          this.objectLayer.fillStyle(0x1a3018, 0.45);
          this.objectLayer.fillTriangle(tx - 5, ty + 6, tx, ty - 10, tx + 5, ty + 6);
          this.objectLayer.fillTriangle(tx - 4, ty + 4, tx, ty - 7, tx + 4, ty + 4);
        }
        break;
      }

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
        const cy = 100;
        // Hill leading up to cross
        this.objectLayer.fillStyle(0x1a1030, 0.6);
        this.objectLayer.fillTriangle(cx - 80, cy + 60, cx, cy + 5, cx + 80, cy + 60);
        this.objectLayer.fillStyle(0x1e1438, 0.4);
        this.objectLayer.fillTriangle(cx - 60, cy + 60, cx, cy + 10, cx + 60, cy + 60);
        // Outer radiance halos (multi-layered glow)
        const haloLevels = [
          { r: 80, a: 0.025 }, { r: 62, a: 0.05 }, { r: 48, a: 0.09 },
          { r: 35, a: 0.15 },  { r: 24, a: 0.22 }, { r: 14, a: 0.35 },
        ];
        haloLevels.forEach(({ r, a }) => {
          this.objectLayer!.fillStyle(0xffd700, a);
          this.objectLayer!.fillEllipse(cx, cy - 10, r * 2, r * 1.2);
        });
        // Cross beam shadow (subtle depth)
        this.objectLayer.fillStyle(0x000000, 0.3);
        this.objectLayer.fillRect(cx - 4 + 2, cy - 45 + 2, 8, 90);
        this.objectLayer.fillRect(cx - 22 + 2, cy - 30 + 2, 44, 9);
        // Cross main body (dark wood texture)
        this.objectLayer.fillStyle(0x4a2e10, 0.95);
        this.objectLayer.fillRect(cx - 4, cy - 45, 8, 90);
        this.objectLayer.fillRect(cx - 22, cy - 30, 44, 9);
        // Cross edge highlight (golden rim)
        this.objectLayer.lineStyle(1, 0xffd700, 0.5);
        this.objectLayer.strokeRect(cx - 4, cy - 45, 8, 90);
        this.objectLayer.strokeRect(cx - 22, cy - 30, 44, 9);
        // Bright core glow at intersection
        this.objectLayer.fillStyle(0xffffff, 0.18);
        this.objectLayer.fillCircle(cx, cy - 25, 8);
        this.objectLayer.fillStyle(0xffd700, 0.35);
        this.objectLayer.fillCircle(cx, cy - 25, 5);
        this.objectLayer.fillStyle(0xffffff, 0.5);
        this.objectLayer.fillCircle(cx, cy - 25, 2);
        // 8 radiating light beams
        for (let beam = 0; beam < 8; beam++) {
          const angle = (beam / 8) * Math.PI * 2;
          const bLen = 55;
          this.objectLayer.fillStyle(0xffd700, 0.04 - (beam % 2) * 0.01);
          this.objectLayer.fillTriangle(
            cx, cy - 25,
            cx + Math.cos(angle - 0.12) * bLen, cy - 25 + Math.sin(angle - 0.12) * bLen,
            cx + Math.cos(angle + 0.12) * bLen, cy - 25 + Math.sin(angle + 0.12) * bLen,
          );
        }
        // Ground path stones leading to hill
        for (let s = 0; s < 5; s++) {
          const stoneX = cx - 20 + s * 10;
          const stoneY = cy + 55;
          this.objectLayer.fillStyle(0x7a6a5a, 0.5);
          this.objectLayer.fillEllipse(stoneX, stoneY, 8, 4);
        }
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
        // Zone 3: Celestial City gates (x:2000-3000) — grand pearl gates
        const gateX12 = 2250;
        const gateY12 = H12 / 2 - 20;
        // Sweeping radiance halos behind gate
        const halo12 = [
          { r: 180, a: 0.018 }, { r: 140, a: 0.03 }, { r: 110, a: 0.05 },
          { r: 85,  a: 0.08 },  { r: 65,  a: 0.13 }, { r: 45,  a: 0.20 },
        ];
        halo12.forEach(({ r, a }) => {
          this.objectLayer!.fillStyle(0xffd700, a);
          this.objectLayer!.fillEllipse(gateX12, gateY12 - 40, r * 2.2, r * 1.4);
        });
        // 12 radiating beams (12 gates of the holy city)
        for (let beam = 0; beam < 12; beam++) {
          const angle = (beam / 12) * Math.PI * 2;
          const bLen = 160;
          this.objectLayer.fillStyle(0xffd700, 0.025 + (beam % 3 === 0 ? 0.01 : 0));
          this.objectLayer.fillTriangle(
            gateX12, gateY12 - 40,
            gateX12 + Math.cos(angle - 0.1) * bLen, gateY12 - 40 + Math.sin(angle - 0.1) * bLen,
            gateX12 + Math.cos(angle + 0.1) * bLen, gateY12 - 40 + Math.sin(angle + 0.1) * bLen,
          );
        }
        // Gate columns (pearl-white with gold trim)
        const colH = 140;
        const colY = gateY12 - colH;
        for (const colX of [gateX12 - 62, gateX12 + 50]) {
          // Pearl column body
          this.objectLayer.fillStyle(0xfafaf8, 0.85);
          this.objectLayer.fillRect(colX, colY, 12, colH);
          // Gold capital
          this.objectLayer.fillStyle(0xffd700, 0.75);
          this.objectLayer.fillRect(colX - 3, colY - 5, 18, 7);
          this.objectLayer.fillRect(colX - 2, colY + colH, 16, 5);
          // Column flute highlights
          this.objectLayer.fillStyle(0xffffff, 0.2);
          this.objectLayer.fillRect(colX + 3, colY + 5, 2, colH - 10);
          this.objectLayer.fillRect(colX + 7, colY + 5, 1, colH - 10);
        }
        // Grand arch header
        this.objectLayer.fillStyle(0xffd700, 0.8);
        this.objectLayer.fillRect(gateX12 - 62, colY - 2, 124, 10);
        // Arch crown (full circle)
        this.objectLayer.fillStyle(0xffd700, 0.55);
        this.objectLayer.fillCircle(gateX12, colY, 62);
        this.objectLayer.fillStyle(0xfff8e0, 0.3);
        this.objectLayer.fillCircle(gateX12, colY, 50);
        // Inner pearl gate opening
        this.objectLayer.fillStyle(0xffffff, 0.12);
        this.objectLayer.fillCircle(gateX12, colY, 42);
        this.objectLayer.fillStyle(0xffffee, 0.25);
        this.objectLayer.fillRect(gateX12 - 25, colY, 50, colH);
        // Gate cross motif
        this.objectLayer.fillStyle(0xffd700, 0.6);
        this.objectLayer.fillRect(gateX12 - 2, colY + 15, 4, 50);
        this.objectLayer.fillRect(gateX12 - 12, colY + 28, 24, 4);
        // Pearl floor
        this.objectLayer.fillStyle(0xfafaf8, 0.15);
        this.objectLayer.fillRect(gateX12 - 62, gateY12, 124, 8);
        // Golden road leading to gate (textured segments)
        for (let seg = 0; seg < 8; seg++) {
          const segX = 1920 + seg * 40;
          this.objectLayer.fillStyle(0xffd700, 0.08 + seg * 0.012);
          this.objectLayer.fillRect(segX, H12 / 2 - 12, 38, 24);
          // Road edge highlights
          this.objectLayer.fillStyle(0xffd700, 0.15 + seg * 0.02);
          this.objectLayer.fillRect(segX, H12 / 2 - 12, 38, 2);
          this.objectLayer.fillRect(segX, H12 / 2 + 10, 38, 2);
        }
        // Broader approach road
        this.objectLayer.fillStyle(0xffd700, 0.05);
        this.objectLayer.fillRect(1700, H12 / 2 - 18, 220, 36);
        // Shining Ones flanking the road (4 welcoming figures)
        for (const [soX, soY] of [[2080, H12 / 2 - 18], [2140, H12 / 2 + 5], [2340, H12 / 2 - 18], [2390, H12 / 2 + 5]]) {
          // Bright halo
          this.objectLayer.fillStyle(0xffd700, 0.2);
          this.objectLayer.fillCircle(soX, soY - 8, 10);
          this.objectLayer.fillStyle(0xffffff, 0.3);
          this.objectLayer.fillCircle(soX, soY - 8, 6);
          // Body glow
          this.objectLayer.fillStyle(0xffffff, 0.2);
          this.objectLayer.fillEllipse(soX, soY + 2, 8, 16);
          // Wing hint
          this.objectLayer.fillStyle(0xffffff, 0.12);
          this.objectLayer.fillEllipse(soX - 6, soY, 10, 6);
          this.objectLayer.fillEllipse(soX + 6, soY, 10, 6);
        }
        // Celestial city walls extending from gate
        this.objectLayer.fillStyle(0xffd700, 0.12);
        this.objectLayer.fillRect(gateX12 + 62, colY, 300, colH);
        this.objectLayer.fillRect(gateX12 - 362, colY, 300, colH);
        // Wall battlements
        for (let w = 0; w < 12; w++) {
          this.objectLayer.fillStyle(0xffd700, 0.2);
          this.objectLayer.fillRect(gateX12 + 62 + w * 26, colY - 8, 14, 10);
          this.objectLayer.fillRect(gateX12 - 362 + w * 26, colY - 8, 14, 10);
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
  clearMap(): void {
    this.parallaxBg?.destroy();
    this.parallaxBg = null;
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
