import { IsUUID } from 'class-validator';

export class CreditoSociosMayoresSaldosInput {
  @IsUUID()
  cooperativaId: string;
}
