import Phaser from 'phaser';
import { GAME_WIDTH } from '../config';
import { ServiceLocator, SERVICE_KEYS } from '../core/ServiceLocator';
import { StatsManager } from '../core/StatsManager';

export class Debug {
  private scene: Phaser.Scene;
  private debugText?: Phaser.GameObjects.Text;
  private isVisible = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    scene.input.keyboard?.on('keydown-F3', () => {
      this.toggle();
    });
  }

  toggle(): void {
    this.isVisible = !this.isVisible;
    if (this.isVisible) {
      this.debugText = this.scene.add.text(GAME_WIDTH - 4, 4, '', {
        fontSize: '5px',
        color: '#00FF00',
        backgroundColor: '#000000',
      }).setOrigin(1, 0).setScrollFactor(0).setDepth(999);
    } else {
      this.debugText?.destroy();
    }
  }

  update(): void {
    if (!this.isVisible || !this.debugText) return;

    const fps = Math.round(this.scene.game.loop.actualFps);
    let statsInfo = '';

    if (ServiceLocator.has(SERVICE_KEYS.STATS_MANAGER)) {
      const stats = ServiceLocator.get<StatsManager>(SERVICE_KEYS.STATS_MANAGER);
      const all = stats.getAll();
      statsInfo = `F:${all.faith} C:${all.courage} W:${all.wisdom} B:${all.burden}`;
    }

    this.debugText.setText(`FPS: ${fps}\n${statsInfo}`);
  }
}
