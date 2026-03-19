import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from './config';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { LanguageScene } from './scenes/LanguageScene';
import { MenuScene } from './scenes/MenuScene';
import { OnboardingScene } from './scenes/OnboardingScene';
import { GameScene } from './scenes/GameScene';
import { BattleScene } from './scenes/BattleScene';
import { CutsceneScene } from './scenes/CutsceneScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  pixelArt: true,
  roundPixels: true,
  antialias: false,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [
    BootScene,
    PreloadScene,
    LanguageScene,
    MenuScene,
    OnboardingScene,
    GameScene,
    BattleScene,
    CutsceneScene,
  ],
  backgroundColor: '#0A0814',
};

new Phaser.Game(config);
