import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, SCENE_KEYS, COLORS } from '../config';
import { DesignSystem } from '../ui/DesignSystem';

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
    const spriteMap: Record<string, string> = {
      christian: 'christian_spritesheet',
      evangelist: 'evangelist_spritesheet',
      obstinate: 'obstinate_spritesheet',
      pliable: 'pliable_spritesheet',
      help: 'help_spritesheet',
      worldly_wiseman: 'worldlywiseman_spritesheet',
      goodwill: 'goodwill_spritesheet',
      interpreter: 'interpreter_spritesheet',
      faithful: 'faithful_spritesheet',
      hopeful: 'hopeful_spritesheet',
    };

    Object.entries(spriteMap).forEach(([key, file]) => {
      this.load.spritesheet(key, `assets/sprites/characters/${file}.png`, {
        frameWidth: 16, frameHeight: 16,
      });
    });

    this.load.json('ch01_ink', 'assets/ink/ch01.ink.json');
  }

  create(): void {
    this.createAnimations();
    this.time.delayedCall(200, () => this.scene.start(SCENE_KEYS.LANGUAGE));
  }

  private createAnimations(): void {
    const characters = [
      'christian', 'evangelist', 'obstinate', 'pliable',
      'help', 'worldly_wiseman', 'goodwill', 'interpreter',
      'faithful', 'hopeful',
    ];
    const directions = ['down', 'left', 'right', 'up'];
    const cols = 3;

    characters.forEach(char => {
      if (!this.textures.exists(char)) return;
      directions.forEach((dir, dirIndex) => {
        const start = dirIndex * cols;
        this.anims.create({
          key: `${char}_idle_${dir}`,
          frames: [{ key: char, frame: start }],
          frameRate: 1,
        });
        this.anims.create({
          key: `${char}_walk_${dir}`,
          frames: this.anims.generateFrameNumbers(char, { start, end: start + cols - 1 }),
          frameRate: 8, repeat: -1,
        });
      });
    });
  }
}
