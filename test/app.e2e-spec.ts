import { PrismaService } from '@/common/database/prisma.service';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { HttpExceptionFilter } from '@/filter/error.filter';
import { LoggerService } from '@/common/log4j/log4j.service';
import { NestExpressApplication } from '@nestjs/platform-express';
import { clientId, clientSecret, PrismaValue } from './app.prisma.mock';

describe('CoreController (e2e)', () => {
  let app: INestApplication;
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      //模拟数据
      .useValue(PrismaValue)
      .compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>();
    app.useGlobalFilters(new HttpExceptionFilter(app.get(LoggerService)));
    await app.init();
  });
  describe('/oauth/token (POST) [model=password,refresh_token]', () => {
    it('设置 application/x-www-form-urlencoded 请求头', () => {
      return request(app.getHttpServer())
        .post('/oauth/token')
        .expect(400)
        .expect({
          error_code: 400,
          error_message:
            'Invalid request: content must be application/x-www-form-urlencoded',
        });
    });

    it('没有设置 Authorization参数，非法客户端', async () => {
      return request(app.getHttpServer())
        .post('/oauth/token')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .expect(400)
        .expect({
          error_code: 400,
          error_message: 'Invalid client: cannot retrieve client credentials',
        });
    });

    it('设置 Authorization非法客户端', async () => {
      return request(app.getHttpServer())
        .post('/oauth/token')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set(
          'Authorization',
          'Basic Y2w0Y3ZkbmFqMDAwMHo1YjhkMjl1Z3lvNzpjbGllbnRTZWNyZXQ=',
        )
        .expect(401)
        .expect({
          error_code: 401,
          error_message: 'Invalid client: client is invalid',
        });
    });

    it('设置正确 Authorization客户端', async () => {
      const baseToken = Buffer.from(`${clientId}:${clientSecret}`).toString(
        'base64',
      );
      return request(app.getHttpServer())
        .post('/oauth/token')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('Authorization', `Basic ${baseToken}`)
        .expect(400)
        .expect({
          error_code: 400,
          error_message: 'Missing parameter: `grant_type`',
        });
    });

    it('设置正确 grant_type 客户端', async () => {
      const baseToken = Buffer.from(`${clientId}:${clientSecret}`).toString(
        'base64',
      );
      return request(app.getHttpServer())
        .post('/oauth/token')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('Authorization', `Basic ${baseToken}`)
        .send('grant_type=password')
        .expect(400)
        .expect({
          error_code: 400,
          error_message: 'Missing parameter: `username`',
        });
    });

    it('设置错误 grant_type 客户端', async () => {
      const baseToken = Buffer.from(`${clientId}:${clientSecret}`).toString(
        'base64',
      );
      return request(app.getHttpServer())
        .post('/oauth/token')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('Authorization', `Basic ${baseToken}`)
        .send('username=username&password=password&grant_type=password1')
        .expect(400)
        .expect({
          error_code: 400,
          error_message: 'Unsupported grant type: `grant_type` is invalid',
        });
    });

    it('设置错误 username password 客户端', async () => {
      const baseToken = Buffer.from(`${clientId}:${clientSecret}`).toString(
        'base64',
      );
      return request(app.getHttpServer())
        .post('/oauth/token')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('Authorization', `Basic ${baseToken}`)
        .send('username=username1&password=password&grant_type=password')
        .expect(400)
        .expect({
          error_code: 400,
          error_message: 'Invalid grant: user credentials are invalid',
        });
    });

    it('设置正确 username password 客户端', async () => {
      const baseToken = Buffer.from(`${clientId}:${clientSecret}`).toString(
        'base64',
      );
      return request(app.getHttpServer())
        .post('/oauth/token')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('Authorization', `Basic ${baseToken}`)
        .send('username=username&password=password&grant_type=password')
        .expect(200)
        .expect((resp) => {
          const { body } = resp;
          expect(body).toEqual(
            expect.objectContaining({
              expires_in: 1800,
              token_type: 'Bearer',
            }),
          );
        });
    });

    it('[model=password,refresh_token] refresh token 整体流程', async () => {
      const baseToken = Buffer.from(`${clientId}:${clientSecret}`).toString(
        'base64',
      );
      return request(app.getHttpServer())
        .post('/oauth/token')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('Authorization', `Basic ${baseToken}`)
        .send('username=username&password=password&grant_type=password')
        .expect(200)
        .then((resp) => {
          const { body } = resp;
          const { refresh_token } = body;
          return request(app.getHttpServer())
            .post('/oauth/token')
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .set('Authorization', `Basic ${baseToken}`)
            .send(`refresh_token=${refresh_token}&grant_type=refresh_token`)
            .expect(200)
            .then((resp) => {
              const { body } = resp;
              const { access_token } = body;
              expect(access_token).toBeDefined();
              expect(body).toEqual(
                expect.objectContaining({
                  expires_in: 1800,
                  token_type: 'Bearer',
                }),
              );
              return request(app.getHttpServer())
                .post('/oauth/token')
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .set('Authorization', `Basic ${baseToken}`)
                .send(
                  `refresh_token=${body.refresh_token}&grant_type=refresh_token`,
                )
                .expect(200)
                .then((resp) => {
                  const { body } = resp;
                  expect(body.access_token).toBeDefined();
                  expect(body).toEqual(
                    expect.objectContaining({
                      expires_in: 1800,
                      token_type: 'Bearer',
                    }),
                  );
                });
            });
        });
    });

    it('验证 access_token ', async () => {
      const baseToken = Buffer.from(`${clientId}:${clientSecret}`).toString(
        'base64',
      );
      return request(app.getHttpServer())
        .post('/oauth/token')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('Authorization', `Basic ${baseToken}`)
        .send('username=username&password=password&grant_type=password')
        .expect(200)
        .then((resp) => {
          const { body } = resp;
          const { access_token } = body;
          return request(app.getHttpServer())
            .post('/oauth/authenticate')
            .set('Content-Type', 'application/json')
            .send({
              token: access_token,
            })
            .expect(201)
            .expect((resp) => {
              const respBody = resp.body;
              expect(respBody.accessToken).toBeDefined();
            });
        });
    });

    it('验证 access_token and scope ', async () => {
      const baseToken = Buffer.from(`${clientId}:${clientSecret}`).toString(
        'base64',
      );
      return request(app.getHttpServer())
        .post('/oauth/token')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('Authorization', `Basic ${baseToken}`)
        .send('username=username&password=password&grant_type=password')
        .expect(200)
        .then((resp) => {
          const { body } = resp;
          const { access_token } = body;
          return request(app.getHttpServer())
            .post('/oauth/authenticate')
            .set('Content-Type', 'application/json')
            .send({
              token: access_token,
              scope: 'test:write',
            })
            .expect(201)
            .expect((resp) => {
              const respBody = resp.body;
              expect(respBody.accessToken).toBeDefined();
            });
        });
    });
  });

  describe('/oauth/token (POST) [model=code]', () => {
    it('test', () => {
      return expect(true);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
