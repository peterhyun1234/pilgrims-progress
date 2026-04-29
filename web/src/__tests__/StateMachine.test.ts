import { describe, it, expect, vi } from 'vitest';
import { StateMachine } from '../core/StateMachine';

type GameState = 'menu' | 'play' | 'pause' | 'gameover';

describe('StateMachine', () => {
  it('starts with no current state', () => {
    const sm = new StateMachine<GameState>();
    expect(sm.current).toBeNull();
    expect(sm.previous).toBeNull();
  });

  it('addState returns the machine for chaining', () => {
    const sm = new StateMachine<GameState>();
    const result = sm.addState({ id: 'menu' });
    expect(result).toBe(sm);
  });

  it('setState transitions and runs onEnter', () => {
    const onEnter = vi.fn();
    const sm = new StateMachine<GameState>();
    sm.addState({ id: 'menu', onEnter });
    sm.setState('menu');
    expect(sm.current).toBe('menu');
    expect(onEnter).toHaveBeenCalledTimes(1);
  });

  it('setState runs onExit on the outgoing state', () => {
    const onExit = vi.fn();
    const sm = new StateMachine<GameState>();
    sm.addState({ id: 'menu', onExit });
    sm.addState({ id: 'play' });
    sm.setState('menu');
    sm.setState('play');
    expect(onExit).toHaveBeenCalledTimes(1);
    expect(sm.current).toBe('play');
  });

  it('setState records previous state', () => {
    const sm = new StateMachine<GameState>();
    sm.addState({ id: 'menu' });
    sm.addState({ id: 'play' });
    sm.setState('menu');
    sm.setState('play');
    expect(sm.previous).toBe('menu');
    expect(sm.current).toBe('play');
  });

  it('setState to the same state is a no-op (no onEnter/onExit refire)', () => {
    const onEnter = vi.fn();
    const onExit = vi.fn();
    const sm = new StateMachine<GameState>();
    sm.addState({ id: 'menu', onEnter, onExit });
    sm.setState('menu');
    sm.setState('menu');
    expect(onEnter).toHaveBeenCalledTimes(1);
    expect(onExit).not.toHaveBeenCalled();
  });

  it('setState to an unknown state is a no-op', () => {
    const sm = new StateMachine<GameState>();
    sm.addState({ id: 'menu' });
    sm.setState('menu');
    sm.setState('play');  // never registered
    expect(sm.current).toBe('menu');  // unchanged
  });

  it('update calls onUpdate of current state with delta', () => {
    const onUpdate = vi.fn();
    const sm = new StateMachine<GameState>();
    sm.addState({ id: 'play', onUpdate });
    sm.setState('play');
    sm.update(16.7);
    expect(onUpdate).toHaveBeenCalledWith(16.7);
  });

  it('update is safe with no current state', () => {
    const sm = new StateMachine<GameState>();
    expect(() => sm.update(16)).not.toThrow();
  });

  it('isState returns true only for the current id', () => {
    const sm = new StateMachine<GameState>();
    sm.addState({ id: 'menu' });
    sm.addState({ id: 'play' });
    sm.setState('menu');
    expect(sm.isState('menu')).toBe(true);
    expect(sm.isState('play')).toBe(false);
  });

  it('isState is false when no state is set', () => {
    const sm = new StateMachine<GameState>();
    expect(sm.isState('menu')).toBe(false);
  });
});
