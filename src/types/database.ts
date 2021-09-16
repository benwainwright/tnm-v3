export interface Database<T extends { id: string }> {
  put(...item: T[]): Promise<void>;
  get(...id: string[]): Promise<T[] | T>;
  remove(...id: string[]): Promise<void>;
}
