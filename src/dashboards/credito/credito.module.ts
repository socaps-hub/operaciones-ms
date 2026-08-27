import { Module } from '@nestjs/common';
import { CreditoService } from './credito.service';
import { CreditoResolver } from './credito.resolver';
import { CreditoHandler } from './credito.handler';
import { MetasModule } from './metas/metas.module';

@Module({
  providers: [CreditoResolver, CreditoService],
  controllers: [CreditoHandler],
  imports: [MetasModule]
})
export class CreditoModule {}
