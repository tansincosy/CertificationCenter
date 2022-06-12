import { toJSON } from '@/util/help.util';
import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Cache } from 'cache-manager';
import { Logger, LoggerService } from '../log4j/log4j.service';

@Injectable()
export class PrismaMiddleware {
  private log: Logger;
  constructor(
    private readonly logger: LoggerService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {
    this.log = this.logger.getLogger(PrismaMiddleware.name);
  }

  async updateSessionMiddleware(params, next): Promise<Prisma.Middleware<any>> {
    const { action, args } = params;
    if (action === 'update') {
      const { data } = args || {};
      data.updatedAt = new Date().toISOString();
    }
    const before = Date.now();
    const result = await next(params);
    const after = Date.now();
    this.log.info(
      `[prisma:query] ${params.model}.${params.action} took ${
        after - before
      }ms`,
    );
    return result;
  }

  async cacheMiddleware(
    params: Prisma.MiddlewareParams,
    next: (params: Prisma.MiddlewareParams) => Promise<any>,
  ): Promise<Prisma.Middleware<any>> {
    const { model, action, args } = params;
    this.log.info('[cacheMiddleware]', `${model}.${action}`);
    if (model === Prisma.ModelName.OAuthApprovals) {
      if (action === 'create') {
        const { data } = args || {};
        this.log.info(
          '[prisma:cache] save cache key=',
          Prisma.ModelName.OAuthApprovals,
        );
        this.cacheManager.set(
          `Prisma.ModelName.OAuthApprovals:${data.code}`,
          data,
          {
            ttl: 60 * 60 * 24,
          },
        );
      }
    }

    return await next(params);
  }
}
