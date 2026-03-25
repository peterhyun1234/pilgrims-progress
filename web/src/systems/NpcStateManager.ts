import { EventBus } from '../core/EventBus';
import { GameEvent, NpcPhase, NpcPhaseChangedPayload, StatType } from '../core/GameEvents';
import { NpcState } from '../save/SaveData';
import { ServiceLocator, SERVICE_KEYS } from '../core/ServiceLocator';
import { StatsManager } from '../core/StatsManager';

/** Idle cooldown in milliseconds (30 seconds). */
const IDLE_COOLDOWN_MS = 30_000;

export class NpcStateManager {
  private states: Record<string, NpcState> = {};
  private talkedNpcs: Record<string, number> = {};
  private eventBus: EventBus;
  /** npcId of the NPC currently mid-conversation (active phase). */
  private activeNpcId: string | null = null;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    this.setupEvents();
  }

  private setupEvents(): void {
    this.eventBus.on(GameEvent.STAT_CHANGED, this.onStatChanged);
    this.eventBus.on(GameEvent.CHAPTER_CHANGED, this.onChapterChanged);
  }

  private onStatChanged = () => {
    this.checkStatUnlocks();
  };

  private onChapterChanged = () => {
    this.checkStatUnlocks();
  };

  /** Load state from persisted save data. */
  initFromSave(npcStates: Record<string, NpcState>, talkedNpcs: Record<string, number>): void {
    this.states = { ...npcStates };
    this.talkedNpcs = { ...talkedNpcs };
  }

  /**
   * Register an NPC. Safe to call multiple times — existing state is preserved.
   * @param npcId       The NPC's unique ID
   * @param unlockedAt  Prerequisite NPC ID that must be 'completed' first
   */
  initNpc(npcId: string, unlockedAt?: string): void {
    if (this.states[npcId]) {
      // Already registered from save data — preserve existing state
      return;
    }

    const phase: NpcPhase = unlockedAt ? 'locked' : 'available';
    this.states[npcId] = {
      npcId,
      phase,
      knotPointer: null,
      talkCount: 0,
      lastTalkChapter: 0,
      relationshipScore: 50,
      unlockedAt,
      lastIdleTalkTimestamp: 0,
    };
  }

  getPhase(npcId: string): NpcPhase {
    return this.states[npcId]?.phase ?? 'available';
  }

  getState(npcId: string): NpcState | undefined {
    return this.states[npcId];
  }

  setPhase(npcId: string, phase: NpcPhase): void {
    if (!this.states[npcId]) this.initNpc(npcId);
    const prev = this.states[npcId].phase;
    if (prev === phase) return;

    this.states[npcId].phase = phase;

    const payload: NpcPhaseChangedPayload = { npcId, phase, prevPhase: prev };
    this.eventBus.emit(GameEvent.NPC_PHASE_CHANGED, payload);

    // Cascade: check if this completion unlocks other NPCs
    if (phase === 'completed') {
      this.checkPrerequisiteUnlocks();
    }
  }

  /** Unlock any NPCs whose prerequisite NPC has just been completed. */
  private checkPrerequisiteUnlocks(): void {
    for (const state of Object.values(this.states)) {
      if (state.phase !== 'locked') continue;
      if (!state.unlockedAt) {
        this.setPhase(state.npcId, 'available');
        continue;
      }
      const prereq = this.states[state.unlockedAt];
      if (prereq?.phase === 'completed') {
        this.setPhase(state.npcId, 'available');
      }
    }
  }

  /** Check stat-based unlocks (e.g. goodwill in Ch4 needs wisdom >= 40). */
  checkStatUnlocks(): void {
    if (!ServiceLocator.has(SERVICE_KEYS.STATS_MANAGER)) return;
    const sm = ServiceLocator.get<StatsManager>(SERVICE_KEYS.STATS_MANAGER);

    // goodwill (Ch4) needs wisdom >= 40
    const goodwillState = this.states['goodwill'];
    if (goodwillState?.phase === 'locked' && !goodwillState.unlockedAt) {
      if (sm.get('wisdom' as StatType) >= 40) {
        this.setPhase('goodwill', 'available');
      }
    }
  }

  /** Mark an NPC as currently being talked to. */
  beginTalk(npcId: string, chapter: number): void {
    if (!this.states[npcId]) this.initNpc(npcId);
    this.activeNpcId = npcId;
    const state = this.states[npcId];
    if (state.phase === 'available') {
      this.setPhase(npcId, 'active');
    }
    state.lastTalkChapter = chapter;
  }

  /** Record a completed talk and advance phase to 'completed' (first talk) or stay. */
  endTalk(npcId: string): void {
    if (!this.states[npcId]) return;
    this.activeNpcId = null;

    const state = this.states[npcId];
    state.talkCount++;
    this.talkedNpcs[npcId] = (this.talkedNpcs[npcId] ?? 0) + 1;

    if (state.phase === 'active') {
      this.setPhase(npcId, 'completed');
    } else if (state.phase === 'completed') {
      state.lastIdleTalkTimestamp = Date.now();
    }
  }

  getTalkCount(npcId: string): number {
    return this.talkedNpcs[npcId] ?? 0;
  }

  setKnotPointer(npcId: string, knot: string | null): void {
    if (!this.states[npcId]) this.initNpc(npcId);
    this.states[npcId].knotPointer = knot;
  }

  /** Returns true if the idle chat cooldown is still active for this NPC. */
  isIdleCooldownActive(npcId: string): boolean {
    const state = this.states[npcId];
    if (!state?.lastIdleTalkTimestamp) return false;
    return Date.now() - state.lastIdleTalkTimestamp < IDLE_COOLDOWN_MS;
  }

  updateIdleTimestamp(npcId: string): void {
    if (!this.states[npcId]) this.initNpc(npcId);
    this.states[npcId].lastIdleTalkTimestamp = Date.now();
  }

  getActiveNpcId(): string | null {
    return this.activeNpcId;
  }

  getNpcStates(): Record<string, NpcState> {
    return { ...this.states };
  }

  getTalkedNpcs(): Record<string, number> {
    return { ...this.talkedNpcs };
  }

  destroy(): void {
    this.eventBus.off(GameEvent.STAT_CHANGED, this.onStatChanged);
    this.eventBus.off(GameEvent.CHAPTER_CHANGED, this.onChapterChanged);
  }
}
