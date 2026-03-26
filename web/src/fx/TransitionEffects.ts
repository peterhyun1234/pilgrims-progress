import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

export type TransitionType = 'fade' | 'iris' | 'wipe_left' | 'wipe_right' | 'diamond' | 'curtain';

/**
 * Rich screen transitions for scene/chapter changes.
 * Uses Phaser Graphics masks for non-rectangular transitions.
 */
export class TransitionEffects {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Play a transition OUT (screen goes dark), execute callback, then transition IN.
   */
  async transition(
    type: TransitionType,
    duration = 800,
    color = 0x000000,
    centerX?: number,
    centerY?: number,
  ): Promise<void> {
    switch (type) {
      case 'iris':
        return this.irisTransition(duration, color, centerX, centerY);
      case 'wipe_left':
        return this.wipeTransition(duration, color, 'left');
      case 'wipe_right':
        return this.wipeTransition(duration, color, 'right');
      case 'diamond':
        return this.diamondTransition(duration, color);
      case 'curtain':
        return this.curtainTransition(duration, color);
      case 'fade':
      default:
        return this.fadeTransition(duration, color);
    }
  }

  /** Simple fade to black and back */
  private fadeTransition(duration: number, color: number): Promise<void> {
    return new Promise(resolve => {
      const rect = this.scene.add.rectangle(
        GAME_WIDTH / 2, GAME_HEIGHT / 2,
        GAME_WIDTH + 4, GAME_HEIGHT + 4,
        color, 0,
      ).setDepth(9999).setScrollFactor(0);

      this.scene.tweens.add({
        targets: rect,
        alpha: 1,
        duration: duration / 2,
        ease: 'Quad.easeIn',
        yoyo: true,
        hold: 100,
        onComplete: () => {
          rect.destroy();
          resolve();
        },
      });
    });
  }

  /**
   * Iris transition: circle mask that shrinks to a point then expands back.
   * Classic RPG transition used in Pokemon, Zelda, etc.
   */
  private irisTransition(
    duration: number, color: number,
    cx = GAME_WIDTH / 2, cy = GAME_HEIGHT / 2,
  ): Promise<void> {
    return new Promise(resolve => {
      const maxRadius = Math.sqrt(GAME_WIDTH * GAME_WIDTH + GAME_HEIGHT * GAME_HEIGHT) / 2 + 20;
      const halfDur = duration / 2;

      // Full-screen colored rectangle
      const bg = this.scene.add.rectangle(
        GAME_WIDTH / 2, GAME_HEIGHT / 2,
        GAME_WIDTH + 4, GAME_HEIGHT + 4,
        color, 1,
      ).setDepth(9999).setScrollFactor(0).setAlpha(0);

      // Circle mask shape (starts full size, shrinks)
      const maskShape = this.scene.add.graphics().setScrollFactor(0);
      maskShape.fillStyle(0xffffff);
      maskShape.fillCircle(cx, cy, maxRadius);

      const mask = maskShape.createGeometryMask();
      mask.invertAlpha = true;
      bg.setMask(mask);
      bg.setAlpha(1);

      // Close iris (circle shrinks to 0)
      const radius = { value: maxRadius };
      this.scene.tweens.add({
        targets: radius,
        value: 0,
        duration: halfDur,
        ease: 'Quad.easeIn',
        onUpdate: () => {
          maskShape.clear();
          maskShape.fillStyle(0xffffff);
          maskShape.fillCircle(cx, cy, Math.max(radius.value, 0));
        },
        onComplete: () => {
          // Hold briefly at black
          this.scene.time.delayedCall(80, () => {
            // Open iris (circle grows back)
            this.scene.tweens.add({
              targets: radius,
              value: maxRadius,
              duration: halfDur,
              ease: 'Quad.easeOut',
              onUpdate: () => {
                maskShape.clear();
                maskShape.fillStyle(0xffffff);
                maskShape.fillCircle(cx, cy, radius.value);
              },
              onComplete: () => {
                bg.clearMask(true);
                maskShape.destroy();
                bg.destroy();
                resolve();
              },
            });
          });
        },
      });
    });
  }

  /** Horizontal wipe transition */
  private wipeTransition(duration: number, color: number, dir: 'left' | 'right'): Promise<void> {
    return new Promise(resolve => {
      const halfDur = duration / 2;
      const startX = dir === 'left' ? GAME_WIDTH + GAME_WIDTH / 2 : -GAME_WIDTH / 2;
      const midX = GAME_WIDTH / 2;
      const endX = dir === 'left' ? -GAME_WIDTH / 2 : GAME_WIDTH + GAME_WIDTH / 2;

      const rect = this.scene.add.rectangle(
        startX, GAME_HEIGHT / 2,
        GAME_WIDTH + 4, GAME_HEIGHT + 4,
        color, 1,
      ).setDepth(9999).setScrollFactor(0);

      // Wipe in
      this.scene.tweens.add({
        targets: rect,
        x: midX,
        duration: halfDur,
        ease: 'Quad.easeIn',
        onComplete: () => {
          this.scene.time.delayedCall(60, () => {
            // Wipe out
            this.scene.tweens.add({
              targets: rect,
              x: endX,
              duration: halfDur,
              ease: 'Quad.easeOut',
              onComplete: () => {
                rect.destroy();
                resolve();
              },
            });
          });
        },
      });
    });
  }

  /** Diamond/rhombus transition — common in RPGs */
  private diamondTransition(duration: number, color: number): Promise<void> {
    return new Promise(resolve => {
      const halfDur = duration / 2;
      const cx = GAME_WIDTH / 2;
      const cy = GAME_HEIGHT / 2;
      const maxSize = Math.max(GAME_WIDTH, GAME_HEIGHT) + 40;

      const bg = this.scene.add.rectangle(
        cx, cy, GAME_WIDTH + 4, GAME_HEIGHT + 4,
        color, 1,
      ).setDepth(9999).setScrollFactor(0).setAlpha(1);

      const maskGfx = this.scene.add.graphics().setScrollFactor(0);
      const mask = maskGfx.createGeometryMask();
      mask.invertAlpha = true;
      bg.setMask(mask);

      const size = { value: maxSize };

      const drawDiamond = (s: number) => {
        maskGfx.clear();
        maskGfx.fillStyle(0xffffff);
        maskGfx.beginPath();
        maskGfx.moveTo(cx, cy - s);
        maskGfx.lineTo(cx + s, cy);
        maskGfx.lineTo(cx, cy + s);
        maskGfx.lineTo(cx - s, cy);
        maskGfx.closePath();
        maskGfx.fillPath();
      };

      drawDiamond(maxSize);

      // Shrink diamond
      this.scene.tweens.add({
        targets: size,
        value: 0,
        duration: halfDur,
        ease: 'Quad.easeIn',
        onUpdate: () => drawDiamond(Math.max(size.value, 0)),
        onComplete: () => {
          this.scene.time.delayedCall(80, () => {
            // Expand diamond
            this.scene.tweens.add({
              targets: size,
              value: maxSize,
              duration: halfDur,
              ease: 'Quad.easeOut',
              onUpdate: () => drawDiamond(size.value),
              onComplete: () => {
                bg.clearMask(true);
                maskGfx.destroy();
                bg.destroy();
                resolve();
              },
            });
          });
        },
      });
    });
  }

  /** Curtain close/open — two halves meeting in the middle */
  private curtainTransition(duration: number, color: number): Promise<void> {
    return new Promise(resolve => {
      const halfDur = duration / 2;
      const hw = GAME_WIDTH / 2 + 2;

      const left = this.scene.add.rectangle(
        -hw, GAME_HEIGHT / 2, GAME_WIDTH / 2 + 4, GAME_HEIGHT + 4, color, 1,
      ).setDepth(9999).setScrollFactor(0);

      const right = this.scene.add.rectangle(
        GAME_WIDTH + hw, GAME_HEIGHT / 2, GAME_WIDTH / 2 + 4, GAME_HEIGHT + 4, color, 1,
      ).setDepth(9999).setScrollFactor(0);

      // Close curtains
      this.scene.tweens.add({
        targets: left,
        x: GAME_WIDTH / 4,
        duration: halfDur,
        ease: 'Quad.easeIn',
      });
      this.scene.tweens.add({
        targets: right,
        x: GAME_WIDTH * 3 / 4,
        duration: halfDur,
        ease: 'Quad.easeIn',
        onComplete: () => {
          this.scene.time.delayedCall(80, () => {
            // Open curtains
            this.scene.tweens.add({
              targets: left,
              x: -hw,
              duration: halfDur,
              ease: 'Quad.easeOut',
            });
            this.scene.tweens.add({
              targets: right,
              x: GAME_WIDTH + hw,
              duration: halfDur,
              ease: 'Quad.easeOut',
              onComplete: () => {
                left.destroy();
                right.destroy();
                resolve();
              },
            });
          });
        },
      });
    });
  }

  destroy(): void {
    // No persistent state to clean up
  }
}
