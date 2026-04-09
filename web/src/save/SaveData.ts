import { StatType, NpcPhase } from '../core/GameEvents';
import { STATS } from '../config';
import { HiddenStats } from '../core/StatsManager';

export const SAVE_VERSION = 3;

export interface NpcState {
  npcId: string;
  phase: NpcPhase;
  knotPointer: string | null;
  talkCount: number;
  lastTalkChapter: number;
  relationshipScore: number;
  unlockedAt?: string;
  lastIdleTalkTimestamp: number;
}

export interface MapObjectState {
  objectId: string;
  visible: boolean;
  open: boolean;
  activated: boolean;
  tint?: number;
}

export interface GameSettings {
  language: string;
  bgmVolume: number;
  sfxVolume: number;
  touchControlsType: 'dynamic' | 'fixed';
  fontSizeMultiplier: number;
  colorblindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  reduceMotion: boolean;
}

export interface InventorySaveData {
  inventory: { itemId: string; quantity: number }[];
  equipped: { weapon: string | null; armor: string | null; accessory: string | null };
}

export interface SaveData {
  version: number;
  timestamp: number;
  chapter: number;
  playerName: string;
  stats: Record<StatType, number>;
  hiddenStats: HiddenStats;
  /** Per-story-key Ink state (key = e.g. "ch01_ink") */
  inkState: Record<string, string>;
  bibleCards: string[];
  metCharacters: string[];
  settings: GameSettings;
  inventoryData?: InventorySaveData;
  // v3 additions
  talkedNpcs: Record<string, number>;
  triggeredEvents: string[];
  npcStates: Record<string, NpcState>;
  mapState: Record<string, MapObjectState>;
  firedTriggers: string[];
}

export function createDefaultSaveData(): SaveData {
  return {
    version: SAVE_VERSION,
    timestamp: Date.now(),
    chapter: 1,
    playerName: 'Christian',
    stats: {
      faith: STATS.FAITH.initial,
      courage: STATS.COURAGE.initial,
      wisdom: STATS.WISDOM.initial,
      burden: STATS.BURDEN.initial,
    },
    hiddenStats: {
      relationships: {},
      spiritualInsight: 0,
      graceCounter: 0,
    },
    inkState: {},
    bibleCards: [],
    metCharacters: [],
    settings: {
      language: 'ko',
      bgmVolume: 0.5,
      sfxVolume: 0.7,
      touchControlsType: 'dynamic',
      fontSizeMultiplier: 1.0,
      colorblindMode: 'none',
      reduceMotion: false,
    },
    talkedNpcs: {},
    triggeredEvents: [],
    npcStates: {},
    mapState: {},
    firedTriggers: [],
  };
}

/**
 * Migrate save data from any previous version to current SAVE_VERSION.
 * Never throws — returns a valid SaveData or default on failure.
 */
export function migrateSaveData(raw: unknown): SaveData {
  if (!raw || typeof raw !== 'object') return createDefaultSaveData();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const obj: Record<string, any> = { ...(raw as Record<string, unknown>) };

  // v1 → v2: inkState was a string | null, reset it
  if (!obj['version'] || obj['version'] === 1) {
    obj['version'] = 2;
    obj['inkState'] = {};
  }

  // v2 → v3
  if (obj['version'] === 2) {
    obj['version'] = SAVE_VERSION;
    obj['talkedNpcs'] = obj['talkedNpcs'] ?? {};
    obj['triggeredEvents'] = obj['triggeredEvents'] ?? [];
    obj['npcStates'] = obj['npcStates'] ?? {};
    obj['mapState'] = obj['mapState'] ?? {};
    obj['firedTriggers'] = obj['firedTriggers'] ?? [];
    // inkState was string | null in some v2 builds — reset to empty Record
    if (typeof obj['inkState'] !== 'object' || obj['inkState'] === null) {
      obj['inkState'] = {};
    }
  }

  // Merge with defaults to ensure all required fields exist (forward-compat).
  // Deep-merge `settings` so new fields (colorblindMode, reduceMotion, …) always
  // have a value even when loading saves written before they existed.
  const defaults = createDefaultSaveData();
  const result = { ...defaults, ...obj } as SaveData;

  // Deep-merge settings so new fields (colorblindMode, reduceMotion, …) always
  // have a value even when loading saves written before they existed.
  result.settings = { ...defaults.settings, ...(obj['settings'] ?? {}) } as SaveData['settings'];

  // Always stamp current version after migration.
  result.version = SAVE_VERSION;

  // Clamp stats to valid [0, 100] range — guards against corrupted saves.
  for (const key of ['faith', 'courage', 'wisdom', 'burden'] as StatType[]) {
    result.stats[key] = Math.max(
      STATS[key.toUpperCase() as keyof typeof STATS].min,
      Math.min(STATS[key.toUpperCase() as keyof typeof STATS].max, result.stats[key] ?? defaults.stats[key]),
    );
  }

  return result;
}
