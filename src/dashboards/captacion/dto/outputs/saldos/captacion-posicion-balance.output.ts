import { Field, Float, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class CaptacionPosicionBalanceOutput {
  @Field(() => Float, { nullable: true })
  saldoInicial: number | null;

  @Field(() => Float, { nullable: true })
  saldoCierre: number | null;

  @Field(() => Float, { nullable: true })
  variacionMonto: number | null;

  @Field(() => Float, { nullable: true })
  variacionPorcentaje: number | null;

  @Field(() => Boolean)
  disponible: boolean;
}
