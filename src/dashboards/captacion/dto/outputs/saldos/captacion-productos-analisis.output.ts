import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class CaptacionProductosResumenOutput {
  @Field(() => Float, { nullable: true })
  saldoTotal: number | null;

  @Field(() => Int, { nullable: true })
  numeroCuentas: number | null;

  @Field(() => Float, { nullable: true })
  participacionCaptacion: number | null;

  @Field(() => Boolean)
  disponible: boolean;
}

@ObjectType()
export class CaptacionProductoDistribucionOutput {
  @Field(() => String)
  producto: string;

  @Field(() => Float)
  saldo: number;

  @Field(() => Float)
  participacion: number;

  @Field(() => Int)
  numeroCuentas: number;
}

@ObjectType()
export class CaptacionProductoSeleccionadoOutput {
  @Field(() => String)
  producto: string;

  @Field(() => Float, { nullable: true })
  saldo: number | null;

  @Field(() => Float, { nullable: true })
  participacion: number | null;

  @Field(() => Boolean)
  disponible: boolean;
}

@ObjectType()
export class CaptacionProductoComportamientoMesOutput {
  @Field(() => Int)
  mes: number;

  @Field(() => Float, { nullable: true })
  saldo: number | null;

  @Field(() => Boolean)
  disponible: boolean;
}

@ObjectType()
export class CaptacionProductosAnalisisOutput {
  @Field(() => CaptacionProductosResumenOutput)
  resumen: CaptacionProductosResumenOutput;

  @Field(() => [CaptacionProductoDistribucionOutput])
  productos: CaptacionProductoDistribucionOutput[];

  @Field(() => CaptacionProductoSeleccionadoOutput)
  productoSeleccionado: CaptacionProductoSeleccionadoOutput;

  @Field(() => [CaptacionProductoComportamientoMesOutput])
  comportamientoProducto: CaptacionProductoComportamientoMesOutput[];
}
