import { ServiceLocator, SERVICE_KEYS } from '../core/ServiceLocator';
import { StatsManager } from '../core/StatsManager';
import { EventBus } from '../core/EventBus';
import { GameEvent, StatChangePayload, StatType, GameState } from '../core/GameEvents';
import { DesignSystem, FONT_FAMILY } from './DesignSystem';
import { GameManager } from '../core/GameManager';

interface StatBar {
  container: Phaser.GameObjects.Container;
  fill: Phaser.GameObjects.Graphics;
  label: Phaser.GameObjects.Text;
  icon: Phaser.GameObjects.Text;
  value: Phaser.GameObjects.Text;
  currentWidth: number;
  targetWidth: number;
  stat: StatType;
}

export class HUD {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private bars: StatBar[] = [];
  private statsManager: StatsManager;
  private eventBus: EventBus;

  private static readonly BAR_WIDTH = 56;
  private static readonly BAR_HEIGHT = 6;
  private static readonly BAR_GAP = 14;
  private static readonly PADDING = 7;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.statsManager = ServiceLocator.get<StatsManager>(SERVICE_KEYS.STATS_MANAGER);
    this.eventBus = EventBus.getInstance();
    this.container = scene.add.container(0, 0).setDepth(100).setScrollFactor(0);

    this.createBackground();
    this.createBars();
    this.setupEvents();
  }

  private createBackground(): void {
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x0a0814, 0.65);
    bg.fillRoundedRect(2, 2, 134, 68, 4);
    bg.lineStyle(0.5, 0xd4a853, 0.1);
    bg.strokeRoundedRect(2, 2, 134, 68, 4);
    this.container.add(bg);
  }

  private createBars(): void {
    const stats: StatType[] = ['faith', 'courage', 'wisdom', 'burden'];
    const gm = ServiceLocator.get<GameManager>(SERVICE_KEYS.GAME_MANAGER);
    const ko = gm.language === 'ko';

    stats.forEach((stat, i) => {
      const x = HUD.PADDING;
      const y = HUD.PADDING + i * HUD.BAR_GAP;
      const barContainer = this.scene.add.container(x, y);

      const icon = this.scene.add.text(0, 0, DesignSystem.STAT_ICONS[stat], {
        fontSize: '9px', color: DesignSystem.hex(DesignSystem.STAT_COLORS[stat]),
        fontFamily: 'serif',
      }).setOrigin(0, 0);

      const labelText = ko ? DesignSystem.STAT_LABELS_KO[stat] : DesignSystem.STAT_LABELS_EN[stat];
      // Use native 11px for Galmuri11 (KO) so final consonants aren't clipped at 9px
      const labelFontSize = ko ? DesignSystem.FONT_SIZE.SM : DesignSystem.FONT_SIZE.XS;
      const label = this.scene.add.text(11, 0, labelText, {
        fontSize: `${labelFontSize}px`,
        color: DesignSystem.hex(DesignSystem.STAT_COLORS[stat]),
        fontFamily: FONT_FAMILY,
        shadow: { offsetX: 1, offsetY: 1, color: '#000', blur: 1, stroke: true, fill: true },
      }).setOrigin(0, 0);

      const barX = 44;
      const bg = this.scene.add.graphics();
      bg.fillStyle(0x222222, 0.7);
      bg.fillRoundedRect(barX, 1, HUD.BAR_WIDTH, HUD.BAR_HEIGHT, 2);

      const fill = this.scene.add.graphics();
      const currentVal = this.statsManager.get(stat);
      const fillW = (currentVal / 100) * HUD.BAR_WIDTH;
      this.drawFill(fill, barX, fillW, stat);

      const value = this.scene.add.text(barX + HUD.BAR_WIDTH + 4, 0,
        currentVal.toString(), {
          fontSize: `${DesignSystem.FONT_SIZE.XS}px`,
          color: DesignSystem.hex(DesignSystem.STAT_COLORS[stat]),
          fontFamily: FONT_FAMILY,
          shadow: { offsetX: 1, offsetY: 1, color: '#000', blur: 1, stroke: true, fill: true },
        }).setOrigin(0, 0);

      barContainer.add([bg, fill, icon, label, value]);
      this.container.add(barContainer);

      this.bars.push({
        container: barContainer, fill, label, icon, value,
        currentWidth: fillW, targetWidth: fillW, stat,
      });
    });
  }

  private drawFill(g: Phaser.GameObjects.Graphics, x: number, w: number, stat: StatType): void {
    g.clear();
    if (w <= 0) return;
    const color = DesignSystem.STAT_COLORS[stat];
    g.fillStyle(color, 0.85);
    g.fillRoundedRect(x, 1, Math.max(w, 2), HUD.BAR_HEIGHT, 2);
    g.fillStyle(0xffffff, 0.15);
    g.fillRect(x + 1, 1, Math.max(w - 2, 1), 2);
  }

  private onStatChanged = (p: StatChangePayload | undefined) => {
    if (!p) return;
    const bar = this.bars.find(b => b.stat === p.stat);
    if (!bar) return;
    bar.targetWidth = (p.newValue / 100) * HUD.BAR_WIDTH;
    bar.value.setText(p.newValue.toString());

    const flashColor = p.amount > 0 ? '#66ff66' : '#ff6666';
    bar.value.setColor(flashColor);
    this.scene.tweens.add({
      targets: bar.value, scaleX: 1.5, scaleY: 1.5, duration: 150, yoyo: true,
      onComplete: () => bar.value.setColor(DesignSystem.hex(DesignSystem.STAT_COLORS[bar.stat])),
    });

    if (p.amount !== 0) {
      this.showStatDelta(bar, p.amount);
    }
  };

  private onStateChanged = (state: GameState | undefined) => {
    if (state === GameState.CUTSCENE || state === GameState.DIALOGUE) {
      this.scene.tweens.add({ targets: this.container, alpha: 0.3, duration: 300 });
    } else if (state === GameState.GAME) {
      this.scene.tweens.add({ targets: this.container, alpha: 1, duration: 300 });
    }
  };

  private setupEvents(): void {
    this.eventBus.on(GameEvent.STAT_CHANGED, this.onStatChanged);
    this.eventBus.on(GameEvent.GAME_STATE_CHANGED, this.onStateChanged);
  }

  private showStatDelta(bar: StatBar, amount: number): void {
    const sign = amount > 0 ? '+' : '';
    const color = amount > 0 ? '#55ff55' : '#ff5555';
    const delta = this.scene.add.text(
      bar.container.x + 44 + HUD.BAR_WIDTH + 18,
      bar.container.y,
      `${sign}${amount}`,
      {
        fontSize: `${DesignSystem.FONT_SIZE.XS}px`,
        color, fontFamily: FONT_FAMILY, fontStyle: 'bold',
        shadow: { offsetX: 1, offsetY: 1, color: '#000', blur: 2, stroke: true, fill: true },
      },
    ).setDepth(101).setScrollFactor(0);

    this.scene.tweens.add({
      targets: delta, y: delta.y - 10, alpha: 0, duration: 800,
      ease: 'Sine.easeOut',
      onComplete: () => delta.destroy(),
    });
  }

  update(): void {
    this.bars.forEach(bar => {
      if (Math.abs(bar.currentWidth - bar.targetWidth) > 0.3) {
        bar.currentWidth += (bar.targetWidth - bar.currentWidth) * 0.1;
        this.drawFill(bar.fill, 44, bar.currentWidth, bar.stat);
      }
    });

    const burdenBar = this.bars[3];
    const burden = this.statsManager.get('burden');
    if (burdenBar && burden >= 60) {
      const t = Date.now() * 0.004;
      if (burden >= 80) {
        // Shake + pulse fill color between red and dark-red
        const shake = Math.sin(t * 2) * 0.8;
        burdenBar.container.y = HUD.PADDING + 3 * HUD.BAR_GAP + shake;
        const pulse = 0.6 + Math.sin(t * 3) * 0.4;
        burdenBar.fill.setAlpha(pulse);
      } else {
        // Just a slow pulse at burden 60-79
        const pulse = 0.75 + Math.sin(t) * 0.25;
        burdenBar.fill.setAlpha(pulse);
        burdenBar.container.y = HUD.PADDING + 3 * HUD.BAR_GAP;
      }
    } else if (burdenBar) {
      burdenBar.fill.setAlpha(0.85);
      burdenBar.container.y = HUD.PADDING + 3 * HUD.BAR_GAP;
    }
  }

  destroy(): void {
    this.eventBus.off(GameEvent.STAT_CHANGED, this.onStatChanged);
    this.eventBus.off(GameEvent.GAME_STATE_CHANGED, this.onStateChanged);
    this.container.destroy(true);
  }
}
