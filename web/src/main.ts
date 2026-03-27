import Phaser from 'phaser';
import UIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin.js';
import { ErrorBoundary } from './core/ErrorBoundary';

// Install global error recovery before anything else
ErrorBoundary.install();
import { GAME_WIDTH, GAME_HEIGHT } from './config';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { LanguageScene } from './scenes/LanguageScene';
import { MenuScene } from './scenes/MenuScene';
import { OnboardingScene } from './scenes/OnboardingScene';
import { GameScene } from './scenes/GameScene';
import { BattleScene } from './scenes/BattleScene';
import { CutsceneScene } from './scenes/CutsceneScene';
import { SettingsScene } from './scenes/SettingsScene';
import { EndingScene } from './scenes/EndingScene';

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
  plugins: {
    scene: [
      { key: 'rexUI', plugin: UIPlugin, mapping: 'rexUI' },
    ],
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
    SettingsScene,
    EndingScene,
  ],
  backgroundColor: '#0A0814',
};

// Wait for fonts (including Galmuri11 via @font-face swap) before initializing
// to prevent Phaser Text drawImage errors during the font-swap window.
let game: Phaser.Game;

document.fonts.ready.then(() => {
  game = new Phaser.Game(config);
  (window as unknown as Record<string, unknown>).__game = game;

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      game.sound.setMute(true);
    } else {
      game.sound.setMute(false);
    }
  });
});

window.addEventListener('load', () => {
  setTimeout(() => {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.classList.add('hidden');
  }, 1500);
});

export default game!;
