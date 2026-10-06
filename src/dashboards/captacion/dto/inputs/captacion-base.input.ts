import { Field, InputType } from '@nestjs/graphql';

import { IsOptional, IsString } from 'class-validator';

import { CaptacionPeriodoInput } from './captacion-periodo.input';

@InputType()
export class CaptacionBaseInput extends CaptacionPeriodoInput {
  @Field(() => String, {
    nullable: true,
  })
  @IsOptional()
  @IsString()
  oficina?: string;
}
