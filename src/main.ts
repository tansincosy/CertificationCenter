import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as session from 'express-session';
import { AppModule } from './app.module';
import * as HBS from 'hbs';
import { HttpExceptionFilter } from './filter/error.filter';
import { LoggerService } from './log4j/log4j.service';
import { ConfigService } from '@nestjs/config';

function setHBSEngine(app) {
  app.set('view engine', 'hbs');
  app.engine('hbs', HBS.__express);
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const logService = app.get(LoggerService);
  app.useLogger(logService);
  app.useStaticAssets('resources/public');
  app.setBaseViewsDir('resources/views');
  app.useGlobalFilters(new HttpExceptionFilter(logService));
  setHBSEngine(app);
  const appConfig = app.get(ConfigService);
  app.use(
    session({
      ...appConfig.get('encrypted.session'),
    }),
  );
  await app.listen(appConfig.get('app.port') || 3000);
  logService
    .getLogger(bootstrap.name)
    .info(`Server running on port ${appConfig.get('app.port') || 3000}`);
}
bootstrap();
