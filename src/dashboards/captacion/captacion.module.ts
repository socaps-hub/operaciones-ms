import { Module } from '@nestjs/common';
import { CaptacionService } from './captacion.service';
import { CaptacionResolver } from './captacion.resolver';
import { CaptacionHandler } from './captacion.handler';
import { MetasModule } from './metas/metas.module';

@Module({
  providers: [CaptacionResolver, CaptacionService],
  controllers: [CaptacionHandler],
  imports: [MetasModule],
})
export class CaptacionModule {}
