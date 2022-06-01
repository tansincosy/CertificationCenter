import { Module } from '@nestjs/common';
import { CoreController } from './core.controller';
import { CoreService } from './core.service';
import { CoreModelService } from './core.service.auth';

@Module({
  controllers: [CoreController],
  providers: [CoreService, CoreModelService],
})
export class CoreModule {}
