export class Pool<T> {
  private pool: T[] = [];
  private factory: () => T;
  private reset: (item: T) => void;

  constructor(factory: () => T, reset: (item: T) => void, initialSize = 0) {
    this.factory = factory;
    this.reset = reset;

    for (let i = 0; i < initialSize; i++) {
      this.pool.push(factory());
    }
  }

  get(): T {
    if (this.pool.length > 0) {
      const item = this.pool.pop()!;
      this.reset(item);
      return item;
    }
    return this.factory();
  }

  release(item: T): void {
    this.pool.push(item);
  }

  get size(): number {
    return this.pool.length;
  }
}
