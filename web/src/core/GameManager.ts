import { StateMachine } from './StateMachine';
import { EventBus } from './EventBus';
import { GameEvent, GameState, StatType } from './GameEvents';
import { StatsManager } from './StatsManager';
import { ServiceLocator, SERVICE_KEYS } from './ServiceLocator';
import { I18n } from '../i18n/I18n';

export type ColorblindType = 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';

/** Per-stat colors in each colorblind palette (hex numbers matching DesignSystem.STAT_COLORS). */
const COLORBLIND_PALETTES: Record<Exclude<ColorblindType, 'none'>, Record<StatType, number>> = {
  protanopia:   { faith: 0xe8c040, courage: 0x5555ff, wisdom: 0xff6600, burden: 0x888888 },
  deuteranopia: { faith: 0xffdd00, courage: 0x0066ff, wisdom: 0xff8800, burden: 0x999999 },
  tritanopia:   { faith: 0xff6688, courage: 0x44ddcc, wisdom: 0xff4400, burden: 0xaaaaaa },
};

/** Default STAT colors (must mirror DesignSystem.STAT_COLORS). */
const DEFAULT_STAT_COLORS: Record<StatType, number> = {
  faith:   0x6699ff,
  courage: 0xff8844,
  wisdom:  0x88ddaa,
  burden:  0xcc4444,
};

export class GameManager {
  private fsm: StateMachine<GameState>;
  private eventBus: EventBus;
  private statsManager: StatsManager;
  private _currentChapter = 1;
  private _playerName = 'Christian';
  private _language: string = 'ko';
  private _colorblindMode: ColorblindType = 'none';
  private _reduceMotion = false;
  readonly i18n: I18n = new I18n();

  constructor() {
    this.eventBus = EventBus.getInstance();
    this.statsManager = new StatsManager(this.eventBus);
    this.fsm = new StateMachine<GameState>();

    ServiceLocator.register(SERVICE_KEYS.EVENT_BUS, this.eventBus);
    ServiceLocator.register(SERVICE_KEYS.GAME_MANAGER, this);
    ServiceLocator.register(SERVICE_KEYS.STATS_MANAGER, this.statsManager);

    const states: GameState[] = [
      GameState.BOOT, GameState.MENU, GameState.GAME,
      GameState.PAUSE, GameState.BATTLE, GameState.CUTSCENE, GameState.DIALOGUE, GameState.INVENTORY,
    ];

    states.forEach(state => {
      this.fsm.addState({
        id: state,
        onEnter: () => this.eventBus.emit(GameEvent.GAME_STATE_CHANGED, state),
      });
    });

    this.fsm.setState(GameState.BOOT);
  }

  get state(): GameState | null {
    return this.fsm.current;
  }

  get currentChapter(): number {
    return this._currentChapter;
  }

  get playerName(): string {
    return this._playerName;
  }

  set playerName(name: string) {
    this._playerName = name;
  }

  get language(): string {
    return this._language;
  }

  set language(lang: string) {
    this._language = lang;
    this.i18n.setLanguage(lang);
  }

  get stats(): StatsManager {
    return this.statsManager;
  }

  get colorblindMode(): ColorblindType { return this._colorblindMode; }
  set colorblindMode(v: ColorblindType) {
    if (this._colorblindMode === v) return;
    this._colorblindMode = v;
    this.eventBus.emit(GameEvent.SETTINGS_CHANGED, { colorblindMode: v });
  }

  get reduceMotion(): boolean { return this._reduceMotion; }
  set reduceMotion(v: boolean) {
    if (this._reduceMotion === v) return;
    this._reduceMotion = v;
    this.eventBus.emit(GameEvent.SETTINGS_CHANGED, { reduceMotion: v });
  }

  /**
   * Returns the display color for a stat, respecting the active colorblind palette.
   * Use this everywhere instead of hardcoded DesignSystem.STAT_COLORS references.
   */
  getStatColor(stat: StatType): number {
    if (this._colorblindMode === 'none') return DEFAULT_STAT_COLORS[stat];
    return COLORBLIND_PALETTES[this._colorblindMode][stat];
  }

  changeState(state: GameState): void {
    this.fsm.setState(state);
  }

  setChapter(chapter: number, title?: string): void {
    this._currentChapter = chapter;
    this.eventBus.emit(GameEvent.CHAPTER_CHANGED, { chapter, title });
  }

  isState(state: GameState): boolean {
    return this.fsm.isState(state);
  }

  newGame(): void {
    this.statsManager.reset();
    this._currentChapter = 1;
  }
}
