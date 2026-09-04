import type { DomainEventPublisherPort } from '../../../../shared/application/ports/domain-event-publisher.port';
import type { UsersRepositoryPort } from '../../ports/users-repository.port';
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  ConflictException,
} from '../../../../shared/application/exceptions/application.exception';
import { DOMAIN_EVENT_PUBLISHER } from '../../../../shared/application/ports/domain-event-publisher.port';
import { User } from '../../../domain/user.aggregate';
import { Email } from '../../../domain/value-objects/email.vo';
import { PersonName } from '../../../domain/value-objects/person-name.vo';
import { USERS_REPOSITORY } from '../../ports/users-repository.port';
import { UserView } from '../../queries/user.view';
import { CreateUserCommand } from './create-user.command';

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<
  CreateUserCommand,
  UserView
> {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly users: UsersRepositoryPort,
    @Inject(DOMAIN_EVENT_PUBLISHER)
    private readonly eventPublisher: DomainEventPublisherPort,
  ) {}

  async execute(command: CreateUserCommand): Promise<UserView> {
    const email = Email.create(command.email);

    if (await this.users.existsByEmail(email)) {
      throw new ConflictException(`A user with email '${email.value}' already exists`);
    }

    const user = User.create(
      PersonName.create(command.firstName, command.lastName),
      email,
    );

    await this.users.save(user);
    await this.eventPublisher.publishAll(user.pullDomainEvents());

    return UserView.fromAggregate(user);
  }
}
