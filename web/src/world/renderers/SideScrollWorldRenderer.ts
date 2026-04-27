import type Phaser from 'phaser';
import type { ChapterConfig } from '../ChapterData';
import type { WorldRenderer, WorldRenderResult } from '../WorldRenderer';
import { LegacyGraphicsWorldRenderer } from './LegacyGraphicsWorldRenderer';
import { HorizonBridge } from '../parallax/HorizonBridge';

/**
 * Side-scroll chapters (Ch1, 5, 6, 8). For now this still uses the
 * `LegacyGraphicsWorldRenderer` for the base tile world + parallax — Phase 3
 * will swap that for a tileset-based path when AI-generated tiles arrive.
 *
 * The visible delta vs. legacy is the `HorizonBridge` pass: a layered fix that
 * hides the seam between the camera-fixed parallax curtain and the camera-
 * following tile floor (the user's primary visual complaint about the current
 * map). All other chapters remain on `'legacy'` so this rolls out per-chapter.
 */
export class SideScrollWorldRenderer implements WorldRenderer {
  private readonly legacy = new LegacyGraphicsWorldRenderer();

  build(scene: Phaser.Scene, config: ChapterConfig): WorldRenderResult {
    const base = this.legacy.build(scene, config);

    const horizonBridge = new HorizonBridge(scene);
    horizonBridge.render(config);

    return {
      ...base,
      destroy: () => {
        horizonBridge.destroy();
        base.destroy();
      },
    };
  }
}
