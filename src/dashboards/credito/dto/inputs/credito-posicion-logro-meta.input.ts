import { IsInt, IsUUID, Max, Min } from 'class-validator';

export class CreditoPosicionLogroMetaInput {
  @IsUUID()
  cooperativaId: string;

  @IsInt()
  @Min(1)
  @Max(12)
  periodoMes: number;

  @IsInt()
  @Min(2000)
  periodoAnio: number;
}
