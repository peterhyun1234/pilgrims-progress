export interface StateConfig<T extends string> {
  id: T;
  onEnter?: () => void;
  onExit?: () => void;
  onUpdate?: (dt: number) => void;
}

export class StateMachine<T extends string> {
  private states: Map<T, StateConfig<T>> = new Map();
  private currentState: StateConfig<T> | null = null;
  private _previousState: T | null = null;

  get current(): T | null {
    return this.currentState?.id ?? null;
  }

  get previous(): T | null {
    return this._previousState;
  }

  addState(config: StateConfig<T>): this {
    this.states.set(config.id, config);
    return this;
  }

  setState(id: T): void {
    if (this.currentState?.id === id) return;

    const nextState = this.states.get(id);
    if (!nextState) return;

    this._previousState = this.currentState?.id ?? null;
    this.currentState?.onExit?.();
    this.currentState = nextState;
    this.currentState.onEnter?.();
  }

  update(dt: number): void {
    this.currentState?.onUpdate?.(dt);
  }

  isState(id: T): boolean {
    return this.currentState?.id === id;
  }
}
