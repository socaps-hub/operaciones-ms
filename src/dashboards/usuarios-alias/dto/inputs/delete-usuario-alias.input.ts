import { IsInt, IsUUID } from 'class-validator';

export class DeleteUsuarioAliasInput {
  @IsInt()
  id: number;

  @IsUUID()
  cooperativaId: string;
}
