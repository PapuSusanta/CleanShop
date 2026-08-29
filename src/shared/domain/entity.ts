import { UniqueEntityId } from './value-objects/unique-entity-id.vo';

export abstract class Entity<T extends UniqueEntityId = UniqueEntityId> {
  constructor(protected readonly _id: T) {}

  get id(): T {
    return this._id;
  }

  equals(object?: Entity<T>): boolean {
    if (object === null || object === undefined) {
      return false;
    }
    if (!(object instanceof Entity)) {
      return false;
    }
    return object.id.equals(this._id);
  }
}
