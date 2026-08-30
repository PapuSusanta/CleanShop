import type { TokenPayload } from '../../../shared/domain/interfaces/token-payload.interface';

export const TOKEN_PROVIDER = Symbol('TOKEN_PROVIDER');

export interface TokenProviderPort {
  sign: (payload: TokenPayload) => string;
}
