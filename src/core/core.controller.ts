import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { CoreService } from './core.service';
import { Request, Response } from 'express';
import {
  Request as OAuthRequest,
  Response as OAuthResponse,
} from 'oauth2-server';
import { Authorize, User } from './core.type';
@Controller('oauth')
export class CoreController {
  constructor(private readonly coreService: CoreService) {}

  @Post('token')
  async token(@Req() request: Request, @Res() response: Response) {
    const token = await this.coreService.token(
      new OAuthRequest(request),
      new OAuthResponse(response),
    );
    return response.status(HttpStatus.OK).json(token);
  }

  @Get('authorize')
  async getAuthorize(@Query() authorize: Authorize, @Res() res: Response) {
    return this.coreService.getAuthorize(authorize, res);
  }

  @Get('login')
  async login(@Query() authorize: Authorize, @Res() res: Response) {
    const [renderName, renderOpt] = await this.coreService.login(authorize);
    return res.render(renderName, renderOpt);
  }

  @Post('session')
  async userSession(@Body() user: User, @Res() res: Response) {
    const [renderName, renderOpt] = await this.coreService.authUser(user);
    return res.render(renderName, renderOpt);
  }

  @Post('authorize')
  async authorize(@Req() request: Request, @Res() response: Response) {
    const token = await this.coreService.authorize(
      new OAuthRequest(request),
      new OAuthResponse(response),
      {
        authenticateHandler: {
          handle: () => {
            // Whatever you need to do to authorize / retrieve your user from post data here
            return false;
          },
        },
      },
    );
    return response.status(HttpStatus.OK).json(token);
  }

  @Get('private')
  async getPrimaryData(@Req() request: Request, @Res() response: Response) {
    await this.coreService
      .authenticate(new OAuthRequest(request), new OAuthResponse(response))
      .catch((error) => {
        console.error(error);
        throw error;
      });

    return response.status(HttpStatus.OK).json({
      ss: '',
    });
  }
}
