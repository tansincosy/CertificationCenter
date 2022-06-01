import { Logger, LoggerService } from '@/common/log4j/log4j.service';
import {
  AuthorizationCode,
  AuthorizationCodeModel,
  Client,
  Falsey,
  PasswordModel,
  RefreshToken,
  RefreshTokenModel,
  Token,
  User,
} from 'oauth2-server';
import { PrismaService } from '@/common/database/prisma.service';
import { decrypt, md5, secretMask, toJSON, toObject } from '@/util/help.util';
import { TOKEN, USER } from '@/constant/token.constant';
import { Injectable } from '@nestjs/common';
@Injectable()
export class CoreModelService
  implements PasswordModel, RefreshTokenModel, AuthorizationCodeModel
{
  private LOG: Logger;
  constructor(
    private readonly logService: LoggerService,
    private readonly prismaService: PrismaService,
  ) {
    this.LOG = this.logService.getLogger(CoreModelService.name);
  }

  async getAuthorizationCode(
    authorizationCode: string,
  ): Promise<Falsey | AuthorizationCode> {
    this.LOG.debug(
      '[getAuthorizationCode] authorizationCode = %s',
      authorizationCode,
    );
    const authorizationObj = await this.prismaService.oAuthCode.findFirst({
      where: {
        code: authorizationCode,
      },
    });
    if (!authorizationObj || !authorizationCode) {
      return false;
    }

    return null;
  }

  async saveAuthorizationCode(
    code: Pick<
      AuthorizationCode,
      'authorizationCode' | 'expiresAt' | 'redirectUri' | 'scope'
    >,
    client: Client,
    user: User,
  ): Promise<Falsey | AuthorizationCode> {
    this.LOG.debug('[saveAuthorizationCode] ');
    return false;
  }

  async revokeAuthorizationCode(code: AuthorizationCode): Promise<boolean> {
    await this.prismaService.oAuthCode.delete({
      where: {
        code: code.authorizationCode,
      },
    });
    this.LOG.debug('[revokeAuthorizationCode] delete code success');

    return true;
  }

  async revokeToken(token: Token | RefreshToken): Promise<boolean> {
    if (!token) {
      this.LOG.warn('[revokeToken] token is null');
      return false;
    }

    const delAccessToken = this.prismaService.oAuthAccessToken.delete({
      where: {
        tokenId: token.accessToken,
      },
    });

    const delRefreshToken = this.prismaService.oAuthRefreshToken.delete({
      where: {
        tokenId: token.refreshToken,
      },
    });

    await this.prismaService.$transaction([delAccessToken, delRefreshToken]);
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

    if (user) {
      this.LOG.warn('[getUser] user is not found!');
      return false;
    }
    if (user.enable !== USER.ENABLE) {
      this.LOG.warn('[getUser] user is disabled!');
      return false;
    }
    if (user.isLocked === USER.LOCKED) {
      this.LOG.warn('[getUser] user is locked!');
      return false;
    }
    const cryptoConfigKey = process.env.TOKEN_SECRET || TOKEN.SECRET;
    const decryptPassword = decrypt(cryptoConfigKey, user.password);
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

    if (!client || client.clientSecret !== clientSecret) {
      this.LOG.warn('client is not found! or client secret is valid');
      return false;
    }

    return {
      id: client.id,
      clientSecret: client.clientSecret,
      grants: client.authorizedGrantTypes?.split(',') || '',
      redirectUris: client.webServerRedirectUri || '',
      scope: client.scope?.split(',') || '',
      accessTokenLifetime: client.accessTokenValidity || 0,
      refreshTokenLifetime: client.refreshTokenValidity || 0,
    };
  }
  async saveToken(
    token: Token,
    client: Client,
    user: User,
  ): Promise<Falsey | Token> {
    this.LOG.debug('[saveToken] process begin');
    const { id } = await this.prismaService.oAuthAccessToken.create({
      data: {
        username: user.username,
        clientId: client.id,
        tokenId: token.accessToken,
        refreshToken: token.refreshToken,
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
    this.LOG.debug('[saveToken] process save refresh token');

    //NOTE: 刷新token? 什么时候添加此处表中？
    await this.prismaService.oAuthRefreshToken.create({
      data: {
        tokenId: token.refreshToken,
        token: toJSON(token),
      },
    });

    this.LOG.debug('[saveToken] process end');
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
    const refreshTokenObj =
      await this.prismaService.oAuthRefreshToken.findFirst({
        where: {
          tokenId: refreshToken,
        },
      });

    const tokenObj = toObject<RefreshToken>(refreshTokenObj.token);
    return {
      ...tokenObj,
      refreshTokenExpiresAt: new Date(tokenObj.refreshTokenExpiresAt),
    };
  }

  async getAccessToken(accessToken: string): Promise<Falsey | Token> {
    this.LOG.debug(
      '[getAccessToken] accessToken = %s',
      secretMask(accessToken),
    );
    const token = await this.prismaService.oAuthAccessToken.findFirst({
      where: {
        tokenId: accessToken,
      },
    });

    if (!token) {
      this.LOG.warn('[getAccessToken] token is not found!');
      return false;
    }

    const tokenObj = toObject<Token>(token.token);

    return {
      ...tokenObj,
      accessToken,
      accessTokenExpiresAt: new Date(tokenObj.accessTokenExpiresAt),
      scope: tokenObj.scope,
    };
  }
  async verifyScope(token: Token, scope: string | string[]): Promise<boolean> {
    return true;
  }
}
