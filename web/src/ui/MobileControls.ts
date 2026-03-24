import { GAME_WIDTH, GAME_HEIGHT, TOUCH } from '../config';
import { EventBus } from '../core/EventBus';
import { GameEvent, GameState } from '../core/GameEvents';
import { DesignSystem } from './DesignSystem';

export interface VirtualInput {
  x: number;
  y: number;
  interact: boolean;
}

export class MobileControls {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private joystickOuter: Phaser.GameObjects.Graphics;
  private joystickInner: Phaser.GameObjects.Graphics;
  private actionBtn: Phaser.GameObjects.Container;
  private actionBtnBg!: Phaser.GameObjects.Graphics;
  private actionLabelText!: Phaser.GameObjects.Text;
  private actionBtnHit!: Phaser.GameObjects.Arc;
  private hintContainer: Phaser.GameObjects.Container | null = null;

  private joystickActive = false;
  private joystickOrigin = { x: 0, y: 0 };
  private joystickPointer: number | null = null;
  private _virtualInput: VirtualInput = { x: 0, y: 0, interact: false };
  private isVisible = false;
  private contextLabel = 'A';
  private hasShownHint = false;

  private static readonly JOYSTICK_R = TOUCH.JOYSTICK_SIZE / 2;
  private static readonly INNER_R = TOUCH.JOYSTICK_INNER / 2;
  private static readonly ACTION_R = TOUCH.BUTTON_SIZE / 2;
  private static readonly MARGIN = 32;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(0, 0).setDepth(300).setScrollFactor(0);

    this.joystickOuter = this.makeJoystickOuter();
    this.joystickInner = this.makeJoystickInner();
    this.actionBtn = this.makeActionButton();

    this.container.add([this.joystickOuter, this.joystickInner, this.actionBtn]);
    this.setupInput();
    this.setupEvents();
    this.hideControls();
  }

  private makeJoystickOuter(): Phaser.GameObjects.Graphics {
    const g = this.scene.add.graphics();
    g.lineStyle(1.5, 0xd4a853, 0.15);
    g.strokeCircle(0, 0, MobileControls.JOYSTICK_R);
    g.fillStyle(0x111020, 0.12);
    g.fillCircle(0, 0, MobileControls.JOYSTICK_R);
    const dz = TOUCH.JOYSTICK_DEADZONE;
    g.lineStyle(0.5, 0xd4a853, 0.06);
    g.strokeCircle(0, 0, dz);
    g.setPosition(
      MobileControls.MARGIN + MobileControls.JOYSTICK_R,
      GAME_HEIGHT - MobileControls.MARGIN - MobileControls.JOYSTICK_R,
    );
    g.setAlpha(0);
    return g;
  }

  private makeJoystickInner(): Phaser.GameObjects.Graphics {
    const g = this.scene.add.graphics();
    g.fillStyle(0xd4a853, 0.35);
    g.fillCircle(0, 0, MobileControls.INNER_R);
    g.lineStyle(1, 0xd4a853, 0.5);
    g.strokeCircle(0, 0, MobileControls.INNER_R);
    g.fillStyle(0xffffff, 0.1);
    g.fillCircle(-1, -1, MobileControls.INNER_R * 0.5);
    g.setPosition(this.joystickOuter.x, this.joystickOuter.y);
    g.setAlpha(0);
    return g;
  }

  private makeActionButton(): Phaser.GameObjects.Container {
    const r = MobileControls.ACTION_R;
    const c = this.scene.add.container(
      GAME_WIDTH - MobileControls.MARGIN - r,
      GAME_HEIGHT - MobileControls.MARGIN - r,
    );

    this.actionBtnBg = this.scene.add.graphics();
    this.drawActionBtn(false);

    this.actionLabelText = this.scene.add.text(0, 0, this.contextLabel,
      DesignSystem.goldTextStyle(DesignSystem.FONT_SIZE.SM),
    ).setOrigin(0.5).setStyle({ fontStyle: 'bold' });

    this.actionBtnHit = this.scene.add.circle(0, 0, r + 6, 0, 0).setInteractive();
    const hit = this.actionBtnHit;
    hit.on('pointerdown', () => {
      this._virtualInput.interact = true;
      this.drawActionBtn(true);
      this.scene.tweens.add({
        targets: c, scaleX: 0.9, scaleY: 0.9, duration: 50, yoyo: true, ease: 'Sine.easeInOut',
      });
    });
    hit.on('pointerup', () => {
      this._virtualInput.interact = false;
      this.drawActionBtn(false);
    });
    hit.on('pointerout', () => {
      this._virtualInput.interact = false;
      this.drawActionBtn(false);
    });

    c.add([this.actionBtnBg, this.actionLabelText, hit]);
    return c;
  }

  private drawActionBtn(pressed: boolean): void {
    const r = MobileControls.ACTION_R;
    this.actionBtnBg.clear();

    if (pressed) {
      this.actionBtnBg.fillStyle(0x4a3a10, 0.8);
      this.actionBtnBg.fillCircle(0, 0, r - 1);
      this.actionBtnBg.lineStyle(2, 0xd4a853, 0.9);
      this.actionBtnBg.strokeCircle(0, 0, r - 1);
    } else {
      this.actionBtnBg.fillStyle(0x1a1428, 0.5);
      this.actionBtnBg.fillCircle(0, 0, r);
      this.actionBtnBg.lineStyle(1.5, 0xd4a853, 0.35);
      this.actionBtnBg.strokeCircle(0, 0, r);
      this.actionBtnBg.fillStyle(0xffffff, 0.04);
      this.actionBtnBg.fillCircle(-2, -2, r * 0.6);
    }
  }

  private setupInput(): void {
    const halfW = GAME_WIDTH * 0.55;

    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!this.isVisible || pointer.x > halfW) return;
      this.joystickActive = true;
      this.joystickPointer = pointer.pointerId;
      this.joystickOrigin = { x: pointer.x, y: pointer.y };

      this.joystickOuter.setPosition(pointer.x, pointer.y);
      this.joystickInner.setPosition(pointer.x, pointer.y);
      this.scene.tweens.add({
        targets: [this.joystickOuter, this.joystickInner],
        alpha: 1, duration: 80,
      });
    });

    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.joystickActive || pointer.pointerId !== this.joystickPointer) return;
      const dx = pointer.x - this.joystickOrigin.x;
      const dy = pointer.y - this.joystickOrigin.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = MobileControls.JOYSTICK_R;

      const clampedDist = Math.min(dist, maxDist);
      const angle = Math.atan2(dy, dx);
      const ix = Math.cos(angle) * clampedDist;
      const iy = Math.sin(angle) * clampedDist;

      this.joystickInner.setPosition(
        this.joystickOrigin.x + ix,
        this.joystickOrigin.y + iy,
      );

      if (dist < TOUCH.JOYSTICK_DEADZONE) {
        this._virtualInput.x = 0;
        this._virtualInput.y = 0;
      } else {
        this._virtualInput.x = ix / maxDist;
        this._virtualInput.y = iy / maxDist;
      }
    });

    const pointerUp = (pointer: Phaser.Input.Pointer) => {
      if (!this.joystickActive || pointer.pointerId !== this.joystickPointer) return;
      this.joystickActive = false;
      this.joystickPointer = null;
      this._virtualInput.x = 0;
      this._virtualInput.y = 0;
      this.scene.tweens.add({
        targets: [this.joystickOuter, this.joystickInner],
        alpha: 0, duration: 200,
      });
    };
    this.scene.input.on('pointerup', pointerUp);
    this.scene.input.on('pointerupoutside', pointerUp);
  }

  private onStateChanged = (state: GameState | undefined) => {
    if (state === GameState.DIALOGUE || state === GameState.CUTSCENE || state === GameState.PAUSE) {
      this.hideControls();
    } else if (state === GameState.GAME) {
      this.showControls();
    }
  };

  private setupEvents(): void {
    EventBus.getInstance().on(GameEvent.GAME_STATE_CHANGED, this.onStateChanged);
  }

  showControls(): void {
    this.isVisible = true;
    this.actionBtnHit.setInteractive();
    this.scene.tweens.add({
      targets: this.actionBtn, alpha: 0.7, duration: 200,
    });

    if (!this.hasShownHint) {
      this.hasShownHint = true;
      this.showMovementHint();
    }
  }

  hideControls(): void {
    this.isVisible = false;
    this.joystickActive = false;
    this._virtualInput = { x: 0, y: 0, interact: false };
    this.joystickOuter.setAlpha(0);
    this.joystickInner.setAlpha(0);
    this.actionBtnHit.disableInteractive();
    this.scene.tweens.add({ targets: this.actionBtn, alpha: 0, duration: 150 });
  }

  private showMovementHint(): void {
    if (this.hintContainer) return;
    const hx = MobileControls.MARGIN + MobileControls.JOYSTICK_R;
    const hy = GAME_HEIGHT - MobileControls.MARGIN - MobileControls.JOYSTICK_R;

    this.hintContainer = this.scene.add.container(hx, hy).setDepth(301).setScrollFactor(0);

    const hintBg = this.scene.add.graphics();
    hintBg.fillStyle(0x0a0814, 0.7);
    hintBg.fillRoundedRect(-50, -30, 100, 20, 4);

    const isKo = DesignSystem.getLanguage() === 'ko';
    const hintText = this.scene.add.text(0, -20,
      isKo ? '드래그하여 이동' : 'Drag to move',
      DesignSystem.mutedTextStyle(DesignSystem.FONT_SIZE.XS),
    ).setOrigin(0.5);

    this.hintContainer.add([hintBg, hintText]);

    this.scene.tweens.add({
      targets: this.hintContainer, alpha: 0, delay: 4000, duration: 1000,
      onComplete: () => {
        this.hintContainer?.destroy(true);
        this.hintContainer = null;
      },
    });
  }

  setActionLabel(label: string): void {
    this.contextLabel = label;
    this.actionLabelText?.setText(label);
  }

  get virtualInput(): VirtualInput {
    return this._virtualInput;
  }

  destroy(): void {
    EventBus.getInstance().off(GameEvent.GAME_STATE_CHANGED, this.onStateChanged);
    this.hintContainer?.destroy(true);
    this.container.destroy(true);
  }
}
