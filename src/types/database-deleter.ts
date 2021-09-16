export interface DatabaseDeleter {
  remove(id: string, ...ids: string[]): Promise<void>;
}
