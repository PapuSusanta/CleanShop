import type { UsersRepositoryPort } from '../../../../users/application/ports/users-repository.port';
import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  ApplicationException,
  ApplicationExceptionCode,
} from '../../../../shared/domain/exceptions/application.exception';
import { USERS_REPOSITORY } from '../../../../users/application/ports/users-repository.port';
import { Users } from '../../../../users/domain/entity/users.entity';
import { UserId } from '../../../../users/domain/value-objects/user-id';
import { MeQuery } from './me.query';

@QueryHandler(MeQuery)
export class MeHandler implements IQueryHandler<MeQuery, Users> {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly userRepository: UsersRepositoryPort,
  ) {}

  async execute(query: MeQuery): Promise<Users> {
    const user = await this.userRepository.findOne(new UserId(query.id));

    if (!user) {
      throw new ApplicationException(
        `User with ID ${query.id} not found`,
        ApplicationExceptionCode.NOT_FOUND,
      );
    }

    return user;
  }
}
