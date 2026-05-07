import { Field, Float, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class CreditoTablaSucursalMesOutput {
  @Field()
  sucursalCodigo: string;

  @Field()
  sucursalNombre: string;

  @Field(() => Float)
  enero: number;

  @Field(() => Float)
  febrero: number;

  @Field(() => Float)
  marzo: number;

  @Field(() => Float)
  abril: number;

  @Field(() => Float)
  mayo: number;

  @Field(() => Float)
  junio: number;

  @Field(() => Float)
  julio: number;

  @Field(() => Float)
  agosto: number;

  @Field(() => Float)
  septiembre: number;

  @Field(() => Float)
  octubre: number;

  @Field(() => Float)
  noviembre: number;

  @Field(() => Float)
  diciembre: number;

  /**
   * Solo aplica visualmente para MENSUAL.
   * En ACUMULADO puede enviarse 0 o la suma de meses disponibles.
   */
  @Field(() => Float)
  total: number;
}
