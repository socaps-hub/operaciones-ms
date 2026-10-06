import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString } from 'class-validator';

import { CaptacionBaseInput } from './captacion-base.input';

@InputType()
export class CaptacionProductoInput extends CaptacionBaseInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  producto: string;
}
