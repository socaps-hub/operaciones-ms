import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class CreditoMedicionTrimestralInput {
  @IsUUID()
  cooperativaId: string;

  @IsInt()
  @Min(1)
  @Max(12)
  periodoMes: number;

  @IsInt()
  @Min(2000)
  periodoAnio: number;

  @IsOptional()
  @IsString()
  oficina?: string;
}
