import { DomainException } from '../../../shared/domain/exceptions/domain.exception';

const MAX_LENGTH = 100;

/**
 * First and last name belong together — they are validated, compared and
 * changed as one value.
 */
export class PersonName {
  private constructor(
    private readonly _firstName: string,
    private readonly _lastName: string,
  ) {}

  static create(firstName: string, lastName: string): PersonName {
    const first = PersonName.normalize(firstName, 'First name');
    const last = PersonName.normalize(lastName, 'Last name');

    return new PersonName(first, last);
  }

  get firstName(): string {
    return this._firstName;
  }

  get lastName(): string {
    return this._lastName;
  }

  get fullName(): string {
    return `${this._firstName} ${this._lastName}`;
  }

  equals(other?: PersonName | null): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    if (!(other instanceof PersonName)) {
      return false;
    }
    return (
      other.firstName === this._firstName && other.lastName === this._lastName
    );
  }

  toString(): string {
    return this.fullName;
  }

  private static normalize(value: string, label: string): string {
    const normalized = value?.trim() ?? '';

    if (normalized.length === 0) {
      throw new DomainException(`${label} cannot be empty`);
    }
    if (normalized.length > MAX_LENGTH) {
      throw new DomainException(
        `${label} cannot be longer than ${MAX_LENGTH} characters`,
      );
    }

    return normalized;
  }
}
