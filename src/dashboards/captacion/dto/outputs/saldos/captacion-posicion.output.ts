import { Field, ObjectType } from '@nestjs/graphql';

import { CaptacionPosicionBalanceOutput } from './captacion-posicion-balance.output';
import { CaptacionPosicionClasificacionOutput } from './captacion-posicion-clasificacion.output';
import { CaptacionPosicionSucursalOutput } from './captacion-posicion-sucursal.output';
import { CaptacionPosicionComportamientoOutput } from './captacion-posicion-comportamiento.output';
import { CaptacionPosicionVariacionOutput } from './captacion-posicion-variacion.output';
import { CaptacionPosicionAportacionOutput } from './captacion-posicion-aportacion.output';

@ObjectType()
export class CaptacionPosicionOutput {
  @Field(() => CaptacionPosicionBalanceOutput)
  balance: CaptacionPosicionBalanceOutput;

  @Field(() => CaptacionPosicionAportacionOutput)
  aportacion: CaptacionPosicionAportacionOutput;

  @Field(() => [CaptacionPosicionClasificacionOutput])
  clasificaciones: CaptacionPosicionClasificacionOutput[];

  @Field(() => [CaptacionPosicionSucursalOutput])
  sucursales: CaptacionPosicionSucursalOutput[];

  @Field(() => [CaptacionPosicionComportamientoOutput])
  comportamiento: CaptacionPosicionComportamientoOutput[];

  @Field(() => [CaptacionPosicionVariacionOutput])
  variaciones: CaptacionPosicionVariacionOutput[];
}
