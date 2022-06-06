import { Controller, Get, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { CoreService } from './core.service';
import { Request, Response } from 'express';
import {
  Request as OAuthRequest,
  Response as OAuthResponse,
} from 'oauth2-server';
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
  getAuthorize() {
    return '';
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
