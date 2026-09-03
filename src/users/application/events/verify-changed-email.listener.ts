import { Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { UserEmailChangedEvent } from '../../domain/events/user-email-changed.event';

/**
 * A changed email address has to be proven before it can be trusted, and the
 * previous owner should be told the change happened.
 */
@EventsHandler(UserEmailChangedEvent)
export class VerifyChangedEmailListener implements IEventHandler<
  UserEmailChangedEvent
> {
  private readonly logger = new Logger(VerifyChangedEmailListener.name);

  handle(event: UserEmailChangedEvent): void {
    // TODO: issue a verification token and notify both addresses.
    this.logger.log(
      `Email for user ${event.aggregateId} changed from ${event.previousEmail} to ${event.email}; verification required`,
    );
  }
}
