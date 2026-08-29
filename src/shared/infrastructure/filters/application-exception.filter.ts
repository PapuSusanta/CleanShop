import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApplicationException,
  ApplicationExceptionCode,
} from '../../domain/exceptions/application.exception';

const CODE_TO_HTTP: Record<ApplicationExceptionCode, HttpStatus> = {
  [ApplicationExceptionCode.VALIDATION_ERROR]: HttpStatus.BAD_REQUEST,
  [ApplicationExceptionCode.CONFLICT]: HttpStatus.CONFLICT,
  [ApplicationExceptionCode.NOT_FOUND]: HttpStatus.NOT_FOUND,
};

@Catch(ApplicationException)
export class ApplicationExceptionFilter implements ExceptionFilter {
  catch(exception: ApplicationException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const statusCode =
      CODE_TO_HTTP[exception.code] ?? HttpStatus.INTERNAL_SERVER_ERROR;

    response.status(statusCode).json({
      statusCode,
      message: exception.message,
    });
  }
}
