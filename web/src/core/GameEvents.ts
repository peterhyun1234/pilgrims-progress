export enum GameEvent {
  LANGUAGE_SELECTED = 'language_selected',
  GAME_STATE_CHANGED = 'game_state_changed',
  CHAPTER_CHANGED = 'chapter_changed',
  CHAPTER_ENTER = 'chapter_enter',

  PLAYER_MOVE = 'player_move',
  PLAYER_INTERACT = 'player_interact',
  PLAYER_STATE_CHANGED = 'player_state_changed',

  NPC_INTERACT = 'npc_interact',
  NPC_PROMPT_SHOW = 'npc_prompt_show',
  NPC_PROMPT_HIDE = 'npc_prompt_hide',

  DIALOGUE_START = 'dialogue_start',
  DIALOGUE_LINE = 'dialogue_line',
  DIALOGUE_CHOICE = 'dialogue_choice',
  DIALOGUE_CHOICE_SELECTED = 'dialogue_choice_selected',
  DIALOGUE_END = 'dialogue_end',

  STAT_CHANGED = 'stat_changed',
  BURDEN_CHANGED = 'burden_changed',
  BURDEN_RELEASED = 'burden_released',

  BIBLE_CARD_COLLECTED = 'bible_card_collected',
  CHARACTER_MET = 'character_met',

  SAVE_GAME = 'save_game',
  LOAD_GAME = 'load_game',
  AUTO_SAVE = 'auto_save',

  BGM_PLAY = 'bgm_play',
  BGM_STOP = 'bgm_stop',
  SFX_PLAY = 'sfx_play',
  MUSIC_FADE_OUT = 'music_fade_out',
  MUSIC_FADE_TO_SILENCE = 'music_fade_to_silence',
  MUSIC_CROSSFADE = 'music_crossfade',
  AMBIENT_CHANGE = 'ambient_change',

  SCREEN_SHAKE = 'screen_shake',
  SCREEN_FADE = 'screen_fade',
  SCREEN_FLASH = 'screen_flash',

  CAMERA_ZOOM = 'camera_zoom',
  CAMERA_PAN = 'camera_pan',
  CAMERA_RESET = 'camera_reset',

  MOOD_CHANGE = 'mood_change',
  PALETTE_SHIFT = 'palette_shift',
  LIGHT_CHANGE = 'light_change',

  EMOTE_SHOW = 'emote_show',
  EMOTION_CHANGE = 'emotion_change',
  ANIM_PLAY = 'anim_play',

  TEXT_EFFECT = 'text_effect',
  TYPING_SPEED_CHANGE = 'typing_speed_change',

  TOAST_SHOW = 'toast_show',
  LOCATION_SHOW = 'location_show',

  PAUSE = 'pause',
  RESUME = 'resume',
  QUIT_TO_MENU = 'quit_to_menu',

  UI_MODE_CHANGED = 'ui_mode_changed',
  SETTINGS_CHANGED = 'settings_changed',

  ITEM_ACQUIRED = 'item_acquired',
  ITEM_USED = 'item_used',
  ITEM_EQUIPPED = 'item_equipped',
  ITEM_REMOVED = 'item_removed',
  INVENTORY_OPEN = 'inventory_open',
  INVENTORY_CLOSE = 'inventory_close',

  BATTLE_START = 'battle_start',
  BATTLE_END = 'battle_end',
  BATTLE_TURN = 'battle_turn',
  SKILL_USED = 'skill_used',
  PLAYER_DAMAGED = 'player_damaged',
  ENEMY_DAMAGED = 'enemy_damaged',
  QTE_START = 'qte_start',
  QTE_RESULT = 'qte_result',

  TUTORIAL_SHOW = 'tutorial_show',
  TUTORIAL_DISMISS = 'tutorial_dismiss',
  MAP_EVENT = 'map_event',
}

export enum GameState {
  BOOT = 'boot',
  MENU = 'menu',
  GAME = 'game',
  PAUSE = 'pause',
  BATTLE = 'battle',
  CUTSCENE = 'cutscene',
  DIALOGUE = 'dialogue',
  INVENTORY = 'inventory',
}

export enum PlayerState {
  IDLE = 'idle',
  WALK = 'walk',
  RUN = 'run',
  INTERACT = 'interact',
  HURT = 'hurt',
  PRAY = 'pray',
  CELEBRATE = 'celebrate',
  FALL = 'fall',
  CUTSCENE = 'cutscene',
}

export enum Direction {
  UP = 'up',
  DOWN = 'down',
  LEFT = 'left',
  RIGHT = 'right',
}

export type StatType = 'faith' | 'courage' | 'wisdom' | 'burden';

export type MoodType =
  | 'tense' | 'dread' | 'sorrow' | 'awe' | 'joy'
  | 'anger' | 'peace' | 'resolve' | 'despair' | 'grace'
  | 'silence' | 'betrayal';

export type ChoiceWeight = 'light' | 'medium' | 'heavy' | 'critical';

export type EmoteType =
  | 'surprise' | 'question' | 'thinking' | 'joy' | 'anger'
  | 'sadness' | 'fear' | 'love' | 'frustration' | 'sleep'
  | 'shine' | 'cross';

export type UIMode = 'desktop' | 'tablet' | 'mobile-landscape' | 'mobile-portrait';

export interface StatChangePayload {
  stat: StatType;
  amount: number;
  newValue: number;
  oldValue: number;
}

export interface DialogueLinePayload {
  text: string;
  speaker?: string;
  speakerEn?: string;
  emotion?: string;
  tags: string[];
}

export interface DialogueChoicePayload {
  choices: {
    text: string;
    index: number;
    isHidden?: boolean;
    requiredStat?: string;
    requiredValue?: number;
    weight?: ChoiceWeight;
  }[];
  weight?: ChoiceWeight;
}

export interface ToastPayload {
  text: string;
  type: 'stat-positive' | 'stat-negative' | 'card' | 'info' | 'achievement';
  icon?: string;
  statColor?: number;
  duration?: number;
}

export interface CameraZoomPayload {
  zoom: number;
  duration: number;
}

export interface ShakePayload {
  intensity: number;
  duration: number;
  count?: number;
}

export interface MoodPayload {
  mood: MoodType;
  duration?: number;
}

export interface PaletteShiftPayload {
  value: number;
  duration: number;
}

export interface EmotePayload {
  target: string;
  emote: EmoteType;
  duration?: number;
}

export interface EmotionPayload {
  target: string;
  emotion: string;
}

export interface UIModePayload {
  mode: UIMode;
  isTouchDevice: boolean;
  isPortrait: boolean;
  screenWidth: number;
  screenHeight: number;
}

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'legendary';
export type ItemType = 'consumable' | 'equipment' | 'key' | 'scripture';
export type EquipSlot = 'weapon' | 'armor' | 'accessory';

export interface ItemAcquiredPayload {
  itemId: string;
  quantity: number;
}

export interface BattleStartPayload {
  enemyId: string;
  enemyName: string;
  enemyNameKo: string;
  isBoss: boolean;
}

export interface BattleResult {
  victory: boolean;
  enemyId: string;
  turnsUsed: number;
}

export interface QTEPayload {
  type: 'timing' | 'sequence';
  difficulty: number;
}

export interface QTEResultPayload {
  success: boolean;
  accuracy: number;
}

export type PortraitEmotion = 'neutral' | 'happy' | 'angry' | 'sad' | 'fearful' | 'surprised' | 'determined';
