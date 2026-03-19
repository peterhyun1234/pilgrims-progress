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

  SCREEN_SHAKE = 'screen_shake',
  SCREEN_FADE = 'screen_fade',
  SCREEN_FLASH = 'screen_flash',

  TOAST_SHOW = 'toast_show',
  LOCATION_SHOW = 'location_show',

  PAUSE = 'pause',
  RESUME = 'resume',
  QUIT_TO_MENU = 'quit_to_menu',
}

export enum GameState {
  BOOT = 'boot',
  MENU = 'menu',
  GAME = 'game',
  PAUSE = 'pause',
  BATTLE = 'battle',
  CUTSCENE = 'cutscene',
  DIALOGUE = 'dialogue',
}

export enum PlayerState {
  IDLE = 'idle',
  WALK = 'walk',
  INTERACT = 'interact',
  CUTSCENE = 'cutscene',
}

export enum Direction {
  UP = 'up',
  DOWN = 'down',
  LEFT = 'left',
  RIGHT = 'right',
}

export type StatType = 'faith' | 'courage' | 'wisdom' | 'burden';

export interface StatChangePayload {
  stat: StatType;
  amount: number;
  newValue: number;
}

export interface DialogueLinePayload {
  text: string;
  speaker?: string;
  tags: string[];
}

export interface DialogueChoicePayload {
  choices: { text: string; index: number; isHidden?: boolean }[];
}

export interface ToastPayload {
  text: string;
  type: 'stat' | 'card' | 'info';
  duration?: number;
}
