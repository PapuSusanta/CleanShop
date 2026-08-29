import type { DrizzleDb } from '../../../shared/infrastructure/database/postgres/drizzle.provider';
import { Inject, Injectable } from '@nestjs/common';
import { and, eq, SQL } from 'drizzle-orm';
import {
  ApplicationException,
  ApplicationExceptionCode,
} from '../../../shared/domain/exceptions/application.exception';
import { DRIZZLE } from '../../../shared/infrastructure/database/postgres/drizzle.provider';
import { users } from '../../../shared/infrastructure/database/postgres/schemas';
import {
  UsersFilters,
  UsersRepositoryPort,
} from '../../application/ports/users-repository.port';
import { Users } from '../../domain/entity/users.entity';
import { UserId } from '../../domain/value-objects/user-id';

@Injectable()
export class DrizzleUsersRepository implements UsersRepositoryPort {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async save(user: Users): Promise<void> {
    const model = DrizzleUsersRepository.toPersistence(user);

    await this.db.insert(users).values(model);
  }

  async update(user: Users): Promise<Users> {
    const model = DrizzleUsersRepository.toPersistence(user);

    const [updatedUser] = await this.db
      .update(users)
      .set({
        firstName: model.firstName,
        lastName: model.lastName,
        email: model.email,
        updatedAt: model.updatedAt,
      })
      .where(eq(users.id, user.id.value))
      .returning();

    if (!updatedUser) {
      throw new ApplicationException(
        `User with id '${user.id.value}' not found`,
        ApplicationExceptionCode.NOT_FOUND,
      );
    }

    return DrizzleUsersRepository.toDomain(updatedUser);
  }

  async findOne(id: UserId): Promise<Users | null> {
    const model = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id.value));

    if (model.length === 0)
      return null;

    return DrizzleUsersRepository.toDomain(model[0]);
  }

  async findAll(filter: UsersFilters): Promise<Users[]> {
    const conditions: SQL[] = [];

    if (filter.email !== undefined) {
      conditions.push(eq(users.email, filter.email));
    }

    const query = this.db.select().from(users);

    const models =
      conditions.length > 0 ?
          await query.where(and(...conditions)) :
          await query;

    return models.map(DrizzleUsersRepository.toDomain);
  }

  async findByEmail(email: string): Promise<Users | null> {
    const model = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (model.length === 0)
      return null;

    return DrizzleUsersRepository.toDomain(model[0]);
  }

  async delete(id: UserId): Promise<void> {
    const user = await this.db.query.users.findFirst({
      where: eq(users.id, id.value),
    });

    if (!user) {
      throw new ApplicationException(
        `User with id ${id.value} not found`,
        ApplicationExceptionCode.NOT_FOUND,
      );
    }

    await this.db.delete(users).where(eq(users.id, id.value));
  }

  // Private helper functions
  private static toPersistence(user: Users): typeof users.$inferSelect {
    return {
      id: user.id.value,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private static toDomain(model: typeof users.$inferSelect): Users {
    return Users.toEntity({
      id: new UserId(model.id),
      firstName: model.firstName,
      lastName: model.lastName,
      email: model.email,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    });
  }
}
