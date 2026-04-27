import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../../config';
import type { ChapterConfig } from '../ChapterData';

/**
 * Vertical god rays falling from the top of the viewport — used by Ch12
 * (Celestial City) to convey "heaven shining down." Camera-fixed so the rays
 * stay aligned with the screen as the player moves; ADD blend so the rays
 * accumulate on whatever's underneath without darkening it.
 *
 * Rays are static (no animation) for now — the visual works as-is and adding
 * a per-frame update would re-introduce the kind of redraw cost that
 * `EnvironmentAnimations` already pays for the chapter's other ambient FX.
 */
export class CelestialLightRays {
  private scene: Phaser.Scene;
  private layer: Phaser.GameObjects.Graphics | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  render(_config: ChapterConfig): void {
    this.destroy();
    // Depth 8.5 — above buildings/objects/lighting, below NPC/player labels.
    // ScrollFactor 0 keeps the rays anchored to the viewport.
    this.layer = this.scene.add
      .graphics()
      .setDepth(8.5)
      .setScrollFactor(0, 0)
      .setBlendMode(Phaser.BlendModes.ADD);

    const g = this.layer;
    const W = GAME_WIDTH;
    const H = GAME_HEIGHT;

    // Five wide rays at irregular x positions, fanning slightly outward from
    // an imaginary point at top-center.
    const rays: { x: number; width: number; tint: number; intensity: number }[] = [
      { x: W * 0.18, width: 36, tint: 0xffe8a0, intensity: 0.30 },
      { x: W * 0.34, width: 28, tint: 0xffffff, intensity: 0.22 },
      { x: W * 0.50, width: 56, tint: 0xfff4cc, intensity: 0.40 }, // brightest center beam
      { x: W * 0.66, width: 30, tint: 0xffffff, intensity: 0.24 },
      { x: W * 0.84, width: 38, tint: 0xffe8a0, intensity: 0.30 },
    ];

    for (const ray of rays) {
      this.drawRay(g, ray.x, ray.width, H, ray.tint, ray.intensity);
    }

    // Subtle full-viewport top-down warm wash so the rays don't look isolated
    g.fillStyle(0xffe8a0, 0.05);
    g.fillRect(0, 0, W, H);
  }

  /** Trapezoidal ray that widens slightly as it falls, with vertical alpha
   *  fade so it "dissipates" before reaching the bottom of the viewport. */
  private drawRay(g: Phaser.GameObjects.Graphics, cx: number, topW: number, H: number, tint: number, intensity: number): void {
    const STEPS = 24;
    const bottomW = topW * 1.6;
    for (let i = 0; i < STEPS; i++) {
      const t = i / STEPS;
      const w = topW + (bottomW - topW) * t;
      const yTop = Math.floor(t * H);
      const yBot = Math.floor((t + 1 / STEPS) * H) + 1;
      // Alpha fades to ~0 by 80% of viewport height
      const fade = Math.max(0, 1 - t / 0.8);
      const alpha = intensity * fade * fade;
      g.fillStyle(tint, alpha);
      g.fillRect(Math.floor(cx - w / 2), yTop, Math.floor(w), yBot - yTop);
    }
  }

  destroy(): void {
    this.layer?.destroy();
    this.layer = null;
  }
}
