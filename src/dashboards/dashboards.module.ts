import { Module } from '@nestjs/common';
import { CreditoModule } from './credito/credito.module';
import { UsuariosAliasModule } from './usuarios-alias/usuarios-alias.module';

@Module({
  imports: [CreditoModule, UsuariosAliasModule]
})
export class DashboardsModule {}
