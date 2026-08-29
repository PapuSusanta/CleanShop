import type { UsersRepositoryPort } from '../../ports/users-repository.port';
import {
  ApplicationException,
  ApplicationExceptionCode,
} from '../../../../shared/domain/exceptions/application.exception';
import { GetUserHandler } from './get-user.handler';
import { GetUserQuery } from './get-user.query';

describe('getUserHandler', () => {
  it('throws ApplicationException with NOT_FOUND when the user does not exist', async () => {
    const repository: UsersRepositoryPort = {
      findOne: jest.fn().mockResolvedValue(null),
      save: jest.fn(),
      update: jest.fn(),
      findAll: jest.fn(),
      findByEmail: jest.fn(),
      delete: jest.fn(),
    };

    const handler = new GetUserHandler(repository);
    const id = 'c989db2f-2926-4795-adfb-cea08fbba448';

    await expect(handler.execute(new GetUserQuery(id))).rejects.toThrow(
      ApplicationException,
    );

    await expect(handler.execute(new GetUserQuery(id))).rejects.toMatchObject({
      code: ApplicationExceptionCode.NOT_FOUND,
      message: `User with ID ${id} not found`,
    });
  });
});
