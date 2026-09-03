import type { User } from '../../domain/user.aggregate';
import type { Email } from '../../domain/value-objects/email.vo';
import type { UserId } from '../../domain/value-objects/user-id.vo';

export const USERS_REPOSITORY = Symbol('USERS_REPOSITORY');

export interface UsersFilter {
  email?: Email;
  limit?: number;
  offset?: number;
}

/**
 * A repository behaves like an in-memory collection of aggregates: you put a
 * whole aggregate in, you take a whole aggregate out. It deliberately exposes
 * no insert/update distinction — that is a persistence detail.
 */
export interface UsersRepositoryPort {
  save: (user: User) => Promise<void>;
  delete: (user: User) => Promise<void>;
  findById: (id: UserId) => Promise<User | null>;
  findByEmail: (email: Email) => Promise<User | null>;
  findAll: (filter: UsersFilter) => Promise<User[]>;
  existsByEmail: (email: Email) => Promise<boolean>;
}
