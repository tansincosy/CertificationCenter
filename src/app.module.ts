import { CacheModule, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DataBaseModule } from './common/database/database.module';
import { LoggerModule } from './common/log4j/log4j.module';
import * as store from 'cache-manager-redis-store';

const cacheRedisStore = () => {
  if (process.env.CACHE_STORE_HOST && process.env.CACHE_STORE_PORT) {
    return {
      store: store,
      host: process.env.CACHE_STORE_HOST,
      port: parseInt(process.env.CACHE_STORE_PORT, 10),
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
  providers: [AppService],
})
export class AppModule {}
