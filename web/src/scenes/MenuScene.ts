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
      sky.fillRect(0, Math.floor(t * HOR), W, Math.ceil(HOR / skyStrips) + 1);
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
      const mh = 18 + (h2 % 28);
      const mw = 40 + (h2 % 25);
      mtFar.fillStyle(0x0d0520, 0.8);
      mtFar.fillTriangle(x, HOR + 2, x + mw / 2, HOR - mh, x + mw, HOR + 2);
    }
    this.bgLayers.push(mtFar);

    // Near mountains + hill
    const mtNear = this.add.graphics().setDepth(-5);
    for (let x = -30; x < W + 60; x += 50) {
      const h2 = ((x * 53 + 3) * 23) & 0xff;
      const mh = 28 + (h2 % 22);
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
    this.bgLayers.push(ground);

    // The narrow path — golden winding road to the light
    const path = this.add.graphics().setDepth(-3);
    this.drawPilgrimPath(path, W, H, HOR, glowX);
    this.bgLayers.push(path);

    // Pilgrim silhouette on the path
    const pilgrim = this.add.graphics().setDepth(-2);
    this.drawPilgrimSilhouette(pilgrim, W * 0.30, HOR + (H - HOR) * 0.35);
    this.bgLayers.push(pilgrim);

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
    // Radial glow layers
    const colors = [
      { r: 100, a: 0.08 },
      { r: 65,  a: 0.14 },
      { r: 40,  a: 0.20 },
      { r: 22,  a: 0.30 },
      { r: 12,  a: 0.40 },
    ];
    for (const { r, a } of colors) {
      g.fillStyle(0xffd4a0, a);
      g.fillEllipse(cx, hy, r * 2.2, r * 0.7);
    }
    // Bright core
    g.fillStyle(0xffeedd, 0.25);
    g.fillEllipse(cx, hy, 18, 5);
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
      const alpha = 0.08 + t * 0.12;
      g.fillStyle(0xd4a853, alpha);
      g.fillEllipse((p.x + pn.x) / 2, (p.y + pn.y) / 2, p.w, 3);
    }
  }

  private drawPilgrimSilhouette(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
    // Small walking pilgrim silhouette (pixel art style, ~8px tall)
    const dark = 0x08041a;
    // Body
    g.fillStyle(dark, 0.9);
    g.fillRect(x - 2, y - 8, 4, 5);
    // Head
    g.fillCircle(x, y - 10, 2.5);
    // Staff
    g.fillRect(x + 3, y - 12, 1, 14);
    // Cloak flowing
    g.fillTriangle(x - 3, y - 4, x + 2, y - 4, x - 4, y + 2);
    // Legs (walking pose)
    g.fillRect(x - 2, y - 3, 1, 5);
    g.fillRect(x + 1, y - 2, 1, 4);
    // Pack on back
    g.fillRect(x - 4, y - 7, 3, 3);
  }

  // ── UI Layout ────────────────────────────────────────────────────────────

  private buildUI(cx: number, ko: boolean): void {
    const gm = ServiceLocator.get<GameManager>(SERVICE_KEYS.GAME_MANAGER);
    const W = GAME_WIDTH;
    const H = GAME_HEIGHT;

    // — Title area (upper third) —

    // Decorative cross with glow
    const crossGlow = this.add.graphics().setDepth(9);
    crossGlow.fillStyle(0xd4a853, 0.08);
    crossGlow.fillCircle(cx, 22, 22);
    crossGlow.fillStyle(0xd4a853, 0.04);
    crossGlow.fillCircle(cx, 22, 34);

    const cross = this.add.text(cx, 22, '✝', {
      fontSize: '16px', color: '#d4a853', fontFamily: 'serif',
      shadow: { offsetX: 0, offsetY: 0, color: '#d4a853', blur: 6, stroke: false, fill: true },
    }).setOrigin(0.5).setAlpha(0).setDepth(10);
    this.tweens.add({ targets: cross, alpha: 0.7, duration: 1200, ease: 'Quad.easeOut' });
    this.tweens.add({
      targets: cross, y: 24, duration: 3500,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    // Main title
    const title = this.add.text(cx, 42, gm.i18n.t('game.title'), {
      fontSize: `${ko ? DesignSystem.FONT_SIZE.LG : DesignSystem.FONT_SIZE.BASE}px`,
      color: '#e8dfc8',
      fontFamily: DesignSystem.getFontFamily(),
      fontStyle: 'bold',
      shadow: { offsetX: 0, offsetY: 0, color: '#d4a853', blur: 4, stroke: false, fill: true },
    }).setOrigin(0.5).setAlpha(0).setDepth(10);
    this.tweens.add({ targets: title, alpha: 1, y: 44, duration: 900, delay: 200, ease: 'Back.easeOut' });

    // Subtitle
    const subtitle = this.add.text(cx, 57, gm.i18n.t('game.subtitle'), {
      fontSize: `${DesignSystem.FONT_SIZE.XS}px`, color: '#a09080', fontFamily: DesignSystem.getFontFamily(),
    }).setOrigin(0.5).setAlpha(0).setDepth(10);
    this.tweens.add({ targets: subtitle, alpha: 0.7, duration: 700, delay: 500 });

    // Ornamental divider
    const divider = this.add.graphics().setDepth(10).setAlpha(0);
    divider.lineStyle(0.5, 0xd4a853, 0.3);
    divider.lineBetween(cx - 70, 67, cx + 70, 67);
    divider.fillStyle(0xd4a853, 0.5);
    divider.fillCircle(cx, 67, 1.5);
    divider.fillCircle(cx - 70, 67, 1);
    divider.fillCircle(cx + 70, 67, 1);
    this.tweens.add({ targets: divider, alpha: 1, duration: 600, delay: 600 });

    // — Bible verse —
    const verse = this.add.text(cx, 78, '"좁은 문으로 들어가라"  마 7:13', {
      fontSize: `${DesignSystem.FONT_SIZE.XS}px`, color: '#c8b070', fontFamily: DesignSystem.getFontFamily(),
    }).setOrigin(0.5).setDepth(10).setAlpha(0);
    this.tweens.add({ targets: verse, alpha: 0.9, duration: 800, delay: 1200 });

    // — Button panel (lower section, below horizon) —
    const btnAreaY = H * 0.58;
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
    const btnW = 160;
    const btnH = 32;
    const gap = 8;

    // Semi-transparent panel behind buttons
    const panelBg = this.add.graphics().setDepth(10).setAlpha(0);
    panelBg.fillStyle(0x06031a, 0.85);
    panelBg.fillRoundedRect(cx - btnW / 2 - 12, topY - 6, btnW + 24, btnH * 3 + gap * 2 + 18, 6);
    panelBg.lineStyle(0.8, 0xd4a853, 0.18);
    panelBg.strokeRoundedRect(cx - btnW / 2 - 12, topY - 6, btnW + 24, btnH * 3 + gap * 2 + 18, 6);
    this.tweens.add({ targets: panelBg, alpha: 1, duration: 500, delay: 700 });

    const makeBtn = (y: number, label: string, cb: () => void, opts?: { accent?: boolean; dim?: boolean }) => {
      const c = this.add.container(cx, y).setDepth(11).setAlpha(0);
      this.tweens.add({ targets: c, alpha: opts?.dim ? 0.35 : 1, duration: 400, delay: 800 });

      const bg = this.add.graphics();
      const defColor = opts?.accent ? 0x2a4a2a : 0x110d22;
      const borderColor = opts?.accent ? 0x4a8a4a : 0xd4a853;
      bg.fillStyle(defColor, 0.92);
      bg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 4);
      bg.lineStyle(0.8, borderColor, opts?.accent ? 0.6 : 0.4);
      bg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 4);

      const txt = this.add.text(0, 0, label, {
        fontSize: `${DesignSystem.FONT_SIZE.SM}px`,
        color: opts?.accent ? '#ccffcc' : '#c8bfaa',
        fontFamily: DesignSystem.getFontFamily(),
        shadow: opts?.accent
          ? { offsetX: 0, offsetY: 0, color: '#55ff55', blur: 3, stroke: false, fill: true }
          : undefined,
      }).setOrigin(0.5);

      const hit = this.add.rectangle(0, 0, btnW, btnH, 0, 0)
        .setInteractive({ useHandCursor: !opts?.dim });
      hit.on('pointerover', () => {
        if (opts?.dim) return;
        bg.clear();
        bg.fillStyle(opts?.accent ? 0x3a6a3a : 0x1e1840, 0.98);
        bg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 4);
        bg.lineStyle(1, borderColor, opts?.accent ? 0.9 : 0.5);
        bg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 4);
        txt.setColor(opts?.accent ? '#aaffaa' : '#e8e0d0');
        const audio = ServiceLocator.get<AudioManager>(SERVICE_KEYS.AUDIO_MANAGER);
        audio?.procedural?.playUIHover();
      });
      hit.on('pointerout', () => {
        bg.clear();
        bg.fillStyle(defColor, 0.92);
        bg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 4);
        bg.lineStyle(0.8, borderColor, opts?.accent ? 0.6 : 0.4);
        bg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 4);
        txt.setColor(opts?.accent ? '#8ad88a' : '#c8bfaa');
      });
      hit.on('pointerdown', () => {
        if (opts?.dim) return;
        const audio = ServiceLocator.get<AudioManager>(SERVICE_KEYS.AUDIO_MANAGER);
        audio?.procedural?.playUIClick();
        this.tweens.add({ targets: c, scaleX: 0.96, scaleY: 0.96, duration: 60, yoyo: true });
        this.time.delayedCall(80, cb);
      });

      c.add([bg, txt, hit]);
      return c;
    };

    makeBtn(topY, gm.i18n.t('menu.newJourney'), () => this.startNewGame(), { accent: true });

    this.continueBtn = makeBtn(topY + btnH + gap, gm.i18n.t('menu.continueJourney'), () => this.continueGame(), { dim: true });

    makeBtn(topY + (btnH + gap) * 2, gm.i18n.t('menu.settings'), () => {
      this.scene.pause();
      this.scene.launch('SettingsScene', { from: 'MenuScene' });
    });

    this.checkSaveExists(topY + btnH + gap, ko);
  }

  // ── Particles ─────────────────────────────────────────────────────────

  private createParticles(): void {
    this.particleGfx = this.add.graphics().setDepth(5);
    // Firefly / ember mix
    for (let i = 0; i < 55; i++) {
      const isEmber = i < 20;
      this.particles.push({
        x: Math.random() * GAME_WIDTH,
        y: Math.random() * GAME_HEIGHT,
        vx: (Math.random() - 0.5) * 0.06,
        vy: isEmber ? (0.04 + Math.random() * 0.15) : -(0.04 + Math.random() * 0.18),
        alpha: isEmber ? (0.1 + Math.random() * 0.2) : (0.1 + Math.random() * 0.3),
        size: isEmber ? (0.3 + Math.random() * 0.8) : (0.4 + Math.random() * 1.2),
        phase: Math.random() * Math.PI * 2,
        color: isEmber ? 0xff6622 : 0xd4a853,
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

  private async checkSaveExists(continueBtnY: number, ko: boolean): Promise<void> {
    if (!ServiceLocator.has(SERVICE_KEYS.SAVE_MANAGER)) return;
    const saveManager = ServiceLocator.get<SaveManager>(SERVICE_KEYS.SAVE_MANAGER);
    const exists = await saveManager.hasSave();

    if (this.continueBtn) {
      this.tweens.add({ targets: this.continueBtn, alpha: exists ? 1 : 0.3, duration: 300 });
      this.continueBtn.getAll().forEach(child => {
        if (child instanceof Phaser.GameObjects.Rectangle) {
          exists ? child.setInteractive({ useHandCursor: true }) : child.disableInteractive();
        }
      });
    }

    if (exists) {
      const saveData = await saveManager.load();
      if (saveData) {
        const chapLabel = ko ? `제 ${saveData.chapter}장` : `Ch.${saveData.chapter}`;
        const faithLabel = ko ? `믿음 ${saveData.stats.faith}` : `Faith ${saveData.stats.faith}`;
        this.add.text(GAME_WIDTH / 2, continueBtnY + 18, `${chapLabel}  ·  ${faithLabel}`, {
          fontSize: `${DesignSystem.FONT_SIZE.XS}px`, color: '#8a7a68', fontFamily: DesignSystem.getFontFamily(),
        }).setOrigin(0.5).setDepth(12);

        const gm = ServiceLocator.get<GameManager>(SERVICE_KEYS.GAME_MANAGER);
        gm.setChapter(1);
        gm.stats.reset();
      }
    }
  }

  private async continueGame(): Promise<void> {
    if (!ServiceLocator.has(SERVICE_KEYS.SAVE_MANAGER)) return;
    const sm = ServiceLocator.get<SaveManager>(SERVICE_KEYS.SAVE_MANAGER);
    const saveData = await sm.load();
    if (!saveData) return;
    await DesignSystem.fadeOut(this, 600);
    this.scene.start(SCENE_KEYS.GAME);
  }

  private async startNewGame(): Promise<void> {
    const gm = ServiceLocator.get<GameManager>(SERVICE_KEYS.GAME_MANAGER);
    gm.newGame();
    await DesignSystem.fadeOut(this, 600);
    this.scene.start(SCENE_KEYS.ONBOARDING);
  }
}
