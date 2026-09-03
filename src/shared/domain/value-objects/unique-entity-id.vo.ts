import { DomainException } from '../exceptions/domain.exception';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Identity value object shared by every entity. Generating a new id and
 * rebuilding an existing one are different operations, so they get different
 * factories instead of one optional constructor argument.
 */
export class UniqueEntityId {
  private readonly _value: string;

  protected constructor(value: string) {
    if (!UUID_PATTERN.test(value)) {
      throw new DomainException(`'${value}' is not a valid identifier`);
    }
    this._value = value.toLowerCase();
  }

  protected static generateValue(): string {
    return crypto.randomUUID();
  }

  get value(): string {
    return this._value;
  }

  equals(other?: UniqueEntityId | null): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    if (!(other instanceof UniqueEntityId)) {
      return false;
    }
    return other.value === this._value;
  }

  toString(): string {
    return this._value;
  }
}
