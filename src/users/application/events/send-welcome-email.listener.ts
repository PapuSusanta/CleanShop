import { Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { UserCreatedEvent } from '../../domain/events/user-created.event';
import { UserRegisteredEvent } from '../../domain/events/user-registered.event';

/**
 * Welcoming a new user is a side effect of registration, not part of it:
 * keeping it in a listener means the registration use case does not need to
 * know that an email is sent at all.
 */
@EventsHandler(UserRegisteredEvent, UserCreatedEvent)
export class SendWelcomeEmailListener implements IEventHandler<
  UserRegisteredEvent | UserCreatedEvent
> {
  private readonly logger = new Logger(SendWelcomeEmailListener.name);

  handle(event: UserRegisteredEvent | UserCreatedEvent): void {
    const invite =
      event instanceof UserCreatedEvent ?
        ' with a password setup link' :
        '';

    // TODO: replace with a MailerPort adapter once a mail provider is wired up.
    this.logger.log(
      `Sending welcome email${invite} to ${event.email} (${event.fullName})`,
    );
  }
}
