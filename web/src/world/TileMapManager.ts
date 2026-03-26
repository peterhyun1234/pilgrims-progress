import { TILE_SIZE, GAME_WIDTH, GAME_HEIGHT } from '../config';
import { ChapterConfig, ChapterTheme } from './ChapterData';

export class TileMapManager {
  private scene: Phaser.Scene;
  private groundLayer: Phaser.GameObjects.Graphics | null = null;
  private decorLayer: Phaser.GameObjects.Graphics | null = null;
  private objectLayer: Phaser.GameObjects.Graphics | null = null;
  private fogLayer: Phaser.GameObjects.Graphics | null = null;
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
    this.objectLayer?.destroy(); this.objectLayer = null;
    this.fogLayer?.destroy(); this.fogLayer = null;
    this.colliders?.destroy(true, true); this.colliders = null;
  }
}
