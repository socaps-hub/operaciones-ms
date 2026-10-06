import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class CaptacionPosicionClasificacionOutput {
  @Field(() => String)
  clasificacion: string;

  @Field(() => Float)
  saldo: number;

  @Field(() => Float)
  participacion: number;

  @Field(() => Int)
  numeroCuentas: number;
}
