import Phaser from 'phaser';
import { GAME_HEIGHT, CAMERA } from '../config';
import type { ChapterConfig } from './ChapterData';
import type { PerspectiveMode } from './WorldRenderer';

/**
 * Per-chapter camera controller. Mode determines how the Y axis behaves:
 *
 * - `legacy` / `sideScroll`: Y is pinned. The parallax curtain is fixed to the
 *   viewport, so any Y drift would expose a seam between sky and ground. The
 *   horizon line is at `GAME_HEIGHT * 0.42` (matches `ParallaxBackground.horizonY`).
 *   The Y deadzone is set to `GAME_HEIGHT * 8` so the player never crosses it →
 *   camera Y never moves while following.
 *
 * - `topDown` / `celestial`: full XY follow with normal deadzones. There is no
 *   parallax curtain, so the camera can scroll freely within the map bounds.
 *
 * Lifts logic from GameScene.ts ~lines 201–223 + 1625–1630 so the chapter
 * transition path uses the same code as initial load.
 */
const HORIZON_FRAC = 0.42;

export class WorldCamera {
  private scene: Phaser.Scene;
  private mode: PerspectiveMode = 'legacy';

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  setMode(mode: PerspectiveMode): this {
    this.mode = mode;
    const cam = this.scene.cameras.main;
    cam.setZoom(CAMERA.ZOOM_DEFAULT);

    if (this.isHorizonLocked()) {
      // Y deadzone ≫ mapHeight → player is always inside it → camera Y never moves.
      cam.setDeadzone(CAMERA.DEADZONE_X, GAME_HEIGHT * 8);
    } else {
      cam.setDeadzone(CAMERA.DEADZONE_X, CAMERA.DEADZONE_Y);
    }
    return this;
  }

  /** Snap the initial scroll position so the player lands at the horizon line
   *  (legacy/sideScroll) or so the camera centers on the player (topDown).
   *  Pass the saved player Y if restoring mid-chapter; pass 0 for fresh spawns. */
  applyInitialAlignment(config: ChapterConfig, savedPlayerY: number): this {
    const cam = this.scene.cameras.main;

    if (this.isHorizonLocked()) {
      const groundY = savedPlayerY > 0 ? savedPlayerY : config.spawn.y;
      const initScrollY = Phaser.Math.Clamp(
        groundY - Math.round(GAME_HEIGHT * HORIZON_FRAC),
        0,
        Math.max(0, config.mapHeight - GAME_HEIGHT),
      );
      cam.scrollY = initScrollY;
    } else {
      // Top-down: center on spawn (or saved position) — camera will follow from there.
      const targetY = savedPlayerY > 0 ? savedPlayerY : config.spawn.y;
      cam.scrollY = Phaser.Math.Clamp(
        targetY - GAME_HEIGHT / 2,
        0,
        Math.max(0, config.mapHeight - GAME_HEIGHT),
      );
    }
    return this;
  }

  follow(target: Phaser.GameObjects.GameObject): this {
    this.scene.cameras.main.startFollow(target, true, 0.08, 0.06);
    return this;
  }

  private isHorizonLocked(): boolean {
    return this.mode === 'legacy' || this.mode === 'sideScroll';
  }
}
