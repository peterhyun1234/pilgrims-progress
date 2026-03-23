import { PlayerInput } from '../entities/Player';
import { GamepadManager } from './GamepadManager';

export class InputManager {
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys | null = null;
  private wasd: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key } | null = null;
  private interactKey: Phaser.Input.Keyboard.Key | null = null;
  private escKey: Phaser.Input.Keyboard.Key | null = null;
  private gamepad: GamepadManager;

  constructor(scene: Phaser.Scene) {
    if (scene.input.keyboard) {
      this.cursors = scene.input.keyboard.createCursorKeys();
      this.wasd = {
        W: scene.input.keyboard.addKey('W'),
        A: scene.input.keyboard.addKey('A'),
        S: scene.input.keyboard.addKey('S'),
        D: scene.input.keyboard.addKey('D'),
      };
      this.interactKey = scene.input.keyboard.addKey('E');
      this.escKey = scene.input.keyboard.addKey('ESC');
    }
    this.gamepad = new GamepadManager();
  }

  getInput(): PlayerInput {
    let x = 0;
    let y = 0;
    let interact = false;

    if (this.cursors) {
      if (this.cursors.left.isDown) x = -1;
      else if (this.cursors.right.isDown) x = 1;
      if (this.cursors.up.isDown) y = -1;
      else if (this.cursors.down.isDown) y = 1;
    }

    if (this.wasd) {
      if (this.wasd.A.isDown) x = -1;
      else if (this.wasd.D.isDown) x = 1;
      if (this.wasd.W.isDown) y = -1;
      else if (this.wasd.S.isDown) y = 1;
    }

    if (this.interactKey && Phaser.Input.Keyboard.JustDown(this.interactKey)) {
      interact = true;
    }

    const gpInput = this.gamepad.getInput();
    if (gpInput.x !== 0 || gpInput.y !== 0) {
      x = gpInput.x;
      y = gpInput.y;
    }
    if (gpInput.interact) interact = true;

    this.gamepad.updatePrevState();
    return { x, y, interact };
  }

  isEscPressed(): boolean {
    const kbEsc = this.escKey ? Phaser.Input.Keyboard.JustDown(this.escKey) : false;
    return kbEsc || this.gamepad.isStartPressed();
  }

  get gamepadManager(): GamepadManager {
    return this.gamepad;
  }

  destroy(): void {
    this.gamepad.destroy();
  }
}
