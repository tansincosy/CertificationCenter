import { PrismaService } from './prisma.service';
import { Global, Module } from '@nestjs/common';
import { PrismaMiddleware } from './prisma.middleware';

@Global()
@Module({
  providers: [PrismaService, PrismaMiddleware],
  exports: [PrismaService],
})
export class DataBaseModule {}
