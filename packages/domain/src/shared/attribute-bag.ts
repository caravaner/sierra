export type AttributeType =
  | string
  | number
  | boolean
  | Date
  | Record<string, unknown>;

export interface Mapper<T> {
  toJson(value: T): unknown;
  fromJson(raw: unknown): T;
}

export class Attribute<T extends AttributeType> {
  constructor(
    public readonly name: string,
    public readonly mapper?: Mapper<T>,
  ) {}
}

export class AttributeBag {
  private readonly data: ReadonlyMap<string, unknown>;

  constructor(raw: Record<string, unknown> = {}) {
    this.data = new Map(Object.entries(raw));
  }

  with<T extends AttributeType>(attr: Attribute<T>, value: T): AttributeBag {
    const mapped = attr.mapper ? attr.mapper.toJson(value) : value;
    const entries = new Map(this.data);
    entries.set(attr.name, mapped);
    return new AttributeBag(Object.fromEntries(entries));
  }

  without(attr: Attribute<AttributeType>): AttributeBag {
    const entries = new Map(this.data);
    entries.delete(attr.name);
    return new AttributeBag(Object.fromEntries(entries));
  }

  get<T extends AttributeType>(attr: Attribute<T>): T | undefined {
    const raw = this.data.get(attr.name);
    if (raw === undefined) return undefined;
    return attr.mapper ? attr.mapper.fromJson(raw) : (raw as T);
  }

  has(attr: Attribute<AttributeType>): boolean {
    return this.data.has(attr.name);
  }

  merge(other: AttributeBag, override = true): AttributeBag {
    const entries = new Map(this.data);
    for (const [key, value] of other.data) {
      if (override || !entries.has(key)) {
        entries.set(key, value);
      }
    }
    return new AttributeBag(Object.fromEntries(entries));
  }

  toJSON(): { [key: string]: string | number | boolean | null | object } {
    return Object.fromEntries(this.data) as { [key: string]: string | number | boolean | null | object };
  }

  static empty(): AttributeBag {
    return new AttributeBag();
  }
}

export function attribute<T extends AttributeType>(
  name: string,
  mapper?: Mapper<T>,
): Attribute<T> {
  return new Attribute(name, mapper);
}
