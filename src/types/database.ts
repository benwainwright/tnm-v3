export interface Database<T extends { id: string }> {
  put(item: T): Promise<void>;
  putAll(item: T[]): Promise<void>;
  getById(id: string): Promise<T | undefined>;
  getAll(): Promise<T[]>;
  remove(id: string): Promise<void>;
  removeAll(ids: string[]): Promise<void>;
}
