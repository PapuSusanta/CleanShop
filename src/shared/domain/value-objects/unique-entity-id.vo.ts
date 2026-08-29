// import { v7 as uuid } from 'uuid';

export class UniqueEntityId {
  private readonly _value: string;

  constructor(value?: string) {
    this._value = value ?? crypto.randomUUID();
  }

  get value(): string {
    return this._value;
  }

  equals(id: UniqueEntityId): boolean {
    if (id === null || id === undefined) {
      return false;
    }
    if (!(id instanceof UniqueEntityId)) {
      return false;
    }
    return id.value === this._value;
  }

  toString(): string {
    return this._value;
  }
}
