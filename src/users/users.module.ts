import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CommandHandlers, EventListeners, QueryHandlers } from './application';
import { USERS_REPOSITORY } from './application/ports/users-repository.port';
import { DrizzleUsersRepository } from './infrastructure/adapters/drizzle-users.repository';
import { UsersController } from './presentation/users.controller';

@Module({
  imports: [CqrsModule],
  controllers: [UsersController],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    ...EventListeners,

    // Swap for MongoUsersRepository (and enable MongoModule in AppModule) to
    // run the same use cases on MongoDB.
    {
      provide: USERS_REPOSITORY,
      useClass: DrizzleUsersRepository,
    },
  ],
  exports: [USERS_REPOSITORY],
})
export class UsersModule {}
