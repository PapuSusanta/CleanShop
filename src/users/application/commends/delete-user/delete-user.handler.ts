import type { UsersRepositoryPort } from '../../ports/users-repository.port';
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserId } from '../../../domain/value-objects/user-id';
import { USERS_REPOSITORY } from '../../ports/users-repository.port';
import { DeleteUserCommand } from './delete-user.command';

@CommandHandler(DeleteUserCommand)
export class DeleteUserHandler implements ICommandHandler<
  DeleteUserCommand,
  void
> {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly userRepository: UsersRepositoryPort,
  ) {}

  async execute(command: DeleteUserCommand): Promise<void> {
    await this.userRepository.delete(new UserId(command.id));
  }
}
