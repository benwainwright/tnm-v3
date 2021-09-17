export interface DatabaseDeleter {
  remove(...ids: string[]): Promise<void>;
}
