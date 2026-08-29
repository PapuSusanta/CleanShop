import type { UsersRepositoryPort } from '../../ports/users-repository.port';
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  ApplicationException,
  ApplicationExceptionCode,
} from '../../../../shared/domain/exceptions/application.exception';
import { USERS_REPOSITORY } from '../../../application/ports/users-repository.port';
import { Users } from '../../../domain/entity/users.entity';
import { CreateUserCommand } from './create-user.command';

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<
  CreateUserCommand,
  void
> {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly userRepository: UsersRepositoryPort,
  ) {}

  async execute(command: CreateUserCommand): Promise<void> {
    const emailExists = await this.userRepository.findByEmail(command.email);
    if (emailExists) {
      throw new ApplicationException(
        'Duplicate email found, use different one.',
        ApplicationExceptionCode.CONFLICT,
      );
    }
    const user = Users.createUnique(
      command.firstName,
      command.lastName,
      command.email,
    );

    await this.userRepository.save(user);
  }
}
