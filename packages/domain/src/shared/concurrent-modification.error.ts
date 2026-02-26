export class ConcurrentModificationError extends Error {
  constructor(entityId: string) {
    super(`Concurrent modification detected for entity ${entityId}`);
    this.name = "ConcurrentModificationError";
  }
}
