import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';
import { Env } from '../shared/config/config.types';
import { JwtAuthGuard } from '../shared/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../shared/infrastructure/guards/roles.guard';
import { UsersModule } from '../users/users.module';
import { CommendHandlers, QueryHandlers } from './application';
import { PASSWORD_HASHER } from './application/ports/password-hasher.port';
import { TOKEN_PROVIDER } from './application/ports/token.port';
import { BcryptPasswordHasher } from './infrastructure/adapters/bcrypt-password-hasher';
import { JwtTokenProvider } from './infrastructure/adapters/jwt-token.provider';
import { AuthController } from './presentation/auth.controller';

@Module({
  imports: [
    CqrsModule,
    UsersModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService<Env, true>) => ({
        secret: config.get('JWT_SECRET', { infer: true }),
        signOptions: {
          expiresIn: config.get('JWT_EXPIRES_IN', { infer: true }),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    ...CommendHandlers,
    ...QueryHandlers,
    JwtAuthGuard,
    RolesGuard,
    {
      provide: PASSWORD_HASHER,
      useClass: BcryptPasswordHasher,
    },
    {
      provide: TOKEN_PROVIDER,
      useClass: JwtTokenProvider,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
  exports: [JwtAuthGuard, RolesGuard, JwtModule],
})
export class AuthModule {}
