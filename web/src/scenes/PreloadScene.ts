import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, SCENE_KEYS, COLORS, PLAYER } from '../config';
import { DesignSystem } from '../ui/DesignSystem';
import { CharacterSpriteFactory } from '../entities/CharacterSpriteFactory';
import { AnimationRegistry, DEFAULT_ANIM_SET_32, LEGACY_ANIM_SET_16 } from '../entities/AnimationRegistry';

/** Characters that have PortraitConfig and will get generated 32×32 sprites */
const GENERATED_CHARACTERS = [
  // Ch1-6
  'christian', 'evangelist', 'obstinate', 'pliable',
  'help', 'worldly_wiseman', 'goodwill', 'interpreter',
  'shining_ones',
  // Ch7: Beautiful Palace
  'timorous', 'mistrust', 'watchful', 'prudence', 'piety', 'charity',
  // Ch9-10: Companions
  'faithful', 'hopeful',
  // Ch10: Vanity Fair
  'lord_hategood',
  // Ch11: Doubting Castle
  'diffidence',
  // Ch12: Final
  'ignorance',
];

/** Characters loaded from legacy 16×16 PNGs (no portrait config yet) */
const LEGACY_SPRITE_MAP: Record<string, string> = {
  faithful: 'faithful_spritesheet',
  hopeful: 'hopeful_spritesheet',
  apollyon: 'apollyon_spritesheet',
  giant_despair: 'giant_despair_spritesheet',
};

export class PreloadScene extends Phaser.Scene {
  private progressBar!: Phaser.GameObjects.Graphics;
  private progressFill!: Phaser.GameObjects.Graphics;
  private progressText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: SCENE_KEYS.PRELOAD });
  }

  preload(): void {
    this.cameras.main.setBackgroundColor(COLORS.UI.DARK_BG);
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    const barW = 200;
    const barH = 7;
    const barY = cy + 22;

    this.add.text(cx, cy - 12, "PILGRIM'S PROGRESS",
      DesignSystem.goldTextStyle(DesignSystem.FONT_SIZE.XL),
    ).setOrigin(0.5);

    this.progressBar = this.add.graphics();
    this.progressBar.fillStyle(0x222222, 0.8);
    this.progressBar.fillRoundedRect(cx - barW / 2, barY, barW, barH, 3);

    this.progressFill = this.add.graphics();

    this.progressText = this.add.text(cx, barY + 18, '0%',
      DesignSystem.mutedTextStyle(DesignSystem.FONT_SIZE.XS),
    ).setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      this.progressFill.clear();
      this.progressFill.fillStyle(COLORS.UI.GOLD, 0.9);
      this.progressFill.fillRoundedRect(cx - barW / 2, barY, barW * value, barH, 3);
      this.progressText.setText(`${Math.floor(value * 100)}%`);
    });

    this.loadAssets();
  }

  private loadAssets(): void {
    // Load legacy 16×16 spritesheets for characters without portrait configs
    Object.entries(LEGACY_SPRITE_MAP).forEach(([key, file]) => {
      this.load.spritesheet(key, `assets/sprites/characters/${file}.png`, {
        frameWidth: PLAYER.LEGACY_SPRITE_SIZE,
        frameHeight: PLAYER.LEGACY_SPRITE_SIZE,
      });
    });

    // Ink story data — all 12 chapters compiled into a single JSON
    this.load.json('story_ink', 'assets/ink/story.ink.json');
  }

  create(): void {
    // Generate 32×32 spritesheets for main characters
    this.generateCharacterSprites();

    // Register all animations
    this.registerAnimations();

    this.time.delayedCall(200, () => this.scene.start(SCENE_KEYS.LANGUAGE));
  }

  private generateCharacterSprites(): void {
    for (const id of GENERATED_CHARACTERS) {
      CharacterSpriteFactory.generate(this, id);
    }
  }

  private registerAnimations(): void {
    // Register generated 32×32 characters
    for (const id of GENERATED_CHARACTERS) {
      const texKey = `${id}_gen`;
      if (this.textures.exists(texKey)) {
        AnimationRegistry.register(this, texKey, DEFAULT_ANIM_SET_32);
      }
    }

    // Register legacy 16×16 characters
    for (const key of Object.keys(LEGACY_SPRITE_MAP)) {
      if (this.textures.exists(key)) {
        AnimationRegistry.register(this, key, LEGACY_ANIM_SET_16);
      }
    }
  }
}
