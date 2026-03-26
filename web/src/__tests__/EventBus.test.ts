import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventBus } from '../core/EventBus';

describe('EventBus', () => {
  let bus: EventBus;

  beforeEach(() => {
    bus = new EventBus();
  });

  it('calls listener on emit', () => {
    const handler = vi.fn();
    bus.on('test', handler);
    bus.emit('test', { value: 42 });
    expect(handler).toHaveBeenCalledWith({ value: 42 });
  });

  it('supports multiple listeners', () => {
    const h1 = vi.fn();
    const h2 = vi.fn();
    bus.on('test', h1);
    bus.on('test', h2);
    bus.emit('test');
    expect(h1).toHaveBeenCalled();
    expect(h2).toHaveBeenCalled();
  });

  it('removes listener with off()', () => {
    const handler = vi.fn();
    bus.on('test', handler);
    bus.off('test', handler);
    bus.emit('test');
    expect(handler).not.toHaveBeenCalled();
  });

  it('once() fires only once', () => {
    const handler = vi.fn();
    bus.once('test', handler);
    bus.emit('test');
    bus.emit('test');
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('clear() removes all listeners for an event', () => {
    const handler = vi.fn();
    bus.on('test', handler);
    bus.clear('test');
    bus.emit('test');
    expect(handler).not.toHaveBeenCalled();
  });

  it('clear() without args removes all listeners', () => {
    const h1 = vi.fn();
    const h2 = vi.fn();
    bus.on('a', h1);
    bus.on('b', h2);
    bus.clear();
    bus.emit('a');
    bus.emit('b');
    expect(h1).not.toHaveBeenCalled();
    expect(h2).not.toHaveBeenCalled();
  });

  it('does not throw when emitting event with no listeners', () => {
    expect(() => bus.emit('nonexistent')).not.toThrow();
  });

  it('does not throw when removing non-existent listener', () => {
    const handler = vi.fn();
    expect(() => bus.off('nonexistent', handler)).not.toThrow();
  });
});
