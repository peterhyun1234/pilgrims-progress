import { STATS } from '../config';
import { EventBus } from './EventBus';
import { GameEvent, StatType, StatChangePayload } from './GameEvents';

export class StatsManager {
  private stats: Record<StatType, number>;
  private eventBus: EventBus;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    this.stats = {
      faith: STATS.FAITH.initial,
      courage: STATS.COURAGE.initial,
      wisdom: STATS.WISDOM.initial,
      burden: STATS.BURDEN.initial,
    };
  }

  get(stat: StatType): number {
    return this.stats[stat];
  }

  getAll(): Record<StatType, number> {
    return { ...this.stats };
  }

  change(stat: StatType, amount: number): void {
    const config = STATS[stat.toUpperCase() as keyof typeof STATS];
    const oldValue = this.stats[stat];
    this.stats[stat] = Math.max(config.min, Math.min(config.max, oldValue + amount));

    const payload: StatChangePayload = {
      stat,
      amount,
      newValue: this.stats[stat],
    };
    this.eventBus.emit(GameEvent.STAT_CHANGED, payload);

    if (stat === 'burden') {
      this.eventBus.emit(GameEvent.BURDEN_CHANGED, this.stats.burden);
      if (this.stats.burden === 0 && oldValue > 0) {
        this.eventBus.emit(GameEvent.BURDEN_RELEASED);
      }
    }
  }

  setBurdenZero(): void {
    const oldValue = this.stats.burden;
    this.stats.burden = 0;
    this.eventBus.emit(GameEvent.BURDEN_CHANGED, 0);
    if (oldValue > 0) {
      this.eventBus.emit(GameEvent.BURDEN_RELEASED);
    }
  }

  getSpeedMultiplier(): number {
    return 1.0 - (this.stats.burden / 100) * 0.5;
  }

  setAll(stats: Record<StatType, number>): void {
    this.stats = { ...stats };
  }

  reset(): void {
    this.stats = {
      faith: STATS.FAITH.initial,
      courage: STATS.COURAGE.initial,
      wisdom: STATS.WISDOM.initial,
      burden: STATS.BURDEN.initial,
    };
  }
}
