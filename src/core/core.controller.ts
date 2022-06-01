import { Controller, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'oauth2-server';
import { CoreService } from './core.service';
@Controller('oauth')
export class CoreController {
  constructor(private readonly coreService: CoreService) {}

  @Post('token')
  token(@Req() request: Request, @Res() response: Response) {
    return this.coreService.token(new Request(request), new Response(response));
  }

  @Post('authorize')
  authorize(@Req() request: Request, @Res() response: Response) {
    return this.coreService.authorize(request, response);
  }
}
