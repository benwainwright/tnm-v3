export interface DatabaseReader<T extends { id: string }> {
  get(...ids: string[]): Promise<T[]>;
}
