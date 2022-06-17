import { PrismaService } from '@/common/database/prisma.service';
import { Logger, LoggerService } from '@/common/log4j/log4j.service';
import { toObject } from '@/util/help.util';
import { HttpStatus, Injectable } from '@nestjs/common';
import * as OAuth2Server from 'oauth2-server';
import { CoreAuthModelService } from './core.service.auth-model';
import {
  AuthBody,
  Authorize,
  ClientDetail,
  QueryParam,
  SessionDTO,
  User,
} from './core.type';
import { Response, Request } from 'express';
import {
  Request as OAuthRequest,
  Response as OAuthResponse,
} from 'oauth2-server';

@Injectable()
export class CoreService extends OAuth2Server {
  private LOG: Logger;
  constructor(
    readonly model: CoreAuthModelService,
    private readonly logService: LoggerService,
    private readonly prismaService: PrismaService,
  ) {
    super({
      model,
    });
    this.LOG = this.logService.getLogger(CoreService.name);
  }

  async authUser(
    user: User,
    res: Response,
    queryParam: QueryParam,
    session: SessionDTO,
  ) {
    const authResult = await this.model.getUser(user.username, user.password);
    if (!authResult && process.env.APP_ENV !== 'dev') {
      this.LOG.error('username or password is wrong');
      return res.render('auth-login', {
        message: '用户名或密码错误',
      });
    }
    this.LOG.info('login success, set session!!');
    session.username = user.username;
    return res.redirect(
      `/oauth/authorize?client_id=${queryParam.client_id}&redirect_uri=${queryParam.redirect_uri}`,
    );
  }

  async login(authorize: Authorize, res: Response) {
    const { client_id } = authorize;
    this.LOG.info('[login]authorize = %s ', authorize);
    if (!client_id) {
      this.LOG.error('[login] client_id is null');
      return res.render('auth-404');
    }
    const clientInfo = await this.prismaService.oAuthClientDetails.findFirst({
      where: {
        id: client_id,
        webServerRedirectUri: authorize.redirect_uri,
      },
    });
    const { clientName, clientLogo } = toObject<ClientDetail>(
      clientInfo.additionalInformation,
    );
    return res.render('auth-login', {
      clientName,
      clientLogo,
      clientId: client_id,
      redirectUrl: clientInfo.webServerRedirectUri,
    });
  }

  /**
   * 判断用户是否登录，如果没有登录跳转到 login页面，如果已经登录则跳转到授权页面
   * @param authorize
   * @param res
   * @param session
   * @returns
   */
  async getAuthorize(authorize: Authorize, res: Response, session: SessionDTO) {
    const { client_id, redirect_uri } = authorize;
    if (!client_id || !redirect_uri) {
      this.LOG.error('[getAuthorize] client_id or redirect_uri is null');
      return res.render('auth-404');
    }

    const clientInfo = await this.prismaService.oAuthClientDetails.findFirst({
      where: {
        id: client_id,
        webServerRedirectUri: redirect_uri,
      },
    });

    if (!clientInfo) {
      this.LOG.error('[getAuthorize] clientInfo is null');
      return res.render('auth-404');
    }
    if (session.username) {
      const user = await this.prismaService.user.findFirst({
        where: {
          username: session.username,
        },
      });
      if (!user) {
        this.LOG.error('[getAuthorize] user is null');
        //返回登录页面
        return res.redirect(
          `/oauth/login?client_id=${client_id}&redirect_uri=${redirect_uri}`,
        );
      }
      const { clientName, clientLogo } = toObject<ClientDetail>(
        clientInfo.additionalInformation,
      );
      return res.render('auth-authorize', {
        client: {
          clientName,
          clientLogo,
        },
        user,
      });
    }
    this.LOG.info('session is not login, redirect to login page');
    return res.redirect(
      `/oauth/login?client_id=${client_id}&redirect_uri=${redirect_uri}`,
    );
  }

  async doAuthenticate(authBody: AuthBody) {
    const { token, scope } = authBody;
    const tokenObj = await super.authenticate(
      new OAuthRequest({
        headers: {
          authorization: `Bearer ${token}`,
        },
        method: 'GET',
        query: {},
      }),
      new OAuthResponse(),
      {
        scope,
      },
    );
    return tokenObj;
  }

  async doAuthorize(request: Request, response: Response, session: SessionDTO) {
    const token = await super.authorize(
      new OAuthRequest(request),
      new OAuthResponse(response),
      {
        authenticateHandler: {
          handle: () => {
            // Whatever you need to do to authorize / retrieve your user from post data here
            return {
              username: session.username,
            };
          },
        },
      },
    );
    return (
      response
        .status(HttpStatus.MOVED_PERMANENTLY)
        //地址可访问
        .redirect(
          `https://${token.redirectUri}?code=${token.authorizationCode}`,
        )
    );
  }

  async doToken(request: Request, response: Response) {
    const token = await super.token(
      new OAuthRequest(request),
      new OAuthResponse(response),
    );
    const TokenResponse = {
      access_token: token.accessToken,
      expires_in: token.client.accessTokenLifetime || 0,
      refresh_token: token.refreshToken,
      token_type: 'Bearer',
    };
    return response.status(HttpStatus.OK).json(TokenResponse);
  }
}
