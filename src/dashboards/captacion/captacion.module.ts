import { Module } from '@nestjs/common';
import { CaptacionService } from './captacion.service';
import { CaptacionResolver } from './captacion.resolver';
import { CaptacionHandler } from './captacion.handler';

@Module({
  providers: [CaptacionResolver, CaptacionService],
  controllers: [CaptacionHandler],
})
export class CaptacionModule {}
