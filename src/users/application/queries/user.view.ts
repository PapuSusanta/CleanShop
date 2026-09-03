import type { Role } from '../../../shared/domain/enums/role.enum';
import type { User } from '../../domain/user.aggregate';

/**
 * Read model returned by the query side. Aggregates never leave the
 * application layer, so the presentation layer cannot depend on the domain
 * model or accidentally mutate it.
 */
export class UserView {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;

  static fromAggregate(user: User): UserView {
    const view = new UserView();
    view.id = user.id.value;
    view.firstName = user.name.firstName;
    view.lastName = user.name.lastName;
    view.fullName = user.name.fullName;
    view.email = user.email.value;
    view.role = user.role;
    view.createdAt = user.createdAt;
    view.updatedAt = user.updatedAt;

    return view;
  }
}
