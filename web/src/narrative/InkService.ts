import { Story } from 'inkjs';
import { EventBus } from '../core/EventBus';
import { GameEvent, StatType } from '../core/GameEvents';
import { ServiceLocator, SERVICE_KEYS } from '../core/ServiceLocator';
import { StatsManager } from '../core/StatsManager';

export interface InkTag {
  key: string;
  value: string;
}

export class InkService {
  private story: Story | null = null;
  private eventBus: EventBus;

  constructor() {
    this.eventBus = EventBus.getInstance();
  }

  loadStory(jsonData: Record<string, unknown>): void {
    this.story = new Story(jsonData as Record<string, never>);
    this.syncStatsToInk();
  }

  canContinue(): boolean {
    return this.story?.canContinue ?? false;
  }

  continue(): { text: string; tags: InkTag[] } {
    if (!this.story || !this.story.canContinue) {
      return { text: '', tags: [] };
    }

    const text = this.story.Continue() ?? '';
    const rawTags = this.story.currentTags ?? [];
    const tags = this.parseTags(rawTags);

    this.processTags(tags);

    return { text: text.trim(), tags };
  }

  getChoices(): { text: string; index: number }[] {
    if (!this.story) return [];
    return this.story.currentChoices.map((choice, index) => ({
      text: choice.text,
      index,
    }));
  }

  chooseChoice(index: number): void {
    this.story?.ChooseChoiceIndex(index);
  }

  goToKnot(knotName: string): void {
    if (this.story) {
      this.story.ChoosePathString(knotName);
    }
  }

  getVariable(name: string): unknown {
    return this.story?.variablesState?.[name];
  }

  setVariable(name: string, value: unknown): void {
    if (this.story?.variablesState) {
      this.story.variablesState[name] = value;
    }
  }

  getState(): string {
    return this.story?.state.toJson() ?? '';
  }

  loadState(stateJson: string): void {
    this.story?.state.LoadJson(stateJson);
  }

  private parseTags(rawTags: string[]): InkTag[] {
    return rawTags.map((tag) => {
      const colonIndex = tag.indexOf(':');
      if (colonIndex >= 0) {
        return {
          key: tag.substring(0, colonIndex).trim().toUpperCase(),
          value: tag.substring(colonIndex + 1).trim(),
        };
      }
      return { key: tag.trim().toUpperCase(), value: '' };
    });
  }

  private processTags(tags: InkTag[]): void {
    for (const tag of tags) {
      switch (tag.key) {
        case 'STAT': {
          this.processStatTag(tag.value);
          break;
        }
        case 'BIBLE_CARD': {
          this.eventBus.emit(GameEvent.BIBLE_CARD_COLLECTED, tag.value);
          break;
        }
        case 'BGM': {
          this.eventBus.emit(GameEvent.BGM_PLAY, tag.value);
          break;
        }
        case 'SFX': {
          this.eventBus.emit(GameEvent.SFX_PLAY, tag.value);
          break;
        }
        case 'SHAKE': {
          this.eventBus.emit(GameEvent.SCREEN_SHAKE);
          break;
        }
        case 'TRANSITION': {
          this.eventBus.emit(GameEvent.SCREEN_FADE, tag.value);
          break;
        }
      }
    }
  }

  private processStatTag(value: string): void {
    const match = value.match(/^(\w+)\s*([+-])\s*(\d+)$/);
    if (!match) return;

    const stat = match[1].toLowerCase() as StatType;
    const sign = match[2] === '+' ? 1 : -1;
    const amount = parseInt(match[3], 10) * sign;

    const statsManager = ServiceLocator.get<StatsManager>(SERVICE_KEYS.STATS_MANAGER);
    statsManager.change(stat, amount);
  }

  private syncStatsToInk(): void {
    if (!this.story) return;

    const statsManager = ServiceLocator.get<StatsManager>(SERVICE_KEYS.STATS_MANAGER);
    const stats = statsManager.getAll();

    for (const [key, value] of Object.entries(stats)) {
      try {
        this.setVariable(key, value);
      } catch {
        // Variable may not exist in ink story
      }
    }
  }
}
