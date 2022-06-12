import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as session from 'express-session';
import { join } from 'path';
import { AppModule } from './app.module';
import { getConfig } from './common/config/log4js.config';
import { SESSION } from './constant/token.constant';
import { Log } from './util/log.util';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: new Log(getConfig()),
  });

  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('hbs');
  app.use(
    session({
      secret: SESSION.SECRET,
      resave: false,
      saveUninitialized: true,
    }),
  );

  await app.listen(process.env.APP_PORT || 3000);
  new Log(getConfig())
    .getLogger('bootstrap')
    .info(`Server running on port ${process.env.APP_PORT || 3000}`);
}
bootstrap();
