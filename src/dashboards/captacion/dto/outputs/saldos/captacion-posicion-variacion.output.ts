import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class CaptacionPosicionVariacionOutput {
  @Field(() => Int)
  mes: number;

  @Field(() => Float, { nullable: true })
  monto: number | null;

  @Field(() => Float, { nullable: true })
  porcentaje: number | null;

  @Field(() => Boolean)
  disponible: boolean;
}
