import { IsString, IsUUID } from 'class-validator';

export class CreateUsuarioAliasInput {
  @IsUUID()
  cooperativaId: string;

  @IsString()
  codigoLogico: string;

  @IsString()
  r12Ni: string;
}
