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
import { AppService } from './app.service';
import { Request, Response } from 'express';
import { AuthBody, Authorize, QueryParam, SessionDTO, User } from './app.type';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('token')
  async token(@Req() request: Request, @Res() response: Response) {
    return this.appService.doToken(request, response);
  }

  @Get('authorize')
  async getAuthorize(
    @Query() authorize: Authorize,
    @Res() res: Response,
    @Session() session: SessionDTO,
  ) {
    return this.appService.getAuthorize(authorize, res, session);
  }

  @Get('login')
  async login(@Query() authorize: Authorize, @Res() res: Response) {
    return this.appService.login(authorize, res);
  }

  @Post('session')
  async userSession(
    @Body() user: User,
    @Query() query: QueryParam,
    @Res() res: Response,
    @Session() session: SessionDTO,
  ) {
    return this.appService.authUser(user, res, query, session);
  }

  @Post('authorize')
  async authorize(
    @Req() request: Request,
    @Res() response: Response,
    @Session() session: SessionDTO,
  ) {
    return this.appService.doAuthorize(request, response, session);
  }

  @Post('authenticate')
  async authenticate(@Body() authBody: AuthBody) {
    return this.appService.doAuthenticate(authBody);
  }
}
