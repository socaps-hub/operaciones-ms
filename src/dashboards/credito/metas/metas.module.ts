import { Module } from '@nestjs/common';
import { MetasService } from './metas.service';
import { MetasHandler } from './metas.handler';
import { ExcelModule } from '../../../common/excel/excel.module';
import { NatsModule } from '../../../transports/nats.module';

@Module({
  imports: [
    NatsModule,
    ExcelModule
  ],
  providers: [MetasService],
  controllers: [MetasHandler],
})
export class MetasModule {}
