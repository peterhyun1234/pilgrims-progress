import localforage from 'localforage';
import { SaveData, createDefaultSaveData, migrateSaveData } from './SaveData';
import { EventBus } from '../core/EventBus';
import { GameEvent } from '../core/GameEvents';
import { ServiceLocator, SERVICE_KEYS } from '../core/ServiceLocator';
import { GameManager } from '../core/GameManager';
import { StatsManager } from '../core/StatsManager';

export class SaveManager {
  private eventBus: EventBus;
  private static readonly SAVE_KEY = 'pilgrims_progress_save';
  private lastLoaded: SaveData | null = null;
  private saving = false;

  private onSave = () => { void this.save(); };
  private onLoad = () => { void this.load(); };

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

  /** Returns the last successfully loaded save (for GameScene to read on init). */
  getLastLoaded(): SaveData | null {
    return this.lastLoaded;
  }

  async save(): Promise<void> {
    if (this.saving) return; // Prevent concurrent saves
    this.saving = true;
    try {
      const gm = ServiceLocator.get<GameManager>(SERVICE_KEYS.GAME_MANAGER);
      const sm = ServiceLocator.get<StatsManager>(SERVICE_KEYS.STATS_MANAGER);

      const existing = await localforage.getItem<SaveData>(SaveManager.SAVE_KEY);
      const base = existing ? migrateSaveData(existing) : createDefaultSaveData();

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

      // v3: gather state from registered systems
      if (ServiceLocator.has(SERVICE_KEYS.NPC_STATE_MANAGER)) {
        const nsm = ServiceLocator.get<import('../systems/NpcStateManager').NpcStateManager>(SERVICE_KEYS.NPC_STATE_MANAGER);
        data.npcStates = nsm.getNpcStates();
        data.talkedNpcs = nsm.getTalkedNpcs();
      }

      if (ServiceLocator.has(SERVICE_KEYS.INK_SERVICE)) {
        const ink = ServiceLocator.get<import('../narrative/InkService').InkService>(SERVICE_KEYS.INK_SERVICE);
        const allStates = ink.getAllStates();
        if (Object.keys(allStates).length > 0) {
          data.inkState = allStates;
        }
      }

      if (ServiceLocator.has(SERVICE_KEYS.GAMEPLAY_STATE)) {
        const gps = ServiceLocator.get<import('../core/GamePlayState').GamePlayState>(SERVICE_KEYS.GAMEPLAY_STATE);
        data.triggeredEvents = Array.from(gps.triggeredEvents);
        data.mapState = { ...gps.mapState };
      }

      if (ServiceLocator.has(SERVICE_KEYS.NARRATIVE_DIRECTOR)) {
        const nd = ServiceLocator.get<import('../narrative/NarrativeDirector').NarrativeDirector>(SERVICE_KEYS.NARRATIVE_DIRECTOR);
        data.firedTriggers = nd.getFiredTriggers();
      }

      await localforage.setItem(SaveManager.SAVE_KEY, data);
      this.lastLoaded = data;
    } catch (e) {
      console.error('[SaveManager] save failed:', e);
    } finally {
      this.saving = false;
    }
  }

  async load(): Promise<SaveData | null> {
    try {
      const raw = await localforage.getItem<SaveData>(SaveManager.SAVE_KEY);
      if (!raw) return null;

      const data = migrateSaveData(raw);

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

      this.lastLoaded = data;
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
    this.lastLoaded = null;
  }

  destroy(): void {
    this.eventBus.off(GameEvent.SAVE_GAME, this.onSave);
    this.eventBus.off(GameEvent.LOAD_GAME, this.onLoad);
  }
}
