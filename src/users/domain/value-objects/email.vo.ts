import { DomainException } from '../../../shared/domain/exceptions/domain.exception';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]{2,}$/;
const MAX_LENGTH = 255;

/**
 * An email address is a value, not a string: it is normalised once, validated
 * once, and every comparison after that is case insensitive by construction.
 */
export class Email {
  private constructor(private readonly _value: string) {}

  static create(value: string): Email {
    const normalized = value?.trim().toLowerCase() ?? '';

    if (normalized.length === 0) {
      throw new DomainException('Email cannot be empty');
    }
    if (normalized.length > MAX_LENGTH) {
      throw new DomainException(
        `Email cannot be longer than ${MAX_LENGTH} characters`,
      );
    }
    if (!EMAIL_PATTERN.test(normalized)) {
      throw new DomainException(`'${value}' is not a valid email address`);
    }

    return new Email(normalized);
  }

  get value(): string {
    return this._value;
  }

  equals(other?: Email | null): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    if (!(other instanceof Email)) {
      return false;
    }
    return other.value === this._value;
  }

  toString(): string {
    return this._value;
  }
}
