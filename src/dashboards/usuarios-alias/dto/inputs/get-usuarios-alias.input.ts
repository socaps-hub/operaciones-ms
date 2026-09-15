import { IsUUID } from 'class-validator';

export class GetUsuariosAliasInput {
  @IsUUID()
  cooperativaId: string;
}
