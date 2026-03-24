import { PortraitEmotion } from '../core/GameEvents';
import { PortraitConfig, EmotionFeatures, EMOTION_FEATURES, PORTRAIT_CONFIGS } from '../narrative/data/portraitData';

export class PortraitRenderer {
  private scene: Phaser.Scene;
  private cache = new Map<string, Phaser.GameObjects.RenderTexture>();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  getPortrait(
    characterId: string,
    emotion: PortraitEmotion = 'neutral',
    size = 56,
  ): Phaser.GameObjects.RenderTexture | null {
    const config = PORTRAIT_CONFIGS[characterId];
    if (!config) return null;

    const key = `${characterId}_${emotion}_${size}`;
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    const rt = this.renderPortrait(config, EMOTION_FEATURES[emotion], size);
    this.cache.set(key, rt);
    return rt;
  }

  private renderPortrait(
    config: PortraitConfig,
    emotion: EmotionFeatures,
    size: number,
  ): Phaser.GameObjects.RenderTexture {
    const rt = this.scene.add.renderTexture(0, 0, size, size).setVisible(false).setOrigin(0, 0);
    const g = this.scene.add.graphics();
    const cx = size / 2;
    const cy = size / 2;
    const headR = size * 0.32;

    g.fillStyle(0x1a1428, 1);
    g.fillRect(0, 0, size, size);

    this.drawClothing(g, config, cx, cy, headR, size);
    this.drawHead(g, config, cx, cy, headR);
    this.drawHair(g, config, cx, cy, headR);
    this.drawEyes(g, config, emotion, cx, cy, headR);
    this.drawMouth(g, config, emotion, cx, cy, headR);
    this.drawAccessory(g, config, cx, cy, headR, size);
    this.drawEmotionEffects(g, emotion, cx, cy, headR, size);

    // Draw at explicit (0, 0) so camera scroll doesn't offset the portrait content
    rt.draw(g, 0, 0);
    g.destroy();

    return rt;
  }

  private drawHead(
    g: Phaser.GameObjects.Graphics,
    config: PortraitConfig,
    cx: number, cy: number, r: number,
  ): void {
    g.fillStyle(config.skinTone, 1);

    switch (config.headShape) {
      case 'square':
        g.fillRoundedRect(cx - r, cy - r * 0.9, r * 2, r * 2, r * 0.3);
        break;
      case 'oval':
        g.fillEllipse(cx, cy, r * 1.8, r * 2.1);
        break;
      default:
        g.fillCircle(cx, cy, r);
    }

    g.fillStyle(this.lighten(config.skinTone, 0.15), 0.3);
    g.fillCircle(cx - r * 0.3, cy - r * 0.3, r * 0.4);
  }

  private drawHair(
    g: Phaser.GameObjects.Graphics,
    config: PortraitConfig,
    cx: number, cy: number, r: number,
  ): void {
    g.fillStyle(config.hairColor, 1);

    switch (config.hairStyle) {
      case 'short':
        g.fillEllipse(cx, cy - r * 0.6, r * 2.1, r * 1.3);
        g.fillStyle(this.lighten(config.hairColor, 0.1), 0.5);
        g.fillEllipse(cx - r * 0.2, cy - r * 0.7, r * 1, r * 0.6);
        break;
      case 'long':
        g.fillEllipse(cx, cy - r * 0.5, r * 2.2, r * 1.5);
        g.fillRect(cx - r * 1.1, cy - r * 0.2, r * 0.4, r * 1.6);
        g.fillRect(cx + r * 0.7, cy - r * 0.2, r * 0.4, r * 1.6);
        break;
      case 'hooded':
        g.fillEllipse(cx, cy - r * 0.3, r * 2.4, r * 2);
        g.fillRect(cx - r * 1.2, cy, r * 2.4, r * 0.8);
        g.fillStyle(this.darken(config.hairColor, 0.3), 0.6);
        g.fillEllipse(cx, cy - r * 0.1, r * 1.8, r * 1.6);
        break;
      case 'wild':
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2 - Math.PI * 0.5;
          const spx = cx + Math.cos(angle) * r * 1.2;
          const spy = cy - r * 0.3 + Math.sin(angle) * r * 1.1;
          g.fillCircle(spx, spy, r * 0.4);
        }
        break;
      case 'bald':
        g.fillStyle(config.skinTone, 0.3);
        g.fillEllipse(cx, cy - r * 0.8, r * 1.2, r * 0.5);
        break;
    }
  }

  private drawEyes(
    g: Phaser.GameObjects.Graphics,
    config: PortraitConfig,
    emotion: EmotionFeatures,
    cx: number, cy: number, r: number,
  ): void {
    const eyeSpacing = r * 0.45;
    const eyeY = cy - r * 0.1;
    const eyeR = r * 0.15 * emotion.eyeScale;

    [-1, 1].forEach(side => {
      const ex = cx + side * eyeSpacing;

      g.fillStyle(0xffffff, 1);
      g.fillEllipse(ex, eyeY, eyeR * 2.2, eyeR * 2);

      g.fillStyle(config.eyeColor, 1);
      g.fillCircle(ex, eyeY, eyeR * 0.8);

      g.fillStyle(0x111111, 1);
      g.fillCircle(ex, eyeY, eyeR * 0.4);

      g.fillStyle(0xffffff, 0.8);
      g.fillCircle(ex - eyeR * 0.2, eyeY - eyeR * 0.3, eyeR * 0.25);

      if (emotion.eyebrowAngle !== 0) {
        g.lineStyle(1.5, this.darken(config.hairColor, 0.2), 0.9);
        const browY = eyeY - eyeR * 1.8;
        const browLen = eyeR * 1.5;
        const angleOff = emotion.eyebrowAngle * side;
        g.lineBetween(
          ex - browLen, browY + angleOff * browLen,
          ex + browLen, browY - angleOff * browLen,
        );
      }
    });
  }

  private drawMouth(
    g: Phaser.GameObjects.Graphics,
    _config: PortraitConfig,
    emotion: EmotionFeatures,
    cx: number, cy: number, r: number,
  ): void {
    const mouthY = cy + r * 0.45;
    const mouthW = r * 0.5;

    if (emotion.mouthOpen) {
      g.fillStyle(0x442222, 1);
      g.fillEllipse(cx, mouthY, mouthW, mouthW * 0.6);
      g.fillStyle(0x882222, 0.5);
      g.fillEllipse(cx, mouthY + mouthW * 0.1, mouthW * 0.5, mouthW * 0.3);
    } else {
      g.lineStyle(1.5, 0x663333, 0.9);
      if (emotion.mouthCurve !== 0) {
        const startX = cx - mouthW;
        const endX = cx + mouthW;
        const cpY = mouthY + emotion.mouthCurve * r * 0.3;
        g.beginPath();
        g.moveTo(startX, mouthY);
        g.lineTo(cx, cpY);
        g.lineTo(endX, mouthY);
        g.strokePath();
      } else {
        g.lineBetween(cx - mouthW, mouthY, cx + mouthW, mouthY);
      }
    }
  }

  private drawClothing(
    g: Phaser.GameObjects.Graphics,
    config: PortraitConfig,
    cx: number, cy: number, r: number, size: number,
  ): void {
    g.fillStyle(config.clothingColor, 1);
    g.fillRect(cx - r * 1.2, cy + r * 0.7, r * 2.4, size - cy - r * 0.7);

    g.fillStyle(config.clothingAccent, 0.6);
    g.fillRect(cx - r * 0.15, cy + r * 0.7, r * 0.3, size - cy - r * 0.7);

    g.lineStyle(1, config.clothingAccent, 0.4);
    g.lineBetween(cx - r * 1.2, cy + r * 0.7, cx + r * 1.2, cy + r * 0.7);
  }

  private drawAccessory(
    g: Phaser.GameObjects.Graphics,
    config: PortraitConfig,
    cx: number, cy: number, r: number, _size: number,
  ): void {
    if (!config.accessory || !config.accessoryColor) return;

    switch (config.accessory) {
      case 'scroll':
        g.fillStyle(config.accessoryColor, 0.8);
        g.fillRoundedRect(cx + r * 0.8, cy + r * 0.3, r * 0.5, r * 0.7, 2);
        g.lineStyle(0.5, 0x8b7355, 0.6);
        g.strokeRoundedRect(cx + r * 0.8, cy + r * 0.3, r * 0.5, r * 0.7, 2);
        break;
      case 'staff':
        g.lineStyle(2, config.accessoryColor, 0.9);
        g.lineBetween(cx + r * 1.3, cy - r, cx + r * 1.3, cy + r * 1.5);
        g.fillStyle(0xd4a853, 0.7);
        g.fillCircle(cx + r * 1.3, cy - r, r * 0.15);
        break;
      case 'halo':
        g.lineStyle(1.5, config.accessoryColor, 0.6);
        g.strokeEllipse(cx, cy - r * 1.15, r * 1.2, r * 0.3);
        g.fillStyle(config.accessoryColor, 0.15);
        g.fillEllipse(cx, cy - r * 1.15, r * 1.2, r * 0.3);
        break;
      case 'hat':
        g.fillStyle(config.accessoryColor, 0.9);
        g.fillEllipse(cx, cy - r * 0.8, r * 2.2, r * 0.6);
        g.fillRoundedRect(cx - r * 0.7, cy - r * 1.5, r * 1.4, r * 0.9, 3);
        break;
      case 'chains':
        g.lineStyle(1, config.accessoryColor, 0.5);
        for (let i = 0; i < 3; i++) {
          const chainY = cy + r * 0.5 + i * r * 0.25;
          g.strokeCircle(cx - r * 0.6 + i * r * 0.3, chainY, r * 0.1);
        }
        break;
    }
  }

  private drawEmotionEffects(
    g: Phaser.GameObjects.Graphics,
    emotion: EmotionFeatures,
    cx: number, cy: number, r: number, size: number,
  ): void {
    if (emotion.blush) {
      g.fillStyle(0xff6688, 0.2);
      g.fillCircle(cx - r * 0.5, cy + r * 0.2, r * 0.2);
      g.fillCircle(cx + r * 0.5, cy + r * 0.2, r * 0.2);
    }

    if (emotion.tearDrop) {
      g.fillStyle(0x6699cc, 0.7);
      g.fillEllipse(cx + r * 0.55, cy + r * 0.2, r * 0.1, r * 0.2);
    }

    if (emotion.sparkle) {
      g.fillStyle(0xffd700, 0.6);
      const sparkles = [[size * 0.1, size * 0.15], [size * 0.85, size * 0.1], [size * 0.9, size * 0.85]];
      sparkles.forEach(([sx, sy]) => {
        const sr = r * 0.12;
        g.fillRect(sx - sr, sy - 0.5, sr * 2, 1);
        g.fillRect(sx - 0.5, sy - sr, 1, sr * 2);
      });
    }

    if (emotion.sweatDrop) {
      g.fillStyle(0x88bbdd, 0.6);
      g.fillEllipse(cx + r * 0.9, cy - r * 0.5, r * 0.12, r * 0.2);
    }
  }

  private lighten(color: number, amount: number): number {
    const r = Math.min(255, ((color >> 16) & 0xff) + 255 * amount);
    const g = Math.min(255, ((color >> 8) & 0xff) + 255 * amount);
    const b = Math.min(255, (color & 0xff) + 255 * amount);
    return (Math.floor(r) << 16) | (Math.floor(g) << 8) | Math.floor(b);
  }

  private darken(color: number, amount: number): number {
    const r = Math.max(0, ((color >> 16) & 0xff) * (1 - amount));
    const g = Math.max(0, ((color >> 8) & 0xff) * (1 - amount));
    const b = Math.max(0, (color & 0xff) * (1 - amount));
    return (Math.floor(r) << 16) | (Math.floor(g) << 8) | Math.floor(b);
  }

  clearCache(): void {
    this.cache.forEach(rt => rt.destroy());
    this.cache.clear();
  }

  destroy(): void {
    this.clearCache();
  }
}
