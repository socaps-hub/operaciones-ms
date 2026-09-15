import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import {
  CreditoRentabilidadIdentificador,
  CreditoRentabilidadModo,
} from '../../enums/credito-rentabilidad.enum';

export class CreditoRentabilidadInput {
  @IsUUID()
  cooperativaId: string;

  @IsInt()
  @Min(1)
  @Max(12)
  periodoMes: number;

  @IsInt()
  @Min(2000)
  periodoAnio: number;

  @IsEnum(CreditoRentabilidadModo)
  modo: CreditoRentabilidadModo;

  @IsOptional()
  @IsString()
  oficina?: string;

  @IsEnum(CreditoRentabilidadIdentificador)
  identificador: CreditoRentabilidadIdentificador;

  @IsInt()
  @Min(1)
  page: number;

  @IsInt()
  @Min(1)
  @Max(50)
  pageSize: number;
}
