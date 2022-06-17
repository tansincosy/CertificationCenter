import { Configuration } from 'log4js';

export const getConfig = () => {
  const logPath = process.env.LOG_PATH || 'app_data/logs';
  const logLevel =
    process.env.NODE_ENV === 'test' ? 'off' : process.env.LOG_LEVEL || 'info';
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
        filename: `${logPath}/app/c_APP.log`,
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
        filename: `${logPath}/error/e_APP.log`,
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
