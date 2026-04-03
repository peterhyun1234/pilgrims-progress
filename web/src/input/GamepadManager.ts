import { PlayerInput } from '../entities/Player';

const AXIS_THRESHOLD = 0.3;

const BUTTON_MAP = {
  A: 0,
  B: 1,
  X: 2,
  Y: 3,
  LB: 4,
  RB: 5,
  START: 9,
  DPAD_UP: 12,
  DPAD_DOWN: 13,
  DPAD_LEFT: 14,
  DPAD_RIGHT: 15,
} as const;

export class GamepadManager {
  private prevButtons: boolean[] = [];
  private connected = false;

  private onConnect = (e: GamepadEvent) => {
    this.connected = true;
    this.prevButtons = new Array(e.gamepad.buttons.length).fill(false);
  };

  private onDisconnect = () => {
    this.connected = false;
    this.prevButtons = [];
  };

  constructor() {
    window.addEventListener('gamepadconnected', this.onConnect);
    window.addEventListener('gamepaddisconnected', this.onDisconnect);
  }

  private refresh(): Gamepad | null {
    if (!this.connected) return null;
    const gamepads = navigator.getGamepads();
    for (const gp of gamepads) {
      if (gp && gp.connected) return gp;
    }
    return null;
  }

  private justPressed(buttonIndex: number, gp: Gamepad): boolean {
    const pressed = gp.buttons[buttonIndex]?.pressed ?? false;
    const was = this.prevButtons[buttonIndex] ?? false;
    return pressed && !was;
  }

  getInput(): PlayerInput {
    const gp = this.refresh();
    if (!gp) return { x: 0, y: 0, interact: false };

    let x = 0;
    let y = 0;

    if (gp.axes.length >= 2) {
      const ax = gp.axes[0] ?? 0;
      const ay = gp.axes[1] ?? 0;
      if (Math.abs(ax) > AXIS_THRESHOLD) x = ax > 0 ? 1 : -1;
      if (Math.abs(ay) > AXIS_THRESHOLD) y = ay > 0 ? 1 : -1;
    }

    if (gp.buttons[BUTTON_MAP.DPAD_LEFT]?.pressed) x = -1;
    if (gp.buttons[BUTTON_MAP.DPAD_RIGHT]?.pressed) x = 1;
    if (gp.buttons[BUTTON_MAP.DPAD_UP]?.pressed) y = -1;
    if (gp.buttons[BUTTON_MAP.DPAD_DOWN]?.pressed) y = 1;

    const interact = this.justPressed(BUTTON_MAP.A, gp);

    return { x, y, interact };
  }

  isStartPressed(): boolean {
    const gp = this.refresh();
    if (!gp) return false;
    return this.justPressed(BUTTON_MAP.START, gp);
  }

  isBPressed(): boolean {
    const gp = this.refresh();
    if (!gp) return false;
    return this.justPressed(BUTTON_MAP.B, gp);
  }

  updatePrevState(): void {
    const gp = this.refresh();
    if (!gp) return;
    this.prevButtons = gp.buttons.map(b => b.pressed);
  }

  get isConnected(): boolean {
    return this.connected;
  }

  destroy(): void {
    window.removeEventListener('gamepadconnected', this.onConnect);
    window.removeEventListener('gamepaddisconnected', this.onDisconnect);
  }
}
