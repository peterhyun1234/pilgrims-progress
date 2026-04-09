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
  /** Reusable graphics for the burden bar glow — created once, not per-frame. */
  private burdenGlowGfx: Phaser.GameObjects.Graphics | null = null;

  private static readonly BAR_WIDTH = 76;
  private static readonly BAR_HEIGHT = 8;
  private static readonly BAR_GAP = 17;   // row height
  private static readonly ROW_MID = 8;    // vertical center within a row
  private static readonly PADDING = 6;
  private static readonly ICON_SIZE = 12; // iconBg square size

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
    const { PADDING: P, BAR_GAP: G, ICON_SIZE: IS } = HUD;
    // 4 rows + top/bottom padding
    const panelH = P + 4 * G + P - 2;
    // Panel width: padding + iconSize + gap + label(32) + gap + bar(76) + gap + value(18) + padding
    const panelW = P + IS + 2 + 32 + 4 + HUD.BAR_WIDTH + 4 + 18 + P;
    bg.fillStyle(0x0a0814, 0.85);
    bg.fillRoundedRect(2, 2, panelW, panelH, 4);
    bg.lineStyle(1, 0xd4a853, 0.55);
    bg.strokeRoundedRect(2, 2, panelW, panelH, 4);
    bg.lineStyle(0.5, 0xd4a853, 0.2);
    bg.strokeRoundedRect(4, 4, panelW - 4, panelH - 4, 3);
    bg.fillStyle(0xffffff, 0.03);
    bg.fillRoundedRect(3, 3, panelW - 2, 10, 3);
    this.container.add(bg);
  }

  private createBars(): void {
    const stats: StatType[] = ['faith', 'courage', 'wisdom', 'burden'];
    const gm = ServiceLocator.get<GameManager>(SERVICE_KEYS.GAME_MANAGER);
    const ko = gm.language === 'ko';
    const { PADDING: P, BAR_GAP: G, ROW_MID: MID, ICON_SIZE: IS } = HUD;
    // barX: icon(IS) + 2px gap + label(32) + 4px gap
    const barX = IS + 2 + 32 + 4;

    stats.forEach((stat, i) => {
      const containerY = P + i * G;
      const barContainer = this.scene.add.container(P, containerY);

      const iconBgColor = DesignSystem.statColorSafe(stat);

      // Icon background — vertically centered at MID
      const iconBg = this.scene.add.graphics();
      iconBg.fillStyle(iconBgColor, 0.22);
      iconBg.fillRoundedRect(0, MID - IS / 2, IS, IS, 2);
      iconBg.lineStyle(0.5, iconBgColor, 0.5);
      iconBg.strokeRoundedRect(0, MID - IS / 2, IS, IS, 2);

      // Icon glyph — centered inside iconBg
      const icon = this.scene.add.text(IS / 2, MID, DesignSystem.STAT_ICONS[stat], {
        fontSize: '8px', color: DesignSystem.hex(iconBgColor),
        fontFamily: 'serif',
      }).setOrigin(0.5, 0.5);

      // Label — vertically centered, right of iconBg
      const labelText = gm.i18n.t(`hud.${stat}`);
      const labelFontSize = ko ? DesignSystem.FONT_SIZE.SM : DesignSystem.FONT_SIZE.XS;
      const label = this.scene.add.text(IS + 2, MID, labelText, {
        fontSize: `${labelFontSize}px`,
        color: DesignSystem.hex(iconBgColor),
        fontFamily: FONT_FAMILY,
        stroke: '#000000',
        strokeThickness: 2,
        shadow: { offsetX: 1, offsetY: 1, color: '#000', blur: 0, stroke: true, fill: true },
      }).setOrigin(0, 0.5);

      // Bar track — vertically centered at MID
      const barBg = this.scene.add.graphics();
      barBg.fillStyle(0x222222, 0.7);
      barBg.fillRoundedRect(barX, MID - HUD.BAR_HEIGHT / 2, HUD.BAR_WIDTH, HUD.BAR_HEIGHT, 2);
      // Subtle border around track
      barBg.lineStyle(1, iconBgColor, 0.3);
      barBg.strokeRoundedRect(barX, MID - HUD.BAR_HEIGHT / 2, HUD.BAR_WIDTH, HUD.BAR_HEIGHT, 2);

      const fill = this.scene.add.graphics();
      const currentVal = this.statsManager.get(stat);
      const fillW = (currentVal / 100) * HUD.BAR_WIDTH;
      this.drawFill(fill, barX, MID, fillW, stat);

      // Value number — vertically centered, right of bar
      const value = this.scene.add.text(barX + HUD.BAR_WIDTH + 3, MID,
        currentVal.toString(), {
          fontSize: `${DesignSystem.FONT_SIZE.XS}px`,
          color: DesignSystem.hex(iconBgColor),
          fontFamily: FONT_FAMILY,
          shadow: { offsetX: 1, offsetY: 1, color: '#000', blur: 0, stroke: true, fill: true },
        }).setOrigin(0, 0.5);

      barContainer.add([iconBg, barBg, fill, icon, label, value]);
      this.container.add(barContainer);

      this.bars.push({
        container: barContainer, fill, label, icon, value,
        currentWidth: fillW, targetWidth: fillW, stat,
      });
    });
  }

  /**
   * @param midY  vertical center Y within the barContainer coordinate space
   */
  private drawFill(g: Phaser.GameObjects.Graphics, x: number, midY: number, w: number, stat: StatType): void {
    g.clear();
    if (w <= 0) return;
    const bh = HUD.BAR_HEIGHT;
    const fy = midY - bh / 2;
    // Respect colorblind mode via DesignSystem.statColorSafe
    const color = DesignSystem.statColorSafe(stat);
    g.fillStyle(color, 0.85);
    g.fillRoundedRect(x, fy, Math.max(w, 2), bh, 2);
    // Top highlight stripe
    g.fillStyle(0xffffff, 0.18);
    g.fillRect(x + 1, fy, Math.max(w - 2, 1), 2);
    // Bright gradient end-cap (right edge glow)
    if (w > 4) {
      g.fillStyle(0xffffff, 0.35);
      g.fillRoundedRect(x + w - 4, fy, 4, bh, 2);
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
      targets: bar.value, scaleX: 1.5, scaleY: 1.5, duration: DesignSystem.dur(150), yoyo: true,
      onComplete: () => bar.value.setColor(DesignSystem.hex(DesignSystem.statColorSafe(bar.stat))),
    });

    if (p.amount !== 0) {
      this.showStatDelta(bar, p.amount);
      if (ServiceLocator.has(SERVICE_KEYS.AUDIO_MANAGER)) {
        const audio = ServiceLocator.get<AudioManager>(SERVICE_KEYS.AUDIO_MANAGER);
        if (p.amount > 0) audio?.procedural?.playStatGain();
        else audio?.procedural?.playStatLoss();
      }

      // Particle burst at the bar fill end-point for visible gain feedback
      if (p.amount > 0) {
        const barX = this.container.x + HUD.PADDING + this._barX;
        const barY = this.container.y + bar.container.y + HUD.ROW_MID;
        const fillEnd = barX + bar.currentWidth;
        DesignSystem.particleBurst(this.scene, fillEnd, barY,
          DesignSystem.statColorSafe(p.stat), 5,
          { speed: 14, size: 1.5, duration: 400, depth: 102 },
        );
      }

      // High burden warning — edge pulse
      if (p.stat === 'burden' && p.newValue >= 70) {
        DesignSystem.edgePulse(this.scene, 0xff2200,
          p.newValue >= 85 ? 0.40 : 0.22, 700,
        );
      }
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
  };

  private setupEvents(): void {
    this.eventBus.on(GameEvent.STAT_CHANGED, this.onStatChanged);
    this.eventBus.on(GameEvent.GAME_STATE_CHANGED, this.onStateChanged);
    this.eventBus.on(GameEvent.CHAPTER_CHANGED, this.onChapterLoaded);
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

  private get _barX(): number {
    const { ICON_SIZE: IS } = HUD;
    return IS + 2 + 32 + 4; // matches createBars() barX calculation
  }

  private showStatDelta(bar: StatBar, amount: number): void {
    const sign = amount > 0 ? '+' : '';
    const color = amount > 0 ? '#55ff55' : '#ff5555';
    const delta = this.scene.add.text(
      bar.container.x + this._barX + HUD.BAR_WIDTH + 20,
      bar.container.y + HUD.ROW_MID,
      `${sign}${amount}`,
      {
        fontSize: `${DesignSystem.FONT_SIZE.XS}px`,
        color, fontFamily: FONT_FAMILY, fontStyle: 'bold',
        shadow: { offsetX: 1, offsetY: 1, color: '#000', blur: 0, stroke: true, fill: true },
      },
    ).setDepth(101).setScrollFactor(0).setOrigin(0, 0.5);

    this.scene.tweens.add({
      targets: delta, y: delta.y - 12, alpha: 0, duration: 900,
      ease: 'Sine.easeOut',
      onComplete: () => delta.destroy(),
    });
  }

  update(): void {
    this.bars.forEach(bar => {
      if (Math.abs(bar.currentWidth - bar.targetWidth) > 0.3) {
        bar.currentWidth += (bar.targetWidth - bar.currentWidth) * 0.1;
        this.drawFill(bar.fill, this._barX, HUD.ROW_MID, bar.currentWidth, bar.stat);
      }
    });

    const burdenBar = this.bars[3];
    const burden = this.statsManager.get('burden');
    const baseY = HUD.PADDING + 3 * HUD.BAR_GAP;
    if (burdenBar && burden >= 60) {
      const t = this.scene.time.now * 0.004;
      const glowAlpha = 0.06 + Math.sin(t * 2) * 0.04;
      burdenBar.fill.setAlpha(0.85);
      // Reuse a single graphics object instead of creating+destroying every frame.
      if (!this.burdenGlowGfx) {
        this.burdenGlowGfx = this.scene.add.graphics().setScrollFactor(0).setDepth(99);
      }
      this.burdenGlowGfx.clear();
      this.burdenGlowGfx.fillStyle(0xff2200, glowAlpha);
      const bh = HUD.BAR_HEIGHT;
      this.burdenGlowGfx.fillRoundedRect(
        burdenBar.container.x + this._barX,
        burdenBar.container.y + HUD.ROW_MID - bh / 2 - 1,
        HUD.BAR_WIDTH + 2, bh + 2, 2,
      );
      if (burden >= 80) {
        const shake = Math.sin(t * 2) * 0.8;
        burdenBar.container.y = baseY + shake;
        burdenBar.fill.setAlpha(0.6 + Math.sin(t * 3) * 0.4);
        burdenBar.icon.setTint(0xff4444);
      } else if (burden >= 70) {
        burdenBar.fill.setAlpha(0.75 + Math.sin(t * 1.5) * 0.25);
        burdenBar.container.y = baseY;
        burdenBar.icon.setTint(0xff8866);
      } else {
        burdenBar.fill.setAlpha(0.8 + Math.sin(t) * 0.2);
        burdenBar.container.y = baseY;
        burdenBar.icon.clearTint();
      }
    } else if (burdenBar) {
      burdenBar.fill.setAlpha(0.85);
      burdenBar.container.y = baseY;
      burdenBar.icon.clearTint();
      // Hide the glow when burden is below threshold.
      if (this.burdenGlowGfx) {
        this.burdenGlowGfx.clear();
      }
    }
  }

  destroy(): void {
    this.eventBus.off(GameEvent.STAT_CHANGED, this.onStatChanged);
    this.eventBus.off(GameEvent.GAME_STATE_CHANGED, this.onStateChanged);
    this.eventBus.off(GameEvent.CHAPTER_CHANGED, this.onChapterLoaded);
    this.burdenGlowGfx?.destroy();
    this.burdenGlowGfx = null;
    this.container.destroy(true);
  }
}
