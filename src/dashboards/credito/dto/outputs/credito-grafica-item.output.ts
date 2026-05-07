import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class CreditoGraficaItemOutput {
  /**
   * Sucursal, tipo, producto, tasa, finalidad, destino agro, etc.
   */
  @Field(() => String)
  label: string;

  @Field(() => Float)
  monto: number;

  @Field(() => Int)
  numeroPrestamos: number;

  @Field(() => Float)
  participacionPorcentaje: number;
}
