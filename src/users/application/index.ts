import { CreateUserHandler } from './commends/create-user/create-user.handler';
import { DeleteUserHandler } from './commends/delete-user/delete-user.handler';
import { UpdateUserHandler } from './commends/update-user/update-user.handler';
import { GetUserHandler } from './queries/get-user/get-user.handler';
import { ListUserHandler } from './queries/list-users/list-user.handler';

export const CommendHandlers = [
  CreateUserHandler,
  DeleteUserHandler,
  UpdateUserHandler,
];

export const QueryHandlers = [ListUserHandler, GetUserHandler];
