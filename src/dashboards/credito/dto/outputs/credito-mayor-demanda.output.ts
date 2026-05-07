import { Field, Float, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class CreditoMayorDemandaItemOutput {
  @Field(() => String)
  label: string;

  @Field(() => Float)
  monto: number;

  @Field(() => Float)
  participacionPorcentaje: number;
}

@ObjectType()
export class CreditoMayorDemandaOutput {
  @Field(() => CreditoMayorDemandaItemOutput)
  producto: CreditoMayorDemandaItemOutput;

  @Field(() => CreditoMayorDemandaItemOutput)
  tasa: CreditoMayorDemandaItemOutput;

  @Field(() => CreditoMayorDemandaItemOutput)
  finalidad: CreditoMayorDemandaItemOutput;

  @Field(() => CreditoMayorDemandaItemOutput)
  destinoAgro: CreditoMayorDemandaItemOutput;
}
