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
  // CHRISTIAN — detailed pilgrim with burden, hat, cross badge, faith aura
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

    // Animation offsets
    let bobY = 0;
    let legOffset = 0;
    let armSwing = 0;
    if (anim === 'idle') {
      bobY = Math.sin((frame / 4) * Math.PI * 2) * 1.0;  // slightly more pronounced idle bob
    } else {
      const phase = (frame / 6) * Math.PI * 2;
      bobY = Math.abs(Math.sin(phase)) * -1.8;            // deeper walk dip
      legOffset = Math.sin(phase) * 5;                    // wider leg stride
      armSwing = Math.sin(phase) * 4;                     // fuller arm swing
    }

    // === Ground shadow (oval under feet) ===
    g.fillStyle(0x000000, 0.35);
    g.fillEllipse(cx, oy + 29, 14, 4);
    g.fillStyle(0x000000, 0.12);
    g.fillEllipse(cx, oy + 29, 20, 6);

    // === Faith aura — pulsing golden glow ===
    const auraPulse = 0.06 + Math.sin((frame / 4) * Math.PI * 2) * 0.03;
    g.fillStyle(0xd4a853, auraPulse);
    g.fillCircle(cx, oy + 16 + bobY, 14);
    g.fillStyle(0xffd080, auraPulse * 0.6);
    g.fillCircle(cx, oy + 16 + bobY, 10);

    // === Boots ===
    const footY = Math.round(oy + 26 + bobY);
    const bootColor = 0x3a2510;
    const bootHighlight = 0x5a3820;
    if (dir === 'left' || dir === 'right') {
      g.fillStyle(bootColor, 1);
      g.fillRect(cx - 3, footY - 2 + Math.round(legOffset), 4, 5);
      g.fillRect(cx + 1, footY - 2 - Math.round(legOffset), 4, 5);
      g.fillStyle(bootHighlight, 0.5);
      g.fillRect(cx - 3, footY - 2 + Math.round(legOffset), 1, 4);
      g.fillRect(cx + 1, footY - 2 - Math.round(legOffset), 1, 4);
    } else {
      // Front / back — boots splayed outward
      g.fillStyle(bootColor, 1);
      g.fillRect(cx - 6, footY - 2 + Math.round(legOffset), 4, 5);
      g.fillRect(cx + 2, footY - 2 - Math.round(legOffset), 4, 5);
      g.fillStyle(bootHighlight, 0.5);
      g.fillRect(cx - 6, footY - 2 + Math.round(legOffset), 1, 4);
      g.fillRect(cx + 2, footY - 2 - Math.round(legOffset), 1, 4);
    }

    // === Legs ===
    const legColor = this.darken(colors.clothing, 0.7);
    const bodyY = Math.round(oy + 15 + bobY);
    if (dir === 'left' || dir === 'right') {
      g.fillStyle(legColor, 1);
      g.fillRect(cx - 3, bodyY + 10 + Math.round(legOffset), 3, 4);
      g.fillRect(cx + 1, bodyY + 10 - Math.round(legOffset), 3, 4);
    } else {
      g.fillStyle(legColor, 1);
      g.fillRect(cx - 6, bodyY + 10 + Math.round(legOffset), 3, 4);
      g.fillRect(cx + 2, bodyY + 10 - Math.round(legOffset), 3, 4);
    }

    // === Burden/backpack (behind torso for most views) ===
    if (dir !== 'left') {
      const burdenX = dir === 'right' ? cx - 8 : cx + 1;
      const burdenW = 9;
      const burdenH = 11;
      const burdenY = Math.round(bodyY - 4);
      // Sack shadow
      g.fillStyle(0x000000, 0.28);
      g.fillRoundedRect(burdenX + 1, burdenY + 1, burdenW, burdenH, 2);
      // Sack body — weathered tan
      g.fillStyle(0x8b7355, 1);
      g.fillRoundedRect(burdenX, burdenY, burdenW, burdenH, 2);
      // Sack highlight (upper-left)
      g.fillStyle(0xb09870, 0.45);
      g.fillRoundedRect(burdenX + 1, burdenY + 1, 3, 5, 1);
      // Sack dark side (right)
      g.fillStyle(0x000000, 0.18);
      g.fillRect(burdenX + burdenW - 2, burdenY + 1, 2, burdenH - 2);
      // Rope tie at top
      g.fillStyle(0x4a3a2a, 1);
      g.fillRect(burdenX + 2, burdenY, burdenW - 4, 2);
      // Rope knot pixel
      g.fillStyle(0x6a5a3a, 1);
      g.fillRect(burdenX + Math.floor(burdenW / 2) - 1, burdenY, 2, 2);
      // Strap from shoulder to sack
      g.lineStyle(1.5, 0x5a4a3a, 0.65);
      g.lineBetween(cx, bodyY, burdenX + Math.floor(burdenW / 2), burdenY);
    }

    // === Torso / Cloak ===
    const bodyH = 12;
    // Cloak base — warm brown pilgrim cloak
    g.fillStyle(colors.clothing, 1);
    g.fillRoundedRect(cx - 6, bodyY, 12, bodyH, 2);
    // Cloak fold lines for depth (side views)
    if (dir === 'left' || dir === 'right') {
      g.fillStyle(0x000000, 0.15);
      g.fillRect(cx - 2, bodyY + 2, 1, bodyH - 4);
      g.fillRect(cx + 1, bodyY + 3, 1, bodyH - 5);
    }
    // Cloak dark sides
    g.fillStyle(this.darken(colors.clothing, 0.7), 0.5);
    g.fillRect(cx - 6, bodyY, 2, bodyH);
    g.fillRect(cx + 4, bodyY, 2, bodyH);
    // Cloak center highlight strip
    g.fillStyle(0xffffff, 0.07);
    g.fillRect(cx - 2, bodyY + 1, 4, bodyH - 2);
    // Belt accent
    g.fillStyle(colors.accent, 1);
    g.fillRect(cx - 5, bodyY + bodyH - 4, 10, 2);
    // Belt buckle (gold pixel)
    g.fillStyle(0xffd080, 0.95);
    g.fillRect(cx - 1, bodyY + bodyH - 4, 2, 2);

    // === Cross badge on chest (front-facing and right-side views) ===
    if (dir === 'down' || dir === 'right') {
      const badgeX = dir === 'right' ? cx + 1 : cx - 1;
      const badgeY = bodyY + 3;
      // Subtle gold glow behind cross
      g.fillStyle(0xffd080, 0.22);
      g.fillCircle(badgeX, badgeY + 1, 3);
      // Cross — 1px vertical + 1px horizontal
      g.fillStyle(0xffd080, 1);
      g.fillRect(badgeX, badgeY, 1, 3);
      g.fillRect(badgeX - 1, badgeY + 1, 3, 1);
    }

    // === Arms ===
    if (dir === 'down' || dir === 'up') {
      g.fillStyle(colors.clothing, 1);
      g.fillRect(cx - 9, bodyY + 1 + Math.round(armSwing), 3, 8);
      g.fillRect(cx + 6, bodyY + 1 - Math.round(armSwing), 3, 8);
      // Hand skin pixels
      g.fillStyle(colors.skin, 1);
      g.fillRect(cx - 9, bodyY + 9 + Math.round(armSwing), 3, 2);
      g.fillRect(cx + 6, bodyY + 9 - Math.round(armSwing), 3, 2);
      // Arm shadow line
      g.fillStyle(0x000000, 0.12);
      g.fillRect(cx - 6, bodyY + 1, 1, 8);
      g.fillRect(cx + 9, bodyY + 1, 1, 8);
    } else {
      const armX = dir === 'right' ? cx - 8 : cx + 5;
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

    // Head pixel-art grid (round-ish shape via fillRect clusters)
    g.fillStyle(0x111111, 0.85);
    g.fillRect(cx - 5, headY, 10, 10); // outline pass (slightly large)

    g.fillStyle(colors.skin, 1);
    g.fillRect(cx - 4, headY, 8, 10);    // main face area
    g.fillRect(cx - 5, headY + 1, 10, 8); // widen middle rows
    // Skin shading — subtle right-side shadow
    g.fillStyle(this.darken(colors.skin, 0.82), 0.4);
    g.fillRect(cx + 2, headY + 2, 3, 6);
    // Forehead highlight
    g.fillStyle(0xffffff, 0.12);
    g.fillRect(cx - 3, headY + 1, 3, 2);

    // Hair (short pilgrim hair under hat brim — barely visible)
    g.fillStyle(colors.hair, 1);
    g.fillRect(cx - 4, headY, 8, 2);    // top hair band

    // Eyes (front view)
    if (dir === 'down') {
      // Left eye white
      g.fillStyle(0xffffff, 1);
      g.fillRect(cx - 4, headY + 4, 3, 3);
      g.fillRect(cx + 1, headY + 4, 3, 3);
      // Pupils
      g.fillStyle(colors.eye, 1);
      g.fillRect(cx - 3, headY + 5, 2, 2);
      g.fillRect(cx + 2, headY + 5, 2, 2);
      // Eye shine pixel
      g.fillStyle(0xffffff, 0.8);
      g.fillRect(cx - 2, headY + 5, 1, 1);
      g.fillRect(cx + 3, headY + 5, 1, 1);
      // Small nose dot
      g.fillStyle(this.darken(colors.skin, 0.78), 0.8);
      g.fillRect(cx - 1, headY + 7, 1, 1);
      // Mouth
      g.fillStyle(this.darken(colors.skin, 0.65), 1);
      g.fillRect(cx - 1, headY + 8, 3, 1);
    } else if (dir !== 'up') {
      // Side-view eye
      const eyeX = dir === 'right' ? cx + 1 : cx - 4;
      g.fillStyle(0xffffff, 1);
      g.fillRect(eyeX, headY + 4, 3, 3);
      g.fillStyle(colors.eye, 1);
      g.fillRect(eyeX + (dir === 'right' ? 1 : 0), headY + 5, 2, 2);
      g.fillStyle(0xffffff, 0.8);
      g.fillRect(eyeX + (dir === 'right' ? 2 : 0), headY + 5, 1, 1);
      // Nose bridge pixel
      g.fillStyle(this.darken(colors.skin, 0.8), 0.7);
      g.fillRect(dir === 'right' ? cx + 4 : cx - 5, headY + 7, 1, 1);
      // Mouth
      const mouthX = dir === 'right' ? cx + 2 : cx - 3;
      g.fillStyle(this.darken(colors.skin, 0.65), 1);
      g.fillRect(mouthX, headY + 8, 2, 1);
    } else {
      // Back of head — just hair/hat base
      g.fillStyle(colors.hair, 1);
      g.fillRect(cx - 4, headY, 8, 6);
    }

    // === Pilgrim Hat (drawn over head) ===
    const hatColor = colors.accessory ?? 0x7a5c38;
    const hatDark = this.darken(hatColor, 0.65);
    // Wide brim
    g.fillStyle(hatDark, 1);
    g.fillRect(cx - 8, headY - 2, 16, 3);
    // Brim highlight edge (top)
    g.fillStyle(0xffffff, 0.1);
    g.fillRect(cx - 8, headY - 2, 16, 1);
    // Brim shadow (bottom)
    g.fillStyle(0x000000, 0.2);
    g.fillRect(cx - 8, headY, 16, 1);
    // Tall crown
    g.fillStyle(hatColor, 1);
    g.fillRect(cx - 5, headY - 9, 10, 8);
    // Crown highlight (left face)
    g.fillStyle(0xffffff, 0.12);
    g.fillRect(cx - 5, headY - 9, 2, 7);
    // Crown dark right side
    g.fillStyle(0x000000, 0.18);
    g.fillRect(cx + 4, headY - 9, 1, 7);
    // Hat band (thin darker stripe)
    g.fillStyle(hatDark, 0.9);
    g.fillRect(cx - 5, headY - 2, 10, 1);

    // === Silhouette outline pass — improves background separation ===
    // Torso outline
    this.outlineRoundedRect(g, cx - 6, Math.round(oy + 15 + bobY), 12, 12, 2, 0.6);
    // Head + hat outline (approximate)
    this.outlineRect(g, cx - 8, headY - 9, 16, 19, 0.45);
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

    let bobY = 0;
    let armSwing = 0;
    if (anim === 'idle') {
      bobY = Math.sin((frame / 4) * Math.PI * 2) * 0.8;
    } else {
      const phase = (frame / 6) * Math.PI * 2;
      bobY = Math.abs(Math.sin(phase)) * -1.4;
      armSwing = Math.sin(phase) * 3;
    }

    // Shadow
    g.fillStyle(0x000000, 0.3);
    g.fillEllipse(cx, oy + 30, 12, 4);

    // Staff (drawn first — behind body)
    const staffX = dir === 'right' ? cx + 10 : cx - 10;
    g.lineStyle(3, 0x6a4a20, 0.9);
    g.lineBetween(staffX, Math.round(oy + 4 + bobY) - 4, staffX, oy + 29);
    // Staff grain lines
    g.lineStyle(1, 0x8a6a40, 0.3);
    g.lineBetween(staffX - 1, Math.round(oy + 4 + bobY), staffX - 1, oy + 27);
    g.lineStyle(1, 0x4a2a10, 0.25);
    g.lineBetween(staffX + 1, Math.round(oy + 4 + bobY), staffX + 1, oy + 28);
    // Staff knob top
    g.fillStyle(colors.accessory ?? 0xd4a853, 1);
    g.fillCircle(staffX, Math.round(oy + 4 + bobY) - 4, 2);
    g.fillStyle(0xffd080, 0.4);
    g.fillCircle(staffX - 0.5, Math.round(oy + 4 + bobY) - 5, 1);

    // === Robe (long, narrow, gray-white) ===
    const bodyY = Math.round(oy + 13 + bobY);
    const robeColor = 0xd0c8c0;
    const robeDark = this.darken(robeColor, 0.72);

    // Robe body — slightly narrower than generic
    g.fillStyle(robeColor, 1);
    g.fillRoundedRect(cx - 5, bodyY, 10, 16, 2);
    // Robe vertical fold lines (3 folds)
    g.fillStyle(robeDark, 0.4);
    g.fillRect(cx - 3, bodyY + 2, 1, 13);
    g.fillRect(cx, bodyY + 1, 1, 14);
    g.fillRect(cx + 2, bodyY + 3, 1, 12);
    // Robe dark sides
    g.fillStyle(robeDark, 0.55);
    g.fillRect(cx - 5, bodyY, 2, 16);
    g.fillRect(cx + 3, bodyY, 2, 16);
    // Center highlight
    g.fillStyle(0xffffff, 0.1);
    g.fillRect(cx - 2, bodyY + 1, 3, 14);

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
    // Left arm: hangs or slight sway
    if (dir === 'down' || dir === 'up') {
      g.fillStyle(robeColor, 1);
      g.fillRect(cx - 8, bodyY + 1 - Math.round(armSwing), 3, 7);
      g.fillStyle(colors.skin, 1);
      g.fillRect(cx - 8, bodyY + 8 - Math.round(armSwing), 3, 2);
    }

    // Pointing arm (right arm, extended outward)
    if (dir === 'down' || (dir === 'left' && anim !== 'walk') || dir === 'right') {
      g.fillStyle(robeColor, 1);
      const ptArmX = dir === 'left' ? cx - 8 : cx + 5;
      const ptArmY = bodyY + 1;
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
