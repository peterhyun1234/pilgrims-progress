import localforage from 'localforage';
import { SaveData, createDefaultSaveData } from './SaveData';
import { EventBus } from '../core/EventBus';
import { GameEvent } from '../core/GameEvents';
import { ServiceLocator, SERVICE_KEYS } from '../core/ServiceLocator';
import { GameManager } from '../core/GameManager';
import { StatsManager } from '../core/StatsManager';

export class SaveManager {
  private eventBus: EventBus;
  private static readonly SAVE_KEY = 'pilgrims_progress_save';

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;

    localforage.config({
      name: 'PilgrimsProgress',
      storeName: 'saves',
    });

    this.setupEvents();
  }

  private setupEvents(): void {
    this.eventBus.on(GameEvent.SAVE_GAME, () => {
      this.save();
    });

    this.eventBus.on(GameEvent.LOAD_GAME, () => {
      this.load();
    });
  }

  async save(): Promise<void> {
    const gm = ServiceLocator.get<GameManager>(SERVICE_KEYS.GAME_MANAGER);
    const sm = ServiceLocator.get<StatsManager>(SERVICE_KEYS.STATS_MANAGER);

    const data: SaveData = {
      ...createDefaultSaveData(),
      timestamp: Date.now(),
      chapter: gm.currentChapter,
      playerName: gm.playerName,
      stats: sm.getAll(),
      hiddenStats: sm.getHidden(),
      settings: {
        ...createDefaultSaveData().settings,
        language: gm.language,
      },
    };

    await localforage.setItem(SaveManager.SAVE_KEY, data);
  }

  async load(): Promise<SaveData | null> {
    const data = await localforage.getItem<SaveData>(SaveManager.SAVE_KEY);
    if (!data) return null;

    const gm = ServiceLocator.get<GameManager>(SERVICE_KEYS.GAME_MANAGER);
    const sm = ServiceLocator.get<StatsManager>(SERVICE_KEYS.STATS_MANAGER);

    gm.setChapter(data.chapter);
    gm.playerName = data.playerName;
    gm.language = data.settings.language;
    sm.setAll(data.stats);
    sm.setHidden(data.hiddenStats);

    return data;
  }

  async hasSave(): Promise<boolean> {
    const data = await localforage.getItem(SaveManager.SAVE_KEY);
    return data !== null;
  }

  async deleteSave(): Promise<void> {
    await localforage.removeItem(SaveManager.SAVE_KEY);
  }
}
