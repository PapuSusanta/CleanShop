import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { envSchema } from './shared/config/validation';
import { MongoModule } from './shared/infrastructure/database/mongodb/mongo.module';
import { DrizzleModule } from './shared/infrastructure/database/postgres/drizzle.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    // Global Modules
    CqrsModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envSchema,

      validationOptions: {
        abortEarly: false,
        allowUnknown: true,
      },
    }),

    // Database Modules
    MongoModule,
    DrizzleModule,

    // Feature Modules
    UsersModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
