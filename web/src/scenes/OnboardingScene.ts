import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, SCENE_KEYS } from '../config';
import { ServiceLocator, SERVICE_KEYS } from '../core/ServiceLocator';
import { GameManager } from '../core/GameManager';
import { DesignSystem } from '../ui/DesignSystem';

interface PrologueLine {
  text: string;
  delay: number;
  style: 'normal' | 'dramatic' | 'dim' | 'scripture';
}

const PROLOGUE_KO: PrologueLine[] = [
  { text: '...나는 꿈을 꾸었다.', delay: 0, style: 'dramatic' },
  { text: '', delay: 2200, style: 'normal' },
  { text: '한 남자가 누더기를 입고', delay: 3000, style: 'normal' },
  { text: '서 있는 곳에서 얼굴을 돌리고', delay: 4500, style: 'normal' },
  { text: '', delay: 6000, style: 'normal' },
  { text: '등에는 무거운 짐을 지고', delay: 7000, style: 'dramatic' },
  { text: '손에는 책을 들고 있었다.', delay: 8500, style: 'normal' },
  { text: '', delay: 10000, style: 'normal' },
  { text: '그가 책을 펼쳐 읽으니...', delay: 11000, style: 'dim' },
  { text: '울며 떨기 시작했다.', delay: 13000, style: 'dramatic' },
  { text: '', delay: 14500, style: 'normal' },
  { text: '"내가 어떻게 해야 구원을 받을 수 있는가?"', delay: 15500, style: 'scripture' },
];

const PROLOGUE_EN: PrologueLine[] = [
  { text: '...I dreamed a dream.', delay: 0, style: 'dramatic' },
  { text: '', delay: 2200, style: 'normal' },
  { text: 'A man clothed in rags,', delay: 3000, style: 'normal' },
  { text: 'standing with his face turned away.', delay: 4500, style: 'normal' },
  { text: '', delay: 6000, style: 'normal' },
  { text: 'A heavy Burden upon his back,', delay: 7000, style: 'dramatic' },
  { text: 'and a Book in his hand.', delay: 8500, style: 'normal' },
  { text: '', delay: 10000, style: 'normal' },
  { text: 'He opened the Book and read...', delay: 11000, style: 'dim' },
  { text: 'and began to weep and tremble.', delay: 13000, style: 'dramatic' },
  { text: '', delay: 14500, style: 'normal' },
  { text: '"What must I do to be saved?"', delay: 15500, style: 'scripture' },
];

interface Ember {
  x: number; y: number;
  vx: number; vy: number;
  alpha: number; size: number;
  life: number; maxLife: number;
  color: number;
}

export class OnboardingScene extends Phaser.Scene {
  private embers: Ember[] = [];
  private bgGfx!: Phaser.GameObjects.Graphics;
  private emberGfx!: Phaser.GameObjects.Graphics;
  private pilgrimGfx!: Phaser.GameObjects.Graphics;
  private pilgrimPhase = 0;

  constructor() {
    super({ key: SCENE_KEYS.ONBOARDING });
  }

  create(): void {
    this.cameras.main.setBackgroundColor(0x0a0610);
    DesignSystem.fadeIn(this, 1200);

    this.bgGfx = this.add.graphics().setDepth(0);
    this.emberGfx = this.add.graphics().setDepth(2);
    this.pilgrimGfx = this.add.graphics().setDepth(1);

    this.buildBackground();
    this.spawnInitialEmbers();
    this.buildPilgrimFigure();
    this.buildPrologueText();
  }

  // ─── Static background ──────────────────────────────────────────────

  private buildBackground(): void {
    const g = this.bgGfx;
    const W = GAME_WIDTH;
    const H = GAME_HEIGHT;
    const horizon = Math.floor(H * 0.62);

    // Sky gradient — dark ember tones (top: near-black, bottom: fiery dark red)
    const skySteps = 20;
    for (let i = 0; i < skySteps; i++) {
      const t = i / skySteps;
      const r = Math.floor(Phaser.Math.Linear(0x0a, 0x28, t));
      const grn = Math.floor(Phaser.Math.Linear(0x06, 0x08, t));
      const b = Math.floor(Phaser.Math.Linear(0x10, 0x06, t));
      const color = (r << 16) | (grn << 8) | b;
      g.fillStyle(color, 1);
      g.fillRect(0, Math.floor((i / skySteps) * horizon), W, Math.ceil(H / skySteps) + 2);
    }

    // Stars
    for (let i = 0; i < 60; i++) {
      const sx = Math.random() * W;
      const sy = Math.random() * horizon * 0.75;
      const sa = 0.15 + Math.random() * 0.45;
      const ss = Math.random() < 0.15 ? 1.5 : 1;
      g.fillStyle(0xffd8a0, sa);
      g.fillCircle(sx, sy, ss);
    }

    // Distant fire glow on horizon (diffuse orange light behind buildings)
    for (let i = 0; i < 5; i++) {
      const fx = W * (0.1 + i * 0.2) + (Math.random() - 0.5) * 20;
      const fw = 20 + Math.random() * 40;
      const fh = 18 + Math.random() * 20;
      g.fillStyle(0xff4400, 0.06 + Math.random() * 0.08);
      g.fillEllipse(fx, horizon - 4, fw, fh);
    }

    // Ground — dark earth tones
    const groundSteps = 8;
    for (let i = 0; i < groundSteps; i++) {
      const t = i / groundSteps;
      const r = Math.floor(Phaser.Math.Linear(0x18, 0x0c, t));
      const grn = Math.floor(Phaser.Math.Linear(0x0c, 0x06, t));
      const b = Math.floor(Phaser.Math.Linear(0x0a, 0x04, t));
      const color = (r << 16) | (grn << 8) | b;
      const segY = horizon + Math.floor((i / groundSteps) * (H - horizon));
      const segH = Math.ceil((H - horizon) / groundSteps) + 2;
      g.fillStyle(color, 1);
      g.fillRect(0, segY, W, segH);
    }

    // City silhouette — distant far buildings (muted)
    this.drawCityLayer(g, horizon, 0x1a0c08, 0.55, 8, 16, 28, 0.7);
    // City silhouette — near buildings (darker, taller)
    this.drawCityLayer(g, horizon, 0x0e0604, 0.85, 6, 26, 48, 0.5);

    // Fire tops on near buildings
    this.drawFireTops(g, horizon);

    // Ground level mist / smoke
    g.fillStyle(0x1a0a06, 0.35);
    g.fillRect(0, horizon - 4, W, 12);
    g.fillStyle(0x0a0610, 0.12);
    g.fillRect(0, H - 18, W, 18);

    // Dark vignette overlay
    g.fillStyle(0x000000, 0.22);
    g.fillRect(0, 0, W, H);
    // Extra darken at top so text is readable
    for (let i = 0; i < 8; i++) {
      const t = 1 - i / 8;
      g.fillStyle(0x000000, 0.035 * t * t);
      g.fillRect(0, 0, W, (i / 8) * H * 0.45);
    }
  }

  private drawCityLayer(
    g: Phaser.GameObjects.Graphics,
    horizon: number,
    color: number,
    alpha: number,
    count: number,
    minH: number,
    maxH: number,
    widthFactor: number,
  ): void {
    const W = GAME_WIDTH;
    const spacing = W / count;
    for (let i = 0; i < count; i++) {
      const bw = Math.floor(spacing * widthFactor + (Math.random() - 0.5) * 8);
      const bh = Math.floor(minH + Math.random() * (maxH - minH));
      const bx = Math.floor(i * spacing + (Math.random() - 0.5) * 12);

      g.fillStyle(color, alpha);
      // Main building body
      g.fillRect(bx, horizon - bh, bw, bh);
      // Slightly lighter top
      g.fillStyle(color, alpha * 0.4);
      g.fillRect(bx + 2, horizon - bh, bw - 4, 3);

      // Windows (small lit rectangles, some with fire-orange tint)
      const winRows = Math.floor(bh / 10);
      const winCols = Math.floor(bw / 8);
      for (let wr = 0; wr < winRows; wr++) {
        for (let wc = 0; wc < winCols; wc++) {
          if (Math.random() > 0.35) continue;
          const wx = bx + 3 + wc * 7;
          const wy = horizon - bh + 5 + wr * 9;
          const isOrange = Math.random() < 0.4;
          g.fillStyle(isOrange ? 0xff6600 : 0xffcc66, isOrange ? 0.5 : 0.3);
          g.fillRect(wx, wy, 3, 3);
        }
      }
    }
  }

  private drawFireTops(g: Phaser.GameObjects.Graphics, horizon: number): void {
    const W = GAME_WIDTH;
    const firePositions = [W * 0.12, W * 0.28, W * 0.47, W * 0.63, W * 0.82];
    firePositions.forEach(fx => {
      // Glow
      g.fillStyle(0xff5500, 0.08);
      g.fillEllipse(fx, horizon - 35, 28, 22);
      g.fillStyle(0xff8800, 0.06);
      g.fillEllipse(fx, horizon - 38, 18, 16);
    });
  }

  // ─── Pilgrim silhouette with burden ─────────────────────────────────

  private buildPilgrimFigure(): void {
    const W = GAME_WIDTH;
    const H = GAME_HEIGHT;
    const horizon = Math.floor(H * 0.62);
    // Position: left-center, standing at ground level
    const px = W * 0.22;
    const py = horizon - 2;

    // Fade in the figure after 2 seconds (when text starts describing him)
    this.time.delayedCall(2800, () => {
      this.tweens.add({
        targets: this.pilgrimGfx,
        alpha: 1,
        duration: 1200,
        ease: 'Sine.easeIn',
      });
    });
    this.pilgrimGfx.setAlpha(0);

    // Draw static figure once; update() adds breathing animation
    this.drawPilgrimWithBurden(this.pilgrimGfx, px, py, 0);
  }

  private drawPilgrimWithBurden(g: Phaser.GameObjects.Graphics, x: number, y: number, breathe: number): void {
    g.clear();
    const dark = 0x0a0520;
    const burdenColor = 0x2a1a10;
    const bookColor = 0x5a3a1a;

    // Ground shadow
    g.fillStyle(0x000000, 0.3);
    g.fillEllipse(x, y + 1, 22, 5);

    // Burden (large pack on back, weighing him down) — drawn first (behind body)
    g.fillStyle(burdenColor, 0.92);
    g.fillEllipse(x - 7, y - 20 + breathe, 14, 18);
    g.lineStyle(0.8, 0x4a2a10, 0.6);
    g.strokeEllipse(x - 7, y - 20 + breathe, 14, 18);
    // Straps
    g.lineStyle(1, 0x3a2010, 0.7);
    g.lineBetween(x - 2, y - 28 + breathe, x - 7, y - 24 + breathe);
    g.lineBetween(x - 2, y - 20 + breathe, x - 10, y - 18 + breathe);

    // Ragged cloak body — slightly bent forward under burden
    g.fillStyle(dark, 0.9);
    g.fillTriangle(x - 5, y, x + 6, y, x + 3, y - 26 + breathe);
    // Cloak edge (tattered)
    g.fillStyle(dark, 0.7);
    g.fillTriangle(x - 5, y, x - 8, y - 5, x - 3, y - 8 + breathe);
    g.fillTriangle(x + 6, y, x + 9, y - 4, x + 5, y - 8 + breathe);

    // Head (bowed down slightly)
    g.fillStyle(dark, 0.95);
    g.fillCircle(x + 2, y - 28 + breathe, 5);

    // Face looking downward
    g.fillStyle(0x1a0e0e, 0.7);
    g.fillCircle(x + 1, y - 27 + breathe, 3.5);

    // Book in hand (right side, held open)
    g.fillStyle(bookColor, 0.85);
    g.fillRect(x + 6, y - 16 + breathe, 8, 6);
    // Book pages
    g.fillStyle(0xddccaa, 0.4);
    g.fillRect(x + 7, y - 15 + breathe, 3, 4);
    g.fillRect(x + 11, y - 15 + breathe, 2, 4);
    // Book spine
    g.fillStyle(0x7a5a20, 0.6);
    g.fillRect(x + 9, y - 16 + breathe, 1, 6);

    // Legs (slightly spread, weighed down posture)
    g.fillStyle(dark, 0.85);
    g.fillRect(x - 1, y - 5, 3, 7);
    g.fillRect(x + 3, y - 5, 3, 6);
    // Feet (simple)
    g.fillRect(x - 2, y + 1, 4, 2);
    g.fillRect(x + 3, y + 1, 4, 2);

    // Slight despair aura (dark glow around the figure)
    g.fillStyle(0x000000, 0.06);
    g.fillEllipse(x - 2, y - 16 + breathe, 30, 40);
  }

  // ─── Ember particles ────────────────────────────────────────────────

  private spawnInitialEmbers(): void {
    for (let i = 0; i < 40; i++) {
      this.embers.push(this.createEmber(true));
    }
  }

  private createEmber(randomY = false): Ember {
    const W = GAME_WIDTH;
    const horizon = Math.floor(GAME_HEIGHT * 0.62);
    return {
      x: Math.random() * W,
      y: randomY ? Math.random() * GAME_HEIGHT : horizon,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -(0.2 + Math.random() * 0.6),
      alpha: 0.3 + Math.random() * 0.5,
      size: 0.5 + Math.random() * 1.2,
      life: 0,
      maxLife: 120 + Math.random() * 180,
      color: Math.random() < 0.6 ? 0xff6600 : (Math.random() < 0.5 ? 0xffaa00 : 0xffddaa),
    };
  }

  // ─── Prologue text ──────────────────────────────────────────────────

  private buildPrologueText(): void {
    const gm = ServiceLocator.get<GameManager>(SERVICE_KEYS.GAME_MANAGER);
    const lines = gm.language === 'ko' ? PROLOGUE_KO : PROLOGUE_EN;
    const ko = gm.language === 'ko';
    const cx = GAME_WIDTH / 2;
    const startY = 22;

    let lineIndex = 0;
    lines.forEach((line) => {
      if (line.text === '') { lineIndex++; return; }

      const y = startY + lineIndex * 20;

      const styleConfig: Record<string, { size: number; color: string; alpha: number }> = {
        dramatic: { size: ko ? DesignSystem.FONT_SIZE.SM : DesignSystem.FONT_SIZE.LG, color: '#e8e0d0', alpha: 1 },
        normal: { size: ko ? DesignSystem.FONT_SIZE.SM : DesignSystem.FONT_SIZE.BASE, color: '#b0a898', alpha: 0.9 },
        dim: { size: ko ? DesignSystem.FONT_SIZE.SM : DesignSystem.FONT_SIZE.BASE, color: '#b0a090', alpha: 0.80 },
        scripture: { size: ko ? DesignSystem.FONT_SIZE.SM : DesignSystem.FONT_SIZE.LG, color: '#d4a853', alpha: 1 },
      };
      const cfg = styleConfig[line.style] ?? styleConfig.normal;

      const isDramaticOrScripture = line.style === 'dramatic' || line.style === 'scripture';
      const textObj = this.add.text(cx, y, line.text,
        DesignSystem.textStyle(cfg.size, cfg.color, {
          align: 'center',
          fontStyle: line.style === 'scripture' ? 'italic' : 'normal',
          ...(isDramaticOrScripture ? { lineSpacing: 3 } : {}),
          shadow: { offsetX: 0, offsetY: 1, color: '#000000', blur: 3, stroke: false, fill: true },
        }),
      ).setOrigin(0.5).setAlpha(0).setDepth(3);

      this.time.delayedCall(line.delay, () => {
        this.tweens.add({
          targets: textObj,
          alpha: cfg.alpha,
          y: y - 3,
          duration: 900, ease: 'Sine.easeOut',
        });
      });
      lineIndex++;
    });

    const totalDuration = lines[lines.length - 1].delay + 3000;
    const skipLabel = ko ? '아무 곳이나 터치하여 계속...' : 'Touch anywhere to continue...';
    const skipText = this.add.text(cx, GAME_HEIGHT - 10, skipLabel,
      DesignSystem.mutedTextStyle(DesignSystem.FONT_SIZE.XS),
    ).setOrigin(0.5).setAlpha(0).setDepth(3);

    this.time.delayedCall(totalDuration, () => {
      this.tweens.add({ targets: skipText, alpha: 0.7, duration: 500 });
      this.input.once('pointerdown', () => this.proceed());
      this.input.keyboard?.once('keydown-SPACE', () => this.proceed());
      this.input.keyboard?.once('keydown-ENTER', () => this.proceed());
    });

    this.input.keyboard?.once('keydown-ESC', () => this.proceed());
  }

  // ─── Update ─────────────────────────────────────────────────────────

  update(): void {
    this.emberGfx.clear();

    for (let i = this.embers.length - 1; i >= 0; i--) {
      const e = this.embers[i];
      e.x += e.vx;
      e.y += e.vy;
      e.vx += (Math.random() - 0.5) * 0.04; // slight drift
      e.life++;

      const lifeFrac = e.life / e.maxLife;
      const fadeAlpha = lifeFrac < 0.1
        ? e.alpha * (lifeFrac / 0.1)
        : lifeFrac > 0.7
        ? e.alpha * (1 - (lifeFrac - 0.7) / 0.3)
        : e.alpha;

      if (e.life >= e.maxLife || e.y < -5) {
        this.embers[i] = this.createEmber(false);
        continue;
      }

      this.emberGfx.fillStyle(e.color, fadeAlpha);
      this.emberGfx.fillCircle(e.x, e.y, e.size);
    }

    // Occasionally spawn extra embers for variety
    if (Math.random() < 0.08 && this.embers.length < 60) {
      this.embers.push(this.createEmber(false));
    }

    // Pilgrim breathing animation (slow, labored — under the burden)
    this.pilgrimPhase += 0.018;
    const breathe = Math.sin(this.pilgrimPhase) * 0.8;
    const H = GAME_HEIGHT;
    const horizon = Math.floor(H * 0.62);
    const px = GAME_WIDTH * 0.22;
    const py = horizon - 2;
    if (this.pilgrimGfx.alpha > 0) {
      this.drawPilgrimWithBurden(this.pilgrimGfx, px, py, breathe);
    }
  }

  private async proceed(): Promise<void> {
    await DesignSystem.fadeOut(this, 600);
    this.scene.start(SCENE_KEYS.GAME);
  }
}
