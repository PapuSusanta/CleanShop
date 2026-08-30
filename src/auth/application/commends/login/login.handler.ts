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
    private readonly userRepository: UsersRepositoryPort,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasherPort,
    @Inject(TOKEN_PROVIDER)
    private readonly tokenProvider: TokenProviderPort,
  ) {}

  async execute(command: LoginCommand): Promise<LoginResult> {
    const user = await this.userRepository.findByEmail(command.email);
    if (!user || !user.password) {
      throw new ApplicationException(
        'Invalid email or password',
        ApplicationExceptionCode.UNAUTHORIZED,
      );
    }

    const isPasswordValid = await this.passwordHasher.compare(
      command.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new ApplicationException(
        'Invalid email or password',
        ApplicationExceptionCode.UNAUTHORIZED,
      );
    }

    const accessToken = this.tokenProvider.sign({
      sub: user.id.value,
      email: user.email,
      role: user.role,
    });

    return new LoginResult(accessToken);
  }
}
