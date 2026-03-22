import { InkService } from './InkService';
import { EventBus } from '../core/EventBus';
import { GameEvent, DialogueLinePayload, DialogueChoicePayload } from '../core/GameEvents';
import { NarrativeDirector } from './NarrativeDirector';

export class DialogueManager {
  private inkService: InkService;
  private eventBus: EventBus;
  private isActive = false;
  private currentSpeaker = '';
  private narrativeDirector: NarrativeDirector | null = null;

  constructor(inkService: InkService, eventBus: EventBus) {
    this.inkService = inkService;
    this.eventBus = eventBus;

    this.eventBus.on(GameEvent.DIALOGUE_CHOICE_SELECTED, (index: number) => {
      if (!this.isActive) return;
      if (index >= 0) {
        this.inkService.choose(index);
      }
      this.advance();
    });
  }

  setNarrativeDirector(director: NarrativeDirector): void {
    this.narrativeDirector = director;
  }

  start(npcId?: string): void {
    this.isActive = true;
    this.currentSpeaker = npcId ?? '';
    this.eventBus.emit(GameEvent.DIALOGUE_START, npcId);
    this.advance();
  }

  private advance(): void {
    if (!this.isActive) return;

    if (this.inkService.canContinue()) {
      const result = this.inkService.continue();
      if (!result) return;

      let speaker = this.currentSpeaker;
      let emotion = 'neutral';
      const narrativeTags: string[] = [];

      for (const tag of result.tags) {
        const parts = tag.trim().split(':').map(s => s.trim());
        const cmd = parts[0];
        const val = parts.slice(1).join(':').trim();

        if (cmd === 'SPEAKER') {
          speaker = val;
        } else if (cmd === 'EMOTION') {
          if (val.includes(' ')) {
            emotion = val.split(' ')[1];
          } else {
            emotion = val;
          }
        } else if (['MOOD', 'CAMERA', 'LIGHT', 'MUSIC', 'SFX', 'WAIT',
          'TRANSITION', 'EMOTE', 'TYPING', 'TEXT_EFFECT', 'PALETTE'].includes(cmd)) {
          narrativeTags.push(tag);
        }
      }

      if (this.narrativeDirector) {
        narrativeTags.forEach(t => this.narrativeDirector!.applyTag(t));
      }

      if (result.text) {
        const payload: DialogueLinePayload = {
          text: result.text,
          speaker,
          emotion,
          tags: result.tags,
        };
        this.eventBus.emit(GameEvent.DIALOGUE_LINE, payload);
      } else {
        this.advance();
      }
    } else if (this.inkService.hasChoices()) {
      const choices = this.inkService.getChoices();
      const payload: DialogueChoicePayload = {
        choices: choices.map(c => ({
          text: c.text,
          index: c.index,
          isHidden: c.isHidden,
          requiredStat: c.requiredStat,
          requiredValue: c.requiredValue,
        })),
      };
      this.eventBus.emit(GameEvent.DIALOGUE_CHOICE, payload);
    } else {
      this.isActive = false;
      this.eventBus.emit(GameEvent.DIALOGUE_END);
    }
  }

  isDialogueActive(): boolean {
    return this.isActive;
  }
}
