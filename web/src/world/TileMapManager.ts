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

    // ── 1. Base fill — Murmur-style hash for uniform variant distribution ──
    // (pure XOR/multiply hashes can alias on grid coords — use finalization mix)
    let _h = (x * 0xb5297a4d + y * 0x68e31da4 + 0x1b56c4e9) >>> 0;
    _h ^= _h >>> 16;
    _h = Math.imul(_h, 0x27d4eb2d) >>> 0;
    _h ^= _h >>> 15;
    const hash = _h & 0xffff;
    const isVariant = (hash % 9 < 2);  // ~22% variant scatter
    const base = isVariant ? theme.groundVariant : theme.groundBase;
    this.groundLayer.fillStyle(base, 1);
    this.groundLayer.fillRect(x, y, TILE_SIZE, TILE_SIZE);

    // ── 2. Bayer 2×2 dithering at variant tile borders ──
    if (isVariant) {
      for (let py = 0; py < TILE_SIZE; py += 2) {
        for (let pdx = TILE_SIZE - 3; pdx < TILE_SIZE; pdx++) {
          if ((pdx % 2 === 0) === (py % 2 === 0)) {
            this.groundLayer.fillStyle(0x000000, 0.09);
            this.groundLayer.fillRect(x + pdx, y + py, 1, 1);
          }
        }
      }
    }

    // ── 3. Subtle shading variation ──
    if ((hash & 0xf) < 3) {
      this.groundLayer.fillStyle(0x000000, 0.07 + ((hash >> 4) & 3) * 0.02);
      this.groundLayer.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    }
    if ((hash & 0x1f) < 2) {
      this.groundLayer.fillStyle(0xffffff, 0.06);
      this.groundLayer.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    }

    // ── 4. Detail elements ──
    const detailHash = (((x * 48271) ^ (y * 32767) ^ (x * y * 53)) >>> 0) & 0xffff;

    // Pebbles: 2-4 per eligible tile
    if (detailHash % 3 === 0) {
      const pebbleCount = 2 + (detailHash % 3);
      for (let p = 0; p < pebbleCount; p++) {
        const ph = ((detailHash * (p + 1) * 17) + x + y) & 0xffff;
        const px = x + 1 + (ph % (TILE_SIZE - 3));
        const py = y + 1 + ((ph >> 3) % (TILE_SIZE - 3));
        const pr = 0.7 + (ph % 2) * 0.5;
        this.groundLayer.fillStyle(0x000000, 0.28);
        this.groundLayer.fillCircle(px + 1, py + 1, pr);
        this.groundLayer.fillStyle(0x000000, 0.2);
        this.groundLayer.fillCircle(px, py, pr);
        this.groundLayer.fillStyle(0xffffff, 0.14);
        this.groundLayer.fillCircle(px - 0.4, py - 0.4, pr * 0.5);
      }
    }

    // Grass tufts: 3 individual 1px vertical lines clustered
    if ((detailHash & 0xfff) < 100) {
      const tgx = x + 1 + ((detailHash >> 2) % (TILE_SIZE - 6));
      const tgy = y + 2 + ((detailHash >> 5) % (TILE_SIZE - 6));
      const tuftCount = 1 + (detailHash % 2);
      for (let t = 0; t < tuftCount; t++) {
        const tx2 = tgx + t * 3;
        if (tx2 >= x + TILE_SIZE - 1) break;
        this.groundLayer.fillStyle(0x4a7a3a, 0.5);
        this.groundLayer.fillRect(tx2, tgy - 1, 1, 2);
        this.groundLayer.fillStyle(0x6a9a5a, 0.55);
        this.groundLayer.fillRect(tx2, tgy - 2, 1, 1);
      }
    }

    // Ground cracks: diagonal zigzag (1 per ~4 tiles)
    if ((detailHash & 0x3fff) < 40) {
      const crx = x + 2 + ((detailHash >> 4) % (TILE_SIZE - 7));
      const cry = y + 2 + ((detailHash >> 7) % (TILE_SIZE - 6));
      this.groundLayer.lineStyle(0.5, 0x000000, 0.38);
      this.groundLayer.lineBetween(crx, cry, crx + 2, cry + 1);
      this.groundLayer.lineBetween(crx + 2, cry + 1, crx + 3, cry);
      this.groundLayer.lineBetween(crx + 3, cry, crx + 5, cry + 2);
    }

    // Moss/lichen spot (chapter-tinted, 2px area)
    if ((detailHash & 0x7fff) < 18) {
      const mx = x + 2 + ((detailHash >> 6) % (TILE_SIZE - 5));
      const my = y + 2 + ((detailHash >> 9) % (TILE_SIZE - 5));
      const vr = (theme.groundVariant >> 16) & 0xff;
      const vg = (theme.groundVariant >> 8) & 0xff;
      const vb = theme.groundVariant & 0xff;
      const mossColor = (Math.max(0, vr - 20) << 16) | (Math.min(255, vg + 15) << 8) | Math.max(0, vb - 10);
      this.groundLayer.fillStyle(mossColor, 0.28);
      this.groundLayer.fillRect(mx, my, 2, 2);
      this.groundLayer.fillStyle(mossColor, 0.15);
      this.groundLayer.fillRect(mx - 1, my + 1, 4, 1);
    }

    // Chapter-specific surface details
    switch (chapter) {
      case 2: {
        // Mud puddles (dark blue-grey ellipses)
        if ((hash & 0xff) < 14) {
          this.groundLayer.fillStyle(0x2a3a4a, 0.22);
          this.groundLayer.fillEllipse(x + 3 + (hash % 8), y + 4 + ((hash >> 4) % 6), 6 + (hash % 5), 3);
        }
        // Reed tufts (vertical lines)
        if ((hash & 0xfff) < 10) {
          this.groundLayer.fillStyle(0x446644, 0.35);
          const rx = x + (hash % 12) + 2;
          const ry = y + ((hash >> 3) % 8) + 2;
          this.groundLayer.fillRect(rx, ry, 1, 5);
          this.groundLayer.fillRect(rx + 2, ry + 1, 1, 4);
          this.groundLayer.fillRect(rx - 1, ry + 2, 1, 3);
        }
        // Wavy water surface hint
        if ((hash & 0x3ff) < 5) {
          this.groundLayer.fillStyle(0x3a5a6a, 0.12);
          this.groundLayer.fillEllipse(x + 4 + (hash % 6), y + 6, 9, 2);
        }
        break;
      }
      case 3: {
        // Larger rocks
        if ((hash & 0xff) < 10) {
          const rw = 5 + (hash % 6);
          const rh = 3 + (hash % 4);
          this.groundLayer.fillStyle(0x6a6a60, 0.5);
          this.groundLayer.fillEllipse(x + 3 + (hash % 8), y + 4 + ((hash >> 3) % 8), rw, rh);
          this.groundLayer.fillStyle(0x888880, 0.2);
          this.groundLayer.fillEllipse(x + 2 + (hash % 8), y + 3 + ((hash >> 3) % 8), rw * 0.6, rh * 0.6);
        }
        // Scattered pebbles
        if ((hash & 0x7ff) < 20) {
          this.groundLayer.fillStyle(0x555550, 0.4);
          this.groundLayer.fillCircle(x + (hash % 14) + 1, y + ((hash >> 4) % 12) + 2, 1);
        }
        // Cliff face hint (vertical crack lines)
        if ((hash & 0xfff) < 5) {
          this.groundLayer.fillStyle(0x2a2a28, 0.2);
          this.groundLayer.fillRect(x + (hash % 14), y + 1, 1, 8 + (hash % 6));
        }
        break;
      }
      case 5: {
        // Bright golden light overlay on path
        if ((hash & 0xff) < 16) {
          this.groundLayer.fillStyle(0xd4a853, 0.06 + ((hash >> 6) & 3) * 0.01);
          this.groundLayer.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        }
        // Small wildflowers (pink/white dots)
        if ((hash & 0x7ff) < 18) {
          const flowerColors = [0xff99bb, 0xffffff, 0xffddaa];
          this.groundLayer.fillStyle(flowerColors[hash % flowerColors.length], 0.55);
          this.groundLayer.fillCircle(x + (hash % 12) + 2, y + ((hash >> 4) % 10) + 3, 1.2);
          // Stem
          this.groundLayer.fillStyle(0x6a9a4a, 0.3);
          this.groundLayer.fillRect(x + (hash % 12) + 2, y + ((hash >> 4) % 10) + 4, 1, 3);
        }
        break;
      }
      case 7: {
        // Bone fragments (thin white lines)
        if ((hash & 0xff) < 18) {
          this.groundLayer.fillStyle(0xddccbb, 0.22);
          this.groundLayer.fillRect(x + (hash % 10) + 2, y + ((hash >> 3) % 10) + 3, 5 + (hash % 4), 1);
          // Joint knob
          this.groundLayer.fillCircle(x + (hash % 10) + 2, y + ((hash >> 3) % 10) + 3, 1);
        }
        // Skull-like shapes (occasional round with 2 dark spots)
        if ((hash & 0x3fff) < 8) {
          const sx = x + (hash % 10) + 3;
          const sy = y + ((hash >> 4) % 8) + 4;
          this.groundLayer.fillStyle(0xccbbaa, 0.3);
          this.groundLayer.fillCircle(sx, sy, 3.5);
          this.groundLayer.fillStyle(0x080608, 0.6);
          this.groundLayer.fillCircle(sx - 1, sy - 0.5, 1);
          this.groundLayer.fillCircle(sx + 1, sy - 0.5, 1);
        }
        // Dark mist wisps
        if ((hash & 0x1fff) < 12) {
          this.groundLayer.fillStyle(0x220033, 0.08);
          this.groundLayer.fillEllipse(x + (hash % 12), y + ((hash >> 3) % 10), 8 + (hash % 6), 3);
        }
        break;
      }
      case 8: {
        // Colorful market debris (tiny colored squares)
        if ((hash & 0xff) < 22) {
          const debrisColors = [0xff4444, 0x44aaff, 0xffcc00, 0x44cc44, 0xaa44cc, 0xff88aa];
          this.groundLayer.fillStyle(debrisColors[hash % debrisColors.length], 0.3);
          this.groundLayer.fillRect(x + (hash % 12) + 2, y + ((hash >> 3) % 12) + 2, 2, 2);
        }
        // Cobblestone pattern (more defined grid)
        if ((hash & 0x3ff) < 60) {
          this.groundLayer.fillStyle(0x555566, 0.08);
          const cx2 = x + ((hash >> 3) % 4) * 4;
          const cy2 = y + ((hash >> 5) % 4) * 4;
          this.groundLayer.fillRect(cx2, cy2, 3, 3);
        }
        // Cobblestone joint lines
        this.groundLayer.fillStyle(0x333344, 0.06);
        this.groundLayer.fillRect(x, y + 4, TILE_SIZE, 1);
        this.groundLayer.fillRect(x, y + 8, TILE_SIZE, 1);
        this.groundLayer.fillRect(x, y + 12, TILE_SIZE, 1);
        this.groundLayer.fillRect(x + 4, y, 1, TILE_SIZE);
        this.groundLayer.fillRect(x + 8, y, 1, TILE_SIZE);
        this.groundLayer.fillRect(x + 12, y, 1, TILE_SIZE);
        break;
      }
      case 9: {
        // Stone block grid pattern (more regular, darker joints)
        this.groundLayer.fillStyle(0x1a1020, 0.1);
        this.groundLayer.fillRect(x, y + TILE_SIZE / 2, TILE_SIZE, 1);
        this.groundLayer.fillRect(x + TILE_SIZE / 2, y, 1, TILE_SIZE);
        // Water dripping hint (vertical streak)
        if ((hash & 0x1fff) < 6) {
          this.groundLayer.fillStyle(0x2a3a55, 0.18);
          this.groundLayer.fillRect(x + (hash % 12) + 2, y + 2, 1, 10 + (hash % 4));
        }
        break;
      }
      case 10: {
        // Flower patches (bright dots)
        if ((hash & 0xff) < 14) {
          const flowerCols = [0xff6688, 0xffcc44, 0x88ddff, 0xaaffaa, 0xff88cc];
          this.groundLayer.fillStyle(flowerCols[hash % flowerCols.length], 0.45);
          this.groundLayer.fillCircle(x + (hash % 12) + 2, y + ((hash >> 3) % 10) + 3, 1.5);
        }
        // Soft grass rendering (small grass blades)
        if ((hash & 0x7ff) < 20) {
          this.groundLayer.fillStyle(0x66cc66, 0.2);
          const gx = x + (hash % 12) + 2;
          const gy = y + ((hash >> 4) % 10) + 4;
          this.groundLayer.fillRect(gx, gy, 1, 4);
          this.groundLayer.fillRect(gx + 2, gy + 1, 1, 3);
        }
        // Lighter tone overlay
        if ((hash & 0x1f) < 4) {
          this.groundLayer.fillStyle(0xaaddaa, 0.04);
          this.groundLayer.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        }
        break;
      }
      case 12: {
        // Golden shimmer overlay
        if ((hash & 0xff) < 20) {
          this.groundLayer.fillStyle(0xffd700, 0.05 + ((hash >> 6) & 3) * 0.01);
          this.groundLayer.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        }
        // Pearl-like sparkle dots
        if ((hash & 0x7ff) < 15) {
          this.groundLayer.fillStyle(0xffffff, 0.25);
          this.groundLayer.fillCircle(x + (hash % 14) + 1, y + ((hash >> 4) % 12) + 2, 0.8);
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

    // Determine tree variant by chapter and hash
    const variant = this.getTreeVariant(chapter, hash);

    if (variant === 'pine') {
      this.drawPineTree(x, y, hash, chapter);
    } else if (variant === 'dead') {
      this.drawDeadTree(x, y, hash);
    } else if (variant === 'palm') {
      this.drawPalmTree(x, y, hash);
    } else {
      this.drawRoundTree(x, y, hash, chapter);
    }
  }

  private getTreeVariant(chapter: number, hash: number): 'round' | 'pine' | 'dead' | 'palm' {
    if (chapter === 10) return 'palm';
    if (chapter === 7 || chapter === 8 || chapter === 9 || chapter === 11) return hash % 3 === 0 ? 'dead' : 'pine';
    if (chapter === 2 || chapter === 4) return hash % 2 === 0 ? 'pine' : 'round';
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
