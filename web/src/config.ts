export const GAME_WIDTH = 320;
export const GAME_HEIGHT = 180;
export const TILE_SIZE = 16;

export const STATS = {
  FAITH: { initial: 30, min: 0, max: 100 },
  COURAGE: { initial: 20, min: 0, max: 100 },
  WISDOM: { initial: 20, min: 0, max: 100 },
  BURDEN: { initial: 80, min: 0, max: 100 },
} as const;

export const PLAYER = {
  BASE_SPEED: 80,
  ACCELERATION: 600,
  DECELERATION: 400,
  COYOTE_TIME: 120,
  SPRITE_SIZE: 16,
  BURDEN_SPEED_FACTOR: 0.5,
} as const;

export const NPC = {
  INTERACTION_DISTANCE: 24,
  PROMPT_OFFSET_Y: -12,
} as const;

export const DIALOGUE = {
  TYPING_SPEED: 30,
  FAST_TYPING_SPEED: 10,
  INSTANT_SPEED: 0,
} as const;

export const COLORS = {
  LIGHT: {
    PRIMARY: 0xc8956c,
    SECONDARY: 0xf5e6d3,
    ACCENT: 0xd4a853,
    TEXT: 0x3b2f2f,
  },
  DARK: {
    PRIMARY: 0x1e2a3a,
    SECONDARY: 0x2d1b4e,
    ACCENT: 0x8b3a3a,
    TEXT: 0xe8e0d0,
  },
  BATTLE: {
    PRIMARY: 0x4a1c1c,
    ACCENT: 0xff6b35,
  },
  UI: {
    GOLD: 0xe6c86e,
    DARK_BG: 0x0a0814,
    PANEL: 0x14101e,
    PANEL_BORDER: 0xa68d50,
    TEXT: 0xffffff,
    TEXT_MUTED: 0x8c8070,
    BUTTON_GREEN: 0x2d6640,
    BUTTON_RED: 0x4a1e1e,
    BUTTON_DEFAULT: 0x1e1830,
  },
} as const;

export const SCENE_KEYS = {
  BOOT: 'BootScene',
  PRELOAD: 'PreloadScene',
  LANGUAGE: 'LanguageScene',
  MENU: 'MenuScene',
  ONBOARDING: 'OnboardingScene',
  GAME: 'GameScene',
  BATTLE: 'BattleScene',
  CUTSCENE: 'CutsceneScene',
} as const;
