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
    // Dispatch to character-specific or generic draw method
    switch (config.id) {
      case 'christian':
        this.drawChristian(g, ox, oy, dir, colors, anim, frame);
        break;
      case 'evangelist':
        this.drawEvangelist(g, ox, oy, dir, colors, anim, frame);
        break;
      case 'interpreter':
        this.drawInterpreter(g, ox, oy, dir, colors, anim, frame);
        break;
      case 'faithful':
        this.drawFaithful(g, ox, oy, dir, colors, anim, frame);
        break;
      case 'hopeful':
        this.drawHopeful(g, ox, oy, dir, colors, anim, frame);
        break;
      case 'shining_ones':
        this.drawShiningOnes(g, ox, oy, dir, colors, anim, frame);
        break;
      case 'lord_hategood':
        this.drawLordHategood(g, ox, oy, dir, colors, anim, frame);
        break;
      case 'prudence':
        this.drawPrudence(g, ox, oy, dir, colors, anim, frame);
        break;
      case 'watchful':
        this.drawWatchful(g, ox, oy, dir, colors, anim, frame);
        break;
      default:
        this.drawGenericCharacter(g, ox, oy, dir, colors, config, anim, frame);
        break;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CHRISTIAN — SANABI-quality pilgrim: multi-ring aura, detailed burden sack,
  //             5-tone skin, textured hat, eye brows/iris/specular, cross badge
  // ─────────────────────────────────────────────────────────────────────────
  private static drawChristian(
    g: Phaser.GameObjects.Graphics,
    ox: number, oy: number,
    dir: DrawDir,
    colors: BodyColors,
    anim: 'idle' | 'walk',
    frame: number,
  ): void {
    const cx = ox + SPRITE_SIZE / 2;

    // ── Animation offsets ─────────────────────────────────────────────────
    let bobY = 0, legOffset = 0, armSwing = 0, breathe = 0, burdenSway = 0;
    if (anim === 'idle') {
      bobY      = Math.sin((frame / 4) * Math.PI * 2) * 1.0;
      breathe   = Math.sin((frame / 2) * Math.PI * 2) * 0.6;  // chest
    } else {
      const phase = (frame / 6) * Math.PI * 2;
      bobY       = Math.abs(Math.sin(phase)) * -2.5;  // heavy burden dip
      legOffset  = Math.sin(phase) * 5;
      armSwing   = Math.sin(phase) * 3;
      burdenSway = Math.sin(phase) * 1.5;             // sack counter-sways
    }

    // ── Color palette — 5-tone skin ramp, 4-tone clothing ─────────────────
    const skinLight  = this.lighten(colors.skin, 1.22);
    const skinBase   = colors.skin;
    const skinShadow = this.darken(colors.skin, 0.72);
    const skinDeep   = this.darken(colors.skin, 0.55);
    const clothLight = this.lighten(colors.clothing, 1.18);
    const clothBase  = colors.clothing;
    const clothShadow= this.darken(colors.clothing, 0.72);
    const clothDeep  = this.darken(colors.clothing, 0.54);

    // ── Ground shadow ──────────────────────────────────────────────────────
    g.fillStyle(0x000000, 0.28);
    g.fillEllipse(cx, oy + 29, 14, 3.5);
    g.fillStyle(0x000000, 0.09);
    g.fillEllipse(cx, oy + 29, 22, 6);

    // ── Faith aura — multi-ring + 8 animated radial spikes ─────────────────
    const phase4 = (frame / 4) * Math.PI * 2;
    const rotAngle = phase4 * 0.5;             // slowly rotating spike ring
    const auraPulse = 0.052 + Math.sin(phase4) * 0.022;
    const auraY = oy + 16 + bobY;
    // Three concentric rings: outer diffuse → mid glow → inner bright
    g.fillStyle(0xffd070, auraPulse * 0.38);
    g.fillCircle(cx, auraY, 16);
    g.fillStyle(0xd4a853, auraPulse * 0.78);
    g.fillCircle(cx, auraY, 11);
    g.fillStyle(0xffe8a0, auraPulse * 1.3);
    g.fillCircle(cx, auraY, 7);
    // 8 radial spike lines (rotate slowly each frame)
    g.lineStyle(1, 0xffd070, auraPulse * 2.8);
    for (let i = 0; i < 8; i++) {
      const a = rotAngle + (i / 8) * Math.PI * 2;
      g.lineBetween(cx + Math.cos(a) * 8, auraY + Math.sin(a) * 8,
                    cx + Math.cos(a) * 14, auraY + Math.sin(a) * 14);
    }
    // Sparkle pixels at 4 alternate spike tips
    if (frame % 2 === 0) {
      g.fillStyle(0xffffff, 0.52);
      for (let i = 0; i < 4; i++) {
        const a = rotAngle + (i / 4) * Math.PI * 2 + Math.PI / 8;
        g.fillRect(Math.round(cx + Math.cos(a) * 13) - 1,
                   Math.round(auraY + Math.sin(a) * 13) - 1, 2, 2);
      }
    }

    // ── Boots — 3-tone leather with toe extension + sole strip ─────────────
    const footY = Math.round(oy + 26 + bobY);
    const bootBase = 0x3a2510, bootMid = 0x4e3318, bootHigh = 0x6a4820;
    if (dir === 'left' || dir === 'right') {
      // Back foot
      g.fillStyle(bootBase, 1);
      g.fillRect(cx + 1, footY - 2 - Math.round(legOffset), 5, 4);
      g.fillRect(cx + 1, footY + 1 - Math.round(legOffset), 6, 2);
      g.fillStyle(bootMid, 0.55);
      g.fillRect(cx + 1, footY - 2 - Math.round(legOffset), 1, 3);
      g.fillStyle(bootHigh, 0.38);
      g.fillRect(cx + 2, footY - 2 - Math.round(legOffset), 1, 1);
      g.fillStyle(0x1a0d00, 0.75);
      g.fillRect(cx + 1, footY + 2 - Math.round(legOffset), 6, 1);
      // Front foot
      g.fillStyle(bootBase, 1);
      g.fillRect(cx - 4, footY - 2 + Math.round(legOffset), 5, 4);
      g.fillRect(cx - 5, footY + 1 + Math.round(legOffset), 6, 2);
      g.fillStyle(bootMid, 0.55);
      g.fillRect(cx - 4, footY - 2 + Math.round(legOffset), 1, 3);
      g.fillStyle(bootHigh, 0.38);
      g.fillRect(cx - 3, footY - 2 + Math.round(legOffset), 1, 1);
      g.fillStyle(0x1a0d00, 0.75);
      g.fillRect(cx - 5, footY + 2 + Math.round(legOffset), 6, 1);
    } else {
      const lbx = cx - 7, rbx = cx + 2;
      g.fillStyle(bootBase, 1);
      g.fillRect(lbx, footY - 2 + Math.round(legOffset), 5, 4);
      g.fillRect(lbx, footY + 1 + Math.round(legOffset), 6, 2);
      g.fillRect(rbx, footY - 2 - Math.round(legOffset), 5, 4);
      g.fillRect(rbx, footY + 1 - Math.round(legOffset), 6, 2);
      g.fillStyle(bootMid, 0.50);
      g.fillRect(lbx, footY - 2 + Math.round(legOffset), 1, 3);
      g.fillRect(rbx, footY - 2 - Math.round(legOffset), 1, 3);
      g.fillStyle(bootHigh, 0.30);
      g.fillRect(lbx + 1, footY - 1 + Math.round(legOffset), 2, 1);
      g.fillRect(rbx + 1, footY - 1 - Math.round(legOffset), 2, 1);
      g.fillStyle(0x1a0d00, 0.70);
      g.fillRect(lbx, footY + 2 + Math.round(legOffset), 6, 1);
      g.fillRect(rbx, footY + 2 - Math.round(legOffset), 6, 1);
    }

    // ── Legs — with knee highlight + trouser fold crease ───────────────────
    const bodyY = Math.round(oy + 14 + bobY);
    const legBase = clothShadow;
    const legKnee = this.lighten(clothShadow, 1.18);
    if (dir === 'left' || dir === 'right') {
      g.fillStyle(legBase, 1);
      g.fillRect(cx + 1, bodyY + 10 - Math.round(legOffset), 3, 5);
      g.fillStyle(legKnee, 0.55);
      g.fillRect(cx + 1, bodyY + 11 - Math.round(legOffset), 2, 1);
      g.fillStyle(legBase, 1);
      g.fillRect(cx - 3, bodyY + 10 + Math.round(legOffset), 3, 5);
      g.fillStyle(legKnee, 0.55);
      g.fillRect(cx - 3, bodyY + 11 + Math.round(legOffset), 2, 1);
      g.fillStyle(clothDeep, 0.38);
      g.fillRect(cx - 3, bodyY + 13 + Math.round(legOffset), 3, 1);
    } else {
      g.fillStyle(legBase, 1);
      g.fillRect(cx - 6, bodyY + 10 + Math.round(legOffset), 3, 5);
      g.fillRect(cx + 3, bodyY + 10 - Math.round(legOffset), 3, 5);
      g.fillStyle(legKnee, 0.50);
      g.fillRect(cx - 6, bodyY + 11 + Math.round(legOffset), 2, 1);
      g.fillRect(cx + 3, bodyY + 11 - Math.round(legOffset), 2, 1);
    }

    // ── Burden sack — 3-tone canvas, wrinkle lines, bulge, braided rope ────
    if (dir !== 'left') {
      const bx = dir === 'right' ? cx - 9 : cx + 1;
      const bw = 10, bh = 13;
      const bsy = Math.round(bodyY - 5 + burdenSway);
      // Drop shadow
      g.fillStyle(0x000000, 0.28);
      g.fillRoundedRect(bx + 1, bsy + 2, bw, bh, 2);
      // Sack — 3-tone layered
      g.fillStyle(0x9a8060, 1);
      g.fillRoundedRect(bx, bsy, bw, bh, 2);
      g.fillStyle(0x8b7355, 1);
      g.fillRoundedRect(bx + 2, bsy + 2, bw - 3, bh - 3, 1);
      g.fillStyle(0x6a5840, 1);
      g.fillRect(bx + bw - 3, bsy + 2, 3, bh - 3);
      // Weight bulge at bottom (sack is heavy — bulges downward)
      g.fillStyle(0x7a6347, 1);
      g.fillRoundedRect(bx - 1, bsy + bh - 4, bw + 2, 5, 2);
      // Wrinkle lines — diagonal cross-hatch
      g.lineStyle(1, 0x5a4a32, 0.32);
      g.lineBetween(bx + 2, bsy + 3, bx + 5, bsy + 8);
      g.lineBetween(bx + 4, bsy + 2, bx + 7, bsy + 7);
      g.lineStyle(1, 0xb09870, 0.22);
      g.lineBetween(bx + 1, bsy + 5, bx + 3, bsy + 10);
      // Specular highlight (upper-left)
      g.fillStyle(0xffffff, 0.10);
      g.fillRoundedRect(bx + 1, bsy + 1, 3, 4, 1);
      // Braided rope top
      g.fillStyle(0x4a3a2a, 1);
      g.fillRect(bx + 2, bsy - 1, bw - 4, 3);
      g.fillStyle(0x6a5535, 0.65);
      g.fillRect(bx + 2, bsy - 1, 2, 1);
      g.fillRect(bx + 5, bsy,     2, 1);
      g.fillRect(bx + 3, bsy + 1, 2, 1);
      // Rope knot bump
      g.fillStyle(0x7a6040, 1);
      g.fillRoundedRect(bx + bw / 2 - 2, bsy - 2, 4, 3, 1);
      g.fillStyle(0x8a7050, 0.75);
      g.fillRect(bx + bw / 2 - 1, bsy - 2, 2, 1);
      // Double shoulder strap
      g.lineStyle(1.5, 0x5a4030, 0.65);
      g.lineBetween(cx, bodyY + 2, bx + bw / 2 - 1, bsy);
      g.lineStyle(1, 0x7a6040, 0.45);
      g.lineBetween(cx + 1, bodyY + 2, bx + bw / 2 + 1, bsy);
    }

    // ── Torso / Cloak — 4-tone with fold lines + decorative belt ───────────
    const bodyH = 12;
    const chestY = bodyY - Math.round(breathe);
    g.fillStyle(clothBase, 1);
    g.fillRoundedRect(cx - 6, chestY, 12, bodyH, 2);
    // Light side (left)
    g.fillStyle(clothLight, 0.22);
    g.fillRect(cx - 6, chestY, 3, bodyH - 2);
    // Shadow side (right)
    g.fillStyle(clothDeep, 0.32);
    g.fillRect(cx + 3, chestY, 3, bodyH);
    // Fold lines
    if (dir === 'left' || dir === 'right') {
      g.fillStyle(clothDeep, 0.22);
      g.fillRect(cx - 1, chestY + 2, 1, bodyH - 4);
      g.fillRect(cx + 2, chestY + 3, 1, bodyH - 5);
      g.fillStyle(clothLight, 0.10);
      g.fillRect(cx, chestY + 1, 1, bodyH - 3);
    } else {
      g.fillStyle(clothDeep, 0.28);
      g.fillRect(cx - 1, chestY, 2, 3);  // V-neck shadow
    }
    // Belt
    g.fillStyle(colors.accent, 1);
    g.fillRect(cx - 5, chestY + bodyH - 4, 10, 2);
    g.fillStyle(clothDeep, 0.45);
    g.fillRect(cx - 5, chestY + bodyH - 2, 10, 1);
    // Belt buckle — 4px ornament with inner recess
    g.fillStyle(0xffd080, 1);
    g.fillRect(cx - 2, chestY + bodyH - 4, 4, 2);
    g.fillStyle(0x8b6820, 0.75);
    g.fillRect(cx - 2, chestY + bodyH - 4, 1, 2);
    g.fillRect(cx + 1, chestY + bodyH - 4, 1, 2);
    g.fillStyle(0xffffff, 0.55);
    g.fillRect(cx - 1, chestY + bodyH - 4, 1, 1);

    // ── Cross badge — 3×5 form with radiate light lines ────────────────────
    if (dir === 'down' || dir === 'right') {
      const bx2 = dir === 'right' ? cx + 2 : cx - 1;
      const by2 = chestY + 2;
      const glowPulse = 0.18 + Math.sin(phase4) * 0.10;
      // 4 diagonal light rays
      g.lineStyle(1, 0xffe880, glowPulse * 1.4);
      for (const [dx, dy] of [[-1,-1],[1,-1],[-1,1],[1,1]] as [number,number][]) {
        g.lineBetween(bx2 + 1, by2 + 2, bx2 + 1 + dx * 4, by2 + 2 + dy * 4);
      }
      g.fillStyle(0xffd080, glowPulse);
      g.fillCircle(bx2 + 1, by2 + 2, 5);
      // Cross — vertical + horizontal bars
      g.fillStyle(0xffd080, 1);
      g.fillRect(bx2 + 1, by2,     1, 5);   // vertical
      g.fillRect(bx2 - 1, by2 + 1, 5, 1);   // horizontal
      // Shadow side
      g.fillStyle(0xa07820, 0.48);
      g.fillRect(bx2 + 2, by2,     1, 5);
      g.fillRect(bx2 - 1, by2 + 2, 5, 1);
      // Bright center pixel
      g.fillStyle(0xffffff, 0.82);
      g.fillRect(bx2 + 1, by2 + 1, 1, 1);
    }

    // ── Arms — with hand detail ─────────────────────────────────────────────
    if (dir === 'down' || dir === 'up') {
      g.fillStyle(clothBase, 1);
      g.fillRect(cx - 9, chestY + 1 + Math.round(armSwing), 3, 8);
      g.fillStyle(clothShadow, 0.42);
      g.fillRect(cx - 7, chestY + 1 + Math.round(armSwing), 1, 8);
      g.fillStyle(skinBase, 1);
      g.fillRect(cx - 9, chestY + 9 + Math.round(armSwing), 3, 3);
      g.fillStyle(skinShadow, 0.50);
      g.fillRect(cx - 8, chestY + 11 + Math.round(armSwing), 2, 1);
      g.fillStyle(clothBase, 1);
      g.fillRect(cx + 6, chestY + 1 - Math.round(armSwing), 3, 8);
      g.fillStyle(clothShadow, 0.42);
      g.fillRect(cx + 8, chestY + 1 - Math.round(armSwing), 1, 8);
      g.fillStyle(skinBase, 1);
      g.fillRect(cx + 6, chestY + 9 - Math.round(armSwing), 3, 3);
      g.fillStyle(skinShadow, 0.50);
      g.fillRect(cx + 6, chestY + 11 - Math.round(armSwing), 2, 1);
    } else {
      const ax = dir === 'right' ? cx - 8 : cx + 5;
      g.fillStyle(clothBase, 1);
      g.fillRect(ax, chestY + 1 + Math.round(armSwing), 3, 8);
      g.fillStyle(clothShadow, 0.38);
      g.fillRect(ax + 2, chestY + 1 + Math.round(armSwing), 1, 8);
      g.fillStyle(skinBase, 1);
      g.fillRect(ax, chestY + 9 + Math.round(armSwing), 3, 3);
      g.fillStyle(skinShadow, 0.45);
      g.fillRect(ax, chestY + 11 + Math.round(armSwing), 2, 1);
    }

    // ── Head — 5-tone skin ramp, brows, detailed eyes, nose, burdened mouth ─
    const headY = Math.round(oy + 4 + bobY);
    // Neck with shadow
    g.fillStyle(skinBase, 1);
    g.fillRect(cx - 2, headY + 10, 4, 3);
    g.fillStyle(skinShadow, 0.38);
    g.fillRect(cx + 1, headY + 10, 1, 3);
    // Head silhouette base
    g.fillStyle(0x111111, 0.78);
    g.fillRoundedRect(cx - 5, headY, 10, 11, 2);
    // Skin base
    g.fillStyle(skinBase, 1);
    g.fillRect(cx - 4, headY, 8, 11);
    g.fillRect(cx - 5, headY + 1, 10, 9);
    // Forehead key light
    g.fillStyle(skinLight, 0.42);
    g.fillRect(cx - 2, headY + 1, 4, 2);
    // Cheekbone highlights
    g.fillStyle(skinLight, 0.22);
    g.fillRect(cx - 3, headY + 5, 2, 2);
    g.fillRect(cx + 1, headY + 5, 2, 2);
    // Right-side shadow (rim light from left)
    g.fillStyle(skinShadow, 0.36);
    g.fillRect(cx + 2, headY + 2, 3, 7);
    // Jaw shadow
    g.fillStyle(skinDeep, 0.28);
    g.fillRect(cx - 3, headY + 9, 7, 2);
    // Hair band
    g.fillStyle(colors.hair, 1);
    g.fillRect(cx - 4, headY, 8, 2);

    if (dir === 'down') {
      // Eyebrows
      g.fillStyle(colors.hair, 0.82);
      g.fillRect(cx - 4, headY + 3, 3, 1);
      g.fillRect(cx + 1, headY + 3, 3, 1);
      // Burdened brow furrow (inner brow pixel raised)
      g.fillStyle(skinDeep, 0.35);
      g.fillRect(cx - 2, headY + 3, 1, 2);
      g.fillRect(cx + 1, headY + 3, 1, 2);
      // Eye whites (3×3)
      g.fillStyle(0xfff8f0, 1);
      g.fillRect(cx - 4, headY + 4, 3, 3);
      g.fillRect(cx + 1, headY + 4, 3, 3);
      // Eyelid top shadow
      g.fillStyle(0x000000, 0.28);
      g.fillRect(cx - 4, headY + 4, 3, 1);
      g.fillRect(cx + 1, headY + 4, 3, 1);
      // Iris (colored)
      g.fillStyle(colors.eye, 0.88);
      g.fillRect(cx - 4, headY + 5, 3, 2);
      g.fillRect(cx + 1, headY + 5, 3, 2);
      // Pupil (dark center)
      g.fillStyle(0x111122, 1);
      g.fillRect(cx - 3, headY + 5, 1, 2);
      g.fillRect(cx + 2, headY + 5, 1, 2);
      // Dual specular dots
      g.fillStyle(0xffffff, 0.88);
      g.fillRect(cx - 4, headY + 5, 1, 1);   // left eye top-left
      g.fillRect(cx + 3, headY + 6, 1, 1);   // right eye bottom-right
      // Eyelash bottom line
      g.fillStyle(0x000000, 0.22);
      g.fillRect(cx - 4, headY + 7, 3, 1);
      g.fillRect(cx + 1, headY + 7, 3, 1);
      // Nose — tip + nostrils
      g.fillStyle(skinShadow, 0.65);
      g.fillRect(cx - 1, headY + 7, 2, 1);
      g.fillStyle(skinDeep, 0.58);
      g.fillRect(cx - 2, headY + 8, 1, 1);
      g.fillRect(cx + 1, headY + 8, 1, 1);
      // Mouth — burdened slight frown
      g.fillStyle(skinDeep, 0.78);
      g.fillRect(cx - 2, headY + 9, 5, 1);
      // Downturned corners
      g.fillStyle(skinDeep, 0.55);
      g.fillRect(cx - 2, headY + 10, 1, 1);
      g.fillRect(cx + 2, headY + 10, 1, 1);

    } else if (dir !== 'up') {
      const isR = dir === 'right';
      const eyeX = isR ? cx + 1 : cx - 4;
      const eDir = isR ? 1 : 0;
      // Brow
      g.fillStyle(colors.hair, 0.78);
      g.fillRect(eyeX, headY + 3, 3, 1);
      // Brow furrow dot
      g.fillStyle(skinDeep, 0.32);
      g.fillRect(isR ? eyeX : eyeX + 2, headY + 3, 1, 2);
      // Eye
      g.fillStyle(0xfff8f0, 1);
      g.fillRect(eyeX, headY + 4, 3, 3);
      g.fillStyle(0x000000, 0.26);
      g.fillRect(eyeX, headY + 4, 3, 1);
      g.fillStyle(colors.eye, 0.88);
      g.fillRect(eyeX + eDir, headY + 5, 2, 2);
      g.fillStyle(0x111122, 1);
      g.fillRect(eyeX + eDir, headY + 5, 1, 2);
      g.fillStyle(0xffffff, 0.84);
      g.fillRect(eyeX + (isR ? 2 : 0), headY + 5, 1, 1);
      // Nose bridge + nostril
      g.fillStyle(skinShadow, 0.52);
      g.fillRect(isR ? cx + 4 : cx - 5, headY + 6, 1, 2);
      g.fillStyle(skinDeep, 0.50);
      g.fillRect(isR ? cx + 4 : cx - 5, headY + 8, 1, 1);
      // Mouth — burdened frown
      const mx = isR ? cx + 2 : cx - 4;
      g.fillStyle(skinDeep, 0.72);
      g.fillRect(mx, headY + 9, 3, 1);
      g.fillStyle(skinDeep, 0.45);
      g.fillRect(isR ? mx + 2 : mx, headY + 10, 1, 1);

    } else {
      // Back of head
      g.fillStyle(colors.hair, 1);
      g.fillRect(cx - 4, headY, 8, 6);
      g.fillStyle(this.darken(colors.hair, 0.72), 0.45);
      g.fillRect(cx + 1, headY + 1, 3, 5);
    }

    // ── Pilgrim Hat — textured crown, 3-tone, hatband ornament ─────────────
    const hatBase = colors.accessory ?? 0x7a5c38;
    const hatDark = this.darken(hatBase, 0.58);
    const hatMid  = this.darken(hatBase, 0.78);
    const hatHigh = this.lighten(hatBase, 1.18);
    // Brim
    g.fillStyle(hatDark, 1);
    g.fillRect(cx - 8, headY - 2, 16, 3);
    g.fillStyle(hatHigh, 0.16);
    g.fillRect(cx - 8, headY - 2, 16, 1);          // brim top highlight
    g.fillStyle(0x000000, 0.20);
    g.fillRect(cx - 8, headY,     16, 1);           // brim bottom shadow
    g.fillStyle(0x000000, 0.10);
    g.fillRect(cx - 7, headY + 1, 14, 1);           // underside depth
    // Crown
    g.fillStyle(hatBase, 1);
    g.fillRect(cx - 5, headY - 9, 10, 8);
    g.fillStyle(hatHigh, 0.20);
    g.fillRect(cx - 5, headY - 9, 2, 7);            // left light face
    g.fillStyle(hatHigh, 0.08);
    g.fillRect(cx - 3, headY - 9, 1, 7);
    g.fillStyle(hatDark, 0.42);
    g.fillRect(cx + 3, headY - 9, 2, 7);            // right shadow face
    g.fillStyle(hatHigh, 0.18);
    g.fillRect(cx - 4, headY - 9, 8, 1);            // crown top edge highlight
    // Hatband
    g.fillStyle(hatDark, 1);
    g.fillRect(cx - 5, headY - 2, 10, 1);
    g.fillStyle(0xffd080, 0.68);
    g.fillRect(cx, headY - 2, 2, 1);                // hatband ornament
    // Crown texture crosshatch (subtle dithering for worn look)
    g.fillStyle(hatMid, 0.16);
    for (let i = 0; i < 3; i++) {
      g.fillRect(cx - 4 + i * 3, headY - 8 + i, 1, 1);
      g.fillRect(cx - 3 + i * 3, headY - 6 + i, 1, 1);
    }

    // ── Silhouette outline pass — strong edge for background separation ─────
    g.lineStyle(1.2, 0x080510, 0.72);
    g.strokeRoundedRect(cx - 6, Math.round(oy + 14 + bobY), 12, 13, 2);
    g.strokeRoundedRect(cx - 5, headY - 9, 10, 20, 1);  // head + hat combined
  }

  // ─────────────────────────────────────────────────────────────────────────
  // EVANGELIST — tall, thin, long gray robe, pointing hand, beard, staff
  // ─────────────────────────────────────────────────────────────────────────
  private static drawEvangelist(
    g: Phaser.GameObjects.Graphics,
    ox: number, oy: number,
    dir: DrawDir,
    colors: BodyColors,
    anim: 'idle' | 'walk',
    frame: number,
  ): void {
    const cx = ox + SPRITE_SIZE / 2;

    // Evangelist: dignified, minimal movement. Staff plants on alternate steps.
    let bobY = 0;
    let armSwing = 0;
    let breathe = 0;
    let staffPlant = 0;  // staff tip y-offset (plants down on each step)
    if (anim === 'idle') {
      bobY    = Math.sin((frame / 4) * Math.PI * 2) * 0.6;  // barely moves — authority
      breathe = Math.sin((frame / 2) * Math.PI * 2) * 0.4;
    } else {
      const phase = (frame / 6) * Math.PI * 2;
      bobY      = Math.abs(Math.sin(phase)) * -1.3;   // gentle, dignified step
      armSwing  = Math.sin(phase) * 2;                // minimal arm sway
      // Staff plants on the ground every other step
      staffPlant = Math.abs(Math.sin(phase)) * 1.2;
    }

    // Shadow
    g.fillStyle(0x000000, 0.3);
    g.fillEllipse(cx, oy + 30, 12, 4);

    // Staff (drawn first — behind body) — plants on ground with each step
    const staffX = dir === 'right' ? cx + 10 : cx - 10;
    g.lineStyle(3, 0x6a4a20, 0.9);
    g.lineBetween(staffX, Math.round(oy + 4 + bobY) - 4, staffX, oy + 29 + Math.round(staffPlant));
    // Staff grain lines
    g.lineStyle(1, 0x8a6a40, 0.3);
    g.lineBetween(staffX - 1, Math.round(oy + 4 + bobY), staffX - 1, oy + 27 + Math.round(staffPlant));
    g.lineStyle(1, 0x4a2a10, 0.25);
    g.lineBetween(staffX + 1, Math.round(oy + 4 + bobY), staffX + 1, oy + 28 + Math.round(staffPlant));
    // Staff knob top — golden orb
    g.fillStyle(colors.accessory ?? 0xd4a853, 1);
    g.fillCircle(staffX, Math.round(oy + 4 + bobY) - 4, 2.5);
    g.fillStyle(0xffd080, 0.55);
    g.fillCircle(staffX - 0.7, Math.round(oy + 4 + bobY) - 5.5, 1.2);
    g.fillStyle(this.darken(0xd4a853, 0.3), 0.45);
    g.fillCircle(staffX + 0.7, Math.round(oy + 4 + bobY) - 3, 0.9);

    // === Robe (long, narrow, gray-white) ===
    const bodyY = Math.round(oy + 13 + bobY);
    const chestEv = bodyY - Math.round(breathe);   // breathing chest offset
    const robeColor = 0xd0c8c0;
    const robeDark = this.darken(robeColor, 0.72);

    // Robe body — slightly narrower than generic, breathing chest
    g.fillStyle(robeColor, 1);
    g.fillRoundedRect(cx - 5, chestEv, 10, 16, 2);
    // Robe vertical fold lines (3 folds)
    g.fillStyle(robeDark, 0.4);
    g.fillRect(cx - 3, chestEv + 2, 1, 13);
    g.fillRect(cx, chestEv + 1, 1, 14);
    g.fillRect(cx + 2, chestEv + 3, 1, 12);
    // Robe dark sides
    g.fillStyle(robeDark, 0.55);
    g.fillRect(cx - 5, chestEv, 2, 16);
    g.fillRect(cx + 3, chestEv, 2, 16);
    // Center highlight
    g.fillStyle(0xffffff, 0.1);
    g.fillRect(cx - 2, chestEv + 1, 3, 14);

    // === Feet (sandal hints at robe hem) ===
    g.fillStyle(0x8a6a50, 1);
    if (dir === 'left' || dir === 'right') {
      g.fillRect(cx - 2, oy + 28, 3, 2);
      g.fillRect(cx + 1, oy + 28, 3, 2);
    } else {
      g.fillRect(cx - 4, oy + 28, 3, 2);
      g.fillRect(cx + 1, oy + 28, 3, 2);
    }

    // === Arms ===
    // Left arm: hangs or slight sway — uses chestEv for breathing coherence
    if (dir === 'down' || dir === 'up') {
      g.fillStyle(robeColor, 1);
      g.fillRect(cx - 8, chestEv + 1 - Math.round(armSwing), 3, 7);
      g.fillStyle(colors.skin, 1);
      g.fillRect(cx - 8, chestEv + 8 - Math.round(armSwing), 3, 2);
    }

    // Pointing arm (right arm, extended outward) — Evangelist's signature gesture
    if (dir === 'down' || (dir === 'left' && anim !== 'walk') || dir === 'right') {
      g.fillStyle(robeColor, 1);
      const ptArmX = dir === 'left' ? cx - 8 : cx + 5;
      const ptArmY = chestEv + 1;
      g.fillRect(ptArmX, ptArmY, 3, 5);
      // Forearm extends further out
      g.fillStyle(colors.skin, 1);
      if (dir === 'right' || dir === 'down') {
        g.fillRect(cx + 8, ptArmY + 1, 4, 2);
        // Pointing finger pixel
        g.fillRect(cx + 12, ptArmY + 1, 2, 1);
      } else {
        g.fillRect(cx - 11, ptArmY + 1, 4, 2);
        g.fillRect(cx - 13, ptArmY + 1, 2, 1);
      }
    }

    // === Head (bald, oval) ===
    const headY = Math.round(oy + 3 + bobY);
    // Head outline
    g.fillStyle(0x111111, 0.8);
    g.fillRect(cx - 4, headY, 8, 10);
    g.fillRect(cx - 5, headY + 1, 10, 8);
    // Skin
    g.fillStyle(colors.skin, 1);
    g.fillRect(cx - 3, headY, 6, 10);
    g.fillRect(cx - 4, headY + 1, 8, 8);
    // Bald highlight
    g.fillStyle(0xffffff, 0.18);
    g.fillRect(cx - 2, headY + 1, 3, 2);
    // Right-side shadow
    g.fillStyle(this.darken(colors.skin, 0.8), 0.35);
    g.fillRect(cx + 1, headY + 2, 3, 6);

    // Face details
    if (dir !== 'up') {
      if (dir === 'down') {
        // Eyes — wise golden tone
        g.fillStyle(0xffffff, 1);
        g.fillRect(cx - 3, headY + 4, 2, 2);
        g.fillRect(cx + 1, headY + 4, 2, 2);
        g.fillStyle(colors.eye, 1);
        g.fillRect(cx - 3, headY + 4, 2, 2);
        g.fillRect(cx + 1, headY + 4, 2, 2);
        // Small nose
        g.fillStyle(this.darken(colors.skin, 0.75), 0.9);
        g.fillRect(cx - 1, headY + 6, 1, 1);
        // Stern mouth (tight line)
        g.fillStyle(this.darken(colors.skin, 0.6), 1);
        g.fillRect(cx - 2, headY + 8, 4, 1);
        // Beard — white V-shape below chin
        g.fillStyle(0xd8d0c8, 1);
        g.fillRect(cx - 2, headY + 10, 4, 3);
        g.fillStyle(0xbcb8b0, 0.7);
        g.fillRect(cx - 3, headY + 11, 6, 2);
        // Beard taper
        g.fillStyle(0xd8d0c8, 1);
        g.fillRect(cx - 1, headY + 13, 2, 2);
      } else {
        const eyeX = dir === 'right' ? cx + 1 : cx - 3;
        g.fillStyle(0xffffff, 1);
        g.fillRect(eyeX, headY + 4, 2, 2);
        g.fillStyle(colors.eye, 1);
        g.fillRect(eyeX + (dir === 'right' ? 1 : 0), headY + 4, 1, 2);
        // Nose
        g.fillStyle(this.darken(colors.skin, 0.78), 0.8);
        g.fillRect(dir === 'right' ? cx + 4 : cx - 5, headY + 6, 1, 1);
        // Beard (side profile — rectangle forward)
        g.fillStyle(0xd0c8c0, 1);
        g.fillRect(dir === 'right' ? cx + 1 : cx - 5, headY + 10, 4, 4);
        g.fillStyle(0xffffff, 0.4);
        g.fillRect(dir === 'right' ? cx + 2 : cx - 4, headY + 11, 2, 3);
      }
    }

    // Hooded robe collar / neckline
    g.fillStyle(this.darken(robeColor, 0.8), 0.6);
    g.fillRect(cx - 3, bodyY, 6, 3);
    g.fillStyle(robeColor, 1);
    g.fillRect(cx - 2, bodyY, 4, 2);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // INTERPRETER — rounder build, dark purple robe, dome hat, open book
  // ─────────────────────────────────────────────────────────────────────────
  private static drawInterpreter(
    g: Phaser.GameObjects.Graphics,
    ox: number, oy: number,
    dir: DrawDir,
    colors: BodyColors,
    anim: 'idle' | 'walk',
    frame: number,
  ): void {
    const cx = ox + SPRITE_SIZE / 2;

    let bobY = 0;
    let armSwing = 0;
    if (anim === 'idle') {
      bobY = Math.sin((frame / 4) * Math.PI * 2) * 0.9;
    } else {
      const phase = (frame / 6) * Math.PI * 2;
      bobY = Math.abs(Math.sin(phase)) * -1.5;
      armSwing = Math.sin(phase) * 3.5;
    }

    // Shadow — rounder character = wider shadow
    g.fillStyle(0x000000, 0.3);
    g.fillEllipse(cx, oy + 30, 16, 5);

    // === Robe (rounder, wider = 13px) ===
    const bodyY = Math.round(oy + 13 + bobY);
    const robeColor = 0x4a3a7a; // dark purple
    const robeDark = this.darken(robeColor, 0.65);

    g.fillStyle(robeColor, 1);
    g.fillRoundedRect(cx - 6, bodyY, 12, 15, 3);
    // Vertical robe folds
    g.fillStyle(robeDark, 0.45);
    g.fillRect(cx - 4, bodyY + 2, 1, 12);
    g.fillRect(cx + 1, bodyY + 1, 1, 13);
    g.fillRect(cx + 3, bodyY + 3, 1, 10);
    // Dark sides
    g.fillStyle(robeDark, 0.6);
    g.fillRect(cx - 6, bodyY, 2, 15);
    g.fillRect(cx + 4, bodyY, 2, 15);
    // Center highlight
    g.fillStyle(0xffffff, 0.08);
    g.fillRect(cx - 2, bodyY + 2, 4, 13);
    // Accent trim at collar
    g.fillStyle(colors.accent, 0.85);
    g.fillRect(cx - 4, bodyY, 8, 2);

    // === Feet ===
    g.fillStyle(0x5a4a3a, 1);
    if (dir === 'left' || dir === 'right') {
      const lo = Math.round(armSwing * 0.7);
      g.fillRect(cx - 3, oy + 27 + lo, 4, 3);
      g.fillRect(cx + 1, oy + 27 - lo, 4, 3);
    } else {
      const lo = Math.round(armSwing * 0.7);
      g.fillRect(cx - 5, oy + 27 + lo, 4, 3);
      g.fillRect(cx + 1, oy + 27 - lo, 4, 3);
    }

    // === Book / Scroll prop (held in front) ===
    if (dir === 'down' || dir === 'right' || dir === 'left') {
      const bookX = dir === 'left' ? cx - 10 : (dir === 'right' ? cx + 3 : cx - 4);
      const bookY = bodyY + 4;
      // Book shadow
      g.fillStyle(0x000000, 0.2);
      g.fillRect(bookX + 1, bookY + 1, 8, 7);
      // Book cover
      g.fillStyle(colors.accessory ?? 0xc4a870, 1);
      g.fillRect(bookX, bookY, 8, 7);
      // Open pages (white)
      g.fillStyle(0xf5f0e8, 1);
      g.fillRect(bookX + 1, bookY + 1, 6, 5);
      // Page spine
      g.fillStyle(0x888060, 0.7);
      g.fillRect(bookX + 3, bookY, 1, 7);
      // Text lines on pages
      g.fillStyle(0x888880, 0.35);
      g.fillRect(bookX + 1, bookY + 2, 2, 1);
      g.fillRect(bookX + 1, bookY + 4, 2, 1);
      g.fillRect(bookX + 4, bookY + 2, 2, 1);
      g.fillRect(bookX + 4, bookY + 4, 2, 1);
    }

    // === Arms ===
    if (dir === 'down' || dir === 'up') {
      g.fillStyle(robeColor, 1);
      g.fillRect(cx - 9, bodyY + 2 + Math.round(armSwing), 3, 7);
      g.fillRect(cx + 6, bodyY + 2 - Math.round(armSwing), 3, 7);
      g.fillStyle(colors.skin, 1);
      g.fillRect(cx - 9, bodyY + 9 + Math.round(armSwing), 3, 2);
      g.fillRect(cx + 6, bodyY + 9 - Math.round(armSwing), 3, 2);
    } else {
      const armX = dir === 'right' ? cx - 8 : cx + 5;
      g.fillStyle(robeColor, 1);
      g.fillRect(armX, bodyY + 2 + Math.round(armSwing), 3, 7);
      g.fillStyle(colors.skin, 1);
      g.fillRect(armX, bodyY + 9 + Math.round(armSwing), 3, 2);
    }

    // === Head (rounder, medium — use fillRect grid) ===
    const headY = Math.round(oy + 4 + bobY);
    // Outline
    g.fillStyle(0x111111, 0.8);
    g.fillRect(cx - 5, headY, 10, 9);
    g.fillRect(cx - 6, headY + 1, 12, 7);
    // Skin
    g.fillStyle(colors.skin, 1);
    g.fillRect(cx - 4, headY, 8, 9);
    g.fillRect(cx - 5, headY + 1, 10, 7);
    // Right shadow
    g.fillStyle(this.darken(colors.skin, 0.8), 0.3);
    g.fillRect(cx + 2, headY + 2, 3, 5);
    // Forehead highlight
    g.fillStyle(0xffffff, 0.12);
    g.fillRect(cx - 3, headY + 1, 3, 2);

    // Face
    if (dir !== 'up') {
      if (dir === 'down') {
        // Eyes — with spectacle hint (tiny highlight arcs)
        g.fillStyle(0xffffff, 1);
        g.fillRect(cx - 4, headY + 3, 3, 3);
        g.fillRect(cx + 1, headY + 3, 3, 3);
        g.fillStyle(colors.eye, 1);
        g.fillRect(cx - 3, headY + 4, 2, 2);
        g.fillRect(cx + 2, headY + 4, 2, 2);
        // Spectacle glint
        g.fillStyle(0xffffff, 0.6);
        g.fillRect(cx - 4, headY + 3, 1, 1);
        g.fillRect(cx + 1, headY + 3, 1, 1);
        // Nose
        g.fillStyle(this.darken(colors.skin, 0.78), 0.9);
        g.fillRect(cx - 1, headY + 6, 2, 1);
        // Mouth (warm, slightly open curious expression)
        g.fillStyle(this.darken(colors.skin, 0.62), 1);
        g.fillRect(cx - 2, headY + 8, 4, 1);
      } else {
        const eyeX = dir === 'right' ? cx + 1 : cx - 4;
        g.fillStyle(0xffffff, 1);
        g.fillRect(eyeX, headY + 3, 3, 3);
        g.fillStyle(colors.eye, 1);
        g.fillRect(eyeX + (dir === 'right' ? 1 : 0), headY + 4, 2, 2);
        g.fillStyle(0xffffff, 0.55);
        g.fillRect(eyeX, headY + 3, 1, 1);
        // Nose
        g.fillStyle(this.darken(colors.skin, 0.78), 0.8);
        g.fillRect(dir === 'right' ? cx + 4 : cx - 5, headY + 6, 1, 1);
        // Mouth
        const mouthX = dir === 'right' ? cx + 1 : cx - 3;
        g.fillStyle(this.darken(colors.skin, 0.65), 1);
        g.fillRect(mouthX, headY + 8, 2, 1);
      }
    } else {
      // Back view
      g.fillStyle(colors.hair, 1);
      g.fillRect(cx - 4, headY, 8, 5);
    }

    // === Dome hat (brown-black, round) ===
    const hatBase = 0x2a1e14;
    const hatMid = 0x3a2a1e;
    // Brim
    g.fillStyle(hatBase, 1);
    g.fillRect(cx - 7, headY - 1, 14, 2);
    // Dome crown — stacked width rows for round shape
    g.fillStyle(hatMid, 1);
    g.fillRect(cx - 6, headY - 3, 12, 3);
    g.fillRect(cx - 5, headY - 6, 10, 4);
    g.fillRect(cx - 4, headY - 8, 8, 3);
    // Top cap
    g.fillStyle(hatBase, 1);
    g.fillRect(cx - 3, headY - 9, 6, 2);
    // Hat highlight
    g.fillStyle(0xffffff, 0.1);
    g.fillRect(cx - 5, headY - 8, 2, 6);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FAITHFUL — similar to Christian but lighter cloak, no burden, upright
  // ─────────────────────────────────────────────────────────────────────────
  private static drawFaithful(
    g: Phaser.GameObjects.Graphics,
    ox: number, oy: number,
    dir: DrawDir,
    colors: BodyColors,
    anim: 'idle' | 'walk',
    frame: number,
  ): void {
    const cx = ox + SPRITE_SIZE / 2;

    let bobY = 0;
    let legOffset = 0;
    let armSwing = 0;
    if (anim === 'idle') {
      bobY = Math.sin((frame / 4) * Math.PI * 2) * 1.0;
    } else {
      const phase = (frame / 6) * Math.PI * 2;
      bobY = Math.abs(Math.sin(phase)) * -1.8;
      legOffset = Math.sin(phase) * 5;
      armSwing = Math.sin(phase) * 4;
    }

    // Shadow
    g.fillStyle(0x000000, 0.32);
    g.fillEllipse(cx, oy + 29, 13, 4);
    g.fillStyle(0x000000, 0.1);
    g.fillEllipse(cx, oy + 29, 18, 5);

    // === Boots ===
    const footY = Math.round(oy + 26 + bobY);
    const bootColor = 0x4a3520;
    g.fillStyle(bootColor, 1);
    if (dir === 'left' || dir === 'right') {
      g.fillRect(cx - 3, footY - 2 + Math.round(legOffset), 4, 5);
      g.fillRect(cx + 1, footY - 2 - Math.round(legOffset), 4, 5);
    } else {
      g.fillRect(cx - 6, footY - 2 + Math.round(legOffset), 4, 5);
      g.fillRect(cx + 2, footY - 2 - Math.round(legOffset), 4, 5);
    }

    // === Legs ===
    const legColor = this.darken(colors.clothing, 0.75);
    const bodyY = Math.round(oy + 14 + bobY);
    if (dir === 'left' || dir === 'right') {
      g.fillStyle(legColor, 1);
      g.fillRect(cx - 3, bodyY + 10 + Math.round(legOffset), 3, 4);
      g.fillRect(cx + 1, bodyY + 10 - Math.round(legOffset), 3, 4);
    } else {
      g.fillStyle(legColor, 1);
      g.fillRect(cx - 5, bodyY + 10 + Math.round(legOffset), 3, 4);
      g.fillRect(cx + 2, bodyY + 10 - Math.round(legOffset), 3, 4);
    }

    // === Torso — tan/brown cloak, more upright posture ===
    const bodyH = 11;
    // Cloak base (lighter brown-tan vs Christian's darker tone)
    g.fillStyle(colors.clothing, 1);
    g.fillRoundedRect(cx - 5, bodyY, 10, bodyH, 2);
    // Cloak fold (side views)
    if (dir === 'left' || dir === 'right') {
      g.fillStyle(0x000000, 0.12);
      g.fillRect(cx - 1, bodyY + 2, 1, bodyH - 4);
    }
    // Cloak dark sides
    g.fillStyle(this.darken(colors.clothing, 0.72), 0.5);
    g.fillRect(cx - 5, bodyY, 2, bodyH);
    g.fillRect(cx + 3, bodyY, 2, bodyH);
    // Center highlight
    g.fillStyle(0xffffff, 0.09);
    g.fillRect(cx - 2, bodyY + 1, 4, bodyH - 2);
    // Belt
    g.fillStyle(colors.accent, 0.9);
    g.fillRect(cx - 4, bodyY + bodyH - 4, 8, 2);
    // Belt buckle
    g.fillStyle(0xffd080, 0.85);
    g.fillRect(cx - 1, bodyY + bodyH - 4, 2, 2);
    // Collar contrast border (hooded style)
    g.lineStyle(1, this.darken(colors.clothing, 0.55), 0.5);
    g.strokeRoundedRect(cx - 5, bodyY, 10, bodyH, 2);

    // === Arms ===
    if (dir === 'down' || dir === 'up') {
      g.fillStyle(colors.clothing, 1);
      g.fillRect(cx - 8, bodyY + 1 + Math.round(armSwing), 3, 8);
      g.fillRect(cx + 5, bodyY + 1 - Math.round(armSwing), 3, 8);
      g.fillStyle(colors.skin, 1);
      g.fillRect(cx - 8, bodyY + 9 + Math.round(armSwing), 3, 2);
      g.fillRect(cx + 5, bodyY + 9 - Math.round(armSwing), 3, 2);
    } else {
      const armX = dir === 'right' ? cx - 7 : cx + 4;
      g.fillStyle(colors.clothing, 1);
      g.fillRect(armX, bodyY + 1 + Math.round(armSwing), 3, 8);
      g.fillStyle(colors.skin, 1);
      g.fillRect(armX, bodyY + 9 + Math.round(armSwing), 3, 2);
    }

    // === Head ===
    const headY = Math.round(oy + 5 + bobY);
    // Neck
    g.fillStyle(colors.skin, 1);
    g.fillRect(cx - 2, headY + 9, 4, 3);
    // Outline
    g.fillStyle(0x111111, 0.82);
    g.fillRect(cx - 5, headY, 10, 10);
    g.fillRect(cx - 4, headY - 1, 8, 12);
    // Skin
    g.fillStyle(colors.skin, 1);
    g.fillRect(cx - 4, headY, 8, 10);
    g.fillRect(cx - 5, headY + 1, 10, 8);
    // Shadow/highlight
    g.fillStyle(this.darken(colors.skin, 0.82), 0.35);
    g.fillRect(cx + 2, headY + 2, 3, 6);
    g.fillStyle(0xffffff, 0.1);
    g.fillRect(cx - 3, headY + 1, 3, 2);
    // Hair
    g.fillStyle(colors.hair, 1);
    g.fillRect(cx - 4, headY, 8, 3);
    // Hood framing face (hooded style from config)
    g.fillStyle(colors.clothing, 0.75);
    g.fillRect(cx - 5, headY - 1, 10, 3);
    g.fillRect(cx - 5, headY + 1, 2, 8);
    g.fillRect(cx + 3, headY + 1, 2, 8);

    // Face
    if (dir !== 'up') {
      if (dir === 'down') {
        g.fillStyle(0xffffff, 1);
        g.fillRect(cx - 4, headY + 4, 3, 3);
        g.fillRect(cx + 1, headY + 4, 3, 3);
        g.fillStyle(colors.eye, 1);
        g.fillRect(cx - 3, headY + 5, 2, 2);
        g.fillRect(cx + 2, headY + 5, 2, 2);
        g.fillStyle(0xffffff, 0.8);
        g.fillRect(cx - 2, headY + 5, 1, 1);
        g.fillRect(cx + 3, headY + 5, 1, 1);
        // Nose
        g.fillStyle(this.darken(colors.skin, 0.78), 0.8);
        g.fillRect(cx - 1, headY + 7, 1, 1);
        // Mouth — slight smile (faithful and hopeful)
        g.fillStyle(this.darken(colors.skin, 0.65), 1);
        g.fillRect(cx - 2, headY + 8, 4, 1);
        // Smile pixel (corner highlights)
        g.fillStyle(this.darken(colors.skin, 0.58), 0.6);
        g.fillRect(cx - 2, headY + 8, 1, 1);
        g.fillRect(cx + 2, headY + 8, 1, 1);
      } else {
        const eyeX = dir === 'right' ? cx + 1 : cx - 4;
        g.fillStyle(0xffffff, 1);
        g.fillRect(eyeX, headY + 4, 3, 3);
        g.fillStyle(colors.eye, 1);
        g.fillRect(eyeX + (dir === 'right' ? 1 : 0), headY + 5, 2, 2);
        g.fillStyle(0xffffff, 0.8);
        g.fillRect(eyeX + (dir === 'right' ? 2 : 0), headY + 5, 1, 1);
        g.fillStyle(this.darken(colors.skin, 0.78), 0.7);
        g.fillRect(dir === 'right' ? cx + 4 : cx - 5, headY + 7, 1, 1);
        const mouthX = dir === 'right' ? cx + 2 : cx - 3;
        g.fillStyle(this.darken(colors.skin, 0.65), 1);
        g.fillRect(mouthX, headY + 8, 2, 1);
      }
    } else {
      g.fillStyle(colors.clothing, 0.9);
      g.fillRect(cx - 5, headY, 10, 6);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // GENERIC — fallback for all other characters (obstinate, pliable, etc.)
  // ─────────────────────────────────────────────────────────────────────────
  // ─────────────────────────────────────────────────────────────────────────
  // HOPEFUL — young pilgrim companion, energetic green, bright eyes
  // ─────────────────────────────────────────────────────────────────────────
  private static drawHopeful(
    g: Phaser.GameObjects.Graphics,
    ox: number, oy: number,
    dir: DrawDir,
    colors: BodyColors,
    anim: 'idle' | 'walk',
    frame: number,
  ): void {
    const cx = ox + SPRITE_SIZE / 2;

    let bobY = 0, legOffset = 0, armSwing = 0;
    if (anim === 'idle') {
      bobY = Math.sin((frame / 4) * Math.PI * 2) * 1.2; // bouncier idle
    } else {
      const phase = (frame / 6) * Math.PI * 2;
      bobY = Math.abs(Math.sin(phase)) * -2.0;           // energetic step dip
      legOffset = Math.sin(phase) * 5;
      armSwing = Math.sin(phase) * 5;                    // wide arm swing
    }

    // Shadow (lighter — he's upbeat)
    g.fillStyle(0x000000, 0.25);
    g.fillEllipse(cx, oy + 29, 12, 4);

    // Boots (slightly shorter than Faithful — younger)
    const footY = Math.round(oy + 26 + bobY);
    g.fillStyle(0x6a5530, 1);
    if (dir === 'left' || dir === 'right') {
      g.fillRect(cx - 3, footY - 1 + Math.round(legOffset), 4, 4);
      g.fillRect(cx + 1, footY - 1 - Math.round(legOffset), 4, 4);
    } else {
      g.fillRect(cx - 5, footY - 1 + Math.round(legOffset), 4, 4);
      g.fillRect(cx + 2, footY - 1 - Math.round(legOffset), 4, 4);
    }

    // Legs
    const bodyY = Math.round(oy + 15 + bobY);
    g.fillStyle(this.darken(colors.clothing, 0.75), 1);
    if (dir === 'left' || dir === 'right') {
      g.fillRect(cx - 3, bodyY + 9 + Math.round(legOffset), 3, 4);
      g.fillRect(cx + 1, bodyY + 9 - Math.round(legOffset), 3, 4);
    } else {
      g.fillRect(cx - 5, bodyY + 9 + Math.round(legOffset), 3, 4);
      g.fillRect(cx + 2, bodyY + 9 - Math.round(legOffset), 3, 4);
    }

    // Torso — slim traveller's vest
    g.fillStyle(colors.clothing, 1);
    g.fillRoundedRect(cx - 5, bodyY, 10, 10, 2);
    g.fillStyle(colors.accent, 1);
    g.fillRect(cx - 4, bodyY + 7, 8, 2); // bottom trim
    // Chest hope emblem (small sunburst dot)
    g.fillStyle(0xffd700, 0.85);
    g.fillCircle(cx, bodyY + 3, 1.5);
    g.fillStyle(0xffffff, 0.3);
    g.fillCircle(cx, bodyY + 3, 0.8);

    // Arms — wide energetic swing
    if (dir === 'down' || dir === 'up') {
      g.fillStyle(colors.clothing, 1);
      g.fillRect(cx - 8, bodyY + Math.round(armSwing), 3, 7);
      g.fillRect(cx + 5, bodyY - Math.round(armSwing), 3, 7);
      g.fillStyle(colors.skin, 1);
      g.fillRect(cx - 8, bodyY + 7 + Math.round(armSwing), 3, 2);
      g.fillRect(cx + 5, bodyY + 7 - Math.round(armSwing), 3, 2);
    } else {
      const armX = dir === 'right' ? cx - 7 : cx + 4;
      g.fillStyle(colors.clothing, 1);
      g.fillRect(armX, bodyY + Math.round(armSwing), 3, 7);
      g.fillStyle(colors.skin, 1);
      g.fillRect(armX, bodyY + 7 + Math.round(armSwing), 3, 2);
    }

    // Head — round face, messy light hair
    const headY = Math.round(oy + 5 + bobY);
    // Hair (slightly wild/tousled)
    g.fillStyle(colors.hair, 1);
    g.fillRoundedRect(cx - 5, headY - 3, 10, 6, 2);
    g.fillTriangle(cx - 5, headY - 1, cx - 7, headY - 4, cx - 3, headY - 1);
    g.fillTriangle(cx + 5, headY - 1, cx + 7, headY - 4, cx + 3, headY - 1);
    // Face
    g.fillStyle(colors.skin, 1);
    g.fillRoundedRect(cx - 5, headY, 10, 10, 3);
    g.fillStyle(this.darken(colors.skin, 0.85), 0.25);
    g.fillRoundedRect(cx + 1, headY + 2, 4, 7, 2);
    // Eyes (bright, alert)
    if (dir !== 'up') {
      if (dir === 'down') {
        g.fillStyle(0xffffff, 1);
        g.fillRect(cx - 3, headY + 3, 2, 2);
        g.fillRect(cx + 1, headY + 3, 2, 2);
        g.fillStyle(colors.eye, 1);
        g.fillRect(cx - 3, headY + 4, 2, 1);
        g.fillRect(cx + 1, headY + 4, 2, 1);
        // Bright highlight spark
        g.fillStyle(0xffffff, 0.9);
        g.fillRect(cx - 2, headY + 3, 1, 1);
        // Smile
        g.fillStyle(this.darken(colors.skin, 0.7), 1);
        g.fillRect(cx - 2, headY + 7, 4, 1);
        g.fillRect(cx - 3, headY + 6, 1, 1);
        g.fillRect(cx + 2, headY + 6, 1, 1);
      } else {
        const eyeX = dir === 'right' ? cx + 2 : cx - 4;
        g.fillStyle(0xffffff, 1);
        g.fillRect(eyeX, headY + 3, 2, 2);
        g.fillStyle(colors.eye, 1);
        g.fillRect(eyeX, headY + 4, 2, 1);
        g.fillStyle(0xffffff, 0.9);
        g.fillRect(eyeX, headY + 3, 1, 1);
      }
    }

    // Silhouette outline
    this.outlineRoundedRect(g, cx - 5, Math.round(oy + 15 + bobY), 10, 10, 2, 0.55);
    this.outlineRoundedRect(g, cx - 5, Math.round(oy + 5 + bobY), 10, 10, 3, 0.5);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SHINING ONES — celestial angels, ethereal white/gold, glowing halo
  // ─────────────────────────────────────────────────────────────────────────
  private static drawShiningOnes(
    g: Phaser.GameObjects.Graphics,
    ox: number, oy: number,
    dir: DrawDir,
    colors: BodyColors,
    anim: 'idle' | 'walk',
    frame: number,
  ): void {
    const cx = ox + SPRITE_SIZE / 2;

    // Floating animation — gentle hover, no ground contact
    const floatY = Math.sin((frame / 4) * Math.PI * 2) * 1.5;
    const bodyY = Math.round(oy + 12 + floatY);
    const headY = Math.round(oy + 3 + floatY);

    // No ground shadow — ethereal beings
    g.fillStyle(colors.accessory ?? 0xffd700, 0.08);
    g.fillEllipse(cx, oy + 30, 18, 5);

    // Flowing robe (wide at base, tapering to shoulders)
    g.fillStyle(colors.clothing, 0.95);
    g.fillTriangle(cx - 9, oy + 29, cx + 9, oy + 29, cx, bodyY + 2);
    // Robe body
    g.fillStyle(colors.clothing, 1);
    g.fillRoundedRect(cx - 6, bodyY, 12, 14, 3);
    // Gold trim on robe
    g.fillStyle(colors.accent, 0.8);
    g.fillRect(cx - 6, bodyY, 12, 2);      // neckline
    g.fillRect(cx - 6, bodyY + 12, 12, 2); // hem
    // Centre belt/sash
    g.fillStyle(colors.accent, 0.5);
    g.fillRect(cx - 1, bodyY + 5, 2, 6);
    // Inner glow on robes
    g.fillStyle(0xffffff, 0.12);
    g.fillRoundedRect(cx - 4, bodyY + 2, 8, 10, 2);

    // Wings suggestion (side fan shapes)
    if (dir === 'down' || dir === 'up') {
      g.fillStyle(colors.clothing, 0.4);
      g.fillTriangle(cx - 6, bodyY + 3, cx - 13, bodyY + 10, cx - 6, bodyY + 10);
      g.fillTriangle(cx + 6, bodyY + 3, cx + 13, bodyY + 10, cx + 6, bodyY + 10);
      g.lineStyle(0.5, colors.accent, 0.35);
      g.lineBetween(cx - 6, bodyY + 3, cx - 13, bodyY + 10);
      g.lineBetween(cx + 6, bodyY + 3, cx + 13, bodyY + 10);
    }

    // Arms (reaching/welcoming gesture)
    const armRaise = anim === 'idle' ? Math.sin((frame / 4) * Math.PI * 2) * 1.5 : 0;
    if (dir === 'down' || dir === 'up') {
      g.fillStyle(colors.clothing, 1);
      g.fillRect(cx - 9, bodyY + 1 - Math.round(armRaise), 3, 7);
      g.fillRect(cx + 6, bodyY + 1 + Math.round(armRaise), 3, 7);
      g.fillStyle(colors.skin, 1);
      g.fillRect(cx - 9, bodyY + 8 - Math.round(armRaise), 3, 2);
      g.fillRect(cx + 6, bodyY + 8 + Math.round(armRaise), 3, 2);
    } else {
      const armX = dir === 'right' ? cx - 8 : cx + 5;
      g.fillStyle(colors.clothing, 1);
      g.fillRect(armX, bodyY + 1, 3, 7);
      g.fillStyle(colors.skin, 1);
      g.fillRect(armX, bodyY + 8, 3, 2);
    }

    // Head — serene, oval
    g.fillStyle(colors.skin, 1);
    g.fillRoundedRect(cx - 5, headY, 10, 11, 4);
    g.fillStyle(0xffffff, 0.15);
    g.fillCircle(cx - 2, headY + 2, 2); // brow highlight
    // Long flowing hair
    if (dir !== 'up') {
      g.fillStyle(colors.hair, 0.9);
      g.fillRoundedRect(cx - 6, headY - 1, 12, 6, 3);
      if (dir === 'left' || dir === 'right') {
        g.fillRoundedRect(cx - 6, headY + 3, 4, 8, 2); // side hair
      } else {
        g.fillRoundedRect(cx - 6, headY + 3, 3, 7, 2);
        g.fillRoundedRect(cx + 3, headY + 3, 3, 7, 2);
      }
    }
    // Eyes (calm, luminous)
    if (dir === 'down') {
      g.fillStyle(0xffffff, 1);
      g.fillRect(cx - 4, headY + 4, 3, 2);
      g.fillRect(cx + 1, headY + 4, 3, 2);
      g.fillStyle(colors.eye, 0.8);
      g.fillRect(cx - 3, headY + 5, 2, 1);
      g.fillRect(cx + 2, headY + 5, 2, 1);
      g.fillStyle(0xffffff, 1);
      g.fillRect(cx - 2, headY + 4, 1, 1); // sparkle
    } else if (dir !== 'up') {
      const eyeX = dir === 'right' ? cx + 1 : cx - 4;
      g.fillStyle(0xffffff, 1);
      g.fillRect(eyeX, headY + 4, 3, 2);
      g.fillStyle(colors.eye, 0.8);
      g.fillRect(eyeX + 1, headY + 5, 2, 1);
    }

    // Halo — animated ring of light
    const haloPulse = 0.65 + Math.sin((frame / 4) * Math.PI * 2) * 0.2;
    const haloColor = colors.accessory ?? 0xffd700;
    g.lineStyle(2, haloColor, haloPulse);
    g.strokeEllipse(cx, headY - 1 + floatY * 0.3, 14, 4);
    g.lineStyle(1, 0xffffff, haloPulse * 0.5);
    g.strokeEllipse(cx, headY - 1 + floatY * 0.3, 12, 3);
    // Halo sparkle points
    g.fillStyle(haloColor, haloPulse);
    g.fillRect(cx - 7, headY - 1, 1, 1);
    g.fillRect(cx + 6, headY - 1, 1, 1);
    g.fillRect(cx, headY - 3, 1, 1);

    // Subtle body glow
    g.lineStyle(1, haloColor, 0.12);
    g.strokeRoundedRect(cx - 7, bodyY - 1, 14, 16, 3);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LORD HATEGOOD — corrupt judge, imposing black robes, dark crown
  // ─────────────────────────────────────────────────────────────────────────
  private static drawLordHategood(
    g: Phaser.GameObjects.Graphics,
    ox: number, oy: number,
    dir: DrawDir,
    colors: BodyColors,
    anim: 'idle' | 'walk',
    frame: number,
  ): void {
    const cx = ox + SPRITE_SIZE / 2;

    // Slow, deliberate movement — judge doesn't rush
    let bobY = 0, legOffset = 0, armSwing = 0;
    if (anim === 'idle') {
      bobY = Math.sin((frame / 4) * Math.PI * 2) * 0.5; // minimal movement — imposing stillness
    } else {
      const phase = (frame / 6) * Math.PI * 2;
      bobY = Math.abs(Math.sin(phase)) * -1.2;
      legOffset = Math.sin(phase) * 3;
      armSwing = Math.sin(phase) * 2;
    }

    // Heavy shadow
    g.fillStyle(0x000000, 0.5);
    g.fillEllipse(cx, oy + 29, 18, 6);
    g.fillStyle(0x000000, 0.2);
    g.fillEllipse(cx, oy + 29, 24, 7);

    // Judge's robes — wide at base (intimidating silhouette)
    const bodyY = Math.round(oy + 12 + bobY);
    g.fillStyle(colors.clothing, 1); // near-black
    g.fillTriangle(cx - 10, oy + 29, cx + 10, oy + 29, cx, bodyY + 4);
    g.fillRoundedRect(cx - 7, bodyY, 14, 15, 2);
    // Red lining/accent
    g.fillStyle(colors.accent, 0.7);
    g.fillRect(cx - 7, bodyY + 2, 14, 2);      // collar trim
    g.fillRect(cx - 7, bodyY + 13, 14, 2);     // hem
    g.fillRect(cx - 1, bodyY + 4, 2, 10);      // centre line (judge's robe seam)
    // Robe sheen
    g.fillStyle(0xffffff, 0.04);
    g.fillRoundedRect(cx - 6, bodyY + 1, 6, 13, 1);

    // Legs (hidden under robes — just boots visible)
    const footY = Math.round(oy + 27 + bobY);
    g.fillStyle(0x1a1010, 1);
    if (dir === 'left' || dir === 'right') {
      g.fillRect(cx - 4, footY - 2 + Math.round(legOffset), 4, 4);
      g.fillRect(cx + 1, footY - 2 - Math.round(legOffset), 4, 4);
    } else {
      g.fillRect(cx - 5, footY - 2, 4, 3);
      g.fillRect(cx + 2, footY - 2, 4, 3);
    }

    // Arms (authoritative pose — one raised slightly for judgment)
    const judgeArmY = anim === 'idle' ? Math.sin((frame / 4) * Math.PI * 2) * 1.0 : armSwing;
    if (dir === 'down' || dir === 'up') {
      g.fillStyle(colors.clothing, 1);
      g.fillRect(cx - 10, bodyY + 2 + Math.round(judgeArmY), 4, 9);
      g.fillRect(cx + 6, bodyY + 1 - Math.round(judgeArmY), 4, 9);
      // Wide sleeves
      g.fillRect(cx - 11, bodyY + 8 + Math.round(judgeArmY), 5, 4);
      g.fillRect(cx + 7, bodyY + 7 - Math.round(judgeArmY), 5, 4);
      g.fillStyle(colors.skin, 1);
      g.fillRect(cx - 10, bodyY + 11 + Math.round(judgeArmY), 3, 2);
      g.fillRect(cx + 7, bodyY + 10 - Math.round(judgeArmY), 3, 2);
    } else {
      const armX = dir === 'right' ? cx - 9 : cx + 5;
      g.fillStyle(colors.clothing, 1);
      g.fillRect(armX, bodyY + 2 + Math.round(judgeArmY), 4, 9);
      g.fillRect(armX, bodyY + 9, 5, 4);
      g.fillStyle(colors.skin, 1);
      g.fillRect(armX + 1, bodyY + 11 + Math.round(judgeArmY), 3, 2);
    }

    // Head — square jaw, severe expression
    const headY = Math.round(oy + 4 + bobY);
    g.fillStyle(colors.skin, 1);
    g.fillRect(cx - 6, headY, 12, 10); // square head
    g.fillStyle(this.darken(colors.skin, 0.75), 0.35);
    g.fillRect(cx + 2, headY + 2, 4, 7); // jaw shadow
    // Severe eyes
    if (dir !== 'up') {
      if (dir === 'down') {
        g.fillStyle(0xffffff, 0.7);
        g.fillRect(cx - 4, headY + 3, 3, 2);
        g.fillRect(cx + 1, headY + 3, 3, 2);
        g.fillStyle(colors.eye, 1); // dark red eyes
        g.fillRect(cx - 3, headY + 4, 2, 1);
        g.fillRect(cx + 2, headY + 4, 2, 1);
        // Furrowed brow
        g.fillStyle(this.darken(colors.skin, 0.65), 0.8);
        g.fillRect(cx - 4, headY + 2, 3, 1);
        g.fillRect(cx + 1, headY + 2, 3, 1);
        // Stern mouth (downturned)
        g.fillStyle(this.darken(colors.skin, 0.6), 1);
        g.fillRect(cx - 2, headY + 7, 4, 1);
        g.fillRect(cx - 3, headY + 7, 1, 1); // downturned corner
        g.fillRect(cx + 2, headY + 7, 1, 1);
      } else {
        const eyeX = dir === 'right' ? cx + 1 : cx - 4;
        g.fillStyle(0xffffff, 0.7);
        g.fillRect(eyeX, headY + 3, 3, 2);
        g.fillStyle(colors.eye, 1);
        g.fillRect(eyeX + 1, headY + 4, 2, 1);
        g.fillStyle(this.darken(colors.skin, 0.65), 0.8);
        g.fillRect(eyeX, headY + 2, 3, 1); // brow
      }
    }
    // Short dark hair
    g.fillStyle(colors.hair, 1);
    g.fillRect(cx - 6, headY - 1, 12, 4);

    // Judge's crown — dark metal with small gems
    const crownColor = colors.accessory ?? 0x884422;
    g.fillStyle(crownColor, 1);
    g.fillRect(cx - 6, headY - 3, 12, 3);           // crown band
    // Three teeth
    g.fillTriangle(cx - 5, headY - 3, cx - 5, headY - 7, cx - 3, headY - 3);
    g.fillTriangle(cx, headY - 3, cx, headY - 8, cx + 2, headY - 3);
    g.fillTriangle(cx + 5, headY - 3, cx + 5, headY - 7, cx + 3, headY - 3);
    // Dark gem centres
    g.fillStyle(0x220000, 0.8);
    g.fillRect(cx - 4, headY - 6, 1, 1);
    g.fillStyle(0x440000, 0.6);
    g.fillRect(cx + 1, headY - 7, 1, 1);

    // Imposing outline
    this.outlineRect(g, cx - 7, Math.round(oy + 12 + bobY), 14, 15, 0.7);
    this.outlineRect(g, cx - 6, Math.round(oy + 4 + bobY), 12, 10, 0.65);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PRUDENCE — wise woman of the Palace, blue robes, holds a scroll
  // ─────────────────────────────────────────────────────────────────────────
  private static drawPrudence(
    g: Phaser.GameObjects.Graphics,
    ox: number, oy: number,
    dir: DrawDir,
    colors: BodyColors,
    anim: 'idle' | 'walk',
    frame: number,
  ): void {
    const cx = ox + SPRITE_SIZE / 2;

    // Floor-length robe — no exposed legs, so legOffset not needed
    let bobY = 0, armSwing = 0;
    if (anim === 'idle') {
      bobY = Math.sin((frame / 4) * Math.PI * 2) * 0.7;
    } else {
      const phase = (frame / 6) * Math.PI * 2;
      bobY = Math.abs(Math.sin(phase)) * -1.5;
      armSwing = Math.sin(phase) * 2.5; // restrained, dignified
    }

    // Shadow
    g.fillStyle(0x000000, 0.3);
    g.fillEllipse(cx, oy + 29, 13, 4);

    // Long skirt/robe (floor-length)
    const bodyY = Math.round(oy + 13 + bobY);
    g.fillStyle(colors.clothing, 1);
    g.fillTriangle(cx - 8, oy + 28, cx + 8, oy + 28, cx, bodyY + 2);
    g.fillRoundedRect(cx - 5, bodyY, 10, 13, 2);
    // Robe shading
    g.fillStyle(this.darken(colors.clothing, 0.75), 0.4);
    g.fillRect(cx - 5, bodyY, 2, 13);
    g.fillRect(cx + 3, bodyY, 2, 13);
    // Blue accent trim
    g.fillStyle(colors.accent, 0.8);
    g.fillRect(cx - 5, bodyY, 10, 2);       // yoke
    g.fillRect(cx - 5, bodyY + 11, 10, 2);  // hem

    // Scroll held in one hand
    const scrollX = dir === 'right' ? cx + 6 : cx - 10;
    const scrollY = bodyY + 3;
    g.fillStyle(0xf5e6d3, 1);          // parchment
    g.fillRoundedRect(scrollX, scrollY, 6, 8, 1);
    g.fillStyle(this.darken(0xf5e6d3, 0.75), 1);
    g.fillRect(scrollX, scrollY, 6, 1);
    g.fillRect(scrollX, scrollY + 7, 6, 1);
    g.lineStyle(0.5, 0x664422, 0.4);
    g.lineBetween(scrollX + 1, scrollY + 3, scrollX + 5, scrollY + 3);
    g.lineBetween(scrollX + 1, scrollY + 5, scrollX + 5, scrollY + 5);

    // Arms
    if (dir === 'down' || dir === 'up') {
      g.fillStyle(colors.clothing, 1);
      g.fillRect(cx - 8, bodyY + 1 + Math.round(armSwing), 3, 8);
      g.fillRect(cx + 5, bodyY + 1 - Math.round(armSwing), 3, 8);
      g.fillStyle(colors.skin, 1);
      g.fillRect(cx - 8, bodyY + 9 + Math.round(armSwing), 3, 2);
      g.fillRect(cx + 5, bodyY + 9 - Math.round(armSwing), 3, 2);
    } else {
      const armX = dir === 'right' ? cx - 7 : cx + 4;
      g.fillStyle(colors.clothing, 1);
      g.fillRect(armX, bodyY + 1 + Math.round(armSwing), 3, 8);
      g.fillStyle(colors.skin, 1);
      g.fillRect(armX, bodyY + 9 + Math.round(armSwing), 3, 2);
    }

    // Head — oval, thoughtful expression
    const headY = Math.round(oy + 4 + bobY);
    // Long hair
    g.fillStyle(colors.hair, 1);
    g.fillRoundedRect(cx - 6, headY - 1, 12, 7, 3);
    g.fillRoundedRect(cx - 6, headY + 4, 4, 8, 2);
    g.fillRoundedRect(cx + 2, headY + 4, 4, 8, 2);
    // Head
    g.fillStyle(colors.skin, 1);
    g.fillRoundedRect(cx - 5, headY, 10, 11, 3);
    g.fillStyle(0xffffff, 0.1);
    g.fillCircle(cx - 2, headY + 2, 2);
    // Kind, wise eyes
    if (dir === 'down') {
      g.fillStyle(0xffffff, 1);
      g.fillRect(cx - 4, headY + 4, 3, 2);
      g.fillRect(cx + 1, headY + 4, 3, 2);
      g.fillStyle(colors.eye, 1);
      g.fillRect(cx - 3, headY + 5, 2, 1);
      g.fillRect(cx + 2, headY + 5, 2, 1);
      // Gentle smile
      g.fillStyle(this.darken(colors.skin, 0.7), 1);
      g.fillRect(cx - 2, headY + 8, 4, 1);
      g.fillRect(cx - 3, headY + 7, 1, 1);
      g.fillRect(cx + 2, headY + 7, 1, 1);
    } else if (dir !== 'up') {
      const eyeX = dir === 'right' ? cx + 1 : cx - 4;
      g.fillStyle(0xffffff, 1);
      g.fillRect(eyeX, headY + 4, 3, 2);
      g.fillStyle(colors.eye, 1);
      g.fillRect(eyeX + 1, headY + 5, 2, 1);
      g.fillStyle(this.darken(colors.skin, 0.7), 1);
      g.fillRect(eyeX, headY + 8, 2, 1);
    }

    // Silhouette
    this.outlineRoundedRect(g, cx - 5, Math.round(oy + 13 + bobY), 10, 13, 2, 0.55);
    this.outlineRoundedRect(g, cx - 5, Math.round(oy + 4 + bobY), 10, 11, 3, 0.5);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // WATCHFUL — palace gate guard, military bearing, carries a staff
  // ─────────────────────────────────────────────────────────────────────────
  private static drawWatchful(
    g: Phaser.GameObjects.Graphics,
    ox: number, oy: number,
    dir: DrawDir,
    colors: BodyColors,
    anim: 'idle' | 'walk',
    frame: number,
  ): void {
    const cx = ox + SPRITE_SIZE / 2;

    // Guard stands mostly still — upright posture
    let bobY = 0, legOffset = 0, armSwing = 0;
    if (anim === 'idle') {
      bobY = Math.sin((frame / 4) * Math.PI * 2) * 0.4; // near-stationary
    } else {
      const phase = (frame / 6) * Math.PI * 2;
      bobY = Math.abs(Math.sin(phase)) * -1.2;
      legOffset = Math.sin(phase) * 3.5;
      armSwing = Math.sin(phase) * 2;
    }

    // Shadow
    g.fillStyle(0x000000, 0.35);
    g.fillEllipse(cx, oy + 29, 14, 5);

    // Boots — sturdy guard boots
    const footY = Math.round(oy + 25 + bobY);
    g.fillStyle(0x3a2a18, 1);
    if (dir === 'left' || dir === 'right') {
      g.fillRect(cx - 4, footY + Math.round(legOffset), 4, 5);
      g.fillRect(cx + 1, footY - Math.round(legOffset), 4, 5);
    } else {
      g.fillRect(cx - 6, footY + Math.round(legOffset), 4, 5);
      g.fillRect(cx + 2, footY - Math.round(legOffset), 4, 5);
    }

    // Legs — dark trousers
    const bodyY = Math.round(oy + 13 + bobY);
    g.fillStyle(this.darken(colors.clothing, 0.6), 1);
    if (dir === 'left' || dir === 'right') {
      g.fillRect(cx - 3, bodyY + 9 + Math.round(legOffset), 3, 5);
      g.fillRect(cx + 1, bodyY + 9 - Math.round(legOffset), 3, 5);
    } else {
      g.fillRect(cx - 5, bodyY + 9 + Math.round(legOffset), 3, 5);
      g.fillRect(cx + 2, bodyY + 9 - Math.round(legOffset), 3, 5);
    }

    // Chest armour / tabard (wider at shoulders)
    g.fillStyle(colors.clothing, 1);
    g.fillRoundedRect(cx - 7, bodyY, 14, 11, 2); // wide shoulders
    // Shoulder pads
    g.fillStyle(this.darken(colors.clothing, 0.85), 1);
    g.fillRect(cx - 7, bodyY, 4, 3);
    g.fillRect(cx + 3, bodyY, 4, 3);
    // Chest badge — blue steel colour
    g.fillStyle(colors.accent, 0.8);
    g.fillRoundedRect(cx - 2, bodyY + 3, 4, 5, 1);
    g.fillStyle(0xffffff, 0.15);
    g.fillRoundedRect(cx - 1, bodyY + 4, 2, 3, 1);

    // Staff (tall — guard weapon)
    const staffX = dir === 'right' ? cx + 11 : cx - 11;
    g.lineStyle(4, 0x5c4020, 0.2);
    g.lineBetween(staffX, bodyY - 5, staffX, oy + 28);
    g.lineStyle(2, 0x8b6040, 1);
    g.lineBetween(staffX, bodyY - 5, staffX, oy + 28);
    g.lineStyle(1, 0xaa8060, 0.4);
    g.lineBetween(staffX - 1, bodyY - 5, staffX - 1, oy + 28);
    // Staff tip
    g.fillStyle(colors.accent, 0.9);
    g.fillTriangle(staffX, bodyY - 8, staffX - 2, bodyY - 5, staffX + 2, bodyY - 5);

    // Arms
    if (dir === 'down' || dir === 'up') {
      g.fillStyle(colors.clothing, 1);
      g.fillRect(cx - 10, bodyY + 1 + Math.round(armSwing), 3, 9);
      g.fillRect(cx + 7, bodyY + 1 - Math.round(armSwing), 3, 9);
      g.fillStyle(colors.skin, 1);
      g.fillRect(cx - 10, bodyY + 10 + Math.round(armSwing), 3, 2);
      g.fillRect(cx + 7, bodyY + 10 - Math.round(armSwing), 3, 2);
    } else {
      const armX = dir === 'right' ? cx - 9 : cx + 6;
      g.fillStyle(colors.clothing, 1);
      g.fillRect(armX, bodyY + 1 + Math.round(armSwing), 3, 9);
      g.fillStyle(colors.skin, 1);
      g.fillRect(armX, bodyY + 10 + Math.round(armSwing), 3, 2);
    }

    // Head — square-jawed, vigilant expression
    const headY = Math.round(oy + 4 + bobY);
    // Guard helmet/hat brim
    g.fillStyle(this.darken(colors.clothing, 0.7), 1);
    g.fillRoundedRect(cx - 7, headY - 1, 14, 3, 1);
    g.fillStyle(colors.accent, 0.5);
    g.fillRect(cx - 7, headY + 1, 14, 1); // helmet band
    // Head
    g.fillStyle(colors.skin, 1);
    g.fillRect(cx - 5, headY, 10, 10); // square head
    g.fillStyle(this.darken(colors.skin, 0.8), 0.3);
    g.fillRect(cx + 2, headY + 2, 3, 7); // jaw shadow
    // Vigilant eyes — scanning
    if (dir === 'down') {
      g.fillStyle(0xffffff, 1);
      g.fillRect(cx - 4, headY + 3, 3, 2);
      g.fillRect(cx + 1, headY + 3, 3, 2);
      g.fillStyle(colors.eye, 1);
      g.fillRect(cx - 3, headY + 4, 2, 1);
      g.fillRect(cx + 2, headY + 4, 2, 1);
      // Stern brow
      g.fillStyle(this.darken(colors.skin, 0.65), 0.7);
      g.fillRect(cx - 4, headY + 2, 3, 1);
      g.fillRect(cx + 1, headY + 2, 3, 1);
    } else if (dir !== 'up') {
      const eyeX = dir === 'right' ? cx + 1 : cx - 4;
      g.fillStyle(0xffffff, 1);
      g.fillRect(eyeX, headY + 3, 3, 2);
      g.fillStyle(colors.eye, 1);
      g.fillRect(eyeX + 1, headY + 4, 2, 1);
      g.fillStyle(this.darken(colors.skin, 0.65), 0.7);
      g.fillRect(eyeX, headY + 2, 3, 1);
    }
    // Short hair
    g.fillStyle(colors.hair, 1);
    g.fillRect(cx - 5, headY, 10, 4);

    // Silhouette
    this.outlineRoundedRect(g, cx - 7, Math.round(oy + 13 + bobY), 14, 11, 2, 0.65);
    this.outlineRect(g, cx - 5, Math.round(oy + 4 + bobY), 10, 10, 0.6);
  }

  private static drawGenericCharacter(
    g: Phaser.GameObjects.Graphics,
    ox: number, oy: number,
    dir: DrawDir,
    colors: BodyColors,
    config: PortraitConfig,
    anim: 'idle' | 'walk',
    frame: number,
  ): void {
    const cx = ox + SPRITE_SIZE / 2;

    let bobY = 0;
    let legOffset = 0;
    let armSwing = 0;
    if (anim === 'idle') {
      bobY = Math.sin((frame / 4) * Math.PI * 2) * 1.0;
    } else {
      const phase = (frame / 6) * Math.PI * 2;
      bobY = Math.abs(Math.sin(phase)) * -1.8;
      legOffset = Math.sin(phase) * 5;
      armSwing = Math.sin(phase) * 4;
    }

    // === Shadow ===
    g.fillStyle(0x000000, 0.35);
    g.fillEllipse(cx, oy + 29, 14, 5);
    g.fillStyle(0x000000, 0.15);
    g.fillEllipse(cx, oy + 29, 20, 6);

    // === Feet / Legs ===
    const footY = Math.round(oy + 26 + bobY);
    if (dir === 'left' || dir === 'right') {
      g.fillStyle(colors.clothing, 1);
      g.fillRect(cx - 3, footY - 2 + Math.round(legOffset), 3, 4);
      g.fillRect(cx + 1, footY - 2 - Math.round(legOffset), 3, 4);
      g.fillStyle(this.darken(colors.clothing, 0.6), 1);
      g.fillRect(cx - 3, footY + 2 + Math.round(legOffset), 3, 2);
      g.fillRect(cx + 1, footY + 2 - Math.round(legOffset), 3, 2);
    } else {
      g.fillStyle(colors.clothing, 1);
      g.fillRect(cx - 5, footY - 2 + Math.round(legOffset), 3, 4);
      g.fillRect(cx + 2, footY - 2 - Math.round(legOffset), 3, 4);
      g.fillStyle(this.darken(colors.clothing, 0.6), 1);
      g.fillRect(cx - 5, footY + 2, 3, 2);
      g.fillRect(cx + 2, footY + 2, 3, 2);
    }

    // === Body / Torso ===
    const bodyY = Math.round(oy + 14 + bobY);
    const bodyH = 12;
    g.fillStyle(colors.clothing, 1);
    g.fillRoundedRect(cx - 6, bodyY, 12, bodyH, 2);
    g.fillStyle(this.darken(colors.clothing, 0.7), 0.5);
    g.fillRect(cx - 6, bodyY, 2, bodyH);
    g.fillRect(cx + 4, bodyY, 2, bodyH);
    g.fillStyle(0xffffff, 0.06);
    g.fillRect(cx - 2, bodyY + 1, 4, bodyH - 2);
    g.fillStyle(colors.accent, 1);
    g.fillRect(cx - 5, bodyY + bodyH - 4, 10, 2);
    g.fillStyle(0xffd080, 0.9);
    g.fillRect(cx - 1, bodyY + bodyH - 4, 2, 2);

    // === Arms ===
    if (dir === 'down' || dir === 'up') {
      g.fillStyle(colors.clothing, 1);
      g.fillRect(cx - 9, bodyY + 1 + Math.round(armSwing), 3, 8);
      g.fillRect(cx + 6, bodyY + 1 - Math.round(armSwing), 3, 8);
      g.fillStyle(colors.skin, 1);
      g.fillRect(cx - 9, bodyY + 9 + Math.round(armSwing), 3, 2);
      g.fillRect(cx + 6, bodyY + 9 - Math.round(armSwing), 3, 2);
    } else {
      const armX = dir === 'right' ? cx - 8 : cx + 5;
      g.fillStyle(colors.clothing, 1);
      g.fillRect(armX, bodyY + 1 + Math.round(armSwing), 3, 8);
      g.fillStyle(colors.skin, 1);
      g.fillRect(armX, bodyY + 9 + Math.round(armSwing), 3, 2);
    }

    // === Head ===
    const headY = Math.round(oy + 4 + bobY);
    const headW = config.headShape === 'square' ? 12 : (config.headShape === 'oval' ? 10 : 11);
    const headH = config.headShape === 'oval' ? 12 : 10;

    if (config.hairStyle === 'long' && (dir === 'down' || dir === 'left' || dir === 'right')) {
      g.fillStyle(colors.hair, 1);
      g.fillRoundedRect(cx - headW / 2 - 1, headY - 1, headW + 2, headH + 6, 3);
    }

    g.fillStyle(colors.skin, 1);
    g.fillRoundedRect(cx - headW / 2, headY, headW, headH, config.headShape === 'square' ? 1 : 3);
    g.fillStyle(this.darken(colors.skin, 0.8), 0.3);
    g.fillRoundedRect(cx + 1, headY + 2, headW / 2 - 1, headH - 3, 2);
    g.fillStyle(0xffffff, 0.1);
    g.fillCircle(cx - 2, headY + 2, 2);

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
      g.fillStyle(0xffffff, 0.15);
      g.fillCircle(cx - 1, headY + 2, 2);
    } else {
      g.fillRoundedRect(cx - headW / 2, headY - 2, headW, 5, 2);
    }

    if (dir !== 'up') {
      if (dir === 'down') {
        g.fillStyle(0xffffff, 1);
        g.fillRect(cx - 4, headY + 4, 3, 3);
        g.fillRect(cx + 1, headY + 4, 3, 3);
        g.fillStyle(colors.eye, 1);
        g.fillRect(cx - 3, headY + 5, 2, 2);
        g.fillRect(cx + 2, headY + 5, 2, 2);
        g.fillStyle(this.darken(colors.skin, 0.7), 1);
        g.fillRect(cx - 1, headY + 8, 3, 1);
      } else {
        const eyeX = dir === 'right' ? cx + 1 : cx - 4;
        g.fillStyle(0xffffff, 1);
        g.fillRect(eyeX, headY + 4, 3, 3);
        g.fillStyle(colors.eye, 1);
        g.fillRect(eyeX + (dir === 'right' ? 1 : 0), headY + 5, 2, 2);
        const mouthX = dir === 'right' ? cx + 1 : cx - 3;
        g.fillStyle(this.darken(colors.skin, 0.7), 1);
        g.fillRect(mouthX, headY + 8, 2, 1);
      }
    } else {
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
          g.lineStyle(4, accColor, 0.18);
          g.lineBetween(staffX, bodyY - 2, staffX, oy + 28);
          g.lineStyle(2, 0x8b6040, 1);
          g.lineBetween(staffX, bodyY - 2, staffX, oy + 28);
          g.lineStyle(1, 0xc09060, 0.4);
          g.lineBetween(staffX - 1, bodyY - 2, staffX - 1, oy + 28);
          g.fillStyle(accColor, 0.9);
          g.fillCircle(staffX, bodyY - 2, 1.5);
          const swayX = staffX + Math.sin((frame / 4) * Math.PI * 2) * 0.5;
          g.fillStyle(0xffd080, 0.3);
          g.fillCircle(swayX, bodyY - 3, 2);
          break;
        }
        case 'scroll': {
          const scrollX = dir === 'right' ? cx + 8 : cx - 10;
          g.fillStyle(accColor, 1);
          g.fillRoundedRect(scrollX, bodyY + 3, 5, 7, 1);
          g.fillStyle(this.darken(accColor, 0.7), 1);
          g.fillRect(scrollX, bodyY + 3, 5, 1);
          g.fillRect(scrollX, bodyY + 9, 5, 1);
          g.lineStyle(0.5, 0x000000, 0.3);
          g.lineBetween(scrollX + 1, bodyY + 5, scrollX + 4, bodyY + 5);
          g.lineBetween(scrollX + 1, bodyY + 7, scrollX + 4, bodyY + 7);
          break;
        }
        case 'crown':
          g.fillStyle(accColor, 1);
          g.fillRect(cx - 5, headY - 3, 10, 2);
          g.fillTriangle(cx - 5, headY - 3, cx - 5, headY - 6, cx - 3, headY - 3);
          g.fillTriangle(cx, headY - 3, cx, headY - 7, cx + 2, headY - 3);
          g.fillTriangle(cx + 5, headY - 3, cx + 5, headY - 6, cx + 3, headY - 3);
          g.fillStyle(0xff8888, 0.8);
          g.fillRect(cx - 4, headY - 5, 1, 1);
          g.fillStyle(0x88ff88, 0.8);
          g.fillRect(cx + 1, headY - 6, 1, 1);
          break;
        case 'chains': {
          g.lineStyle(1, 0x888888, 0.5);
          const chainY = bodyY + bodyH - 1;
          for (let i = 0; i < 3; i++) {
            g.strokeCircle(cx - 4 + i * 4, chainY + 2 + (i % 2), 1.5);
          }
          g.lineStyle(0.5, 0x666666, 0.4);
          g.lineBetween(cx - 4, chainY + 2, cx, chainY + 3);
          g.lineBetween(cx, chainY + 3, cx + 4, chainY + 2);
          break;
        }
        case 'hat': {
          g.fillStyle(this.darken(accColor, 0.8), 1);
          g.fillRoundedRect(cx - 8, headY - 3, 16, 3, 1);
          g.fillStyle(accColor, 1);
          g.fillRoundedRect(cx - 5, headY - 9, 10, 7, 2);
          g.fillStyle(0xffffff, 0.12);
          g.fillRect(cx - 4, headY - 8, 3, 5);
          g.fillStyle(this.darken(accColor, 0.6), 0.8);
          g.fillRect(cx - 5, headY - 4, 10, 1);
          break;
        }
      }
    }

    // === Silhouette outline pass — improves background separation ===
    this.outlineRoundedRect(g, cx - 6, Math.round(oy + 14 + bobY), 12, 12, 2, 0.6);
    this.outlineRoundedRect(g, cx - Math.round((config.headShape === 'square' ? 12 : (config.headShape === 'oval' ? 10 : 11)) / 2), Math.round(oy + 4 + bobY), config.headShape === 'square' ? 12 : (config.headShape === 'oval' ? 10 : 11), config.headShape === 'oval' ? 12 : 10, config.headShape === 'square' ? 1 : 3, 0.55);
  }

  /**
   * Draw a 1px dark silhouette outline around a rect — improves readability
   * of characters against varied backgrounds.
   */
  private static outlineRect(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, alpha = 0.7): void {
    g.lineStyle(1, 0x0a0814, alpha);
    g.strokeRect(x, y, w, h);
  }

  private static outlineRoundedRect(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, radius = 2, alpha = 0.7): void {
    g.lineStyle(1, 0x0a0814, alpha);
    g.strokeRoundedRect(x, y, w, h, radius);
  }

  /** Darken a hex color by factor (0 = black, 1 = original) */
  private static darken(color: number, factor: number): number {
    const r = Math.floor(((color >> 16) & 0xff) * factor);
    const g = Math.floor(((color >> 8) & 0xff) * factor);
    const b = Math.floor((color & 0xff) * factor);
    return (r << 16) | (g << 8) | b;
  }

  /** Lighten a hex color by factor (1 = original, >1 = brighter, capped at 255) */
  private static lighten(color: number, factor: number): number {
    const r = Math.min(255, Math.floor(((color >> 16) & 0xff) * factor));
    const g = Math.min(255, Math.floor(((color >> 8) & 0xff) * factor));
    const b = Math.min(255, Math.floor((color & 0xff) * factor));
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
