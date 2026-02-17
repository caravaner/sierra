export abstract class Entity<T> {
  constructor(
    public readonly id: string,
    protected props: T,
  ) {}

  public equals(other: Entity<T>): boolean {
    if (other === null || other === undefined) return false;
    if (this === other) return true;
    return this.id === other.id;
  }
}
