import { Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { DomainEvent } from '../../../shared/domain/events/domain-event';
import { UserCreatedEvent } from '../../domain/events/user-created.event';
import { UserDeletedEvent } from '../../domain/events/user-deleted.event';
import { UserEmailChangedEvent } from '../../domain/events/user-email-changed.event';
import { UserRegisteredEvent } from '../../domain/events/user-registered.event';
import { UserRenamedEvent } from '../../domain/events/user-renamed.event';

/**
 * One listener subscribed to every user event: an append-only trail of what
 * happened to the aggregate. Point it at your audit store when you have one.
 */
@EventsHandler(
  UserRegisteredEvent,
  UserCreatedEvent,
  UserRenamedEvent,
  UserEmailChangedEvent,
  UserDeletedEvent,
)
export class UserAuditTrailListener implements IEventHandler<DomainEvent> {
  private readonly logger = new Logger(UserAuditTrailListener.name);

  handle(event: DomainEvent): void {
    this.logger.log(
      `[audit] ${event.eventName} user=${event.aggregateId} at=${event.occurredAt.toISOString()} event=${event.eventId}`,
    );
  }
}
