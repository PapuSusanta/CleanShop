import type { UsersRepositoryPort } from '../../../../users/application/ports/users-repository.port';
import type { PasswordHasherPort } from '../../ports/password-hasher.port';
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  ApplicationException,
  ApplicationExceptionCode,
} from '../../../../shared/domain/exceptions/application.exception';
import { USERS_REPOSITORY } from '../../../../users/application/ports/users-repository.port';
import { Users } from '../../../../users/domain/entity/users.entity';
import { PASSWORD_HASHER } from '../../ports/password-hasher.port';
import { RegisterCommand } from './register.command';

@CommandHandler(RegisterCommand)
export class RegisterHandler implements ICommandHandler<
  RegisterCommand,
  void
> {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly userRepository: UsersRepositoryPort,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasherPort,
  ) {}

  async execute(command: RegisterCommand): Promise<void> {
    const emailExists = await this.userRepository.findByEmail(command.email);
    if (emailExists) {
      throw new ApplicationException(
        'Duplicate email found, use different one.',
        ApplicationExceptionCode.CONFLICT,
      );
    }

    const hashedPassword = await this.passwordHasher.hash(command.password);

    const user = Users.createUnique(
      command.firstName,
      command.lastName,
      command.email,
      hashedPassword,
    );

    await this.userRepository.save(user);
  }
}
