import type Phaser from 'phaser';
import type { ChapterConfig } from '../ChapterData';
import type { WorldRenderer, WorldRenderResult } from '../WorldRenderer';
import { LegacyGraphicsWorldRenderer } from './LegacyGraphicsWorldRenderer';

/**
 * Phase 1 stub. Side-scroll chapters (Ch1, 5, 6, 8) will move here in Phase 2+
 * with a real tileset-based ground + a fixed-horizon parallax curtain whose
 * seam-cover layer is no longer hardcoded to `GAME_HEIGHT * 0.42`.
 *
 * Until then, this delegates to `LegacyGraphicsWorldRenderer` so flipping a
 * chapter's `perspective` to `'sideScroll'` still produces a valid world (used
 * by the routing smoke test in the verification plan).
 */
export class SideScrollWorldRenderer implements WorldRenderer {
  private readonly legacy = new LegacyGraphicsWorldRenderer();

  build(scene: Phaser.Scene, config: ChapterConfig): WorldRenderResult {
    return this.legacy.build(scene, config);
  }
}
