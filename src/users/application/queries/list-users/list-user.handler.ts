import type { UsersRepositoryPort } from '../../ports/users-repository.port';
import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Users } from '../../../../users/domain/entity/users.entity';
import { USERS_REPOSITORY } from '../../ports/users-repository.port';
import { ListUserQuery } from './list-user.query';

@QueryHandler(ListUserQuery)
export class ListUserHandler implements IQueryHandler<ListUserQuery, Users[]> {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: UsersRepositoryPort,
  ) {}

  async execute(query: ListUserQuery): Promise<Users[]> {
    return await this.usersRepository.findAll({ email: query.email });
  }
}
