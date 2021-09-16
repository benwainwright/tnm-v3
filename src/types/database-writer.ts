export interface DatabaseWriter<T extends { id: string }> {
  put(item: T, ...items: T[]): Promise<void>;
}
