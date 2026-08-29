import type { UsersRepositoryPort } from '../../ports/users-repository.port';
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserId } from '../../../../users/domain/value-objects/user-id';
import { Users } from '../../../domain/entity/users.entity';
import { USERS_REPOSITORY } from '../../ports/users-repository.port';
import { UpdateUserCommand } from './update-user.command';

@CommandHandler(UpdateUserCommand)
export class UpdateUserHandler implements ICommandHandler<
  UpdateUserCommand,
  Users
> {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly userRepository: UsersRepositoryPort,
  ) {}

  async execute(command: UpdateUserCommand): Promise<Users> {
    const user = Users.create(
      new UserId(command.id),
      command.firstName,
      command.lastName,
      command.email,
    );

    return await this.userRepository.update(user);
  }
}
