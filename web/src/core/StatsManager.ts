import { STATS, HIDDEN_STAT_CAPS } from '../config';
import { EventBus } from './EventBus';
import { GameEvent, StatType, StatChangePayload } from './GameEvents';

export interface HiddenStats {
  relationships: Record<string, number>;
  spiritualInsight: number;
  graceCounter: number;
}

export class StatsManager {
  private stats: Record<StatType, number>;
  private hidden: HiddenStats;
  private eventBus: EventBus;
  private burdenFreed = false;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    this.stats = {
      faith: STATS.FAITH.initial,
      courage: STATS.COURAGE.initial,
      wisdom: STATS.WISDOM.initial,
      burden: STATS.BURDEN.initial,
    };
    this.hidden = {
      relationships: {},
      spiritualInsight: 0,
      graceCounter: 0,
    };
  }

  get(stat: StatType): number {
    return this.stats[stat];
  }

  getAll(): Record<StatType, number> {
    return { ...this.stats };
  }

  getHidden(): HiddenStats {
    return { ...this.hidden };
  }

  change(stat: StatType, amount: number): void {
    const config = STATS[stat.toUpperCase() as keyof typeof STATS];
    const oldValue = this.stats[stat];

    const adjustedAmount = stat !== 'burden'
      ? this.applyBurdenModifier(amount)
      : amount;

    this.stats[stat] = Math.max(config.min, Math.min(config.max, oldValue + adjustedAmount));

    const payload: StatChangePayload = {
      stat,
      amount: this.stats[stat] - oldValue,
      newValue: this.stats[stat],
      oldValue,
    };
    this.eventBus.emit(GameEvent.STAT_CHANGED, payload);

    if (stat === 'burden') {
      this.eventBus.emit(GameEvent.BURDEN_CHANGED, this.stats.burden);
      if (this.stats.burden === 0 && oldValue > 0) {
        this.burdenFreed = true;
        this.eventBus.emit(GameEvent.BURDEN_RELEASED);
      }
    }

    this.checkAntifrustration();
  }

  private applyBurdenModifier(amount: number): number {
    if (amount <= 0) return amount;
    if (this.burdenFreed) return Math.round(amount * 1.2);
    if (this.stats.burden >= 80) return Math.round(amount * 0.6);
    if (this.stats.burden >= 60) return Math.round(amount * 0.8);
    return amount;
  }

  private checkAntifrustration(): void {
    if (this.stats.faith <= 0) {
      this.hidden.graceCounter = Math.min(HIDDEN_STAT_CAPS.GRACE_COUNTER, this.hidden.graceCounter + 1);
      this.stats.faith = 10;
      this.eventBus.emit(GameEvent.STAT_CHANGED, {
        stat: 'faith' as StatType,
        amount: 10,
        newValue: 10,
        oldValue: 0,
      } as StatChangePayload);
    }

    const allLow = this.stats.faith <= 20
      && this.stats.courage <= 20
      && this.stats.wisdom <= 20;
    if (allLow && !this.burdenFreed) {
      this.hidden.graceCounter = Math.min(HIDDEN_STAT_CAPS.GRACE_COUNTER, this.hidden.graceCounter + 1);
      this.stats.faith = Math.min(100, this.stats.faith + 10);
      this.stats.courage = Math.min(100, this.stats.courage + 10);
      this.stats.wisdom = Math.min(100, this.stats.wisdom + 10);
    }
  }

  setBurdenZero(): void {
    const oldValue = this.stats.burden;
    this.stats.burden = 0;
    this.burdenFreed = true;
    this.eventBus.emit(GameEvent.BURDEN_CHANGED, 0);
    if (oldValue > 0) {
      this.eventBus.emit(GameEvent.BURDEN_RELEASED);
    }
  }

  getSpeedMultiplier(): number {
    const b = this.stats.burden;
    if (b >= 80) return 0.6;
    if (b >= 60) return 0.8;
    return 1.0 - (b / 100) * 0.25;
  }

  changeRelationship(npcId: string, amount: number): void {
    const current = this.hidden.relationships[npcId] ?? 50;
    this.hidden.relationships[npcId] = Math.max(0, Math.min(100, current + amount));
  }

  getRelationship(npcId: string): number {
    return this.hidden.relationships[npcId] ?? 50;
  }

  addInsight(amount: number): void {
    this.hidden.spiritualInsight = Math.max(0, Math.min(
      HIDDEN_STAT_CAPS.SPIRITUAL_INSIGHT,
      this.hidden.spiritualInsight + amount,
    ));
  }

  getInsight(): number {
    return this.hidden.spiritualInsight;
  }

  incrementGrace(): void {
    this.hidden.graceCounter = Math.min(HIDDEN_STAT_CAPS.GRACE_COUNTER, this.hidden.graceCounter + 1);
  }

  hasSynergy(stat1: StatType, stat2: StatType, threshold = 50): boolean {
    return this.stats[stat1] >= threshold && this.stats[stat2] >= threshold;
  }

  getEndingScore(): number {
    const finalScore = (this.stats.faith * 0.4)
      + (this.stats.courage * 0.3)
      + (this.stats.wisdom * 0.3);
    const graceBonus = Math.min(this.hidden.graceCounter * 2, 10);
    return finalScore + graceBonus;
  }

  getEndingTier(): 'glory' | 'humble' | 'barely' | 'grace' {
    const score = this.getEndingScore();
    if (score >= 80 && this.stats.faith >= 80) return 'glory';
    if (score >= 50 && this.stats.faith >= 40) return 'humble';
    if (score >= 30 && this.stats.faith >= 20) return 'barely';
    return 'grace';
  }

  isBurdenFreed(): boolean {
    return this.burdenFreed;
  }

  setAll(stats: Record<StatType, number>): void {
    this.stats = { ...stats };
  }

  setHidden(hidden: HiddenStats): void {
    this.hidden = { ...hidden };
  }

  reset(): void {
    this.stats = {
      faith: STATS.FAITH.initial,
      courage: STATS.COURAGE.initial,
      wisdom: STATS.WISDOM.initial,
      burden: STATS.BURDEN.initial,
    };
    this.hidden = {
      relationships: {},
      spiritualInsight: 0,
      graceCounter: 0,
    };
    this.burdenFreed = false;
  }
}
