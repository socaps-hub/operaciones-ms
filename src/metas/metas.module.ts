import { Module } from '@nestjs/common';
import { MetasService } from './metas.service';
import { MetasHandler } from './metas.handler';

@Module({
  providers: [MetasService],
  controllers: [MetasHandler],
})
export class MetasModule {}
