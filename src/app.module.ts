import { CacheModule, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import * as store from 'cache-manager-redis-store';
import { DataBaseModule } from './db/database.module';
import { LoggerModule } from './log4j/log4j.module';
import { AppAuthModelService } from './app.service.model';

const cacheRedisStore = () => {
  if (
    process.env.NODE_ENV !== 'test' &&
    process.env.REDIS_STORE_HOST &&
    process.env.REDIS_STORE_PORT
  ) {
    return {
      store: store,
      host: process.env.REDIS_STORE_HOST,
      port: parseInt(process.env.REDIS_STORE_PORT, 10),
      isGlobal: true,
    };
  }
  return {
    isGlobal: true,
  };
};
@Module({
  imports: [
    DataBaseModule,
    LoggerModule,
    CacheModule.register(cacheRedisStore()),
  ],
  controllers: [AppController],
  providers: [AppService, AppAuthModelService],
})
export class AppModule {}
