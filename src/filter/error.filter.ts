import { Logger, LoggerService } from '@/log4j/log4j.service';
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

import { OAuthError } from 'oauth2-server';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private logger: Logger;
  constructor(private readonly Log4js: LoggerService) {
    this.logger = this.Log4js.getLogger(HttpExceptionFilter.name);
  }
  catch(exception: HttpException, host: ArgumentsHost) {
    const request = host.switchToHttp().getRequest();
    const response = host.switchToHttp().getResponse();
    this.logger.warn(exception);
    const exceptionStatus =
      (exception.getStatus && exception.getStatus()) ||
      HttpStatus.INTERNAL_SERVER_ERROR;
    const data: any = {};
    if (exception instanceof OAuthError) {
      data.error_code = exception.code;
      data.error_message = exception.message;
    }
    if (exceptionStatus === HttpStatus.NOT_FOUND) {
      data.error_code = HttpStatus.NOT_FOUND;
      data.error_message =
        exception.message || `Invalid API: ${request.method} > ${request.url}`;
    }

    return response.status(data.error_code || exceptionStatus).jsonp(data);
  }
}
