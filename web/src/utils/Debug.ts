import { GAME_WIDTH } from '../config';
import { ServiceLocator, SERVICE_KEYS } from '../core/ServiceLocator';
import { StatsManager } from '../core/StatsManager';

export class Debug {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private fpsText: Phaser.GameObjects.Text;
  private statsText: Phaser.GameObjects.Text;
  private visible = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(0, 0)
      .setDepth(999)
      .setScrollFactor(0)
      .setVisible(false);

    const bg = scene.add.graphics();
    bg.fillStyle(0x000000, 0.7);
    bg.fillRect(GAME_WIDTH - 60, 0, 60, 50);

    this.fpsText = scene.add.text(GAME_WIDTH - 58, 2, 'FPS: --', {
      fontSize: '6px',
      color: '#00ff00',
      fontFamily: 'monospace',
    });

    this.statsText = scene.add.text(GAME_WIDTH - 58, 10, '', {
      fontSize: '6px',
      color: '#aaaaaa',
      fontFamily: 'monospace',
    });

    this.container.add([bg, this.fpsText, this.statsText]);

    scene.input.keyboard?.on('keydown-F3', () => {
      this.visible = !this.visible;
      this.container.setVisible(this.visible);
    });
  }

  update(): void {
    if (!this.visible) return;

    this.fpsText.setText(`FPS: ${Math.round(this.scene.game.loop.actualFps)}`);

    if (ServiceLocator.has(SERVICE_KEYS.STATS_MANAGER)) {
      const sm = ServiceLocator.get<StatsManager>(SERVICE_KEYS.STATS_MANAGER);
      const stats = sm.getAll();
      this.statsText.setText(
        `F:${stats.faith} C:${stats.courage}\nW:${stats.wisdom} B:${stats.burden}`,
      );
    }
  }
}
