import {
  AuthorizationCode,
  AuthorizationCodeModel,
  Client,
  ClientCredentialsModel,
  Falsey,
  PasswordModel,
  RefreshToken,
  RefreshTokenModel,
  Token,
  User,
} from 'oauth2-server';
import { decrypt, md5, secretMask, toJSON, toObject } from '@/util/help.util';
import { USER } from '@/constant/token.constant';
import { Injectable } from '@nestjs/common';
import { LoggerService, Logger } from './log4j/log4j.service';
import { PrismaService } from './db/prisma.service';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class AppAuthModelService
  implements
    PasswordModel,
    RefreshTokenModel,
    AuthorizationCodeModel,
    ClientCredentialsModel
{
  private LOG: Logger;
  constructor(
    private readonly logService: LoggerService,
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.LOG = this.logService.getLogger(AppAuthModelService.name);
  }

  async getUserFromClient(client: Client): Promise<User | Falsey> {
    //由于客户端没有用户名,传值clientID
    this.LOG.debug('[getUserFromClient] Client =%s', client);
    return {
      username: client.id,
      authType: 'client',
    };
  }

  async getAuthorizationCode(
    authorizationCode: string,
  ): Promise<Falsey | AuthorizationCode> {
    this.LOG.debug(
      '[getAuthorizationCode] authorizationCode = %s',
      authorizationCode,
    );
    const authorizationObj = await this.prismaService.oAuthApprovals.findFirst({
      where: {
        code: authorizationCode,
      },
      select: {
        code: true,
        expiresAt: true,
        scope: true,
        userId: true,
        OAuthClientDetails: {
          select: {
            clientSecret: true,
            webServerRedirectUri: true,
            id: true,
            authorizedGrantTypes: true,
            accessTokenValidity: true,
            refreshTokenValidity: true,
          },
        },
      },
    });
    if (!authorizationObj || !authorizationCode) {
      this.LOG.warn('[getAuthorizationCode] authorizationObj is null');
      return false;
    }

    this.LOG.debug(
      '[getAuthorizationCode] authorizationObj = %s ,authorizationObj.OAuthClientDetails = %s',
      authorizationObj,
      authorizationObj.OAuthClientDetails,
    );

    const result = {
      authorizationCode: authorizationObj.code,
      expiresAt: new Date(authorizationObj.expiresAt),
      redirectUri: authorizationObj.OAuthClientDetails.webServerRedirectUri,
      scope: authorizationObj.scope,
      client: {
        id: authorizationObj.OAuthClientDetails.id,
        redirectUris: authorizationObj.OAuthClientDetails.webServerRedirectUri,
        grants: authorizationObj.OAuthClientDetails.authorizedGrantTypes,
        accessTokenLifetime:
          authorizationObj.OAuthClientDetails.accessTokenValidity,
        refreshTokenLifetime:
          authorizationObj.OAuthClientDetails.refreshTokenValidity,
      },
      user: {
        id: authorizationObj.userId,
      },
    };
    this.LOG.debug('result =', result);
    return result;
  }

  async saveAuthorizationCode(
    code: Pick<
      AuthorizationCode,
      'authorizationCode' | 'expiresAt' | 'redirectUri' | 'scope'
    >,
    client: Client,
    user: User,
  ): Promise<Falsey | AuthorizationCode> {
    this.LOG.debug('[saveAuthorizationCode] init');
    if (!code.authorizationCode) {
      this.LOG.warn('[saveAuthorizationCode] code.authorizationCode is null');
      return false;
    }
    const userInfo = await this.prismaService.user.findFirst({
      where: {
        username: user.username,
      },
    });
    const { id } = await this.prismaService.oAuthApprovals.create({
      data: {
        expiresAt: code.expiresAt,
        clientId: client.id,
        userId: userInfo ? userInfo.id : '',
        scope: code.scope ? code.scope.toString() : '',
        code: code.authorizationCode,
      },
      select: {
        id: true,
      },
    });
    if (id) {
      this.LOG.info('[saveAuthorizationCode] create success');
    } else {
      this.LOG.warn('[saveAuthorizationCode] create failed from db');
      return false;
    }

    return {
      authorizationCode: code.authorizationCode,
      expiresAt: new Date(code.expiresAt),
      redirectUri: code.redirectUri,
      scope: code.scope ? code.scope.toString() : '',
      client: {
        id: client.id,
        redirectUris: client.redirectUris,
        grants: client.grants,
        accessTokenLifetime: client.accessTokenLifetime,
        refreshTokenLifetime: client.refreshTokenLifetime,
      },
      user: {
        id: user.id,
      },
    };
  }

  async revokeAuthorizationCode(code: AuthorizationCode): Promise<boolean> {
    const { id } = await this.prismaService.oAuthApprovals.delete({
      where: {
        code: code.authorizationCode,
      },
      select: {
        id: true,
      },
    });

    if (!id) {
      this.LOG.warn('[revokeAuthorizationCode] delete code failed ');
    } else {
      this.LOG.debug('[revokeAuthorizationCode] delete code success');
    }
    return true;
  }

  async revokeToken(token: Token | RefreshToken): Promise<boolean> {
    if (!token) {
      this.LOG.warn('[revokeToken] token is null');
      return false;
    }

    this.LOG.debug('[revokeToken] token = %s', token);
    const { accessToken, refreshToken } = token;

    if (accessToken) {
      await this.prismaService.oAuthToken.deleteMany({
        where: {
          tokenId: accessToken,
        },
      });
      this.LOG.info('revokeToken accessToken success');
    }
    if (refreshToken) {
      await this.prismaService.oAuthToken.deleteMany({
        where: {
          refreshToken: refreshToken,
        },
      });
      this.LOG.info('revokeToken refreshToken success');
    }
    this.LOG.debug('[revokeToken] process end');
    return true;
  }

  async getUser(username: string, password: string): Promise<User | Falsey> {
    this.LOG.debug(
      '[getUser] username = %s, password = %s',
      username,
      secretMask(password),
    );

    const user = await this.prismaService.user.findFirst({
      where: {
        username,
      },
    });

    if (!user) {
      return {
        id: '222',
        username: 'username',
      };
    }

    const isSupportUserLocked = this.configService.get(
      'auth.support.lock.user',
    );

    if (!user) {
      this.LOG.warn('[getUser] user is not found!');
      return false;
    }
    if (user.enable !== USER.ENABLE) {
      this.LOG.warn('[getUser] user is disabled!');
      return false;
    }
    if (isSupportUserLocked && user.isLocked === USER.LOCKED) {
      this.LOG.warn('[getUser] user is locked!');
      return false;
    }

    const cryptoConfigKey = this.configService.get('encrypted.token.secret');
    const decryptPassword =
      process.env.NODE_ENV === 'test'
        ? user.password
        : decrypt(cryptoConfigKey, user.password);
    if (user.password !== decryptPassword) {
      this.LOG.warn('[getUser] password is not correct!');
      return false;
    }

    return {
      id: user.id,
      username: user.username,
    };
  }

  /**
   * 验证设备终端
   * @param clientId 设备id
   * @param clientSecret 设备密钥
   * @returns
   */

  async getClient(
    clientId: string,
    clientSecret: string,
  ): Promise<Client | Falsey> {
    this.LOG.debug(
      '[getClient] clientId = %s , clientSecret = %s',
      secretMask(clientId),
      secretMask(clientSecret),
    );
    const client = await this.prismaService.oAuthClientDetails.findFirst({
      where: {
        id: clientId,
      },
    });

    //NOTE: code 只有clientId 此处验证clientSecret 是否正确？
    if (!client || (clientSecret && client.clientSecret !== clientSecret)) {
      this.LOG.warn('client is not found! or client secret is valid');
      return false;
    }

    const isSupportClientLocked = this.configService.get(
      'auth.support.lock.client',
    );
    if (isSupportClientLocked && client.isLocked) {
      //编写客户端锁定
      this.LOG.warn('client is locked');
      return false;
    }

    return {
      id: client.id,
      clientSecret: client.clientSecret,
      grants: client.authorizedGrantTypes?.split(',') || '',
      redirectUris: client.webServerRedirectUri || '',
      scope: client.scope || '',
      accessTokenLifetime: client.accessTokenValidity || 0,
      refreshTokenLifetime: client.refreshTokenValidity || 0,
    };
  }

  /**
   * 保存token流程
   *
   * @param token
   * @param client
   * @param user
   * @returns
   */
  async saveToken(
    token: Token,
    client: Client,
    user: User,
  ): Promise<Falsey | Token> {
    this.LOG.debug('[saveToken] process begin');
    //获取grants，判断是够是够需要refresh_token
    const grants = client.grants;
    let isNeedRefreshToken = false;
    this.LOG.debug('token=%s grants = %s', token, grants);
    if (grants.includes('refresh_token')) {
      this.LOG.info('[saveToken] current client grants contain refresh_token');
      isNeedRefreshToken = true;
    } else {
      delete token.refreshToken;
    }

    const { id } = await this.prismaService.oAuthToken.create({
      data: {
        username: user.username,
        clientId: client.id,
        authentication: '',
        tokenId: token.accessToken,
        refreshToken:
          isNeedRefreshToken && user.authType !== 'client'
            ? token.refreshToken
            : '',
        token: toJSON(token),
        //根据当前的username、client_id与scope通过MD5加密生成该字段的值
        authenticationId: md5(
          user.username + client.id + token.scope,
          user.username,
        ),
      },
      select: {
        id: true,
      },
    });

    this.LOG.debug('[saveToken] process success');
    if (!id) {
      this.LOG.warn('[saveToken] save token failed!');
      return false;
    }
    return {
      ...token,
      user,
      client,
    };
  }

  async getRefreshToken(refreshToken: string): Promise<Falsey | RefreshToken> {
    this.LOG.debug('[getRefreshToken] process begin');
    const tokenDB = await this.prismaService.oAuthToken.findFirst({
      where: {
        refreshToken,
      },
      select: {
        refreshToken: true,
        username: true,
        token: true,
        OAuthClientDetails: {
          select: {
            id: true,
            clientSecret: true,
            authorizedGrantTypes: true,
          },
        },
      },
    });
    if (!tokenDB) {
      this.LOG.warn('[getRefreshToken] refreshToken is not found!');
      return false;
    }
    this.LOG.debug(
      '[getRefreshToken] process success, refreshTokenObj = %s',
      tokenDB,
    );
    const tokenObj = toObject<RefreshToken>(tokenDB.token);
    return {
      refreshToken: tokenDB.refreshToken,
      refreshTokenExpiresAt: new Date(tokenObj.refreshTokenExpiresAt),
      scope: tokenObj.scope,
      client: {
        id: tokenDB.OAuthClientDetails.id,
        clientSecret: tokenDB.OAuthClientDetails.clientSecret,
        grants: tokenDB.OAuthClientDetails.authorizedGrantTypes,
      },
      user: {
        username: tokenDB.username,
      },
    };
  }

  async getAccessToken(accessToken: string): Promise<Falsey | Token> {
    this.LOG.debug(
      '[getAccessToken] accessToken = %s',
      secretMask(accessToken),
    );
    const token = await this.prismaService.oAuthToken.findFirst({
      where: {
        tokenId: accessToken,
      },
      select: {
        username: true,
        token: true,
        OAuthClientDetails: {
          select: {
            id: true,
            clientSecret: true,
            authorizedGrantTypes: true,
            scope: true,
          },
        },
      },
    });
    if (!token) {
      this.LOG.warn('[getAccessToken] token is not found!');
      return false;
    }
    const tokenObj = toObject<Token>(token.token);
    this.LOG.debug('tokenObj = %s ,token = %s', tokenObj, token);
    return {
      accessToken: tokenObj.accessToken,
      accessTokenExpiresAt: new Date(tokenObj.accessTokenExpiresAt),
      user: {
        username: token.username,
      },
      client: {
        id: token.OAuthClientDetails.id,
        clientSecret: token.OAuthClientDetails.clientSecret,
        grants: token.OAuthClientDetails.authorizedGrantTypes,
      },
      scope: token.OAuthClientDetails.scope,
    };
  }
  /**
   *  Invoked during request authentication
   * to check if the provided access token was authorized the requested scopes.
   */
  async verifyScope(token: Token, scope: string | string[]): Promise<boolean> {
    this.LOG.debug('[verifyScope] token = %s , scope = %s', token, scope);
    if (!token.scope) {
      this.LOG.warn('[verifyScope] token.scope is empty!');
      return false;
    }
    const requestedScopes = Array.isArray(scope) ? scope : scope?.split(',');
    const authorizedScopes = Array.isArray(token.scope)
      ? token.scope
      : token.scope?.split(',');
    this.LOG.info(
      '[verifyScope] authorizedScopes = %s,requestedScopes = %s',
      authorizedScopes,
      requestedScopes,
    );
    return requestedScopes.every((s) => authorizedScopes.indexOf(s) >= 0);
  }
}
