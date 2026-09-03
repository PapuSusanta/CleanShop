import type { DomainEventPublisherPort } from '../../../../shared/application/ports/domain-event-publisher.port';
import type { UsersRepositoryPort } from '../../ports/users-repository.port';
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DOMAIN_EVENT_PUBLISHER } from '../../../../shared/application/ports/domain-event-publisher.port';
import {
  ApplicationException,
  ApplicationExceptionCode,
} from '../../../../shared/domain/exceptions/application.exception';
import { Email } from '../../../domain/value-objects/email.vo';
import { PersonName } from '../../../domain/value-objects/person-name.vo';
import { UserId } from '../../../domain/value-objects/user-id.vo';
import { USERS_REPOSITORY } from '../../ports/users-repository.port';
import { UserView } from '../../queries/user.view';
import { UpdateUserCommand } from './update-user.command';

@CommandHandler(UpdateUserCommand)
export class UpdateUserHandler implements ICommandHandler<
  UpdateUserCommand,
  UserView
> {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly users: UsersRepositoryPort,
    @Inject(DOMAIN_EVENT_PUBLISHER)
    private readonly eventPublisher: DomainEventPublisherPort,
  ) {}

  async execute(command: UpdateUserCommand): Promise<UserView> {
    const userId = UserId.fromString(command.id);

    // Load the existing aggregate and let it change itself: rebuilding a user
    // from the request body would silently drop the password and the role, and
    // reset createdAt.
    const user = await this.users.findById(userId);

    if (!user) {
      throw new ApplicationException(
        `User with id '${command.id}' not found`,
        ApplicationExceptionCode.NOT_FOUND,
      );
    }

    const email = Email.create(command.email);
    await this.assertEmailIsAvailable(email, userId);

    user.rename(PersonName.create(command.firstName, command.lastName));
    user.changeEmail(email);

    await this.users.save(user);
    await this.eventPublisher.publishAll(user.pullDomainEvents());

    return UserView.fromAggregate(user);
  }

  private async assertEmailIsAvailable(
    email: Email,
    userId: UserId,
  ): Promise<void> {
    const owner = await this.users.findByEmail(email);

    if (owner && !owner.id.equals(userId)) {
      throw new ApplicationException(
        `A user with email '${email.value}' already exists`,
        ApplicationExceptionCode.CONFLICT,
      );
    }
  }
}
