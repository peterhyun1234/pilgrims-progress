import type Phaser from 'phaser';
import type { ChapterConfig } from '../ChapterData';
import type { WorldRenderer, WorldRenderResult } from '../WorldRenderer';
import { TopDownWorldRenderer } from './TopDownWorldRenderer';
import { CelestialLightRays } from '../celestial/CelestialLightRays';

/**
 * Ch12 (Celestial City). Top-down base world plus a camera-fixed god-ray
 * overlay (`CelestialLightRays`). The radiant point lights for Ch12 are
 * already drawn by `PointLightSystem.case 12`; the rays add the
 * "heaven-shining-down" effect on top of those.
 */
export class CelestialWorldRenderer implements WorldRenderer {
  private readonly topDown = new TopDownWorldRenderer();

  build(scene: Phaser.Scene, config: ChapterConfig): WorldRenderResult {
    const base = this.topDown.build(scene, config);

    const rays = new CelestialLightRays(scene);
    rays.render(config);

    return {
      ...base,
      destroy: () => {
        rays.destroy();
        base.destroy();
      },
    };
  }
}
