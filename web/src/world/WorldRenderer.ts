import type Phaser from 'phaser';
import type { ChapterConfig } from './ChapterData';

/** Per-chapter rendering perspective. Drives renderer selection and camera mode. */
export type PerspectiveMode = 'legacy' | 'sideScroll' | 'topDown' | 'celestial';

/**
 * Output of `WorldRenderer.build()`. Holds everything `GameScene` needs to wire
 * the player, camera, and physics to the freshly rendered chapter world.
 */
export interface WorldRenderResult {
  /** Static colliders (border walls + map obstacles) the player physics body reads. */
  colliders: Phaser.Physics.Arcade.StaticGroup | null;
  /** Authoritative world dimensions in pixels. May exceed `chapterConfig.mapHeight`
   *  when a renderer pads the camera bounds for a fixed parallax (legacy/sideScroll). */
  bounds: { width: number; height: number };
  /** True if the renderer rendered a parallax curtain. The camera mode uses this
   *  to decide whether to clamp Y. */
  hasParallax: boolean;
  /** Renderer-owned cleanup. Called during chapter teardown or scene shutdown. */
  destroy(): void;
}

/**
 * A renderer builds the visible chapter world (ground tiles, walls, decor,
 * buildings, lighting, optional parallax) and returns the artifacts the rest
 * of `GameScene` needs to operate on it.
 *
 * Implementations are selected per chapter via `WorldRendererFactory` based on
 * `ChapterConfig.perspective`. In Phase 1, all 12 chapters route to
 * `LegacyGraphicsWorldRenderer`; the side-scroll/top-down/celestial renderers
 * are stubs that delegate to legacy until Phase 2 fills them in.
 */
export interface WorldRenderer {
  build(scene: Phaser.Scene, config: ChapterConfig): WorldRenderResult;
}
