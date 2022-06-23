import { getConfig } from '@/config/log4js.config';
import { Log } from '@/util/log.util';
import { Injectable } from '@nestjs/common';

@Injectable()
export class LoggerService extends Log {
  constructor() {
    super(getConfig());
  }
}

// 作为参数导出
export { Logger } from 'log4js';
