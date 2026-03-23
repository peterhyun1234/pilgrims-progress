import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, SCENE_KEYS, COLORS } from '../config';
import { GameManager } from '../core/GameManager';
import { ServiceLocator, SERVICE_KEYS } from '../core/ServiceLocator';
import { ResponsiveManager } from '../ui/ResponsiveManager';
import { EventBus } from '../core/EventBus';
import { AudioManager } from '../audio/AudioManager';
import { SaveManager } from '../save/SaveManager';
import { AutoSave } from '../save/AutoSave';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEYS.BOOT });
  }

  create(): void {
    new GameManager();
    const eventBus = EventBus.getInstance();
    const responsive = new ResponsiveManager(eventBus);
    ServiceLocator.register(SERVICE_KEYS.RESPONSIVE_MANAGER, responsive);

    const audioManager = new AudioManager(eventBus);
    ServiceLocator.register(SERVICE_KEYS.AUDIO_MANAGER, audioManager);

    const saveManager = new SaveManager(eventBus);
    ServiceLocator.register(SERVICE_KEYS.SAVE_MANAGER, saveManager);
    new AutoSave(eventBus, saveManager);

    this.cameras.main.setBackgroundColor(COLORS.UI.DARK_BG);

    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    const cross = this.add.text(cx, cy - 12, '✝', {
      fontSize: '36px', color: '#d4a853', fontFamily: 'serif',
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: cross, alpha: 1, duration: 600, ease: 'Sine.easeIn',
      onComplete: () => {
        this.tweens.add({
          targets: cross, alpha: 0.3, scaleX: 0.9, scaleY: 0.9,
          duration: 600, delay: 400,
          onComplete: () => {
            const loading = document.getElementById('loading-overlay');
            if (loading) loading.classList.add('hidden');
            this.scene.start(SCENE_KEYS.PRELOAD);
          },
        });
      },
    });
  }
}
