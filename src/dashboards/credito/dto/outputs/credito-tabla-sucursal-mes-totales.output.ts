import { Field, Float, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class CreditoTablaSucursalMesTotalesOutput {
  @Field(() => Float)
  enero: number;

  @Field(() => Float)
  febrero: number;

  @Field(() => Float)
  marzo: number;

  @Field(() => Float)
  abril: number;

  @Field(() => Float)
  mayo: number;

  @Field(() => Float)
  junio: number;

  @Field(() => Float)
  julio: number;

  @Field(() => Float)
  agosto: number;

  @Field(() => Float)
  septiembre: number;

  @Field(() => Float)
  octubre: number;

  @Field(() => Float)
  noviembre: number;

  @Field(() => Float)
  diciembre: number;

  @Field(() => Float)
  total: number;
}
