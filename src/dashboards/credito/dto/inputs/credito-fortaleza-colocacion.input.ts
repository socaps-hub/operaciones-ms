import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export enum CreditoFortalezaEnfoque {
  MENSUAL = 'MENSUAL',
  ACUMULADO = 'ACUMULADO',
}

export class CreditoFortalezaColocacionInput {
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

  @IsEnum(CreditoFortalezaEnfoque)
  enfoque: CreditoFortalezaEnfoque;
}
