import { PortraitEmotion } from '../core/GameEvents';
import { PortraitConfig, EmotionFeatures, EMOTION_FEATURES, PORTRAIT_CONFIGS } from '../narrative/data/portraitData';

/**
 * PortraitRenderer — 64×64 pixel-art character portraits for dialogue box.
 *
 * Quality targets:
 *  - 3-tone skin shading (highlight / base / shadow)
 *  - Detailed eyes: sclera, iris, pupil, lash line
 *  - Pixel-precise emotion expressions per character
 *  - Character-specific hair, clothing collar, and accessories
 *  - Subtle background vignette matching character role
 */
export class PortraitRenderer {
  private scene: Phaser.Scene;
  private cache = new Map<string, Phaser.GameObjects.RenderTexture>();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  getPortrait(
    characterId: string,
    emotion: PortraitEmotion = 'neutral',
    size = 64,
  ): Phaser.GameObjects.RenderTexture | null {
    const config = PORTRAIT_CONFIGS[characterId];
    if (!config) return null;

    const key = `${characterId}_${emotion}_${size}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

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
    // Head center: upper 55% of frame so clothing shows at bottom
    const cy = Math.floor(size * 0.38);
    const headR = Math.floor(size * 0.26);

    // Background vignette (character-specific tone)
    this.drawBackground(g, config, size);

    // Render layers: clothing → head → hair/accessories → face features → emotion
    this.drawClothing(g, config, cx, cy, headR, size);
    this.drawHead(g, config, cx, cy, headR);
    this.drawHair(g, config, cx, cy, headR);
    this.drawEyes(g, config, emotion, cx, cy, headR);
    this.drawNose(g, config, cx, cy, headR);
    this.drawMouth(g, config, emotion, cx, cy, headR);
    this.drawAccessory(g, config, cx, cy, headR, size);
    this.drawEmotionEffects(g, emotion, cx, cy, headR, size);

    rt.draw(g, 0, 0);
    g.destroy();
    return rt;
  }

  // ── Background ────────────────────────────────────────────────────────────

  private drawBackground(
    g: Phaser.GameObjects.Graphics,
    config: PortraitConfig,
    size: number,
  ): void {
    // Base dark
    g.fillStyle(0x0f0d1c, 1);
    g.fillRect(0, 0, size, size);

    // Subtle character-role vignette
    const vigColor: Record<string, number> = {
      christian:      0x1a1428,
      evangelist:     0x121e12,
      interpreter:    0x14102a,
      faithful:       0x10182a,
      obstinate:      0x1e0a08,
      pliable:        0x101820,
      help:           0x10201a,
      goodwill:       0x1e1c10,
      worldly_wiseman: 0x18101e,
      shining_ones:   0x1e1c10,
    };
    const vc = vigColor[config.id] ?? 0x141428;
    g.fillStyle(vc, 1);
    g.fillRect(2, 2, size - 4, size - 4);

    // Soft center glow (slightly lighter)
    const mid = size / 2;
    g.fillStyle(this.lighten(vc, 0.06), 0.4);
    g.fillRect(mid - 12, 4, 24, size - 8);
    g.fillRect(4, mid - 10, size - 8, 20);
  }

  // ── Head shape ────────────────────────────────────────────────────────────

  private drawHead(
    g: Phaser.GameObjects.Graphics,
    config: PortraitConfig,
    cx: number, cy: number, r: number,
  ): void {
    const skin  = config.skinTone;
    const skinHi  = this.lighten(skin, 0.13);
    const skinSh  = this.darken(skin, 0.78);

    // Chin shadow drop
    g.fillStyle(this.darken(skin, 0.5), 0.25);
    g.fillEllipse(cx, cy + r * 0.9, r * 1.8, r * 0.55);

    // Head base shape
    g.fillStyle(skin, 1);
    switch (config.headShape) {
      case 'square':
        g.fillRoundedRect(cx - r, cy - r * 0.9, r * 2, r * 1.95, r * 0.18);
        break;
      case 'oval':
        g.fillEllipse(cx, cy - r * 0.05, r * 1.65, r * 2.05);
        break;
      default:  // round
        g.fillRoundedRect(cx - r * 0.95, cy - r * 0.88, r * 1.9, r * 1.95, r * 0.48);
    }

    // 3-tone skin shading
    // Highlight: upper-left quadrant
    g.fillStyle(skinHi, 0.32);
    g.fillEllipse(cx - r * 0.22, cy - r * 0.52, r * 0.9, r * 0.55);
    // Shadow: lower-right
    g.fillStyle(skinSh, 0.22);
    g.fillEllipse(cx + r * 0.3, cy + r * 0.35, r * 1.0, r * 0.7);
    // Temple shadow (left side — light source from upper-left)
    g.fillStyle(skinSh, 0.15);
    g.fillRect(Math.floor(cx + r * 0.65), Math.floor(cy - r * 0.55), Math.floor(r * 0.35), Math.floor(r * 1.2));
  }

  // ── Hair ──────────────────────────────────────────────────────────────────

  private drawHair(
    g: Phaser.GameObjects.Graphics,
    config: PortraitConfig,
    cx: number, cy: number, r: number,
  ): void {
    const hair  = config.hairColor;
    const hairHi = this.lighten(hair, 0.12);
    const hairSh = this.darken(hair, 0.7);

    switch (config.hairStyle) {
      case 'bald': {
        // Just a subtle scalp sheen
        g.fillStyle(this.lighten(config.skinTone, 0.18), 0.22);
        g.fillEllipse(cx - r * 0.2, cy - r * 0.72, r * 0.8, r * 0.4);
        // Side hair wisps
        g.fillStyle(hair, 0.7);
        g.fillRect(Math.floor(cx - r * 1.0), Math.floor(cy - r * 0.4), Math.floor(r * 0.4), Math.floor(r * 0.5));
        g.fillRect(Math.floor(cx + r * 0.6), Math.floor(cy - r * 0.4), Math.floor(r * 0.4), Math.floor(r * 0.5));
        break;
      }
      case 'hooded': {
        // Outer hood — large fabric shape
        g.fillStyle(hair, 1);
        g.fillEllipse(cx, cy - r * 0.3, r * 2.5, r * 2.1);
        g.fillRect(Math.floor(cx - r * 1.25), Math.floor(cy + r * 0.1), Math.floor(r * 2.5), Math.floor(r * 0.9));
        // Hood inner shadow creates face opening
        g.fillStyle(this.darken(hair, 0.4), 0.72);
        g.fillEllipse(cx, cy - r * 0.1, r * 1.8, r * 1.7);
        // Fabric highlight on top of hood
        g.fillStyle(hairHi, 0.25);
        g.fillEllipse(cx - r * 0.2, cy - r * 0.7, r * 0.9, r * 0.4);
        // Face glow inside hood
        g.fillStyle(this.lighten(config.skinTone, 0.04), 0.12);
        g.fillEllipse(cx, cy, r * 1.3, r * 1.25);
        break;
      }
      case 'long': {
        // Base hair mass
        g.fillStyle(hair, 1);
        g.fillEllipse(cx, cy - r * 0.55, r * 2.25, r * 1.5);
        // Side panels (hanging down)
        g.fillRect(Math.floor(cx - r * 1.15), Math.floor(cy - r * 0.25), Math.floor(r * 0.45), Math.floor(r * 1.65));
        g.fillRect(Math.floor(cx + r * 0.7), Math.floor(cy - r * 0.25), Math.floor(r * 0.45), Math.floor(r * 1.65));
        // Hair highlight strip on top
        g.fillStyle(hairHi, 0.4);
        g.fillEllipse(cx - r * 0.25, cy - r * 0.72, r * 0.9, r * 0.45);
        // Shadow at roots/sides
        g.fillStyle(hairSh, 0.3);
        g.fillRect(Math.floor(cx - r * 1.1), Math.floor(cy - r * 0.2), Math.floor(r * 0.3), Math.floor(r * 1.6));
        g.fillRect(Math.floor(cx + r * 0.8), Math.floor(cy - r * 0.2), Math.floor(r * 0.3), Math.floor(r * 1.6));
        break;
      }
      case 'wild': {
        // Spiky irregular mass
        g.fillStyle(hair, 1);
        g.fillEllipse(cx, cy - r * 0.55, r * 2.2, r * 1.4);
        // Spike protrusions
        for (let i = 0; i < 5; i++) {
          const angle = -Math.PI * 0.85 + (i / 4) * Math.PI * 0.7;
          const bx = cx + Math.cos(angle) * r * 1.0;
          const by = cy - r * 0.4 + Math.sin(angle) * r * 0.9;
          g.fillRect(Math.floor(bx), Math.floor(by - r * 0.3), Math.floor(r * 0.35), Math.floor(r * 0.4));
        }
        g.fillStyle(hairHi, 0.35);
        g.fillEllipse(cx - r * 0.3, cy - r * 0.7, r * 0.7, r * 0.35);
        break;
      }
      default: // short
        g.fillStyle(hair, 1);
        g.fillEllipse(cx, cy - r * 0.62, r * 2.1, r * 1.35);
        // Highlight on crown
        g.fillStyle(hairHi, 0.42);
        g.fillEllipse(cx - r * 0.18, cy - r * 0.75, r * 0.85, r * 0.42);
        // Shadow at sides/nape
        g.fillStyle(hairSh, 0.28);
        g.fillRect(Math.floor(cx + r * 0.5), Math.floor(cy - r * 0.75), Math.floor(r * 0.55), Math.floor(r * 0.6));
        g.fillRect(Math.floor(cx - r * 1.05), Math.floor(cy - r * 0.75), Math.floor(r * 0.55), Math.floor(r * 0.6));
    }
  }

  // ── Eyes ──────────────────────────────────────────────────────────────────

  private drawEyes(
    g: Phaser.GameObjects.Graphics,
    config: PortraitConfig,
    emotion: EmotionFeatures,
    cx: number, cy: number, r: number,
  ): void {
    const eyeSpacing = r * 0.44;
    const eyeBaseY  = cy - r * 0.18;
    const eyeW = Math.floor(r * 0.28 * emotion.eyeScale);  // width of eye area
    const eyeH = Math.floor(r * 0.22 * emotion.eyeScale);

    [-1, 1].forEach(side => {
      const ex = Math.round(cx + side * eyeSpacing);
      const ey = Math.round(eyeBaseY + (emotion.eyebrowAngle * side > 0 ? r * 0.02 : 0));

      // Eyelid crease / socket shadow
      g.fillStyle(this.darken(config.skinTone, 0.68), 0.32);
      g.fillEllipse(ex, ey - eyeH * 0.5, eyeW * 2.6, eyeH * 1.6);

      // Sclera (warm off-white, taller on fearful/surprised)
      const scleraH = emotion.eyeScale > 1.1 ? eyeH * 1.8 : eyeH * 1.5;
      g.fillStyle(0xf5f0e8, 1);
      g.fillEllipse(ex, ey, eyeW * 2.0, scleraH);

      // Iris (colored disc)
      g.fillStyle(config.eyeColor, 1);
      g.fillCircle(ex, ey, eyeW * 0.82);

      // Pupil
      g.fillStyle(0x0d0d0d, 1);
      g.fillCircle(ex, ey, eyeW * 0.44);

      // Specular highlight (upper-left)
      g.fillStyle(0xffffff, 0.92);
      g.fillCircle(ex - eyeW * 0.24, ey - eyeW * 0.28, eyeW * 0.24);
      // Secondary tiny highlight
      g.fillStyle(0xffffff, 0.45);
      g.fillCircle(ex + eyeW * 0.18, ey + eyeW * 0.16, eyeW * 0.12);

      // Upper lash line (1px dark arc)
      g.fillStyle(this.darken(config.hairColor ?? 0x333333, 0.1), 0.9);
      const lashY = ey - scleraH * 0.48;
      g.fillRect(Math.floor(ex - eyeW * 0.9), Math.floor(lashY), Math.floor(eyeW * 1.8), 1);
      // Outer lash flick
      g.fillRect(Math.floor(ex + side * eyeW * 0.7), Math.floor(lashY - 1), Math.ceil(eyeW * 0.4), 1);

      // Eyebrow
      const browDist = eyeH * 2.2;
      const browY = Math.round(ey - browDist);
      const browHLen = Math.floor(eyeW * 1.35);
      // Brow angle: emotion.eyebrowAngle * side gives per-brow tilt
      const tiltPx = Math.round(emotion.eyebrowAngle * side * browHLen * 0.7);
      const browThick = Math.floor(r * 0.065) + 1;
      g.fillStyle(this.darken(config.hairColor ?? 0x333333, 0.08), 0.92);
      // Draw brow as tilted rectangle via two rows
      for (let row = 0; row < browThick; row++) {
        const t = row / browThick;
        const bx  = Math.floor(ex - browHLen + t * tiltPx * 0.4);
        const brow = Math.floor(browY + row + t * tiltPx);
        g.fillRect(bx, brow, browHLen * 2, 1);
      }
    });
  }

  // ── Nose ──────────────────────────────────────────────────────────────────

  private drawNose(
    g: Phaser.GameObjects.Graphics,
    config: PortraitConfig,
    cx: number, cy: number, r: number,
  ): void {
    const noseY = Math.floor(cy + r * 0.12);
    const skinSh = this.darken(config.skinTone, 0.76);
    // Bridge shadow (central vertical)
    g.fillStyle(skinSh, 0.55);
    g.fillRect(cx - 1, noseY, 2, Math.floor(r * 0.28));
    // Nostril dots
    g.fillStyle(skinSh, 0.65);
    g.fillCircle(cx - r * 0.17, noseY + r * 0.25, r * 0.07);
    g.fillCircle(cx + r * 0.17, noseY + r * 0.25, r * 0.07);
    // Nose tip highlight
    g.fillStyle(this.lighten(config.skinTone, 0.1), 0.3);
    g.fillCircle(cx, noseY + r * 0.2, r * 0.06);
  }

  // ── Mouth ─────────────────────────────────────────────────────────────────

  private drawMouth(
    g: Phaser.GameObjects.Graphics,
    config: PortraitConfig,
    emotion: EmotionFeatures,
    cx: number, cy: number, r: number,
  ): void {
    const mouthY = Math.floor(cy + r * 0.52);
    const mouthW = r * 0.52;
    const lipColor = this.darken(config.skinTone, 0.6);
    const lipHi = this.lighten(config.skinTone, 0.05);
    const lipSh = this.darken(config.skinTone, 0.72);

    if (emotion.mouthOpen) {
      // Open mouth: dark interior + lip outlines
      g.fillStyle(0x2a1010, 1);
      g.fillEllipse(cx, mouthY, mouthW, mouthW * 0.55);
      // Upper lip
      g.fillStyle(lipColor, 0.9);
      g.fillRect(Math.floor(cx - mouthW * 0.48), mouthY - 2, Math.floor(mouthW * 0.96), 3);
      // Lower lip highlight
      g.fillStyle(lipHi, 0.35);
      g.fillEllipse(cx, mouthY + mouthW * 0.18, mouthW * 0.5, mouthW * 0.22);
      // Teeth hint
      g.fillStyle(0xeeeedd, 0.65);
      g.fillRect(Math.floor(cx - mouthW * 0.28), mouthY - 1, Math.floor(mouthW * 0.56), Math.floor(mouthW * 0.22));
    } else {
      // Closed mouth
      // Upper lip bow
      g.fillStyle(lipColor, 0.85);
      g.fillRect(Math.floor(cx - mouthW * 0.5), mouthY - 1, Math.floor(mouthW), 2);
      // Lip center line
      g.fillStyle(lipSh, 0.7);
      g.fillRect(Math.floor(cx - mouthW * 0.48), mouthY, Math.floor(mouthW * 0.96), 1);
      // Corner details based on emotion curve
      if (emotion.mouthCurve > 0.15) {
        // Smile: corners curve up + rosy dimples
        g.fillStyle(lipColor, 0.7);
        g.fillRect(Math.floor(cx - mouthW * 0.5), mouthY - 2, 2, 2);
        g.fillRect(Math.floor(cx + mouthW * 0.48) - 1, mouthY - 2, 2, 2);
        // Dimple blush
        g.fillStyle(0xff6688, 0.18);
        g.fillCircle(cx - r * 0.55, cy + r * 0.28, r * 0.18);
        g.fillCircle(cx + r * 0.55, cy + r * 0.28, r * 0.18);
      } else if (emotion.mouthCurve < -0.15) {
        // Frown: corners curve down
        g.fillStyle(lipSh, 0.7);
        g.fillRect(Math.floor(cx - mouthW * 0.5), mouthY + 1, 2, 2);
        g.fillRect(Math.floor(cx + mouthW * 0.48) - 1, mouthY + 1, 2, 2);
      }
      // Lower lip fill
      g.fillStyle(lipHi, 0.25);
      g.fillRect(Math.floor(cx - mouthW * 0.3), mouthY + 1, Math.floor(mouthW * 0.6), 2);
    }
  }

  // ── Clothing ──────────────────────────────────────────────────────────────

  private drawClothing(
    g: Phaser.GameObjects.Graphics,
    config: PortraitConfig,
    cx: number, cy: number, r: number, size: number,
  ): void {
    const clothY = Math.floor(cy + r * 0.85);
    const clothH = size - clothY + 1;
    const cColor = config.clothingColor;
    const cDark  = this.darken(cColor, 0.62);
    const cHi    = this.lighten(cColor, 0.08);

    // Main clothing block (trapezoidal — wider at bottom)
    g.fillStyle(cColor, 1);
    g.fillRect(Math.floor(cx - r * 1.3), clothY, Math.floor(r * 2.6), clothH);

    // Shoulder curve shadow (3D illusion)
    g.fillStyle(cDark, 0.5);
    g.fillEllipse(cx, clothY + r * 0.04, r * 2.6, r * 0.5);

    // Center highlight (chest)
    g.fillStyle(cHi, 0.35);
    g.fillRect(Math.floor(cx - r * 0.18), clothY + 2, Math.floor(r * 0.36), clothH - 4);

    // Fold lines
    g.fillStyle(cDark, 0.35);
    g.fillRect(Math.floor(cx - r * 0.6), clothY + 2, 1, clothH - 4);
    g.fillRect(Math.floor(cx + r * 0.55), clothY + 3, 1, clothH - 5);

    // Collar / accent strip
    g.fillStyle(config.clothingAccent, 0.65);
    g.fillRect(Math.floor(cx - r * 0.15), clothY, Math.floor(r * 0.3), clothH);
    // Collar neckline
    g.fillStyle(config.clothingAccent, 0.5);
    g.fillRect(Math.floor(cx - r * 1.25), clothY, Math.floor(r * 2.5), 2);

    // Character-specific collar details
    switch (config.id) {
      case 'evangelist': {
        // Wide pale gray robe collar, V-neck
        g.fillStyle(0xd0c8c0, 0.9);
        g.fillRect(Math.floor(cx - r * 0.9), clothY, Math.floor(r * 1.8), 4);
        g.fillStyle(this.darken(0xd0c8c0, 0.7), 0.5);
        g.fillRect(Math.floor(cx - r * 0.4), clothY, Math.floor(r * 0.8), clothH);
        break;
      }
      case 'interpreter': {
        // Purple robe with gold band
        g.fillStyle(config.clothingAccent, 0.8);
        g.fillRect(Math.floor(cx - r * 1.25), clothY + 2, Math.floor(r * 2.5), 3);
        break;
      }
      case 'christian': {
        // Brown cloak with cross pendant hint
        g.fillStyle(0xffd080, 0.7);
        g.fillRect(cx - 1, clothY + 4, 1, 3);   // cross vertical
        g.fillRect(cx - 2, clothY + 5, 3, 1);   // cross horizontal
        break;
      }
      case 'faithful': {
        // Tan cloak with purple trim
        g.fillStyle(0x8a6aaa, 0.55);
        g.fillRect(Math.floor(cx - r * 1.28), clothY, 2, clothH);
        g.fillRect(Math.floor(cx + r * 1.25) - 1, clothY, 2, clothH);
        break;
      }
      case 'obstinate': {
        // Rust-red heavy garment, thick collar
        g.fillStyle(this.darken(cColor, 0.5), 0.7);
        g.fillRect(Math.floor(cx - r * 1.25), clothY, Math.floor(r * 2.5), 5);
        break;
      }
    }
  }

  // ── Accessory ─────────────────────────────────────────────────────────────

  private drawAccessory(
    g: Phaser.GameObjects.Graphics,
    config: PortraitConfig,
    cx: number, cy: number, r: number, _size: number,
  ): void {
    if (!config.accessory || !config.accessoryColor) return;
    const acc = config.accessoryColor;

    switch (config.accessory) {
      case 'hat': {
        // Hat brim + crown above head
        const brimY = Math.floor(cy - r * 0.95);
        g.fillStyle(this.darken(acc, 0.65), 1);
        g.fillEllipse(cx, brimY + r * 0.18, r * 2.4, r * 0.55);
        g.fillStyle(acc, 1);
        g.fillRoundedRect(cx - r * 0.72, cy - r * 1.65, r * 1.44, r * 0.82, 3);
        g.fillStyle(this.lighten(acc, 0.1), 0.25);
        g.fillRect(Math.floor(cx - r * 0.65), Math.floor(cy - r * 1.6), Math.floor(r * 0.55), Math.floor(r * 0.7));
        g.fillStyle(this.darken(acc, 0.55), 0.7);
        g.fillRect(Math.floor(cx - r * 0.72), Math.floor(cy - r * 1.0), Math.floor(r * 1.44), 2);
        break;
      }
      case 'staff': {
        g.fillStyle(acc, 0.88);
        g.fillRect(Math.floor(cx + r * 1.3), Math.floor(cy - r * 1.0), 3, Math.floor(r * 2.6));
        g.fillStyle(0xd4a853, 0.9);
        g.fillCircle(cx + r * 1.3 + 1, cy - r, r * 0.14);
        break;
      }
      case 'scroll': {
        g.fillStyle(acc, 0.85);
        g.fillRoundedRect(Math.floor(cx + r * 0.85), Math.floor(cy + r * 0.35), Math.floor(r * 0.55), Math.floor(r * 0.75), 2);
        g.fillStyle(this.darken(acc, 0.7), 0.6);
        g.strokeRoundedRect(Math.floor(cx + r * 0.85), Math.floor(cy + r * 0.35), Math.floor(r * 0.55), Math.floor(r * 0.75), 2);
        break;
      }
      case 'halo': {
        g.fillStyle(acc, 0.22);
        g.fillEllipse(cx, cy - r * 1.15, r * 1.25, r * 0.32);
        g.lineStyle(1.5, acc, 0.65);
        g.strokeEllipse(cx, cy - r * 1.15, r * 1.25, r * 0.32);
        // Inner glow
        g.fillStyle(acc, 0.1);
        g.fillEllipse(cx, cy - r * 1.15, r * 1.0, r * 0.22);
        break;
      }
      case 'chains': {
        g.fillStyle(acc, 0.55);
        for (let i = 0; i < 4; i++) {
          const chainY = cy + r * 0.55 + i * r * 0.22;
          g.fillCircle(cx - r * 0.55 + i * r * 0.3, chainY, r * 0.1);
        }
        g.lineStyle(0.8, acc, 0.4);
        g.lineBetween(cx - r * 0.55, cy + r * 0.55, cx + r * 0.35, cy + r * 0.55 + r * 0.66);
        break;
      }
    }

    // Christian's pilgrim hat (drawn here since it's not a standard 'hat' accessory type)
    if (config.id === 'christian') {
      const brimY = Math.floor(cy - r * 0.92);
      const hatColor = 0x5a3d1e;
      const hatDark  = this.darken(hatColor, 0.62);
      // Wide brim
      g.fillStyle(hatDark, 1);
      g.fillEllipse(cx, brimY + r * 0.15, r * 2.5, r * 0.6);
      // Crown
      g.fillStyle(hatColor, 1);
      g.fillRoundedRect(cx - r * 0.68, cy - r * 1.72, r * 1.36, r * 0.92, 3);
      g.fillStyle(this.lighten(hatColor, 0.09), 0.28);
      g.fillRect(Math.floor(cx - r * 0.62), Math.floor(cy - r * 1.68), Math.floor(r * 0.5), Math.floor(r * 0.82));
      // White hatband
      g.fillStyle(0xe8e0d8, 0.9);
      g.fillRect(Math.floor(cx - r * 0.68), Math.floor(cy - r * 0.85), Math.floor(r * 1.36), Math.floor(r * 0.12) + 1);
      // Dark underside of brim
      g.fillStyle(hatDark, 0.55);
      g.fillEllipse(cx, brimY + r * 0.22, r * 1.6, r * 0.35);
    }

    // Evangelist's beard (distinctive — rendered in accessory pass)
    if (config.id === 'evangelist') {
      const beardY = Math.floor(cy + r * 0.72);
      g.fillStyle(0xe8e0d8, 1);
      g.fillRect(Math.floor(cx - r * 0.45), beardY, Math.floor(r * 0.9), Math.floor(r * 0.75));
      g.fillStyle(0xd0c8c0, 0.9);
      g.fillRect(Math.floor(cx - r * 0.55), beardY + Math.floor(r * 0.18), Math.floor(r * 1.1), Math.floor(r * 0.5));
      g.fillStyle(0xe8e0d8, 1);
      g.fillRect(Math.floor(cx - r * 0.22), beardY + Math.floor(r * 0.62), Math.floor(r * 0.44), Math.floor(r * 0.42));
      // Beard highlight
      g.fillStyle(0xffffff, 0.25);
      g.fillRect(Math.floor(cx - r * 0.35), beardY + 2, Math.floor(r * 0.25), Math.floor(r * 0.55));
    }
  }

  // ── Emotion effects ───────────────────────────────────────────────────────

  private drawEmotionEffects(
    g: Phaser.GameObjects.Graphics,
    emotion: EmotionFeatures,
    cx: number, cy: number, r: number, size: number,
  ): void {
    if (emotion.blush) {
      g.fillStyle(0xff6688, 0.43);
      g.fillCircle(cx - r * 0.52, cy + r * 0.22, r * 0.22);
      g.fillCircle(cx + r * 0.52, cy + r * 0.22, r * 0.22);
    }

    if (emotion.tearDrop) {
      g.fillStyle(0x6699cc, 0.97);
      g.fillEllipse(cx + r * 0.52, cy + r * 0.22, r * 0.1, r * 0.22);
      // Second tear for more dramatic flow
      g.fillStyle(0x6699cc, 0.65);
      g.fillEllipse(cx - r * 0.52, cy + r * 0.32, r * 0.08, r * 0.18);
    }

    if (emotion.sparkle) {
      g.fillStyle(0xffd700, 0.95);
      const sparkles: [number, number][] = [
        [size * 0.1, size * 0.14],
        [size * 0.84, size * 0.1],
        [size * 0.88, size * 0.82],
      ];
      sparkles.forEach(([sx, sy]) => {
        const sr = r * 0.12;
        g.fillRect(Math.floor(sx - sr), Math.floor(sy) - 1, Math.ceil(sr * 2), 2);
        g.fillRect(Math.floor(sx) - 1, Math.floor(sy - sr), 2, Math.ceil(sr * 2));
      });
    }

    if (emotion.sweatDrop) {
      g.fillStyle(0x88bbdd, 0.62);
      g.fillEllipse(cx + r * 0.88, cy - r * 0.48, r * 0.12, r * 0.22);
      // Drop tip
      g.fillStyle(0x88bbdd, 0.45);
      g.fillCircle(cx + r * 0.88, cy - r * 0.28, r * 0.06);
    }

    // Vignette border: dark corners inside portrait frame
    g.fillStyle(0x000000, 0.32);
    // Four corner triangles
    g.fillTriangle(0, 0, size * 0.35, 0, 0, size * 0.35);
    g.fillTriangle(size, 0, size - size * 0.35, 0, size, size * 0.35);
    g.fillTriangle(0, size, size * 0.35, size, 0, size - size * 0.35);
    g.fillTriangle(size, size, size - size * 0.35, size, size, size - size * 0.35);
  }

  // ── Color utilities ───────────────────────────────────────────────────────

  private lighten(color: number, amount: number): number {
    const r = Math.min(255, ((color >> 16) & 0xff) + Math.floor(255 * amount));
    const g = Math.min(255, ((color >> 8) & 0xff) + Math.floor(255 * amount));
    const b = Math.min(255, (color & 0xff) + Math.floor(255 * amount));
    return (r << 16) | (g << 8) | b;
  }

  private darken(color: number, amount: number): number {
    const r = Math.max(0, Math.floor(((color >> 16) & 0xff) * (1 - amount)));
    const g = Math.max(0, Math.floor(((color >> 8) & 0xff) * (1 - amount)));
    const b = Math.max(0, Math.floor((color & 0xff) * (1 - amount)));
    return (r << 16) | (g << 8) | b;
  }

  clearCache(): void {
    this.cache.forEach(rt => rt.destroy());
    this.cache.clear();
  }

  destroy(): void {
    this.clearCache();
  }
}
