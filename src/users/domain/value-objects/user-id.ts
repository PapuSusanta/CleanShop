import { UniqueEntityId } from '../../../shared/domain/value-objects/unique-entity-id.vo';

export class UserId extends UniqueEntityId {
  constructor(id?: string) {
    super(id);
  }
}
