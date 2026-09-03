import { UniqueEntityId } from './value-objects/unique-entity-id.vo';

/**
 * An entity is defined by its identity, not by its attributes: two entities
 * with different attributes but the same id are the same entity.
 */
export abstract class Entity<TId extends UniqueEntityId = UniqueEntityId> {
  protected constructor(protected readonly _id: TId) {}

  get id(): TId {
    return this._id;
  }

  equals(other?: Entity<TId> | null): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    if (other === this) {
      return true;
    }
    if (!(other instanceof Entity)) {
      return false;
    }
    return this._id.equals(other.id);
  }
}
