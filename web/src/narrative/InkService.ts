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

  constructor(_scene: Phaser.Scene) {
    this.eventBus = EventBus.getInstance();
  }

  loadStory(jsonData: Record<string, never>): void {
    this.story = new Story(jsonData as Record<string, never>);
    this.bindExternalFunctions();
  }

  private bindExternalFunctions(): void {
    if (!this.story) return;

    this.story.BindExternalFunction('getStat', (stat: string): number => {
      const sm = ServiceLocator.get<StatsManager>(SERVICE_KEYS.STATS_MANAGER);
      return sm.get(stat as StatType);
    });

    this.story.BindExternalFunction('hasMet', (_char: string): boolean => {
      return true;
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

        if (currentVal >= requiredValue) {
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
        const match = value.match(/(\w+)\s*([\+\-])\s*(\d+)/);
        if (match) {
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

  getState(): string | null {
    return this.story?.state.toJson() ?? null;
  }

  loadState(state: string): void {
    this.story?.state.LoadJson(state);
  }

  hasChoices(): boolean {
    return (this.story?.currentChoices.length ?? 0) > 0;
  }
}
