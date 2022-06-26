import { PrismaService } from './prisma.service';
import { Global, Module } from '@nestjs/common';
import { PrismaMiddleware } from './prisma.middleware';
import { ConfigModule } from '@nestjs/config';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [PrismaService, PrismaMiddleware],
  exports: [PrismaService],
})
export class DataBaseModule {}
