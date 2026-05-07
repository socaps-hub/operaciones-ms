import { Module } from '@nestjs/common';
import { CreditoService } from './credito.service';
import { CreditoResolver } from './credito.resolver';
import { CreditoHandler } from './credito.handler';

@Module({
  providers: [CreditoResolver, CreditoService],
  controllers: [CreditoHandler]
})
export class CreditoModule {}
