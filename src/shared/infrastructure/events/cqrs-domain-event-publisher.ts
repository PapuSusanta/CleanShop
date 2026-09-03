import type { DomainEventPublisherPort } from '../../application/ports/domain-event-publisher.port';
import type { DomainEvent } from '../../domain/events/domain-event';
import { Injectable, Logger } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';

/**
 * Dispatches domain events onto the Nest CQRS event bus.
 *
 * Dispatching happens after the aggregate has been persisted and must never
 * fail the use case that produced the events, so a failing listener is logged
 * rather than propagated. Replace this with a transactional outbox when
 * at-least-once delivery becomes a requirement.
 */
@Injectable()
export class CqrsDomainEventPublisher implements DomainEventPublisherPort {
  private readonly logger = new Logger(CqrsDomainEventPublisher.name);

  constructor(private readonly eventBus: EventBus) {}

  async publishAll(events: readonly DomainEvent[]): Promise<void> {
    if (events.length === 0) {
      return;
    }

    for (const event of events) {
      try {
        await this.eventBus.publish(event);
      }
      catch (error) {
        this.logger.error(
          `Failed to dispatch '${event.eventName}' for aggregate ${event.aggregateId}`,
          error instanceof Error ? error.stack : String(error),
        );
      }
    }
  }
}
