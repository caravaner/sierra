export abstract class ValueObject<T> {
  constructor(public readonly value: T) {}

  public equals(other: ValueObject<T>): boolean {
    if (other === null || other === undefined) return false;
    return JSON.stringify(this.value) === JSON.stringify(other.value);
  }
}
