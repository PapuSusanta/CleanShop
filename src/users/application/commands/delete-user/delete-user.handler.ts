import type { DomainEventPublisherPort } from '../../../../shared/application/ports/domain-event-publisher.port';
import type { UsersRepositoryPort } from '../../ports/users-repository.port';
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DOMAIN_EVENT_PUBLISHER } from '../../../../shared/application/ports/domain-event-publisher.port';
import {
  ApplicationException,
  ApplicationExceptionCode,
} from '../../../../shared/domain/exceptions/application.exception';
import { UserId } from '../../../domain/value-objects/user-id.vo';
import { USERS_REPOSITORY } from '../../ports/users-repository.port';
import { DeleteUserCommand } from './delete-user.command';

@CommandHandler(DeleteUserCommand)
export class DeleteUserHandler implements ICommandHandler<
  DeleteUserCommand,
  void
> {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly users: UsersRepositoryPort,
    @Inject(DOMAIN_EVENT_PUBLISHER)
    private readonly eventPublisher: DomainEventPublisherPort,
  ) {}

  async execute(command: DeleteUserCommand): Promise<void> {
    const user = await this.users.findById(UserId.fromString(command.id));

    if (!user) {
      throw new ApplicationException(
        `User with id '${command.id}' not found`,
        ApplicationExceptionCode.NOT_FOUND,
      );
    }

    user.delete();

    // The events have to be collected before the aggregate is handed over for
    // deletion, but they are only dispatched once the removal succeeded.
    const events = user.pullDomainEvents();

    await this.users.delete(user);
    await this.eventPublisher.publishAll(events);
  }
}
