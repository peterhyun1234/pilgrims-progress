import type { PerspectiveMode, WorldRenderer } from './WorldRenderer';
import { LegacyGraphicsWorldRenderer } from './renderers/LegacyGraphicsWorldRenderer';
import { SideScrollWorldRenderer } from './renderers/SideScrollWorldRenderer';
import { TopDownWorldRenderer } from './renderers/TopDownWorldRenderer';
import { CelestialWorldRenderer } from './renderers/CelestialWorldRenderer';

/**
 * Picks a `WorldRenderer` from the chapter's perspective. An undefined or
 * `'legacy'` value routes to `LegacyGraphicsWorldRenderer` — the bit-identical
 * Phase 1 default for all 12 chapters.
 */
export class WorldRendererFactory {
  static create(perspective: PerspectiveMode | undefined): WorldRenderer {
    switch (perspective ?? 'legacy') {
      case 'sideScroll': return new SideScrollWorldRenderer();
      case 'topDown':    return new TopDownWorldRenderer();
      case 'celestial':  return new CelestialWorldRenderer();
      case 'legacy':
      default:           return new LegacyGraphicsWorldRenderer();
    }
  }
}
