import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreditoPersonasRelacionadasInput {
  @IsUUID()
  cooperativaId: string;

  @IsOptional()
  @IsString()
  @IsIn(['2', '3', '4', '6', '7'])
  tipoRelacion?: string;
}

export class CreditoPersonasRelacionadasCreditosInput extends CreditoPersonasRelacionadasInput {
  @IsInt()
  @Min(1)
  page: number;

  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number;
}