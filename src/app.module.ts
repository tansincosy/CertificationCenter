import { CacheModule, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import * as store from 'cache-manager-redis-store';
import { DataBaseModule } from './db/database.module';
import { LoggerModule } from './log4j/log4j.module';
import { AppAuthModelService } from './app.service.model';
import { ConfigModule } from '@nestjs/config';
import Configuration from './config/app.config';

const cacheRedisStore = () => {
  const appConfig = Configuration();
  const {
    cache: { redis },
  } = appConfig;
  if (process.env.NODE_ENV !== 'test' && redis) {
    return {
      store: store,
      ...redis,
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
    ConfigModule.forRoot({
      load: [Configuration],
      cache: true,
    }),
    LoggerModule,
    CacheModule.register(cacheRedisStore()),
  ],
  controllers: [AppController],
  providers: [AppService, AppAuthModelService],
})
export class AppModule {}
