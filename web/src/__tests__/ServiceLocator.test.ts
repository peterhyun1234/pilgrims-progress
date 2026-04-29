import { describe, it, expect, beforeEach } from 'vitest';
import { ServiceLocator, SERVICE_KEYS } from '../core/ServiceLocator';

beforeEach(() => {
  ServiceLocator.clear();
});

describe('ServiceLocator', () => {
  it('register stores a service that can be retrieved by the same key', () => {
    const obj = { foo: 'bar' };
    ServiceLocator.register('test_key', obj);
    expect(ServiceLocator.get('test_key')).toBe(obj);
  });

  it('get throws when the service is not registered', () => {
    expect(() => ServiceLocator.get('missing')).toThrow(/Service not found: missing/);
  });

  it('has returns false before register, true after, false after clear', () => {
    expect(ServiceLocator.has('k')).toBe(false);
    ServiceLocator.register('k', 1);
    expect(ServiceLocator.has('k')).toBe(true);
    ServiceLocator.clear();
    expect(ServiceLocator.has('k')).toBe(false);
  });

  it('register overwrites a previous value for the same key', () => {
    ServiceLocator.register('k', 'first');
    ServiceLocator.register('k', 'second');
    expect(ServiceLocator.get('k')).toBe('second');
  });

  it('SERVICE_KEYS exposes stable string constants', () => {
    expect(SERVICE_KEYS.GAME_MANAGER).toBe('GameManager');
    expect(SERVICE_KEYS.EVENT_BUS).toBe('EventBus');
    expect(SERVICE_KEYS.SAVE_MANAGER).toBe('SaveManager');
    // The new keys we added during the world refactor must remain present so
    // downstream code that imports them keeps working.
    expect(SERVICE_KEYS.WORLD_RENDERER).toBe('WorldRenderer');
    expect(SERVICE_KEYS.WORLD_CAMERA).toBe('WorldCamera');
  });

  it('SERVICE_KEYS values are unique (no two keys map to same string)', () => {
    const values = Object.values(SERVICE_KEYS);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });

  it('clear empties all services', () => {
    ServiceLocator.register('a', 1);
    ServiceLocator.register('b', 2);
    ServiceLocator.clear();
    expect(ServiceLocator.has('a')).toBe(false);
    expect(ServiceLocator.has('b')).toBe(false);
  });
});
