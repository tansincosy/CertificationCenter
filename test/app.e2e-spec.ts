import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { HttpExceptionFilter } from '@/filter/error.filter';
import { NestExpressApplication } from '@nestjs/platform-express';
import { clientId, clientSecret, PrismaValue } from './app.prisma.mock';
import * as session from 'express-session';
import * as HBS from 'hbs';
import { PrismaService } from '@/db/prisma.service';
import { LoggerService } from '@/log4j/log4j.service';

function getParams(url, params) {
  const res = new RegExp('(?:&|/?)' + params + '=([^&$]+)').exec(url);
  return res ? res[1] : '';
}

describe('CoreController (e2e)', () => {
  let app: NestExpressApplication;
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
    app.set('view engine', 'hbs');
    app.engine('hbs', HBS.__express);
    app.use(
      session({
        secret: 'test',
        resave: false,
        saveUninitialized: true,
      }),
    );
    await app.init();
  });
  describe('/token (POST) [model=password,refresh_token]', () => {
    it('设置 application/x-www-form-urlencoded 请求头', () => {
      return request(app.getHttpServer()).post('/token').expect(400).expect({
        error_code: 400,
        error_message:
          'Invalid request: content must be application/x-www-form-urlencoded',
      });
    });

    it('没有设置 Authorization参数，非法客户端', async () => {
      return request(app.getHttpServer())
        .post('/token')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .expect(400)
        .expect({
          error_code: 400,
          error_message: 'Invalid client: cannot retrieve client credentials',
        });
    });

    it('设置 Authorization非法客户端', async () => {
      return request(app.getHttpServer())
        .post('/token')
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
        .post('/token')
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
        .post('/token')
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
        .post('/token')
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
        .post('/token')
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
        .post('/token')
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
        .post('/token')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('Authorization', `Basic ${baseToken}`)
        .send('username=username&password=password&grant_type=password')
        .expect(200)
        .then((resp) => {
          const { body } = resp;
          const { refresh_token } = body;
          return request(app.getHttpServer())
            .post('/token')
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
                .post('/token')
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
        .post('/token')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('Authorization', `Basic ${baseToken}`)
        .send('username=username&password=password&grant_type=password')
        .expect(200)
        .then((resp) => {
          const { body } = resp;
          const { access_token } = body;
          return request(app.getHttpServer())
            .post('/authenticate')
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
        .post('/token')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('Authorization', `Basic ${baseToken}`)
        .send('username=username&password=password&grant_type=password')
        .expect(200)
        .then((resp) => {
          const { body } = resp;
          const { access_token } = body;
          return request(app.getHttpServer())
            .post('/authenticate')
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

  describe('/authorize  [model=authorization_code]', () => {
    it('should be return file ', () => {
      return request(app.getHttpServer()).get('/authorize').expect(200);
    });

    it('授权码验证流程', () => {
      const baseToken = Buffer.from(`${clientId}:${clientSecret}`).toString(
        'base64',
      );
      return request(app.getHttpServer())
        .post('/authorize')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({
          client_id: clientId,
          response_type: 'code',
          redirect_uri: 'http://127.0.0.1:3000/call',
          state: 'test_state',
          username: 'username',
          password: 'password',
        })
        .expect(302)
        .then((resp) => {
          const { location } = resp.header || {};
          expect(location).toBeDefined();
          if (location) {
            const codeVal = getParams(location, 'code');
            const state = getParams(location, 'state');
            expect(codeVal).not.toEqual('');
            expect(state).toEqual('test_state');
            return request(app.getHttpServer())
              .post('/token')
              .set('Content-Type', 'application/x-www-form-urlencoded')
              .set('Authorization', `Basic ${baseToken}`)
              .send(
                `code=${codeVal}&grant_type=authorization_code&redirect_uri=http://127.0.0.1:3000/call`,
              )
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
              });
          }
        });
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
