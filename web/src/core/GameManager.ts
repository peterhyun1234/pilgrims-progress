import { StateMachine } from './StateMachine';
import { EventBus } from './EventBus';
import { GameEvent, GameState } from './GameEvents';
import { StatsManager } from './StatsManager';
import { ServiceLocator, SERVICE_KEYS } from './ServiceLocator';

export class GameManager {
  private fsm: StateMachine<GameState>;
  private eventBus: EventBus;
  private statsManager: StatsManager;
  private _currentChapter = 1;
  private _playerName = 'Christian';
  private _language: 'ko' | 'en' = 'ko';

  constructor() {
    this.eventBus = EventBus.getInstance();
    this.statsManager = new StatsManager(this.eventBus);
    this.fsm = new StateMachine<GameState>();

    ServiceLocator.register(SERVICE_KEYS.EVENT_BUS, this.eventBus);
    ServiceLocator.register(SERVICE_KEYS.GAME_MANAGER, this);
    ServiceLocator.register(SERVICE_KEYS.STATS_MANAGER, this.statsManager);

    this.fsm
      .addState({
        id: GameState.BOOT,
        onEnter: () => this.eventBus.emit(GameEvent.GAME_STATE_CHANGED, GameState.BOOT),
      })
      .addState({
        id: GameState.MENU,
        onEnter: () => this.eventBus.emit(GameEvent.GAME_STATE_CHANGED, GameState.MENU),
      })
      .addState({
        id: GameState.GAME,
        onEnter: () => this.eventBus.emit(GameEvent.GAME_STATE_CHANGED, GameState.GAME),
      })
      .addState({
        id: GameState.PAUSE,
        onEnter: () => this.eventBus.emit(GameEvent.GAME_STATE_CHANGED, GameState.PAUSE),
      })
      .addState({
        id: GameState.BATTLE,
        onEnter: () => this.eventBus.emit(GameEvent.GAME_STATE_CHANGED, GameState.BATTLE),
      })
      .addState({
        id: GameState.CUTSCENE,
        onEnter: () => this.eventBus.emit(GameEvent.GAME_STATE_CHANGED, GameState.CUTSCENE),
      })
      .addState({
        id: GameState.DIALOGUE,
        onEnter: () => this.eventBus.emit(GameEvent.GAME_STATE_CHANGED, GameState.DIALOGUE),
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

  get language(): 'ko' | 'en' {
    return this._language;
  }

  set language(lang: 'ko' | 'en') {
    this._language = lang;
  }

  get stats(): StatsManager {
    return this.statsManager;
  }

  changeState(state: GameState): void {
    this.fsm.setState(state);
  }

  setChapter(chapter: number): void {
    this._currentChapter = chapter;
    this.eventBus.emit(GameEvent.CHAPTER_CHANGED, chapter);
  }

  isState(state: GameState): boolean {
    return this.fsm.isState(state);
  }

  newGame(): void {
    this.statsManager.reset();
    this._currentChapter = 1;
  }
}
