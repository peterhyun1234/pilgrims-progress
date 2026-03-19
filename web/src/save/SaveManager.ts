import localforage from 'localforage';
import { SaveData, SAVE_VERSION, createDefaultSaveData, GameSettings, DEFAULT_SETTINGS } from './SaveData';
import { ServiceLocator, SERVICE_KEYS } from '../core/ServiceLocator';
import { GameManager } from '../core/GameManager';
import { InkService } from '../narrative/InkService';

const SAVE_PREFIX = 'pp_save_';
const SETTINGS_KEY = 'pp_settings';

export class SaveManager {
  private store: LocalForage;

  constructor() {
    this.store = localforage.createInstance({
      name: 'pilgrims-progress',
      storeName: 'saves',
    });
  }

  async save(slot: string): Promise<void> {
    const gm = ServiceLocator.get<GameManager>(SERVICE_KEYS.GAME_MANAGER);

    let inkState = '';
    if (ServiceLocator.has(SERVICE_KEYS.INK_SERVICE)) {
      const ink = ServiceLocator.get<InkService>(SERVICE_KEYS.INK_SERVICE);
      inkState = ink.getState();
    }

    const data: SaveData = {
      version: SAVE_VERSION,
      timestamp: Date.now(),
      chapter: gm.currentChapter,
      playerName: gm.playerName,
      language: gm.language,
      position: { x: 0, y: 0 },
      stats: gm.stats.getAll(),
      inkState,
      collectedCards: [],
      metCharacters: [],
      settings: await this.loadSettings(),
    };

    await this.store.setItem(`${SAVE_PREFIX}${slot}`, data);
  }

  async load(slot: string): Promise<SaveData | null> {
    const data = await this.store.getItem<SaveData>(`${SAVE_PREFIX}${slot}`);
    if (!data) return null;

    if (data.version !== SAVE_VERSION) {
      return this.migrate(data);
    }

    return data;
  }

  async autoSave(): Promise<void> {
    await this.save('auto');
  }

  async loadAutoSave(): Promise<SaveData | null> {
    return this.load('auto');
  }

  async hasSave(slot: string): Promise<boolean> {
    const data = await this.store.getItem(`${SAVE_PREFIX}${slot}`);
    return data !== null;
  }

  async deleteSave(slot: string): Promise<void> {
    await this.store.removeItem(`${SAVE_PREFIX}${slot}`);
  }

  async saveSettings(settings: GameSettings): Promise<void> {
    await this.store.setItem(SETTINGS_KEY, settings);
  }

  async loadSettings(): Promise<GameSettings> {
    const settings = await this.store.getItem<GameSettings>(SETTINGS_KEY);
    return settings ?? { ...DEFAULT_SETTINGS };
  }

  private migrate(data: SaveData): SaveData {
    return { ...createDefaultSaveData(), ...data, version: SAVE_VERSION };
  }
}
