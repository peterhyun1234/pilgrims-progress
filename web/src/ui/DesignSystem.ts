import { COLORS, GAME_WIDTH, GAME_HEIGHT, FONT } from '../config';
import { ServiceLocator, SERVICE_KEYS } from '../core/ServiceLocator';

export const FONT_FAMILY = FONT.KO_PRIMARY;

export class DesignSystem {
  static readonly SPACE = {
    XS: 2, SM: 4, MD: 8, LG: 16, XL: 24, XXL: 32,
  } as const;

  static readonly FONT_SIZE = {
    XS: 11,
    SM: 13,
    BASE: 15,
    LG: 18,
    XL: 24,
    XXL: 30,
    DISPLAY: 38,
  } as const;

  // ── Accessibility helpers ─────────────────────────────────────────────────

  static isColorblind(): boolean {
    try {
      if (localStorage.getItem('pilgrim_colorblind') === '1') return true;
    } catch { /* private browsing */ }
    try {
      const gm = ServiceLocator.get<{ colorblindMode: boolean }>(SERVICE_KEYS.GAME_MANAGER);
      return gm.colorblindMode;
    } catch { return false; }
  }

  static isReduceMotion(): boolean {
    try {
      if (localStorage.getItem('pilgrim_reduceMotion') === '1') return true;
    } catch { /* private browsing */ }
    try {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true;
    } catch { /* not supported */ }
    try {
      const gm = ServiceLocator.get<{ reduceMotion: boolean }>(SERVICE_KEYS.GAME_MANAGER);
      return gm.reduceMotion;
    } catch { return false; }
  }

  /** Duration scaled to 0 if reduceMotion is on */
  static dur(ms: number): number {
    return DesignSystem.isReduceMotion() ? 0 : ms;
  }

  /** Returns colorblind-safe color alternatives for stat colors */
  static statColorSafe(stat: string): number {
    if (!DesignSystem.isColorblind()) return DesignSystem.STAT_COLORS[stat] ?? 0xffffff;
    const cb: Record<string, number> = {
      faith:   0xf5a623, // orange (protanopia-safe gold)
      courage: 0x0072b2, // blue (unambiguous)
      wisdom:  0xe69f00, // amber
      burden:  0x56b4e9, // sky blue (vs red = danger)
    };
    return cb[stat] ?? DesignSystem.STAT_COLORS[stat] ?? 0xffffff;
  }

  static readonly STAT_ICONS: Record<string, string> = {
    faith: '✝', courage: '⚔', wisdom: '✦', burden: '■',
  };
  static readonly STAT_COLORS: Record<string, number> = {
    faith: COLORS.STAT.FAITH, courage: COLORS.STAT.COURAGE,
    wisdom: COLORS.STAT.WISDOM, burden: COLORS.STAT.BURDEN,
  };
  static readonly STAT_LABELS_KO: Record<string, string> = {
    faith: '믿음', courage: '용기', wisdom: '지혜', burden: '짐',
  };
  static readonly STAT_LABELS_EN: Record<string, string> = {
    faith: 'Faith', courage: 'Courage', wisdom: 'Wisdom', burden: 'Burden',
  };

  static readonly ITEM_RARITY_COLORS: Record<string, number> = {
    common: 0xb0a898,
    uncommon: 0x4a90d9,
    rare: 0x9b59b6,
    legendary: 0xd4a853,
  };

  private static _lang: string = 'ko';

  static setLanguage(lang: string): void {
    DesignSystem._lang = lang;
  }

  static getLanguage(): string {
    try {
      const gm = ServiceLocator.get<{ language: string }>(SERVICE_KEYS.GAME_MANAGER);
      return gm.language;
    } catch {
      return DesignSystem._lang;
    }
  }

  static getFontFamily(): string {
    return DesignSystem.getLanguage() === 'en' ? FONT.EN_PRIMARY : FONT.KO_PRIMARY;
  }

  static getScaledFontSize(baseSize: number): number {
    if (DesignSystem.getLanguage() === 'en') {
      return Math.round(baseSize * FONT.EN_SIZE_SCALE);
    }
    return baseSize;
  }

  static hex(c: number): string {
    return '#' + c.toString(16).padStart(6, '0');
  }

  static textStyle(
    fontSize: number, color = '#e0d8c8',
    extra: Partial<Phaser.Types.GameObjects.Text.TextStyle> = {},
  ): Phaser.Types.GameObjects.Text.TextStyle {
    return {
      fontSize: `${DesignSystem.getScaledFontSize(fontSize)}px`,
      fontFamily: DesignSystem.getFontFamily(),
      color,
      shadow: {
        offsetX: 1, offsetY: 1, color: '#000000',
        blur: 2, stroke: true, fill: true,
      },
      ...extra,
    };
  }

  static goldTextStyle(fontSize: number): Phaser.Types.GameObjects.Text.TextStyle {
    return DesignSystem.textStyle(fontSize, '#d4a853');
  }

  static mutedTextStyle(fontSize: number): Phaser.Types.GameObjects.Text.TextStyle {
    return DesignSystem.textStyle(fontSize, '#b0a898');
  }

  static dangerTextStyle(fontSize: number): Phaser.Types.GameObjects.Text.TextStyle {
    return DesignSystem.textStyle(fontSize, '#cc4444');
  }

  static successTextStyle(fontSize: number): Phaser.Types.GameObjects.Text.TextStyle {
    return DesignSystem.textStyle(fontSize, '#66cc66');
  }

  static createParchmentBg(
    scene: Phaser.Scene,
    x: number, y: number, w: number, h: number, alpha = 0.95,
  ): Phaser.GameObjects.Graphics {
    const g = scene.add.graphics();
    g.fillStyle(0x1a1428, alpha);
    g.fillRoundedRect(x, y, w, h, 4);
    g.lineStyle(1.5, COLORS.UI.PANEL_BORDER, 0.6);
    g.strokeRoundedRect(x, y, w, h, 4);
    g.fillStyle(COLORS.UI.GOLD, 0.08);
    g.fillRoundedRect(x + 1, y + 1, w - 2, h - 2, 3);
    return g;
  }

  static createPanel(
    scene: Phaser.Scene,
    x: number, y: number, w: number, h: number,
  ): Phaser.GameObjects.Graphics {
    const g = scene.add.graphics();
    g.fillStyle(0x12101e, 0.97);
    g.fillRoundedRect(x, y, w, h, 8);
    g.lineStyle(1.5, COLORS.UI.PANEL_BORDER, 0.5);
    g.strokeRoundedRect(x, y, w, h, 8);
    g.lineStyle(0.5, COLORS.UI.GOLD, 0.1);
    g.strokeRoundedRect(x + 3, y + 3, w - 6, h - 6, 7);
    return g;
  }

  static createButton(
    scene: Phaser.Scene,
    x: number, y: number, w: number, h: number,
    label: string, onClick: () => void,
    options: {
      fontSize?: number; bgColor?: number; hoverColor?: number;
      textColor?: number; borderColor?: number; icon?: string;
    } = {},
  ): Phaser.GameObjects.Container {
    const {
      fontSize = DesignSystem.FONT_SIZE.BASE,
      bgColor = COLORS.UI.BUTTON_DEFAULT,
      hoverColor = COLORS.UI.BUTTON_HOVER,
      textColor = COLORS.UI.TEXT_WHITE,
      borderColor = COLORS.UI.PANEL_BORDER,
      icon,
    } = options;

    const actualH = Math.max(h, 28); // Minimum 28px touch target

    const container = scene.add.container(x, y);

    const bg = scene.add.graphics();
    const drawBg = (color: number, border: number) => {
      bg.clear();
      bg.fillStyle(color, 0.95);
      bg.fillRoundedRect(-w / 2, -actualH / 2, w, actualH, 4);
      bg.lineStyle(1.5, border, 0.7);
      bg.strokeRoundedRect(-w / 2, -actualH / 2, w, actualH, 4);
    };
    drawBg(bgColor, borderColor);

    const displayLabel = icon ? `${icon} ${label}` : label;
    const text = scene.add.text(0, 0, displayLabel,
      DesignSystem.textStyle(fontSize, DesignSystem.hex(textColor)),
    ).setOrigin(0.5);

    container.add([bg, text]);

    const hitZone = scene.add.rectangle(0, 0, w, actualH, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    hitZone.on('pointerover', () => {
      drawBg(hoverColor, COLORS.UI.GOLD);
      scene.tweens.add({ targets: container, scaleX: 1.03, scaleY: 1.03, duration: 80, ease: 'Sine.easeOut' });
    });
    hitZone.on('pointerout', () => {
      drawBg(bgColor, borderColor);
      scene.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 80, ease: 'Sine.easeOut' });
    });
    hitZone.on('pointerdown', () => {
      scene.tweens.add({
        targets: container, scaleX: 0.96, scaleY: 0.96, duration: 50,
        yoyo: true, ease: 'Sine.easeInOut', onComplete: onClick,
      });
    });

    container.add(hitZone);
    return container;
  }

  static createProgressBar(
    scene: Phaser.Scene,
    x: number, y: number, w: number, h: number,
    fillColor: number, bgColor = 0x222222, value = 1,
  ): { bg: Phaser.GameObjects.Graphics; fill: Phaser.GameObjects.Graphics; update: (v: number) => void } {
    const bg = scene.add.graphics();
    bg.fillStyle(bgColor, 0.7);
    bg.fillRoundedRect(x, y, w, h, 2);

    const fill = scene.add.graphics();
    const drawFill = (v: number) => {
      fill.clear();
      const fw = Math.max(v * w, 0);
      if (fw > 0) {
        fill.fillStyle(fillColor, 0.85);
        fill.fillRoundedRect(x, y, fw, h, 2);
        fill.fillStyle(0xffffff, 0.15);
        fill.fillRect(x + 1, y, Math.max(fw - 2, 1), Math.floor(h / 3));
      }
    };
    drawFill(value);

    return { bg, fill, update: drawFill };
  }

  static fadeIn(scene: Phaser.Scene, duration = 500): void {
    const d = DesignSystem.dur(duration);
    const o = scene.add.rectangle(
      GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH + 20, GAME_HEIGHT + 20, 0x000000, 1,
    ).setDepth(9999).setScrollFactor(0);
    if (d === 0) { o.destroy(); return; }
    scene.tweens.add({ targets: o, alpha: 0, duration: d, onComplete: () => o.destroy() });
  }

  static fadeOut(scene: Phaser.Scene, duration = 500): Promise<void> {
    const d = DesignSystem.dur(duration);
    return new Promise((resolve) => {
      const o = scene.add.rectangle(
        GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH + 20, GAME_HEIGHT + 20, 0x000000, 0,
      ).setDepth(9999).setScrollFactor(0);
      if (d === 0) { o.setAlpha(1); resolve(); return; }
      scene.tweens.add({ targets: o, alpha: 1, duration: d, onComplete: () => resolve() });
    });
  }

  // ── FX Utilities (Sanabi-level impact) ────────────────────────────────────

  /**
   * Camera shake — respects reduceMotion setting.
   * @param intensity  shake magnitude (0.005 = subtle, 0.02 = strong)
   * @param duration   ms
   */
  static screenShake(scene: Phaser.Scene, intensity = 0.005, duration = 150): void {
    if (DesignSystem.isReduceMotion()) return;
    scene.cameras.main.shake(duration, intensity);
  }

  /**
   * Full-screen color flash — great for hits, healing, or dramatic beats.
   * @param color    hex color (e.g. 0xff0000 for red)
   * @param alpha    peak opacity (0–1)
   * @param duration fade-out ms
   */
  static screenFlash(scene: Phaser.Scene, color = 0xffffff, alpha = 0.35, duration = 300): void {
    const d = DesignSystem.dur(duration);
    const flash = scene.add.rectangle(
      GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, color, alpha,
    ).setDepth(9998).setScrollFactor(0);
    if (d === 0) { flash.destroy(); return; }
    scene.tweens.add({
      targets: flash, alpha: 0, duration: d, ease: 'Sine.easeOut',
      onComplete: () => flash.destroy(),
    });
  }

  /**
   * Burst particles at (x, y) — used for stat gains, item pickups, NPC completions.
   * Particles fly outward radially and fade out.
   */
  static particleBurst(
    scene: Phaser.Scene,
    x: number, y: number,
    color = 0xd4a853,
    count = 8,
    options: { speed?: number; radius?: number; size?: number; duration?: number; depth?: number } = {},
  ): void {
    if (DesignSystem.isReduceMotion()) return;
    const { speed = 28, size = 2, duration = 500, depth = 300 } = options;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.3;
      const dist = speed * (0.6 + Math.random() * 0.8);
      const dot = scene.add.circle(x, y, size * (0.6 + Math.random() * 0.8), color, 0.9)
        .setDepth(depth).setScrollFactor(0);
      scene.tweens.add({
        targets: dot,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        scaleX: 0.3, scaleY: 0.3,
        duration: DesignSystem.dur(duration + Math.random() * 150),
        ease: 'Sine.easeOut',
        onComplete: () => dot.destroy(),
      });
    }
  }

  /**
   * Radiant ring burst — expands outward and fades; great for victory moments.
   */
  static ringBurst(
    scene: Phaser.Scene,
    x: number, y: number,
    color = 0xd4a853,
    options: { startRadius?: number; endRadius?: number; duration?: number; depth?: number } = {},
  ): void {
    if (DesignSystem.isReduceMotion()) return;
    const { startRadius = 8, endRadius = 48, duration = 600, depth = 300 } = options;
    const ring = scene.add.graphics().setDepth(depth).setScrollFactor(0);
    const state = { r: startRadius, alpha: 0.7 };
    scene.tweens.add({
      targets: state,
      r: endRadius,
      alpha: 0,
      duration: DesignSystem.dur(duration),
      ease: 'Sine.easeOut',
      onUpdate: () => {
        ring.clear();
        ring.lineStyle(2, color, state.alpha);
        ring.strokeCircle(x, y, state.r);
      },
      onComplete: () => ring.destroy(),
    });
  }

  /**
   * Ornamental divider line with a center diamond and optional end dots.
   * Returns the Graphics object (caller sets depth/alpha).
   */
  static createOrnamentalDivider(
    scene: Phaser.Scene,
    cx: number, y: number, width: number,
    options: { color?: number; alpha?: number; depth?: number } = {},
  ): Phaser.GameObjects.Graphics {
    const { color = COLORS.UI.GOLD, alpha = 0.45, depth = 10 } = options;
    const g = scene.add.graphics().setDepth(depth);
    const hw = width / 2;

    // Main line
    g.lineStyle(0.5, color, alpha);
    g.lineBetween(cx - hw, y, cx + hw, y);

    // Center diamond
    g.fillStyle(color, alpha * 1.3);
    g.fillTriangle(cx - 3, y, cx, y - 3, cx + 3, y);
    g.fillTriangle(cx - 3, y, cx, y + 3, cx + 3, y);

    // End dots
    g.fillStyle(color, alpha * 0.8);
    g.fillCircle(cx - hw, y, 1.5);
    g.fillCircle(cx + hw, y, 1.5);

    // Quarter-point accent marks
    g.lineStyle(0.5, color, alpha * 0.5);
    g.lineBetween(cx - hw * 0.5, y - 2, cx - hw * 0.5, y + 2);
    g.lineBetween(cx + hw * 0.5, y - 2, cx + hw * 0.5, y + 2);

    return g;
  }

  /**
   * Multi-layer panel with drop shadow, inner glow, and subtle grain.
   * Gives the "polished game UI" depth that flat panels lack.
   */
  static createDepthPanel(
    scene: Phaser.Scene,
    x: number, y: number, w: number, h: number,
    options: { radius?: number; bgColor?: number; borderColor?: number; depth?: number } = {},
  ): Phaser.GameObjects.Graphics {
    const {
      radius = 6,
      bgColor = 0x12101e,
      borderColor = COLORS.UI.PANEL_BORDER,
      depth = 10,
    } = options;

    const g = scene.add.graphics().setDepth(depth);

    // Drop shadow (offset down-right)
    g.fillStyle(0x000000, 0.45);
    g.fillRoundedRect(x + 3, y + 3, w, h, radius);

    // Background fill
    g.fillStyle(bgColor, 0.97);
    g.fillRoundedRect(x, y, w, h, radius);

    // Outer border
    g.lineStyle(1.5, borderColor, 0.6);
    g.strokeRoundedRect(x, y, w, h, radius);

    // Inner gold hairline
    g.lineStyle(0.5, COLORS.UI.GOLD, 0.12);
    g.strokeRoundedRect(x + 3, y + 3, w - 6, h - 6, radius - 1);

    // Top highlight strip (frosted-glass effect)
    g.fillStyle(0xffffff, 0.04);
    g.fillRoundedRect(x + 2, y + 2, w - 4, Math.min(h * 0.35, 14), radius - 1);

    // Grain noise — small repeating pixel dots for texture depth
    const grainStep = 4;
    for (let gx = x + 2; gx < x + w - 2; gx += grainStep) {
      for (let gy = y + 2; gy < y + h - 2; gy += grainStep) {
        const hash = ((gx * 31 + gy * 17) ^ (gx * gy)) & 0xff;
        if (hash < 28) {
          g.fillStyle(0xffffff, 0.015 + (hash / 0xff) * 0.015);
          g.fillPoint(gx + (hash & 3), gy + ((hash >> 2) & 3), 1);
        }
      }
    }

    return g;
  }

  /**
   * Floating "+N" or "-N" text that rises and fades — standardized for stat changes.
   * Returns the text so caller can position it.
   */
  static floatText(
    scene: Phaser.Scene,
    x: number, y: number,
    text: string,
    color: string,
    options: { fontSize?: number; duration?: number; rise?: number; depth?: number } = {},
  ): Phaser.GameObjects.Text {
    const { fontSize = DesignSystem.FONT_SIZE.SM, duration = 900, rise = 22, depth = 300 } = options;
    const t = scene.add.text(x, y, text, {
      fontSize: `${fontSize}px`,
      fontFamily: DesignSystem.getFontFamily(),
      color,
      fontStyle: 'bold',
      shadow: { offsetX: 1, offsetY: 1, color: '#000', blur: 2, stroke: true, fill: true },
    }).setOrigin(0.5).setDepth(depth).setScrollFactor(0);

    scene.tweens.add({
      targets: t,
      y: y - DesignSystem.dur(rise),
      alpha: 0,
      duration: DesignSystem.dur(duration),
      ease: 'Sine.easeOut',
      onComplete: () => t.destroy(),
    });
    return t;
  }

  /**
   * Screen-edge vignette pulse — used for high-burden, low-HP warnings.
   * Creates a pulsing colored border effect along screen edges.
   */
  static edgePulse(
    scene: Phaser.Scene,
    color = 0xff2200,
    alpha = 0.25,
    duration = 500,
  ): void {
    if (DesignSystem.isReduceMotion()) return;
    const g = scene.add.graphics().setDepth(9990).setScrollFactor(0);
    const state = { a: alpha };
    const edgeW = 8; // edge thickness
    scene.tweens.add({
      targets: state,
      a: 0,
      duration: DesignSystem.dur(duration),
      ease: 'Sine.easeOut',
      onUpdate: () => {
        g.clear();
        for (let i = 0; i < edgeW; i++) {
          const layerAlpha = state.a * (1 - i / edgeW);
          g.fillStyle(color, layerAlpha);
          // Top strip
          g.fillRect(i, i, GAME_WIDTH - i * 2, 1);
          // Bottom strip
          g.fillRect(i, GAME_HEIGHT - i - 1, GAME_WIDTH - i * 2, 1);
          // Left strip
          g.fillRect(i, i, 1, GAME_HEIGHT - i * 2);
          // Right strip
          g.fillRect(GAME_WIDTH - i - 1, i, 1, GAME_HEIGHT - i * 2);
        }
      },
      onComplete: () => g.destroy(),
    });
  }
}
