import Phaser from 'phaser';
import { SCENE_KEYS, GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config';
import { ServiceLocator, SERVICE_KEYS } from '../core/ServiceLocator';
import { GameManager } from '../core/GameManager';
import { GameState } from '../core/GameEvents';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.MENU);
  }

  create(): void {
    const gm = ServiceLocator.get<GameManager>(SERVICE_KEYS.GAME_MANAGER);
    gm.changeState(GameState.MENU);

    const cx = GAME_WIDTH / 2;

    this.cameras.main.setBackgroundColor(COLORS.UI.DARK_BG);

    this.add
      .text(cx, 24, gm.language === 'ko' ? '천로역정' : "The Pilgrim's Progress", {
        fontSize: '16px',
        color: '#E6C86E',
        fontFamily: 'serif',
      })
      .setOrigin(0.5);

    this.add
      .text(cx, 40, gm.language === 'ko' ? '순례자의 여정' : "A Pilgrim's Journey", {
        fontSize: '8px',
        color: '#8C8070',
        fontFamily: 'serif',
      })
      .setOrigin(0.5);

    const newGameLabel = gm.language === 'ko' ? '새 게임' : 'New Game';
    const continueLabel = gm.language === 'ko' ? '이어하기' : 'Continue';
    const settingsLabel = gm.language === 'ko' ? '설정' : 'Settings';

    this.createButton(cx, 80, newGameLabel, () => this.startNewGame());
    this.createButton(cx, 100, continueLabel, () => this.continueGame());
    this.createButton(cx, 120, settingsLabel, () => {});

    this.add
      .text(cx, GAME_HEIGHT - 10, 'v0.1.0 — Demo', {
        fontSize: '6px',
        color: '#8C8070',
      })
      .setOrigin(0.5);
  }

  private createButton(x: number, y: number, label: string, callback: () => void): void {
    const bg = this.add.rectangle(x, y, 100, 14, COLORS.UI.BUTTON_DEFAULT);
    bg.setStrokeStyle(1, COLORS.UI.PANEL_BORDER);
    bg.setInteractive({ useHandCursor: true });

    this.add
      .text(x, y, label, { fontSize: '8px', color: '#FFFFFF' })
      .setOrigin(0.5);

    bg.on('pointerover', () => bg.setFillStyle(COLORS.UI.GOLD));
    bg.on('pointerout', () => bg.setFillStyle(COLORS.UI.BUTTON_DEFAULT));
    bg.on('pointerdown', callback);
  }

  private startNewGame(): void {
    const gm = ServiceLocator.get<GameManager>(SERVICE_KEYS.GAME_MANAGER);
    gm.newGame();
    this.scene.start(SCENE_KEYS.ONBOARDING);
  }

  private continueGame(): void {
    this.scene.start(SCENE_KEYS.GAME);
  }
}
