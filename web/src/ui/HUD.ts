import Phaser from 'phaser';
import { COLORS } from '../config';
import { ServiceLocator, SERVICE_KEYS } from '../core/ServiceLocator';
import { StatsManager } from '../core/StatsManager';

export class HUD {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;

  private faithBar: Phaser.GameObjects.Rectangle;
  private courageBar: Phaser.GameObjects.Rectangle;
  private wisdomBar: Phaser.GameObjects.Rectangle;
  private burdenBar: Phaser.GameObjects.Rectangle;


  private readonly BAR_WIDTH = 40;
  private readonly BAR_HEIGHT = 4;
  private readonly START_X = 4;
  private readonly START_Y = 4;
  private readonly GAP = 8;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(0, 0).setDepth(150).setScrollFactor(0);

    const bg = scene.add.rectangle(
      this.START_X + this.BAR_WIDTH / 2 + 14, this.START_Y + 16,
      this.BAR_WIDTH + 36, 36,
      COLORS.UI.PANEL, 0.7,
    );
    this.container.add(bg);

    this.createLabel('FTH', 0);
    this.createLabel('CRG', 1);
    this.createLabel('WIS', 2);
    this.createLabel('BDN', 3);

    this.faithBar = this.createBar(0, 0x4a9e4a);
    this.courageBar = this.createBar(1, 0x4a6a9e);
    this.wisdomBar = this.createBar(2, 0x9e8a4a);
    this.burdenBar = this.createBar(3, 0x9e4a4a);
  }

  update(): void {
    if (!ServiceLocator.has(SERVICE_KEYS.STATS_MANAGER)) return;

    const stats = ServiceLocator.get<StatsManager>(SERVICE_KEYS.STATS_MANAGER);

    this.updateBar(this.faithBar, stats.get('faith'), 100);
    this.updateBar(this.courageBar, stats.get('courage'), 100);
    this.updateBar(this.wisdomBar, stats.get('wisdom'), 100);
    this.updateBar(this.burdenBar, stats.get('burden'), 100);
  }

  private createLabel(text: string, index: number): Phaser.GameObjects.Text {
    const y = this.START_Y + index * this.GAP + 2;
    const label = this.scene.add.text(this.START_X, y, text, {
      fontSize: '5px',
      color: '#8C8070',
    }).setScrollFactor(0).setDepth(151);
    this.container.add(label);
    return label;
  }

  private createBar(index: number, color: number): Phaser.GameObjects.Rectangle {
    const x = this.START_X + 22;
    const y = this.START_Y + index * this.GAP + 4;

    const bgBar = this.scene.add.rectangle(
      x, y, this.BAR_WIDTH, this.BAR_HEIGHT, 0x222222,
    ).setOrigin(0, 0.5).setScrollFactor(0).setDepth(151);
    this.container.add(bgBar);

    const bar = this.scene.add.rectangle(
      x, y, this.BAR_WIDTH, this.BAR_HEIGHT, color,
    ).setOrigin(0, 0.5).setScrollFactor(0).setDepth(152);
    this.container.add(bar);

    return bar;
  }

  private updateBar(bar: Phaser.GameObjects.Rectangle, value: number, max: number): void {
    bar.width = (value / max) * this.BAR_WIDTH;
  }
}
