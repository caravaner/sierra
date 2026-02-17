import { ValueObject } from "../shared/value-object.base";

export class Money extends ValueObject<number> {
  static create(amount: number): Money {
    if (amount < 0) throw new Error("Price cannot be negative");
    return new Money(Math.round(amount * 100) / 100);
  }
}

export class SKU extends ValueObject<string> {
  static create(sku: string): SKU {
    if (!sku || sku.trim().length === 0) {
      throw new Error("SKU cannot be empty");
    }
    return new SKU(sku.trim().toUpperCase());
  }
}
