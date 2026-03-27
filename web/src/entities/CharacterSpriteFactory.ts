import Phaser from 'phaser';
import { PORTRAIT_CONFIGS, PortraitConfig } from '../narrative/data/portraitData';

/**
 * Procedurally generates 32×32 character spritesheets using Phaser Graphics.
 *
 * Layout: 8 columns × 8 rows
 *   Rows 0–3: idle (down/left/right/up) × 4 frames — subtle breathing anim
 *   Rows 4–7: walk (down/left/right/up) × 6 frames — step cycle
 *
 * Each frame is drawn into a RenderTexture canvas, then the full sheet
 * is registered as a spritesheet texture.
 */

const SPRITE_SIZE = 32;
const COLS = 8;
const ROWS = 8;

const DIR_NAMES = ['down', 'left', 'right', 'up'] as const;

interface BodyColors {
  skin: number;
  hair: number;
  clothing: number;
  accent: number;
  eye: number;
  accessory?: number;
}

type DrawDir = 'down' | 'left' | 'right' | 'up';

export class CharacterSpriteFactory {
  /**
   * Generate a 32×32 spritesheet texture for a character.
   * Must be called in PreloadScene.create() after all base textures are loaded.
   */
  static generate(scene: Phaser.Scene, characterId: string): string {
    const config = PORTRAIT_CONFIGS[characterId];
    if (!config) {
      console.warn(`No portrait config for "${characterId}", skipping sprite generation`);
      return characterId;
    }

    const texKey = `${characterId}_gen`;
    if (scene.textures.exists(texKey)) return texKey;

    const sheetW = COLS * SPRITE_SIZE;
    const sheetH = ROWS * SPRITE_SIZE;

    const rt = scene.add.renderTexture(0, 0, sheetW, sheetH).setVisible(false);
    const g = scene.add.graphics().setVisible(false);

    const colors: BodyColors = {
      skin: config.skinTone,
      hair: config.hairColor,
      clothing: config.clothingColor,
      accent: config.clothingAccent,
      eye: config.eyeColor,
      accessory: config.accessoryColor,
    };

    // Draw idle frames (rows 0–3)
    for (let dirIdx = 0; dirIdx < 4; dirIdx++) {
      const dir = DIR_NAMES[dirIdx];
      for (let frame = 0; frame < 4; frame++) {
        g.clear();
        const ox = frame * SPRITE_SIZE;
        const oy = dirIdx * SPRITE_SIZE;
        this.drawCharacter(g, ox, oy, dir, colors, config, 'idle', frame);
        rt.draw(g);
      }
    }

    // Draw walk frames (rows 4–7)
    for (let dirIdx = 0; dirIdx < 4; dirIdx++) {
      const dir = DIR_NAMES[dirIdx];
      for (let frame = 0; frame < 6; frame++) {
        g.clear();
        const ox = frame * SPRITE_SIZE;
        const oy = (4 + dirIdx) * SPRITE_SIZE;
        this.drawCharacter(g, ox, oy, dir, colors, config, 'walk', frame);
        rt.draw(g);
      }
    }

    // Save as spritesheet texture
    rt.saveTexture(texKey);
    scene.textures.get(texKey).setFilter(Phaser.Textures.FilterMode.NEAREST);

    // Add spritesheet frame data
    const tex = scene.textures.get(texKey);
    // Manually add frames as a grid (source index 0 for RenderTexture)
    let frameIndex = 0;
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        tex.add(
          frameIndex, 0,
          col * SPRITE_SIZE, row * SPRITE_SIZE,
          SPRITE_SIZE, SPRITE_SIZE,
        );
        frameIndex++;
      }
    }

    // Cleanup
    g.destroy();
    rt.destroy();

    return texKey;
  }

  private static drawCharacter(
    g: Phaser.GameObjects.Graphics,
    ox: number, oy: number,
    dir: DrawDir,
    colors: BodyColors,
    config: PortraitConfig,
    anim: 'idle' | 'walk',
    frame: number,
  ): void {
    const cx = ox + SPRITE_SIZE / 2;

    // Animation offsets
    let bobY = 0;
    let legOffset = 0;
    let armSwing = 0;

    if (anim === 'idle') {
      // Breathing bob
      bobY = Math.sin((frame / 4) * Math.PI * 2) * 0.8;
    } else {
      // Walk cycle
      const phase = (frame / 6) * Math.PI * 2;
      bobY = Math.abs(Math.sin(phase)) * -1.5;
      legOffset = Math.sin(phase) * 4;
      armSwing = Math.sin(phase) * 3;
    }

    // === Shadow ===
    g.fillStyle(0x000000, 0.25);
    g.fillEllipse(cx, oy + 29, 13, 4);

    // === Dark outline pass (drawn first, slightly larger than body) ===
    const outlineColor = 0x111111;
    g.fillStyle(outlineColor, 0.7);
    // Head outline
    g.fillCircle(cx, oy + 10 + bobY, 7);
    // Body outline
    g.fillRoundedRect(cx - 6, oy + 14 + bobY, 12, 13, 2);

    // === Feet / Legs ===
    const footY = oy + 26 + bobY;
    if (dir === 'left' || dir === 'right') {
      // Side view: staggered feet
      g.fillStyle(colors.clothing, 1);
      g.fillRect(cx - 3, footY - 2 + legOffset, 3, 4);
      g.fillRect(cx + 1, footY - 2 - legOffset, 3, 4);
      // Shoes
      g.fillStyle(this.darken(colors.clothing, 0.6), 1);
      g.fillRect(cx - 3, footY + 2 + legOffset, 3, 2);
      g.fillRect(cx + 1, footY + 2 - legOffset, 3, 2);
    } else {
      // Front/back view
      g.fillStyle(colors.clothing, 1);
      g.fillRect(cx - 5, footY - 2 + legOffset, 3, 4);
      g.fillRect(cx + 2, footY - 2 - legOffset, 3, 4);
      g.fillStyle(this.darken(colors.clothing, 0.6), 1);
      g.fillRect(cx - 5, footY + 2, 3, 2);
      g.fillRect(cx + 2, footY + 2, 3, 2);
    }

    // === Body / Torso ===
    const bodyY = oy + 14 + bobY;
    const bodyH = 12;
    g.fillStyle(colors.clothing, 1);
    g.fillRoundedRect(cx - 6, bodyY, 12, bodyH, 2);

    // Body detail (belt / accent line)
    g.fillStyle(colors.accent, 1);
    g.fillRect(cx - 5, bodyY + bodyH - 3, 10, 2);

    // === Arms ===
    if (dir === 'down' || dir === 'up') {
      // Arms at sides
      g.fillStyle(colors.clothing, 1);
      g.fillRect(cx - 9, bodyY + 1 + armSwing, 3, 8);
      g.fillRect(cx + 6, bodyY + 1 - armSwing, 3, 8);
      // Hands
      g.fillStyle(colors.skin, 1);
      g.fillRect(cx - 9, bodyY + 9 + armSwing, 3, 2);
      g.fillRect(cx + 6, bodyY + 9 - armSwing, 3, 2);
    } else {
      // Side view: one arm visible
      const armX = dir === 'right' ? cx - 8 : cx + 5;
      g.fillStyle(colors.clothing, 1);
      g.fillRect(armX, bodyY + 1 + armSwing, 3, 8);
      g.fillStyle(colors.skin, 1);
      g.fillRect(armX, bodyY + 9 + armSwing, 3, 2);
    }

    // === Head ===
    const headY = oy + 4 + bobY;
    const headW = config.headShape === 'square' ? 12 : (config.headShape === 'oval' ? 10 : 11);
    const headH = config.headShape === 'oval' ? 12 : 10;

    // Hair back (for long hair)
    if (config.hairStyle === 'long' && (dir === 'down' || dir === 'left' || dir === 'right')) {
      g.fillStyle(colors.hair, 1);
      g.fillRoundedRect(cx - headW / 2 - 1, headY - 1, headW + 2, headH + 6, 3);
    }

    // Head shape
    g.fillStyle(colors.skin, 1);
    g.fillRoundedRect(cx - headW / 2, headY, headW, headH, config.headShape === 'square' ? 1 : 3);

    // Hair
    g.fillStyle(colors.hair, 1);
    if (config.hairStyle === 'hooded') {
      g.fillRoundedRect(cx - headW / 2 - 1, headY - 2, headW + 2, 7, 3);
      g.fillRect(cx - headW / 2 - 1, headY, 2, headH - 2);
      g.fillRect(cx + headW / 2 - 1, headY, 2, headH - 2);
    } else if (config.hairStyle === 'wild') {
      g.fillRoundedRect(cx - headW / 2 - 2, headY - 3, headW + 4, 6, 2);
      g.fillTriangle(cx - headW / 2 - 3, headY, cx - headW / 2, headY - 4, cx - headW / 2 + 2, headY);
      g.fillTriangle(cx + headW / 2 + 3, headY, cx + headW / 2, headY - 4, cx + headW / 2 - 2, headY);
    } else if (config.hairStyle === 'bald') {
      // Highlight on bald head
      g.fillStyle(0xffffff, 0.15);
      g.fillCircle(cx - 1, headY + 2, 2);
    } else {
      // short or long top
      g.fillRoundedRect(cx - headW / 2, headY - 2, headW, 5, 2);
    }

    // Face (only for front/side views)
    if (dir !== 'up') {
      // Eyes
      if (dir === 'down') {
        g.fillStyle(0xffffff, 1);
        g.fillRect(cx - 4, headY + 4, 3, 3);
        g.fillRect(cx + 1, headY + 4, 3, 3);
        g.fillStyle(colors.eye, 1);
        g.fillRect(cx - 3, headY + 5, 2, 2);
        g.fillRect(cx + 2, headY + 5, 2, 2);
        // Mouth
        g.fillStyle(this.darken(colors.skin, 0.7), 1);
        g.fillRect(cx - 1, headY + 8, 3, 1);
      } else {
        // Side view eyes
        const eyeX = dir === 'right' ? cx + 1 : cx - 4;
        g.fillStyle(0xffffff, 1);
        g.fillRect(eyeX, headY + 4, 3, 3);
        g.fillStyle(colors.eye, 1);
        g.fillRect(eyeX + (dir === 'right' ? 1 : 0), headY + 5, 2, 2);
        // Mouth
        const mouthX = dir === 'right' ? cx + 1 : cx - 3;
        g.fillStyle(this.darken(colors.skin, 0.7), 1);
        g.fillRect(mouthX, headY + 8, 2, 1);
      }
    } else {
      // Back of head — just hair
      if (config.hairStyle === 'long') {
        g.fillStyle(colors.hair, 1);
        g.fillRoundedRect(cx - headW / 2, headY, headW, headH + 4, 3);
      }
    }

    // === Accessory ===
    if (config.accessory) {
      const accColor = colors.accessory ?? colors.accent;
      switch (config.accessory) {
        case 'halo':
          g.lineStyle(1.5, accColor, 0.8);
          g.strokeEllipse(cx, headY - 1 + bobY * 0.5, 10, 3);
          break;
        case 'staff': {
          const staffX = dir === 'right' ? cx + 10 : cx - 10;
          g.lineStyle(2, accColor, 1);
          g.lineBetween(staffX, bodyY - 2, staffX, oy + 28);
          break;
        }
        case 'scroll': {
          const scrollX = dir === 'right' ? cx + 8 : cx - 10;
          g.fillStyle(accColor, 1);
          g.fillRoundedRect(scrollX, bodyY + 3, 4, 6, 1);
          break;
        }
        case 'crown':
          g.fillStyle(accColor, 1);
          g.fillRect(cx - 5, headY - 3, 10, 2);
          g.fillTriangle(cx - 5, headY - 3, cx - 5, headY - 6, cx - 3, headY - 3);
          g.fillTriangle(cx, headY - 3, cx, headY - 7, cx + 2, headY - 3);
          g.fillTriangle(cx + 5, headY - 3, cx + 5, headY - 6, cx + 3, headY - 3);
          break;
        case 'chains': {
          g.lineStyle(1, 0x888888, 0.5);
          const chainY = bodyY + bodyH - 1;
          for (let i = 0; i < 3; i++) {
            g.strokeCircle(cx - 4 + i * 4, chainY + 2 + (i % 2), 1.5);
          }
          break;
        }
        case 'hat':
          g.fillStyle(accColor, 1);
          g.fillRoundedRect(cx - 7, headY - 4, 14, 3, 1);
          g.fillRoundedRect(cx - 5, headY - 7, 10, 4, 2);
          break;
      }
    }

    // === Burden (Christian-specific) ===
    if (config.id === 'christian' && dir !== 'left') {
      const burdenX = dir === 'right' ? cx - 6 : cx + 2;
      g.fillStyle(0x8b7355, 0.8);
      g.fillRoundedRect(burdenX, bodyY - 3, 8, 7, 2);
      g.lineStyle(1, 0x6b5b4f, 0.6);
      g.strokeRoundedRect(burdenX, bodyY - 3, 8, 7, 2);
    }
  }

  /** Darken a hex color by factor (0 = black, 1 = original) */
  private static darken(color: number, factor: number): number {
    const r = Math.floor(((color >> 16) & 0xff) * factor);
    const g = Math.floor(((color >> 8) & 0xff) * factor);
    const b = Math.floor((color & 0xff) * factor);
    return (r << 16) | (g << 8) | b;
  }

  /** Generate sprites for all characters that have portrait configs */
  static generateAll(scene: Phaser.Scene): Map<string, string> {
    const results = new Map<string, string>();
    for (const id of Object.keys(PORTRAIT_CONFIGS)) {
      const texKey = this.generate(scene, id);
      results.set(id, texKey);
    }
    return results;
  }
}
