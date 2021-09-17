export interface DatabaseWriter<T extends { id: string }> {
  put(...items: T[]): Promise<void>;
}
