import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '../../shared/domain/enums/role.enum';
import { Roles } from '../../shared/infrastructure/decorators/roles.decorator';
import { CreateUserCommand } from '../application/commands/create-user/create-user.command';
import { DeleteUserCommand } from '../application/commands/delete-user/delete-user.command';
import { UpdateUserCommand } from '../application/commands/update-user/update-user.command';
import { GetUserQuery } from '../application/queries/get-user/get-user.query';
import { ListUsersQuery } from '../application/queries/list-users/list-users.query';
import { UserView } from '../application/queries/user.view';
import { CreateUserRequest } from './contracts/create-user.request';
import { ListUsersRequest } from './contracts/list-users.request';
import { UpdateUserRequest } from './contracts/update-user.request';
import { UserResponse } from './contracts/user.response';

@ApiBearerAuth('access-token')
@Controller('users')
export class UsersController {
  constructor(
    private readonly command: CommandBus,
    private readonly query: QueryBus,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() request: CreateUserRequest): Promise<UserResponse> {
    const user = await this.command.execute<CreateUserCommand, UserView>(
      new CreateUserCommand(request.firstName, request.lastName, request.email),
    );

    return UserResponse.fromView(user);
  }

  @Put(':id')
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() request: UpdateUserRequest,
  ): Promise<UserResponse> {
    const user = await this.command.execute<UpdateUserCommand, UserView>(
      new UpdateUserCommand(
        id,
        request.firstName,
        request.lastName,
        request.email,
      ),
    );

    return UserResponse.fromView(user);
  }

  @Get()
  async findAll(@Query() request: ListUsersRequest): Promise<UserResponse[]> {
    const users = await this.query.execute<ListUsersQuery, UserView[]>(
      new ListUsersQuery(request.email, request.limit, request.offset),
    );

    return users.map(UserResponse.fromView);
  }

  @Get(':id')
  async findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<UserResponse> {
    const user = await this.query.execute<GetUserQuery, UserView>(
      new GetUserQuery(id),
    );

    return UserResponse.fromView(user);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    await this.command.execute<DeleteUserCommand, void>(
      new DeleteUserCommand(id),
    );
  }
}
