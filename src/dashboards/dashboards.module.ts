import { Module } from '@nestjs/common';
import { CreditoModule } from './credito/credito.module';
import { UsuariosAliasModule } from './usuarios-alias/usuarios-alias.module';
import { CaptacionModule } from './captacion/captacion.module';
import { AfiliacionModule } from './afiliacion/afiliacion.module';

@Module({
  imports: [CreditoModule, UsuariosAliasModule, CaptacionModule, AfiliacionModule]
})
export class DashboardsModule {}
