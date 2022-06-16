import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { HttpExceptionFilter } from '@/filter/error.filter';
import { LoggerService } from '@/common/log4j/log4j.service';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as session from 'express-session';
import { SESSION } from '@/constant/token.constant';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .useMocker((token) => {
        if (token === 'PrismaService') {
          console.log('sssss');
        }
      })
      .compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>();
    app.useGlobalFilters(new HttpExceptionFilter(app.get(LoggerService)));
    app.use(
      session({
        secret: SESSION.SECRET,
        resave: false,
        saveUninitialized: true,
      }),
    );
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .then((resp) => {
        expect(resp.statusCode).toEqual(200);
        expect({
          data: '',
        });
      });
  });

  it('/oauth/token (POST) model=password not any param', () => {
    return request(app.getHttpServer())
      .post('/oauth/token')
      .then((resp) => {
        expect(resp.statusCode).toEqual(400);
        expect(resp.body).toEqual({
          error_code: 400,
          error_message:
            'Invalid request: content must be application/x-www-form-urlencoded',
        });
      });
  });

  afterAll((done) => {
    app.close();
    done();
  });
});
