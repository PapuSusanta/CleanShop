import { DomainEvent } from '../../../shared/domain/events/domain-event';

export class UserEmailChangedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    readonly previousEmail: string,
    readonly email: string,
  ) {
    super(aggregateId);
  }

  get eventName(): string {
    return 'user.email-changed';
  }
}
