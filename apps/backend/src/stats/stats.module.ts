import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [StatsController],
  providers: [StatsService, PrismaService],
})
export class StatsModule { }
