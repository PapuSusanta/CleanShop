import type { TokenPayload } from '../../domain/interfaces/token-payload.interface';
import type { AuthenticatedRequest } from '../types/authenticated-request';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): TokenPayload => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    // Asserted rather than checked: JwtAuthGuard runs first and rejects the
    // request unless it could populate `user`, so a handler that reads this
    // decorator has already been guarded.
    return request.user as TokenPayload;
  },
);
