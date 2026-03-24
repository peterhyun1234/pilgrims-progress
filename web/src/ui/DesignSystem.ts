import { COLORS, GAME_WIDTH, GAME_HEIGHT, FONT } from '../config';
import { ServiceLocator, SERVICE_KEYS } from '../core/ServiceLocator';

export const FONT_FAMILY = FONT.KO_PRIMARY;

export class DesignSystem {
  static readonly SPACE = {
    XS: 2, SM: 4, MD: 8, LG: 16, XL: 24, XXL: 32,
  } as const;

  static readonly FONT_SIZE = {
    XS: 9,
    SM: 11,
    BASE: 13,
    LG: 16,
    XL: 20,
    XXL: 26,
    DISPLAY: 34,
  } as const;

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

  private static _lang: 'ko' | 'en' = 'ko';

  static setLanguage(lang: 'ko' | 'en'): void {
    DesignSystem._lang = lang;
  }

  static getLanguage(): 'ko' | 'en' {
    try {
      const gm = ServiceLocator.get<{ language: 'ko' | 'en' }>(SERVICE_KEYS.GAME_MANAGER);
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
        blur: 0, stroke: true, fill: true,
      },
      ...extra,
    };
  }

  static goldTextStyle(fontSize: number): Phaser.Types.GameObjects.Text.TextStyle {
    return DesignSystem.textStyle(fontSize, '#d4a853');
  }

  static mutedTextStyle(fontSize: number): Phaser.Types.GameObjects.Text.TextStyle {
    return DesignSystem.textStyle(fontSize, '#8c8070');
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

    const container = scene.add.container(x, y);

    const bg = scene.add.graphics();
    const drawBg = (color: number, border: number) => {
      bg.clear();
      bg.fillStyle(color, 0.95);
      bg.fillRoundedRect(-w / 2, -h / 2, w, h, 4);
      bg.lineStyle(1.5, border, 0.7);
      bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 4);
    };
    drawBg(bgColor, borderColor);

    const displayLabel = icon ? `${icon} ${label}` : label;
    const text = scene.add.text(0, 0, displayLabel,
      DesignSystem.textStyle(fontSize, DesignSystem.hex(textColor)),
    ).setOrigin(0.5);

    container.add([bg, text]);

    const hitZone = scene.add.rectangle(0, 0, w, h, 0x000000, 0)
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
    const o = scene.add.rectangle(
      GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH + 20, GAME_HEIGHT + 20, 0x000000, 1,
    ).setDepth(9999).setScrollFactor(0);
    scene.tweens.add({ targets: o, alpha: 0, duration, onComplete: () => o.destroy() });
  }

  static fadeOut(scene: Phaser.Scene, duration = 500): Promise<void> {
    return new Promise((resolve) => {
      const o = scene.add.rectangle(
        GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH + 20, GAME_HEIGHT + 20, 0x000000, 0,
      ).setDepth(9999).setScrollFactor(0);
      scene.tweens.add({ targets: o, alpha: 1, duration, onComplete: () => resolve() });
    });
  }
}
