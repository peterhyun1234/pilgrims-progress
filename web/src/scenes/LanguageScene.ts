import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, SCENE_KEYS, COLORS } from '../config';
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
    this.cameras.main.setBackgroundColor(COLORS.UI.DARK_BG);
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    DesignSystem.fadeIn(this, 400);

    const cross = this.add.text(cx, cy - 60, '✝', {
      fontSize: '26px', color: '#d4a853', fontFamily: 'serif',
      shadow: { offsetX: 0, offsetY: 0, color: '#d4a853', blur: 6, stroke: false, fill: true },
    }).setOrigin(0.5);
    this.tweens.add({
      targets: cross, alpha: 0.4, duration: 2000,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    this.add.text(cx, cy - 28, 'Select Language / 언어 선택',
      DesignSystem.mutedTextStyle(DesignSystem.FONT_SIZE.SM),
    ).setOrigin(0.5);

    DesignSystem.createButton(this, cx, cy + 10, 150, 30,
      '한국어', () => this.selectLanguage('ko'),
      { fontSize: DesignSystem.FONT_SIZE.BASE },
    );
    DesignSystem.createButton(this, cx, cy + 48, 150, 30,
      'English', () => this.selectLanguage('en'),
      { fontSize: DesignSystem.FONT_SIZE.BASE },
    );
  }

  private async selectLanguage(lang: 'ko' | 'en'): Promise<void> {
    const gm = ServiceLocator.get<GameManager>(SERVICE_KEYS.GAME_MANAGER);
    gm.language = lang;
    EventBus.getInstance().emit(GameEvent.LANGUAGE_SELECTED, lang);
    await DesignSystem.fadeOut(this, 300);
    this.scene.start(SCENE_KEYS.MENU);
  }
}
