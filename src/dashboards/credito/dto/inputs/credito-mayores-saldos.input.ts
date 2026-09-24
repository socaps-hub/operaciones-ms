import { IsUUID } from 'class-validator';

export class CreditoMayoresSaldosInput {
  @IsUUID()
  cooperativaId: string;
}
