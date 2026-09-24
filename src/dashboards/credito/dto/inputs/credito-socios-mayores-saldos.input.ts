import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreditoSociosMayoresSaldosInput {
  @IsUUID()
  cooperativaId: string;

  @IsOptional()
  @IsString()
  cag?: string;
}
