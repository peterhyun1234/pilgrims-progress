import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, SCENE_KEYS } from '../config';
import { ServiceLocator, SERVICE_KEYS } from '../core/ServiceLocator';
import { GameManager } from '../core/GameManager';
import { EventBus } from '../core/EventBus';
import { GameEvent } from '../core/GameEvents';
import { DesignSystem } from '../ui/DesignSystem';

export class LanguageScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEYS.LANGUAGE });
  }

  create(): void {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    // Cinematic background — deep starfield
    this.buildBackground(cx, cy);

    DesignSystem.fadeIn(this, 600);

    // Cross with multi-layer glow
    const glowGfx = this.add.graphics().setDepth(5);
    glowGfx.fillStyle(0xd4a853, 0.06);
    glowGfx.fillCircle(cx, cy - 58, 30);
    glowGfx.fillStyle(0xd4a853, 0.03);
    glowGfx.fillCircle(cx, cy - 58, 48);

    const cross = this.add.text(cx, cy - 58, '✝', {
      fontSize: '32px', color: '#d4a853', fontFamily: 'serif',
      shadow: { offsetX: 0, offsetY: 0, color: '#ffd080', blur: 10, stroke: false, fill: true },
    }).setOrigin(0.5).setDepth(6);
    this.tweens.add({
      targets: cross, alpha: 0.5, duration: 2200,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
    this.tweens.add({
      targets: glowGfx, alpha: 0.4, duration: 2200,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    // Decorative line
    const deco = this.add.graphics().setDepth(6);
    deco.lineStyle(0.5, 0xd4a853, 0.25);
    deco.lineBetween(cx - 50, cy - 35, cx + 50, cy - 35);

    this.add.text(cx, cy - 24, 'Select Language / 언어 선택',
      DesignSystem.mutedTextStyle(DesignSystem.FONT_SIZE.SM),
    ).setOrigin(0.5).setDepth(6);

    DesignSystem.createButton(this, cx, cy + 12, 160, 34,
      '한국어', () => this.selectLanguage('ko'),
      { fontSize: DesignSystem.FONT_SIZE.BASE },
    );
    DesignSystem.createButton(this, cx, cy + 52, 160, 34,
      'English', () => this.selectLanguage('en'),
      { fontSize: DesignSystem.FONT_SIZE.BASE },
    );
  }

  private buildBackground(cx: number, _cy: number): void {
    const W = GAME_WIDTH;
    const H = GAME_HEIGHT;

    // Deep sky gradient
    const sky = this.add.graphics().setDepth(0);
    const strips = 20;
    for (let i = 0; i < strips; i++) {
      const t = i / strips;
      const r = Math.round(0x03 + 0x04 * t);
      const g = Math.round(0x01 + 0x03 * t);
      const b = Math.round(0x0e + 0x14 * t);
      sky.fillStyle((r << 16) | (g << 8) | b, 1);
      sky.fillRect(0, Math.floor(t * H), W, Math.ceil(H / strips) + 1);
    }

    // Stars
    const stars = this.add.graphics().setDepth(1);
    for (let i = 0; i < 70; i++) {
      const h = ((i * 137 + 13) * 31) & 0xffff;
      const sx = h % W;
      const sy = (h * 3) % H;
      const brightness = 0.15 + (h % 10) * 0.06;
      const sz = 0.3 + (h % 3) * 0.35;
      stars.fillStyle(0xffffff, brightness);
      stars.fillCircle(sx, sy, sz);
    }

    // Celestial glow at horizon (distant city of God concept)
    const glow = this.add.graphics().setDepth(2);
    const layers = [
      { r: 80, a: 0.04 }, { r: 50, a: 0.07 }, { r: 30, a: 0.12 }, { r: 16, a: 0.20 },
    ];
    for (const { r, a } of layers) {
      glow.fillStyle(0xffd4a0, a);
      glow.fillEllipse(cx, H * 0.68, r * 2.5, r * 0.6);
    }

    // Horizon line — ground silhouette
    const ground = this.add.graphics().setDepth(3);
    for (let x = -20; x < W + 40; x += 35) {
      const h2 = ((x * 31 + 5) * 17) & 0xff;
      const mh = 12 + (h2 % 20);
      const mw = 50 + (h2 % 30);
      ground.fillStyle(0x06031a, 0.9);
      ground.fillTriangle(x, H * 0.68 + 2, x + mw / 2, H * 0.68 - mh, x + mw, H * 0.68 + 2);
    }
    ground.fillStyle(0x04020e, 1);
    ground.fillRect(0, H * 0.68, W, H * 0.32);

    // Vignette
    const vig = this.add.graphics().setDepth(4);
    for (let i = 0; i < 10; i++) {
      vig.fillStyle(0x000000, 0.15 * (1 - i / 10));
      vig.fillRect(0, 0, W, 4 - i * 0.4 + 1);
      vig.fillRect(0, H - 4 + i, W, 4);
    }
  }

  private async selectLanguage(lang: 'ko' | 'en'): Promise<void> {
    const gm = ServiceLocator.get<GameManager>(SERVICE_KEYS.GAME_MANAGER);
    gm.language = lang;
    EventBus.getInstance().emit(GameEvent.LANGUAGE_SELECTED, lang);
    await DesignSystem.fadeOut(this, 300);
    this.scene.start(SCENE_KEYS.MENU);
  }
}
