import { Story } from 'inkjs';
import { EventBus } from '../core/EventBus';
import { GameEvent, StatType } from '../core/GameEvents';
import { ServiceLocator, SERVICE_KEYS } from '../core/ServiceLocator';
import { StatsManager } from '../core/StatsManager';

export interface InkChoice {
  text: string;
  index: number;
  isHidden: boolean;
  requiredStat?: string;
  requiredValue?: number;
}

export class InkService {
  private story: Story | null = null;
  private eventBus: EventBus;
  private narrativeTags: string[] = [];
  /** Current story key (e.g. "ch01_ink") — used for state persistence. */
  private currentStoryKey: string | null = null;
  /** Current NPC ID — used by STAT ONCE guard. */
  private currentNpcId: string | null = null;
  /** Persisted Ink states keyed by story key. */
  private savedStates: Record<string, string> = {};

  constructor(_scene: Phaser.Scene) {
    this.eventBus = EventBus.getInstance();
  }

  /** Initialise from a previously loaded save (call in GameScene.create). */
  initFromSave(inkState: Record<string, string>): void {
    this.savedStates = { ...inkState };
  }

  /** Returns all currently persisted states (for SaveManager). */
  getAllStates(): Record<string, string> {
    return { ...this.savedStates };
  }

  loadStory(jsonData: Record<string, never>, storyKey?: string): void {
    this.story = new Story(jsonData as Record<string, never>);
    this.currentStoryKey = storyKey ?? null;
    this.bindExternalFunctions();

    // Restore saved state if available
    if (storyKey && this.savedStates[storyKey]) {
      try {
        this.story.state.LoadJson(this.savedStates[storyKey]);
      } catch (e) {
        console.warn(`[InkService] Failed to restore state for ${storyKey}, starting fresh:`, e);
      }
    }
  }

  /** Persist the current story state (call after dialogue ends). */
  persistState(): void {
    if (!this.story || !this.currentStoryKey) return;
    try {
      this.savedStates[this.currentStoryKey] = this.story.state.toJson();
    } catch (e) {
      console.warn('[InkService] Failed to persist ink state:', e);
    }
  }

  /** Set the NPC context — used by STAT ONCE guard. */
  setCurrentNpc(npcId: string | null): void {
    this.currentNpcId = npcId;
  }

  /** Jump to a named Ink knot. Returns false if knot does not exist. */
  jumpToKnot(knot: string): boolean {
    if (!this.story) return false;
    try {
      this.story.ChoosePathString(knot);
      return true;
    } catch {
      return false;
    }
  }

  private bindExternalFunctions(): void {
    if (!this.story) return;

    this.story.BindExternalFunction('getStat', (stat: string): number => {
      const sm = ServiceLocator.get<StatsManager>(SERVICE_KEYS.STATS_MANAGER);
      return sm.get(stat as StatType);
    });

    this.story.BindExternalFunction('hasMet', (char: string): boolean => {
      // Real impl: NpcStateManager.getTalkCount > 0 means we've talked to them at
      // least once. Was hardcoded `true` — meaning Ink {hasMet('x')} branches
      // always took the truthy path even before meeting the character.
      if (ServiceLocator.has(SERVICE_KEYS.NPC_STATE_MANAGER)) {
        const nsm = ServiceLocator.get<import('../systems/NpcStateManager').NpcStateManager>(SERVICE_KEYS.NPC_STATE_MANAGER);
        return nsm.getTalkCount(char) > 0;
      }
      return false;
    });

    this.story.BindExternalFunction('getTalkCount', (npcId: string): number => {
      if (ServiceLocator.has(SERVICE_KEYS.NPC_STATE_MANAGER)) {
        const nsm = ServiceLocator.get<import('../systems/NpcStateManager').NpcStateManager>(SERVICE_KEYS.NPC_STATE_MANAGER);
        return nsm.getTalkCount(npcId);
      }
      return 0;
    });
  }

  canContinue(): boolean {
    return this.story?.canContinue ?? false;
  }

  continue(): { text: string; tags: string[] } | null {
    if (!this.story || !this.story.canContinue) return null;

    const text = this.story.Continue()?.trim() ?? '';
    const tags = this.story.currentTags ?? [];

    this.narrativeTags = [];
    for (const tag of tags) {
      this.processTag(tag);
    }

    return { text, tags: [...tags, ...this.narrativeTags] };
  }

  getChoices(): InkChoice[] {
    if (!this.story) return [];

    const sm = ServiceLocator.get<StatsManager>(SERVICE_KEYS.STATS_MANAGER);

    return this.story.currentChoices.map((choice, index) => {
      let isHidden = false;
      let requiredStat: string | undefined;
      let requiredValue: number | undefined;

      const bracketMatch = choice.text.match(/\[(\w+)>=(\d+)\]\s*(.*)/);
      if (bracketMatch) {
        requiredStat = bracketMatch[1].toLowerCase();
        requiredValue = parseInt(bracketMatch[2], 10);
        const currentVal = sm.get(requiredStat as StatType);

        if (currentVal < requiredValue) {
          isHidden = true;
        }

        return {
          text: bracketMatch[3] || choice.text,
          index,
          isHidden,
          requiredStat,
          requiredValue,
        };
      }

      return { text: choice.text, index, isHidden };
    });
  }

  choose(index: number): void {
    if (!this.story) return;
    this.story.ChooseChoiceIndex(index);
  }

  private processTag(tag: string): void {
    const parts = tag.trim().split(':').map(s => s.trim());
    const command = parts[0];
    const value = parts.slice(1).join(':').trim();

    switch (command) {
      case 'STAT': {
        // Support "STAT: faith + 5" and "STAT: faith + 5 ONCE"
        const match = value.match(/(\w+)\s*([\+\-])\s*(\d+)(\s+ONCE)?/i);
        if (match) {
          const isOnce = !!match[4];

          // ONCE guard: skip if this NPC has already been talked to
          if (isOnce && this.currentNpcId) {
            if (ServiceLocator.has(SERVICE_KEYS.NPC_STATE_MANAGER)) {
              const nsm = ServiceLocator.get<import('../systems/NpcStateManager').NpcStateManager>(SERVICE_KEYS.NPC_STATE_MANAGER);
              if (nsm.getTalkCount(this.currentNpcId) > 0) break;
            }
          }

          const stat = match[1].toLowerCase() as StatType;
          const sign = match[2] === '+' ? 1 : -1;
          const amount = parseInt(match[3], 10) * sign;

          const sm = ServiceLocator.get<StatsManager>(SERVICE_KEYS.STATS_MANAGER);
          sm.change(stat, amount);
        }
        break;
      }

      case 'RELATIONSHIP': {
        const match = value.match(/(\w+)\s*([\+\-])\s*(\d+)/);
        if (match) {
          const npc = match[1];
          const sign = match[2] === '+' ? 1 : -1;
          const amount = parseInt(match[3], 10) * sign;

          const sm = ServiceLocator.get<StatsManager>(SERVICE_KEYS.STATS_MANAGER);
          sm.changeRelationship(npc, amount);
        }
        break;
      }

      case 'INSIGHT': {
        const amount = parseInt(value, 10) || 1;
        const sm = ServiceLocator.get<StatsManager>(SERVICE_KEYS.STATS_MANAGER);
        sm.addInsight(amount);
        break;
      }

      case 'BIBLE_CARD':
        this.eventBus.emit(GameEvent.BIBLE_CARD_COLLECTED, value);
        break;

      case 'CHARACTER_MET':
        this.eventBus.emit(GameEvent.CHARACTER_MET, value);
        break;

      case 'BURDEN_RELEASE': {
        const sm = ServiceLocator.get<StatsManager>(SERVICE_KEYS.STATS_MANAGER);
        sm.setBurdenZero();
        break;
      }

      case 'CHAPTER_ENTER':
        this.eventBus.emit(GameEvent.CHAPTER_ENTER, parseInt(value, 10));
        break;

      case 'MOOD':
      case 'CAMERA':
      case 'LIGHT':
      case 'MUSIC':
      case 'SFX':
      case 'WAIT':
      case 'TRANSITION':
      case 'EMOTE':
      case 'EMOTION':
      case 'TYPING':
      case 'TEXT_EFFECT':
      case 'PALETTE':
        this.narrativeTags.push(tag);
        break;

      case 'BGM':
        this.eventBus.emit(GameEvent.BGM_PLAY, value);
        break;

      case 'SHAKE':
        this.eventBus.emit(GameEvent.SCREEN_SHAKE, {
          intensity: parseFloat(value) || 2,
          duration: 300,
        });
        break;
    }
  }

  /** @deprecated Use getAllStates() + initFromSave() instead. */
  getState(): string | null {
    return this.story?.state.toJson() ?? null;
  }

  /** @deprecated Use initFromSave() instead. */
  loadState(state: string): void {
    this.story?.state.LoadJson(state);
  }

  hasChoices(): boolean {
    return (this.story?.currentChoices.length ?? 0) > 0;
  }

  getCurrentKnot(): string {
    if (!this.story) return '';
    try {
      return (this.story.state as unknown as { currentPathString: string }).currentPathString ?? '';
    } catch {
      return '';
    }
  }
}
