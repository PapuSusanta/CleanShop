import type { LoginResult } from '../../application/commands/login/login.result';

export class LoginResponse {
  accessToken: string;
  tokenType: string;

  static fromResult(result: LoginResult): LoginResponse {
    const response = new LoginResponse();
    response.accessToken = result.accessToken;
    response.tokenType = 'Bearer';

    return response;
  }
}
