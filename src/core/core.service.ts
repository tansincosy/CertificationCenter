import { PrismaService } from '@/common/database/prisma.service';
import { Logger, LoggerService } from '@/common/log4j/log4j.service';
import { toObject } from '@/util/help.util';
import { Injectable } from '@nestjs/common';
import * as OAuth2Server from 'oauth2-server';
import { CoreAuthModelService } from './core.service.auth-model';
import { Authorize, ClientDetail, User } from './core.type';
import { Response } from 'express';

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

  async authUser(user: User): Promise<[string, object]> {
    const authResult = await this.model.getUser(user.username, user.password);
    if (!authResult) {
      this.LOG.warn('username or password is wrong');
      return [
        'auth-login',
        {
          message: '用户名或密码错误',
        },
      ];
    }
    return [
      'auth-authorize',
      {
        username: user.username,
      },
    ];
  }

  async mainAuthorize(authorize: Authorize): Promise<[string, object]> {
    return ['auth-login', { username: authorize.client_id }];
  }

  async login(authorize: Authorize): Promise<[string, object]> {
    const { client_id } = authorize;
    this.LOG.info('[login]authorize = %s ', authorize);
    if (!client_id) {
      return ['auth-404', null];
    }
    const clientInfo = await this.prismaService.oAuthClientDetails.findUnique({
      where: {
        id: client_id,
      },
    });
    const { clientName, clientLogo } = toObject<ClientDetail>(
      clientInfo.additionalInformation,
    );
    return ['auth-login', { clientName, clientLogo }];
  }

  //note:判断用户是否登录，如果没有登录跳转到 login页面，如果已经登录则跳转到授权页面
  async getAuthorize(authorize: Authorize, res: Response) {
    const { client_id, redirect_uri } = authorize;
    if (!client_id || !redirect_uri) {
      this.LOG.error('[getAuthorize] client_id or redirect_uri is null');
      return res.render('auth-404');
    }
    // res.render(renderName, renderOpt);
  }
}
