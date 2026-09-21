import { CreditoProductividadBaseInput } from './credito-productividad-base.input';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreditoProductividadEjecutivoInput extends CreditoProductividadBaseInput {
  @IsString()
  @IsNotEmpty()
  ejecutivo: string;
}
