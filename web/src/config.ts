export const GAME_WIDTH = 480;
export const GAME_HEIGHT = 270;
export const TILE_SIZE = 16;

export const STATS = {
  FAITH: { initial: 30, min: 0, max: 100 },
  COURAGE: { initial: 20, min: 0, max: 100 },
  WISDOM: { initial: 20, min: 0, max: 100 },
  BURDEN: { initial: 60, min: 0, max: 100 },
} as const;

export const PLAYER = {
  BASE_SPEED: 80,
  ACCELERATION: 600,
  DECELERATION: 400,
  COYOTE_TIME: 120,
  SPRITE_SIZE: 32,
  LEGACY_SPRITE_SIZE: 16,
  BURDEN_SPEED_FACTOR: 0.5,
} as const;

export const ANIM = {
  IDLE_FPS: 4,
  WALK_FPS: 10,
  RUN_FPS: 14,
  INTERACT_FPS: 6,
  HURT_FPS: 8,
  PRAY_FPS: 3,
  CELEBRATE_FPS: 6,
  /** Number of columns in generated 32×32 spritesheets */
  SHEET_COLS: 8,
  SHEET_ROWS: 8,
} as const;

export const NPC_CONFIG = {
  INTERACTION_DISTANCE: 32,
  ALERT_DISTANCE: 56,
  PROMPT_OFFSET_Y: -14,
} as const;

export const DIALOGUE = {
  TYPING_SPEED_NORMAL: 40,
  TYPING_SPEED_SLOW: 80,
  TYPING_SPEED_FAST: 20,
  TYPING_SPEED_DRAMATIC: 200,
  TYPING_SPEED_WHISPER: 55,
  TYPING_SPEED_SCRIPTURE: 65,
  TYPING_SPEED_INSTANT: 0,
} as const;

export const COLORS = {
  LIGHT: {
    BG_PRIMARY: 0xf5e6d3,
    BG_SECONDARY: 0xe8d5bc,
    TEXT_PRIMARY: 0x3b2f2f,
    TEXT_SECONDARY: 0x6b5b4f,
    ACCENT: 0xd4a853,
  },
  DARK: {
    BG_PRIMARY: 0x1e2a3a,
    BG_SECONDARY: 0x2d1b4e,
    TEXT_PRIMARY: 0xe8e0d0,
    TEXT_SECONDARY: 0xa89b8c,
    ACCENT: 0xd4a853,
  },
  BATTLE: {
    BG: 0x4a1c1c,
    ACCENT: 0xff6b35,
    SUCCESS: 0xffd700,
    FAIL: 0xff2222,
  },
  STAT: {
    FAITH: 0xd4a853,
    COURAGE: 0x4a90d9,
    WISDOM: 0x9b59b6,
    BURDEN: 0x8b3a3a,
  },
  UI: {
    GOLD: 0xd4a853,
    PARCHMENT: 0xf5e6d3,
    PARCHMENT_DARK: 0xc8a882,
    DARK_BG: 0x0a0814,
    PANEL: 0x1a1428,
    PANEL_BORDER: 0xa68d50,
    TEXT_WHITE: 0xffffff,
    TEXT_MUTED: 0x8c8070,
    SUCCESS: 0x4a7c59,
    DANGER: 0x8b3a3a,
    BUTTON_DEFAULT: 0x1e1830,
    BUTTON_HOVER: 0x2a2040,
    OVERLAY_DIM: 0x000000,
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

export const BREAKPOINTS = {
  MOBILE_PORTRAIT: { maxWidth: 480 },
  MOBILE_LANDSCAPE: { maxWidth: 854, maxHeight: 480 },
  TABLET: { maxWidth: 1024 },
  DESKTOP: { minWidth: 1025 },
} as const;

export const TOUCH = {
  MIN_TARGET_SIZE: 44,
  JOYSTICK_SIZE: 64,
  JOYSTICK_INNER: 24,
  JOYSTICK_DEADZONE: 8,
  BUTTON_SIZE: 48,
  GESTURE_THRESHOLD: 30,
} as const;

export const CAMERA = {
  DEADZONE_X: 24,
  DEADZONE_Y: 16,
  ZOOM_DEFAULT: 1.0,
  ZOOM_DIALOGUE: 1.1,
  ZOOM_CLOSEUP: 1.3,
  ZOOM_CLIMAX: 1.5,
  ZOOM_WIDE: 0.8,
  ZOOM_BATTLE: 0.9,
} as const;

export const FONT = {
  KO_PRIMARY: "'Galmuri11', 'Silkscreen', monospace",
  EN_PRIMARY: "'Silkscreen', 'Galmuri11', monospace",
  SERIF: "'Georgia', 'Times New Roman', serif",
  EN_SIZE_SCALE: 1.0,
} as const;

export const COMBAT = {
  BASE_HP: 100,
  QTE_WINDOW_MS: 1500,
  QTE_PERFECT_MS: 300,
  PRAY_BASE_POWER: 15,
  DEFEND_REDUCTION: 0.5,
  TURN_DELAY_MS: 800,
} as const;

export const ITEMS = {
  MAX_INVENTORY: 20,
  ICON_SIZE: 16,
  GRID_COLS: 5,
} as const;

export const HIDDEN_STAT_CAPS = {
  SPIRITUAL_INSIGHT: 100,
  GRACE_COUNTER: 10,
} as const;
