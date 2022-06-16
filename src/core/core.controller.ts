import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  Session,
} from '@nestjs/common';
import { CoreService } from './core.service';
import { Request, Response } from 'express';
import { AuthBody, Authorize, QueryParam, SessionDTO, User } from './core.type';
@Controller('oauth')
export class CoreController {
  constructor(private readonly coreService: CoreService) {}

  @Post('token')
  async token(@Req() request: Request, @Res() response: Response) {
    return this.coreService.doToken(request, response);
  }

  @Get('authorize')
  async getAuthorize(
    @Query() authorize: Authorize,
    @Res() res: Response,
    @Session() session: SessionDTO,
  ) {
    return this.coreService.getAuthorize(authorize, res, session);
  }

  @Get('login')
  async login(@Query() authorize: Authorize, @Res() res: Response) {
    return this.coreService.login(authorize, res);
  }

  @Post('session')
  async userSession(
    @Body() user: User,
    @Query() query: QueryParam,
    @Res() res: Response,
    @Session() session: SessionDTO,
  ) {
    return this.coreService.authUser(user, res, query, session);
  }

  @Post('authorize')
  async authorize(
    @Req() request: Request,
    @Res() response: Response,
    @Session() session: SessionDTO,
  ) {
    return this.coreService.doAuthorize(request, response, session);
  }

  @Post('authenticate')
  async authenticate(@Body() authBody: AuthBody) {
    return this.coreService.doAuthenticate(authBody);
  }
}
