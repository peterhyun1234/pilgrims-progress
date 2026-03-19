import Phaser from 'phaser';
import { SCENE_KEYS } from '../config';

export class BattleScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.BATTLE);
  }

  create(): void {
    // QTE battle system - to be implemented for Ch8 (Apollyon)
  }
}
