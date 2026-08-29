import { Users } from '../../../users/domain/entity/users.entity';
import { UserId } from '../../../users/domain/value-objects/user-id';

export const USERS_REPOSITORY = Symbol('USERS_REPOSITORY');

export interface UsersFilters {
  email?: string;
}

export interface UsersRepositoryPort {
  save: (user: Users) => Promise<void>;
  update: (user: Users) => Promise<Users>;
  findOne: (id: UserId) => Promise<Users | null>;
  findAll: (filter: UsersFilters) => Promise<Users[]>;
  findByEmail: (email: string) => Promise<Users | null>;
  delete: (id: UserId) => Promise<void>;
}
