import { StatType } from '../core/GameEvents';
import { STATS } from '../config';
import { HiddenStats } from '../core/StatsManager';

export interface GameSettings {
  language: 'ko' | 'en';
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
  inkState: string | null;
  bibleCards: string[];
  metCharacters: string[];
  settings: GameSettings;
  inventoryData?: InventorySaveData;
}

export function createDefaultSaveData(): SaveData {
  return {
    version: 2,
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
    inkState: null,
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
  };
}
