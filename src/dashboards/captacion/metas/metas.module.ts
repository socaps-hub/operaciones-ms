import { Module } from '@nestjs/common';
import { MetasCaptacionService } from './metas-captacion.service';
import { NatsModule } from '../../../transports/nats.module';
import { ExcelModule } from '../../../common/excel/excel.module';
import { MetasCaptacionHandler } from './metas-captacion.handler';

@Module({
  imports: [NatsModule, ExcelModule],
  controllers: [MetasCaptacionHandler],
  providers: [MetasCaptacionService],
})
export class MetasModule {}
