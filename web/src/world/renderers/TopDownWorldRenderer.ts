import type Phaser from 'phaser';
import type { ChapterConfig } from '../ChapterData';
import type { WorldRenderer, WorldRenderResult } from '../WorldRenderer';
import { TileMapManager } from '../TileMapManager';
import { BuildingFacade } from '../buildings/BuildingFacade';
import { PointLightSystem } from '../lighting/PointLightSystem';
import { GAME_HEIGHT } from '../../config';

/**
 * Top-down chapters (Ch2 swamp, Ch9 valley of shadow, Ch10 vanity fair,
 * Ch11 doubting castle). The whole viewport is ground — no sky parallax,
 * no horizon line.
 *
 * Differences from `LegacyGraphicsWorldRenderer`:
 * - `TileMapManager.generateMap` is called with `skipParallax: true`, so the
 *   `ParallaxBackground` curtain is never instantiated.
 * - The scene camera background is set to the chapter's `groundBase`, so any
 *   area beyond the rendered map (e.g., when the camera approaches a corner)
 *   blends in instead of showing the default near-black.
 *
 * Building / lighting passes still run — the existing per-chapter content in
 * `BuildingFacade` and `PointLightSystem` already draws appropriate things
 * for these chapters from the WIP that was extracted in Phase 1.
 */
export class TopDownWorldRenderer implements WorldRenderer {
  build(scene: Phaser.Scene, config: ChapterConfig): WorldRenderResult {
    scene.cameras.main.setBackgroundColor(config.theme.groundBase);

    const tileMapManager = new TileMapManager(scene);
    tileMapManager.generateMap(config, { skipParallax: true });

    const buildings = new BuildingFacade(scene);
    buildings.render(config);

    const lights = new PointLightSystem(scene);
    lights.render(config);

    return {
      colliders: tileMapManager.getColliders(),
      bounds: {
        width: config.mapWidth,
        height: Math.max(config.mapHeight, GAME_HEIGHT),
      },
      hasParallax: false,
      destroy: () => {
        lights.destroy();
        buildings.destroy();
        tileMapManager.clearMap();
      },
    };
  }
}
