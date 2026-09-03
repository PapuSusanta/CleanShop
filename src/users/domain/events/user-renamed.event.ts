import { DomainEvent } from '../../../shared/domain/events/domain-event';

export class UserRenamedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    readonly previousFullName: string,
    readonly fullName: string,
  ) {
    super(aggregateId);
  }

  get eventName(): string {
    return 'user.renamed';
  }
}
