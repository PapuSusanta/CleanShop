import type { Request } from 'express';
import type { TokenPayload } from '../../domain/interfaces/token-payload.interface';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): TokenPayload => {
    const request = context.switchToHttp().getRequest<Request>();
    return request.user as TokenPayload;
  },
);
