import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, SCENE_KEYS, COLORS } from '../config';
import { ServiceLocator, SERVICE_KEYS } from '../core/ServiceLocator';
import { GameManager } from '../core/GameManager';
import { DesignSystem } from '../ui/DesignSystem';

export class MenuScene extends Phaser.Scene {
  private particles: { x: number; y: number; vx: number; vy: number; alpha: number; size: number; phase: number }[] = [];
  private particleGfx!: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: SCENE_KEYS.MENU });
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.UI.DARK_BG);
    const cx = GAME_WIDTH / 2;
    const gm = ServiceLocator.get<GameManager>(SERVICE_KEYS.GAME_MANAGER);
    const ko = gm.language === 'ko';

    DesignSystem.fadeIn(this, 500);
    this.createParticles();

    const bgGlow = this.add.graphics().setDepth(0);
    bgGlow.fillStyle(0xd4a853, 0.03);
    bgGlow.fillCircle(cx, 80, 120);

    const cross = this.add.text(cx, 44, '✝', {
      fontSize: '22px', color: '#d4a853', fontFamily: 'serif',
      shadow: { offsetX: 0, offsetY: 0, color: '#d4a853', blur: 8, stroke: false, fill: true },
    }).setOrigin(0.5).setAlpha(0.6);
    this.tweens.add({
      targets: cross, alpha: 0.25, duration: 3000,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    this.add.text(cx, 76, "Pilgrim's Progress",
      DesignSystem.goldTextStyle(DesignSystem.FONT_SIZE.XL),
    ).setOrigin(0.5);

    this.add.text(cx, 104, ko ? '순례자의 여정' : 'The Journey Begins',
      DesignSystem.mutedTextStyle(DesignSystem.FONT_SIZE.SM),
    ).setOrigin(0.5);

    const lineGfx = this.add.graphics();
    lineGfx.lineStyle(0.8, COLORS.UI.GOLD, 0.25);
    lineGfx.lineBetween(cx - 90, 118, cx + 90, 118);
    lineGfx.fillStyle(COLORS.UI.GOLD, 0.4);
    lineGfx.fillCircle(cx, 118, 1.5);
    lineGfx.fillCircle(cx - 90, 118, 1);
    lineGfx.fillCircle(cx + 90, 118, 1);

    const btnY = 140;
    DesignSystem.createButton(this, cx, btnY, 170, 32,
      ko ? '새 여정 시작' : 'New Journey',
      () => this.startNewGame(),
      { fontSize: DesignSystem.FONT_SIZE.BASE, bgColor: 0x2a4a2a, hoverColor: 0x3a6a3a },
    );
    DesignSystem.createButton(this, cx, btnY + 40, 170, 32,
      ko ? '여정 계속하기' : 'Continue',
      () => this.startNewGame(),
      { fontSize: DesignSystem.FONT_SIZE.BASE },
    );
    DesignSystem.createButton(this, cx, btnY + 80, 170, 32,
      ko ? '설정' : 'Settings',
      () => {
        this.scene.pause();
        this.scene.launch('SettingsScene', { from: 'MenuScene' });
      },
      { fontSize: DesignSystem.FONT_SIZE.SM },
    );

    this.add.text(GAME_WIDTH - 8, GAME_HEIGHT - 8, 'v0.5.0',
      DesignSystem.mutedTextStyle(DesignSystem.FONT_SIZE.XS),
    ).setOrigin(1, 1);
  }

  private createParticles(): void {
    this.particleGfx = this.add.graphics().setDepth(0);
    for (let i = 0; i < 40; i++) {
      this.particles.push({
        x: Math.random() * GAME_WIDTH,
        y: Math.random() * GAME_HEIGHT,
        vx: (Math.random() - 0.5) * 0.05,
        vy: -(0.08 + Math.random() * 0.25),
        alpha: 0.03 + Math.random() * 0.15,
        size: 0.4 + Math.random() * 1.3,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  update(_time: number): void {
    this.particleGfx.clear();
    const t = Date.now() * 0.001;
    this.particles.forEach(p => {
      p.y += p.vy;
      p.x += p.vx + Math.sin(t + p.phase) * 0.12;
      if (p.y < -5) {
        p.y = GAME_HEIGHT + 5;
        p.x = Math.random() * GAME_WIDTH;
      }
      this.particleGfx.fillStyle(0xd4a853, p.alpha);
      this.particleGfx.fillCircle(p.x, p.y, p.size);
    });
  }

  private async startNewGame(): Promise<void> {
    const gm = ServiceLocator.get<GameManager>(SERVICE_KEYS.GAME_MANAGER);
    gm.newGame();
    await DesignSystem.fadeOut(this, 400);
    this.scene.start(SCENE_KEYS.ONBOARDING);
  }
}
