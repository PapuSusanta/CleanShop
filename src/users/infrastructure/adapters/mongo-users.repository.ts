import { Inject } from '@nestjs/common';
import { Collection, Db, Filter } from 'mongodb';
import {
  ApplicationException,
  ApplicationExceptionCode,
} from '../../../shared/domain/exceptions/application.exception';
import { MONGO_DB } from '../../../shared/infrastructure/database/mongodb/mongo.provider';
import {
  UsersFilters,
  UsersRepositoryPort,
} from '../../application/ports/users-repository.port';
import { Users } from '../../domain/entity/users.entity';
import { UserId } from '../../domain/value-objects/user-id';

interface UsersCollection {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export class MongoUsersRepository implements UsersRepositoryPort {
  private readonly collection: Collection<UsersCollection>;

  constructor(@Inject(MONGO_DB) private readonly db: Db) {
    this.collection = this.db.collection('users');
  }

  async save(user: Users): Promise<void> {
    const doc = MongoUsersRepository.toPersistence(user);
    await this.collection.insertOne(doc);
  }

  async update(user: Users): Promise<Users> {
    const doc = MongoUsersRepository.toPersistence(user);
    const result = await this.collection.findOneAndUpdate(
      { _id: user.id.value },
      {
        $set: {
          firstName: doc.firstName,
          lastName: doc.lastName,
          email: doc.email,
          updatedAt: doc.updatedAt,
        },
      },
      { returnDocument: 'after' },
    );

    if (!result) {
      throw new ApplicationException(
        `User with id '${user.id.value}' not found`,
        ApplicationExceptionCode.NOT_FOUND,
      );
    }

    return MongoUsersRepository.toDomain(result);
  }

  async findOne(id: UserId): Promise<Users | null> {
    const doc = await this.collection.findOne({ _id: id.value });

    if (!doc)
      return null;

    return MongoUsersRepository.toDomain(doc);
  }

  async findByEmail(email: string): Promise<Users | null> {
    const doc = await this.collection.findOne({ email });

    if (!doc)
      return null;

    return MongoUsersRepository.toDomain(doc);
  }

  async findAll(filters: UsersFilters): Promise<Users[]> {
    const query: Filter<UsersCollection> = {};

    if (filters?.email !== undefined) {
      query.email = filters.email;
    }

    const docs = await this.collection.find(query).toArray();

    return docs.map(MongoUsersRepository.toDomain);
  }

  async delete(id: UserId): Promise<void> {
    const user = await this.collection.findOne({ _id: id.value });

    if (!user) {
      throw new ApplicationException(
        `User with id ${id.value} not found`,
        ApplicationExceptionCode.NOT_FOUND,
      );
    }

    await this.collection.deleteOne({ _id: id.value });
  }

  // Private helper functions
  private static toPersistence(user: Users): UsersCollection {
    return {
      _id: user.id.value,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private static toDomain(model: UsersCollection): Users {
    return Users.toEntity({
      id: new UserId(model._id),
      firstName: model.firstName,
      lastName: model.lastName,
      email: model.email,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    });
  }
}
