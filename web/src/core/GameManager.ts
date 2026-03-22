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
