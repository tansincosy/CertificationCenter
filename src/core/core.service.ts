import { Injectable } from '@nestjs/common';
import * as OAuth2Server from 'oauth2-server';
import { CoreAuthModelService } from './core.service.auth-model';

@Injectable()
export class CoreService extends OAuth2Server {
  constructor(readonly model: CoreAuthModelService) {
    super({
      model,
    });
  }
}
