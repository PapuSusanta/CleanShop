import { UniqueEntityId } from '../../../shared/domain/value-objects/unique-entity-id.vo';

export class UserId extends UniqueEntityId {
  private constructor(value: string) {
    super(value);
  }

  /** Identity for a user that does not exist yet. */
  static create(): UserId {
    return new UserId(UserId.generateValue());
  }

  /** Identity of a user that already exists (request parameter, database row). */
  static fromString(value: string): UserId {
    return new UserId(value);
  }
}
