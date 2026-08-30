import {
  Body,
  Controller,
  Delete,
  Get,
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
import { CreateUserCommand } from '../application/commends/create-user/create-user.command';
import { DeleteUserCommand } from '../application/commends/delete-user/delete-user.command';
import { UpdateUserCommand } from '../application/commends/update-user/update-user.command';
import { GetUserQuery } from '../application/queries/get-user/get-user.query';
import { ListUserQuery } from '../application/queries/list-users/list-user.query';
import { Users } from '../domain/entity/users.entity';
import { CreateUserRequest } from './contracts/create-user.request';
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
  async create(@Body() request: CreateUserRequest): Promise<void> {
    await this.command.execute(
      new CreateUserCommand(request.firstName, request.lastName, request.email),
    );
  }

  @Put(':id')
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() request: UpdateUserRequest,
  ): Promise<UserResponse> {
    const user = await this.command.execute<UpdateUserCommand, Users>(
      new UpdateUserCommand(
        id,
        request.firstName,
        request.lastName,
        request.email,
      ),
    );
    return UserResponse.fromEntity(user);
  }

  @Get()
  async findAll(@Query('email') email?: string): Promise<UserResponse[]> {
    const users = await this.query.execute<ListUserQuery, Users[]>(
      new ListUserQuery(email),
    );
    return users.map(UserResponse.fromEntity);
  }

  @Get(':id')
  async findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<UserResponse> {
    const user = await this.query.execute<GetUserQuery, Users>(
      new GetUserQuery(id),
    );
    return UserResponse.fromEntity(user);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  async delete(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    await this.command.execute<DeleteUserCommand, void>(
      new DeleteUserCommand(id),
    );
  }
}
