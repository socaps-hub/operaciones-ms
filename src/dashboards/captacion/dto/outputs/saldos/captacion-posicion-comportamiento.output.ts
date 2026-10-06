import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class CaptacionPosicionComportamientoOutput {
  @Field(() => Int)
  mes: number;

  @Field(() => Float, { nullable: true })
  saldo: number | null;

  @Field(() => Boolean)
  disponible: boolean;
}
