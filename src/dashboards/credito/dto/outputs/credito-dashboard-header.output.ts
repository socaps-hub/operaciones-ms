import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import {
  CreditoEvaluacionEnum,
  CreditoInformeEnum,
} from '../../enums/credito-dashboard.enum';

@ObjectType()
export class CreditoDashboardHeaderOutput {
  @Field(() => String)
  oficinaConsultada: string;

  @Field(() => CreditoEvaluacionEnum)
  cifrasPor: CreditoEvaluacionEnum;

  @Field(() => CreditoInformeEnum)
  informe: CreditoInformeEnum;

  @Field(() => Float)
  capitalDesembolsado: number;

  @Field(() => Int)
  numeroPrestamos: number;

  /**
   * Participación del segmento consultado contra el total de la cooperativa.
   */
  @Field(() => Float)
  participacionPorcentaje: number;
}
