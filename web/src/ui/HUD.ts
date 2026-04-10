import { COLORS } from '../config';
import { ServiceLocator, SERVICE_KEYS } from '../core/ServiceLocator';
import { StatsManager } from '../core/StatsManager';
import { EventBus } from '../core/EventBus';
import { GameEvent, StatChangePayload, StatType, GameState } from '../core/GameEvents';
import { DesignSystem, FONT_FAMILY } from './DesignSystem';
import { GameManager } from '../core/GameManager';
import { AudioManager } from '../audio/AudioManager';

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
  /** Reused graphics for burden glow overlay — avoids per-frame allocation. */
  private burdenGlowGfx!: Phaser.GameObjects.Graphics;
  /** Small chapter badge shown in top-right of HUD panel. */
  private chapterBadge!: Phaser.GameObjects.Text;

  private static readonly BAR_WIDTH = 88;
  private static readonly BAR_HEIGHT = 9;
  private static readonly BAR_GAP = 17;
  private static readonly PADDING = 7;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.statsManager = ServiceLocator.get<StatsManager>(SERVICE_KEYS.STATS_MANAGER);
    this.eventBus = EventBus.getInstance();
    this.container = scene.add.container(0, 0).setDepth(100).setScrollFactor(0);

    this.createBackground();
    this.createBars();
    this.createChapterBadge();
    // Reusable graphics layer for the burden glow overlay
    this.burdenGlowGfx = scene.add.graphics().setScrollFactor(0).setDepth(99);
    this.container.add(this.burdenGlowGfx);
    this.setupEvents();
  }

  private createChapterBadge(): void {
    const gm = ServiceLocator.get<GameManager>(SERVICE_KEYS.GAME_MANAGER);
    const ch = gm.currentChapter;
    const ko = gm.language === 'ko';
    const label = ko ? `${ch}장` : `Ch.${ch}`;
    // Place at bottom-right of panel to avoid overlapping stat values
    this.chapterBadge = this.scene.add.text(176, 76, label, {
      fontSize: '9px',
      color: '#d4a853',
      fontFamily: FONT_FAMILY,
    }).setAlpha(0.65).setOrigin(1, 0.5).setScrollFactor(0).setDepth(101);
    this.container.add(this.chapterBadge);
  }

  private createBackground(): void {
    const bg = this.scene.add.graphics();
    // Panel: wide enough for 88px bars + labels + value
    bg.fillStyle(0x0a0814, 0.88);
    bg.fillRoundedRect(2, 2, 178, 82, 4);
    // Outer border
    bg.lineStyle(1, 0xd4a853, 0.65);
    bg.strokeRoundedRect(2, 2, 178, 82, 4);
    // Inner gold border line
    bg.lineStyle(0.5, 0xd4a853, 0.25);
    bg.strokeRoundedRect(4, 4, 174, 78, 3);
    // Top highlight strip
    bg.fillStyle(0xffffff, 0.04);
    bg.fillRoundedRect(3, 3, 176, 10, 3);
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

      // Stat icon — centred within its 11×11 coloured box
      const iconBg = this.scene.add.graphics();
      const iconBgColor = DesignSystem.getStatColor(stat);
      iconBg.fillStyle(iconBgColor, 0.22);
      iconBg.fillRoundedRect(0, 0, 11, 11, 2);
      iconBg.lineStyle(0.5, iconBgColor, 0.4);
      iconBg.strokeRoundedRect(0, 0, 11, 11, 2);

      const icon = this.scene.add.text(5, 5, DesignSystem.STAT_ICONS[stat], {
        fontSize: '9px', color: DesignSystem.hex(DesignSystem.getStatColor(stat)),
        fontFamily: 'serif',
      }).setOrigin(0.5, 0.5);  // centred inside the 11×11 box

      const labelText = gm.i18n.t(`hud.${stat}`);
      // Korean glyphs need SM(13px) so final consonants aren't clipped at XS(11px)
      const labelFontSize = ko ? DesignSystem.FONT_SIZE.SM : DesignSystem.FONT_SIZE.XS;
      const label = this.scene.add.text(13, 5, labelText, {
        fontSize: `${labelFontSize}px`,
        color: DesignSystem.hex(DesignSystem.getStatColor(stat)),
        fontFamily: FONT_FAMILY,
        shadow: { offsetX: 1, offsetY: 1, color: '#000', blur: 0, stroke: true, fill: true },
      }).setOrigin(0, 0.5);  // vertically centred with icon

      const barX = 44;
      const bg = this.scene.add.graphics();
      bg.fillStyle(0x222222, 0.7);
      bg.fillRoundedRect(barX, 1, HUD.BAR_WIDTH, HUD.BAR_HEIGHT, 2);

      const fill = this.scene.add.graphics();
      const currentVal = this.statsManager.get(stat);
      const fillW = (currentVal / 100) * HUD.BAR_WIDTH;
      this.drawFill(fill, barX, fillW, stat);

      // Value right-aligned to the panel edge (x=171) so it never overflows
      const value = this.scene.add.text(171 - HUD.PADDING, 5,
        currentVal.toString(), {
          fontSize: `${DesignSystem.FONT_SIZE.XS}px`,
          color: DesignSystem.hex(DesignSystem.getStatColor(stat)),
          fontFamily: FONT_FAMILY,
          shadow: { offsetX: 1, offsetY: 1, color: '#000', blur: 0, stroke: true, fill: true },
        }).setOrigin(1, 0.5);  // right-aligned, vertically centred

      barContainer.add([iconBg, bg, fill, icon, label, value]);
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
    const color = DesignSystem.getStatColor(stat);
    g.fillStyle(color, 0.85);
    g.fillRoundedRect(x, 1, Math.max(w, 2), HUD.BAR_HEIGHT, 2);
    // Top highlight stripe
    g.fillStyle(0xffffff, 0.18);
    g.fillRect(x + 1, 1, Math.max(w - 2, 1), 2);
    // Bright gradient end-cap (right edge glow)
    if (w > 4) {
      g.fillStyle(0xffffff, 0.35);
      g.fillRoundedRect(x + w - 4, 1, 4, HUD.BAR_HEIGHT, 2);
    }
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
      onComplete: () => bar.value.setColor(DesignSystem.hex(DesignSystem.getStatColor(bar.stat))),
    });

    if (p.amount !== 0) {
      this.showStatDelta(bar, p.amount);
      const audio = ServiceLocator.get<AudioManager>(SERVICE_KEYS.AUDIO_MANAGER);
      if (p.amount > 0) audio?.procedural?.playStatGain();
      else audio?.procedural?.playStatLoss();
    }
  };

  private onStateChanged = (state: GameState | undefined) => {
    if (state === GameState.CUTSCENE || state === GameState.DIALOGUE) {
      // Slide out left when entering dialogue/cutscene
      this.scene.tweens.add({
        targets: this.container, x: -80, alpha: 0.15,
        duration: 350, ease: 'Quad.easeIn',
      });
    } else if (state === GameState.GAME) {
      // Slide back in
      this.scene.tweens.add({
        targets: this.container, x: 0, alpha: 1,
        duration: 350, ease: 'Back.easeOut',
      });
    }
  };

  private onChapterLoaded = (payload?: { chapter: number; title?: string }) => {
    if (!payload) return;
    this.showLocationCard(payload.chapter, payload.title);
    // Update chapter badge in HUD panel
    const gm = ServiceLocator.get<GameManager>(SERVICE_KEYS.GAME_MANAGER);
    const ko = gm.language === 'ko';
    this.chapterBadge.setText(ko ? `${payload.chapter}장` : `Ch.${payload.chapter}`);
  };

  private onSettingsChanged = () => {
    // Refresh all bar colors when colorblind mode changes
    this.bars.forEach(bar => {
      const color = DesignSystem.getStatColor(bar.stat);
      const hexColor = DesignSystem.hex(color);
      bar.icon.setColor(hexColor);
      bar.label.setColor(hexColor);
      bar.value.setColor(hexColor);
      this.drawFill(bar.fill, 44, bar.currentWidth, bar.stat);
    });
  };

  private setupEvents(): void {
    this.eventBus.on(GameEvent.STAT_CHANGED, this.onStatChanged);
    this.eventBus.on(GameEvent.GAME_STATE_CHANGED, this.onStateChanged);
    this.eventBus.on(GameEvent.CHAPTER_CHANGED, this.onChapterLoaded);
    this.eventBus.on(GameEvent.SETTINGS_CHANGED, this.onSettingsChanged);
  }

  /** Show a cinematic location card when entering a new chapter */
  private showLocationCard(chapter: number, title?: string): void {
    const gm = ServiceLocator.get<GameManager>(SERVICE_KEYS.GAME_MANAGER);
    const ko = gm.language === 'ko';

    const chapterLabel = ko ? `제 ${chapter} 장` : `Chapter ${chapter}`;
    const locationName = title ?? chapterLabel;

    // Create location card (centered, top area)
    const cx = 240; // GAME_WIDTH / 2
    const cardY = 40;

    // Slide down from y=-30 over 400ms as per spec
    const card = this.scene.add.container(cx, cardY - 30)
      .setDepth(150).setScrollFactor(0).setAlpha(0);

    // Background
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x0a0814, 0.85);
    bg.fillRoundedRect(-100, -18, 200, 36, 6);
    bg.lineStyle(1, COLORS.UI.GOLD, 0.3);
    bg.strokeRoundedRect(-100, -18, 200, 36, 6);

    // Decorative line
    bg.lineStyle(0.5, COLORS.UI.GOLD, 0.5);
    bg.lineBetween(-60, 1, 60, 1);

    // Chapter number
    const chText = this.scene.add.text(0, -8, chapterLabel, {
      fontSize: `${DesignSystem.FONT_SIZE.XS}px`,
      color: '#d4a853', fontFamily: FONT_FAMILY,
    }).setOrigin(0.5);

    // Location name
    const locText = this.scene.add.text(0, 6, locationName, {
      fontSize: `${DesignSystem.FONT_SIZE.BASE}px`,
      color: '#e8e0d0', fontFamily: FONT_FAMILY,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    card.add([bg, chText, locText]);

    // Slide down from y=-30 to cardY over 400ms
    this.scene.tweens.add({
      targets: card, alpha: 1, y: cardY,
      duration: 400, ease: 'Back.easeOut',
    });

    // Animate out after delay
    this.scene.time.delayedCall(3000, () => {
      this.scene.tweens.add({
        targets: card, alpha: 0, y: cardY - 15,
        duration: 500, ease: 'Quad.easeIn',
        onComplete: () => card.destroy(true),
      });
    });
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
        shadow: { offsetX: 1, offsetY: 1, color: '#000', blur: 0, stroke: true, fill: true },
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
    this.burdenGlowGfx.clear();
    if (burdenBar && burden >= 60) {
      const t = this.scene.time.now * 0.004;
      // Red pulsing glow behind the bar — reuse cached graphics, no allocation
      const glowAlpha = 0.06 + Math.sin(t * 2) * 0.04;
      this.burdenGlowGfx.fillStyle(0xff2200, glowAlpha);
      this.burdenGlowGfx.fillRoundedRect(
        burdenBar.container.x + 44, burdenBar.container.y - 1,
        HUD.BAR_WIDTH + 2, HUD.BAR_HEIGHT + 2, 2,
      );
      if (burden >= 80) {
        const shake = Math.sin(t * 2) * 0.8;
        burdenBar.container.y = HUD.PADDING + 3 * HUD.BAR_GAP + shake;
        burdenBar.fill.setAlpha(0.6 + Math.sin(t * 3) * 0.4);
        burdenBar.icon.setTint(0xff4444);
      } else if (burden >= 70) {
        burdenBar.fill.setAlpha(0.75 + Math.sin(t * 1.5) * 0.25);
        burdenBar.container.y = HUD.PADDING + 3 * HUD.BAR_GAP;
        burdenBar.icon.setTint(0xff8866);
      } else {
        burdenBar.fill.setAlpha(0.8 + Math.sin(t) * 0.2);
        burdenBar.container.y = HUD.PADDING + 3 * HUD.BAR_GAP;
        burdenBar.icon.clearTint();
      }
    } else if (burdenBar) {
      burdenBar.fill.setAlpha(0.85);
      burdenBar.container.y = HUD.PADDING + 3 * HUD.BAR_GAP;
      burdenBar.icon.clearTint();
    }
  }

  destroy(): void {
    this.eventBus.off(GameEvent.STAT_CHANGED, this.onStatChanged);
    this.eventBus.off(GameEvent.GAME_STATE_CHANGED, this.onStateChanged);
    this.eventBus.off(GameEvent.CHAPTER_CHANGED, this.onChapterLoaded);
    this.eventBus.off(GameEvent.SETTINGS_CHANGED, this.onSettingsChanged);
    this.container.destroy(true);
  }
}
