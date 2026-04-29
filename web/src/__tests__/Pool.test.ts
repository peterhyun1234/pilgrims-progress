import { describe, it, expect, vi } from 'vitest';
import { Pool } from '../utils/Pool';

describe('Pool', () => {
  it('starts empty when initialSize is 0', () => {
    const pool = new Pool(() => ({}), () => undefined);
    expect(pool.size).toBe(0);
  });

  it('preallocates items when initialSize > 0', () => {
    let factoryCalls = 0;
    const pool = new Pool(() => ({ id: ++factoryCalls }), () => undefined, 5);
    expect(pool.size).toBe(5);
    expect(factoryCalls).toBe(5);
  });

  it('get() reuses pooled items in LIFO order and resets each one', () => {
    const reset = vi.fn();
    const pool = new Pool(() => ({ used: false }), reset);
    const a = { used: true };
    const b = { used: true };
    pool.release(a);
    pool.release(b);
    expect(pool.size).toBe(2);
    expect(pool.get()).toBe(b); // LIFO
    expect(pool.get()).toBe(a);
    expect(pool.size).toBe(0);
    expect(reset).toHaveBeenCalledTimes(2);
  });

  it('get() creates new items via factory when pool is empty', () => {
    const factory = vi.fn(() => ({}));
    const pool = new Pool(factory, () => undefined);
    const item = pool.get();
    expect(item).toBeDefined();
    expect(factory).toHaveBeenCalledTimes(1);
    expect(pool.size).toBe(0);
  });

  it('does NOT reset newly-created items (factory output assumed clean)', () => {
    const reset = vi.fn();
    const pool = new Pool(() => ({}), reset);
    pool.get();
    expect(reset).not.toHaveBeenCalled();
  });

  it('release adds an item to the pool', () => {
    const pool = new Pool(() => ({}), () => undefined);
    pool.release({});
    expect(pool.size).toBe(1);
  });
});
