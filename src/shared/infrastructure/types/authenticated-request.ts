import type { Request } from 'express';
import type { TokenPayload } from '../../domain/interfaces/token-payload.interface';

/**
 * An express request after `JwtAuthGuard` has authenticated it.
 *
 * Declared as its own type rather than by augmenting express's `Request`, so
 * the payload shape stays local to this application instead of applying to
 * every request object in the process — including the ones libraries hold.
 */
export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}
