import Phaser from 'phaser';
import { PORTRAIT_CONFIGS, PortraitConfig } from '../narrative/data/portraitData';

/**
 * Procedurally generates 32×32 character spritesheets using Phaser Graphics.
 * Sanabi-level pixel art quality — expressive, silhouette-distinct characters.
 *
 * Layout: 8 columns × 8 rows
 *   Rows 0–3: idle (down/left/right/up) × 4 frames — breathing/sway anim
 *   Rows 4–7: walk (down/left/right/up) × 6 frames — stride cycle
 *
 * Pixel art principles:
 *   - fillRect(x, y, 1, 1) for individual pixels
 *   - Direction mirroring via mx() helper
 *   - Frame-driven leg/arm alternation for crisp walk cycles
 *   - Per-character distinctive silhouette (hat, burden, robe, hood, etc.)
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

/** Walk cycle leg table: [leftLegY, rightLegY, leftArmX, rightArmX] offsets */
const WALK_STEPS: [number, number, number, number][] = [
  [ 0,  0,  0,  0],  // frame 0 — neutral
  [-3,  3,  2, -2],  // frame 1 — left forward
  [ 0,  0,  0,  0],  // frame 2 — neutral
  [ 3, -3, -2,  2],  // frame 3 — right forward
  [ 0,  0,  0,  0],  // frame 4 — neutral
  [-2,  2,  1, -1],  // frame 5 — half-step
];

export class CharacterSpriteFactory {

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

    // Idle frames (rows 0–3)
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

    // Walk frames (rows 4–7)
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

    rt.saveTexture(texKey);
    scene.textures.get(texKey).setFilter(Phaser.Textures.FilterMode.NEAREST);

    const tex = scene.textures.get(texKey);
    let frameIndex = 0;
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        tex.add(frameIndex, 0, col * SPRITE_SIZE, row * SPRITE_SIZE, SPRITE_SIZE, SPRITE_SIZE);
        frameIndex++;
      }
    }

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
    switch (config.id) {
      case 'christian':     this.drawChristian(g, ox, oy, dir, colors, anim, frame); break;
      case 'evangelist':    this.drawEvangelist(g, ox, oy, dir, colors, anim, frame); break;
      case 'interpreter':   this.drawInterpreter(g, ox, oy, dir, colors, anim, frame); break;
      case 'faithful':      this.drawFaithful(g, ox, oy, dir, colors, anim, frame); break;
      case 'obstinate':     this.drawObstinate(g, ox, oy, dir, colors, anim, frame); break;
      case 'pliable':       this.drawPliable(g, ox, oy, dir, colors, anim, frame); break;
      default:              this.drawGenericCharacter(g, ox, oy, dir, colors, config, anim, frame); break;
    }
  }

  // ─── Shared helpers ────────────────────────────────────────────────────────

  private static darken(color: number, factor: number): number {
    const r = Math.floor(((color >> 16) & 0xff) * factor);
    const g = Math.floor(((color >> 8) & 0xff) * factor);
    const b = Math.floor((color & 0xff) * factor);
    return (r << 16) | (g << 8) | b;
  }

  private static lighten(color: number, amount: number): number {
    const r = Math.min(255, ((color >> 16) & 0xff) + Math.floor(255 * amount));
    const g = Math.min(255, ((color >> 8) & 0xff) + Math.floor(255 * amount));
    const b = Math.min(255, (color & 0xff) + Math.floor(255 * amount));
    return (r << 16) | (g << 8) | b;
  }

  /** Compute animation offsets from anim type + frame */
  private static animOffsets(
    anim: 'idle' | 'walk',
    frame: number,
  ): { bobY: number; step: [number, number, number, number]; breathScale: number } {
    if (anim === 'idle') {
      // 4-frame breathing cycle: 0=neutral, 1=up, 2=neutral, 3=down
      // More pronounced bob (was -1, now -2 on inhale, +1 on exhale)
      const bobs = [0, -2, -1, 1];
      const bobY = bobs[frame % 4] ?? 0;
      // Subtle scale variation for "chest expansion" look
      const breathScales = [1.0, 1.02, 1.01, 0.99];
      const breathScale = breathScales[frame % 4] ?? 1.0;
      return { bobY, step: [0, 0, 0, 0], breathScale };
    }
    const f = Math.min(frame, WALK_STEPS.length - 1);
    const bobY = (f % 2 === 1) ? -1 : 0;
    return { bobY, step: WALK_STEPS[f], breathScale: 1.0 };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CHRISTIAN — pilgrim hat, burden on back, faith aura, brown cloak
  // ─────────────────────────────────────────────────────────────────────────
  private static drawChristian(
    g: Phaser.GameObjects.Graphics,
    ox: number, oy: number,
    dir: DrawDir,
    colors: BodyColors,
    anim: 'idle' | 'walk',
    frame: number,
  ): void {
    const cx = ox + 16;
    const { bobY, step } = this.animOffsets(anim, frame);
    const [llY, rlY, laX, raX] = step;

    // Mirror helper for left/right facing
    const flip = dir === 'left';
    const mx = (dx: number) => flip ? -dx - 1 : dx;

    // Ground shadow
    g.fillStyle(0x000000, 0.3);
    g.fillRect(cx - 7, oy + 29, 14, 3);

    // Faith aura (visible glow, only idle) — pulsing concentric rings
    if (anim === 'idle') {
      // Outer soft halo
      g.fillStyle(0xd4a853, 0.08 + (frame % 2) * 0.04);
      g.fillEllipse(cx, oy + 26 + bobY, 28, 8);
      // Mid ring
      g.fillStyle(0xffd080, 0.12 + (frame % 4 === 1 ? 0.05 : 0));
      g.fillEllipse(cx, oy + 26 + bobY, 18, 5);
    }

    // === BURDEN (drawn first — behind body for right/front/back, in front for left) ===
    const burdenVisible = dir !== 'left';
    if (burdenVisible) {
      const bx = cx + mx(-10);
      const by = oy + 13 + bobY;
      // Sack shadow
      g.fillStyle(0x000000, 0.25);
      g.fillRect(bx + 1, by + 1, 7, 9);
      // Sack body — tan
      g.fillStyle(0x8b6b4a, 1);
      g.fillRect(bx, by, 7, 9);
      // Sack highlight
      g.fillStyle(0xb09870, 0.5);
      g.fillRect(bx + 1, by + 1, 2, 4);
      // Sack crease
      g.fillStyle(0x6b4a2a, 0.6);
      g.fillRect(bx + 5, by + 1, 1, 7);
      // Rope tie
      g.fillStyle(0x4a3a2a, 1);
      g.fillRect(bx + 1, by, 5, 2);
      g.fillStyle(0x7a6a4a, 1);
      g.fillRect(bx + 2, by, 2, 1);
      // Strap
      g.fillStyle(0x5a4a3a, 0.7);
      g.fillRect(cx + mx(-2), oy + 12 + bobY, 1, 4);
    }

    // === LEGS ===
    const legY = oy + 22 + bobY;
    const legColor = this.darken(colors.clothing, 0.6);
    g.fillStyle(legColor, 1);
    if (dir === 'left' || dir === 'right') {
      // Side view: one leg behind other
      g.fillRect(cx + mx(1), legY + llY, 3, 5);   // back leg
      g.fillStyle(this.darken(legColor, 0.85), 1);
      g.fillRect(cx + mx(-3), legY + rlY, 3, 5);  // front leg
    } else {
      // Front/back: legs side by side
      g.fillRect(cx - 4, legY + llY, 3, 5);
      g.fillRect(cx + 1, legY + rlY, 3, 5);
    }

    // === BOOTS ===
    const bootColor = 0x2d1a0a;
    const bootHi = 0x4a2d10;
    g.fillStyle(bootColor, 1);
    if (dir === 'left' || dir === 'right') {
      g.fillRect(cx + mx(0), legY + 4 + llY, 4, 3);
      g.fillStyle(this.darken(bootColor, 0.85), 1);
      g.fillRect(cx + mx(-4), legY + 4 + rlY, 4, 3);
      g.fillStyle(bootHi, 0.4);
      g.fillRect(cx + mx(0), legY + 4 + llY, 1, 2);
    } else {
      g.fillRect(cx - 5, legY + 4 + llY, 4, 3);
      g.fillRect(cx + 1, legY + 4 + rlY, 4, 3);
      g.fillStyle(bootHi, 0.4);
      g.fillRect(cx - 5, legY + 4 + llY, 1, 2);
      g.fillRect(cx + 1, legY + 4 + rlY, 1, 2);
    }

    // === CLOAK / TORSO ===
    const torsoY = oy + 13 + bobY;
    const torsoH = 10;
    // Cloak shadow sides
    g.fillStyle(this.darken(colors.clothing, 0.55), 1);
    g.fillRect(cx - 5, torsoY, 10, torsoH);
    // Cloak base
    g.fillStyle(colors.clothing, 1);
    g.fillRect(cx - 4, torsoY, 8, torsoH);
    // Cloak highlight center strip
    g.fillStyle(this.lighten(colors.clothing, 0.07), 0.5);
    g.fillRect(cx - 1, torsoY + 1, 3, torsoH - 2);
    // Cloak fold lines for depth
    g.fillStyle(this.darken(colors.clothing, 0.7), 0.4);
    g.fillRect(cx - 3, torsoY + 2, 1, torsoH - 4);
    g.fillRect(cx + 2, torsoY + 3, 1, torsoH - 5);
    // Hem sway in walk
    if (anim === 'walk') {
      const hemShift = (frame % 2 === 1) ? (dir === 'right' ? 1 : -1) : 0;
      g.fillStyle(colors.clothing, 1);
      g.fillRect(cx - 4 + hemShift, torsoY + torsoH - 1, 8, 2);
    }
    // Belt
    g.fillStyle(colors.accent, 1);
    g.fillRect(cx - 4, torsoY + torsoH - 3, 8, 2);
    // Belt buckle pixel
    g.fillStyle(0xffd080, 1);
    g.fillRect(cx - 1, torsoY + torsoH - 3, 2, 2);

    // Cross badge (front & right side)
    if (dir === 'down' || dir === 'right') {
      g.fillStyle(0xffd080, 0.2);
      g.fillRect(cx + mx(1) - 1, torsoY + 2, 3, 3);
      g.fillStyle(0xffd080, 1);
      g.fillRect(cx + mx(1), torsoY + 2, 1, 3);   // vertical
      g.fillRect(cx + mx(1) - 1, torsoY + 3, 3, 1); // horizontal
    }

    // === ARMS ===
    const armY = torsoY + 1;
    g.fillStyle(colors.clothing, 1);
    if (dir === 'down' || dir === 'up') {
      g.fillRect(cx - 7, armY + laX, 3, 7);
      g.fillRect(cx + 4, armY + raX, 3, 7);
      // Hands
      g.fillStyle(colors.skin, 1);
      g.fillRect(cx - 7, armY + 7 + laX, 3, 2);
      g.fillRect(cx + 4, armY + 7 + raX, 3, 2);
    } else {
      const ax = cx + mx(4);
      g.fillRect(ax, armY + laX, 3, 7);
      g.fillStyle(colors.skin, 1);
      g.fillRect(ax, armY + 7 + laX, 3, 2);
    }

    // === HEAD ===
    const headY = oy + 4 + bobY;
    // Neck
    g.fillStyle(colors.skin, 1);
    g.fillRect(cx - 1, headY + 10, 3, 3);

    // Head outline (1px dark border)
    g.fillStyle(0x111111, 0.8);
    g.fillRect(cx - 5, headY, 10, 10);
    g.fillRect(cx - 4, headY - 1, 8, 12);

    // Face base
    g.fillStyle(colors.skin, 1);
    g.fillRect(cx - 4, headY, 8, 10);
    g.fillRect(cx - 5, headY + 1, 10, 8);

    // 3-tone skin shading
    g.fillStyle(this.lighten(colors.skin, 0.12), 0.4);
    g.fillRect(cx - 3, headY + 1, 3, 2);  // forehead highlight
    g.fillStyle(this.darken(colors.skin, 0.8), 0.35);
    g.fillRect(cx + 2, headY + 2, 3, 6);  // right-side shadow

    // Hair strip (under hat brim)
    g.fillStyle(colors.hair, 1);
    g.fillRect(cx - 4, headY, 8, 2);

    // === FACE ===
    if (dir === 'down') {
      // Eyes
      g.fillStyle(0xf5f0e8, 1);
      g.fillRect(cx - 4, headY + 4, 3, 3);
      g.fillRect(cx + 1, headY + 4, 3, 3);
      g.fillStyle(colors.eye, 1);
      g.fillRect(cx - 3, headY + 5, 2, 2);
      g.fillRect(cx + 2, headY + 5, 2, 2);
      g.fillStyle(0x0d0d0d, 1);
      g.fillRect(cx - 3, headY + 5, 1, 1);
      g.fillRect(cx + 2, headY + 5, 1, 1);
      g.fillStyle(0xffffff, 0.9);
      g.fillRect(cx - 2, headY + 5, 1, 1);
      g.fillRect(cx + 3, headY + 5, 1, 1);
      // Nose
      g.fillStyle(this.darken(colors.skin, 0.78), 0.8);
      g.fillRect(cx - 1, headY + 7, 1, 1);
      // Mouth (slightly worried)
      g.fillStyle(this.darken(colors.skin, 0.65), 1);
      g.fillRect(cx - 2, headY + 8, 4, 1);
      g.fillStyle(this.darken(colors.skin, 0.55), 0.5);
      g.fillRect(cx - 2, headY + 8, 1, 1);
    } else if (dir !== 'up') {
      const ex = cx + mx(1);
      // Eye white
      g.fillStyle(0xf5f0e8, 1);
      g.fillRect(ex, headY + 4, 3, 3);
      // Iris + pupil
      g.fillStyle(colors.eye, 1);
      g.fillRect(ex + (flip ? 0 : 1), headY + 5, 2, 2);
      g.fillStyle(0x0d0d0d, 1);
      g.fillRect(ex + (flip ? 0 : 1), headY + 5, 1, 1);
      g.fillStyle(0xffffff, 0.9);
      g.fillRect(ex + (flip ? 1 : 2), headY + 5, 1, 1);
      // Nose bridge
      g.fillStyle(this.darken(colors.skin, 0.8), 0.7);
      g.fillRect(cx + mx(4), headY + 7, 1, 1);
      // Mouth
      g.fillStyle(this.darken(colors.skin, 0.65), 1);
      g.fillRect(cx + mx(2), headY + 8, 2, 1);
    } else {
      // Back: just hair
      g.fillStyle(colors.hair, 1);
      g.fillRect(cx - 4, headY, 8, 6);
    }

    // === PILGRIM HAT ===
    const hatColor = colors.accessory ?? 0x5a3d1e;
    const hatDark = this.darken(hatColor, 0.65);
    // Wide brim (6px each side)
    g.fillStyle(hatDark, 1);
    g.fillRect(cx - 8, headY - 2, 16, 3);
    g.fillStyle(this.lighten(hatColor, 0.08), 0.25);
    g.fillRect(cx - 8, headY - 2, 16, 1);
    g.fillStyle(0x000000, 0.2);
    g.fillRect(cx - 8, headY, 16, 1);
    // Tall crown
    g.fillStyle(hatColor, 1);
    g.fillRect(cx - 4, headY - 9, 8, 8);
    // Crown highlight
    g.fillStyle(this.lighten(hatColor, 0.1), 0.3);
    g.fillRect(cx - 4, headY - 9, 2, 7);
    // Crown shadow right
    g.fillStyle(0x000000, 0.2);
    g.fillRect(cx + 3, headY - 9, 1, 7);
    // White hatband row
    g.fillStyle(0xe8e0d8, 1);
    g.fillRect(cx - 4, headY - 2, 8, 1);
    // Dark brim underside
    g.fillStyle(this.darken(hatColor, 0.5), 0.7);
    g.fillRect(cx - 4, headY - 1, 8, 1);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // EVANGELIST — tall, bald, long gray-white robe, flowing beard, staff
  // ─────────────────────────────────────────────────────────────────────────
  private static drawEvangelist(
    g: Phaser.GameObjects.Graphics,
    ox: number, oy: number,
    dir: DrawDir,
    colors: BodyColors,
    anim: 'idle' | 'walk',
    frame: number,
  ): void {
    const cx = ox + 16;
    const { bobY, step } = this.animOffsets(anim, frame);
    const [llY,, laX, raX] = step;
    const flip = dir === 'left';
    const mx = (dx: number) => flip ? -dx - 1 : dx;

    // Shadow
    g.fillStyle(0x000000, 0.28);
    g.fillRect(cx - 6, oy + 29, 12, 3);

    // === STAFF (drawn behind body) ===
    const staffX = cx + mx(9);
    const staffTopY = oy + 1 + bobY;
    g.fillStyle(0x4a2e10, 1);
    g.fillRect(staffX, staffTopY, 2, oy + 29 - staffTopY);
    g.fillStyle(0x7a5a30, 0.5);
    g.fillRect(staffX, staffTopY, 1, oy + 28 - staffTopY);
    // Staff gold tip
    g.fillStyle(0xd4a853, 1);
    g.fillRect(staffX, staffTopY, 2, 3);
    g.fillStyle(0xffd080, 0.6);
    g.fillRect(staffX, staffTopY, 1, 1);

    // === ROBE / TORSO (taller, narrower) ===
    const torsoY = oy + 10 + bobY;
    const robeColor = 0xd0c8c0;
    const robeDark = this.darken(robeColor, 0.7);
    // Robe shadow sides
    g.fillStyle(robeDark, 1);
    g.fillRect(cx - 5, torsoY, 10, 18);
    // Robe main
    g.fillStyle(robeColor, 1);
    g.fillRect(cx - 4, torsoY, 8, 18);
    // Vertical fold lines (3 wrinkles)
    g.fillStyle(robeDark, 0.45);
    g.fillRect(cx - 2, torsoY + 2, 1, 15);
    g.fillRect(cx + 1, torsoY + 1, 1, 16);
    g.fillRect(cx + 3, torsoY + 3, 1, 13);
    // Center highlight
    g.fillStyle(0xffffff, 0.1);
    g.fillRect(cx - 1, torsoY + 1, 3, 16);
    // Collar
    g.fillStyle(robeDark, 0.6);
    g.fillRect(cx - 2, torsoY, 4, 3);
    g.fillStyle(robeColor, 1);
    g.fillRect(cx - 1, torsoY, 3, 2);

    // V-split hem at bottom
    g.fillStyle(robeDark, 0.4);
    g.fillRect(cx - 1, torsoY + 15, 1, 3);
    g.fillRect(cx + 1, torsoY + 15, 1, 3);

    // === SANDALS ===
    g.fillStyle(0xb8905a, 1);
    if (dir === 'left' || dir === 'right') {
      g.fillRect(cx + mx(-2), oy + 27 + llY, 4, 3);
      g.fillStyle(this.darken(0xb8905a, 0.7), 0.7);
      g.fillRect(cx + mx(2), oy + 27, 3, 3);
    } else {
      g.fillRect(cx - 4, oy + 27 + llY, 3, 3);
      g.fillRect(cx + 1, oy + 27, 3, 3);
    }

    // === POINTING ARM ===
    const ptDir = (dir === 'down' || dir === 'right');
    if (ptDir || dir === 'left') {
      g.fillStyle(robeColor, 1);
      const ptX = cx + mx(4);
      g.fillRect(ptX, torsoY + 1 + laX, 3, 5);
      // Forearm
      g.fillStyle(colors.skin, 1);
      g.fillRect(cx + mx(7), torsoY + 2 + laX, 4, 2);
      // Pointing finger
      g.fillRect(cx + mx(11), torsoY + 2 + laX, 2, 1);
    }

    // Left arm (hanging or swing)
    if (dir === 'down' || dir === 'up') {
      g.fillStyle(robeColor, 1);
      g.fillRect(cx - 7, torsoY + 1 + raX, 3, 6);
      g.fillStyle(colors.skin, 1);
      g.fillRect(cx - 7, torsoY + 7 + raX, 3, 2);
    }

    // === HEAD (bald, oval) ===
    const headY = oy + 1 + bobY;
    // Head outline
    g.fillStyle(0x111111, 0.75);
    g.fillRect(cx - 4, headY, 8, 9);
    g.fillRect(cx - 5, headY + 1, 10, 7);
    // Bald skin
    g.fillStyle(colors.skin, 1);
    g.fillRect(cx - 3, headY, 6, 9);
    g.fillRect(cx - 4, headY + 1, 8, 7);
    // 3-tone head shading
    g.fillStyle(this.lighten(colors.skin, 0.15), 0.4);
    g.fillRect(cx - 2, headY + 1, 3, 2);  // bald highlight
    g.fillStyle(this.darken(colors.skin, 0.78), 0.35);
    g.fillRect(cx + 2, headY + 2, 2, 5);  // side shadow
    // Wrinkle line on forehead
    g.fillStyle(this.darken(colors.skin, 0.75), 0.4);
    g.fillRect(cx - 3, headY + 2, 6, 1);

    // Neck
    g.fillStyle(colors.skin, 1);
    g.fillRect(cx - 1, headY + 9, 3, 2);

    // Face features
    if (dir !== 'up') {
      if (dir === 'down') {
        // Eyes — wise, deep-set
        g.fillStyle(0xf5f0e8, 1);
        g.fillRect(cx - 3, headY + 4, 2, 2);
        g.fillRect(cx + 1, headY + 4, 2, 2);
        g.fillStyle(colors.eye, 1);
        g.fillRect(cx - 3, headY + 4, 2, 2);
        g.fillRect(cx + 1, headY + 4, 2, 2);
        g.fillStyle(0x0d0d0d, 1);
        g.fillRect(cx - 3, headY + 4, 1, 1);
        g.fillRect(cx + 1, headY + 4, 1, 1);
        g.fillStyle(0xffffff, 0.7);
        g.fillRect(cx - 2, headY + 4, 1, 1);
        // Brow furrow
        g.fillStyle(this.darken(colors.skin, 0.65), 0.6);
        g.fillRect(cx - 3, headY + 3, 2, 1);
        g.fillRect(cx + 1, headY + 3, 2, 1);
        // Nose
        g.fillStyle(this.darken(colors.skin, 0.75), 0.9);
        g.fillRect(cx - 1, headY + 6, 1, 1);
        // Mouth — stern line
        g.fillStyle(this.darken(colors.skin, 0.6), 1);
        g.fillRect(cx - 2, headY + 8, 4, 1);
        // Beard
        g.fillStyle(0xe8e0d8, 1);
        g.fillRect(cx - 2, headY + 9, 4, 3);
        g.fillStyle(0xd0c8c0, 0.9);
        g.fillRect(cx - 3, headY + 10, 6, 3);
        g.fillStyle(0xe8e0d8, 1);
        g.fillRect(cx - 1, headY + 13, 3, 2);  // beard tip
        g.fillRect(cx - 2, headY + 15, 5, 1);
      } else {
        const ex = cx + mx(1);
        g.fillStyle(0xf5f0e8, 1);
        g.fillRect(ex, headY + 4, 2, 2);
        g.fillStyle(colors.eye, 1);
        g.fillRect(ex + (flip ? 0 : 1), headY + 4, 1, 2);
        g.fillStyle(0xffffff, 0.6);
        g.fillRect(ex + (flip ? 1 : 1), headY + 4, 1, 1);
        // Nose profile
        g.fillStyle(this.darken(colors.skin, 0.78), 0.8);
        g.fillRect(cx + mx(4), headY + 6, 1, 1);
        // Beard side profile — forward bulge
        g.fillStyle(0xd8d0c8, 1);
        g.fillRect(cx + mx(0), headY + 9, 5, 4);
        g.fillStyle(0xffffff, 0.3);
        g.fillRect(cx + mx(1), headY + 10, 2, 3);
        g.fillStyle(0xd8d0c8, 1);
        g.fillRect(cx + mx(1), headY + 13, 3, 2);
      }
    } else {
      // Back: bald skin
      g.fillStyle(colors.skin, 0.8);
      g.fillRect(cx - 3, headY, 6, 9);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // INTERPRETER — wide scholarly build, purple robe, dome hat, open book
  // ─────────────────────────────────────────────────────────────────────────
  private static drawInterpreter(
    g: Phaser.GameObjects.Graphics,
    ox: number, oy: number,
    dir: DrawDir,
    colors: BodyColors,
    anim: 'idle' | 'walk',
    frame: number,
  ): void {
    const cx = ox + 16;
    const { bobY, step } = this.animOffsets(anim, frame);
    const [llY, rlY, laX, raX] = step;
    const flip = dir === 'left';
    const mx = (dx: number) => flip ? -dx - 1 : dx;

    // Wider shadow (rounder build)
    g.fillStyle(0x000000, 0.3);
    g.fillRect(cx - 8, oy + 29, 16, 4);

    // === ROBE (wide, 13px) ===
    const torsoY = oy + 12 + bobY;
    const robeColor = 0x4a3a7a;
    const robeDark = this.darken(robeColor, 0.65);
    const robeLightFold = this.lighten(robeColor, 0.08);
    // Robe shadow
    g.fillStyle(robeDark, 1);
    g.fillRect(cx - 7, torsoY, 13, 16);
    // Robe main
    g.fillStyle(robeColor, 1);
    g.fillRect(cx - 6, torsoY, 11, 16);
    // Fold lines (lighter purple)
    g.fillStyle(robeLightFold, 0.45);
    g.fillRect(cx - 3, torsoY + 2, 1, 13);
    g.fillRect(cx + 2, torsoY + 1, 1, 14);
    // Center highlight
    g.fillStyle(0xffffff, 0.07);
    g.fillRect(cx - 1, torsoY + 2, 3, 13);
    // Accent trim at collar
    g.fillStyle(colors.accent, 0.9);
    g.fillRect(cx - 4, torsoY, 8, 2);

    // === FEET / SHOES ===
    g.fillStyle(0x3a2a1a, 1);
    if (dir === 'left' || dir === 'right') {
      g.fillRect(cx + mx(-2), oy + 27 + llY, 4, 4);
      g.fillStyle(this.lighten(0x3a2a1a, 0.1), 0.4);
      g.fillRect(cx + mx(2), oy + 27 + rlY, 4, 4);
    } else {
      g.fillRect(cx - 5, oy + 27 + llY, 4, 4);
      g.fillRect(cx + 1, oy + 27 + rlY, 4, 4);
    }

    // === BOOK (held in front) ===
    if (dir !== 'up') {
      const bookX = cx + mx(-5);
      const bookY = torsoY + 3;
      // Book shadow
      g.fillStyle(0x000000, 0.2);
      g.fillRect(bookX + 1, bookY + 1, 8, 7);
      // Cover
      g.fillStyle(colors.accessory ?? 0xc4a870, 1);
      g.fillRect(bookX, bookY, 8, 7);
      // Pages
      g.fillStyle(0xf5f0e8, 1);
      g.fillRect(bookX + 1, bookY + 1, 6, 5);
      // Spine
      g.fillStyle(0x8a7050, 0.8);
      g.fillRect(bookX + 3, bookY, 1, 7);
      // Text lines
      g.fillStyle(0x888880, 0.4);
      g.fillRect(bookX + 1, bookY + 2, 2, 1);
      g.fillRect(bookX + 1, bookY + 4, 2, 1);
      g.fillRect(bookX + 4, bookY + 2, 2, 1);
      g.fillRect(bookX + 4, bookY + 4, 2, 1);
    }

    // === ARMS ===
    const armY = torsoY + 1;
    if (dir === 'down' || dir === 'up') {
      g.fillStyle(robeColor, 1);
      g.fillRect(cx - 9, armY + laX, 3, 7);
      g.fillRect(cx + 6, armY + raX, 3, 7);
      g.fillStyle(colors.skin, 1);
      g.fillRect(cx - 9, armY + 7 + laX, 3, 2);
      g.fillRect(cx + 6, armY + 7 + raX, 3, 2);
    } else {
      const ax = cx + mx(5);
      g.fillStyle(robeColor, 1);
      g.fillRect(ax, armY + laX, 3, 7);
      g.fillStyle(colors.skin, 1);
      g.fillRect(ax, armY + 7 + laX, 3, 2);
    }

    // === HEAD (wider, round scholarly) ===
    const headY = oy + 3 + bobY;
    // Outline
    g.fillStyle(0x111111, 0.78);
    g.fillRect(cx - 6, headY, 11, 9);
    g.fillRect(cx - 5, headY - 1, 9, 11);
    // Skin
    g.fillStyle(colors.skin, 1);
    g.fillRect(cx - 5, headY, 9, 9);
    g.fillRect(cx - 4, headY - 1, 7, 11);
    // 3-tone shading
    g.fillStyle(this.lighten(colors.skin, 0.12), 0.4);
    g.fillRect(cx - 3, headY + 1, 3, 2);
    g.fillStyle(this.darken(colors.skin, 0.8), 0.3);
    g.fillRect(cx + 2, headY + 2, 3, 5);

    // Neck
    g.fillStyle(colors.skin, 1);
    g.fillRect(cx - 1, headY + 9, 3, 3);

    // Face
    if (dir !== 'up') {
      if (dir === 'down') {
        // Eyes with spectacle glint
        g.fillStyle(0xf5f0e8, 1);
        g.fillRect(cx - 4, headY + 3, 3, 3);
        g.fillRect(cx + 1, headY + 3, 3, 3);
        g.fillStyle(colors.eye, 1);
        g.fillRect(cx - 3, headY + 4, 2, 2);
        g.fillRect(cx + 2, headY + 4, 2, 2);
        g.fillStyle(0x0d0d0d, 1);
        g.fillRect(cx - 3, headY + 4, 1, 1);
        g.fillRect(cx + 2, headY + 4, 1, 1);
        // Spectacle glint arc (wire-frame style)
        g.fillStyle(0xcccccc, 0.5);
        g.fillRect(cx - 4, headY + 3, 1, 1);
        g.fillRect(cx + 1, headY + 3, 1, 1);
        g.fillRect(cx - 4, headY + 5, 1, 1);
        g.fillRect(cx + 3, headY + 5, 1, 1);
        // Nose (wider)
        g.fillStyle(this.darken(colors.skin, 0.78), 0.9);
        g.fillRect(cx - 1, headY + 6, 2, 1);
        // Mouth (curious, slightly open)
        g.fillStyle(this.darken(colors.skin, 0.62), 1);
        g.fillRect(cx - 2, headY + 8, 4, 1);
        g.fillStyle(this.darken(colors.skin, 0.75), 0.5);
        g.fillRect(cx - 1, headY + 8, 2, 1);
      } else {
        const ex = cx + mx(1);
        g.fillStyle(0xf5f0e8, 1);
        g.fillRect(ex, headY + 3, 3, 3);
        g.fillStyle(colors.eye, 1);
        g.fillRect(ex + (flip ? 0 : 1), headY + 4, 2, 2);
        // Spectacle glint side
        g.fillStyle(0xcccccc, 0.5);
        g.fillRect(ex, headY + 3, 1, 1);
        g.fillRect(ex + 2, headY + 5, 1, 1);
        g.fillStyle(this.darken(colors.skin, 0.78), 0.8);
        g.fillRect(cx + mx(4), headY + 6, 1, 1);
        const mX = cx + mx(1);
        g.fillStyle(this.darken(colors.skin, 0.65), 1);
        g.fillRect(mX, headY + 8, 3, 1);
      }
    } else {
      g.fillStyle(colors.hair, 1);
      g.fillRect(cx - 4, headY, 8, 5);
    }

    // === DOME HAT ===
    const hatBase = 0x1a1230;
    const hatMid = 0x2d2050;
    const hatGold = 0xd4a853;
    // Brim
    g.fillStyle(hatBase, 1);
    g.fillRect(cx - 7, headY - 1, 14, 2);
    // Gold hatband
    g.fillStyle(hatGold, 0.9);
    g.fillRect(cx - 6, headY - 1, 12, 1);
    // Dome rows (stacked for round silhouette)
    g.fillStyle(hatMid, 1);
    g.fillRect(cx - 6, headY - 3, 12, 3);
    g.fillRect(cx - 5, headY - 6, 10, 4);
    g.fillRect(cx - 4, headY - 8, 8, 3);
    g.fillStyle(hatBase, 1);
    g.fillRect(cx - 3, headY - 9, 6, 2);
    // Hat highlight
    g.fillStyle(0xffffff, 0.1);
    g.fillRect(cx - 5, headY - 8, 2, 6);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FAITHFUL — lighter cloak, hood up, no burden, more upright, purple trim
  // ─────────────────────────────────────────────────────────────────────────
  private static drawFaithful(
    g: Phaser.GameObjects.Graphics,
    ox: number, oy: number,
    dir: DrawDir,
    colors: BodyColors,
    anim: 'idle' | 'walk',
    frame: number,
  ): void {
    const cx = ox + 16;
    const { bobY, step } = this.animOffsets(anim, frame);
    const [llY, rlY, laX, raX] = step;
    const flip = dir === 'left';
    const mx = (dx: number) => flip ? -dx - 1 : dx;

    // Shadow
    g.fillStyle(0x000000, 0.28);
    g.fillRect(cx - 6, oy + 29, 13, 3);

    // === LEGS ===
    const legY = oy + 22 + bobY;
    const legColor = this.darken(colors.clothing, 0.6);
    g.fillStyle(legColor, 1);
    if (dir === 'left' || dir === 'right') {
      g.fillRect(cx + mx(1), legY + llY, 3, 5);
      g.fillStyle(this.darken(legColor, 0.85), 1);
      g.fillRect(cx + mx(-3), legY + rlY, 3, 5);
    } else {
      g.fillRect(cx - 4, legY + llY, 3, 5);
      g.fillRect(cx + 1, legY + rlY, 3, 5);
    }

    // === BOOTS ===
    const bootColor = 0x4a3520;
    g.fillStyle(bootColor, 1);
    if (dir === 'left' || dir === 'right') {
      g.fillRect(cx + mx(0), legY + 4 + llY, 4, 3);
      g.fillStyle(this.darken(bootColor, 0.8), 1);
      g.fillRect(cx + mx(-4), legY + 4 + rlY, 4, 3);
    } else {
      g.fillRect(cx - 5, legY + 4 + llY, 4, 3);
      g.fillRect(cx + 1, legY + 4 + rlY, 4, 3);
    }

    // === CLOAK / TORSO (lighter, cleaner) ===
    const torsoY = oy + 14 + bobY;
    const torsoH = 9;
    // Sides darker
    g.fillStyle(this.darken(colors.clothing, 0.6), 1);
    g.fillRect(cx - 5, torsoY, 10, torsoH);
    // Main cloak
    g.fillStyle(colors.clothing, 1);
    g.fillRect(cx - 4, torsoY, 8, torsoH);
    // Center highlight
    g.fillStyle(this.lighten(colors.clothing, 0.1), 0.45);
    g.fillRect(cx - 1, torsoY + 1, 3, torsoH - 2);
    // Purple trim accent on edges
    g.fillStyle(0x8a6aaa, 0.7);
    g.fillRect(cx - 5, torsoY + 1, 1, torsoH - 2);
    g.fillRect(cx + 4, torsoY + 1, 1, torsoH - 2);
    // Belt
    g.fillStyle(colors.accent, 0.9);
    g.fillRect(cx - 4, torsoY + torsoH - 3, 8, 2);
    g.fillStyle(0xffd080, 0.85);
    g.fillRect(cx - 1, torsoY + torsoH - 3, 2, 2);

    // === ARMS ===
    const armY = torsoY + 1;
    g.fillStyle(colors.clothing, 1);
    if (dir === 'down' || dir === 'up') {
      g.fillRect(cx - 7, armY + laX, 3, 7);
      g.fillRect(cx + 4, armY + raX, 3, 7);
      g.fillStyle(colors.skin, 1);
      g.fillRect(cx - 7, armY + 7 + laX, 3, 2);
      g.fillRect(cx + 4, armY + 7 + raX, 3, 2);
    } else {
      const ax = cx + mx(4);
      g.fillRect(ax, armY + laX, 3, 7);
      g.fillStyle(colors.skin, 1);
      g.fillRect(ax, armY + 7 + laX, 3, 2);
    }

    // === HEAD ===
    const headY = oy + 5 + bobY;

    // Hood fabric (frames face from sides — cloak color)
    g.fillStyle(colors.clothing, 0.9);
    g.fillRect(cx - 6, headY - 2, 12, 4);   // hood top
    g.fillRect(cx - 6, headY + 2, 2, 9);    // hood left panel
    g.fillRect(cx + 4, headY + 2, 2, 9);    // hood right panel
    // Hood shadow inside
    g.fillStyle(this.darken(colors.clothing, 0.55), 0.5);
    g.fillRect(cx - 5, headY - 1, 2, 3);
    g.fillRect(cx + 3, headY - 1, 2, 3);

    // Head outline
    g.fillStyle(0x111111, 0.75);
    g.fillRect(cx - 4, headY, 8, 10);
    g.fillRect(cx - 5, headY + 1, 10, 8);

    // Face skin
    g.fillStyle(colors.skin, 1);
    g.fillRect(cx - 4, headY, 8, 10);
    g.fillRect(cx - 5, headY + 1, 10, 8);

    // 3-tone shading
    g.fillStyle(this.lighten(colors.skin, 0.1), 0.4);
    g.fillRect(cx - 3, headY + 1, 3, 2);
    g.fillStyle(this.darken(colors.skin, 0.82), 0.3);
    g.fillRect(cx + 2, headY + 2, 3, 6);

    // Hair (visible inside hood)
    g.fillStyle(colors.hair, 1);
    g.fillRect(cx - 3, headY, 6, 2);

    // Neck
    g.fillStyle(colors.skin, 1);
    g.fillRect(cx - 1, headY + 10, 3, 3);

    // Face
    if (dir !== 'up') {
      if (dir === 'down') {
        // Brighter, friendly eyes
        g.fillStyle(0xf5f0e8, 1);
        g.fillRect(cx - 4, headY + 4, 3, 3);
        g.fillRect(cx + 1, headY + 4, 3, 3);
        g.fillStyle(colors.eye, 1);
        g.fillRect(cx - 3, headY + 5, 2, 2);
        g.fillRect(cx + 2, headY + 5, 2, 2);
        g.fillStyle(0x0d0d0d, 1);
        g.fillRect(cx - 3, headY + 5, 1, 1);
        g.fillRect(cx + 2, headY + 5, 1, 1);
        g.fillStyle(0xffffff, 1);
        g.fillRect(cx - 2, headY + 5, 1, 1);
        g.fillRect(cx + 3, headY + 5, 1, 1);
        // Nose
        g.fillStyle(this.darken(colors.skin, 0.78), 0.8);
        g.fillRect(cx - 1, headY + 7, 1, 1);
        // Slight smile (mouth corners upturned)
        g.fillStyle(this.darken(colors.skin, 0.65), 1);
        g.fillRect(cx - 2, headY + 8, 4, 1);
        g.fillStyle(this.lighten(colors.skin, 0.05), 0.6);
        g.fillRect(cx - 2, headY + 8, 1, 1);
        g.fillRect(cx + 2, headY + 8, 1, 1);
      } else {
        const ex = cx + mx(1);
        g.fillStyle(0xf5f0e8, 1);
        g.fillRect(ex, headY + 4, 3, 3);
        g.fillStyle(colors.eye, 1);
        g.fillRect(ex + (flip ? 0 : 1), headY + 5, 2, 2);
        g.fillStyle(0xffffff, 1);
        g.fillRect(ex + (flip ? 1 : 2), headY + 5, 1, 1);
        g.fillStyle(this.darken(colors.skin, 0.78), 0.7);
        g.fillRect(cx + mx(4), headY + 7, 1, 1);
        g.fillStyle(this.darken(colors.skin, 0.65), 1);
        g.fillRect(cx + mx(2), headY + 8, 2, 1);
      }
    } else {
      // Back: hood visible
      g.fillStyle(colors.clothing, 0.9);
      g.fillRect(cx - 5, headY, 10, 8);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // OBSTINATE — stocky, wide torso, furrowed brow, heavy red garment
  // ─────────────────────────────────────────────────────────────────────────
  private static drawObstinate(
    g: Phaser.GameObjects.Graphics,
    ox: number, oy: number,
    dir: DrawDir,
    colors: BodyColors,
    anim: 'idle' | 'walk',
    frame: number,
  ): void {
    const cx = ox + 16;
    const { bobY, step } = this.animOffsets(anim, frame);
    const [llY, rlY, laX, raX] = step;
    const flip = dir === 'left';
    const mx = (dx: number) => flip ? -dx - 1 : dx;

    // Wider shadow (stocky)
    g.fillStyle(0x000000, 0.35);
    g.fillRect(cx - 8, oy + 29, 16, 4);

    // === HEAVY BOOTS ===
    const legY = oy + 22 + bobY;
    const bootColor = 0x1a1010;
    g.fillStyle(bootColor, 1);
    if (dir === 'left' || dir === 'right') {
      g.fillRect(cx + mx(0), legY + llY, 5, 8);
      g.fillStyle(this.darken(bootColor, 0.85), 1);
      g.fillRect(cx + mx(-5), legY + rlY, 5, 8);
    } else {
      g.fillRect(cx - 6, legY + llY, 5, 8);
      g.fillRect(cx + 1, legY + rlY, 5, 8);
    }
    // Boot buckle
    g.fillStyle(0x888888, 0.6);
    g.fillRect(cx + mx(1), legY + 2 + llY, 2, 1);

    // === WIDE TORSO (aggressive stocky build) ===
    const torsoY = oy + 12 + bobY;
    const torsoW = 13;
    const torsoH = 11;
    // Wide heavy garment
    g.fillStyle(this.darken(colors.clothing, 0.6), 1);
    g.fillRect(cx - 7, torsoY, torsoW, torsoH);
    g.fillStyle(colors.clothing, 1);
    g.fillRect(cx - 6, torsoY, torsoW - 2, torsoH);
    // Forward-lean posture: slight shadow on right
    g.fillStyle(this.darken(colors.clothing, 0.7), 0.5);
    g.fillRect(cx + 3, torsoY + 1, 3, torsoH - 2);
    // Belt/strap
    g.fillStyle(this.darken(colors.clothing, 0.55), 1);
    g.fillRect(cx - 6, torsoY + torsoH - 4, torsoW - 2, 2);

    // Crossed arms in idle
    if (anim === 'idle') {
      g.fillStyle(colors.clothing, 1);
      g.fillRect(cx - 8, torsoY + 2, 14, 4);
      g.fillStyle(this.darken(colors.clothing, 0.7), 0.4);
      g.fillRect(cx - 8, torsoY + 2, 1, 4);
      g.fillRect(cx + 5, torsoY + 2, 1, 4);
      // Fist pixels
      g.fillStyle(colors.skin, 1);
      g.fillRect(cx - 9, torsoY + 2, 2, 3);
      g.fillRect(cx + 7, torsoY + 3, 2, 3);
    } else {
      // Walk arms (aggressive swing)
      g.fillStyle(colors.clothing, 1);
      if (dir === 'down' || dir === 'up') {
        g.fillRect(cx - 9, torsoY + 1 + laX, 3, 8);
        g.fillRect(cx + 6, torsoY + 1 + raX, 3, 8);
        g.fillStyle(colors.skin, 1);
        g.fillRect(cx - 9, torsoY + 9 + laX, 3, 2);
        g.fillRect(cx + 6, torsoY + 9 + raX, 3, 2);
      } else {
        const ax = cx + mx(5);
        g.fillRect(ax, torsoY + 1 + laX, 3, 8);
        g.fillStyle(colors.skin, 1);
        g.fillRect(ax, torsoY + 9 + laX, 3, 2);
      }
    }

    // === HEAD (square jaw) ===
    const headY = oy + 4 + bobY;
    // Neck (thick)
    g.fillStyle(colors.skin, 1);
    g.fillRect(cx - 2, headY + 9, 5, 4);

    // Square head outline
    g.fillStyle(0x111111, 0.8);
    g.fillRect(cx - 5, headY, 10, 9);
    // Skin
    g.fillStyle(colors.skin, 1);
    g.fillRect(cx - 4, headY, 8, 9);
    g.fillRect(cx - 5, headY + 1, 10, 7);
    // 3-tone shading
    g.fillStyle(this.lighten(colors.skin, 0.08), 0.35);
    g.fillRect(cx - 3, headY + 1, 2, 2);
    g.fillStyle(this.darken(colors.skin, 0.78), 0.4);
    g.fillRect(cx + 2, headY + 1, 3, 7);
    // Short dark hair
    g.fillStyle(colors.hair, 1);
    g.fillRect(cx - 4, headY, 8, 2);
    // Furrowed brow (1px dark line angled)
    if (dir === 'down') {
      g.fillStyle(this.darken(colors.skin, 0.6), 0.8);
      g.fillRect(cx - 3, headY + 3, 2, 1);
      g.fillRect(cx + 1, headY + 3, 2, 1);
      // Brow shadow
      g.fillStyle(0x000000, 0.2);
      g.fillRect(cx - 4, headY + 3, 1, 1);
      g.fillRect(cx + 3, headY + 3, 1, 1);
    }

    // Face
    if (dir !== 'up') {
      if (dir === 'down') {
        // Eyes (narrowed, aggressive)
        g.fillStyle(0xf5f0e8, 1);
        g.fillRect(cx - 4, headY + 4, 3, 2);
        g.fillRect(cx + 1, headY + 4, 3, 2);
        g.fillStyle(colors.eye, 1);
        g.fillRect(cx - 3, headY + 4, 2, 2);
        g.fillRect(cx + 2, headY + 4, 2, 2);
        g.fillStyle(0x0d0d0d, 1);
        g.fillRect(cx - 3, headY + 4, 1, 1);
        g.fillRect(cx + 2, headY + 4, 1, 1);
        // Heavy brow line
        g.fillStyle(this.darken(colors.hair, 0.8), 0.8);
        g.fillRect(cx - 4, headY + 3, 3, 1);
        g.fillRect(cx + 1, headY + 3, 3, 1);
        // Nose (wide)
        g.fillStyle(this.darken(colors.skin, 0.75), 0.9);
        g.fillRect(cx - 1, headY + 6, 2, 1);
        // Frown
        g.fillStyle(this.darken(colors.skin, 0.65), 1);
        g.fillRect(cx - 2, headY + 8, 4, 1);
        g.fillStyle(this.darken(colors.skin, 0.75), 0.6);
        g.fillRect(cx - 2, headY + 7, 1, 1);
        g.fillRect(cx + 2, headY + 7, 1, 1);
      } else {
        const ex = cx + mx(1);
        g.fillStyle(0xf5f0e8, 1);
        g.fillRect(ex, headY + 4, 3, 2);
        g.fillStyle(colors.eye, 1);
        g.fillRect(ex + (flip ? 0 : 1), headY + 4, 2, 2);
        // Heavy brow
        g.fillStyle(this.darken(colors.hair, 0.8), 0.8);
        g.fillRect(ex, headY + 3, 3, 1);
        g.fillStyle(this.darken(colors.skin, 0.78), 0.8);
        g.fillRect(cx + mx(4), headY + 6, 1, 1);
        g.fillStyle(this.darken(colors.skin, 0.65), 1);
        g.fillRect(cx + mx(2), headY + 8, 2, 1);
      }
    } else {
      g.fillStyle(colors.hair, 1);
      g.fillRect(cx - 4, headY, 8, 4);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PLIABLE — slim, casual blue-gray, open relaxed posture, friendly
  // ─────────────────────────────────────────────────────────────────────────
  private static drawPliable(
    g: Phaser.GameObjects.Graphics,
    ox: number, oy: number,
    dir: DrawDir,
    colors: BodyColors,
    anim: 'idle' | 'walk',
    frame: number,
  ): void {
    const cx = ox + 16;
    const { bobY, step } = this.animOffsets(anim, frame);
    const [llY, rlY, laX, raX] = step;
    const flip = dir === 'left';
    const mx = (dx: number) => flip ? -dx - 1 : dx;

    // Slim shadow
    g.fillStyle(0x000000, 0.25);
    g.fillRect(cx - 5, oy + 30, 10, 2);

    // === LEGS (shorter start — pliable is slightly shorter) ===
    const legY = oy + 23 + bobY;
    const legColor = this.darken(colors.clothing, 0.65);
    g.fillStyle(legColor, 1);
    if (dir === 'left' || dir === 'right') {
      g.fillRect(cx + mx(1), legY + llY, 3, 4);
      g.fillRect(cx + mx(-3), legY + rlY, 3, 4);
    } else {
      g.fillRect(cx - 4, legY + llY, 3, 4);
      g.fillRect(cx + 1, legY + rlY, 3, 4);
    }

    // Shoes (simple)
    g.fillStyle(0x4a4a4a, 1);
    if (dir === 'left' || dir === 'right') {
      g.fillRect(cx + mx(0), legY + 3 + llY, 4, 3);
      g.fillStyle(0x3a3a3a, 1);
      g.fillRect(cx + mx(-4), legY + 3 + rlY, 4, 3);
    } else {
      g.fillRect(cx - 5, legY + 3 + llY, 4, 3);
      g.fillRect(cx + 1, legY + 3 + rlY, 4, 3);
    }

    // === TORSO (slim) ===
    const torsoY = oy + 15 + bobY;
    const torsoH = 9;
    g.fillStyle(this.darken(colors.clothing, 0.65), 1);
    g.fillRect(cx - 4, torsoY, 8, torsoH);
    g.fillStyle(colors.clothing, 1);
    g.fillRect(cx - 3, torsoY, 6, torsoH);
    g.fillStyle(this.lighten(colors.clothing, 0.1), 0.4);
    g.fillRect(cx - 1, torsoY + 1, 3, torsoH - 2);
    // Simple collar
    g.fillStyle(colors.accent, 0.7);
    g.fillRect(cx - 3, torsoY, 6, 1);

    // === ARMS (slightly away from body — relaxed posture) ===
    const armY = torsoY + 1;
    g.fillStyle(colors.clothing, 1);
    if (dir === 'down' || dir === 'up') {
      // Arms slightly out (relaxed)
      g.fillRect(cx - 8, armY + laX, 3, 7);
      g.fillRect(cx + 5, armY + raX, 3, 7);
      g.fillStyle(colors.skin, 1);
      g.fillRect(cx - 8, armY + 7 + laX, 3, 2);
      g.fillRect(cx + 5, armY + 7 + raX, 3, 2);
    } else {
      const ax = cx + mx(4);
      g.fillRect(ax, armY + laX, 3, 7);
      g.fillStyle(colors.skin, 1);
      g.fillRect(ax, armY + 7 + laX, 3, 2);
    }

    // === HEAD (round, slightly shorter overall) ===
    const headY = oy + 6 + bobY;
    g.fillStyle(colors.skin, 1);
    g.fillRect(cx - 1, headY + 9, 3, 3);

    g.fillStyle(0x111111, 0.75);
    g.fillRect(cx - 5, headY, 10, 9);
    g.fillRect(cx - 4, headY - 1, 8, 11);
    g.fillStyle(colors.skin, 1);
    g.fillRect(cx - 4, headY, 8, 9);
    g.fillRect(cx - 5, headY + 1, 10, 7);

    // 3-tone shading (lighter overall — lighter complexion)
    g.fillStyle(this.lighten(colors.skin, 0.12), 0.4);
    g.fillRect(cx - 3, headY + 1, 3, 2);
    g.fillStyle(this.darken(colors.skin, 0.85), 0.25);
    g.fillRect(cx + 2, headY + 2, 3, 5);

    // Hair
    g.fillStyle(colors.hair, 1);
    g.fillRect(cx - 4, headY, 8, 3);
    g.fillStyle(this.lighten(colors.hair, 0.1), 0.4);
    g.fillRect(cx - 3, headY, 3, 1);

    // Face
    if (dir !== 'up') {
      if (dir === 'down') {
        // Eyes wide apart (open, friendly)
        g.fillStyle(0xf5f0e8, 1);
        g.fillRect(cx - 5, headY + 4, 3, 3);
        g.fillRect(cx + 2, headY + 4, 3, 3);
        g.fillStyle(colors.eye, 1);
        g.fillRect(cx - 4, headY + 5, 2, 2);
        g.fillRect(cx + 3, headY + 5, 2, 2);
        g.fillStyle(0x0d0d0d, 1);
        g.fillRect(cx - 4, headY + 5, 1, 1);
        g.fillRect(cx + 3, headY + 5, 1, 1);
        g.fillStyle(0xffffff, 1);
        g.fillRect(cx - 3, headY + 5, 1, 1);
        g.fillRect(cx + 4, headY + 5, 1, 1);
        // Nose
        g.fillStyle(this.darken(colors.skin, 0.78), 0.7);
        g.fillRect(cx, headY + 7, 1, 1);
        // Friendly mouth (slight smile)
        g.fillStyle(this.darken(colors.skin, 0.62), 1);
        g.fillRect(cx - 2, headY + 8, 4, 1);
        g.fillStyle(this.lighten(colors.skin, 0.06), 0.5);
        g.fillRect(cx - 2, headY + 8, 1, 1);
        g.fillRect(cx + 2, headY + 8, 1, 1);
      } else {
        const ex = cx + mx(1);
        g.fillStyle(0xf5f0e8, 1);
        g.fillRect(ex, headY + 4, 3, 3);
        g.fillStyle(colors.eye, 1);
        g.fillRect(ex + (flip ? 0 : 1), headY + 5, 2, 2);
        g.fillStyle(0xffffff, 1);
        g.fillRect(ex + (flip ? 1 : 2), headY + 5, 1, 1);
        g.fillStyle(this.darken(colors.skin, 0.78), 0.7);
        g.fillRect(cx + mx(4), headY + 7, 1, 1);
        g.fillStyle(this.darken(colors.skin, 0.62), 1);
        g.fillRect(cx + mx(2), headY + 8, 2, 1);
      }
    } else {
      g.fillStyle(colors.hair, 1);
      g.fillRect(cx - 4, headY, 8, 5);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // GENERIC — fallback for help, goodwill, worldly_wiseman, etc.
  // ─────────────────────────────────────────────────────────────────────────
  private static drawGenericCharacter(
    g: Phaser.GameObjects.Graphics,
    ox: number, oy: number,
    dir: DrawDir,
    colors: BodyColors,
    config: PortraitConfig,
    anim: 'idle' | 'walk',
    frame: number,
  ): void {
    const cx = ox + 16;
    const { bobY, step } = this.animOffsets(anim, frame);
    const [llY, rlY, laX, raX] = step;
    const flip = dir === 'left';
    const mx = (dx: number) => flip ? -dx - 1 : dx;

    // Shadow
    g.fillStyle(0x000000, 0.3);
    g.fillRect(cx - 6, oy + 29, 13, 3);

    // === LEGS ===
    const legY = oy + 22 + bobY;
    const legColor = this.darken(colors.clothing, 0.62);
    g.fillStyle(legColor, 1);
    if (dir === 'left' || dir === 'right') {
      g.fillRect(cx + mx(1), legY + llY, 3, 5);
      g.fillRect(cx + mx(-3), legY + rlY, 3, 5);
    } else {
      g.fillRect(cx - 4, legY + llY, 3, 5);
      g.fillRect(cx + 1, legY + rlY, 3, 5);
    }

    // Shoes
    g.fillStyle(this.darken(colors.clothing, 0.4), 1);
    if (dir === 'left' || dir === 'right') {
      g.fillRect(cx + mx(0), legY + 4 + llY, 4, 3);
      g.fillRect(cx + mx(-4), legY + 4 + rlY, 4, 3);
    } else {
      g.fillRect(cx - 5, legY + 4 + llY, 4, 3);
      g.fillRect(cx + 1, legY + 4 + rlY, 4, 3);
    }

    // === TORSO ===
    const torsoY = oy + 13 + bobY;
    const torsoH = 10;
    g.fillStyle(this.darken(colors.clothing, 0.62), 1);
    g.fillRect(cx - 5, torsoY, 10, torsoH);
    g.fillStyle(colors.clothing, 1);
    g.fillRect(cx - 4, torsoY, 8, torsoH);
    g.fillStyle(this.lighten(colors.clothing, 0.08), 0.4);
    g.fillRect(cx - 1, torsoY + 1, 3, torsoH - 2);
    g.fillStyle(colors.accent, 0.9);
    g.fillRect(cx - 4, torsoY + torsoH - 3, 8, 2);
    g.fillStyle(0xffd080, 0.85);
    g.fillRect(cx - 1, torsoY + torsoH - 3, 2, 2);

    // === ARMS ===
    const armY = torsoY + 1;
    g.fillStyle(colors.clothing, 1);
    if (dir === 'down' || dir === 'up') {
      g.fillRect(cx - 8, armY + laX, 3, 7);
      g.fillRect(cx + 5, armY + raX, 3, 7);
      g.fillStyle(colors.skin, 1);
      g.fillRect(cx - 8, armY + 7 + laX, 3, 2);
      g.fillRect(cx + 5, armY + 7 + raX, 3, 2);
    } else {
      const ax = cx + mx(4);
      g.fillRect(ax, armY + laX, 3, 7);
      g.fillStyle(colors.skin, 1);
      g.fillRect(ax, armY + 7 + laX, 3, 2);
    }

    // === HEAD ===
    const headW = config.headShape === 'square' ? 9 : 8;
    const headH = config.headShape === 'oval' ? 11 : 9;
    const headY = oy + 4 + bobY;

    // Hair (long style: draw behind head)
    if (config.hairStyle === 'long' && dir !== 'up') {
      g.fillStyle(colors.hair, 1);
      g.fillRect(cx - headW / 2 - 1, headY - 1, headW + 2, headH + 5);
    }

    // Head outline
    g.fillStyle(0x111111, 0.78);
    g.fillRect(cx - headW / 2, headY, headW, headH);
    // Skin
    g.fillStyle(colors.skin, 1);
    g.fillRect(cx - headW / 2 + 1, headY, headW - 2, headH);
    g.fillRect(cx - headW / 2, headY + 1, headW, headH - 2);
    // 3-tone shading
    g.fillStyle(this.lighten(colors.skin, 0.12), 0.4);
    g.fillRect(cx - headW / 2 + 1, headY + 1, 3, 2);
    g.fillStyle(this.darken(colors.skin, 0.8), 0.3);
    g.fillRect(cx + 1, headY + 2, headW / 2 - 1, headH - 4);

    // Neck
    g.fillStyle(colors.skin, 1);
    g.fillRect(cx - 1, headY + headH, 3, 3);

    // Hair
    g.fillStyle(colors.hair, 1);
    if (config.hairStyle === 'bald') {
      g.fillStyle(0xffffff, 0.18);
      g.fillRect(cx - 2, headY + 1, 3, 2);
    } else if (config.hairStyle === 'hooded') {
      g.fillRect(cx - headW / 2 - 1, headY - 2, headW + 2, 5);
      g.fillRect(cx - headW / 2 - 1, headY + 3, 2, headH - 3);
      g.fillRect(cx + headW / 2 - 1, headY + 3, 2, headH - 3);
    } else {
      g.fillRect(cx - headW / 2 + 1, headY, headW - 2, 3);
    }

    // Face
    if (dir !== 'up') {
      if (dir === 'down') {
        g.fillStyle(0xf5f0e8, 1);
        g.fillRect(cx - 3, headY + 3, 3, 3);
        g.fillRect(cx + 1, headY + 3, 3, 3);
        g.fillStyle(colors.eye, 1);
        g.fillRect(cx - 2, headY + 4, 2, 2);
        g.fillRect(cx + 2, headY + 4, 2, 2);
        g.fillStyle(0x0d0d0d, 1);
        g.fillRect(cx - 2, headY + 4, 1, 1);
        g.fillRect(cx + 2, headY + 4, 1, 1);
        g.fillStyle(0xffffff, 0.9);
        g.fillRect(cx - 1, headY + 4, 1, 1);
        g.fillRect(cx + 3, headY + 4, 1, 1);
        g.fillStyle(this.darken(colors.skin, 0.72), 1);
        g.fillRect(cx - 1, headY + 7, 2, 1);
      } else {
        const ex = cx + mx(1);
        g.fillStyle(0xf5f0e8, 1);
        g.fillRect(ex, headY + 3, 3, 3);
        g.fillStyle(colors.eye, 1);
        g.fillRect(ex + (flip ? 0 : 1), headY + 4, 2, 2);
        g.fillStyle(0xffffff, 0.9);
        g.fillRect(ex + (flip ? 1 : 2), headY + 4, 1, 1);
        g.fillStyle(this.darken(colors.skin, 0.72), 1);
        g.fillRect(cx + mx(2), headY + 7, 2, 1);
      }
    } else {
      if (config.hairStyle === 'long') {
        g.fillStyle(colors.hair, 1);
        g.fillRect(cx - headW / 2 + 1, headY, headW - 2, headH);
      }
    }

    // === ACCESSORY ===
    if (config.accessory) {
      const accColor = colors.accessory ?? colors.accent;
      switch (config.accessory) {
        case 'halo':
          g.fillStyle(accColor, 0.5);
          g.fillRect(cx - 5, headY - 2, 10, 1);
          g.fillRect(cx - 6, headY - 1, 12, 1);
          g.fillStyle(accColor, 0.2);
          g.fillRect(cx - 5, headY - 3, 10, 1);
          break;
        case 'staff': {
          const sX = cx + mx(9);
          g.fillStyle(this.darken(accColor, 0.5), 1);
          g.fillRect(sX, torsoY - 6, 2, oy + 29 - torsoY + 6);
          g.fillStyle(accColor, 1);
          g.fillRect(sX, torsoY - 6, 1, oy + 28 - torsoY + 6);
          g.fillStyle(0xd4a853, 1);
          g.fillRect(sX, torsoY - 6, 2, 2);
          break;
        }
        case 'scroll': {
          const scX = cx + mx(6);
          g.fillStyle(accColor, 1);
          g.fillRect(scX, torsoY + 2, 5, 7);
          g.fillStyle(this.darken(accColor, 0.7), 1);
          g.fillRect(scX, torsoY + 2, 5, 1);
          g.fillRect(scX, torsoY + 8, 5, 1);
          g.fillStyle(0x888880, 0.4);
          g.fillRect(scX + 1, torsoY + 4, 3, 1);
          g.fillRect(scX + 1, torsoY + 6, 3, 1);
          break;
        }
        case 'hat': {
          const hatC = accColor;
          g.fillStyle(this.darken(hatC, 0.7), 1);
          g.fillRect(cx - 7, headY - 2, 14, 2);
          g.fillStyle(hatC, 1);
          g.fillRect(cx - 5, headY - 8, 10, 7);
          g.fillStyle(this.lighten(hatC, 0.12), 0.25);
          g.fillRect(cx - 4, headY - 7, 3, 5);
          g.fillStyle(this.darken(hatC, 0.5), 0.7);
          g.fillRect(cx - 5, headY - 3, 10, 1);
          break;
        }
        case 'chains': {
          g.fillStyle(0x888888, 0.6);
          for (let i = 0; i < 3; i++) {
            g.fillRect(cx - 4 + i * 3, torsoY + torsoH + 1, 2, 2);
          }
          g.fillStyle(0x666666, 0.4);
          g.fillRect(cx - 4, torsoY + torsoH + 2, 8, 1);
          break;
        }
        case 'crown': {
          g.fillStyle(accColor, 1);
          g.fillRect(cx - 5, headY - 3, 10, 2);
          g.fillRect(cx - 5, headY - 5, 2, 3);
          g.fillRect(cx - 1, headY - 6, 2, 4);
          g.fillRect(cx + 3, headY - 5, 2, 3);
          g.fillStyle(0xff8888, 0.9);
          g.fillRect(cx - 4, headY - 5, 1, 1);
          g.fillStyle(0x88ff88, 0.9);
          g.fillRect(cx, headY - 6, 1, 1);
          break;
        }
      }
    }
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
