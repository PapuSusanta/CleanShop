import type { DrizzleDb } from '../../../shared/infrastructure/database/postgres/drizzle.provider';
import type {
  UsersFilter,
  UsersRepositoryPort,
} from '../../application/ports/users-repository.port';
import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import {
  ConflictException,
} from '../../../shared/application/exceptions/application.exception';
import { DRIZZLE } from '../../../shared/infrastructure/database/postgres/drizzle.provider';
import { users } from '../../../shared/infrastructure/database/postgres/schemas';
import { User } from '../../domain/user.aggregate';
import { Email } from '../../domain/value-objects/email.vo';
import { HashedPassword } from '../../domain/value-objects/hashed-password.vo';
import { PersonName } from '../../domain/value-objects/person-name.vo';
import { UserId } from '../../domain/value-objects/user-id.vo';

const UNIQUE_VIOLATION = '23505';
const DEFAULT_LIMIT = 50;

type UserRow = typeof users.$inferSelect;

@Injectable()
export class DrizzleUsersRepository implements UsersRepositoryPort {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async save(user: User): Promise<void> {
    const row = DrizzleUsersRepository.toRow(user);

    try {
      await this.db
        .insert(users)
        .values(row)
        .onConflictDoUpdate({
          target: users.id,
          set: {
            firstName: row.firstName,
            lastName: row.lastName,
            email: row.email,
            password: row.password,
            role: row.role,
            updatedAt: row.updatedAt,
          },
        });
    }
    catch (error) {
      throw DrizzleUsersRepository.translate(error, row.email);
    }
  }

  async delete(user: User): Promise<void> {
    await this.db.delete(users).where(eq(users.id, user.id.value));
  }

  async findById(id: UserId): Promise<User | null> {
    const [row] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id.value))
      .limit(1);

    return row ? DrizzleUsersRepository.toDomain(row) : null;
  }

  async findByEmail(email: Email): Promise<User | null> {
    const [row] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email.value))
      .limit(1);

    return row ? DrizzleUsersRepository.toDomain(row) : null;
  }

  async findAll(filter: UsersFilter): Promise<User[]> {
    const rows = await this.db
      .select()
      .from(users)
      .where(filter.email ? eq(users.email, filter.email.value) : undefined)
      .orderBy(users.createdAt)
      .limit(filter.limit ?? DEFAULT_LIMIT)
      .offset(filter.offset ?? 0);

    return rows.map(DrizzleUsersRepository.toDomain);
  }

  async existsByEmail(email: Email): Promise<boolean> {
    const [row] = await this.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email.value))
      .limit(1);

    return row !== undefined;
  }

  // --- Mapping -------------------------------------------------------------

  private static toRow(user: User): UserRow {
    const snapshot = user.toSnapshot();

    return {
      id: snapshot.id.value,
      firstName: snapshot.name.firstName,
      lastName: snapshot.name.lastName,
      email: snapshot.email.value,
      password: snapshot.password?.value ?? null,
      role: snapshot.role,
      createdAt: snapshot.createdAt,
      updatedAt: snapshot.updatedAt,
    };
  }

  private static toDomain(row: UserRow): User {
    return User.fromPersistence({
      id: UserId.fromString(row.id),
      name: PersonName.create(row.firstName, row.lastName),
      email: Email.create(row.email),
      password: row.password ?
          HashedPassword.fromHash(row.password) :
        undefined,
      role: row.role,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  /**
   * Two concurrent requests can both pass the "is this email free?" check, so
   * the unique index is the real guard. Turn its violation into the same
   * conflict the use case would have raised.
   */
  private static translate(error: unknown, email: string): unknown {
    const code = (error as { code?: string })?.code;

    if (code === UNIQUE_VIOLATION) {
      return new ConflictException(`A user with email '${email}' already exists`);
    }

    return error;
  }
}
