/**
 * Base class for every domain event.
 *
 * Domain events are plain, framework-free objects: they are raised by
 * aggregates inside the domain layer and only later handed to whatever
 * infrastructure is responsible for dispatching them.
 */
export abstract class DomainEvent {
  readonly eventId: string;
  readonly occurredAt: Date;

  protected constructor(readonly aggregateId: string) {
    this.eventId = crypto.randomUUID();
    this.occurredAt = new Date();
  }

  /** Stable, human readable name used for logging, auditing and routing. */
  abstract get eventName(): string;
}
