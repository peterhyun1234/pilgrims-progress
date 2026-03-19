import { StatType } from '../core/GameEvents';

export interface SaveData {
  version: number;
  timestamp: number;
  chapter: number;
  playerName: string;
  language: 'ko' | 'en';
  position: { x: number; y: number };
  stats: Record<StatType, number>;
  inkState: string;
  collectedCards: string[];
  metCharacters: string[];
  settings: GameSettings;
}

export interface GameSettings {
  masterVolume: number;
  bgmVolume: number;
  sfxVolume: number;
  textSpeed: number;
  language: 'ko' | 'en';
}

export const DEFAULT_SETTINGS: GameSettings = {
  masterVolume: 1.0,
  bgmVolume: 0.7,
  sfxVolume: 0.8,
  textSpeed: 1,
  language: 'ko',
};

export const SAVE_VERSION = 1;

export function createDefaultSaveData(): SaveData {
  return {
    version: SAVE_VERSION,
    timestamp: Date.now(),
    chapter: 1,
    playerName: 'Christian',
    language: 'ko',
    position: { x: 160, y: 240 },
    stats: {
      faith: 30,
      courage: 20,
      wisdom: 20,
      burden: 80,
    },
    inkState: '',
    collectedCards: [],
    metCharacters: [],
    settings: { ...DEFAULT_SETTINGS },
  };
}
