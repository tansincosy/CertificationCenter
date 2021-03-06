import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  INestApplication,
} from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { Logger, LoggerService } from '../log4j/log4j.service';
import { PrismaMiddleware } from './prisma.middleware';

@Injectable()
export class PrismaService
  extends PrismaClient<Prisma.PrismaClientOptions, 'query' | 'error'>
  implements OnModuleInit, OnModuleDestroy
{
  private log: Logger;
  private logList: any;
  private logListFlag: boolean;
  constructor(
    private readonly logger: LoggerService,
    private readonly middleware: PrismaMiddleware,
  ) {
    super({
      log: [{ emit: 'event', level: 'query' }],
      errorFormat: 'colorless',
    });
    this.log = this.logger.getLogger(PrismaService.name);
    this.init();
  }

  async init() {
    const cacheMiddles = this.middleware.createCacheMiddleware({
      OAuthToken: {
        ttl: 30 * 24 * 60 * 60,
      },
    });
    cacheMiddles.forEach(async (cacheMiddle) => {
      this.$use(await cacheMiddle);
    });
    this.$use(this.middleware.updateSessionMiddleware.bind(this.middleware));
    this.$on('query', this.makeBatchLogger.bind(this));
  }

  makeBatchLogger({ query }) {
    if (query === 'BEGIN') {
      this.logList = [];
      this.logListFlag = true;
    }
    if (!this.logListFlag) {
      this.log.debug('[prisma:query]  ', query);
    } else {
      this.logList.push(query);
    }
    if (query === 'COMMIT') {
      this.logListFlag = false;
      this.log.debug('[prisma:query]', this.logList);
    }
  }

  async enableShutdownHooks(app: INestApplication) {
    this.$on('beforeExit', async () => {
      this.log.info('beforeExit');
      await app.close();
    });
  }
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
