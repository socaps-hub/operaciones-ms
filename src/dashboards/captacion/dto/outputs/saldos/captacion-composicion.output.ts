import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class CaptacionComposicionDetalleOutput {
  @Field(() => String)
  clasificacion: string;

  @Field(() => Float)
  saldo: number;

  @Field(() => Float)
  participacion: number;

  @Field(() => Int)
  numeroCuentas: number;
}

@ObjectType()
export class CaptacionComposicionMesOutput {
  @Field(() => Int)
  mes: number;

  @Field(() => Float, { nullable: true })
  saldo: number | null;

  @Field(() => Boolean)
  disponible: boolean;
}

@ObjectType()
export class CaptacionComposicionComportamientoOutput {
  @Field(() => String)
  clasificacion: string;

  @Field(() => [CaptacionComposicionMesOutput])
  meses: CaptacionComposicionMesOutput[];
}

@ObjectType()
export class CaptacionComposicionOutput {
  @Field(() => [CaptacionComposicionDetalleOutput])
  composicion: CaptacionComposicionDetalleOutput[];

  @Field(() => [CaptacionComposicionComportamientoOutput])
  comportamiento: CaptacionComposicionComportamientoOutput[];
}