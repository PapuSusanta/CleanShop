import type { TokenPayload } from '../../shared/domain/interfaces/token-payload.interface';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../../shared/infrastructure/decorators/current-user.decorator';
import { Public } from '../../shared/infrastructure/decorators/public.decorator';
import { GetUserQuery } from '../../users/application/queries/get-user/get-user.query';
import { UserView } from '../../users/application/queries/user.view';
import { UserResponse } from '../../users/presentation/contracts/user.response';
import { LoginCommand } from '../application/commands/login/login.command';
import { LoginResult } from '../application/commands/login/login.result';
import { RegisterCommand } from '../application/commands/register/register.command';
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
    await this.command.execute<RegisterCommand, void>(
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

  /**
   * Reuses the users read model instead of keeping a second copy of the same
   * lookup: the only thing auth adds is resolving "me" from the access token.
   */
  @ApiBearerAuth('access-token')
  @Get('me')
  async me(@CurrentUser() currentUser: TokenPayload): Promise<UserResponse> {
    const user = await this.query.execute<GetUserQuery, UserView>(
      new GetUserQuery(currentUser.sub),
    );

    return UserResponse.fromView(user);
  }
}
