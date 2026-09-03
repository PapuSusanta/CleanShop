import { CreateUserHandler } from './commands/create-user/create-user.handler';
import { DeleteUserHandler } from './commands/delete-user/delete-user.handler';
import { UpdateUserHandler } from './commands/update-user/update-user.handler';
import { CleanupDeletedUserListener } from './events/cleanup-deleted-user.listener';
import { SendWelcomeEmailListener } from './events/send-welcome-email.listener';
import { UserAuditTrailListener } from './events/user-audit-trail.listener';
import { VerifyChangedEmailListener } from './events/verify-changed-email.listener';
import { GetUserHandler } from './queries/get-user/get-user.handler';
import { ListUsersHandler } from './queries/list-users/list-users.handler';

export const CommandHandlers = [
  CreateUserHandler,
  UpdateUserHandler,
  DeleteUserHandler,
];

export const QueryHandlers = [GetUserHandler, ListUsersHandler];

export const EventListeners = [
  UserAuditTrailListener,
  SendWelcomeEmailListener,
  VerifyChangedEmailListener,
  CleanupDeletedUserListener,
];
