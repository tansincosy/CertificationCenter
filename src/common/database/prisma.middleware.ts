import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Cache } from 'cache-manager';
import { Logger, LoggerService } from '../log4j/log4j.service';

export type CacheMiddlewareOpt = {
  [key in Prisma.ModelName]?: {
    actions: Prisma.PrismaAction[];
    uniqueKey: string;
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
        if (modelName === model) {
          const { data } = args;
          if (action === 'create' && curModelObj.actions.includes('create')) {
            //设置唯一值
            this.cacheManager.set(
              `Prisma.ModelName.${modelName}:${
                data[curModelObj.uniqueKey] || ''
              }`,
              data,
              {
                ttl: curModelObj.ttl || -1,
              },
            );
            return await next(params);
          }
          if (
            [
              'findUnique',
              'findMany',
              'findFirst',
              'count',
              'findRaw',
              'queryRaw',
            ].includes(action)
          ) {
            const result = await this.cacheManager.get(
              `Prisma.ModelName.${modelName}:${
                data[curModelObj.uniqueKey] || ''
              }`,
            );
            if (result) {
              this.log.info('%s data from cache', modelName);
              return result;
            }
            this.log.debug('%s data from db', modelName);
            return await next(params);
          }
        }
        this.log.debug('%s data from db', modelName);
        return await next(params);
      };
    });
  }
}
