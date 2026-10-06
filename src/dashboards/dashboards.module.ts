import { Module } from '@nestjs/common';
import { CreditoModule } from './credito/credito.module';
import { UsuariosAliasModule } from './usuarios-alias/usuarios-alias.module';
import { CaptacionModule } from './captacion/captacion.module';

@Module({
  imports: [CreditoModule, UsuariosAliasModule, CaptacionModule]
})
export class DashboardsModule {}
