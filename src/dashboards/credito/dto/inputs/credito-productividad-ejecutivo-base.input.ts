import { IsNotEmpty, IsString } from 'class-validator';

import { CreditoProductividadBaseInput } from './credito-productividad-base.input';

export class CreditoProductividadEjecutivoBaseInput extends CreditoProductividadBaseInput {
  @IsString()
  @IsNotEmpty()
  ejecutivo: string;
}
