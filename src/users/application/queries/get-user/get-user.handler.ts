import type { UsersRepositoryPort } from '../../ports/users-repository.port';
import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  ApplicationException,
  ApplicationExceptionCode,
} from '../../../../shared/domain/exceptions/application.exception';
import { Users } from '../../../../users/domain/entity/users.entity';
import { UserId } from '../../../../users/domain/value-objects/user-id';
import { USERS_REPOSITORY } from '../../ports/users-repository.port';
import { GetUserQuery } from './get-user.query';

@QueryHandler(GetUserQuery)
export class GetUserHandler implements IQueryHandler<GetUserQuery, Users> {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: UsersRepositoryPort,
  ) {}

  async execute(query: GetUserQuery): Promise<Users> {
    const user = await this.usersRepository.findOne(new UserId(query.id));

    if (!user) {
      throw new ApplicationException(
        `User with ID ${query.id} not found`,
        ApplicationExceptionCode.NOT_FOUND,
      );
    }

    return user;
  }
}
