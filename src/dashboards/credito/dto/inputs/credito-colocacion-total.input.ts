import { Field, InputType, Int } from '@nestjs/graphql';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  CreditoEvaluacionEnum,
  CreditoInformeEnum,
} from '../../enums/credito-dashboard.enum';

@InputType()
export class CreditoColocacionTotalInput {
  @Field(() => String)
  @IsUUID()
  cooperativaId: string;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  @Max(12)
  periodoMes: number;

  @Field(() => Int)
  @IsInt()
  @Min(2000)
  periodoAnio: number;

  /**
   * Null o undefined significa todas las sucursales.
   */
  @Field(() => String, { nullable: true })
  @IsOptional()
  oficina?: string;

  @Field(() => CreditoEvaluacionEnum)
  @Type()
  evaluacion: CreditoEvaluacionEnum;

  @Field(() => CreditoInformeEnum)
  @Type()
  informe: CreditoInformeEnum;
}
