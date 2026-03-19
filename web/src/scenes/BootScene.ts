import Phaser from 'phaser';
import { SCENE_KEYS, COLORS } from '../config';
import { GameManager } from '../core/GameManager';
import { ServiceLocator, SERVICE_KEYS } from '../core/ServiceLocator';

export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.BOOT);
  }

  create(): void {
    const gm = new GameManager();
    ServiceLocator.register(SERVICE_KEYS.GAME_MANAGER, gm);

    this.cameras.main.setBackgroundColor(COLORS.UI.DARK_BG);

    this.scene.start(SCENE_KEYS.PRELOAD);
  }
}
