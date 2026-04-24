import type Phaser from 'phaser';
import type { ChapterConfig } from '../ChapterData';
import type { WorldRenderer, WorldRenderResult } from '../WorldRenderer';
import { LegacyGraphicsWorldRenderer } from './LegacyGraphicsWorldRenderer';

/**
 * Phase 1 stub for Ch12 (Celestial City). Phase 3 will extend `TopDownWorldRenderer`
 * with the radiant celestial-light pass already prototyped in
 * `PointLightSystem.case 12`.
 *
 * Delegates to legacy until then.
 */
export class CelestialWorldRenderer implements WorldRenderer {
  private readonly legacy = new LegacyGraphicsWorldRenderer();

  build(scene: Phaser.Scene, config: ChapterConfig): WorldRenderResult {
    return this.legacy.build(scene, config);
  }
}
