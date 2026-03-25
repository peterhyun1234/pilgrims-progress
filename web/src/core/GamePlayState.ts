import { MapObjectState } from '../save/SaveData';

/**
 * Shared runtime state for gameplay systems that needs to be persisted.
 * Registered as a service so SaveManager can collect it on save.
 */
export class GamePlayState {
  triggeredEvents: Set<string> = new Set();
  mapState: Record<string, MapObjectState> = {};

  setObjectState(objectId: string, patch: Partial<Omit<MapObjectState, 'objectId'>>): void {
    const existing = this.mapState[objectId] ?? {
      objectId,
      visible: true,
      open: false,
      activated: false,
    };
    this.mapState[objectId] = { ...existing, ...patch };
  }

  getObjectState(objectId: string): MapObjectState | null {
    return this.mapState[objectId] ?? null;
  }

  isEventTriggered(eventId: string): boolean {
    return this.triggeredEvents.has(eventId);
  }

  markEventTriggered(eventId: string): void {
    this.triggeredEvents.add(eventId);
  }
}
