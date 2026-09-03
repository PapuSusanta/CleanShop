import type { DomainEventPublisherPort } from '../../../../shared/application/ports/domain-event-publisher.port';
import type { UsersRepositoryPort } from '../../../../users/application/ports/users-repository.port';
import type { PasswordHasherPort } from '../../ports/password-hasher.port';
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DOMAIN_EVENT_PUBLISHER } from '../../../../shared/application/ports/domain-event-publisher.port';
import {
  ApplicationException,
  ApplicationExceptionCode,
} from '../../../../shared/domain/exceptions/application.exception';
import { USERS_REPOSITORY } from '../../../../users/application/ports/users-repository.port';
import { User } from '../../../../users/domain/user.aggregate';
import { Email } from '../../../../users/domain/value-objects/email.vo';
import { HashedPassword } from '../../../../users/domain/value-objects/hashed-password.vo';
import { PersonName } from '../../../../users/domain/value-objects/person-name.vo';
import { PASSWORD_HASHER } from '../../ports/password-hasher.port';
import { RegisterCommand } from './register.command';

@CommandHandler(RegisterCommand)
export class RegisterHandler implements ICommandHandler<
  RegisterCommand,
  void
> {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly users: UsersRepositoryPort,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasherPort,
    @Inject(DOMAIN_EVENT_PUBLISHER)
    private readonly eventPublisher: DomainEventPublisherPort,
  ) {}

  async execute(command: RegisterCommand): Promise<void> {
    const email = Email.create(command.email);

    if (await this.users.existsByEmail(email)) {
      throw new ApplicationException(
        `A user with email '${email.value}' already exists`,
        ApplicationExceptionCode.CONFLICT,
      );
    }

    // Hashing is the only thing auth adds here: the aggregate is handed a
    // HashedPassword and never sees the plain text one.
    const password = HashedPassword.fromHash(
      await this.passwordHasher.hash(command.password),
    );

    const user = User.register(
      PersonName.create(command.firstName, command.lastName),
      email,
      password,
    );

    await this.users.save(user);
    await this.eventPublisher.publishAll(user.pullDomainEvents());
  }
}
