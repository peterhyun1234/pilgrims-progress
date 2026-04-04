import { GAME_WIDTH, COLORS } from '../config';
import { NPC } from '../entities/NPC';
import { ChapterConfig } from '../world/ChapterData';

export class MiniMap {
  private container: Phaser.GameObjects.Container;
  private mapGfx: Phaser.GameObjects.Graphics;
  private dotsGfx: Phaser.GameObjects.Graphics;
  private isVisible = true;

  private static readonly SIZE = 52;
  private static readonly MARGIN = 8;
  private static readonly BORDER = 1;

  private config: ChapterConfig | null = null;
  private scaleX = 1;
  private scaleY = 1;
  private frameCounter = 0;

  constructor(scene: Phaser.Scene) {
    this.container = scene.add.container(
      GAME_WIDTH - MiniMap.SIZE - MiniMap.MARGIN,
      MiniMap.MARGIN + 26,
    ).setDepth(95).setScrollFactor(0);

    const bg = scene.add.graphics();
    bg.fillStyle(0x0a0814, 0.7);
    bg.fillRoundedRect(-MiniMap.BORDER, -MiniMap.BORDER,
      MiniMap.SIZE + MiniMap.BORDER * 2, MiniMap.SIZE + MiniMap.BORDER * 2, 3);
    bg.lineStyle(0.5, COLORS.UI.GOLD, 0.25);
    bg.strokeRoundedRect(-MiniMap.BORDER, -MiniMap.BORDER,
      MiniMap.SIZE + MiniMap.BORDER * 2, MiniMap.SIZE + MiniMap.BORDER * 2, 3);

    this.mapGfx = scene.add.graphics();
    this.dotsGfx = scene.add.graphics();

    this.container.add([bg, this.mapGfx, this.dotsGfx]);
  }

  setChapter(config: ChapterConfig): void {
    this.config = config;
    this.scaleX = MiniMap.SIZE / config.mapWidth;
    this.scaleY = MiniMap.SIZE / config.mapHeight;

    this.mapGfx.clear();
    this.mapGfx.fillStyle(0x223322, 0.5);
    this.mapGfx.fillRect(0, 0, MiniMap.SIZE, MiniMap.SIZE);

    if (config.exits) {
      config.exits.forEach(exit => {
        this.mapGfx.fillStyle(COLORS.UI.GOLD, 0.4);
        this.mapGfx.fillRect(
          exit.x * this.scaleX, exit.y * this.scaleY,
          Math.max(exit.width * this.scaleX, 3), Math.max(exit.height * this.scaleY, 3),
        );
      });
    }
  }

  update(playerX: number, playerY: number, npcs: NPC[]): void {
    if (!this.isVisible || !this.config) return;
    if (++this.frameCounter % 3 !== 0) return;

    this.dotsGfx.clear();

    npcs.forEach(npc => {
      this.dotsGfx.fillStyle(0x4a90d9, 0.8);
      this.dotsGfx.fillCircle(
        npc.sprite.x * this.scaleX,
        npc.sprite.y * this.scaleY,
        1.5,
      );
    });

    this.dotsGfx.fillStyle(0xd4a853, 1);
    this.dotsGfx.fillCircle(
      playerX * this.scaleX,
      playerY * this.scaleY,
      2,
    );
  }

  toggle(): void {
    this.isVisible = !this.isVisible;
    this.container.setVisible(this.isVisible);
  }

  show(): void {
    this.isVisible = true;
    this.container.setVisible(true);
  }

  hide(): void {
    this.isVisible = false;
    this.container.setVisible(false);
  }

  destroy(): void {
    this.container.destroy(true);
  }
}
