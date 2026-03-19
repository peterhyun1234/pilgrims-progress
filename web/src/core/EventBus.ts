type Listener<T = unknown> = (data: T) => void;

export class EventBus {
  private static instance: EventBus;
  private listeners: Map<string, Set<Listener>> = new Map();

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  on<T = unknown>(event: string, listener: Listener<T>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener as Listener);
  }

  off<T = unknown>(event: string, listener: Listener<T>): void {
    this.listeners.get(event)?.delete(listener as Listener);
  }

  once<T = unknown>(event: string, listener: Listener<T>): void {
    const wrapper: Listener<T> = (data: T) => {
      listener(data);
      this.off(event, wrapper);
    };
    this.on(event, wrapper);
  }

  emit<T = unknown>(event: string, data?: T): void {
    this.listeners.get(event)?.forEach((listener) => {
      (listener as Listener<T>)(data as T);
    });
  }

  clear(event?: string): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}
