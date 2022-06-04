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

  @Post('authorize')
  authorize(@Req() request: Request, @Res() response: Response) {
    return this.coreService.authorize(
      new OAuthRequest(request),
      new OAuthResponse(response),
    );
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
