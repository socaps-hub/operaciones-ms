import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class CaptacionTablaSaldoMesOutput {
  @Field(() => Int)
  mes: number;

  @Field(() => Float, { nullable: true })
  saldo: number | null;

  @Field(() => Boolean)
  disponible: boolean;
}

@ObjectType()
export class CaptacionTablaSucursalOutput {
  @Field(() => String)
  oficinaNombre: string;

  @Field(() => String)
  oficinaNumero: string;

  @Field(() => [CaptacionTablaSaldoMesOutput])
  meses: CaptacionTablaSaldoMesOutput[];
}

@ObjectType()
export class CaptacionTablaSaldosOutput {
  @Field(() => [CaptacionTablaSucursalOutput])
  sucursales: CaptacionTablaSucursalOutput[];

  @Field(() => [CaptacionTablaSaldoMesOutput])
  totalCooperativa: CaptacionTablaSaldoMesOutput[];
}
