import { Role } from '../../../shared/domain/enums/role.enum';
import { DomainEvent } from '../../../shared/domain/events/domain-event';

/** Raised when a user is created on somebody else's behalf, without a password. */
export class UserCreatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    readonly email: string,
    readonly fullName: string,
    readonly role: Role,
  ) {
    super(aggregateId);
  }

  get eventName(): string {
    return 'user.created';
  }
}
