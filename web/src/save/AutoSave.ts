import { EventBus } from '../core/EventBus';
import { GameEvent } from '../core/GameEvents';
import { SaveManager } from './SaveManager';

export class AutoSave {
  private eventBus: EventBus;
  private saveManager: SaveManager;
  private saveDebounce: ReturnType<typeof setTimeout> | null = null;

  private onChapterChanged = () => { this.debouncedSave(); };
  private onDialogueEnd = () => { this.debouncedSave(); };

  constructor(eventBus: EventBus, saveManager: SaveManager) {
    this.eventBus = eventBus;
    this.saveManager = saveManager;

    this.eventBus.on(GameEvent.CHAPTER_CHANGED, this.onChapterChanged);
    this.eventBus.on(GameEvent.DIALOGUE_END, this.onDialogueEnd);
  }

  private debouncedSave(): void {
    if (this.saveDebounce) clearTimeout(this.saveDebounce);
    this.saveDebounce = setTimeout(() => {
      this.saveManager.save();
      this.saveDebounce = null;
    }, 500);
  }

  destroy(): void {
    this.eventBus.off(GameEvent.CHAPTER_CHANGED, this.onChapterChanged);
    this.eventBus.off(GameEvent.DIALOGUE_END, this.onDialogueEnd);
    if (this.saveDebounce) clearTimeout(this.saveDebounce);
  }
}
