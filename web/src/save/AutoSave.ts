import { EventBus } from '../core/EventBus';
import { GameEvent } from '../core/GameEvents';
import { SaveManager } from './SaveManager';

export class AutoSave {
  private saveManager: SaveManager;
  private eventBus: EventBus;

  constructor(saveManager: SaveManager) {
    this.saveManager = saveManager;
    this.eventBus = EventBus.getInstance();
    this.setupListeners();
  }

  private setupListeners(): void {
    this.eventBus.on(GameEvent.CHAPTER_CHANGED, () => {
      this.performAutoSave();
    });

    this.eventBus.on(GameEvent.DIALOGUE_END, () => {
      this.performAutoSave();
    });
  }

  private async performAutoSave(): Promise<void> {
    try {
      await this.saveManager.autoSave();
      this.eventBus.emit(GameEvent.AUTO_SAVE);
    } catch {
      // Silent fail for auto-save
    }
  }
}
