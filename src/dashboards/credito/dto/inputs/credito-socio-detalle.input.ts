import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreditoSocioDetalleInput {
  @IsUUID()
  cooperativaId: string;

  @IsString()
  @IsNotEmpty()
  cag: string;
}
