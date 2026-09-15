import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class GetUsuariosLogicosCandidatosInput {
  @IsUUID()
  cooperativaId: string;

  @IsString()
  @IsNotEmpty()
  r12Ni: string;
}
