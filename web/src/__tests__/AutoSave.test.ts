import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AutoSave } from '../save/AutoSave';
import { EventBus } from '../core/EventBus';
import { GameEvent } from '../core/GameEvents';

let eventBus: EventBus;
let saveSpy: ReturnType<typeof vi.fn>;
let saveManager: { save: typeof saveSpy };

beforeEach(() => {
  vi.useFakeTimers();
  EventBus.getInstance().clear();
  eventBus = EventBus.getInstance();
  saveSpy = vi.fn(() => Promise.resolve());
  saveManager = { save: saveSpy };
});

afterEach(() => {
  vi.useRealTimers();
});

describe('AutoSave', () => {
  it('saves 500ms after CHAPTER_CHANGED fires', () => {
    new AutoSave(eventBus, saveManager as never);
    eventBus.emit(GameEvent.CHAPTER_CHANGED, { chapter: 2 });
    expect(saveSpy).not.toHaveBeenCalled();
    vi.advanceTimersByTime(499);
    expect(saveSpy).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(saveSpy).toHaveBeenCalledTimes(1);
  });

  it('saves 500ms after DIALOGUE_END fires', () => {
    new AutoSave(eventBus, saveManager as never);
    eventBus.emit(GameEvent.DIALOGUE_END);
    vi.advanceTimersByTime(500);
    expect(saveSpy).toHaveBeenCalledTimes(1);
  });

  it('debounces multiple events into a single save', () => {
    new AutoSave(eventBus, saveManager as never);
    eventBus.emit(GameEvent.DIALOGUE_END);
    vi.advanceTimersByTime(200);
    eventBus.emit(GameEvent.DIALOGUE_END);
    vi.advanceTimersByTime(200);
    eventBus.emit(GameEvent.CHAPTER_CHANGED, { chapter: 3 });
    vi.advanceTimersByTime(200);
    expect(saveSpy).not.toHaveBeenCalled();
    // Final wait for the last debounce window to settle
    vi.advanceTimersByTime(300);
    expect(saveSpy).toHaveBeenCalledTimes(1);
  });

  it('emits AUTO_SAVE event after the save fires', () => {
    new AutoSave(eventBus, saveManager as never);
    const autoSaveHandler = vi.fn();
    eventBus.on(GameEvent.AUTO_SAVE, autoSaveHandler);
    eventBus.emit(GameEvent.DIALOGUE_END);
    vi.advanceTimersByTime(500);
    expect(autoSaveHandler).toHaveBeenCalledTimes(1);
  });

  it('destroy cancels the pending debounce so save does not fire', () => {
    const auto = new AutoSave(eventBus, saveManager as never);
    eventBus.emit(GameEvent.DIALOGUE_END);
    auto.destroy();
    vi.advanceTimersByTime(1000);
    expect(saveSpy).not.toHaveBeenCalled();
  });

  it('destroy unsubscribes — events fired after destroy do not schedule a save', () => {
    const auto = new AutoSave(eventBus, saveManager as never);
    auto.destroy();
    eventBus.emit(GameEvent.DIALOGUE_END);
    vi.advanceTimersByTime(1000);
    expect(saveSpy).not.toHaveBeenCalled();
  });
});
