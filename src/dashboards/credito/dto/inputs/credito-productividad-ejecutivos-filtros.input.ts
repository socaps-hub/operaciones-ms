import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreditoProductividadEjecutivosFiltrosInput {
  @IsUUID()
  cooperativaId: string;

  @IsOptional()
  @IsString()
  oficina?: string;
}
