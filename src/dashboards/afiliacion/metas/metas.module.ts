import { Module } from '@nestjs/common';

import { ExcelModule } from '../../../common/excel/excel.module';

import { MetasAfiliacionService } from './metas-afiliacion.service';
import { MetasAfiliacionHandler } from './metas-afiliacion.handler';
import { NatsModule } from '../../../transports/nats.module';

@Module({
  imports: [ExcelModule, NatsModule],
  controllers: [MetasAfiliacionHandler],
  providers: [MetasAfiliacionService],
  exports: [MetasAfiliacionService],
})
export class MetasModule {}
