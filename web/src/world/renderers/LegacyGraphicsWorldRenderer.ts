import type Phaser from 'phaser';
import type { ChapterConfig } from '../ChapterData';
import type { WorldRenderer, WorldRenderResult } from '../WorldRenderer';
import { TileMapManager } from '../TileMapManager';
import { BuildingFacade } from '../buildings/BuildingFacade';
import { PointLightSystem } from '../lighting/PointLightSystem';
import { GAME_HEIGHT } from '../../config';

/**
 * The default renderer for every chapter in Phase 1. Wraps the existing
 * `TileMapManager` (which builds ground/decor/walls/parallax/fog) and then
 * runs the extracted `BuildingFacade` and `PointLightSystem` passes — together
 * these three reproduce the exact rendering the WIP `TileMapManager.generateMap`
 * was doing before the split.
 *
 * Phase 2+ chapters opt into `SideScrollWorldRenderer` / `TopDownWorldRenderer`
 * / `CelestialWorldRenderer` via `ChapterConfig.perspective`, leaving this
 * adapter for any chapter that hasn't migrated yet.
 */
export class LegacyGraphicsWorldRenderer implements WorldRenderer {
  build(scene: Phaser.Scene, config: ChapterConfig): WorldRenderResult {
    const tileMapManager = new TileMapManager(scene);
    tileMapManager.generateMap(config);

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
      hasParallax: true,
      destroy: () => {
        lights.destroy();
        buildings.destroy();
        tileMapManager.clearMap();
      },
    };
  }
}
