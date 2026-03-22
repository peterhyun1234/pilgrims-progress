import { EventBus } from '../core/EventBus';
import { GameEvent } from '../core/GameEvents';
import { SaveManager } from './SaveManager';

export class AutoSave {
  private eventBus: EventBus;
  private saveManager: SaveManager;

  constructor(eventBus: EventBus, saveManager: SaveManager) {
    this.eventBus = eventBus;
    this.saveManager = saveManager;

    this.eventBus.on(GameEvent.CHAPTER_CHANGED, () => {
      this.saveManager.save();
    });

    this.eventBus.on(GameEvent.DIALOGUE_END, () => {
      this.saveManager.save();
    });
  }
}
