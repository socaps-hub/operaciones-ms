import { Module } from '@nestjs/common';
import { CreditoModule } from './credito/credito.module';

@Module({
  imports: [CreditoModule]
})
export class DashboardsModule {}
