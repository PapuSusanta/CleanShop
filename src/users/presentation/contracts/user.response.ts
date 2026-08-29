import type { Users } from '../../domain/entity/users.entity';

export class UserResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
  updatedAt: string;

  static fromEntity(user: Users): UserResponse {
    const response = new UserResponse();
    response.id = user.id.value;
    response.firstName = user.firstName;
    response.lastName = user.lastName;
    response.email = user.email;
    response.createdAt = user.createdAt.toISOString();
    response.updatedAt = user.updatedAt.toISOString();

    return response;
  }
}
