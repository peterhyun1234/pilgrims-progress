export class ServiceLocator {
  private static services: Map<string, unknown> = new Map();

  static register<T>(key: string, service: T): void {
    ServiceLocator.services.set(key, service);
  }

  static get<T>(key: string): T {
    const service = ServiceLocator.services.get(key);
    if (!service) {
      throw new Error(`Service not found: ${key}`);
    }
    return service as T;
  }

  static has(key: string): boolean {
    return ServiceLocator.services.has(key);
  }

  static clear(): void {
    ServiceLocator.services.clear();
  }
}

export const SERVICE_KEYS = {
  EVENT_BUS: 'EventBus',
  GAME_MANAGER: 'GameManager',
  AUDIO_MANAGER: 'AudioManager',
  SAVE_MANAGER: 'SaveManager',
  INK_SERVICE: 'InkService',
  DIALOGUE_MANAGER: 'DialogueManager',
  I18N: 'I18n',
  INPUT_MANAGER: 'InputManager',
  STATS_MANAGER: 'StatsManager',
  ITEM_SYSTEM: 'ItemSystem',
  COMBAT_SYSTEM: 'CombatSystem',
  RESPONSIVE_MANAGER: 'ResponsiveManager',
} as const;
