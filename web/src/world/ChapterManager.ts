import Phaser from 'phaser';
import { TileMapManager, MapData } from './TileMapManager';
import { NPC } from '../entities/NPC';
import { TILE_SIZE } from '../config';
import { chapterData, ChapterConfig } from './ChapterData';

export class ChapterManager {
  private scene: Phaser.Scene;
  private tileMapManager: TileMapManager;
  private currentChapter: ChapterConfig | null = null;

  constructor(scene: Phaser.Scene, tileMapManager: TileMapManager) {
    this.scene = scene;
    this.tileMapManager = tileMapManager;
  }

  loadChapter(chapter: number): void {
    const config = chapterData[chapter];
    if (!config) return;

    this.currentChapter = config;
    const mapData = this.generateMap(config);
    this.tileMapManager.loadMap(mapData);
  }

  getSpawnPoint(): { x: number; y: number } {
    if (!this.currentChapter) return { x: 160, y: 240 };
    return {
      x: this.currentChapter.spawnX * TILE_SIZE,
      y: this.currentChapter.spawnY * TILE_SIZE,
    };
  }

  getLocationName(lang: 'ko' | 'en'): string {
    if (!this.currentChapter) return '';
    return lang === 'ko' ? this.currentChapter.nameKo : this.currentChapter.nameEn;
  }

  createNPCs(): NPC[] {
    if (!this.currentChapter) return [];

    const collisionGroup = this.tileMapManager.getCollisionGroup();
    return this.currentChapter.npcs.map((npcConfig) => {
      const npc = new NPC(
        this.scene,
        npcConfig.x * TILE_SIZE,
        npcConfig.y * TILE_SIZE,
        npcConfig.sprite,
        npcConfig.id,
        npcConfig.nameKo,
        npcConfig.nameEn,
      );
      if (collisionGroup) {
        this.scene.physics.add.collider(npc.sprite, collisionGroup);
      }
      return npc;
    });
  }

  private generateMap(config: ChapterConfig): MapData {
    const w = config.mapWidth;
    const h = config.mapHeight;

    const ground: number[][] = [];
    const collision: number[][] = [];

    for (let y = 0; y < h; y++) {
      ground[y] = [];
      collision[y] = [];
      for (let x = 0; x < w; x++) {
        const isWall = x === 0 || x === w - 1 || y === 0 || y === h - 1;
        collision[y][x] = isWall ? 1 : 0;

        if (isWall) {
          ground[y][x] = 5;
        } else {
          const r = Math.random();
          if (r < 0.6) ground[y][x] = 1;
          else if (r < 0.8) ground[y][x] = 2;
          else if (r < 0.9) ground[y][x] = 3;
          else ground[y][x] = 4;
        }
      }
    }

    if (config.buildings) {
      for (const b of config.buildings) {
        for (let by = b.y; by < b.y + b.h; by++) {
          for (let bx = b.x; bx < b.x + b.w; bx++) {
            if (by >= 0 && by < h && bx >= 0 && bx < w) {
              collision[by][bx] = 1;
              ground[by][bx] = 0;
            }
          }
        }
      }
    }

    return { width: w, height: h, ground, collision, objects: [] };
  }
}
