import { Injectable } from '@nestjs/common';
import * as OAuth2Server from 'oauth2-server';
import { CoreModelService } from './core.service.auth';

@Injectable()
export class CoreService extends OAuth2Server {
  constructor(readonly model: CoreModelService) {
    super({
      model,
    });
  }
}
