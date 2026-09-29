import { IsUUID } from 'class-validator';

export class CreditoSociosMayormenteAcreditadosInput {
  @IsUUID()
  cooperativaId: string;
}
