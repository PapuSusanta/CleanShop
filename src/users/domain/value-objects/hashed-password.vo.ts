import { DomainException } from '../../../shared/domain/exceptions/domain.exception';

/**
 * The domain never handles a plain text password: hashing is an infrastructure
 * concern (see PasswordHasherPort), and this value object is the only shape a
 * password is allowed to take once it reaches an aggregate.
 */
export class HashedPassword {
  private constructor(private readonly _value: string) {}

  static fromHash(hash: string): HashedPassword {
    const value = hash?.trim() ?? '';

    if (value.length === 0) {
      throw new DomainException('Password hash cannot be empty');
    }

    return new HashedPassword(value);
  }

  get value(): string {
    return this._value;
  }

  equals(other?: HashedPassword | null): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    if (!(other instanceof HashedPassword)) {
      return false;
    }
    return other.value === this._value;
  }

  /** Guards against a hash ending up in a log line or an API response. */
  toString(): string {
    return '[REDACTED]';
  }

  toJSON(): string {
    return '[REDACTED]';
  }
}
