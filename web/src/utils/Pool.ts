export class Pool<T> {
  private items: T[] = [];
  private factory: () => T;
  private reset: (item: T) => void;

  constructor(factory: () => T, reset: (item: T) => void, initialSize = 0) {
    this.factory = factory;
    this.reset = reset;

    for (let i = 0; i < initialSize; i++) {
      this.items.push(this.factory());
    }
  }

  get(): T {
    if (this.items.length > 0) {
      const item = this.items.pop()!;
      this.reset(item);
      return item;
    }
    return this.factory();
  }

  release(item: T): void {
    this.items.push(item);
  }

  get size(): number {
    return this.items.length;
  }
}
