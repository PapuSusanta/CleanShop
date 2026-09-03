import type { UsersRepositoryPort } from '../../../../users/application/ports/users-repository.port';
import type { PasswordHasherPort } from '../../ports/password-hasher.port';
import type { TokenProviderPort } from '../../ports/token.port';
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  ApplicationException,
  ApplicationExceptionCode,
} from '../../../../shared/domain/exceptions/application.exception';
import { USERS_REPOSITORY } from '../../../../users/application/ports/users-repository.port';
import { Email } from '../../../../users/domain/value-objects/email.vo';
import { PASSWORD_HASHER } from '../../ports/password-hasher.port';
import { TOKEN_PROVIDER } from '../../ports/token.port';
import { LoginCommand } from './login.command';
import { LoginResult } from './login.result';

@CommandHandler(LoginCommand)
export class LoginHandler implements ICommandHandler<
  LoginCommand,
  LoginResult
> {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly users: UsersRepositoryPort,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasherPort,
    @Inject(TOKEN_PROVIDER)
    private readonly tokenProvider: TokenProviderPort,
  ) {}

  async execute(command: LoginCommand): Promise<LoginResult> {
    const user = await this.users.findByEmail(Email.create(command.email));

    if (!user || !user.hasPassword()) {
      throw LoginHandler.invalidCredentials();
    }

    const isPasswordValid = await this.passwordHasher.compare(
      command.password,
      user.passwordHash().value,
    );

    if (!isPasswordValid) {
      throw LoginHandler.invalidCredentials();
    }

    const accessToken = this.tokenProvider.sign({
      sub: user.id.value,
      email: user.email.value,
      role: user.role,
    });

    return new LoginResult(accessToken);
  }

  /** Same message either way, so the response cannot be used to probe emails. */
  private static invalidCredentials(): ApplicationException {
    return new ApplicationException(
      'Invalid email or password',
      ApplicationExceptionCode.UNAUTHORIZED,
    );
  }
}
