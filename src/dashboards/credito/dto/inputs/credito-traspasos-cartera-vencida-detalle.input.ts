import { CreditoCarteraSegmentoInput } from '../../common/dto/inputs/credito-cartera-segmento.input';
import { IsInt } from 'class-validator';

export class CreditoTraspasosCarteraVencidaDetalleInput extends CreditoCarteraSegmentoInput {
  @IsInt()
  page: number;

  @IsInt()
  pageSize: number;
}