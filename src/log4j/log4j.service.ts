import { Log } from '@/util/log.util';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Configuration } from 'log4js';

const initLoggerConfig = (appDataPath, logLevel) => {
  const logConfig: Configuration = {
    appenders: {
      console: {
        type: 'console',
        layout: {
          type: 'pattern',
          pattern: '%[[%d{yyyy-MM-dd hh:mm:ss.SSS}] [%p] %c -%] %m',
        },
      },
      appLog: {
        type: 'dateFile',
        filename: `${appDataPath}/app/c_APP.log`,
        pattern: 'yyyy-MM-dd',
        keepFileExt: true,
        compress: true,
        layout: {
          type: 'pattern',
          pattern: '[%d{yyyy-MM-dd hh:mm:ss.SSS}] [%p] [%c] - %m',
        },
      },
      appLogFilter: {
        type: 'categoryFilter',
        exclude: 'sqlConsole',
        appender: 'appLog',
      },
      errorFile: {
        type: 'dateFile',
        filename: `${appDataPath}/error/e_APP.log`,
        alwaysIncludePattern: true,
        pattern: 'yyyy-MM-dd',
        keepFileExt: true,
        compress: true,
        layout: {
          type: 'pattern',
          pattern: '[%d{yyyy-MM-dd hh:mm:ss.SSS}] [%p] [%c] - %m',
        },
      },
      errors: {
        type: 'logLevelFilter',
        level: 'ERROR',
        appender: 'errorFile',
      },
    },
    categories: {
      default: {
        appenders: ['console', 'appLogFilter', 'errors'],
        level: logLevel,
      },
    },
  };
  return logConfig;
};
@Injectable()
export class LoggerService extends Log {
  constructor(readonly configService: ConfigService) {
    const appDataPath = configService.get('app.data.path');
    const logLevel =
      process.env.NODE_ENV === 'test' ? 'off' : configService.get('log.level');
    super(initLoggerConfig(appDataPath, logLevel));
  }
}

export { Logger } from 'log4js';
