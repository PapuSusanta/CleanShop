import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CommendHandlers, QueryHandlers } from './application';
import { USERS_REPOSITORY } from './application/ports/users-repository.port';
import { DrizzleUsersRepository } from './infrastructure/adapters/drizzle-users.repository';
import { UsersController } from './presentation/users.controller';

@Module({
  imports: [CqrsModule],
  controllers: [UsersController],
  providers: [
    ...CommendHandlers,
    ...QueryHandlers,
    // DrizzleUsersRepository,
    // MongoUsersRepository,
    // {
    //   provide: USERS_REPOSITORY,
    //   useFactory: (
    //     config: ConfigService,
    //     mongoRepo: MongoUsersRepository,
    //     drizzleRepo: DrizzleUsersRepository,
    //   ) => {
    //     return config.get<string>('DATABASE') === 'mongodb' ?
    //       mongoRepo :
    //       drizzleRepo;
    //   },
    //   inject: [ConfigService, MongoUsersRepository, DrizzleUsersRepository],
    // },

    {
      provide: USERS_REPOSITORY,
      useClass: DrizzleUsersRepository,
    },
    // {
    //   provide: USERS_REPOSITORY,
    //   useClass: MongoUsersRepository,
    // },
  ],
  exports: [USERS_REPOSITORY],
})
export class UsersModule {}
