import { Role } from '../../../shared/domain/enums/role.enum';
import { DomainEvent } from '../../../shared/domain/events/domain-event';

/** Raised when somebody signs themselves up through the auth endpoints. */
export class UserRegisteredEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    readonly email: string,
    readonly fullName: string,
    readonly role: Role,
  ) {
    super(aggregateId);
  }

  get eventName(): string {
    return 'user.registered';
  }
}
