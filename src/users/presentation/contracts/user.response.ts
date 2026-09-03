import type { Role } from '../../../shared/domain/enums/role.enum';
import type { UserView } from '../../application/queries/user.view';

export class UserResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  createdAt: string;
  updatedAt: string;

  static fromView(view: UserView): UserResponse {
    const response = new UserResponse();
    response.id = view.id;
    response.firstName = view.firstName;
    response.lastName = view.lastName;
    response.email = view.email;
    response.role = view.role;
    response.createdAt = view.createdAt.toISOString();
    response.updatedAt = view.updatedAt.toISOString();

    return response;
  }
}
