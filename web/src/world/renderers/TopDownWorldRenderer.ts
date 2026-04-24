import type Phaser from 'phaser';
import type { ChapterConfig } from '../ChapterData';
import type { WorldRenderer, WorldRenderResult } from '../WorldRenderer';
import { LegacyGraphicsWorldRenderer } from './LegacyGraphicsWorldRenderer';

/**
 * Phase 1 stub. Top-down chapters (Ch2, 9, 10, 11) will move here in Phase 2+
 * with a real tileset, no parallax curtain, full XY camera bounds, and dense
 * 2.5D building facades + props anchoring the scene.
 *
 * Until then, this delegates to the legacy renderer. `WorldRenderResult.hasParallax`
 * still reports `true` because the underlying renderer still draws one — the
 * camera mode is what actually disables parallax-related Y clamping.
 */
export class TopDownWorldRenderer implements WorldRenderer {
  private readonly legacy = new LegacyGraphicsWorldRenderer();

  build(scene: Phaser.Scene, config: ChapterConfig): WorldRenderResult {
    return this.legacy.build(scene, config);
  }
}
