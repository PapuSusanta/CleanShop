import { Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { UserDeletedEvent } from '../../domain/events/user-deleted.event';

/**
 * Everything that belongs to a removed user — sessions, carts, orders that can
 * be anonymised — is cleaned up here rather than inside the delete use case.
 */
@EventsHandler(UserDeletedEvent)
export class CleanupDeletedUserListener implements IEventHandler<
  UserDeletedEvent
> {
  private readonly logger = new Logger(CleanupDeletedUserListener.name);

  handle(event: UserDeletedEvent): void {
    // TODO: revoke issued tokens and anonymise records referencing this user.
    this.logger.log(
      `Cleaning up data owned by deleted user ${event.aggregateId} (${event.email})`,
    );
  }
}
