import { Module } from '@nestjs/common';
import { UsuariosAliasService } from './usuarios-alias.service';
import { UsuariosAliasResolver } from './usuarios-alias.resolver';
import { UsuariosAliasHandler } from './usuarios-alias.handler';
import { NatsModule } from '../../transports/nats.module';

@Module({
  imports: [NatsModule],
  providers: [UsuariosAliasResolver, UsuariosAliasService],
  controllers: [UsuariosAliasHandler]
})
export class UsuariosAliasModule {}
