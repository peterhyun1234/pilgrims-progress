import { PortraitEmotion } from '../core/GameEvents';
import { PortraitConfig, EmotionFeatures, EMOTION_FEATURES, PORTRAIT_CONFIGS } from '../narrative/data/portraitData';

/**
 * SANABI-quality portrait renderer.
 *
 * Per-character atmosphere, layered skin shading, iris gradients,
 * emotion-driven eyebrows/mouth, personality lighting, and
 * character-specific accessories — all procedural.
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
    // Head sits in upper 58% — room for clothing and atmosphere below
    const cy = size * 0.38;
    const headR = size * 0.27;

    // 1. Atmospheric background (character-specific)
    this.drawBackground(g, config, emotion, cx, size);

    // 2. Clothing / body (drawn behind head)
    this.drawClothing(g, config, cx, cy, headR, size);

    // 3. Head with layered shading
    this.drawHead(g, config, emotion, cx, cy, headR);

    // 4. Hair
    this.drawHair(g, config, emotion, cx, cy, headR);

    // 5. Eyes (complex multi-layer)
    this.drawEyes(g, config, emotion, cx, cy, headR);

    // 6. Nose
    this.drawNose(g, config, cx, cy, headR);

    // 7. Mouth
    this.drawMouth(g, config, emotion, cx, cy, headR);

    // 8. Beard (if applicable)
    if (config.beard) {
      this.drawBeard(g, config, emotion, cx, cy, headR);
    }

    // 9. Accessory
    this.drawAccessory(g, config, cx, cy, headR, size);

    // 10. Emotion overlay effects (tears, blush, etc.)
    this.drawEmotionEffects(g, config, emotion, cx, cy, headR, size);

    // 11. Portrait vignette / atmosphere overlay
    this.drawVignette(g, config, cx, size);

    rt.draw(g, 0, 0);
    g.destroy();

    return rt;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // BACKGROUND — character-specific atmospheric gradient
  // ─────────────────────────────────────────────────────────────────────────
  private drawBackground(
    g: Phaser.GameObjects.Graphics,
    config: PortraitConfig,
    _emotion: EmotionFeatures,
    cx: number,
    size: number,
  ): void {
    // Base dark fill
    g.fillStyle(0x0d0a18, 1);
    g.fillRect(0, 0, size, size);

    // Per-personality atmospheric gradient
    const atmos = this.getAtmosphere(config);

    // Multi-layer radial glow emanating from character lighting direction
    const { lightX, lightY } = atmos;
    const layers = [
      { r: size * 0.85, a: 0.06 },
      { r: size * 0.55, a: 0.10 },
      { r: size * 0.30, a: 0.13 },
    ];
    for (const { r, a } of layers) {
      g.fillStyle(atmos.glowColor, a);
      g.fillEllipse(lightX, lightY, r * 2, r * 1.4);
    }

    // Secondary ambient from opposite side (rim light concept)
    g.fillStyle(atmos.rimColor, 0.04);
    g.fillEllipse(size - lightX, lightY + size * 0.2, size * 0.6, size * 0.5);

    // Ground / clothing area darkening
    g.fillStyle(0x000000, 0.25);
    g.fillRect(0, size * 0.72, size, size * 0.28);

    // Decorative top corner accent for 'wise' / 'noble'
    if (config.personality === 'wise' || config.personality === 'noble') {
      g.fillStyle(atmos.glowColor, 0.08);
      g.fillEllipse(cx, 0, size * 0.8, size * 0.22);
    }

    // Subtle horizontal scanline texture (pixel art feel)
    for (let y = 0; y < size; y += 3) {
      g.fillStyle(0x000000, 0.04);
      g.fillRect(0, y, size, 1);
    }
  }

  private getAtmosphere(config: PortraitConfig): {
    glowColor: number; rimColor: number; lightX: number; lightY: number;
  } {
    switch (config.personality) {
      case 'kind':
        return { glowColor: 0xd4a853, rimColor: 0xfff0cc, lightX: -4, lightY: 8 };
      case 'wise':
        return { glowColor: 0x9b59b6, rimColor: 0xccaaff, lightX: -4, lightY: 4 };
      case 'noble':
        return { glowColor: 0xffd700, rimColor: 0xffffff, lightX: 0, lightY: -4 };
      case 'stern':
        return { glowColor: 0x557799, rimColor: 0x99bbdd, lightX: -4, lightY: 6 };
      case 'aggressive':
        return { glowColor: 0x882222, rimColor: 0xff4444, lightX: 4, lightY: 10 };
      case 'sly':
        return { glowColor: 0x335544, rimColor: 0x66aaaa, lightX: 6, lightY: 8 };
      case 'timid':
        return { glowColor: 0x445566, rimColor: 0x8899aa, lightX: -6, lightY: 6 };
      default:
        return { glowColor: 0xd4a853, rimColor: 0xffeedd, lightX: -4, lightY: 6 };
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // HEAD — multi-layer skin shading with subsurface scattering feel
  // ─────────────────────────────────────────────────────────────────────────
  private drawHead(
    g: Phaser.GameObjects.Graphics,
    config: PortraitConfig,
    emotion: EmotionFeatures,
    cx: number, cy: number, r: number,
  ): void {
    const skin = config.skinTone;

    // Drop shadow / chin shadow
    g.fillStyle(0x000000, 0.22);
    g.fillEllipse(cx, cy + r * 0.92, r * 1.7, r * 0.6);

    // Main face shape
    g.fillStyle(skin, 1);
    switch (config.headShape) {
      case 'square':
        g.fillRoundedRect(cx - r, cy - r * 0.88, r * 2, r * 1.95, r * 0.2);
        break;
      case 'oval':
        g.fillEllipse(cx, cy - r * 0.03, r * 1.65, r * 2.0);
        break;
      default:  // round
        g.fillRoundedRect(cx - r * 0.92, cy - r * 0.88, r * 1.84, r * 1.9, r * 0.48);
    }

    // === Layered skin shading ===

    // Forehead broad highlight (key light — upper left)
    g.fillStyle(this.lighten(skin, 0.14), 0.32);
    g.fillEllipse(cx - r * 0.22, cy - r * 0.48, r * 1.1, r * 0.58);

    // Cheekbone highlight (right cheek catches light)
    g.fillStyle(this.lighten(skin, 0.10), 0.22);
    g.fillEllipse(cx + r * 0.28, cy + r * 0.14, r * 0.48, r * 0.32);

    // Temple shadow (left side)
    g.fillStyle(this.darken(skin, 0.18), 0.28);
    g.fillEllipse(cx - r * 0.62, cy - r * 0.18, r * 0.55, r * 0.7);

    // Jaw / lower face shadow (deepens face roundness)
    g.fillStyle(this.darken(skin, 0.16), 0.30);
    g.fillEllipse(cx, cy + r * 0.58, r * 1.3, r * 0.55);

    // Subsurface scattering hint — warm reddish at cheek center
    g.fillStyle(0xff7755, 0.05);
    g.fillEllipse(cx + r * 0.2, cy + r * 0.15, r * 0.5, r * 0.38);
    g.fillStyle(0xff7755, 0.04);
    g.fillEllipse(cx - r * 0.3, cy + r * 0.15, r * 0.4, r * 0.32);

    // Worried / angry forehead wrinkle (between brows)
    if (emotion.eyebrowAngle < -0.15 || emotion.eyebrowAngle > 0.25) {
      g.lineStyle(0.8, this.darken(skin, 0.22), 0.45);
      const wrinkleY = cy - r * 0.05;
      g.lineBetween(cx - r * 0.12, wrinkleY, cx + r * 0.12, wrinkleY);
      g.fillStyle(this.darken(skin, 0.20), 0.25);
      g.fillEllipse(cx, wrinkleY, r * 0.28, r * 0.1);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // HAIR — textured with strand highlights and depth
  // ─────────────────────────────────────────────────────────────────────────
  private drawHair(
    g: Phaser.GameObjects.Graphics,
    config: PortraitConfig,
    _emotion: EmotionFeatures,
    cx: number, cy: number, r: number,
  ): void {
    const hc = config.hairColor;

    switch (config.hairStyle) {
      case 'short': {
        // Main hair mass
        g.fillStyle(hc, 1);
        g.fillEllipse(cx, cy - r * 0.62, r * 2.05, r * 1.28);
        // Side hair peeking below ears
        g.fillEllipse(cx - r * 0.82, cy - r * 0.05, r * 0.5, r * 0.45);
        g.fillEllipse(cx + r * 0.82, cy - r * 0.05, r * 0.5, r * 0.45);
        // Strand highlight (lighter center strip — light source)
        g.fillStyle(this.lighten(hc, 0.14), 0.5);
        g.fillEllipse(cx - r * 0.15, cy - r * 0.72, r * 0.85, r * 0.55);
        // Strand shadow (dark cluster lower-right)
        g.fillStyle(this.darken(hc, 0.22), 0.45);
        g.fillEllipse(cx + r * 0.3, cy - r * 0.38, r * 0.6, r * 0.4);
        // Hairline gradient at forehead
        g.fillStyle(hc, 0.55);
        g.fillEllipse(cx, cy - r * 0.82, r * 1.6, r * 0.35);
        break;
      }

      case 'long': {
        // Main body
        g.fillStyle(hc, 1);
        g.fillEllipse(cx, cy - r * 0.5, r * 2.15, r * 1.5);
        // Side curtains (flowing down)
        g.fillRect(cx - r * 1.12, cy - r * 0.2, r * 0.38, r * 1.65);
        g.fillRect(cx + r * 0.74, cy - r * 0.2, r * 0.38, r * 1.65);
        // Outer strand softening
        g.fillStyle(hc, 0.6);
        g.fillRect(cx - r * 1.22, cy + r * 0.1, r * 0.25, r * 1.4);
        g.fillRect(cx + r * 0.97, cy + r * 0.1, r * 0.25, r * 1.4);
        // Central highlight
        g.fillStyle(this.lighten(hc, 0.16), 0.5);
        g.fillEllipse(cx - r * 0.2, cy - r * 0.72, r * 0.9, r * 0.55);
        // Shadow stripe
        g.fillStyle(this.darken(hc, 0.25), 0.4);
        g.fillRect(cx + r * 0.35, cy - r * 0.6, r * 0.2, r * 1.2);
        break;
      }

      case 'hooded': {
        // Outer hood shape
        g.fillStyle(hc, 1);
        g.fillEllipse(cx, cy - r * 0.32, r * 2.55, r * 2.15);
        g.fillRect(cx - r * 1.25, cy + r * 0.05, r * 2.5, r * 0.95);
        // Inner shadow — creates hood depth
        g.fillStyle(this.darken(hc, 0.38), 0.72);
        g.fillEllipse(cx, cy - r * 0.1, r * 1.88, r * 1.72);
        // Fabric fold lines on hood
        g.lineStyle(0.8, this.darken(hc, 0.28), 0.35);
        g.lineBetween(cx - r * 0.5, cy - r * 0.6, cx - r * 0.6, cy + r * 0.6);
        g.lineBetween(cx + r * 0.5, cy - r * 0.6, cx + r * 0.6, cy + r * 0.6);
        // Face-opening warm glow
        g.fillStyle(this.lighten(config.skinTone, 0.06), 0.12);
        g.fillEllipse(cx, cy, r * 1.32, r * 1.28);
        // Edge highlight on hood rim
        g.lineStyle(0.8, this.lighten(hc, 0.10), 0.4);
        g.strokeEllipse(cx, cy - r * 0.28, r * 2.0, r * 1.8);
        break;
      }

      case 'wild': {
        // Base mass
        g.fillStyle(hc, 1);
        for (let i = 0; i < 9; i++) {
          const angle = (i / 9) * Math.PI * 2 - Math.PI * 0.5;
          const spx = cx + Math.cos(angle) * r * 1.25;
          const spy = cy - r * 0.28 + Math.sin(angle) * r * 1.12;
          g.fillCircle(spx, spy, r * 0.42);
        }
        // Center highlight
        g.fillStyle(this.lighten(hc, 0.12), 0.4);
        g.fillCircle(cx - r * 0.15, cy - r * 0.55, r * 0.38);
        break;
      }

      case 'bald': {
        // Subtle skin shine on top of head (bald = smooth = reflects light)
        g.fillStyle(this.lighten(config.skinTone, 0.18), 0.35);
        g.fillEllipse(cx - r * 0.18, cy - r * 0.78, r * 0.85, r * 0.45);
        // Slight edge darkening
        g.fillStyle(this.darken(config.skinTone, 0.15), 0.25);
        g.fillEllipse(cx, cy - r * 0.72, r * 1.5, r * 0.6);
        break;
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // EYES — complex multi-layer with iris gradient, lashes, personality
  // ─────────────────────────────────────────────────────────────────────────
  private drawEyes(
    g: Phaser.GameObjects.Graphics,
    config: PortraitConfig,
    emotion: EmotionFeatures,
    cx: number, cy: number, r: number,
  ): void {
    const eyeSpacing = r * 0.40;
    const eyeY = cy - r * 0.22;
    const eyeR = r * 0.145 * emotion.eyeScale;
    const skin = config.skinTone;
    const hairC = config.hairColor ?? 0x333333;

    [-1, 1].forEach(side => {
      const ex = cx + side * eyeSpacing;

      // Under-eye shadow
      g.fillStyle(this.darken(skin, 0.12), 0.30);
      g.fillEllipse(ex, eyeY + eyeR * 0.8, eyeR * 2.8, eyeR * 1.2);

      // Upper eyelid crease (deeper shadow above eye)
      g.fillStyle(this.darken(skin, 0.20), 0.40);
      g.fillEllipse(ex, eyeY - eyeR * 0.55, eyeR * 2.7, eyeR * 1.1);

      // Sclera — warm ivory, slightly wider than tall for naturalism
      g.fillStyle(0xf8f2e8, 1);
      g.fillEllipse(ex, eyeY, eyeR * 2.15, eyeR * 1.62);

      // Sclera inner shadow (corners darker)
      g.fillStyle(0xcccccc, 0.18);
      g.fillEllipse(ex - eyeR * 0.7, eyeY, eyeR * 0.5, eyeR * 1.2);
      g.fillStyle(0xcccccc, 0.12);
      g.fillEllipse(ex + eyeR * 0.7, eyeY, eyeR * 0.5, eyeR * 1.2);

      // Iris base
      g.fillStyle(config.eyeColor, 1);
      g.fillCircle(ex, eyeY, eyeR * 0.88);

      // Iris rim (darker ring — limbal ring)
      g.fillStyle(this.darken(config.eyeColor, 0.40), 0.65);
      g.strokeCircle(ex, eyeY, eyeR * 0.85);

      // Iris radial detail (lighter wedge at upper-right — light catch)
      g.fillStyle(this.lighten(config.eyeColor, 0.22), 0.42);
      g.fillEllipse(ex - eyeR * 0.18, eyeY - eyeR * 0.22, eyeR * 0.65, eyeR * 0.45);

      // Pupil (round, deep dark)
      g.fillStyle(0x080808, 1);
      g.fillCircle(ex, eyeY, eyeR * 0.44);

      // Primary specular (sharp, bright)
      g.fillStyle(0xffffff, 0.95);
      g.fillCircle(ex - eyeR * 0.24, eyeY - eyeR * 0.30, eyeR * 0.20);

      // Secondary specular (soft, lower — wet eye effect)
      g.fillStyle(0xffffff, 0.30);
      g.fillCircle(ex + eyeR * 0.18, eyeY + eyeR * 0.28, eyeR * 0.12);

      // Upper eyelash line (thick, curved suggestion)
      g.lineStyle(1.5, this.darken(hairC, 0.05), 0.90);
      g.lineBetween(ex - eyeR * 1.0, eyeY - eyeR * 0.78, ex + eyeR * 1.0, eyeY - eyeR * 0.78);
      // Lash extension pixels
      g.lineStyle(1.0, this.darken(hairC, 0.05), 0.55);
      g.lineBetween(ex - eyeR * 1.05, eyeY - eyeR * 0.80, ex - eyeR * 1.15, eyeY - eyeR * 1.0);
      g.lineBetween(ex + eyeR * 1.05, eyeY - eyeR * 0.80, ex + eyeR * 1.15, eyeY - eyeR * 1.0);

      // Lower lash hint (thinner)
      g.lineStyle(0.7, this.darken(hairC, 0.10), 0.35);
      g.lineBetween(ex - eyeR * 0.85, eyeY + eyeR * 0.75, ex + eyeR * 0.85, eyeY + eyeR * 0.75);

      // Eyebrow — two-tone (base + highlight)
      const browY = eyeY - eyeR * 2.5;
      const browLen = eyeR * 1.55;
      const angleOff = emotion.eyebrowAngle * side * browLen;
      // Brow shadow base (slightly offset)
      g.lineStyle(2.2, this.darken(hairC, 0.08), 0.30);
      g.lineBetween(
        ex - browLen, browY + angleOff + 0.5,
        ex + browLen, browY - angleOff + 0.5,
      );
      // Brow main
      g.lineStyle(1.8, this.darken(hairC, 0.04), 0.92);
      g.lineBetween(
        ex - browLen, browY + angleOff,
        ex + browLen, browY - angleOff,
      );
      // Brow inner highlight
      g.lineStyle(0.8, this.lighten(hairC, 0.12), 0.28);
      g.lineBetween(
        ex - browLen * 0.5, browY + angleOff * 0.5 - 0.5,
        ex + browLen * 0.5, browY - angleOff * 0.5 - 0.5,
      );
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // NOSE — subtle, naturalistic
  // ─────────────────────────────────────────────────────────────────────────
  private drawNose(
    g: Phaser.GameObjects.Graphics,
    config: PortraitConfig,
    cx: number, cy: number, r: number,
  ): void {
    const skin = config.skinTone;
    // Bridge shadow (thin vertical)
    g.fillStyle(this.darken(skin, 0.16), 0.50);
    g.fillRect(cx - 1, cy + r * 0.06, 2, r * 0.22);
    // Nose tip highlight
    g.fillStyle(this.lighten(skin, 0.12), 0.35);
    g.fillEllipse(cx, cy + r * 0.24, r * 0.18, r * 0.14);
    // Nostrils (two tiny dark dots, angled outward)
    g.fillStyle(this.darken(skin, 0.30), 0.60);
    g.fillCircle(cx - r * 0.15, cy + r * 0.28, r * 0.068);
    g.fillCircle(cx + r * 0.15, cy + r * 0.28, r * 0.068);
    // Alar shadow (under nose, between nostrils)
    g.fillStyle(this.darken(skin, 0.20), 0.35);
    g.fillEllipse(cx, cy + r * 0.30, r * 0.25, r * 0.10);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MOUTH — personality-aware, emotion-driven
  // ─────────────────────────────────────────────────────────────────────────
  private drawMouth(
    g: Phaser.GameObjects.Graphics,
    config: PortraitConfig,
    emotion: EmotionFeatures,
    cx: number, cy: number, r: number,
  ): void {
    const mouthY = cy + r * 0.50;
    const mouthW = r * 0.52;
    const skin = config.skinTone;

    // Upper lip (slightly darker than skin)
    const lipDark = this.darken(skin, 0.30);
    const lipMid  = this.darken(skin, 0.20);

    if (emotion.mouthOpen) {
      // Open mouth — teeth + tongue depth
      // Shadow interior
      g.fillStyle(0x331111, 1);
      g.fillEllipse(cx, mouthY, mouthW * 1.1, mouthW * 0.65);
      // Teeth (upper)
      g.fillStyle(0xeee8d8, 0.90);
      g.fillRoundedRect(cx - mouthW * 0.42, mouthY - mouthW * 0.22, mouthW * 0.84, mouthW * 0.28, 2);
      // Tooth divides
      g.lineStyle(0.5, 0xccccbb, 0.3);
      for (let t = -1; t <= 1; t++) {
        g.lineBetween(cx + t * mouthW * 0.28, mouthY - mouthW * 0.22, cx + t * mouthW * 0.28, mouthY - mouthW * 0.02);
      }
      // Tongue hint
      g.fillStyle(0xdd6666, 0.55);
      g.fillEllipse(cx, mouthY + mouthW * 0.12, mouthW * 0.5, mouthW * 0.22);
      // Upper lip over teeth
      g.fillStyle(lipDark, 1);
      g.fillEllipse(cx, mouthY - mouthW * 0.32, mouthW * 1.05, mouthW * 0.30);
      // Cupid's bow
      g.fillStyle(lipMid, 0.7);
      g.fillEllipse(cx - mouthW * 0.22, mouthY - mouthW * 0.38, mouthW * 0.25, mouthW * 0.16);
      g.fillEllipse(cx + mouthW * 0.22, mouthY - mouthW * 0.38, mouthW * 0.25, mouthW * 0.16);
      // Lower lip
      g.fillStyle(lipMid, 0.75);
      g.fillEllipse(cx, mouthY + mouthW * 0.30, mouthW * 0.95, mouthW * 0.28);
    } else {
      // Closed mouth
      if (emotion.mouthCurve !== 0) {
        // Curved smile / frown using bezier approximation
        const cpY = mouthY - emotion.mouthCurve * r * 0.32;
        // Lower lip highlight
        g.fillStyle(this.lighten(skin, 0.06), 0.20);
        g.fillEllipse(cx, mouthY + r * 0.07, mouthW * 0.8, r * 0.10);
        // Mouth line
        g.lineStyle(1.6, lipDark, 0.88);
        g.beginPath();
        g.moveTo(cx - mouthW, mouthY);
        g.lineTo(cx, cpY);
        g.lineTo(cx + mouthW, mouthY);
        g.strokePath();
        // Corner dimples
        g.fillStyle(this.darken(skin, 0.18), 0.35);
        g.fillCircle(cx - mouthW, mouthY, r * 0.045);
        g.fillCircle(cx + mouthW, mouthY, r * 0.045);
      } else {
        // Neutral flat line with slight lip definition
        g.lineStyle(1.4, lipDark, 0.82);
        g.lineBetween(cx - mouthW, mouthY, cx + mouthW, mouthY);
        // Upper lip cupid's bow (two tiny bumps)
        g.fillStyle(lipMid, 0.40);
        g.fillEllipse(cx - mouthW * 0.25, mouthY - r * 0.055, mouthW * 0.3, r * 0.09);
        g.fillEllipse(cx + mouthW * 0.25, mouthY - r * 0.055, mouthW * 0.3, r * 0.09);
      }
      // Lower lip highlight (light catches lower lip)
      g.fillStyle(this.lighten(skin, 0.08), 0.22);
      g.fillEllipse(cx, mouthY + r * 0.065, mouthW * 0.65, r * 0.09);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CLOTHING — layered fabric with fold detail
  // ─────────────────────────────────────────────────────────────────────────
  private drawClothing(
    g: Phaser.GameObjects.Graphics,
    config: PortraitConfig,
    cx: number, cy: number, r: number, size: number,
  ): void {
    const clothY = cy + r * 0.82;
    const clothH = size - clothY;
    const cc = config.clothingColor;
    const ca = config.clothingAccent;

    // Main fill
    g.fillStyle(cc, 1);
    g.fillRect(cx - r * 1.3, clothY, r * 2.6, clothH);

    // Shoulder curve (subtle 3D shoulder volume)
    g.fillStyle(this.lighten(cc, 0.08), 0.40);
    g.fillEllipse(cx, clothY + r * 0.02, r * 2.5, r * 0.35);

    // Fabric fold lines
    g.lineStyle(0.8, this.darken(cc, 0.22), 0.38);
    for (const ox of [-r * 0.52, r * 0.52]) {
      g.lineBetween(cx + ox, clothY + r * 0.12, cx + ox, size - 2);
    }
    g.lineStyle(0.5, this.darken(cc, 0.15), 0.25);
    g.lineBetween(cx, clothY + r * 0.08, cx, size - 2);

    // Dark side shading (depth)
    g.fillStyle(this.darken(cc, 0.25), 0.50);
    g.fillRect(cx - r * 1.3, clothY, r * 0.4, clothH);
    g.fillRect(cx + r * 0.9, clothY, r * 0.4, clothH);

    // Collar line
    g.lineStyle(1.0, ca, 0.50);
    g.lineBetween(cx - r * 1.2, clothY, cx + r * 1.2, clothY);

    // Center accent strip (clasp/collar decoration)
    g.fillStyle(ca, 0.60);
    g.fillRoundedRect(cx - r * 0.13, clothY - r * 0.05, r * 0.26, clothH + r * 0.05, 1);

    // Character-specific clothing additions
    this.drawClothingDetail(g, config, cx, clothY, r, size);
  }

  private drawClothingDetail(
    g: Phaser.GameObjects.Graphics,
    config: PortraitConfig,
    cx: number, clothY: number, r: number, size: number,
  ): void {
    switch (config.id) {
      case 'christian': {
        // Chains draped over shoulders (visible burden)
        g.lineStyle(1.2, 0x888888, 0.65);
        for (let i = 0; i < 4; i++) {
          const chainX = cx - r * 0.7 + i * r * 0.45;
          const chainY = clothY + r * 0.1 + i * r * 0.08;
          g.strokeCircle(chainX, chainY, r * 0.09);
        }
        g.lineStyle(1.0, 0x666666, 0.45);
        g.lineBetween(cx - r * 0.7, clothY + r * 0.1, cx + r * 0.65, clothY + r * 0.42);
        // Pilgrim cross badge
        g.fillStyle(0xffd080, 0.90);
        g.fillRect(cx - r * 0.04, clothY + r * 0.3, r * 0.08, r * 0.3);
        g.fillRect(cx - r * 0.12, clothY + r * 0.38, r * 0.24, r * 0.08);
        break;
      }
      case 'lord_hategood': {
        // Judicial robe epaulettes
        g.fillStyle(0x442222, 0.8);
        g.fillRect(cx - r * 1.3, clothY, r * 0.55, r * 0.45);
        g.fillRect(cx + r * 0.75, clothY, r * 0.55, r * 0.45);
        // Scar hint on clothing (asymmetric)
        g.lineStyle(0.8, 0xff2222, 0.25);
        g.lineBetween(cx - r * 0.4, clothY + r * 0.2, cx - r * 0.05, clothY + r * 0.65);
        break;
      }
      case 'shining_ones': {
        // Radiant golden glow at collar
        g.fillStyle(0xffd700, 0.20);
        g.fillEllipse(cx, clothY, r * 2.0, r * 0.6);
        g.fillStyle(0xffffff, 0.12);
        g.fillEllipse(cx, clothY, r * 1.4, r * 0.4);
        break;
      }
      case 'evangelist': {
        // Sash across robe
        g.lineStyle(1.5, config.clothingAccent, 0.55);
        g.lineBetween(cx - r * 0.9, clothY + r * 0.25, cx + r * 0.9, clothY + r * 0.65);
        break;
      }
      case 'interpreter': {
        // Book clasp at breast
        g.fillStyle(0xd4a853, 0.7);
        g.fillRoundedRect(cx - r * 0.35, clothY + r * 0.25, r * 0.7, r * 0.38, 2);
        g.lineStyle(0.5, 0x8b7355, 0.6);
        g.strokeRoundedRect(cx - r * 0.35, clothY + r * 0.25, r * 0.7, r * 0.38, 2);
        break;
      }
      default:
        // Generic: small decorative button row
        if (config.clothingAccent) {
          for (let i = 0; i < 3; i++) {
            g.fillStyle(config.clothingAccent, 0.55);
            g.fillCircle(cx, clothY + r * (0.3 + i * 0.28), r * 0.055);
          }
        }
        // Bottom hem shading
        g.fillStyle(this.darken(config.clothingColor, 0.12), 0.30);
        g.fillRect(cx - r * 1.3, size - r * 0.25, r * 2.6, r * 0.25);
        break;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // BEARD — textured with strand lines, personality-appropriate style
  // ─────────────────────────────────────────────────────────────────────────
  private drawBeard(
    g: Phaser.GameObjects.Graphics,
    config: PortraitConfig,
    _emotion: EmotionFeatures,
    cx: number, cy: number, r: number,
  ): void {
    const bc = config.hairColor;
    const beardY = cy + r * 0.52;

    if (config.id === 'evangelist') {
      // Long flowing patriarchal beard
      // Main beard mass (wide, long)
      g.fillStyle(bc, 1);
      g.fillEllipse(cx, beardY + r * 0.55, r * 1.35, r * 1.10);
      // Beard sides — flanking the chin
      g.fillEllipse(cx - r * 0.42, beardY + r * 0.38, r * 0.70, r * 0.85);
      g.fillEllipse(cx + r * 0.42, beardY + r * 0.38, r * 0.70, r * 0.85);
      // Long flowing lower part
      g.fillEllipse(cx, beardY + r * 0.95, r * 0.85, r * 0.65);
      g.fillEllipse(cx, beardY + r * 1.22, r * 0.55, r * 0.45);
      // Beard tip
      g.fillEllipse(cx, beardY + r * 1.42, r * 0.30, r * 0.30);

      // Strand detail lines (vertical flowing strands)
      g.lineStyle(0.7, this.lighten(bc, 0.18), 0.42);
      for (let i = -2; i <= 2; i++) {
        const sx = cx + i * r * 0.22;
        g.lineBetween(sx, beardY + r * 0.15, sx + i * r * 0.05, beardY + r * 1.1);
      }
      // Highlight streak (central catch light)
      g.fillStyle(this.lighten(bc, 0.22), 0.50);
      g.fillEllipse(cx - r * 0.15, beardY + r * 0.35, r * 0.42, r * 0.60);
      // Shadow at chin sides
      g.fillStyle(this.darken(bc, 0.28), 0.45);
      g.fillEllipse(cx - r * 0.55, beardY + r * 0.25, r * 0.38, r * 0.55);
      g.fillEllipse(cx + r * 0.55, beardY + r * 0.25, r * 0.38, r * 0.55);
      // Mustache
      g.fillStyle(bc, 1);
      g.fillEllipse(cx - r * 0.22, beardY - r * 0.02, r * 0.44, r * 0.22);
      g.fillEllipse(cx + r * 0.22, beardY - r * 0.02, r * 0.44, r * 0.22);
      g.fillStyle(this.lighten(bc, 0.10), 0.40);
      g.fillEllipse(cx, beardY - r * 0.04, r * 0.30, r * 0.14);

    } else {
      // Standard short-to-medium beard
      g.fillStyle(bc, 1);
      g.fillEllipse(cx, beardY + r * 0.45, r * 1.18, r * 0.88);
      g.fillEllipse(cx - r * 0.35, beardY + r * 0.30, r * 0.58, r * 0.72);
      g.fillEllipse(cx + r * 0.35, beardY + r * 0.30, r * 0.58, r * 0.72);
      // Highlight
      g.fillStyle(this.lighten(bc, 0.15), 0.55);
      g.fillEllipse(cx - r * 0.15, beardY + r * 0.18, r * 0.55, r * 0.40);
      // Depth shadow
      g.fillStyle(this.darken(bc, 0.22), 0.45);
      g.fillEllipse(cx, beardY + r * 0.65, r * 0.78, r * 0.42);
      // Beard tip
      g.fillStyle(bc, 1);
      g.fillEllipse(cx, beardY + r * 0.88, r * 0.36, r * 0.36);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ACCESSORY — character-specific props
  // ─────────────────────────────────────────────────────────────────────────
  private drawAccessory(
    g: Phaser.GameObjects.Graphics,
    config: PortraitConfig,
    cx: number, cy: number, r: number, _size: number,
  ): void {
    if (!config.accessory || !config.accessoryColor) return;
    const ac = config.accessoryColor;

    switch (config.accessory) {
      case 'scroll': {
        const sx = cx + r * 0.82;
        const sy = cy + r * 0.28;
        // Scroll shadow
        g.fillStyle(0x000000, 0.22);
        g.fillRoundedRect(sx + 1, sy + 1, r * 0.52, r * 0.72, 3);
        // Scroll body
        g.fillStyle(ac, 0.85);
        g.fillRoundedRect(sx, sy, r * 0.52, r * 0.72, 3);
        // Rolled ends (darker)
        g.fillStyle(this.darken(ac, 0.20), 0.7);
        g.fillRoundedRect(sx, sy, r * 0.52, r * 0.10, 3);
        g.fillRoundedRect(sx, sy + r * 0.62, r * 0.52, r * 0.10, 3);
        // Lines of text
        g.lineStyle(0.6, 0x8b7355, 0.40);
        for (let i = 1; i <= 3; i++) {
          g.lineBetween(sx + 3, sy + r * 0.12 * i + r * 0.04, sx + r * 0.42, sy + r * 0.12 * i + r * 0.04);
        }
        // Scroll outline
        g.lineStyle(0.8, this.darken(ac, 0.30), 0.5);
        g.strokeRoundedRect(sx, sy, r * 0.52, r * 0.72, 3);
        break;
      }

      case 'staff': {
        const staffX = cx + r * 1.15;
        const staffTop = cy - r * 1.18;
        const staffBottom = cy + r * 1.62;
        // Shadow
        g.lineStyle(4, 0x000000, 0.18);
        g.lineBetween(staffX + 1, staffTop, staffX + 1, staffBottom);
        // Staff shaft
        g.lineStyle(3.2, ac, 0.92);
        g.lineBetween(staffX, staffTop, staffX, staffBottom);
        // Wood grain highlight
        g.lineStyle(1.0, this.lighten(ac, 0.28), 0.38);
        g.lineBetween(staffX - 0.8, staffTop + 2, staffX - 0.8, staffBottom - 4);
        // Wood grain shadow
        g.lineStyle(0.8, this.darken(ac, 0.32), 0.28);
        g.lineBetween(staffX + 1, staffTop + 2, staffX + 1, staffBottom - 4);
        // Ornate knob at top (golden)
        g.fillStyle(0xd4a853, 0.95);
        g.fillCircle(staffX, staffTop, r * 0.24);
        g.fillStyle(0xffd080, 0.65);
        g.fillCircle(staffX - r * 0.08, staffTop - r * 0.08, r * 0.12);
        g.fillStyle(this.darken(0xd4a853, 0.25), 0.55);
        g.fillCircle(staffX + r * 0.07, staffTop + r * 0.06, r * 0.09);
        // Crossguard
        g.lineStyle(2.0, this.darken(ac, 0.10), 0.8);
        g.lineBetween(staffX - r * 0.20, staffTop + r * 0.35, staffX + r * 0.20, staffTop + r * 0.35);
        break;
      }

      case 'crown': {
        const crownY = cy - r * 1.02;
        const crownW = r * 1.55;
        // Crown shadow
        g.fillStyle(0x000000, 0.20);
        g.fillRect(cx - crownW / 2 + 1, crownY + 1, crownW, r * 0.55);
        // Crown base band
        g.fillStyle(ac, 1);
        g.fillRect(cx - crownW / 2, crownY + r * 0.18, crownW, r * 0.32);
        // Crown spikes (5 prongs)
        for (let i = 0; i < 5; i++) {
          const px = cx - crownW / 2 + (i + 0.5) * (crownW / 5);
          const h = i % 2 === 0 ? r * 0.55 : r * 0.32;
          g.fillStyle(ac, 1);
          g.fillTriangle(
            px - crownW / 12, crownY + r * 0.22,
            px, crownY + r * 0.22 - h,
            px + crownW / 12, crownY + r * 0.22,
          );
        }
        // Gemstone in center
        g.fillStyle(0xdd2222, 0.90);
        g.fillCircle(cx, crownY + r * 0.28, r * 0.10);
        g.fillStyle(0xff6666, 0.55);
        g.fillCircle(cx - r * 0.04, crownY + r * 0.24, r * 0.05);
        // Crown highlight
        g.lineStyle(0.8, this.lighten(ac, 0.30), 0.45);
        g.lineBetween(cx - crownW / 2, crownY + r * 0.20, cx + crownW / 2, crownY + r * 0.20);
        break;
      }

      case 'halo': {
        const haloY = cy - r * 1.22;
        // Outer soft glow
        g.fillStyle(ac, 0.10);
        g.fillEllipse(cx, haloY, r * 1.55, r * 0.42);
        g.fillStyle(ac, 0.15);
        g.fillEllipse(cx, haloY, r * 1.35, r * 0.35);
        // Halo ring (the solid ring)
        g.lineStyle(2.5, ac, 0.75);
        g.strokeEllipse(cx, haloY, r * 1.22, r * 0.32);
        // Inner bright ring
        g.lineStyle(1.0, this.lighten(ac, 0.30), 0.55);
        g.strokeEllipse(cx, haloY, r * 1.08, r * 0.28);
        // Shimmer points on halo
        for (let i = 0; i < 4; i++) {
          const angle = (i / 4) * Math.PI;
          const hx = cx + Math.cos(angle) * r * 0.58;
          const hy = haloY + Math.sin(angle) * r * 0.12;
          g.fillStyle(0xffffff, 0.65);
          g.fillCircle(hx, hy, r * 0.038);
        }
        break;
      }

      case 'hat': {
        const hatY = cy - r * 0.85;
        // Brim shadow
        g.fillStyle(0x000000, 0.20);
        g.fillEllipse(cx, hatY + r * 0.22, r * 2.28, r * 0.62);
        // Brim
        g.fillStyle(ac, 0.92);
        g.fillEllipse(cx, hatY + r * 0.20, r * 2.22, r * 0.58);
        // Crown
        g.fillStyle(ac, 1);
        g.fillRoundedRect(cx - r * 0.72, hatY - r * 0.72, r * 1.44, r * 0.96, 4);
        // Crown highlight
        g.fillStyle(this.lighten(ac, 0.12), 0.30);
        g.fillRect(cx - r * 0.66, hatY - r * 0.68, r * 0.3, r * 0.85);
        // Crown shadow
        g.fillStyle(this.darken(ac, 0.22), 0.40);
        g.fillRect(cx + r * 0.42, hatY - r * 0.68, r * 0.28, r * 0.85);
        // Hat band
        g.fillStyle(this.darken(ac, 0.30), 0.75);
        g.fillRect(cx - r * 0.72, hatY + r * 0.15, r * 1.44, r * 0.10);
        break;
      }

      case 'chains': {
        // Heavy chains for Christian (visible burden) — shown at bottom of portrait
        const chainY0 = cy + r * 0.7;
        g.lineStyle(1.2, ac, 0.55);
        for (let i = 0; i < 5; i++) {
          g.strokeCircle(cx - r * 0.75 + i * r * 0.35, chainY0 + i * r * 0.10, r * 0.08);
        }
        g.lineStyle(0.9, this.lighten(ac, 0.20), 0.30);
        g.lineBetween(cx - r * 0.75, chainY0, cx + r * 0.65, chainY0 + r * 0.40);
        break;
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // EMOTION FX — tears, blush, sparkle, sweat
  // ─────────────────────────────────────────────────────────────────────────
  private drawEmotionEffects(
    g: Phaser.GameObjects.Graphics,
    _config: PortraitConfig,
    emotion: EmotionFeatures,
    cx: number, cy: number, r: number, size: number,
  ): void {
    if (emotion.blush) {
      // Soft oval blush on cheeks
      g.fillStyle(0xff5577, 0.22);
      g.fillEllipse(cx - r * 0.52, cy + r * 0.22, r * 0.40, r * 0.20);
      g.fillEllipse(cx + r * 0.52, cy + r * 0.22, r * 0.40, r * 0.20);
      // Brighter center
      g.fillStyle(0xff3366, 0.14);
      g.fillEllipse(cx - r * 0.52, cy + r * 0.22, r * 0.22, r * 0.12);
      g.fillEllipse(cx + r * 0.52, cy + r * 0.22, r * 0.22, r * 0.12);
    }

    if (emotion.tearDrop) {
      // Tear track down cheek
      g.lineStyle(1.0, 0x88aadd, 0.55);
      g.lineBetween(cx + r * 0.52, cy + r * 0.12, cx + r * 0.58, cy + r * 0.62);
      // Tear drop at bottom
      g.fillStyle(0x88aadd, 0.80);
      g.fillEllipse(cx + r * 0.60, cy + r * 0.65, r * 0.10, r * 0.16);
      // Glint on tear
      g.fillStyle(0xffffff, 0.50);
      g.fillCircle(cx + r * 0.57, cy + r * 0.62, r * 0.04);
    }

    if (emotion.sparkle) {
      // 4-point star sparkles in corners
      const sparkles: [number, number, number][] = [
        [size * 0.10, size * 0.12, r * 0.10],
        [size * 0.87, size * 0.09, r * 0.085],
        [size * 0.91, size * 0.88, r * 0.08],
      ];
      for (const [sx, sy, sr] of sparkles) {
        g.fillStyle(0xffd700, 0.85);
        g.fillRect(sx - sr, sy - 0.5, sr * 2, 1);
        g.fillRect(sx - 0.5, sy - sr, 1, sr * 2);
        // Small diagonal arms
        g.fillStyle(0xffd700, 0.45);
        g.fillRect(sx - sr * 0.6, sy - sr * 0.6, sr * 0.5, sr * 0.5);
        g.fillRect(sx + sr * 0.1, sy + sr * 0.1, sr * 0.5, sr * 0.5);
      }
    }

    if (emotion.sweatDrop) {
      // Anime-style sweat drop at forehead
      g.fillStyle(0x88bbdd, 0.75);
      g.fillEllipse(cx + r * 0.85, cy - r * 0.55, r * 0.14, r * 0.22);
      // Shine
      g.fillStyle(0xffffff, 0.45);
      g.fillCircle(cx + r * 0.81, cy - r * 0.60, r * 0.05);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // VIGNETTE — subtle portrait frame darkening
  // ─────────────────────────────────────────────────────────────────────────
  private drawVignette(
    g: Phaser.GameObjects.Graphics,
    config: PortraitConfig,
    _cx: number,
    size: number,
  ): void {
    // Corner vignette (4 corners darkened)
    const steps = 8;
    for (let i = 0; i < steps; i++) {
      const t = 1 - i / steps;
      const alpha = 0.18 * t * t;
      const inset = i * (size / (steps * 2));
      g.fillStyle(0x000000, alpha);
      g.fillRect(0, 0, size - inset * 2, inset);                   // top
      g.fillRect(0, size - inset, size - inset * 2, inset);        // bottom
      g.fillRect(0, inset, inset, size - inset * 2);               // left
      g.fillRect(size - inset, inset, inset, size - inset * 2);    // right
    }

    // Thin portrait border (personality color)
    const atmos = this.getAtmosphere(config);
    g.lineStyle(0.8, atmos.glowColor, 0.25);
    g.strokeRect(1, 1, size - 2, size - 2);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // COLOR UTILITIES
  // ─────────────────────────────────────────────────────────────────────────
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
