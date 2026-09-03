import type { UsersRepositoryPort } from '../../ports/users-repository.port';
import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  ApplicationException,
  ApplicationExceptionCode,
} from '../../../../shared/domain/exceptions/application.exception';
import { UserId } from '../../../domain/value-objects/user-id.vo';
import { USERS_REPOSITORY } from '../../ports/users-repository.port';
import { UserView } from '../user.view';
import { GetUserQuery } from './get-user.query';

@QueryHandler(GetUserQuery)
export class GetUserHandler implements IQueryHandler<GetUserQuery, UserView> {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly users: UsersRepositoryPort,
  ) {}

  async execute(query: GetUserQuery): Promise<UserView> {
    const user = await this.users.findById(UserId.fromString(query.id));

    if (!user) {
      throw new ApplicationException(
        `User with id '${query.id}' not found`,
        ApplicationExceptionCode.NOT_FOUND,
      );
    }

    return UserView.fromAggregate(user);
  }
}
