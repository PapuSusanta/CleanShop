import type { TokenPayload } from '../../shared/domain/interfaces/token-payload.interface';
import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../../shared/infrastructure/decorators/current-user.decorator';
import { Public } from '../../shared/infrastructure/decorators/public.decorator';
import { Users } from '../../users/domain/entity/users.entity';
import { UserResponse } from '../../users/presentation/contracts/user.response';
import { LoginCommand } from '../application/commends/login/login.command';
import { LoginResult } from '../application/commends/login/login.result';
import { RegisterCommand } from '../application/commends/register/register.command';
import { MeQuery } from '../application/queries/me/me.query';
import { LoginRequest } from './contracts/login.request';
import { LoginResponse } from './contracts/login.response';
import { RegisterRequest } from './contracts/register.request';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly command: CommandBus,
    private readonly query: QueryBus,
  ) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() request: RegisterRequest): Promise<void> {
    await this.command.execute(
      new RegisterCommand(
        request.firstName,
        request.lastName,
        request.email,
        request.password,
      ),
    );
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() request: LoginRequest): Promise<LoginResponse> {
    const result = await this.command.execute<LoginCommand, LoginResult>(
      new LoginCommand(request.email, request.password),
    );
    return LoginResponse.fromResult(result);
  }

  @ApiBearerAuth('access-token')
  @Get('me')
  async me(@CurrentUser() currentUser: TokenPayload): Promise<UserResponse> {
    const user = await this.query.execute<MeQuery, Users>(
      new MeQuery(currentUser.sub),
    );
    return UserResponse.fromEntity(user);
  }
}
