import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, SCENE_KEYS, COLORS } from '../config';
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

export class OnboardingScene extends Phaser.Scene {
  private bgParticles: { x: number; y: number; a: number; s: number; vy: number }[] = [];
  private gfx!: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: SCENE_KEYS.ONBOARDING });
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.UI.DARK_BG);
    DesignSystem.fadeIn(this, 800);

    this.gfx = this.add.graphics().setDepth(0);
    for (let i = 0; i < 20; i++) {
      this.bgParticles.push({
        x: Math.random() * GAME_WIDTH,
        y: Math.random() * GAME_HEIGHT,
        a: 0.02 + Math.random() * 0.06,
        s: 0.3 + Math.random() * 0.8,
        vy: -(0.05 + Math.random() * 0.15),
      });
    }

    const gm = ServiceLocator.get<GameManager>(SERVICE_KEYS.GAME_MANAGER);
    const lines = gm.language === 'ko' ? PROLOGUE_KO : PROLOGUE_EN;
    const ko = gm.language === 'ko';
    const cx = GAME_WIDTH / 2;
    const startY = GAME_HEIGHT / 2 - 60;

    let lineIndex = 0;
    lines.forEach((line) => {
      if (line.text === '') { lineIndex++; return; }

      const y = startY + lineIndex * 20;

      const styleConfig: Record<string, { size: number; color: string; alpha: number }> = {
        dramatic: { size: DesignSystem.FONT_SIZE.LG, color: '#e8e0d0', alpha: 1 },
        normal: { size: DesignSystem.FONT_SIZE.BASE, color: '#b0a898', alpha: 0.9 },
        dim: { size: DesignSystem.FONT_SIZE.BASE, color: '#6b5b4f', alpha: 0.6 },
        scripture: { size: DesignSystem.FONT_SIZE.LG, color: '#d4a853', alpha: 1 },
      };
      const cfg = styleConfig[line.style] ?? styleConfig.normal;

      const textObj = this.add.text(cx, y, line.text,
        DesignSystem.textStyle(cfg.size, cfg.color, {
          align: 'center',
          fontStyle: line.style === 'scripture' ? 'italic' : 'normal',
        }),
      ).setOrigin(0.5).setAlpha(0).setDepth(1);

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
    const skipText = this.add.text(cx, GAME_HEIGHT - 20, skipLabel,
      DesignSystem.mutedTextStyle(DesignSystem.FONT_SIZE.XS),
    ).setOrigin(0.5).setAlpha(0).setDepth(1);

    this.time.delayedCall(totalDuration, () => {
      this.tweens.add({ targets: skipText, alpha: 0.7, duration: 500 });
      this.input.once('pointerdown', () => this.proceed());
      this.input.keyboard?.once('keydown-SPACE', () => this.proceed());
      this.input.keyboard?.once('keydown-ENTER', () => this.proceed());
    });

    this.input.keyboard?.once('keydown-ESC', () => this.proceed());
  }

  update(): void {
    this.gfx.clear();
    this.bgParticles.forEach(p => {
      p.y += p.vy;
      p.x += Math.sin(p.y * 0.01) * 0.1;
      if (p.y < -5) { p.y = GAME_HEIGHT + 5; p.x = Math.random() * GAME_WIDTH; }
      this.gfx.fillStyle(0xd4a853, p.a);
      this.gfx.fillCircle(p.x, p.y, p.s);
    });
  }

  private async proceed(): Promise<void> {
    await DesignSystem.fadeOut(this, 600);
    this.scene.start(SCENE_KEYS.GAME);
  }
}
