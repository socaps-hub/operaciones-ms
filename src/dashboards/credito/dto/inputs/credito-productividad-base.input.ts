import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class CreditoProductividadBaseInput {
  @IsUUID()
  cooperativaId: string;

  @IsOptional()
  @IsString()
  oficina?: string;

  @IsInt()
  @Min(1)
  @Max(12)
  periodoMes: number;

  @IsInt()
  periodoAnio: number;
}
