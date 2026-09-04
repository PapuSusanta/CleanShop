export enum ApplicationExceptionCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  UNAUTHORIZED = 'UNAUTHORIZED',
}

/**
 * Base class for the failures a use case reports back to the caller. Every
 * subclass fixes its own code, so a throw site names the failure instead of
 * describing it, and the transport keeps sole ownership of the status mapping.
 */
export abstract class ApplicationException extends Error {
  abstract readonly code: ApplicationExceptionCode;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationException extends ApplicationException {
  readonly code = ApplicationExceptionCode.VALIDATION_ERROR;
}

export class NotFoundException extends ApplicationException {
  readonly code = ApplicationExceptionCode.NOT_FOUND;
}

export class ConflictException extends ApplicationException {
  readonly code = ApplicationExceptionCode.CONFLICT;
}

export class UnauthorizedException extends ApplicationException {
  readonly code = ApplicationExceptionCode.UNAUTHORIZED;
}
