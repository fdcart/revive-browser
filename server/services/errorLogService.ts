import { v4 as uuidv4 } from 'uuid';

type ErrorLog = {
  id: string;
  at: string;
  scope: string;
  message: string;
  details?: string;
};

class ErrorLogStore {
  private readonly items = new Map<string, ErrorLog>();

  add(scope: string, error: unknown): ErrorLog {
    const message = error instanceof Error ? error.message : String(error);
    const details = error instanceof Error ? error.stack : undefined;
    const item: ErrorLog = {
      id: uuidv4(),
      at: new Date().toISOString(),
      scope,
      message,
      details
    };
    this.items.set(item.id, item);
    if (this.items.size > 500) {
      const firstKey = this.items.keys().next().value;
      if (firstKey) {
        this.items.delete(firstKey);
      }
    }
    return item;
  }

  get(id: string): ErrorLog | null {
    return this.items.get(id) || null;
  }
}

export const errorLogStore = new ErrorLogStore();
