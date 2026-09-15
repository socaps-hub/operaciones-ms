import { Resolver } from '@nestjs/graphql';
import { UsuariosAliasService } from './usuarios-alias.service';

@Resolver()
export class UsuariosAliasResolver {
  constructor(private readonly usuariosAliasService: UsuariosAliasService) {}
}
