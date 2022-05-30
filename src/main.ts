import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getConfig } from './common/config/log4js.config';
import { Log } from './util/log.util';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new Log(getConfig()),
  });
  await app.listen(process.env.APP_PORT || 3000);
}
bootstrap();
