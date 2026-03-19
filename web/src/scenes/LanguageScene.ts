import Phaser from 'phaser';
import { SCENE_KEYS, GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config';
import { ServiceLocator, SERVICE_KEYS } from '../core/ServiceLocator';
import { GameManager } from '../core/GameManager';
import { EventBus } from '../core/EventBus';
import { GameEvent } from '../core/GameEvents';

export class LanguageScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.LANGUAGE);
  }

  create(): void {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    this.cameras.main.setBackgroundColor(COLORS.UI.DARK_BG);

    this.add
      .text(cx, cy - 40, '천로역정', {
        fontSize: '16px',
        color: '#E6C86E',
        fontFamily: 'serif',
      })
      .setOrigin(0.5);

    this.add
      .text(cx, cy - 24, "The Pilgrim's Progress", {
        fontSize: '8px',
        color: '#8C8070',
        fontFamily: 'serif',
      })
      .setOrigin(0.5);

    this.createButton(cx, cy + 10, '한국어', () => this.selectLanguage('ko'));
    this.createButton(cx, cy + 30, 'English', () => this.selectLanguage('en'));
  }

  private createButton(x: number, y: number, label: string, callback: () => void): void {
    const bg = this.add.rectangle(x, y, 80, 14, COLORS.UI.BUTTON_DEFAULT);
    bg.setStrokeStyle(1, COLORS.UI.PANEL_BORDER);
    bg.setInteractive({ useHandCursor: true });

    const text = this.add
      .text(x, y, label, {
        fontSize: '8px',
        color: '#FFFFFF',
      })
      .setOrigin(0.5);

    bg.on('pointerover', () => bg.setFillStyle(COLORS.UI.GOLD));
    bg.on('pointerout', () => bg.setFillStyle(COLORS.UI.BUTTON_DEFAULT));
    bg.on('pointerdown', () => {
      text.setColor('#0A0814');
      callback();
    });
  }

  private selectLanguage(lang: 'ko' | 'en'): void {
    const gm = ServiceLocator.get<GameManager>(SERVICE_KEYS.GAME_MANAGER);
    gm.language = lang;
    EventBus.getInstance().emit(GameEvent.LANGUAGE_SELECTED, lang);
    this.scene.start(SCENE_KEYS.MENU);
  }
}
