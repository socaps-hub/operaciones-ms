import { Field, Float, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class CaptacionPosicionSucursalOutput {
  @Field(() => String)
  oficinaNumero: string;

  @Field(() => String)
  oficinaNombre: string;

  @Field(() => Float)
  saldo: number;

  @Field(() => Float)
  participacion: number;
}
