import { IsInt, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class UpdateUsuarioAliasInput {
  @IsInt()
  id: number;

  @IsUUID()
  cooperativaId: string;

  @IsString()
  @IsNotEmpty()
  codigoLogico: string;
}
