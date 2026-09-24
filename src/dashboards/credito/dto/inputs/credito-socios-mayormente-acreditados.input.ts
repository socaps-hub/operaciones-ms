import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreditoSociosMayormenteAcreditadosInput {
  @IsUUID()
  cooperativaId: string;

  @IsOptional()
  @IsString()
  cag?: string;
}
