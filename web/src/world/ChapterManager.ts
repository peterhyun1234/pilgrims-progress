import { ChapterConfig, CHAPTER_CONFIGS } from './ChapterData';
import { NPC } from '../entities/NPC';
import { ServiceLocator, SERVICE_KEYS } from '../core/ServiceLocator';
import { GameManager } from '../core/GameManager';

/**
 * Chapter config lookup + NPC factory. World rendering is no longer triggered
 * here — `GameScene` drives `WorldRendererFactory` directly so it can pass the
 * resulting colliders into the camera/physics wiring.
 */
export class ChapterManager {
  private scene: Phaser.Scene;
  private currentConfig: ChapterConfig | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  loadChapter(chapter: number): ChapterConfig {
    const config = CHAPTER_CONFIGS.find(c => c.chapter === chapter);
    if (!config) {
      throw new Error(`Chapter ${chapter} not found`);
    }

    this.currentConfig = config;
    return config;
  }

  spawnNPCs(): NPC[] {
    if (!this.currentConfig) return [];

    return this.currentConfig.npcs.map(npcConfig => {
      return new NPC(this.scene, npcConfig);
    });
  }

  getCurrentConfig(): ChapterConfig | null {
    return this.currentConfig;
  }

  getLocationName(): string {
    if (!this.currentConfig) return '';
    const gm = ServiceLocator.get<GameManager>(SERVICE_KEYS.GAME_MANAGER);
    return gm.language === 'ko'
      ? this.currentConfig.locationName
      : this.currentConfig.locationNameEn;
  }
}
