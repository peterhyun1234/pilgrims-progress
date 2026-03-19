import Phaser from 'phaser';
import { GAME_WIDTH, COLORS } from '../config';

export class Toast {
  private scene: Phaser.Scene;
  private queue: { text: string; type: string }[] = [];
  private isShowing = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  show(text: string, type: 'stat' | 'card' | 'info' = 'info', _duration = 2000): void {
    this.queue.push({ text, type });
    if (!this.isShowing) {
      this.showNext();
    }
  }

  private showNext(): void {
    if (this.queue.length === 0) {
      this.isShowing = false;
      return;
    }

    this.isShowing = true;
    const item = this.queue.shift()!;

    const color = item.type === 'stat' ? '#E6C86E' :
                  item.type === 'card' ? '#4A9E4A' : '#FFFFFF';

    const bg = this.scene.add.rectangle(
      GAME_WIDTH / 2, 50, 0, 12,
      COLORS.UI.PANEL, 0.9,
    ).setScrollFactor(0).setDepth(300);

    const text = this.scene.add.text(
      GAME_WIDTH / 2, 50,
      item.text,
      { fontSize: '7px', color, fontStyle: 'bold' },
    ).setOrigin(0.5).setScrollFactor(0).setDepth(301).setAlpha(0);

    bg.width = text.width + 16;
    bg.setStrokeStyle(1, COLORS.UI.PANEL_BORDER);

    this.scene.tweens.add({
      targets: [text, bg],
      alpha: 1,
      y: 44,
      duration: 300,
      ease: 'Power2',
      hold: 1500,
      yoyo: true,
      onComplete: () => {
        text.destroy();
        bg.destroy();
        this.showNext();
      },
    });
  }
}
