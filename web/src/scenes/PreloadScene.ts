import Phaser from 'phaser';
import { SCENE_KEYS, GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config';

const CHARACTER_SPRITES = [
  'christian', 'christian_free', 'evangelist', 'obstinate', 'pliable',
  'help', 'worldlywiseman', 'goodwill', 'interpreter', 'faithful',
  'hopeful', 'apollyon', 'giant_despair', 'flatterer', 'ignorance',
  'piety', 'prudence', 'charity', 'demas', 'diffidence', 'byends',
  'atheist', 'shepherd1', 'shepherd2', 'shepherd3', 'shepherd4',
  'shining1', 'shining2', 'shining3',
];

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.PRELOAD);
  }

  preload(): void {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    const barBg = this.add.rectangle(cx, cy, 200, 10, COLORS.UI.PANEL);
    barBg.setStrokeStyle(1, COLORS.UI.PANEL_BORDER);

    const barFill = this.add.rectangle(cx - 99, cy, 0, 8, COLORS.UI.GOLD);
    barFill.setOrigin(0, 0.5);

    const loadingText = this.add.text(cx, cy - 16, 'Loading...', {
      fontSize: '8px',
      color: '#E6C86E',
    });
    loadingText.setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      barFill.width = 198 * value;
    });

    this.load.on('complete', () => {
      barBg.destroy();
      barFill.destroy();
      loadingText.destroy();
    });

    for (const name of CHARACTER_SPRITES) {
      this.load.spritesheet(name, `assets/sprites/characters/${name}_spritesheet.png`, {
        frameWidth: 16,
        frameHeight: 16,
      });
    }

    this.load.json('ink_ch01', 'assets/ink/ch01.ink.json');
  }

  create(): void {
    this.createAnimations();
    this.scene.start(SCENE_KEYS.LANGUAGE);
  }

  private createAnimations(): void {
    for (const name of CHARACTER_SPRITES) {
      if (!this.textures.exists(name)) continue;

      const directions = ['down', 'left', 'right', 'up'];
      for (let d = 0; d < 4; d++) {
        this.anims.create({
          key: `${name}_idle_${directions[d]}`,
          frames: [{ key: name, frame: d * 2 }],
          frameRate: 1,
          repeat: -1,
        });
        this.anims.create({
          key: `${name}_walk_${directions[d]}`,
          frames: [
            { key: name, frame: d * 2 },
            { key: name, frame: d * 2 + 1 },
          ],
          frameRate: 6,
          repeat: -1,
        });
      }
    }
  }
}
