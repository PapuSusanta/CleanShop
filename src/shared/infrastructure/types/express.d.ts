import type { TokenPayload } from '../../domain/interfaces/token-payload.interface';

declare module 'express' {
  interface Request {
    user?: TokenPayload;
  }
}
