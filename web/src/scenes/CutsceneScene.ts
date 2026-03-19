import Phaser from 'phaser';
import { SCENE_KEYS } from '../config';

export class CutsceneScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.CUTSCENE);
  }

  create(): void {
    // Cutscene system - used for special events like the Cross scene (Ch6)
  }
}
