import { toJSON } from '@/util/help.util';
import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Cache } from 'cache-manager';
import { Logger, LoggerService } from '../log4j/log4j.service';

export type CacheMiddlewareOpt = {
  [key in Prisma.ModelName]?: {
    ttl: number;
  };
};

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

  createCacheMiddleware(cacheOption: CacheMiddlewareOpt) {
    const cacheKeys = Object.keys(cacheOption) || [];
    if (cacheKeys.length === 0) {
      this.log.warn('[prisma:cache] no cache key found');
      return [async (params, next) => next(params)];
    }
    return cacheKeys.map(async (modelName: Prisma.ModelName) => {
      return async (
        params: Prisma.MiddlewareParams,
        next: (params: Prisma.MiddlewareParams) => Promise<any>,
      ) => {
        const { model, action, args } = params;
        const curModelObj = cacheOption[modelName];
        let result = null;
        if (modelName === model) {
          const { where } = args;
          const cacheKey = `Prisma.ModelName.${modelName}:${
            toJSON(where) || ''
          }`;
          if (
            ['findUnique', 'findMany', 'findFirst', 'count'].includes(action)
          ) {
            result = await this.cacheManager.get(cacheKey);
            if (result) {
              this.log.info('%s data from cache', modelName);
            } else {
              result = await next(params);
              this.log.info('%s data from db ,then save cache', modelName);
              await this.cacheManager.set(cacheKey, result, {
                ttl: curModelObj.ttl,
              });
            }
            return result;
          }
          if (['deleteMany', 'delete'].includes(action)) {
            await this.cacheManager.del(cacheKey);
          }
          return await next(params);
        }
        this.log.debug('%s data from db', modelName);
        return await next(params);
      };
    });
  }
}
