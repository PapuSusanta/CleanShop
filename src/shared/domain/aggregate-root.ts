import { Entity } from './entity';
import { DomainEvent } from './events/domain-event';
import { UniqueEntityId } from './value-objects/unique-entity-id.vo';

/**
 * An aggregate root is the only entry point into an aggregate: it owns the
 * invariants of everything inside it and is the unit of persistence.
 *
 * It also records the domain events produced while its state changed. The
 * application layer pulls those events after the aggregate has been saved and
 * hands them to a publisher — the domain itself stays free of any framework.
 */
export abstract class AggregateRoot<
  TId extends UniqueEntityId = UniqueEntityId,
> extends Entity<TId> {
  private _domainEvents: DomainEvent[] = [];

  get domainEvents(): readonly DomainEvent[] {
    return this._domainEvents;
  }

  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  /** Returns the recorded events and clears the buffer. */
  pullDomainEvents(): DomainEvent[] {
    const events = this._domainEvents;
    this._domainEvents = [];
    return events;
  }

  clearDomainEvents(): void {
    this._domainEvents = [];
  }
}
