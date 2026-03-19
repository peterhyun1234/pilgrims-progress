import Phaser from 'phaser';
import { TILE_SIZE, COLORS } from '../config';

export interface MapData {
  width: number;
  height: number;
  ground: number[][];
  collision: number[][];
  objects: { x: number; y: number; type: string; id?: string }[];
}

export class TileMapManager {
  private scene: Phaser.Scene;
  private groundLayer?: Phaser.GameObjects.Graphics;
  private collisionBodies: Phaser.Physics.Arcade.StaticGroup | null = null;
  private currentMap: MapData | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  loadMap(mapData: MapData): void {
    this.clear();
    this.currentMap = mapData;
    this.renderGround(mapData);
    this.createCollisions(mapData);
  }

  private renderGround(mapData: MapData): void {
    this.groundLayer = this.scene.add.graphics();
    this.groundLayer.setDepth(0);

    for (let y = 0; y < mapData.height; y++) {
      for (let x = 0; x < mapData.width; x++) {
        const tile = mapData.ground[y][x];
        const color = this.getTileColor(tile);
        this.groundLayer.fillStyle(color, 1);
        this.groundLayer.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);

        if (tile > 0 && Math.random() > 0.85) {
          const shade = this.getTileColor(tile);
          this.groundLayer.fillStyle(shade, 0.15);
          const nx = x * TILE_SIZE + Math.floor(Math.random() * 8);
          const ny = y * TILE_SIZE + Math.floor(Math.random() * 8);
          this.groundLayer.fillRect(nx, ny, 4, 4);
        }
      }
    }
  }

  private getTileColor(tile: number): number {
    switch (tile) {
      case 0: return COLORS.DARK.PRIMARY;
      case 1: return 0x3a3226;
      case 2: return 0x4a422e;
      case 3: return 0x2a1e14;
      case 4: return 0x5a4a32;
      case 5: return 0x1a1612;
      default: return COLORS.DARK.PRIMARY;
    }
  }

  private createCollisions(mapData: MapData): void {
    this.collisionBodies = this.scene.physics.add.staticGroup();

    for (let y = 0; y < mapData.height; y++) {
      for (let x = 0; x < mapData.width; x++) {
        if (mapData.collision[y][x] === 1) {
          const body = this.scene.add.rectangle(
            x * TILE_SIZE + TILE_SIZE / 2,
            y * TILE_SIZE + TILE_SIZE / 2,
            TILE_SIZE,
            TILE_SIZE,
          );
          body.setVisible(false);
          this.collisionBodies.add(body);
        }
      }
    }
  }

  getCollisionGroup(): Phaser.Physics.Arcade.StaticGroup | null {
    return this.collisionBodies;
  }

  getBounds(): { width: number; height: number } {
    if (!this.currentMap) return { width: 320, height: 180 };
    return {
      width: this.currentMap.width * TILE_SIZE,
      height: this.currentMap.height * TILE_SIZE,
    };
  }

  clear(): void {
    this.groundLayer?.destroy();
    this.collisionBodies?.destroy(true);
    this.currentMap = null;
  }
}
