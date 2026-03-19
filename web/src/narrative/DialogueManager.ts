import { InkService, InkTag } from './InkService';
import { EventBus } from '../core/EventBus';
import { GameEvent, GameState, DialogueLinePayload, DialogueChoicePayload } from '../core/GameEvents';
import { ServiceLocator, SERVICE_KEYS } from '../core/ServiceLocator';
import { GameManager } from '../core/GameManager';

export class DialogueManager {
  private inkService: InkService;
  private eventBus: EventBus;
  private currentSpeaker = '';
  private isActive = false;

  constructor(inkService: InkService) {
    this.inkService = inkService;
    this.eventBus = EventBus.getInstance();
  }

  startDialogue(knotName?: string): void {
    if (this.isActive) return;

    const gm = ServiceLocator.get<GameManager>(SERVICE_KEYS.GAME_MANAGER);
    gm.changeState(GameState.DIALOGUE);

    this.isActive = true;

    if (knotName) {
      this.inkService.goToKnot(knotName);
    }

    this.eventBus.emit(GameEvent.DIALOGUE_START);
    this.advanceDialogue();
  }

  advanceDialogue(): void {
    if (!this.isActive) return;

    if (this.inkService.canContinue()) {
      const result = this.inkService.continue();
      const speaker = this.extractSpeaker(result.tags);
      if (speaker) this.currentSpeaker = speaker;

      if (result.text) {
        const payload: DialogueLinePayload = {
          text: result.text,
          speaker: this.currentSpeaker || undefined,
          tags: result.tags.map((t) => `${t.key}: ${t.value}`),
        };
        this.eventBus.emit(GameEvent.DIALOGUE_LINE, payload);
      } else {
        this.advanceDialogue();
      }
    } else {
      const choices = this.inkService.getChoices();
      if (choices.length > 0) {
        const payload: DialogueChoicePayload = {
          choices: choices.map((c) => ({
            text: c.text,
            index: c.index,
          })),
        };
        this.eventBus.emit(GameEvent.DIALOGUE_CHOICE, payload);
      } else {
        this.endDialogue();
      }
    }
  }

  selectChoice(index: number): void {
    this.inkService.chooseChoice(index);
    this.eventBus.emit(GameEvent.DIALOGUE_CHOICE_SELECTED, index);
    this.advanceDialogue();
  }

  endDialogue(): void {
    this.isActive = false;
    this.currentSpeaker = '';

    const gm = ServiceLocator.get<GameManager>(SERVICE_KEYS.GAME_MANAGER);
    gm.changeState(GameState.GAME);

    this.eventBus.emit(GameEvent.DIALOGUE_END);
  }

  get active(): boolean {
    return this.isActive;
  }

  private extractSpeaker(tags: InkTag[]): string | null {
    const speakerTag = tags.find((t) => t.key === 'SPEAKER');
    return speakerTag?.value ?? null;
  }
}
