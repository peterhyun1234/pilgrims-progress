import Phaser from 'phaser';

export interface MovementInput {
  x: number;
  y: number;
  interact: boolean;
  cancel: boolean;
}

export class InputManager {
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
  private interactKey: Phaser.Input.Keyboard.Key;
  private cancelKey: Phaser.Input.Keyboard.Key;
  private spaceKey: Phaser.Input.Keyboard.Key;

  private virtualInput: MovementInput = { x: 0, y: 0, interact: false, cancel: false };
  private isTouchDevice: boolean;

  constructor(scene: Phaser.Scene) {
    const kb = scene.input.keyboard!;
    this.cursors = kb.createCursorKeys();
    this.wasd = {
      W: kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: kb.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.interactKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.cancelKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.spaceKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  getMovement(): MovementInput {
    let x = 0;
    let y = 0;

    if (this.cursors.left.isDown || this.wasd.A.isDown) x = -1;
    else if (this.cursors.right.isDown || this.wasd.D.isDown) x = 1;

    if (this.cursors.up.isDown || this.wasd.W.isDown) y = -1;
    else if (this.cursors.down.isDown || this.wasd.S.isDown) y = 1;

    if (x !== 0 && y !== 0) {
      const diag = Math.SQRT1_2;
      x *= diag;
      y *= diag;
    }

    if (this.virtualInput.x !== 0 || this.virtualInput.y !== 0) {
      x = this.virtualInput.x;
      y = this.virtualInput.y;
    }

    const interact =
      Phaser.Input.Keyboard.JustDown(this.interactKey) ||
      Phaser.Input.Keyboard.JustDown(this.spaceKey) ||
      this.virtualInput.interact;

    const cancel =
      Phaser.Input.Keyboard.JustDown(this.cancelKey) ||
      this.virtualInput.cancel;

    this.virtualInput.interact = false;
    this.virtualInput.cancel = false;

    return { x, y, interact, cancel };
  }

  setVirtualInput(input: Partial<MovementInput>): void {
    Object.assign(this.virtualInput, input);
  }

  get isTouch(): boolean {
    return this.isTouchDevice;
  }
}
