import { Field, Float, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class CaptacionPosicionAportacionOutput {
  @Field(() => String)
  nombre: string;

  @Field(() => Float)
  saldo: number;

  @Field(() => Float)
  porcentaje: number;
}
