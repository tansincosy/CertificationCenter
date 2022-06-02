import { Module } from '@nestjs/common';
import { CoreController } from './core.controller';
import { CoreService } from './core.service';
import { CoreAuthModelService } from './core.service.auth-model';

@Module({
  controllers: [CoreController],
  providers: [CoreService, CoreAuthModelService],
})
export class CoreModule {}
