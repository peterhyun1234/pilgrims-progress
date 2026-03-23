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

  private onSave = () => { this.save(); };
  private onLoad = () => { this.load(); };

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;

    localforage.config({
      name: 'PilgrimsProgress',
      storeName: 'saves',
    });

    this.setupEvents();
  }

  private setupEvents(): void {
    this.eventBus.on(GameEvent.SAVE_GAME, this.onSave);
    this.eventBus.on(GameEvent.LOAD_GAME, this.onLoad);
  }

  async save(): Promise<void> {
    try {
      const gm = ServiceLocator.get<GameManager>(SERVICE_KEYS.GAME_MANAGER);
      const sm = ServiceLocator.get<StatsManager>(SERVICE_KEYS.STATS_MANAGER);

      const existing = await localforage.getItem<SaveData>(SaveManager.SAVE_KEY);
      const base = existing ?? createDefaultSaveData();

      let bgmVolume = base.settings.bgmVolume;
      let sfxVolume = base.settings.sfxVolume;
      if (ServiceLocator.has(SERVICE_KEYS.AUDIO_MANAGER)) {
        const audio = ServiceLocator.get<import('../audio/AudioManager').AudioManager>(SERVICE_KEYS.AUDIO_MANAGER);
        const vol = audio.getVolume();
        bgmVolume = vol.bgm;
        sfxVolume = vol.sfx;
      }

      const data: SaveData = {
        ...base,
        timestamp: Date.now(),
        chapter: gm.currentChapter,
        playerName: gm.playerName,
        stats: sm.getAll(),
        hiddenStats: sm.getHidden(),
        settings: {
          ...base.settings,
          language: gm.language,
          bgmVolume,
          sfxVolume,
        },
      };

      await localforage.setItem(SaveManager.SAVE_KEY, data);
    } catch (e) {
      console.error('[SaveManager] save failed:', e);
    }
  }

  async load(): Promise<SaveData | null> {
    try {
      const data = await localforage.getItem<SaveData>(SaveManager.SAVE_KEY);
      if (!data) return null;

      const gm = ServiceLocator.get<GameManager>(SERVICE_KEYS.GAME_MANAGER);
      const sm = ServiceLocator.get<StatsManager>(SERVICE_KEYS.STATS_MANAGER);

      gm.setChapter(data.chapter);
      gm.playerName = data.playerName;
      gm.language = data.settings.language;
      sm.setAll(data.stats);
      sm.setHidden(data.hiddenStats);

      if (ServiceLocator.has(SERVICE_KEYS.AUDIO_MANAGER)) {
        const audio = ServiceLocator.get<import('../audio/AudioManager').AudioManager>(SERVICE_KEYS.AUDIO_MANAGER);
        audio.setVolume(data.settings.bgmVolume, data.settings.sfxVolume);
      }

      return data;
    } catch (e) {
      console.error('[SaveManager] load failed:', e);
      return null;
    }
  }

  async hasSave(): Promise<boolean> {
    try {
      const data = await localforage.getItem(SaveManager.SAVE_KEY);
      return data !== null;
    } catch {
      return false;
    }
  }

  async deleteSave(): Promise<void> {
    await localforage.removeItem(SaveManager.SAVE_KEY);
  }

  destroy(): void {
    this.eventBus.off(GameEvent.SAVE_GAME, this.onSave);
    this.eventBus.off(GameEvent.LOAD_GAME, this.onLoad);
  }
}
