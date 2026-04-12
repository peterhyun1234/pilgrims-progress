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
  shimmer: Phaser.GameObjects.Graphics;   // animated shimmer layer
  label: Phaser.GameObjects.Text;
  icon: Phaser.GameObjects.Text;
  value: Phaser.GameObjects.Text;
  currentWidth: number;
  targetWidth: number;
  stat: StatType;
  shimmerActive: boolean;
  shimmerX: number;
}

export class HUD {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private bars: StatBar[] = [];
  private statsManager: StatsManager;
  private eventBus: EventBus;
  private burdenGlowGfx!: Phaser.GameObjects.Graphics;
  private chapterBadge!: Phaser.GameObjects.Text;
  /** Pulsing red border ring around entire panel when burden is critical */
  private panelWarningGfx!: Phaser.GameObjects.Graphics;

  private static readonly BAR_WIDTH  = 88;
  private static readonly BAR_HEIGHT = 9;
  private static readonly BAR_GAP    = 17;
  private static readonly PADDING    = 7;
  private static readonly BAR_X      = 44;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.statsManager = ServiceLocator.get<StatsManager>(SERVICE_KEYS.STATS_MANAGER);
    this.eventBus = EventBus.getInstance();
    this.container = scene.add.container(0, 0).setDepth(100).setScrollFactor(0);

    this.createBackground();
    this.createBars();
    this.createChapterBadge();
    this.burdenGlowGfx = scene.add.graphics().setScrollFactor(0).setDepth(99);
    this.panelWarningGfx = scene.add.graphics().setScrollFactor(0).setDepth(99);
    this.container.add([this.burdenGlowGfx, this.panelWarningGfx]);
    this.setupEvents();
  }

  private createChapterBadge(): void {
    const gm = ServiceLocator.get<GameManager>(SERVICE_KEYS.GAME_MANAGER);
    const ch = gm.currentChapter;
    const ko = gm.language === 'ko';
    const label = ko ? `${ch}장` : `Ch.${ch}`;
    this.chapterBadge = this.scene.add.text(176, 76, label, {
      fontSize: '9px', color: '#d4a853', fontFamily: FONT_FAMILY,
    }).setAlpha(0.65).setOrigin(1, 0.5).setScrollFactor(0).setDepth(101);
    this.container.add(this.chapterBadge);
  }

  private createBackground(): void {
    const bg = this.scene.add.graphics();
    // Panel background — darker, richer
    bg.fillStyle(0x08060f, 0.92);
    bg.fillRoundedRect(2, 2, 178, 82, 5);
    // Gold outer border
    bg.lineStyle(1.2, 0xd4a853, 0.72);
    bg.strokeRoundedRect(2, 2, 178, 82, 5);
    // Inner fine border
    bg.lineStyle(0.5, 0xd4a853, 0.22);
    bg.strokeRoundedRect(4, 4, 174, 78, 4);
    // Top gradient highlight strip
    bg.fillStyle(0xffffff, 0.05);
    bg.fillRoundedRect(3, 3, 176, 12, 4);
    // Bottom subtle vignette
    bg.fillStyle(0x000000, 0.06);
    bg.fillRoundedRect(3, 72, 176, 10, 4);
    // Corner ornaments (gold corner marks — pixel art style)
    bg.fillStyle(0xd4a853, 0.60);
    const corners = [[3,3],[177,3],[3,83],[177,83]] as const;
    for (const [cx, cy] of corners) {
      bg.fillRect(cx, cy, 5, 1);
      bg.fillRect(cx, cy, 1, 5);
    }
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

      // ── Icon box (pixel art style) ─────────────────────────────────────
      const iconBg = this.scene.add.graphics();
      const iconColor = DesignSystem.getStatColor(stat);
      iconBg.fillStyle(0x000000, 0.55);
      iconBg.fillRoundedRect(0, 0, 11, 11, 2);
      iconBg.fillStyle(iconColor, 0.28);
      iconBg.fillRoundedRect(0, 0, 11, 11, 2);
      iconBg.lineStyle(0.8, iconColor, 0.55);
      iconBg.strokeRoundedRect(0, 0, 11, 11, 2);
      // Inner highlight (top edge)
      iconBg.fillStyle(0xffffff, 0.06);
      iconBg.fillRect(1, 1, 9, 2);

      const icon = this.scene.add.text(5, 5, DesignSystem.STAT_ICONS[stat], {
        fontSize: '9px', color: DesignSystem.hex(DesignSystem.getStatColor(stat)),
        fontFamily: 'serif',
      }).setOrigin(0.5, 0.5);

      // ── Label ──────────────────────────────────────────────────────────
      const labelText = gm.i18n.t(`hud.${stat}`);
      const labelFontSize = ko ? DesignSystem.FONT_SIZE.SM : DesignSystem.FONT_SIZE.XS;
      const label = this.scene.add.text(13, 5, labelText, {
        fontSize: `${labelFontSize}px`,
        color: DesignSystem.hex(DesignSystem.getStatColor(stat)),
        fontFamily: FONT_FAMILY,
        shadow: { offsetX: 1, offsetY: 1, color: '#000', blur: 0, stroke: true, fill: true },
      }).setOrigin(0, 0.5);

      // ── Bar track ─────────────────────────────────────────────────────
      const barBg = this.scene.add.graphics();
      barBg.fillStyle(0x050508, 0.85);
      barBg.fillRoundedRect(HUD.BAR_X, 1, HUD.BAR_WIDTH, HUD.BAR_HEIGHT, 2);
      // Bar track inner border
      barBg.lineStyle(0.5, 0x333333, 0.6);
      barBg.strokeRoundedRect(HUD.BAR_X, 1, HUD.BAR_WIDTH, HUD.BAR_HEIGHT, 2);

      // ── Bar fill ──────────────────────────────────────────────────────
      const fill = this.scene.add.graphics();
      const currentVal = this.statsManager.get(stat);
      const fillW = (currentVal / 100) * HUD.BAR_WIDTH;
      this.drawFill(fill, HUD.BAR_X, fillW, stat);

      // ── Shimmer layer (sweeps across bar on value gain) ────────────────
      const shimmer = this.scene.add.graphics();

      // ── Value ─────────────────────────────────────────────────────────
      const value = this.scene.add.text(171 - HUD.PADDING, 5, currentVal.toString(), {
        fontSize: `${DesignSystem.FONT_SIZE.XS}px`,
        color: DesignSystem.hex(DesignSystem.getStatColor(stat)),
        fontFamily: FONT_FAMILY,
        shadow: { offsetX: 1, offsetY: 1, color: '#000', blur: 0, stroke: true, fill: true },
      }).setOrigin(1, 0.5);

      barContainer.add([iconBg, barBg, fill, shimmer, icon, label, value]);
      this.container.add(barContainer);

      this.bars.push({
        container: barContainer, fill, shimmer, label, icon, value,
        currentWidth: fillW, targetWidth: fillW, stat,
        shimmerActive: false, shimmerX: HUD.BAR_X,
      });
    });
  }

  private drawFill(g: Phaser.GameObjects.Graphics, x: number, w: number, stat: StatType): void {
    g.clear();
    if (w <= 0) return;
    const color = DesignSystem.getStatColor(stat);

    // Main fill — slightly more saturated
    g.fillStyle(color, 0.88);
    g.fillRoundedRect(x, 1, Math.max(w, 2), HUD.BAR_HEIGHT, 2);

    // Dark bottom stripe (depth / bevel)
    g.fillStyle(0x000000, 0.22);
    g.fillRect(x + 1, HUD.BAR_HEIGHT - 1, Math.max(w - 2, 1), 2);

    // Top highlight stripe
    g.fillStyle(0xffffff, 0.22);
    g.fillRect(x + 1, 1, Math.max(w - 2, 1), 2);

    // Right-edge glow cap (bright tip)
    if (w > 5) {
      g.fillStyle(0xffffff, 0.42);
      g.fillRoundedRect(x + w - 5, 1, 5, HUD.BAR_HEIGHT, 2);
    }

    // Segmented tick marks (every 25% of max)
    g.fillStyle(0x000000, 0.30);
    for (let seg = 1; seg <= 3; seg++) {
      const tx = x + Math.round((seg / 4) * HUD.BAR_WIDTH);
      if (tx < x + w - 2) {
        g.fillRect(tx, 2, 1, HUD.BAR_HEIGHT - 3);
      }
    }
  }

  private triggerShimmer(bar: StatBar): void {
    if (bar.shimmerActive) return;
    bar.shimmerActive = true;
    bar.shimmerX = HUD.BAR_X - 8;
    // Sweep takes ~350ms
    this.scene.time.delayedCall(350, () => {
      bar.shimmerActive = false;
      bar.shimmer.clear();
    });
  }

  private onStatChanged = (p: StatChangePayload | undefined) => {
    if (!p) return;
    const bar = this.bars.find(b => b.stat === p.stat);
    if (!bar) return;
    bar.targetWidth = (p.newValue / 100) * HUD.BAR_WIDTH;
    bar.value.setText(p.newValue.toString());

    const isGain = p.amount > 0;
    const flashColor = isGain ? '#88ff88' : '#ff7766';
    bar.value.setColor(flashColor);
    this.scene.tweens.add({
      targets: bar.value, scaleX: 1.45, scaleY: 1.45, duration: 120, yoyo: true,
      ease: 'Back.easeOut',
      onComplete: () => bar.value.setColor(DesignSystem.hex(DesignSystem.getStatColor(bar.stat))),
    });

    // Shimmer sweep on gains
    if (isGain) this.triggerShimmer(bar);

    if (p.amount !== 0) {
      this.showStatDelta(bar, p.amount);
      const audio = ServiceLocator.get<AudioManager>(SERVICE_KEYS.AUDIO_MANAGER);
      if (p.amount > 0) audio?.procedural?.playStatGain();
      else audio?.procedural?.playStatLoss();
    }
  };

  private onStateChanged = (state: GameState | undefined) => {
    if (state === GameState.CUTSCENE || state === GameState.DIALOGUE) {
      this.scene.tweens.add({
        targets: this.container, x: -80, alpha: 0.15,
        duration: 350, ease: 'Quad.easeIn',
      });
    } else if (state === GameState.GAME) {
      this.scene.tweens.add({
        targets: this.container, x: 0, alpha: 1,
        duration: 350, ease: 'Back.easeOut',
      });
    }
  };

  private onChapterLoaded = (payload?: { chapter: number; title?: string }) => {
    if (!payload) return;
    this.showLocationCard(payload.chapter, payload.title);
    const gm = ServiceLocator.get<GameManager>(SERVICE_KEYS.GAME_MANAGER);
    const ko = gm.language === 'ko';
    this.chapterBadge.setText(ko ? `${payload.chapter}장` : `Ch.${payload.chapter}`);
  };

  private onSettingsChanged = () => {
    this.bars.forEach(bar => {
      const color = DesignSystem.getStatColor(bar.stat);
      const hexColor = DesignSystem.hex(color);
      bar.icon.setColor(hexColor);
      bar.label.setColor(hexColor);
      bar.value.setColor(hexColor);
      this.drawFill(bar.fill, HUD.BAR_X, bar.currentWidth, bar.stat);
    });
  };

  private setupEvents(): void {
    this.eventBus.on(GameEvent.STAT_CHANGED, this.onStatChanged);
    this.eventBus.on(GameEvent.GAME_STATE_CHANGED, this.onStateChanged);
    this.eventBus.on(GameEvent.CHAPTER_CHANGED, this.onChapterLoaded);
    this.eventBus.on(GameEvent.SETTINGS_CHANGED, this.onSettingsChanged);
  }

  /**
   * Cinematic chapter location card — full-screen overlay with:
   * - Chapter number (small, gold)
   * - Location name (large, bright)
   * - Scripture quote
   * - Decorative gold dividers
   */
  private showLocationCard(chapter: number, title?: string): void {
    const gm = ServiceLocator.get<GameManager>(SERVICE_KEYS.GAME_MANAGER);
    const ko = gm.language === 'ko';
    const chapterLabel = ko ? `제 ${chapter} 장` : `Chapter ${chapter}`;
    const locationName  = title ?? chapterLabel;

    const cx = 240;
    const cardY = 46;

    const card = this.scene.add.container(cx, cardY - 25)
      .setDepth(160).setScrollFactor(0).setAlpha(0);

    const cardW = 220, cardH = 44;
    const bg = this.scene.add.graphics();

    // Card background — darker, wider
    bg.fillStyle(0x080612, 0.93);
    bg.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 7);
    // Gold border — double line
    bg.lineStyle(1.2, COLORS.UI.GOLD, 0.75);
    bg.strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 7);
    bg.lineStyle(0.5, COLORS.UI.GOLD, 0.22);
    bg.strokeRoundedRect(-cardW / 2 + 2, -cardH / 2 + 2, cardW - 4, cardH - 4, 6);
    // Inner top highlight
    bg.fillStyle(0xffffff, 0.04);
    bg.fillRoundedRect(-cardW / 2 + 1, -cardH / 2 + 1, cardW - 2, 10, 5);

    // Decorative gold divider lines with ornament dots
    bg.lineStyle(0.6, COLORS.UI.GOLD, 0.45);
    bg.lineBetween(-70, 1, 70, 1);
    bg.fillStyle(COLORS.UI.GOLD, 0.6);
    bg.fillCircle(-72, 1, 1.5);
    bg.fillCircle(72, 1, 1.5);
    bg.fillCircle(0, 1, 1);

    const chText = this.scene.add.text(0, -11, chapterLabel, {
      fontSize: `${DesignSystem.FONT_SIZE.XS}px`,
      color: '#d4a853', fontFamily: FONT_FAMILY,
      letterSpacing: 2,
    }).setOrigin(0.5).setAlpha(0.9);

    const locText = this.scene.add.text(0, 8, locationName, {
      fontSize: `${DesignSystem.FONT_SIZE.BASE}px`,
      color: '#f0e8d8', fontFamily: FONT_FAMILY,
      fontStyle: 'bold',
      shadow: { offsetX: 1, offsetY: 1, color: '#000', blur: 2, stroke: false, fill: true },
    }).setOrigin(0.5);

    card.add([bg, chText, locText]);

    // Slide in from above
    this.scene.tweens.add({
      targets: card, alpha: 1, y: cardY,
      duration: 450, ease: 'Back.easeOut',
    });

    // Hold, then slide out upward
    this.scene.time.delayedCall(2800, () => {
      this.scene.tweens.add({
        targets: card, alpha: 0, y: cardY - 18,
        duration: 450, ease: 'Quad.easeIn',
        onComplete: () => card.destroy(true),
      });
    });
  }

  private showStatDelta(bar: StatBar, amount: number): void {
    const sign = amount > 0 ? '+' : '';
    const isGain = amount > 0;
    const color = isGain ? '#88ff88' : '#ff6655';
    const delta = this.scene.add.text(
      bar.container.x + HUD.BAR_X + HUD.BAR_WIDTH + 14,
      bar.container.y,
      `${sign}${amount}`,
      {
        fontSize: `${DesignSystem.FONT_SIZE.XS}px`,
        color, fontFamily: FONT_FAMILY, fontStyle: 'bold',
        shadow: { offsetX: 1, offsetY: 1, color: '#000', blur: 0, stroke: true, fill: true },
      },
    ).setDepth(102).setScrollFactor(0);

    // Gain: float up; Loss: drop then fade
    this.scene.tweens.add({
      targets: delta,
      y: delta.y + (isGain ? -12 : 8),
      alpha: 0,
      scaleX: isGain ? 1.2 : 0.8,
      scaleY: isGain ? 1.2 : 0.8,
      duration: isGain ? 900 : 700,
      ease: isGain ? 'Sine.easeOut' : 'Quad.easeIn',
      onComplete: () => delta.destroy(),
    });
  }

  update(): void {
    const t = this.scene.time.now * 0.001;

    // ── Bar fill interpolation + shimmer sweep ──────────────────────────
    this.bars.forEach(bar => {
      if (Math.abs(bar.currentWidth - bar.targetWidth) > 0.3) {
        bar.currentWidth += (bar.targetWidth - bar.currentWidth) * 0.12;
        this.drawFill(bar.fill, HUD.BAR_X, bar.currentWidth, bar.stat);
      }
      // Shimmer: sweep a bright stripe across the bar
      if (bar.shimmerActive) {
        bar.shimmerX += 3.5;  // pixels per frame
        const sx = bar.shimmerX;
        const sw = 10;
        bar.shimmer.clear();
        if (sx < HUD.BAR_X + bar.currentWidth + sw) {
          // Clip shimmer to bar bounds
          const clipX = Math.max(sx, HUD.BAR_X);
          const clipW = Math.min(sx + sw, HUD.BAR_X + bar.currentWidth) - clipX;
          if (clipW > 0) {
            bar.shimmer.fillStyle(0xffffff, 0.40);
            bar.shimmer.fillRoundedRect(clipX, 1, clipW, HUD.BAR_HEIGHT - 1, 1);
          }
        }
      }
    });

    // ── Burden warning — elegant pulsing aura ──────────────────────────
    const burdenBar = this.bars[3];
    const burden = this.statsManager.get('burden');
    this.burdenGlowGfx.clear();
    this.panelWarningGfx.clear();

    if (burdenBar && burden >= 60) {
      const pulse = Math.sin(t * 3.5);     // ~1.75Hz pulse
      const pulse2 = Math.sin(t * 2.0);    // slower secondary

      // Subtle glow halo behind bar fill
      const baseAlpha = 0.06 + pulse * 0.03;
      this.burdenGlowGfx.fillStyle(0xff3300, baseAlpha);
      this.burdenGlowGfx.fillRoundedRect(
        burdenBar.container.x + HUD.BAR_X - 1, burdenBar.container.y,
        HUD.BAR_WIDTH + 2, HUD.BAR_HEIGHT, 2,
      );

      if (burden >= 80) {
        // CRITICAL: pulsing red border around entire HUD panel
        const borderAlpha = 0.35 + pulse * 0.25;
        this.panelWarningGfx.lineStyle(1.5, 0xff2200, borderAlpha);
        this.panelWarningGfx.strokeRoundedRect(2, 2, 178, 82, 5);
        // Inner glow fill
        this.panelWarningGfx.fillStyle(0xff0000, 0.04 + pulse * 0.03);
        this.panelWarningGfx.fillRoundedRect(2, 2, 178, 82, 5);
        // Bar fill pulse — breathes red
        burdenBar.fill.setAlpha(0.65 + pulse2 * 0.35);
        // Icon color pulse (no shake — elegant)
        const iconAlpha = 0.7 + pulse * 0.3;
        burdenBar.icon.setAlpha(iconAlpha);
        burdenBar.icon.setTint(0xff5544);
        // Reset position (no shake)
        burdenBar.container.y = HUD.PADDING + 3 * HUD.BAR_GAP;

      } else if (burden >= 70) {
        // WARNING: amber glow on bar only
        this.burdenGlowGfx.fillStyle(0xff6600, 0.06 + pulse * 0.04);
        this.burdenGlowGfx.fillRoundedRect(
          burdenBar.container.x + HUD.BAR_X - 2, burdenBar.container.y - 1,
          HUD.BAR_WIDTH + 4, HUD.BAR_HEIGHT + 2, 3,
        );
        burdenBar.fill.setAlpha(0.80 + pulse * 0.20);
        burdenBar.icon.setTint(0xff9966);
        burdenBar.icon.setAlpha(0.85 + pulse * 0.15);
        burdenBar.container.y = HUD.PADDING + 3 * HUD.BAR_GAP;

      } else {
        // NOTICE: subtle warm glow (burden 60–69)
        burdenBar.fill.setAlpha(0.85 + pulse * 0.12);
        burdenBar.icon.clearTint();
        burdenBar.icon.setAlpha(1);
        burdenBar.container.y = HUD.PADDING + 3 * HUD.BAR_GAP;
      }
    } else if (burdenBar) {
      burdenBar.fill.setAlpha(0.88);
      burdenBar.container.y = HUD.PADDING + 3 * HUD.BAR_GAP;
      burdenBar.icon.clearTint();
      burdenBar.icon.setAlpha(1);
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
