import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { ServiceLocator, SERVICE_KEYS } from '../core/ServiceLocator';
import { InputManager } from '../input/InputManager';

export class MobileControls {
  private scene: Phaser.Scene;
  private joystickBase?: Phaser.GameObjects.Arc;
  private joystickThumb?: Phaser.GameObjects.Arc;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      this.create();
    }
  }

  private create(): void {
    const baseX = 40;
    const baseY = GAME_HEIGHT - 40;
    const radius = 20;

    this.joystickBase = this.scene.add.circle(baseX, baseY, radius, 0x333333, 0.4)
      .setScrollFactor(0).setDepth(400);

    this.joystickThumb = this.scene.add.circle(baseX, baseY, 8, 0xaaaaaa, 0.6)
      .setScrollFactor(0).setDepth(401);

    this.joystickBase.setInteractive({ draggable: true });

    this.scene.input.on('drag', (_pointer: Phaser.Input.Pointer, _obj: Phaser.GameObjects.GameObject, dragX: number, dragY: number) => {
      const dx = dragX - baseX;
      const dy = dragY - baseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = radius;

      let nx = dx;
      let ny = dy;
      if (dist > maxDist) {
        nx = (dx / dist) * maxDist;
        ny = (dy / dist) * maxDist;
      }

      this.joystickThumb?.setPosition(baseX + nx, baseY + ny);

      if (ServiceLocator.has(SERVICE_KEYS.INPUT_MANAGER)) {
        const inputManager = ServiceLocator.get<InputManager>(SERVICE_KEYS.INPUT_MANAGER);
        inputManager.setVirtualInput({
          x: nx / maxDist,
          y: ny / maxDist,
        });
      }
    });

    this.scene.input.on('dragend', () => {
      this.joystickThumb?.setPosition(baseX, baseY);
      if (ServiceLocator.has(SERVICE_KEYS.INPUT_MANAGER)) {
        const inputManager = ServiceLocator.get<InputManager>(SERVICE_KEYS.INPUT_MANAGER);
        inputManager.setVirtualInput({ x: 0, y: 0 });
      }
    });

    const interactButton = this.scene.add.circle(
      GAME_WIDTH - 30, GAME_HEIGHT - 30, 14, 0xe6c86e, 0.5,
    ).setScrollFactor(0).setDepth(400);
    interactButton.setInteractive();

    this.scene.add.text(
      GAME_WIDTH - 30, GAME_HEIGHT - 30, 'E',
      { fontSize: '8px', color: '#FFFFFF' },
    ).setOrigin(0.5).setScrollFactor(0).setDepth(401);

    interactButton.on('pointerdown', () => {
      if (ServiceLocator.has(SERVICE_KEYS.INPUT_MANAGER)) {
        const inputManager = ServiceLocator.get<InputManager>(SERVICE_KEYS.INPUT_MANAGER);
        inputManager.setVirtualInput({ interact: true });
      }
    });
  }
}
