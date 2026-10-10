import { Module } from '@nestjs/common';
import { AfiliacionService } from './afiliacion.service';
import { AfiliacionResolver } from './afiliacion.resolver';
import { MetasModule } from './metas/metas.module';

@Module({
  providers: [AfiliacionResolver, AfiliacionService],
  imports: [MetasModule],
})
export class AfiliacionModule {}
