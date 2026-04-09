import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, SCENE_KEYS } from '../config';
import { ServiceLocator, SERVICE_KEYS } from '../core/ServiceLocator';
import { GameManager } from '../core/GameManager';
import { DesignSystem } from '../ui/DesignSystem';
import { SaveManager } from '../save/SaveManager';
import { AudioManager } from '../audio/AudioManager';

interface Particle {
  x: number; y: number; vx: number; vy: number;
  alpha: number; size: number; phase: number;
  color: number;
}

export class MenuScene extends Phaser.Scene {
  private particles: Particle[] = [];
  private particleGfx!: Phaser.GameObjects.Graphics;
  private continueBtn: Phaser.GameObjects.Container | null = null;
  private bgLayers: Phaser.GameObjects.Graphics[] = [];
  private horizonGlow!: Phaser.GameObjects.Graphics;
  private pilgrimGfx!: Phaser.GameObjects.Graphics;
  private pilgrimPhase = 0;

  constructor() {
    super({ key: SCENE_KEYS.MENU });
  }

  create(): void {
    const cx = GAME_WIDTH / 2;
    const gm = ServiceLocator.get<GameManager>(SERVICE_KEYS.GAME_MANAGER);
    const ko = gm.language === 'ko';

    this.buildBackground();
    this.createParticles();
    this.buildUI(cx, ko);
    this.addMenuPolish();
    DesignSystem.fadeIn(this, 800);
  }

  // ── Cinematic Background ─────────────────────────────────────────────────

  private buildBackground(): void {
    const W = GAME_WIDTH;
    const H = GAME_HEIGHT;
    const HOR = H * 0.45; // horizon line — upper half for sky, lower for ground+buttons

    // Layer 0: Deep sky gradient (top → horizon)
    const sky = this.add.graphics().setDepth(-10);
    const skyStrips = 24;
    for (let i = 0; i < skyStrips; i++) {
      const t = i / skyStrips;
      const color = this.lerpColor(0x050310, 0x16082a, t);
      sky.fillStyle(color, 1);
      sky.fillRect(0, Math.floor(t * HOR), W, Math.ceil(HOR / skyStrips) + (i === skyStrips - 1 ? 8 : 1));
    }
    this.bgLayers.push(sky);

    // Stars
    const stars = this.add.graphics().setDepth(-9);
    for (let i = 0; i < 90; i++) {
      const h = ((i * 137 + 7) * 31) & 0xffff;
      const sx = h % W;
      const sy = (h * 3) % (HOR * 0.85);
      const brightness = 0.2 + (h % 10) * 0.07;
      const sz = 0.4 + (h % 3) * 0.3;
      stars.fillStyle(0xffffff, brightness);
      stars.fillCircle(sx, sy, sz);
    }
    this.bgLayers.push(stars);

    // Moon (top-right area)
    const moon = this.add.graphics().setDepth(-8);
    const mx = W * 0.78, my = H * 0.16;
    moon.fillStyle(0xeeddcc, 0.6);
    moon.fillCircle(mx, my, 11);
    moon.fillStyle(0xffeedd, 0.35);
    moon.fillCircle(mx, my, 8);
    moon.fillStyle(0xffffff, 0.2);
    moon.fillCircle(mx - 1, my - 1, 5);
    // Moon glow rings
    for (let i = 1; i <= 4; i++) {
      moon.fillStyle(0xddccbb, 0.04 / i);
      moon.fillCircle(mx, my, 11 + i * 6);
    }
    this.bgLayers.push(moon);

    // Celestial City glow on horizon (center-right)
    const glowX = W * 0.65;
    this.horizonGlow = this.add.graphics().setDepth(-7);
    this.drawHorizonGlow(this.horizonGlow, glowX, HOR);

    // Far mountains silhouette
    const mtFar = this.add.graphics().setDepth(-6);
    for (let x = -20; x < W + 40; x += 30) {
      const h2 = ((x * 31 + 7) * 17) & 0xff;
      const mh = 25 + (h2 % 32);
      const mw = 40 + (h2 % 25);
      mtFar.fillStyle(0x0d0520, 0.8);
      mtFar.fillTriangle(x, HOR + 2, x + mw / 2, HOR - mh, x + mw, HOR + 2);
    }
    this.bgLayers.push(mtFar);

    // Near mountains + hill
    const mtNear = this.add.graphics().setDepth(-5);
    for (let x = -30; x < W + 60; x += 50) {
      const h2 = ((x * 53 + 3) * 23) & 0xff;
      const mh = 35 + (h2 % 26);
      const mw = 70 + (h2 % 40);
      mtNear.fillStyle(0x0a031a, 0.95);
      mtNear.fillTriangle(x, HOR + 2, x + mw / 2, HOR - mh, x + mw, HOR + 2);
    }
    this.bgLayers.push(mtNear);

    // Ground (below horizon)
    const ground = this.add.graphics().setDepth(-4);
    const groundStrips = 10;
    for (let i = 0; i < groundStrips; i++) {
      const t = i / groundStrips;
      const color = this.lerpColor(0x12082a, 0x08041a, t);
      ground.fillStyle(color, 1);
      ground.fillRect(0, HOR + i * (H - HOR) / groundStrips, W, (H - HOR) / groundStrips + 2);
    }
    // Horizon blend strip — softens sky/ground seam
    ground.fillStyle(0x16082a, 0.35);
    ground.fillRect(0, HOR - 4, W, 12);
    ground.fillStyle(0x0d0618, 0.25);
    ground.fillRect(0, HOR, W, 8);

    this.bgLayers.push(ground);

    // The narrow path — golden winding road to the light
    const path = this.add.graphics().setDepth(-3);
    this.drawPilgrimPath(path, W, H, HOR, glowX);
    this.bgLayers.push(path);

    // Tree silhouettes flanking the path (depth)
    const trees = this.add.graphics().setDepth(-3);
    this.drawTreeSilhouettes(trees, W, H, HOR);
    this.bgLayers.push(trees);

    // Pilgrim silhouette on the path (animated in update())
    this.pilgrimGfx = this.add.graphics().setDepth(-2);
    this.bgLayers.push(this.pilgrimGfx);

    // Foreground vignette overlay
    const vig = this.add.graphics().setDepth(-1);
    for (let i = 0; i < 12; i++) {
      const t = i / 12;
      vig.fillStyle(0x000000, 0.18 * (1 - t));
      vig.fillRect(0, 0, W, 6 - i * 0.5 + 1);
      vig.fillRect(0, H - 6 + i, W, 6);
    }
    for (let i = 0; i < 8; i++) {
      const t = i / 8;
      vig.fillStyle(0x000000, 0.12 * (1 - t));
      vig.fillRect(0, 0, 5, H);
      vig.fillRect(W - 5, 0, 5, H);
    }
    this.bgLayers.push(vig);
  }

  private drawHorizonGlow(g: Phaser.GameObjects.Graphics, cx: number, hy: number): void {
    g.clear();
    // Wide outer halo
    const colors = [
      { r: 120, a: 0.06 },
      { r: 85,  a: 0.10 },
      { r: 60,  a: 0.16 },
      { r: 38,  a: 0.26 },
      { r: 22,  a: 0.38 },
      { r: 12,  a: 0.50 },
    ];
    for (const { r, a } of colors) {
      g.fillStyle(0xffd4a0, a);
      g.fillEllipse(cx, hy, r * 2.4, r * 0.8);
    }
    // Celestial City spire hints (vertical streaks)
    g.fillStyle(0xffeedd, 0.22);
    g.fillRect(cx - 1, hy - 18, 2, 20);
    g.fillStyle(0xffd4a0, 0.14);
    g.fillRect(cx - 6, hy - 12, 1, 14);
    g.fillRect(cx + 5, hy - 10, 1, 12);
    // Bright core
    g.fillStyle(0xffffff, 0.30);
    g.fillEllipse(cx, hy, 20, 6);
  }

  private drawTreeSilhouettes(g: Phaser.GameObjects.Graphics, W: number, H: number, HOR: number): void {
    // Pine tree silhouettes along the horizon line — left and right of path
    const treePositions = [
      { x: 30,       scaleY: 1.1, side: 'L' },
      { x: 65,       scaleY: 0.9, side: 'L' },
      { x: 100,      scaleY: 1.2, side: 'L' },
      { x: 130,      scaleY: 0.85, side: 'L' },
      { x: W - 40,  scaleY: 1.0, side: 'R' },
      { x: W - 70,  scaleY: 1.15, side: 'R' },
      { x: W - 110, scaleY: 0.9, side: 'R' },
      { x: W - 145, scaleY: 1.05, side: 'R' },
    ];
    const baseY = HOR + 2;
    treePositions.forEach(({ x, scaleY }) => {
      const h = 28 * scaleY;
      const w = 14 * scaleY;
      // Double triangle pine
      g.fillStyle(0x060416, 0.95);
      g.fillTriangle(x, baseY, x - w / 2, baseY - h * 0.55, x + w / 2, baseY - h * 0.55);
      g.fillTriangle(x, baseY - h * 0.3, x - w * 0.65, baseY - h * 0.8, x + w * 0.65, baseY - h * 0.8);
      g.fillTriangle(x, baseY - h * 0.6, x - w * 0.4, baseY - h, x + w * 0.4, baseY - h);
      // Trunk
      g.fillStyle(0x050310, 0.8);
      g.fillRect(x - 1.5, baseY, 3, 5);
    });

    // Foreground tall trees (bottom edge, more imposing)
    const fgTrees = [
      { x: 10,      h: 55 },
      { x: W - 18, h: 48 },
    ];
    fgTrees.forEach(({ x, h }) => {
      g.fillStyle(0x030210, 0.98);
      g.fillTriangle(x, H, x - 12, H - h * 0.5, x + 12, H - h * 0.5);
      g.fillTriangle(x, H - h * 0.25, x - 9, H - h * 0.75, x + 9, H - h * 0.75);
      g.fillTriangle(x, H - h * 0.5, x - 6, H - h, x + 6, H - h);
    });
  }

  private drawPilgrimPath(g: Phaser.GameObjects.Graphics, W: number, H: number, HOR: number, destX: number): void {
    // A golden winding path from bottom-left toward the celestial glow
    const pathPoints: { x: number; y: number; w: number }[] = [];
    const startX = W * 0.15;
    const steps = 20;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = startX + (destX - startX) * t + Math.sin(t * Math.PI * 2) * 12 * (1 - t);
      const y = H - (H - HOR) * t * 0.98;
      const w = 8 * (1 - t * 0.7) + 1;
      pathPoints.push({ x, y, w });
    }

    for (let i = 0; i < pathPoints.length - 1; i++) {
      const p = pathPoints[i];
      const pn = pathPoints[i + 1];
      const t = i / pathPoints.length;
      // Warm stone base
      g.fillStyle(0x8a6a3a, 0.25 + t * 0.15);
      g.fillEllipse((p.x + pn.x) / 2, (p.y + pn.y) / 2, p.w, 4);
      // Gold shimmer overlay
      g.fillStyle(0xd4a853, 0.12 + t * 0.18);
      g.fillEllipse((p.x + pn.x) / 2, (p.y + pn.y) / 2, p.w * 0.7, 2.5);
    }
  }


  // ── UI Layout ────────────────────────────────────────────────────────────

  private buildUI(cx: number, ko: boolean): void {
    const gm = ServiceLocator.get<GameManager>(SERVICE_KEYS.GAME_MANAGER);
    const W = GAME_WIDTH;
    const H = GAME_HEIGHT;

    // — Title area (upper sky zone: y=8 → y=110) —
    // Stack: cross(16) → 4px → title(18) → 6px → subtitle(11) → 6px → divider → 6px → verse(11)
    // Heights: 16 + 4 + 18 + 6 + 11 + 6 + 2 + 6 + 11 = 80px total → fits in 8–88

    const CROSS_Y  = 16;
    const TITLE_Y  = CROSS_Y + 16 + 6;   // 38
    const SUB_Y    = TITLE_Y + 18 + 5;   // 61
    const DIV_Y    = SUB_Y  + 11 + 5;    // 77
    const VERSE_Y  = DIV_Y  + 2  + 6;    // 85

    // Decorative cross with glow
    const crossGlow = this.add.graphics().setDepth(9);
    crossGlow.fillStyle(0xd4a853, 0.08);
    crossGlow.fillCircle(cx, CROSS_Y, 18);
    crossGlow.fillStyle(0xd4a853, 0.04);
    crossGlow.fillCircle(cx, CROSS_Y, 28);

    const cross = this.add.text(cx, CROSS_Y, '✝', {
      fontSize: '14px', color: '#d4a853', fontFamily: 'serif',
      shadow: { offsetX: 0, offsetY: 0, color: '#d4a853', blur: 6, stroke: false, fill: true },
    }).setOrigin(0.5, 0.5).setAlpha(0).setDepth(10);
    this.tweens.add({ targets: cross, alpha: 0.7, duration: 1200, ease: 'Quad.easeOut' });
    this.tweens.add({ targets: cross, y: CROSS_Y + 2, duration: 3500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // Main title
    const title = this.add.text(cx, TITLE_Y - 6, gm.i18n.t('game.title'), {
      fontSize: `${ko ? DesignSystem.FONT_SIZE.LG : DesignSystem.FONT_SIZE.BASE}px`,
      color: '#f0e8d0',
      fontFamily: DesignSystem.getFontFamily(),
      fontStyle: 'bold',
      shadow: { offsetX: 1, offsetY: 2, color: '#d4a853', blur: 6, stroke: true, fill: true },
    }).setOrigin(0.5, 0.5).setAlpha(0).setDepth(10);
    this.tweens.add({ targets: title, alpha: 1, y: TITLE_Y, duration: 900, delay: 200, ease: 'Back.easeOut' });

    // Subtitle
    const subtitle = this.add.text(cx, SUB_Y, gm.i18n.t('game.subtitle'), {
      fontSize: `${DesignSystem.FONT_SIZE.XS}px`, color: '#a09080',
      fontFamily: DesignSystem.getFontFamily(),
      shadow: { offsetX: 1, offsetY: 1, color: '#000000', blur: 2, stroke: true, fill: true },
    }).setOrigin(0.5, 0.5).setAlpha(0).setDepth(10);
    this.tweens.add({ targets: subtitle, alpha: 0.7, duration: 700, delay: 500 });

    // Ornamental divider
    const divider = this.add.graphics().setDepth(10).setAlpha(0);
    divider.lineStyle(0.5, 0xd4a853, 0.3);
    divider.lineBetween(cx - 70, DIV_Y, cx + 70, DIV_Y);
    divider.fillStyle(0xd4a853, 0.5);
    divider.fillCircle(cx, DIV_Y, 1.5);
    divider.fillCircle(cx - 70, DIV_Y, 1);
    divider.fillCircle(cx + 70, DIV_Y, 1);
    this.tweens.add({ targets: divider, alpha: 1, duration: 600, delay: 600 });

    // Bible verse
    const verse = this.add.text(cx, VERSE_Y, '"좁은 문으로 들어가라"  마 7:13', {
      fontSize: `${DesignSystem.FONT_SIZE.SM}px`, color: '#d4c890',
      fontFamily: DesignSystem.getFontFamily(),
      shadow: { offsetX: 1, offsetY: 1, color: '#000000', blur: 2, stroke: true, fill: true },
    }).setOrigin(0.5, 0.5).setDepth(10).setAlpha(0);
    this.tweens.add({ targets: verse, alpha: 1.0, duration: 800, delay: 1200 });

    // — Button panel (H*0.60 = clearly below the mountain horizon) —
    const btnAreaY = Math.round(H * 0.60);
    this.buildButtonPanel(cx, btnAreaY, ko);

    // — Bottom info bar —
    this.add.text(12, H - 10, '⛶', {
      fontSize: '12px', color: '#7a6858', fontFamily: 'serif',
    }).setOrigin(0, 1).setDepth(10)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => MenuScene.toggleFullscreen())
      .on('pointerover', function(this: Phaser.GameObjects.Text) { this.setColor('#d4a853'); })
      .on('pointerout', function(this: Phaser.GameObjects.Text) { this.setColor('#7a6858'); });

    this.add.text(W - 8, H - 8, 'v1.0.0', {
      fontSize: `${DesignSystem.FONT_SIZE.XS}px`, color: '#5a5040', fontFamily: DesignSystem.getFontFamily(),
    }).setOrigin(1, 1).setDepth(10);
  }

  private buildButtonPanel(cx: number, topY: number, ko: boolean): void {
    const gm = ServiceLocator.get<GameManager>(SERVICE_KEYS.GAME_MANAGER);
    const btnW = 164;
    const btnH = 24;
    const gap = 8;

    // 3-button layout within remaining screen space (topY → GAME_HEIGHT-6)
    // New Journey | Continue (+ save subtitle) | Settings
    const continueY  = topY + btnH + gap;
    const settingsY  = continueY + btnH + gap;
    const panelBottom = Math.min(settingsY + btnH / 2 + 10, GAME_HEIGHT - 6);
    const panelH = panelBottom - (topY - 8);

    const panelBg = this.add.graphics().setDepth(10).setAlpha(0);
    panelBg.fillStyle(0x06031a, 0.88);
    panelBg.fillRoundedRect(cx - btnW / 2 - 12, topY - 8, btnW + 24, panelH, 6);
    panelBg.lineStyle(1, 0xd4a853, 0.25);
    panelBg.strokeRoundedRect(cx - btnW / 2 - 12, topY - 8, btnW + 24, panelH, 6);
    // Inner gold highlight strip at top of panel
    panelBg.fillStyle(0xd4a853, 0.06);
    panelBg.fillRoundedRect(cx - btnW / 2 - 11, topY - 7, btnW + 22, 10, 5);
    this.tweens.add({ targets: panelBg, alpha: 1, duration: 500, delay: 700 });

    // makeBtn: creates a stylised button container at (cx, y)
    const makeBtn = (
      y: number, label: string, cb: () => void,
      opts?: { accent?: boolean; dim?: boolean; subtitle?: string },
    ) => {
      const totalH = opts?.subtitle ? btnH + 11 : btnH;
      const c = this.add.container(cx, y).setDepth(11).setAlpha(0);
      this.tweens.add({ targets: c, alpha: opts?.dim ? 0.35 : 1, duration: 400, delay: 800 });

      const bg = this.add.graphics();
      // Use visually distinct, readable colors for each button type
      // accent (new journey) = warm gold-green; normal = dark navy; both with clear borders
      const defColor   = opts?.accent ? 0x243818 : 0x1a1530;
      const hoverColor = opts?.accent ? 0x365428 : 0x282050;
      const borderColor = opts?.accent ? 0x7acc44 : 0xd4a853;

      const drawBg = (fill: number, bdr: number, bdrA: number) => {
        bg.clear();
        bg.fillStyle(fill, 0.97);
        bg.fillRoundedRect(-btnW / 2, -totalH / 2, btnW, totalH, 4);
        bg.lineStyle(1.5, bdr, bdrA);
        bg.strokeRoundedRect(-btnW / 2, -totalH / 2, btnW, totalH, 4);
        // Thin inner highlight at top edge
        bg.fillStyle(0xffffff, opts?.accent ? 0.08 : 0.04);
        bg.fillRect(-btnW / 2 + 2, -totalH / 2 + 1, btnW - 4, 2);
      };
      drawBg(defColor, borderColor, opts?.accent ? 0.9 : 0.55);

      const labelY = opts?.subtitle ? -6 : 0;
      const txt = this.add.text(0, labelY, label, {
        fontSize: `${DesignSystem.FONT_SIZE.SM}px`,
        color: opts?.accent ? '#c8ff88' : '#d0c8b8',
        fontFamily: DesignSystem.getFontFamily(),
        shadow: opts?.accent
          ? { offsetX: 0, offsetY: 1, color: '#1a4400', blur: 4, stroke: true, fill: true }
          : { offsetX: 1, offsetY: 1, color: '#000', blur: 2, stroke: true, fill: true },
      }).setOrigin(0.5, 0.5);

      c.add([bg, txt]);

      if (opts?.subtitle) {
        const sub = this.add.text(0, 7, opts.subtitle, {
          fontSize: `${DesignSystem.FONT_SIZE.XS}px`,
          color: '#a09070',
          fontFamily: DesignSystem.getFontFamily(),
          shadow: { offsetX: 1, offsetY: 1, color: '#000', blur: 0, stroke: true, fill: true },
        }).setOrigin(0.5, 0.5);
        c.add(sub);
      }

      const hit = this.add.rectangle(0, 0, btnW, totalH, 0, 0)
        .setInteractive({ useHandCursor: !opts?.dim });
      hit.on('pointerover', () => {
        if (opts?.dim) return;
        drawBg(hoverColor, borderColor, 1.0);
        txt.setColor(opts?.accent ? '#e8ffaa' : '#ede8e0');
        if (ServiceLocator.has(SERVICE_KEYS.AUDIO_MANAGER)) {
          ServiceLocator.get<AudioManager>(SERVICE_KEYS.AUDIO_MANAGER).procedural?.playUIHover();
        }
      });
      hit.on('pointerout', () => {
        drawBg(defColor, borderColor, opts?.accent ? 0.9 : 0.55);
        txt.setColor(opts?.accent ? '#c8ff88' : '#d0c8b8');
      });
      hit.on('pointerdown', () => {
        if (opts?.dim) return;
        if (ServiceLocator.has(SERVICE_KEYS.AUDIO_MANAGER)) {
          ServiceLocator.get<AudioManager>(SERVICE_KEYS.AUDIO_MANAGER).procedural?.playUIClick();
        }
        this.tweens.add({ targets: c, scaleX: 0.96, scaleY: 0.96, duration: 60, yoyo: true });
        this.time.delayedCall(80, cb);
      });
      c.add(hit);
      return c;
    };

    makeBtn(topY, gm.i18n.t('menu.newJourney'), () => this.startNewGame(), { accent: true });
    this.continueBtn = makeBtn(continueY, gm.i18n.t('menu.continueJourney'), () => this.continueGame(), { dim: true });
    makeBtn(settingsY, gm.i18n.t('menu.settings'), () => {
      this.scene.pause();
      this.scene.launch('SettingsScene', { from: 'MenuScene' });
    });

    this.checkSaveExists(continueY, ko);
  }

  // ── Menu Polish (Phase 4C) ─────────────────────────────────────────────

  private addMenuPolish(): void {
    const W = GAME_WIDTH;
    const mx = W * 0.78, my = GAME_HEIGHT * 0.16;

    // Moon gentle pulse (scale 1.0 → 1.05 → 1.0 over 3s)
    // We use a container to allow scaling around moon center
    const moonContainer = this.add.container(mx, my).setDepth(-8);
    const moonDisc = this.add.graphics();
    moonDisc.fillStyle(0xeeddcc, 0.6);
    moonDisc.fillCircle(0, 0, 11);
    moonDisc.fillStyle(0xffeedd, 0.35);
    moonDisc.fillCircle(0, 0, 8);
    moonDisc.fillStyle(0xffffff, 0.2);
    moonDisc.fillCircle(-1, -1, 5);
    for (let i = 1; i <= 4; i++) {
      moonDisc.fillStyle(0xddccbb, 0.04 / i);
      moonDisc.fillCircle(0, 0, 11 + i * 6);
    }
    moonContainer.add(moonDisc);
    this.tweens.add({
      targets: moonContainer,
      scaleX: 1.05, scaleY: 1.05,
      duration: 3000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Shooting stars — occasionally cross the sky
    this.scheduleShootingStar();

    // Highscore display — placed at horizon line (H*0.45) to avoid button area overlap
    let stored: string | null = null;
    try { stored = localStorage.getItem('pp_highscore_faith'); } catch { /* private browsing */ }
    if (stored) {
      const gm = ServiceLocator.get<GameManager>(SERVICE_KEYS.GAME_MANAGER);
      const ko = gm.language === 'ko';
      const label = ko ? `✝ 최고 믿음: ${stored}` : `✝ Best Faith: ${stored}`;
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.44, label, {
        fontSize: `${DesignSystem.FONT_SIZE.XS}px`,
        color: '#a09060',
        fontFamily: DesignSystem.getFontFamily(),
        shadow: { offsetX: 1, offsetY: 1, color: '#000', blur: 1, stroke: true, fill: true },
      }).setOrigin(0.5, 0.5).setDepth(10).setAlpha(0.7);
    }
  }

  private scheduleShootingStar(): void {
    // Fire a shooting star every 4-8 seconds
    const delay = 4000 + Math.random() * 4000;
    this.time.delayedCall(delay, () => {
      if (!this.scene.isActive()) return;
      this.fireShootingStar();
      this.scheduleShootingStar();
    });
  }

  private fireShootingStar(): void {
    const W = GAME_WIDTH;
    const H = GAME_HEIGHT;
    const HOR = H * 0.45;
    // Random start position in upper sky
    const startX = Math.random() * W * 0.6;
    const startY = Math.random() * HOR * 0.5;
    const angle = 0.5 + Math.random() * 0.4; // diagonal down-right
    const length = 30 + Math.random() * 40;
    const duration = 300 + Math.random() * 200;

    const starGfx = this.add.graphics().setDepth(-7);
    const starObj = { t: 0 };
    this.tweens.add({
      targets: starObj,
      t: 1,
      duration,
      ease: 'Quad.easeIn',
      onUpdate: () => {
        starGfx.clear();
        const progress = starObj.t;
        const cx2 = startX + Math.cos(angle) * length * progress;
        const cy2 = startY + Math.sin(angle) * length * progress;
        const trailLen = length * 0.4;
        // Trail gradient (fades toward head)
        for (let s = 0; s < 5; s++) {
          const sp = s / 5;
          const tx = cx2 - Math.cos(angle) * trailLen * sp;
          const ty = cy2 - Math.sin(angle) * trailLen * sp;
          starGfx.fillStyle(0xffffff, (1 - sp) * 0.7 * (1 - progress));
          starGfx.fillCircle(tx, ty, (1 - sp) * 1.5);
        }
      },
      onComplete: () => starGfx.destroy(),
    });
  }

  // ── Particles ─────────────────────────────────────────────────────────

  private createParticles(): void {
    this.particleGfx = this.add.graphics().setDepth(5);
    // Firefly / ember mix
    for (let i = 0; i < 60; i++) {
      const isEmber = i < 22;
      this.particles.push({
        x: Math.random() * GAME_WIDTH,
        y: Math.random() * GAME_HEIGHT,
        vx: (Math.random() - 0.5) * 0.08,
        vy: isEmber ? (0.05 + Math.random() * 0.18) : -(0.05 + Math.random() * 0.22),
        alpha: isEmber ? (0.18 + Math.random() * 0.30) : (0.15 + Math.random() * 0.40),
        size: isEmber ? (0.4 + Math.random() * 1.0) : (0.5 + Math.random() * 1.4),
        phase: Math.random() * Math.PI * 2,
        color: isEmber ? 0xff7733 : 0xd4a853,
      });
    }
  }

  update(_time: number): void {
    this.particleGfx.clear();
    const t = this.time.now * 0.001;

    // Pulse horizon glow
    const pulse = 1 + Math.sin(t * 0.7) * 0.08;
    this.horizonGlow.setScale(pulse, pulse);

    this.particles.forEach(p => {
      p.y += p.vy;
      p.x += p.vx + Math.sin(t * 0.8 + p.phase) * 0.15;
      if (p.vy < 0 && p.y < -5) { p.y = GAME_HEIGHT + 5; p.x = Math.random() * GAME_WIDTH; }
      if (p.vy > 0 && p.y > GAME_HEIGHT + 5) { p.y = -5; p.x = Math.random() * GAME_WIDTH; }
      this.particleGfx.fillStyle(p.color, p.alpha * (0.7 + Math.sin(t * 2 + p.phase) * 0.3));
      this.particleGfx.fillCircle(p.x, p.y, p.size);
    });

    // Animated pilgrim — gentle walking bob
    this.pilgrimPhase += 0.03;
    const H = GAME_HEIGHT;
    const HOR = H * 0.45;
    const bobY = Math.sin(this.pilgrimPhase * 4) * 0.6;
    const legSwing = Math.sin(this.pilgrimPhase * 4) * 2;
    this.pilgrimGfx.clear();
    const px = GAME_WIDTH * 0.30;
    const py = HOR + (H - HOR) * 0.35 + bobY;
    this.drawAnimatedPilgrim(this.pilgrimGfx, px, py, legSwing);
  }

  private drawAnimatedPilgrim(g: Phaser.GameObjects.Graphics, x: number, y: number, legSwing: number): void {
    const dark = 0x08041a;
    // Shadow
    g.fillStyle(0x000000, 0.25);
    g.fillEllipse(x, y + 3, 10, 3);
    // Body
    g.fillStyle(dark, 0.9);
    g.fillRect(x - 2, y - 8, 4, 5);
    // Head
    g.fillCircle(x, y - 10, 2.5);
    // Staff
    g.fillRect(x + 3, y - 12, 1, 14);
    // Cloak flowing
    g.fillTriangle(x - 3, y - 4, x + 2, y - 4, x - 4, y + 2);
    // Animated legs
    g.fillStyle(dark, 0.85);
    g.fillRect(x - 2, y - 3, 1, 4 + legSwing * 0.3);
    g.fillRect(x + 1, y - 3, 1, 4 - legSwing * 0.3);
    // Small foot detail
    g.fillRect(x - 3, y + 1 + legSwing * 0.3, 3, 1);
    g.fillRect(x + 1, y + 1 - legSwing * 0.3, 3, 1);
    // Pack on back
    g.fillRect(x - 4, y - 7, 3, 3);
    // Staff tip glow (subtle)
    g.fillStyle(0xd4a853, 0.2);
    g.fillCircle(x + 3, y - 12, 2);
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  private lerpColor(a: number, b: number, t: number): number {
    const ar = (a >> 16) & 0xff, ag = (a >> 8) & 0xff, ab = a & 0xff;
    const br = (b >> 16) & 0xff, bg = (b >> 8) & 0xff, bb = b & 0xff;
    return (Math.round(ar + (br - ar) * t) << 16) |
           (Math.round(ag + (bg - ag) * t) << 8) |
            Math.round(ab + (bb - ab) * t);
  }

  static toggleFullscreen(): void {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  private async checkSaveExists(_continueBtnY: number, ko: boolean): Promise<void> {
    if (!ServiceLocator.has(SERVICE_KEYS.SAVE_MANAGER)) return;
    const saveManager = ServiceLocator.get<SaveManager>(SERVICE_KEYS.SAVE_MANAGER);

    let exists = false;
    try {
      exists = await saveManager.hasSave();
    } catch (err) {
      console.warn('[MenuScene] hasSave() failed:', err);
      return;
    }

    if (this.continueBtn) {
      this.tweens.add({ targets: this.continueBtn, alpha: exists ? 1 : 0.3, duration: 300 });
      this.continueBtn.getAll().forEach(child => {
        if (child instanceof Phaser.GameObjects.Rectangle) {
          exists ? child.setInteractive({ useHandCursor: true }) : child.disableInteractive();
        }
      });
    }

    if (exists) {
      let saveData: Awaited<ReturnType<typeof saveManager.load>>;
      try {
        saveData = await saveManager.load();
      } catch (err) {
        console.warn('[MenuScene] load() failed:', err);
        return;
      }

      if (saveData && typeof saveData.chapter === 'number' && saveData.stats) {
        const chapLabel = ko ? `제${saveData.chapter}장` : `Ch.${saveData.chapter}`;
        const faith = saveData.stats.faith ?? 0;
        const faithLabel = ko ? `믿음 ${faith}` : `Faith ${faith}`;
        const sub = this.add.text(0, 7, `${chapLabel}  ·  ${faithLabel}`, {
          fontSize: `${DesignSystem.FONT_SIZE.XS}px`, color: '#a09070',
          fontFamily: DesignSystem.getFontFamily(),
          shadow: { offsetX: 1, offsetY: 1, color: '#000', blur: 0, stroke: true, fill: true },
        }).setOrigin(0.5, 0.5);
        this.continueBtn!.add(sub);
        // Container layout: [0]=bg, [1]=txt(mainLabel), [2]=hit — shift label up
        const mainLabel = this.continueBtn!.getAt(1) as Phaser.GameObjects.Text;
        if (typeof mainLabel?.setY === 'function') mainLabel.setY(-6);
      }
    }
  }

  private async continueGame(): Promise<void> {
    if (!ServiceLocator.has(SERVICE_KEYS.SAVE_MANAGER)) return;
    const sm = ServiceLocator.get<SaveManager>(SERVICE_KEYS.SAVE_MANAGER);
    try {
      const saveData = await sm.load();
      if (!saveData) return;
      await DesignSystem.fadeOut(this, 600);
      this.scene.start(SCENE_KEYS.GAME);
    } catch (err) {
      console.error('[MenuScene] continueGame failed:', err);
    }
  }

  private async startNewGame(): Promise<void> {
    try {
      const gm = ServiceLocator.get<GameManager>(SERVICE_KEYS.GAME_MANAGER);
      gm.newGame();
      await DesignSystem.fadeOut(this, 600);
      this.scene.start(SCENE_KEYS.ONBOARDING);
    } catch (err) {
      console.error('[MenuScene] startNewGame failed:', err);
    }
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  shutdown(): void {
    // Phaser's time/tweens are auto-cleaned by the scene manager, but calling
    // stopAll() ensures no stray callbacks fire if the scene is restarted
    this.time.removeAllEvents();
    this.tweens.killAll();
    this.particles = [];
  }
}
