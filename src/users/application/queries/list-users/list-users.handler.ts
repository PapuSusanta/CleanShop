import type { UsersFilter, UsersRepositoryPort } from '../../ports/users-repository.port';
import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Email } from '../../../domain/value-objects/email.vo';
import { USERS_REPOSITORY } from '../../ports/users-repository.port';
import { UserView } from '../user.view';
import { ListUsersQuery } from './list-users.query';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

@QueryHandler(ListUsersQuery)
export class ListUsersHandler implements IQueryHandler<
  ListUsersQuery,
  UserView[]
> {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly users: UsersRepositoryPort,
  ) {}

  async execute(query: ListUsersQuery): Promise<UserView[]> {
    const filter: UsersFilter = {
      email: query.email ? Email.create(query.email) : undefined,
      limit: Math.min(query.limit ?? DEFAULT_LIMIT, MAX_LIMIT),
      offset: query.offset ?? 0,
    };

    const users = await this.users.findAll(filter);

    return users.map(UserView.fromAggregate);
  }
}
