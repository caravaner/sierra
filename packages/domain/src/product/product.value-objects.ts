import {ValueObject} from "../shared/value-object.base";

export interface MoneyProps {
    value: string;
    currency: string;
}

export class Money extends ValueObject<MoneyProps> {
    static create(amount: number | string, currency = "NGN"): Money {
        const numeric = typeof amount === "string" ? parseFloat(amount) : amount;
        if (numeric < 0) throw new Error("Price cannot be negative");
        return new Money({ value: numeric.toFixed(2), currency });
    }

    get amount(): string {
        return this.value.value;
    }

    get currency(): string {
        return this.value.currency;
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
